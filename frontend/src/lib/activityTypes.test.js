import { describe, expect, test } from "vitest";

import {
    formatActivityDuration,
    normalizeActivityType,
} from "./activityTypes";

describe("activity types", () => {
    test.each([
        ["video_lesson", "video"],
        ["live_class", "live_meeting"],
        ["stream", "live_stream"],
        ["in_person_session", "in_person_session"],
    ])("normalizes %s to %s", (input, expected) => {
        expect(
            normalizeActivityType({ properties: { lesson_type: input } }),
        ).toBe(expected);
    });

    test("formats only numeric durations as minutes", () => {
        expect(formatActivityDuration(45)).toBe("45 min");
        expect(formatActivityDuration("45")).toBe("45 min");
        expect(formatActivityDuration("2h 45m")).toBe("2h 45m");
    });
});
