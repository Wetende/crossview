import { describe, expect, it } from "vitest";

import {
    ADDITIONAL_ELEMENT_GROUPS,
    ELEMENT_LIBRARY,
    PRIMARY_ELEMENT_GROUPS,
} from "./certificateElementLibrary";

const labelsFor = (group) =>
    ELEMENT_LIBRARY.filter((item) => item.group === group).map(
        (item) => item.label,
    );

describe("certificate builder element palette", () => {
    it("uses the four MasterStudy-style primary sections in order", () => {
        expect(PRIMARY_ELEMENT_GROUPS).toEqual([
            "Certificate",
            "Course",
            "Student",
            "Instructor",
        ]);
    });

    it("keeps the primary palette focused on the supported core elements", () => {
        expect(labelsFor("Certificate")).toEqual([
            "Text",
            "Image",
            "Shape",
            "Certificate code",
            "QR-Code",
            "Current date",
        ]);
        expect(labelsFor("Course")).toEqual([
            "Course name",
            "Details",
            "Progress",
            "Course duration",
            "Start date",
            "End date",
        ]);
        expect(labelsFor("Student")).toEqual(["Student name", "Student code"]);
        expect(labelsFor("Instructor")).toEqual([
            "Instructor name",
            "Co-instructor name",
        ]);
    });

    it("does not mark working elements as coming soon", () => {
        expect(
            ELEMENT_LIBRARY.some(
                (item) =>
                    item.badge?.toLowerCase() === "soon" ||
                    item.label.toLowerCase().includes("soon"),
            ),
        ).toBe(false);
    });

    it("keeps additional fields limited to non-duplicate certificate data", () => {
        expect(ADDITIONAL_ELEMENT_GROUPS).toEqual([
            "Organisation",
            "Student metadata",
            "Instructor metadata",
            "Course metadata",
        ]);
        expect(labelsFor("Organisation")).toEqual(["Organisation", "Campus"]);
        expect(labelsFor("Student metadata")).toEqual([
            "Admission number",
            "Examination number",
        ]);
        expect(labelsFor("Instructor metadata")).toEqual([
            "Principal / director",
        ]);
        expect(labelsFor("Course metadata")).toEqual([
            "Course level",
            "Department",
            "Grade",
            "Score",
        ]);
        expect(labelsFor("Design")).toEqual([]);
        expect(labelsFor("Verification")).toEqual([]);
    });
});
