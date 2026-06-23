import { describe, expect, it } from "vitest";
import {
    getAvailableBuilderTabs,
    getBuilderTabUrl,
    normalizeBuilderTab,
} from "./builderTabs";

const baseProgram = {
    id: 42,
    blueprint: {
        featureFlags: {},
    },
};

describe("builderTabs", () => {
    it("normalizes unsupported or unknown tabs to curriculum", () => {
        expect(normalizeBuilderTab(baseProgram, "practicum")).toBe("curriculum");
        expect(normalizeBuilderTab(baseProgram, "missing")).toBe("curriculum");
        expect(normalizeBuilderTab(baseProgram, null)).toBe("curriculum");
    });

    it("includes practicum only when the program blueprint enables it", () => {
        const practicumProgram = {
            ...baseProgram,
            blueprint: {
                featureFlags: { practicum: true },
            },
        };

        expect(getAvailableBuilderTabs(baseProgram).map((tab) => tab.value)).not.toContain(
            "practicum",
        );
        expect(getAvailableBuilderTabs(practicumProgram).map((tab) => tab.value)).toContain(
            "practicum",
        );
        expect(normalizeBuilderTab(practicumProgram, "practicum")).toBe("practicum");
    });

    it("uses the base manage URL for curriculum and query params for other tabs", () => {
        expect(getBuilderTabUrl(42, "curriculum")).toBe(
            "/instructor/programs/42/manage/",
        );
        expect(getBuilderTabUrl(42, "overview")).toBe(
            "/instructor/programs/42/manage/?tab=overview",
        );
    });
});
