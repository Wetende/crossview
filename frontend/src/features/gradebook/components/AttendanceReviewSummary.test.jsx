import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { workspaceApi } from "@/features/google-workspace/api/workspaceApi";
import AttendanceReviewSummary from "./AttendanceReviewSummary";

vi.mock("@/features/google-workspace/api/workspaceApi", () => ({
    workspaceApi: { attendanceSessions: vi.fn() },
}));

describe("AttendanceReviewSummary", () => {
    beforeEach(() => vi.clearAllMocks());

    test("keeps the dashboard to one review summary", async () => {
        workspaceApi.attendanceSessions.mockResolvedValue({
            results: [
                {
                    courseId: 4,
                    nodeId: 63,
                    attendanceCounts: { needsReview: 2 },
                    unmatchedAttendanceCount: 1,
                },
            ],
        });

        render(<AttendanceReviewSummary />);

        expect(
            await screen.findByText("3 attendance records need review."),
        ).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Review" })).toHaveAttribute(
            "href",
            "/instructor/programs/4/gradebook/?view=attendance&session=63",
        );
    });
});
