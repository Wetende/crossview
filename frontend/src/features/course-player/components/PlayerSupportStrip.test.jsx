import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PlayerSupportStrip from "./PlayerSupportStrip";

describe("PlayerSupportStrip", () => {
    it("keeps learner momentum compact and actionable", () => {
        render(
            <PlayerSupportStrip
                gamification={{
                    enabled: true,
                    xp: 120,
                    streak: { currentDays: 7 },
                    badges: [{ code: "starter" }],
                }}
            />,
        );

        expect(screen.getByText("120 XP")).toBeInTheDocument();
        expect(screen.getByText("7 day streak")).toBeInTheDocument();
    });
});
