import { describe, expect, test } from "vitest";

import {
    formatActivityDuration,
    getActivitySummary,
    getActivityTypeLabel,
    normalizeActivityType,
} from "./activityTypes";

describe("activity types", () => {
    test.each([
        ["video_lesson", "video"],
        ["live_class", "live_meeting"],
        ["google_meet", "google_meet"],
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

    test.each([
        [{ activityType: "text" }, "Text lesson"],
        [{ properties: { lesson_type: "video_lesson" } }, "Video lesson"],
        [{ nodeType: "quiz" }, "Quiz"],
        [{ properties: { lesson_type: "live_class" } }, "Live class"],
        [{ nodeType: "Session" }, "Text lesson"],
    ])("labels %o as %s", (node, expected) => {
        expect(getActivityTypeLabel(node)).toBe(expected);
    });

    test("summarises the type with its duration or question count", () => {
        expect(
            getActivitySummary({ activityType: "video", properties: { duration: 9 } }),
        ).toBe("Video lesson · 9 min");
        expect(
            getActivitySummary({
                nodeType: "quiz",
                properties: { questions: [{}, {}, {}, {}, {}] },
            }),
        ).toBe("Quiz · 5 questions");
        expect(getActivitySummary({ activityType: "text" })).toBe("Text lesson");
    });
});
