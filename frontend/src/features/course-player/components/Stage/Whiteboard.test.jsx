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
vi.mock("../Renderers/VideoRenderer", () => stub("video"));
vi.mock("../Renderers/TextRenderer", () => stub("text"));
vi.mock("../Renderers/AssessmentRenderer", () => stub("assessment"));
vi.mock("../Renderers/DocumentLessonRenderer", () => stub("document"));
vi.mock("../Renderers/ScheduledSessionRenderer", () => stub("scheduled"));
vi.mock("../Renderers/CodeLabRenderer", () => stub("code"));
vi.mock("../Renderers/AudioRenderer", () => stub("audio"));
vi.mock("../Renderers/QuizResultsRenderer", () => stub("quiz-results"));

const node = {
    id: 5,
    title: "Deployment models",
    activityType: "text",
    properties: { content: "<p>Body</p>" },
    blocks: [],
};
const nextNode = { id: 6, title: "Release strategies" };

const completeAndNext = () => {
    render(
        <Whiteboard
            node={node}
            prevNode={null}
            nextNode={nextNode}
            courseId={9}
            isCompleted={false}
        />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Complete & Next" }));
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
        ]);

        options.onSuccess({ props: { isCompleted: true, nextNode } });
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
});
