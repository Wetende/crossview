import { createRef } from "react";
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

const renderEditor = (node, onSave = vi.fn(), ref = undefined) => {
    render(
        <ContentEditor ref={ref} node={node} onSave={onSave} blueprint={{}} />,
    );
    return onSave;
};

const meetLessonWithoutTimezone = {
    id: 45,
    title: "Weekly Meet",
    properties: {
        lesson_type: "google_meet",
        session_kind: "live_meeting",
        provider: "google_meet",
        start_date: "2026-10-01",
        start_time: "09:00",
        end_date: "2026-10-01",
        end_time: "10:00",
    },
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
        expect(
            screen.getByText("Autosave paused: upload the document"),
        ).toBeInTheDocument();
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

    test("shows why autosave is paused while edits are unsaved", () => {
        vi.useFakeTimers();
        const onSave = renderEditor(meetLessonWithoutTimezone);

        changeTitle("Weekly Meet: week 2");
        act(() => {
            vi.advanceTimersByTime(5000);
        });

        expect(onSave).not.toHaveBeenCalled();
        expect(
            screen.getByText("Autosave paused: select a timezone"),
        ).toBeInTheDocument();
    });

    test("warns about unsaved edits when a flush is skipped", async () => {
        const ref = createRef();
        const onSave = renderEditor(meetLessonWithoutTimezone, vi.fn(), ref);

        changeTitle("Weekly Meet: week 2");
        let result;
        await act(async () => {
            result = await ref.current.flushAutosave();
        });

        expect(onSave).not.toHaveBeenCalled();
        expect(result).toMatchObject({
            skipped: true,
            paused: true,
            pauseReason: "select a timezone",
        });
        expect(
            await screen.findByText("Unsaved changes: select a timezone"),
        ).toBeInTheDocument();
    });

    test("asks the browser to confirm leaving with paused unsaved edits", () => {
        renderEditor(meetLessonWithoutTimezone);

        const cleanEvent = new Event("beforeunload", { cancelable: true });
        window.dispatchEvent(cleanEvent);
        expect(cleanEvent.defaultPrevented).toBe(false);

        changeTitle("Weekly Meet: week 2");
        const dirtyEvent = new Event("beforeunload", { cancelable: true });
        window.dispatchEvent(dirtyEvent);
        expect(dirtyEvent.defaultPrevented).toBe(true);
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

describe("ContentEditor free preview toggle", () => {
    test("offers the preview switch for a text lesson", () => {
        renderEditor({
            id: 50,
            title: "Intro to circuits",
            description: validDescription,
            properties: validTextLessonProperties,
        });

        expect(screen.getByText("Lesson preview")).toBeInTheDocument();
        expect(screen.getByRole("switch")).not.toBeChecked();
    });

    test.each(["quiz", "assignment", "live_stream"])(
        "hides the preview switch for a %s lesson",
        (lessonType) => {
            renderEditor({
                id: 51,
                title: "Not previewable",
                properties: { lesson_type: lessonType, is_preview: true },
            });

            expect(screen.queryByText("Lesson preview")).not.toBeInTheDocument();
        },
    );

    test("hides the preview switch for a Google Meet lesson and saves it as non-preview", async () => {
        const onSave = vi.fn((_nodeId, _payload, callbacks) => {
            callbacks?.onSuccess?.();
            callbacks?.onFinish?.();
        });
        const ref = createRef();
        renderEditor(
            {
                ...meetLessonWithoutTimezone,
                properties: {
                    ...meetLessonWithoutTimezone.properties,
                    timezone: "Africa/Nairobi",
                    is_preview: true,
                },
            },
            onSave,
            ref,
        );

        expect(screen.queryByText("Lesson preview")).not.toBeInTheDocument();

        await act(async () => {
            await ref.current.flushAutosave({ force: true });
        });

        expect(onSave).toHaveBeenCalled();
        expect(onSave.mock.calls.at(-1)[1].properties.is_preview).toBe(false);
    });
});
