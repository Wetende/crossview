import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { router } from "@inertiajs/react";

import Whiteboard from "./Whiteboard";

vi.mock("@inertiajs/react", () => ({
    router: { post: vi.fn(), visit: vi.fn() },
}));

const { stub } = vi.hoisted(() => ({
    stub: (name) => ({ default: () => <div data-testid={name} /> }),
}));
vi.mock("../Renderers/BlockRenderer", () => stub("block"));
vi.mock("../Renderers/VideoRenderer", () => ({
    default: ({ requiredProgress }) => (
        <div data-testid="video" data-required-progress={requiredProgress} />
    ),
}));
vi.mock("../Renderers/TextRenderer", () => stub("text"));
vi.mock("../Renderers/AssessmentRenderer", () => stub("assessment"));
vi.mock("../Renderers/DocumentLessonRenderer", () => stub("document"));
vi.mock("../Renderers/ScheduledSessionRenderer", () => stub("scheduled"));
vi.mock("../Renderers/CodeLabRenderer", () => stub("code"));
vi.mock("../Renderers/AudioRenderer", () => stub("audio"));
vi.mock("../Renderers/QuizResultsRenderer", () => ({
    default: ({ courseCompleteUrl }) => (
        <div data-testid="quiz-results">{courseCompleteUrl || "no summary"}</div>
    ),
}));

const node = {
    id: 5,
    title: "Deployment models",
    activityType: "text",
    properties: { content: "<p>Body</p>" },
    blocks: [],
};
const nextNode = { id: 6, title: "Release strategies" };
const summaryUrl = "/student/programs/9/complete/";

const renderWhiteboard = (props = {}) =>
    render(
        <Whiteboard
            node={node}
            prevNode={null}
            nextNode={nextNode}
            courseId={9}
            isCompleted={false}
            {...props}
        />,
    );

const completeAndNext = () => {
    renderWhiteboard();
    fireEvent.click(screen.getByRole("button", { name: "Complete & Next" }));
    return router.post.mock.calls[0];
};

const completeLastLesson = () => {
    renderWhiteboard({ nextNode: null });
    fireEvent.click(screen.getByRole("button", { name: "Mark complete" }));
    return router.post.mock.calls[0];
};

describe("Whiteboard completion", () => {
    beforeEach(() => {
        router.post.mockReset();
        router.visit.mockReset();
    });

    test("marks the lesson complete, refreshes navigation, then opens the next lesson", () => {
        const [url, data, options] = completeAndNext();

        expect(url).toBe("/student/programs/9/session/5/");
        expect(data).toEqual({ mark_complete: true });
        expect(options.only).toEqual([
            "isCompleted",
            "curriculum",
            "enrollment",
            "nextNode",
            "prevNode",
            "courseCompleteUrl",
        ]);

        options.onSuccess({
            props: { isCompleted: true, nextNode, courseCompleteUrl: null },
        });
        expect(router.visit).toHaveBeenCalledWith(
            "/student/programs/9/session/6/",
        );
    });

    test("still opens the requested lesson when the server refuses completion", () => {
        const [, , options] = completeAndNext();

        // Server-side locks still gate access to the destination.
        options.onSuccess({ props: { isCompleted: false, nextNode: null } });
        expect(router.visit).toHaveBeenCalledWith(
            "/student/programs/9/session/6/",
        );
    });

    test("ignores repeat clicks while completion is in flight", () => {
        const [, , options] = completeAndNext();

        fireEvent.click(screen.getByRole("button", { name: "Complete & Next" }));
        expect(router.post).toHaveBeenCalledTimes(1);

        options.onFinish();
        fireEvent.click(screen.getByRole("button", { name: "Complete & Next" }));
        expect(router.post).toHaveBeenCalledTimes(2);
    });

    test("prefers the course summary over the next lesson when the course is finished", () => {
        const [, , options] = completeAndNext();

        options.onSuccess({
            props: { isCompleted: true, nextNode, courseCompleteUrl: summaryUrl },
        });

        expect(router.visit).toHaveBeenCalledTimes(1);
        expect(router.visit).toHaveBeenCalledWith(summaryUrl);
    });

    test("opens the course summary when the last lesson completes the course", () => {
        const [, , options] = completeLastLesson();

        options.onSuccess({ props: { courseCompleteUrl: summaryUrl } });

        expect(router.visit).toHaveBeenCalledTimes(1);
        expect(router.visit).toHaveBeenCalledWith(summaryUrl);
    });

    test("stays on the last lesson when the course is not yet complete", () => {
        const [, , options] = completeLastLesson();

        options.onSuccess({ props: { courseCompleteUrl: null } });

        expect(router.visit).not.toHaveBeenCalled();
    });

    test("offers the summary from the footer once the course is complete", () => {
        renderWhiteboard({
            nextNode: null,
            isCompleted: true,
            courseSummaryUrl: summaryUrl,
        });

        fireEvent.click(
            screen.getByRole("button", { name: "View course summary" }),
        );

        expect(router.visit).toHaveBeenCalledWith(summaryUrl);
        expect(router.post).not.toHaveBeenCalled();
    });

    test("passes the course summary URL to quiz results", () => {
        renderWhiteboard({
            node: {
                ...node,
                activityType: "quiz",
                properties: {
                    lesson_type: "quiz",
                    quiz_id: 3,
                    quizResults: { quiz: { id: 3 } },
                },
            },
            courseCompleteUrl: summaryUrl,
        });

        expect(screen.getByTestId("quiz-results")).toHaveTextContent(summaryUrl);
    });
});

describe("Whiteboard read-only preview", () => {
    const previewNext = {
        id: 13,
        title: "Course tour",
        url: "/programs/preview-course/preview/13/",
    };

    beforeEach(() => {
        router.post.mockReset();
        router.visit.mockReset();
    });

    test("shows the lesson without completion and navigates by preview URL", () => {
        renderWhiteboard({
            courseId: undefined,
            nextNode: previewNext,
            readOnly: true,
        });

        expect(screen.getByTestId("text")).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: /complete/i }),
        ).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

        fireEvent.click(screen.getByRole("button", { name: "Next" }));

        expect(router.visit).toHaveBeenCalledWith(
            "/programs/preview-course/preview/13/",
        );
        expect(router.post).not.toHaveBeenCalled();
    });

    test("disables Next on the last preview lesson", () => {
        renderWhiteboard({ courseId: undefined, nextNode: null, readOnly: true });

        expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
        expect(
            screen.queryByRole("button", { name: /complete|summary/i }),
        ).not.toBeInTheDocument();
    });

    test("drops the viewing requirement from a read-only video lesson", () => {
        renderWhiteboard({
            courseId: undefined,
            nextNode: previewNext,
            readOnly: true,
            node: {
                ...node,
                activityType: "video",
                properties: {
                    lesson_type: "video",
                    video_url: "https://www.youtube.com/watch?v=abc123",
                },
                completionPolicy: {
                    kind: "active_time_percentage",
                    requiredPercent: 90,
                    automatic: true,
                },
            },
        });

        expect(screen.getByTestId("video")).toHaveAttribute(
            "data-required-progress",
            "0",
        );
    });
});
