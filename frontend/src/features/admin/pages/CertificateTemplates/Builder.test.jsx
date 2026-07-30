import { describe, expect, it } from "vitest";

import {
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
});
