import { createRef } from "react";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CodeLabEditor from "./CodeLabEditor";

vi.mock("@/components/RichTextEditor", () => ({
    default: ({ value, onChange, placeholder }) => (
        <textarea
            aria-label={placeholder || "Rich text editor"}
            value={value}
            onChange={(event) => onChange(event.target.value)}
        />
    ),
}));

vi.mock("@/components/FileUploader", () => ({ default: () => null }));

vi.mock("@uiw/react-codemirror", () => ({
    default: ({ value }) => <pre data-testid="code-editor">{value}</pre>,
}));

vi.mock("@inertiajs/react", () => ({ router: { post: vi.fn() } }));

const codeLab = {
    id: 42,
    title: "Build a landing page",
    description: "<p>Practise layout with HTML and CSS in the browser.</p>",
    properties: {
        lesson_type: "code",
        language: "html_css_js",
        starter_code: "<h1>Hello</h1>",
        instructions: "<p>Style the heading.</p>",
        duration: "30m",
        is_preview: true,
    },
};

describe("CodeLabEditor free preview", () => {
    it("never offers the preview toggle and saves code labs as non-preview", async () => {
        const onSave = vi.fn((_id, _payload, callbacks) =>
            callbacks?.onSuccess?.(),
        );
        const ref = createRef();

        render(<CodeLabEditor ref={ref} node={codeLab} onSave={onSave} />);

        expect(screen.queryByText("Lesson preview")).not.toBeInTheDocument();

        await act(async () => {
            await ref.current.flushAutosave({ force: true });
        });

        expect(onSave).toHaveBeenCalled();
        const payload = onSave.mock.calls.at(-1)[1];
        expect(payload.properties.is_preview).toBe(false);
    });
});
