import { describe, expect, test } from "vitest";

import { resolvePlayerComposition } from "./playerComposition";

describe("player composition", () => {
    test("keeps blocks as supplements when canonical primary content exists", () => {
        const blocks = [{ id: 1, type: "RICHTEXT", data: { content: "Notes" } }];

        const result = resolvePlayerComposition({
            activityType: "video",
            properties: { video_url: "https://video.example.test/lesson.mp4" },
            supplements: blocks,
        });

        expect(result.legacyPrimaryBlock).toBeNull();
        expect(result.supplements).toEqual(blocks);
    });

    test("uses one compatible legacy block as primary without hiding other blocks", () => {
        const result = resolvePlayerComposition({
            properties: { lesson_type: "video" },
            blocks: [
                { id: 1, type: "VIDEO", data: { url: "https://example.test/video" } },
                { id: 2, type: "RICHTEXT", data: { content: "Notes" } },
            ],
        });

        expect(result.legacyPrimaryBlock.id).toBe(1);
        expect(result.supplements.map((block) => block.id)).toEqual([2]);
    });
});
