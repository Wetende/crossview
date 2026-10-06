import { describe, expect, test } from "vitest";

import palette from "./palette";

describe("dark palette", () => {
    test("uses neutral charcoal surfaces, borders and text", () => {
        const dark = palette("dark");

        expect(dark.background).toEqual({
            default: "#101828",
            paper: "#1E2939",
        });
        expect(dark.divider).toBe("#364153");
        expect(dark.text).toEqual({
            primary: "#E5E7EB",
            secondary: "#99A1AF",
        });
        expect(dark.grey[50]).toBe("#101828");
        expect(dark.grey[900]).toBe("#F9FAFB");
    });

    test("keeps selected surfaces neutral with or without brand colours", () => {
        expect(palette("dark").primary.lighter).toBe("#364153");
        expect(palette("dark").secondary.lighter).toBe("#364153");
        expect(
            palette("dark", { primaryColor: "#3B82F6" }).primary.lighter,
        ).toBe("#364153");
    });

    test("leaves the light palette unchanged", () => {
        expect(palette("light").background.default).not.toBe("#101828");
    });
});
