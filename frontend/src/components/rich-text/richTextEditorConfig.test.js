import { describe, expect, test } from "vitest";

import {
    DEFAULT_RICH_TEXT_FONT_SIZE,
    LMS_RICH_TEXT_FONT_FAMILY,
    RICH_TEXT_FONT_OPTIONS,
    getAdjacentFontSize,
    normalizeImageSource,
    normalizeLinkUrl,
    richTextContentSx,
} from "./richTextEditorConfig";

describe("rich text editor configuration", () => {
    test("uses an LMS-specific education font independent of website config", () => {
        expect(LMS_RICH_TEXT_FONT_FAMILY).toContain("Albert Sans");
        expect(RICH_TEXT_FONT_OPTIONS[0]).toMatchObject({
            label: "Default — Albert Sans",
            value: "",
        });
        expect(richTextContentSx).toMatchObject({
            fontFamily: LMS_RICH_TEXT_FONT_FAMILY,
            fontSize: "1rem",
            lineHeight: 1.75,
        });
    });

    test("moves through the bounded font-size scale", () => {
        expect(getAdjacentFontSize(DEFAULT_RICH_TEXT_FONT_SIZE, -1)).toBe(14);
        expect(getAdjacentFontSize(DEFAULT_RICH_TEXT_FONT_SIZE, 1)).toBe(18);
        expect(getAdjacentFontSize(12, -1)).toBe(12);
        expect(getAdjacentFontSize(32, 1)).toBe(32);
    });

    test("normalizes safe links and rejects executable protocols", () => {
        expect(normalizeLinkUrl("example.com/course")).toBe(
            "https://example.com/course",
        );
        expect(normalizeLinkUrl("/courses/1")).toBe("/courses/1");
        expect(normalizeLinkUrl("mailto:teacher@example.com")).toBe(
            "mailto:teacher@example.com",
        );
        expect(normalizeLinkUrl("javascript:alert(1)")).toBeNull();
    });

    test("allows supported image sources only", () => {
        expect(normalizeImageSource("https://cdn.example.com/chart.png")).toBe(
            "https://cdn.example.com/chart.png",
        );
        expect(normalizeImageSource("/media/chart.png")).toBe(
            "/media/chart.png",
        );
        expect(normalizeImageSource("javascript:alert(1)")).toBeNull();
        expect(
            normalizeImageSource("data:text/html;base64,PHNjcmlwdD4="),
        ).toBeNull();
    });
});
