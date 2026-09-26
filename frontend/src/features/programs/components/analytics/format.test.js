import { describe, expect, test } from "vitest";

import { formatBucket } from "./format";

describe("formatBucket", () => {
    test("labels a clipped first week as partial", () => {
        expect(formatBucket("2026-06-30", "week", true, true)).toBe(
            "Partial week from Jun 30, 2026",
        );
        expect(formatBucket("2026-07-06", "week", true)).toBe(
            "Week of Jul 6, 2026",
        );
        expect(formatBucket("2026-07-06", "week")).toBe("Jul 6");
    });
});
