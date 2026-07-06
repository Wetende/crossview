import { describe, expect, test } from "vitest";

import {
    formatCourseDuration,
    formatMetricNumber,
    resolveCourseMetrics,
} from "./courseMetrics";

describe("course metric helpers", () => {
    test("resolves snake-case metrics from public program payloads", () => {
        expect(
            resolveCourseMetrics({
                lecture_count: 20,
                assessment_count: 5,
                duration_hours: 60,
            }),
        ).toEqual({
            lessonsCount: 20,
            assessmentsCount: 5,
            lecturesCount: 25,
            durationHours: 60,
        });
    });

    test("keeps explicit zero values instead of falling through to another alias", () => {
        expect(
            resolveCourseMetrics({
                lecture_count: 0,
                lessonsCount: 20,
                assessment_count: 0,
                assessmentsCount: 5,
                duration_hours: 0,
                durationHours: 12,
            }),
        ).toEqual({
            lessonsCount: 0,
            assessmentsCount: 0,
            lecturesCount: 0,
            durationHours: 0,
        });
    });

    test("counts assessments as lectures on compact course cards", () => {
        expect(
            resolveCourseMetrics({
                lecture_count: 20,
                assessment_count: 5,
            }).lecturesCount,
        ).toBe(25);
    });

    test("formats fractional duration cleanly", () => {
        expect(formatMetricNumber(1.5)).toBe("1.5");
        expect(formatCourseDuration(1.5)).toBe("1.5 hours");
        expect(formatCourseDuration(1, "title")).toBe("1 Hour");
    });
});
