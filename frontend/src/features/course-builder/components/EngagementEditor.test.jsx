import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import EngagementEditor from "./EngagementEditor";

const policy = {
    assignmentRemindersEnabled: true,
    assignmentOffsets: [7, 1, -1],
    expiryRemindersEnabled: true,
    expiryOffsets: [7, 1],
    inactivityRemindersEnabled: true,
    inactivityOffsets: [7, 30],
};

describe("EngagementEditor", () => {
    it("updates reminder switches and course opt-in", () => {
        const onPolicyChange = vi.fn();
        const onGamificationOptInChange = vi.fn();
        render(
            <EngagementEditor
                policy={policy}
                onPolicyChange={onPolicyChange}
                gamificationOptIn={false}
                onGamificationOptInChange={onGamificationOptInChange}
                platformGamificationEnabled
                deliveryMode="blended"
            />,
        );

        fireEvent.click(screen.getByLabelText("Assignment reminders"));
        fireEvent.click(
            screen.getByLabelText("Enable XP, badges and streaks for this course"),
        );

        expect(onPolicyChange).toHaveBeenCalledWith({
            ...policy,
            assignmentRemindersEnabled: false,
        });
        expect(onGamificationOptInChange).toHaveBeenCalledWith(true);
    });

    it("locks opt-in for automatically eligible delivery modes", () => {
        render(
            <EngagementEditor
                policy={policy}
                onPolicyChange={vi.fn()}
                gamificationOptIn
                onGamificationOptInChange={vi.fn()}
                platformGamificationEnabled
                deliveryMode="self_paced"
            />,
        );
        expect(
            screen.getByLabelText("Enable XP, badges and streaks for this course"),
        ).toBeDisabled();
    });
});
