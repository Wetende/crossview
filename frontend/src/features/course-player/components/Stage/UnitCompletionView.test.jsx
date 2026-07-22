import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import UnitCompletionView from "./UnitCompletionView";

vi.mock("@inertiajs/react", () => ({
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

describe("UnitCompletionView", () => {
    test("shows a derived completion celebration and next unit action", () => {
        render(
            <UnitCompletionView
                unit={{
                    title: "Delivery foundations",
                    completedCount: 3,
                    totalCount: 3,
                    progressPercent: 100,
                    isComplete: true,
                    reviewUrl: "/session/1/",
                    nextUnit: { title: "Automation", url: "/unit/2/" },
                    items: [
                        {
                            id: 1,
                            title: "Introduction",
                            isCompleted: true,
                            url: "/session/1/",
                        },
                    ],
                }}
            />,
        );

        expect(
            screen.getByRole("heading", { name: "Unit complete" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "Continue to Automation" }),
        ).toHaveAttribute("href", "/unit/2/");
        expect(screen.getByText("Completed")).toBeInTheDocument();
    });
});
