import { describe, expect, test } from "vitest";

import {
    DEFAULT_RICH_TEXT_IMAGE_ATTRIBUTES,
    RICH_TEXT_IMAGE_ALIGNS,
    RICH_TEXT_IMAGE_CROPS,
    RICH_TEXT_IMAGE_DATA_ATTRIBUTE_NAMES,
    RICH_TEXT_IMAGE_LAYOUTS,
    RICH_TEXT_IMAGE_MAX_WIDTH,
    RICH_TEXT_IMAGE_SIZES,
    getImageFilesFromClipboard,
    getRichTextImageDataAttributes,
    getUploadedImageUrl,
    isImageFile,
    normalizeRichTextImageDimension,
    normalizeRichTextImageAttributes,
    renderRichTextImageCaptions,
    richTextImageFigureSx,
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
            maxWidth: "min(100%, var(--rich-text-image-width))",
            height: "auto",
            mx: "auto",
            "&[data-rich-text-image-size='small']": {
                "--rich-text-image-width": "320px",
            },
            "&[data-rich-text-image-size='full']": {
                width: "100%",
                maxWidth: "100%",
            },
            "&[data-rich-text-image-layout='inline']": {
                display: "inline-block",
                width: "min(48%, var(--rich-text-image-width))",
                maxWidth: "calc(50% - 12px)",
            },
        });
        expect(richTextImageFigureSx).toMatchObject({
            display: "block",
            width: "min(100%, var(--rich-text-image-width))",
            "& > figcaption": {
                textAlign: "center",
            },
        });
    });

    test("normalizes rich text image controls", () => {
        expect(normalizeRichTextImageAttributes()).toEqual({
            ...DEFAULT_RICH_TEXT_IMAGE_ATTRIBUTES,
            alt: "",
            imageCaption: "",
            decorative: false,
            width: null,
            height: null,
        });
        expect(
            normalizeRichTextImageAttributes({
                imageSize: RICH_TEXT_IMAGE_SIZES.SMALL,
                imageAlign: RICH_TEXT_IMAGE_ALIGNS.LEFT,
                imageCrop: RICH_TEXT_IMAGE_CROPS.COVER,
                imageLayout: RICH_TEXT_IMAGE_LAYOUTS.INLINE,
                alt: "  A system diagram  ",
                imageCaption: "  Figure 1: AI workflow  ",
                decorative: true,
                width: "640",
                height: 360,
            }),
        ).toEqual({
            imageSize: "small",
            imageAlign: "left",
            imageCrop: "cover",
            imageLayout: "inline",
            alt: "A system diagram",
            imageCaption: "Figure 1: AI workflow",
            decorative: true,
            width: 640,
            height: 360,
        });
        expect(
            normalizeRichTextImageAttributes({
                imageSize: "tiny",
                imageAlign: "right",
                imageCrop: "square",
                imageLayout: "float",
            }),
        ).toEqual({
            ...DEFAULT_RICH_TEXT_IMAGE_ATTRIBUTES,
            alt: "",
            imageCaption: "",
            decorative: false,
            width: null,
            height: null,
        });
    });

    test("normalizes persisted image dimensions", () => {
        expect(normalizeRichTextImageDimension("640px")).toBe(640);
        expect(normalizeRichTextImageDimension(2400)).toBe(2400);
        expect(normalizeRichTextImageDimension(39)).toBeNull();
        expect(normalizeRichTextImageDimension(2401)).toBeNull();
        expect(normalizeRichTextImageDimension("not-a-size")).toBeNull();
    });

    test("builds image data attributes for sanitized rendering", () => {
        expect(RICH_TEXT_IMAGE_DATA_ATTRIBUTE_NAMES).toEqual([
            "data-rich-text-image-size",
            "data-rich-text-image-align",
            "data-rich-text-image-crop",
            "data-rich-text-image-layout",
            "data-rich-text-image-decorative",
            "data-rich-text-image-caption",
            "data-rich-text-image-figure",
            "width",
            "height",
            "role",
        ]);
        expect(
            getRichTextImageDataAttributes({
                imageSize: RICH_TEXT_IMAGE_SIZES.FULL,
                imageAlign: RICH_TEXT_IMAGE_ALIGNS.LEFT,
                imageCrop: RICH_TEXT_IMAGE_CROPS.COVER,
                imageLayout: RICH_TEXT_IMAGE_LAYOUTS.INLINE,
                imageCaption: "Figure 1",
                decorative: true,
            }),
        ).toEqual({
            "data-rich-text-image-size": "full",
            "data-rich-text-image-align": "left",
            "data-rich-text-image-crop": "cover",
            "data-rich-text-image-layout": "inline",
            "data-rich-text-image-caption": "Figure 1",
            "data-rich-text-image-decorative": "true",
        });
    });

    test("renders image captions as figures", () => {
        const html = renderRichTextImageCaptions(
            [
                '<p><img src="/media/a.png" alt="AI workflow"',
                'data-rich-text-image-size="small"',
                'data-rich-text-image-caption="Figure 1: AI workflow"></p>',
            ].join(" "),
        );

        expect(html).toContain('<figure data-rich-text-image-figure="true"');
        expect(html).toContain('data-rich-text-image-size="small"');
        expect(html).toContain('data-rich-text-image-align="center"');
        expect(html).toContain('<img src="/media/a.png" alt="AI workflow"');
        expect(html).toContain(
            "<figcaption>Figure 1: AI workflow</figcaption>",
        );
    });

    test("keeps resized images responsive when captions are rendered", () => {
        const html = renderRichTextImageCaptions(
            '<img src="/media/a.png" alt="Chart" width="640" height="360" data-rich-text-image-caption="Results">',
        );

        expect(html).toContain('style="width: min(100%, 640px);"');
        expect(html).toContain('width="640"');
        expect(html).toContain('height="360"');
    });
});
