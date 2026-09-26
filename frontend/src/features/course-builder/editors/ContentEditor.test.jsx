import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import ContentEditor from "./ContentEditor";

vi.mock("@/components/RichTextEditor", () => ({
    default: ({ value, onChange, placeholder }) => (
        <textarea
            aria-label={placeholder || "Rich text editor"}
            value={value}
            onChange={(event) => onChange(event.target.value)}
        />
    ),
}));

vi.mock("@/components/FileUploader", () => ({
    default: () => null,
}));

vi.mock("../components/DocumentPrimaryUploader", () => ({
    default: () => null,
}));

vi.mock("@inertiajs/react", () => ({
    router: {
        post: vi.fn(),
    },
}));

const validTextLessonProperties = {
    lesson_type: "text",
    duration: "20m",
    content: "Lesson body ".repeat(20),
};

const validDescription =
    "A short description that is comfortably longer than fifty characters.";

const renderEditor = (node, onSave = vi.fn()) => {
    render(<ContentEditor node={node} onSave={onSave} blueprint={{}} />);
    return onSave;
};

const changeTitle = (value) => {
    fireEvent.change(screen.getByPlaceholderText("Enter lesson name *"), {
        target: { value },
    });
};

describe("ContentEditor saving", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    test("does not autosave a document lesson before its document is uploaded", () => {
        vi.useFakeTimers();
        const onSave = renderEditor({
            id: 41,
            title: "Untitled Lesson",
            properties: { lesson_type: "document" },
        });

        changeTitle("Reading pack");
        act(() => {
            vi.advanceTimersByTime(5000);
        });

        expect(onSave).not.toHaveBeenCalled();
        expect(screen.getByText("Unsaved")).toBeInTheDocument();
    });

    test("still autosaves drafts that only miss client-side quality rules", () => {
        vi.useFakeTimers();
        const onSave = renderEditor({
            id: 42,
            title: "Untitled Lesson",
            properties: { lesson_type: "text" },
        });

        changeTitle("Draft lesson");
        act(() => {
            vi.advanceTimersByTime(1800);
        });

        expect(onSave).toHaveBeenCalledTimes(1);
        expect(onSave.mock.calls[0][0]).toBe(42);
        expect(onSave.mock.calls[0][1].title).toBe("Draft lesson");
    });

    test("shows the server's message when a save is rejected", async () => {
        const serverMessage = "The server rejected this lesson.";
        const onSave = renderEditor(
            {
                id: 43,
                title: "Intro to circuits",
                description: validDescription,
                properties: validTextLessonProperties,
            },
            vi.fn((nodeId, payload, callbacks) => {
                callbacks.onError?.({ properties: serverMessage });
                callbacks.onFinish?.();
            }),
        );

        fireEvent.click(screen.getAllByRole("button", { name: "Save" })[0]);

        expect(await screen.findByText(serverMessage)).toBeInTheDocument();
        expect(onSave).toHaveBeenCalledTimes(1);
        expect(screen.getByText("Save failed")).toBeInTheDocument();
        expect(
            screen.queryByText("Lesson saved successfully!"),
        ).not.toBeInTheDocument();
    });

    test("confirms a save the server accepted", async () => {
        renderEditor(
            {
                id: 44,
                title: "Intro to circuits",
                description: validDescription,
                properties: validTextLessonProperties,
            },
            vi.fn((nodeId, payload, callbacks) => {
                callbacks.onSuccess?.();
                callbacks.onFinish?.();
            }),
        );

        fireEvent.click(screen.getAllByRole("button", { name: "Save" })[0]);

        expect(
            await screen.findByText("Lesson saved successfully!"),
        ).toBeInTheDocument();
    });
});
