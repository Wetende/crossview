import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PlayerSupportStrip from "./PlayerSupportStrip";

describe("PlayerSupportStrip", () => {
    it("keeps momentum and Classroom details compact and actionable", () => {
        render(
            <PlayerSupportStrip
                gamification={{
                    enabled: true,
                    xp: 120,
                    streak: { currentDays: 7 },
                    badges: [{ code: "starter" }],
                }}
                classroom={{
                    connected: true,
                    membershipStatus: "not_joined",
                    classCode: "JOIN42",
                    alternateLink: "https://classroom.google.com/c/course-1",
                }}
            />,
        );

        expect(screen.getByText("120 XP")).toBeInTheDocument();
        expect(screen.getByText("7 day streak")).toBeInTheDocument();
        expect(screen.getByText("Classroom: not joined")).toBeInTheDocument();
        expect(screen.getByText("Class code: JOIN42")).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: /Google Classroom/ }),
        ).toHaveAttribute("href", "https://classroom.google.com/c/course-1");
    });
});
