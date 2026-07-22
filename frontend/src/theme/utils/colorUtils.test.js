import { describe, expect, test } from "vitest";

import { generatePaletteFromColor, getContrastText } from "./colorUtils";

describe("brand color palette generation", () => {
    test("uses accessible dark text on bright brand colours", () => {
        expect(getContrastText("#22C55E")).toBe("#0F172A");
        expect(getContrastText("#166534")).toBe("#FFFFFF");
    });

    test("brightens the primary brand colour for dark surfaces", () => {
        const palette = generatePaletteFromColor("#166534", "dark");

        expect(palette.main).not.toBe("#166534");
        expect(palette.contrastText).toBe("#0F172A");
        expect(palette.lighter).not.toBe(palette.main);
    });
});
