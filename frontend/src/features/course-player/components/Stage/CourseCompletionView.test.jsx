import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import CourseCompletionView from "./CourseCompletionView";

const post = vi.fn();

vi.mock("@inertiajs/react", () => ({
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    router: { post: (...args) => post(...args) },
}));

const baseCompletion = {
    completedAt: "2026-09-20T10:00:00Z",
    stats: {
        lessonsCompleted: 12,
        totalLessons: 12,
        quizzesPassed: 3,
        timeSpentMinutes: 95,
    },
    certificate: {
        status: "issued",
        downloadUrl: "/certificates/download/signed-value/",
        verifyUrl: "/verify/LMS-2026-ABC123/",
        message: "Your certificate is ready to download and share.",
    },
    review: {
        canReview: true,
        hasReviewed: false,
        submitUrl: "/programs/4/review/",
    },
    nextCourses: [
        {
            id: 21,
            title: "Data Visualisation",
            slug: "data-visualisation",
            url: "/programs/data-visualisation/",
            thumbnailUrl: null,
            level: "Intermediate",
            durationHours: 8,
        },
    ],
    dashboardUrl: "/dashboard/",
};

const renderView = (overrides = {}) =>
    render(
        <CourseCompletionView
            program={{ id: 4, name: "Data Foundations" }}
            completion={{ ...baseCompletion, ...overrides }}
            returnUrl="/student/programs/9/complete/"
        />,
    );

describe("CourseCompletionView", () => {
    beforeEach(() => {
        post.mockClear();
    });

    test("celebrates the course with its title, date and stats", () => {
        renderView();

        expect(
            screen.getByRole("heading", { level: 1, name: /congratulations/i }),
        ).toBeInTheDocument();
        const completedOn = new Date(
            baseCompletion.completedAt,
        ).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        expect(
            screen.getByText(
                `You completed Data Foundations on ${completedOn}.`,
            ),
        ).toBeInTheDocument();
        expect(screen.getByText("12/12 lessons completed")).toBeInTheDocument();
        expect(screen.getByText("3 quizzes passed")).toBeInTheDocument();
        expect(
            screen.getByText("1 h 35 min tracked study time"),
        ).toBeInTheDocument();
    });

    test("omits the time chip when the server does not send it", () => {
        renderView({
            stats: { lessonsCompleted: 2, totalLessons: 2, quizzesPassed: 1 },
        });

        expect(screen.getByText("1 quiz passed")).toBeInTheDocument();
        expect(screen.queryByText(/tracked study time/)).not.toBeInTheDocument();
    });

    test("offers download and verification for an issued certificate", () => {
        renderView();

        const card = screen.getByRole("region", { name: "Certificate" });
        expect(
            within(card).getByRole("link", { name: /download certificate/i }),
        ).toHaveAttribute("href", "/certificates/download/signed-value/");
        expect(
            within(card).getByRole("link", { name: /verify certificate/i }),
        ).toHaveAttribute("href", "/verify/LMS-2026-ABC123/");
    });

    test.each([
        ["pending", "Your certificate is being prepared."],
        ["not_offered", "This course does not award a certificate."],
        ["ineligible", "A certificate needs a passing result."],
    ])("shows only the status message when the certificate is %s", (status, message) => {
        renderView({
            certificate: {
                status,
                downloadUrl: null,
                verifyUrl: null,
                message,
            },
        });

        const card = screen.getByRole("region", { name: "Certificate" });
        expect(within(card).getByText(message)).toBeInTheDocument();
        expect(within(card).queryByRole("link")).not.toBeInTheDocument();
    });

    test("posts a keyboard-selectable star rating and short review", () => {
        renderView();

        const group = screen.getByRole("radiogroup", { name: "Your rating" });
        const submit = screen.getByRole("button", { name: "Submit review" });
        expect(submit).toBeDisabled();

        fireEvent.click(within(group).getByRole("radio", { name: "4 stars" }));
        fireEvent.change(screen.getByLabelText(/your review/i), {
            target: { value: "Clear and practical." },
        });
        fireEvent.click(submit);

        expect(post).toHaveBeenCalledTimes(1);
        const [url, data, options] = post.mock.calls[0];
        expect(url).toBe("/programs/4/review/");
        expect(data).toEqual({
            rating: 4,
            review: "Clear and practical.",
            next: "/student/programs/9/complete/",
        });
        expect(options.preserveScroll).toBe(true);
    });

    test("explains that a rating is required before submitting", () => {
        renderView();

        const group = screen.getByRole("radiogroup", { name: "Your rating" });
        expect(group).toHaveAttribute("aria-required", "true");
        expect(group).toHaveAccessibleDescription(
            "Select a rating to submit your review.",
        );
        expect(screen.getByLabelText(/your review/i)).toHaveAttribute(
            "maxlength",
            "5000",
        );

        fireEvent.click(within(group).getByRole("radio", { name: "5 stars" }));

        expect(
            screen.queryByText("Select a rating to submit your review."),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Submit review" }),
        ).toBeEnabled();
    });

    test("keeps the draft review when the server rejects it", () => {
        const { rerender } = renderView();

        const group = screen.getByRole("radiogroup", { name: "Your rating" });
        fireEvent.click(within(group).getByRole("radio", { name: "3 stars" }));
        fireEvent.change(screen.getByLabelText(/your review/i), {
            target: { value: "Needs more examples." },
        });
        fireEvent.click(screen.getByRole("button", { name: "Submit review" }));

        const [, , options] = post.mock.calls[0];
        // router.post defaults to preserveState, so the component survives
        // the redirect back to the summary with an error flash.
        expect(options.preserveState).toBeUndefined();
        act(() => {
            options.onStart?.();
            options.onFinish?.();
        });
        rerender(
            <CourseCompletionView
                program={{ id: 4, name: "Data Foundations" }}
                completion={{ ...baseCompletion }}
                returnUrl="/student/programs/9/complete/"
            />,
        );

        expect(screen.getByLabelText(/your review/i)).toHaveValue(
            "Needs more examples.",
        );
        expect(
            within(
                screen.getByRole("radiogroup", { name: "Your rating" }),
            ).getByRole("radio", { name: "3 stars" }),
        ).toBeChecked();
    });

    test("thanks learners who already reviewed", () => {
        renderView({
            review: { ...baseCompletion.review, hasReviewed: true },
        });

        expect(screen.getByText("Thanks for your review")).toBeInTheDocument();
        expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    });

    test("hides the review card when reviews are unavailable", () => {
        renderView({
            review: { ...baseCompletion.review, canReview: false },
        });

        expect(
            screen.queryByRole("region", { name: "Leave a review" }),
        ).not.toBeInTheDocument();
        expect(screen.queryByText("Thanks for your review")).not.toBeInTheDocument();
    });

    test("suggests next courses and links back to the dashboard", () => {
        renderView();

        const section = screen.getByRole("region", {
            name: "Continue learning",
        });
        expect(
            within(section).getByRole("link", { name: /data visualisation/i }),
        ).toHaveAttribute("href", "/programs/data-visualisation/");
        expect(within(section).getByText("Intermediate · 8 hours")).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "Back to dashboard" }),
        ).toHaveAttribute("href", "/dashboard/");
    });

    test("leaves out the next-course section when there is nothing to suggest", () => {
        renderView({ nextCourses: [] });

        expect(
            screen.queryByRole("region", { name: "Continue learning" }),
        ).not.toBeInTheDocument();
    });
});
