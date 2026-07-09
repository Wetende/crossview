export const RICH_TEXT_IMAGE_SIZES = {
    SMALL: "small",
    MEDIUM: "medium",
    FULL: "full",
};

export const RICH_TEXT_IMAGE_ALIGNS = {
    LEFT: "left",
    CENTER: "center",
};

export const RICH_TEXT_IMAGE_CROPS = {
    NONE: "none",
    COVER: "cover",
};

export const RICH_TEXT_IMAGE_LAYOUTS = {
    STACKED: "stacked",
    INLINE: "inline",
};

export const RICH_TEXT_IMAGE_SMALL_WIDTH = "320px";
export const RICH_TEXT_IMAGE_MAX_WIDTH = "720px";

export const DEFAULT_RICH_TEXT_IMAGE_ATTRIBUTES = {
    imageSize: RICH_TEXT_IMAGE_SIZES.MEDIUM,
    imageAlign: RICH_TEXT_IMAGE_ALIGNS.CENTER,
    imageCrop: RICH_TEXT_IMAGE_CROPS.NONE,
    imageLayout: RICH_TEXT_IMAGE_LAYOUTS.STACKED,
};

export const RICH_TEXT_IMAGE_CAPTION_ATTRIBUTE =
    "data-rich-text-image-caption";
export const RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE = "data-rich-text-image-figure";

export const RICH_TEXT_IMAGE_DATA_ATTRIBUTE_NAMES = [
    "data-rich-text-image-size",
    "data-rich-text-image-align",
    "data-rich-text-image-crop",
    "data-rich-text-image-layout",
    RICH_TEXT_IMAGE_CAPTION_ATTRIBUTE,
    RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE,
];

const allowedValues = (values) => Object.values(values);

export const normalizeRichTextImageSize = (value) =>
    allowedValues(RICH_TEXT_IMAGE_SIZES).includes(value)
        ? value
        : DEFAULT_RICH_TEXT_IMAGE_ATTRIBUTES.imageSize;

export const normalizeRichTextImageAlign = (value) =>
    allowedValues(RICH_TEXT_IMAGE_ALIGNS).includes(value)
        ? value
        : DEFAULT_RICH_TEXT_IMAGE_ATTRIBUTES.imageAlign;

export const normalizeRichTextImageCrop = (value) =>
    allowedValues(RICH_TEXT_IMAGE_CROPS).includes(value)
        ? value
        : DEFAULT_RICH_TEXT_IMAGE_ATTRIBUTES.imageCrop;

export const normalizeRichTextImageLayout = (value) =>
    allowedValues(RICH_TEXT_IMAGE_LAYOUTS).includes(value)
        ? value
        : DEFAULT_RICH_TEXT_IMAGE_ATTRIBUTES.imageLayout;

export const normalizeRichTextImageTextAttribute = (value) =>
    typeof value === "string" ? value.trim() : "";

export const normalizeRichTextImageAttributes = (attributes = {}) => ({
    imageSize: normalizeRichTextImageSize(attributes.imageSize),
    imageAlign: normalizeRichTextImageAlign(attributes.imageAlign),
    imageCrop: normalizeRichTextImageCrop(attributes.imageCrop),
    imageLayout: normalizeRichTextImageLayout(attributes.imageLayout),
    alt: normalizeRichTextImageTextAttribute(attributes.alt),
    imageCaption: normalizeRichTextImageTextAttribute(attributes.imageCaption),
});

export const getRichTextImageDataAttributes = (attributes = {}) => {
    const normalized = normalizeRichTextImageAttributes(attributes);

    const dataAttributes = {
        "data-rich-text-image-size": normalized.imageSize,
        "data-rich-text-image-align": normalized.imageAlign,
        "data-rich-text-image-crop": normalized.imageCrop,
        "data-rich-text-image-layout": normalized.imageLayout,
    };

    if (normalized.imageCaption) {
        dataAttributes[RICH_TEXT_IMAGE_CAPTION_ATTRIBUTE] =
            normalized.imageCaption;
    }

    return dataAttributes;
};

export const richTextImageSx = {
    "--rich-text-image-width": RICH_TEXT_IMAGE_MAX_WIDTH,
    display: "block",
    width: "auto",
    maxWidth: "min(100%, var(--rich-text-image-width))",
    height: "auto",
    objectFit: "contain",
    mx: "auto",
    "&[data-rich-text-image-size='small']": {
        "--rich-text-image-width": RICH_TEXT_IMAGE_SMALL_WIDTH,
    },
    "&[data-rich-text-image-size='medium']": {
        "--rich-text-image-width": RICH_TEXT_IMAGE_MAX_WIDTH,
    },
    "&[data-rich-text-image-size='full']": {
        width: "100%",
        maxWidth: "100%",
    },
    "&[data-rich-text-image-align='left']": {
        mx: 0,
        mr: "auto",
    },
    "&[data-rich-text-image-align='center']": {
        mx: "auto",
    },
    "&[data-rich-text-image-crop='cover']": {
        width: "min(100%, var(--rich-text-image-width))",
        aspectRatio: "16 / 9",
        objectFit: "cover",
    },
    "&[data-rich-text-image-crop='cover'][data-rich-text-image-size='full']": {
        width: "100%",
    },
    "&[data-rich-text-image-layout='inline']": {
        display: "inline-block",
        width: "min(48%, var(--rich-text-image-width))",
        maxWidth: "calc(50% - 12px)",
        mx: 0.75,
        verticalAlign: "top",
    },
    "&[data-rich-text-image-layout='inline'][data-rich-text-image-size='small']": {
        width: `min(48%, ${RICH_TEXT_IMAGE_SMALL_WIDTH})`,
    },
    "&[data-rich-text-image-layout='inline'][data-rich-text-image-size='full']": {
        display: "block",
        width: "100%",
        maxWidth: "100%",
        mx: 0,
    },
    "&[data-rich-text-image-layout='inline'][data-rich-text-image-crop='cover']": {
        width: "min(48%, var(--rich-text-image-width))",
    },
    "&[data-rich-text-image-layout='inline'][data-rich-text-image-crop='cover'][data-rich-text-image-size='small']": {
        width: `min(48%, ${RICH_TEXT_IMAGE_SMALL_WIDTH})`,
    },
    "&[data-rich-text-image-layout='inline'][data-rich-text-image-crop='cover'][data-rich-text-image-size='full']": {
        width: "100%",
    },
};

