import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import LessonHeader from "./LessonHeader";

describe("LessonHeader", () => {
    test.each([
        [{ activityType: "text" }, "Text lesson"],
        [
            { activityType: "video", properties: { duration: 9 } },
            "Video lesson · 9 min",
        ],
        [
            { activityType: "quiz", properties: { questions: [{}, {}, {}, {}, {}] } },
            "Quiz · 5 questions",
        ],
        [{ activityType: "assignment" }, "Assignment"],
        [{ activityType: "live_meeting" }, "Live class"],
    ])("shows the activity eyebrow for %o", (activity, eyebrow) => {
        render(<LessonHeader node={{ id: 1, title: "Deployment models", ...activity }} />);

        expect(screen.getByText(eyebrow)).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { level: 1, name: "Deployment models" }),
        ).toBeInTheDocument();
    });
});
