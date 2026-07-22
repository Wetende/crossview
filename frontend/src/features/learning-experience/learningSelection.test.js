import { describe, expect, test } from "vitest";

import { sortLearningPriority } from "./learningSelection";

describe("sortLearningPriority", () => {
    test("prefers recent learning activity, then established progress", () => {
        const ordered = sortLearningPriority([
            { id: 1, progressPercent: 75, enrolledAt: "2026-01-01" },
            { id: 2, progressPercent: 20, lastActivity: "2026-07-01" },
            { id: 3, progressPercent: 100, lastActivity: "2026-07-20" },
        ]);

        expect(ordered.map((item) => item.id)).toEqual([2, 1, 3]);
    });
});
