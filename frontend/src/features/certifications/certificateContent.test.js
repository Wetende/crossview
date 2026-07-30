import { describe, expect, it } from "vitest";

import {
    certificateSampleContent,
    fitCertificateText,
    transformCertificateText,
} from "./certificateContent";

const textElement = (styles = {}) => ({
    type: "dynamic_text",
    width: 85,
    height: 18,
    styles: {
        fontSize: 30,
        minFontSize: 12,
        lineHeight: 1.2,
        autoShrink: true,
        ...styles,
    },
});

describe("certificate content fitting", () => {
    it("replaces every supported placeholder using a chosen preview profile", () => {
        const content = certificateSampleContent(
            "{{student_name}} — {{program_title}} — {{course_details}}",
            "stress",
        );

        expect(content).toContain("Abdulrahman Mohammed Abdullahi-Wanyonyi");
        expect(content).toContain(
            "Advanced International Professional Certificate",
        );
        expect(content).toContain("128 lessons, 24 quizzes, 12 assignments");
    });

    it("shrinks a long dynamic name without going below the configured minimum", () => {
        const fit = fitCertificateText({
            text: "Abdulrahman Mohammed Abdullahi-Wanyonyi",
            element: textElement(),
        });

        expect(fit.fontSize).toBeLessThan(30);
        expect(fit.fontSize).toBeGreaterThanOrEqual(12);
        expect(fit.overflows).toBe(false);
    });

    it("reports overflow when automatic shrinking is disabled", () => {
        const fit = fitCertificateText({
            text: "Abdulrahman Mohammed Abdullahi-Wanyonyi",
            element: textElement({ autoShrink: false, singleLine: true }),
        });

        expect(fit.fontSize).toBe(30);
        expect(fit.overflows).toBe(true);
    });

    it("uses the configured maximum as a hard upper font-size limit", () => {
        const fit = fitCertificateText({
            text: "Alex Morgan",
            element: textElement({
                fontSize: 30,
                maxFontSize: 18,
                minFontSize: 10,
            }),
        });

        expect(fit.fontSize).toBe(18);
    });

    it("handles accented names and non-Latin characters without dropping text", () => {
        const text = "José O’Dwyer — 王小明";
        const fit = fitCertificateText({
            text,
            element: textElement({ fontSize: 22 }),
        });

        expect(fit.fontSize).toBeGreaterThanOrEqual(12);
        expect(transformCertificateText(text, "uppercase")).toContain("JOSÉ");
        expect(transformCertificateText(text, "uppercase")).toContain("王小明");
    });
});