export const richTextImageFigureSx = {
    "--rich-text-image-width": RICH_TEXT_IMAGE_MAX_WIDTH,
    display: "block",
    width: "min(100%, var(--rich-text-image-width))",
    maxWidth: "100%",
    m: 0,
    mx: "auto",
    "&[data-rich-text-image-size='small']": {
        "--rich-text-image-width": RICH_TEXT_IMAGE_SMALL_WIDTH,
    },
    "&[data-rich-text-image-size='medium']": {
        "--rich-text-image-width": RICH_TEXT_IMAGE_MAX_WIDTH,
    },
    "&[data-rich-text-image-size='full']": {
        width: "100%",
        maxWidth: "100%",
    },
    "&[data-rich-text-image-align='left']": {
        mx: 0,
        mr: "auto",
    },
    "&[data-rich-text-image-align='center']": {
        mx: "auto",
    },
    "&[data-rich-text-image-layout='inline']": {
        display: "inline-block",
        width: "min(48%, var(--rich-text-image-width))",
        maxWidth: "calc(50% - 12px)",
        mx: 0.75,
        verticalAlign: "top",
    },
    "&[data-rich-text-image-layout='inline'][data-rich-text-image-size='small']": {
        width: `min(48%, ${RICH_TEXT_IMAGE_SMALL_WIDTH})`,
    },
    "&[data-rich-text-image-layout='inline'][data-rich-text-image-size='full']": {
        display: "block",
        width: "100%",
        maxWidth: "100%",
        mx: 0,
    },
    "& > img": {
        display: "block",
        width: "100%",
        maxWidth: "100%",
        height: "auto",
        objectFit: "contain",
        m: 0,
        mx: 0,
    },
    "&[data-rich-text-image-crop='cover'] > img": {
        aspectRatio: "16 / 9",
        objectFit: "cover",
    },
    "& > figcaption": {
        mt: 1,
        color: "text.secondary",
        fontSize: "0.875rem",
        lineHeight: 1.5,
        textAlign: "center",
    },
    "&[data-rich-text-image-align='left'] > figcaption": {
        textAlign: "left",
    },
};

export const renderRichTextImageCaptions = (html) => {
    if (!html || typeof document === "undefined") {
        return html || "";
    }

    const template = document.createElement("template");
    template.innerHTML = html;

    template.content
        .querySelectorAll(`img[${RICH_TEXT_IMAGE_CAPTION_ATTRIBUTE}]`)
        .forEach((imageElement) => {
            if (
                imageElement.closest(
                    `figure[${RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE}]`,
                )
            ) {
                return;
            }

            const imageCaption = normalizeRichTextImageTextAttribute(
                imageElement.getAttribute(RICH_TEXT_IMAGE_CAPTION_ATTRIBUTE),
            );
            if (!imageCaption) {
                return;
            }

            const imageAttributes = normalizeRichTextImageAttributes({
                imageSize: imageElement.getAttribute(
                    "data-rich-text-image-size",
                ),
                imageAlign: imageElement.getAttribute(
                    "data-rich-text-image-align",
                ),
                imageCrop: imageElement.getAttribute(
                    "data-rich-text-image-crop",
                ),
                imageLayout: imageElement.getAttribute(
                    "data-rich-text-image-layout",
                ),
                imageCaption,
            });
            const figure = document.createElement("figure");
            figure.setAttribute(RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE, "true");
            Object.entries(getRichTextImageDataAttributes(imageAttributes)).forEach(
                ([name, value]) => {
                    figure.setAttribute(name, value);
                },
            );

            const figcaption = document.createElement("figcaption");
            figcaption.textContent = imageCaption;

            imageElement.before(figure);
            figure.append(imageElement);
            figure.append(figcaption);
        });

    return template.innerHTML;
};

export const isImageFile = (file) =>
    Boolean(file?.type && file.type.startsWith("image/"));

export const getImageFilesFromClipboard = (clipboardData) => {
    if (!clipboardData) {
        return [];
    }

    const files = Array.from(clipboardData.files || []).filter(isImageFile);
    if (files.length > 0) {
        return files;
    }

    return Array.from(clipboardData.items || [])
        .filter(
            (item) =>
                item?.kind === "file" &&
                item.type &&
                item.type.startsWith("image/"),
        )
        .map((item) => item.getAsFile?.())
        .filter(isImageFile);
};

export const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === "string") {
                resolve(reader.result);
                return;
            }

            reject(new Error("Could not read image data."));
        };
        reader.onerror = () => {
            reject(reader.error || new Error("Could not read image data."));
        };
        reader.readAsDataURL(file);
    });

export const getUploadedImageUrl = (data) => {
    if (!data || typeof data !== "object") {
        return "";
    }

    return data.image?.url || data.file?.url || data.url || data.src || "";
};
