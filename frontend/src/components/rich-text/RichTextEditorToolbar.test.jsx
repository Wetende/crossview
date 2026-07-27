import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { RichTextEditorToolbar } from "./RichTextEditorToolbar";

const createEditor = () => {
    const chain = {
        focus: vi.fn(),
        setTextAlign: vi.fn(),
        run: vi.fn(() => true),
    };
    chain.focus.mockReturnValue(chain);
    chain.setTextAlign.mockReturnValue(chain);

    return {
        chain,
        editor: {
            can: () => ({
                undo: () => false,
                redo: () => false,
            }),
            chain: () => chain,
            getAttributes: (name) => {
                if (name === "image") return { imageAlign: "center" };
                return {};
            },
            isActive: (nameOrAttributes) =>
                nameOrAttributes === "image" ||
                nameOrAttributes?.textAlign === "center",
        },
    };
};

describe("RichTextEditorToolbar image controls", () => {
    test("uses the main alignment controls and exposes image actions", () => {
        const { editor, chain } = createEditor();
        const onUpdateImage = vi.fn();

        render(
            <RichTextEditorToolbar
                editor={editor}
                onOpenLink={vi.fn()}
                onOpenImage={vi.fn()}
                imageAttributes={{
                    imageAlign: "center",
                    imageLayout: "stacked",
                    imageCrop: "none",
                }}
                onUpdateImage={onUpdateImage}
                onDeleteImage={vi.fn()}
                isFullscreen={false}
                onToggleFullscreen={vi.fn()}
            />,
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Align image right" }),
        );

        expect(onUpdateImage).toHaveBeenCalledWith({ imageAlign: "right" });
        expect(chain.setTextAlign).not.toHaveBeenCalled();
        expect(
            screen.getByRole("button", { name: "Edit image details" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Image on its own line" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Place images side by side" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Crop image to 16:9" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Delete image" }),
        ).toBeInTheDocument();
    });
});
