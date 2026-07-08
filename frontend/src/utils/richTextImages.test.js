import { describe, expect, test } from "vitest";

import {
    RICH_TEXT_IMAGE_MAX_WIDTH,
    getImageFilesFromClipboard,
    getUploadedImageUrl,
    isImageFile,
    richTextImageSx,
} from "./richTextImages";

describe("rich text image helpers", () => {
    test("identifies image files by MIME type", () => {
        expect(
            isImageFile(
                new File(["x"], "screenshot.png", { type: "image/png" }),
            ),
        ).toBe(true);
        expect(
            isImageFile(new File(["x"], "notes.txt", { type: "text/plain" })),
        ).toBe(false);
    });

    test("extracts image files from clipboard files", () => {
        const image = new File(["image"], "clipboard.png", {
            type: "image/png",
        });
        const text = new File(["text"], "clipboard.txt", {
            type: "text/plain",
        });

        expect(
            getImageFilesFromClipboard({
                files: [image, text],
                items: [],
            }),
        ).toEqual([image]);
    });

    test("falls back to clipboard item files when clipboard files are empty", () => {
        const image = new File(["image"], "item.webp", { type: "image/webp" });

        expect(
            getImageFilesFromClipboard({
                files: [],
                items: [
                    {
                        kind: "file",
                        type: "image/webp",
                        getAsFile: () => image,
                    },
                    {
                        kind: "string",
                        type: "text/html",
                        getAsFile: () => null,
                    },
                ],
            }),
        ).toEqual([image]);
    });

    test("reads uploaded image URLs from supported response shapes", () => {
        expect(getUploadedImageUrl({ image: { url: "/media/a.png" } })).toBe(
            "/media/a.png",
        );
        expect(getUploadedImageUrl({ file: { url: "/media/b.png" } })).toBe(
            "/media/b.png",
        );
        expect(getUploadedImageUrl({ url: "/media/c.png" })).toBe(
            "/media/c.png",
        );
        expect(getUploadedImageUrl(null)).toBe("");
    });

    test("caps rich text image display width", () => {
        expect(RICH_TEXT_IMAGE_MAX_WIDTH).toBe("720px");
        expect(richTextImageSx).toMatchObject({
            display: "block",
            width: "auto",
            maxWidth: "min(100%, 720px)",
            height: "auto",
            mx: "auto",
        });
    });
});
