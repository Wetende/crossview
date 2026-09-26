import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import StageFlashMessages from "./StageFlashMessages";

describe("StageFlashMessages", () => {
    test("shows server messages with matching severity and lets learners dismiss them", () => {
        render(
            <StageFlashMessages
                flash={[
                    { type: "success", message: "Review submitted." },
                    { type: "error", message: "Rating must be between 1 and 5." },
                ]}
            />,
        );

        const alerts = screen.getAllByRole("alert");
        expect(alerts).toHaveLength(2);
        expect(alerts[0]).toHaveTextContent("Review submitted.");
        expect(alerts[0]).toHaveClass("MuiAlert-colorSuccess");
        expect(alerts[1]).toHaveClass("MuiAlert-colorError");

        fireEvent.click(screen.getAllByRole("button", { name: /close/i })[0]);

        expect(screen.queryByText("Review submitted.")).not.toBeInTheDocument();
        expect(
            screen.getByText("Rating must be between 1 and 5."),
        ).toBeInTheDocument();
    });

    test("shows a new response's messages after an earlier dismissal", () => {
        const { rerender } = render(
            <StageFlashMessages flash={[{ type: "info", message: "Finish every lesson." }]} />,
        );
        fireEvent.click(screen.getByRole("button", { name: /close/i }));
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();

        rerender(
            <StageFlashMessages flash={[{ type: "info", message: "Finish every lesson." }]} />,
        );

        expect(screen.getByRole("alert")).toHaveTextContent("Finish every lesson.");
    });

    test("renders nothing without messages", () => {
        const { container } = render(<StageFlashMessages flash={[]} />);

        expect(container).toBeEmptyDOMElement();
    });
});
