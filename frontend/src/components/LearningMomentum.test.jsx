import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LearningMomentum from "./LearningMomentum";

describe("LearningMomentum", () => {
    it("shows XP, streak and earned badges", () => {
        render(
            <LearningMomentum
                gamification={{
                    enabled: true,
                    xp: 155,
                    streak: { currentDays: 7, longestDays: 10 },
                    badges: [
                        {
                            code: "first-lesson",
                            name: "First lesson",
                            description: "Completed a lesson.",
                        },
                    ],
                }}
            />,
        );

        expect(screen.getByText("155 XP")).toBeInTheDocument();
        expect(screen.getByText("7 day streak")).toBeInTheDocument();
        expect(screen.getByText("First lesson")).toBeInTheDocument();
    });

    it("renders nothing for an ineligible course", () => {
        const { container } = render(
            <LearningMomentum gamification={{ enabled: false }} />,
        );
        expect(container).toBeEmptyDOMElement();
    });
});
