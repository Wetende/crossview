import { describe, expect, test } from "vitest";

import { getLearnerActions } from "./learnerActions";

describe("contextual learner actions", () => {
    test.each([
        [
            "active learner needing attention",
            { status: "active", learnerState: "stalled" },
            ["view", "message", "reminder", "suspend", "withdraw"],
        ],
        [
            "active learner without attention",
            { status: "active", learnerState: "active" },
            ["view", "message", "suspend", "withdraw"],
        ],
        [
            "suspended learner",
            { status: "suspended", learnerState: "suspended" },
            ["view", "message", "restore", "withdraw"],
        ],
        [
            "withdrawn learner",
            { status: "withdrawn", learnerState: "withdrawn" },
            ["view", "message", "restore"],
        ],
        [
            "completed learner",
            { status: "completed", learnerState: "completed" },
            ["view", "message"],
        ],
    ])("shows only valid actions for a %s", (_, learner, expected) => {
        expect(getLearnerActions(learner, { remindersEnabled: true })).toEqual(
            expected,
        );
        expect(expected).not.toContain("activate");
    });
});
