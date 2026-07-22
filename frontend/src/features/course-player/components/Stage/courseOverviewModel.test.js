import { describe, expect, test } from "vitest";

import {
    buildAssessmentSummaries,
    buildUnitSummaries,
} from "./courseOverviewModel";

const curriculum = [
    {
        id: 1,
        title: "Foundations",
        nodeType: "section",
        children: [
            {
                id: 2,
                title: "Introduction",
                nodeType: "lesson",
                isCompleted: true,
                isLocked: false,
                url: "/lesson/2",
            },
            {
                id: 3,
                title: "Check your understanding",
                nodeType: "quiz",
                isCompleted: false,
                isLocked: false,
                url: "/lesson/3",
                lastAttempt: { number: 1, score: 80, passed: true },
            },
        ],
    },
];

describe("course overview model", () => {
    test("summarizes root curriculum sections as learning units", () => {
        expect(buildUnitSummaries(curriculum)).toEqual([
            expect.objectContaining({
                id: 1,
                title: "Foundations",
                completedCount: 1,
                totalCount: 2,
                progressPercent: 50,
                url: "/lesson/3",
            }),
        ]);
    });

    test("uses official attempt summaries for assessment status", () => {
        expect(buildAssessmentSummaries(curriculum)).toEqual([
            expect.objectContaining({
                title: "Check your understanding",
                status: "Passed",
                score: 80,
                attemptNumber: 1,
            }),
        ]);
    });
});
