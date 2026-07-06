import { describe, expect, it } from "vitest";
import {
    getAvailableBuilderTabs,
    getBuilderTabUrl,
    getSettingsSectionUrl,
    normalizeSettingsSection,
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
        expect(normalizeBuilderTab(baseProgram, "drip")).toBe("curriculum");
        expect(normalizeBuilderTab(baseProgram, "missing")).toBe("curriculum");
        expect(normalizeBuilderTab(baseProgram, null)).toBe("curriculum");
    });

    it("hides drip from the available builder tabs", () => {
        expect(getAvailableBuilderTabs(baseProgram).map((tab) => tab.value)).not.toContain(
            "drip",
        );
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
        expect(getBuilderTabUrl(42, "settings")).toBe(
            "/instructor/programs/42/manage/?tab=settings",
        );
        expect(getSettingsSectionUrl(42, "access")).toBe(
            "/instructor/programs/42/manage/?tab=settings&section=access",
        );
        expect(getSettingsSectionUrl(42, "academic")).toBe(
            "/instructor/programs/42/manage/?tab=settings&section=academic",
        );
    });

    it("normalizes settings sections without accepting removed top-level tabs", () => {
        expect(normalizeBuilderTab(baseProgram, "access")).toBe("curriculum");
        expect(normalizeBuilderTab(baseProgram, "prerequisites")).toBe("curriculum");
        expect(normalizeSettingsSection("academic")).toBe("academic");
        expect(normalizeSettingsSection("access")).toBe("access");
        expect(normalizeSettingsSection("reviews")).toBe("reviews");
        expect(normalizeSettingsSection("missing")).toBe("main");
    });
});
