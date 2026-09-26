import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import QuestionEditorCard from "./QuestionEditorCard";

vi.mock("@/components/RichTextEditor", () => ({
    default: ({ value, onChange, placeholder, enableMath = true }) => (
        <textarea
            aria-label={placeholder}
            data-maths={enableMath ? "on" : "off"}
            value={value}
            onChange={(event) => onChange(event.target.value)}
        />
    ),
}));

const baseQuestion = {
    id: 11,
    db_id: 5,
    type: "mcq",
    text: "Which unit measures current?",
    points: 1,
    options: ["Volt", "Ampere"],
    correct: 1,
};

const renderCard = (question = baseQuestion) => {
    const onChange = vi.fn();
    render(
        <QuestionEditorCard
            question={question}
            onChange={onChange}
            defaultExpanded
        />,
    );
    return onChange;
};

const lastPayload = (onChange) => onChange.mock.calls.at(-1)[0];

describe("QuestionEditorCard explanation and hint", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test("keeps both fields collapsed until opened", () => {
        renderCard();

        const explanationToggle = screen.getByRole("button", {
            name: /Explanation \(shown after submission\)/,
        });
        const hintToggle = screen.getByRole("button", {
            name: /Hint \(learners can reveal before answering\)/,
        });
        expect(explanationToggle).toHaveAttribute("aria-expanded", "false");
        expect(hintToggle).toHaveAttribute("aria-expanded", "false");
        expect(
            screen.queryByLabelText("Explain the correct answer"),
        ).not.toBeInTheDocument();
        expect(screen.queryByLabelText("Write a hint")).not.toBeInTheDocument();
    });

    test.each([
        "mcq",
        "mcq_multi",
        "true_false",
        "short_answer",
        "matching",
        "fill_blank",
        "ordering",
    ])("saves the explanation and hint for a %s question", (type) => {
        const onChange = renderCard({ ...baseQuestion, type });

        fireEvent.click(
            screen.getByRole("button", { name: /Explanation \(shown/ }),
        );
        fireEvent.change(screen.getByLabelText("Explain the correct answer"), {
            target: { value: "<p>An ampere is one coulomb per second.</p>" },
        });
        fireEvent.click(
            screen.getByRole("button", { name: /Hint \(learners/ }),
        );
        fireEvent.change(screen.getByLabelText("Write a hint"), {
            target: { value: "<p>Think of flow, not pressure.</p>" },
        });
        act(() => {
            vi.advanceTimersByTime(600);
        });

        expect(lastPayload(onChange)).toMatchObject({
            id: 11,
            db_id: 5,
            type,
            explanation: "<p>An ampere is one coulomb per second.</p>",
            hint: "<p>Think of flow, not pressure.</p>",
        });
    });

    test("shows which fields already have content and enables maths only there", () => {
        renderCard({
            ...baseQuestion,
            explanation: "<p>Because.</p>",
            hint: "<p></p>",
        });

        const explanationToggle = screen.getByRole("button", {
            name: /Explanation \(shown/,
        });
        expect(explanationToggle).toHaveTextContent("Added");
        expect(
            screen.getByRole("button", { name: /Hint \(learners/ }),
        ).not.toHaveTextContent("Added");

        fireEvent.click(explanationToggle);
        expect(screen.getByLabelText("Explain the correct answer")).toHaveValue(
            "<p>Because.</p>",
        );
        expect(
            screen.getByLabelText("Explain the correct answer"),
        ).toHaveAttribute("data-maths", "on");
        // Question text is saved as plain text, so maths stays off there.
        expect(screen.getByLabelText("Enter your question")).toHaveAttribute(
            "data-maths",
            "off",
        );
    });

    test("has no controls that the quiz cannot save", () => {
        renderCard();

        expect(
            screen.queryByRole("button", { name: "Add Video or Audio" }),
        ).not.toBeInTheDocument();
        expect(screen.queryByText("Required Question")).not.toBeInTheDocument();
        expect(screen.queryByLabelText("Category")).not.toBeInTheDocument();
    });
});
