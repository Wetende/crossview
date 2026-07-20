import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DeliveryOverviewCard from "./DeliveryOverviewCard";

describe("DeliveryOverviewCard", () => {
    it("prioritizes the next session for a live-online course", () => {
        render(
            <DeliveryOverviewCard
                program={{
                    deliveryMode: "live_online",
                    deliveryReadiness: { ready: true, warnings: [] },
                    nextScheduledSession: {
                        title: "Live workshop",
                        kind: "live_meeting",
                        provider: "google_meet",
                        startsAt: "2026-07-22T09:00:00Z",
                        lessonUrl: "/student/programs/4/session/9/",
                    },
                }}
                resumeUrl="/student/programs/4/resume/"
                hasStarted
            />,
        );

        expect(screen.getByText("Live online")).toBeInTheDocument();
        expect(screen.getByText("Live workshop")).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "View next session" }),
        ).toHaveAttribute("href", "/student/programs/4/session/9/");
        expect(
            screen.getByRole("link", { name: "Resume learning" }),
        ).toBeInTheDocument();
    });

    it("keeps resume learning primary for self-paced delivery", () => {
        render(
            <DeliveryOverviewCard
                program={{
                    deliveryMode: "self_paced",
                    deliveryReadiness: {
                        ready: false,
                        warnings: [
                            "This self-paced course includes scheduled attendance.",
                        ],
                    },
                }}
                resumeUrl="/student/programs/4/resume/"
                hasStarted={false}
            />,
        );

        expect(screen.getByText("Self-paced")).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "Start learning" }),
        ).toHaveAttribute("href", "/student/programs/4/resume/");
        expect(
            screen.getByText(
                "This self-paced course includes scheduled attendance.",
            ),
        ).toBeInTheDocument();
    });
});
