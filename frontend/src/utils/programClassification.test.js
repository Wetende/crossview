import { describe, expect, test } from "vitest";

import { matchesProgramLevel } from "./programClassification";

describe("matchesProgramLevel", () => {
    test("treats internal short courses as Short Course even when level is Beginner", () => {
        const program = {
            examBody: "Internal",
            qualificationFamily: "Short Course",
            level: "Beginner",
        };

        expect(matchesProgramLevel(program, "Short Course")).toBe(true);
        expect(matchesProgramLevel(program, "Certificate")).toBe(false);
    });

    test("keeps certificates of participation out of the formal Certificate tab", () => {
        const program = {
            examBody: "Internal",
            qualificationFamily: "Certificate of Participation",
            level: "General",
        };

        expect(matchesProgramLevel(program, "Short Course")).toBe(true);
        expect(matchesProgramLevel(program, "Certificate")).toBe(false);
    });

    test("matches formal certificate programs under Certificate", () => {
        const program = {
            examBody: "KNEC",
            qualificationFamily: "Craft Certificate",
            level: "Craft",
        };

        expect(matchesProgramLevel(program, "Certificate")).toBe(true);
        expect(matchesProgramLevel(program, "Short Course")).toBe(false);
    });
});
