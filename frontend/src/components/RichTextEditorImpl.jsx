import React from "react";
import axios from "axios";
import { Extension } from "@tiptap/core";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { Alert, Box, LinearProgress, Paper } from "@mui/material";

import "@fontsource/albert-sans/400.css";
import "@fontsource/albert-sans/500.css";
import "@fontsource/albert-sans/600.css";
import "@fontsource/albert-sans/700.css";

import {
    RichTextImageDialog,
    RichTextLinkDialog,
} from "./rich-text/RichTextEditorDialogs";
import {
    ImageQuickControls,
    RichTextEditorToolbar,
} from "./rich-text/RichTextEditorToolbar";
import {
    EMPTY_IMAGE_VALUE,
    EMPTY_LINK_VALUE,
    LMS_RICH_TEXT_FONT_FAMILY,
    richTextContentSx,
} from "./rich-text/richTextEditorConfig";
import {
    DEFAULT_RICH_TEXT_IMAGE_ATTRIBUTES,
    RICH_TEXT_IMAGE_CAPTION_ATTRIBUTE,
    RICH_TEXT_IMAGE_DATA_ATTRIBUTE_NAMES,
    RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE,
    fileToDataUrl,
    getImageFilesFromClipboard,
    getRichTextImageDataAttributes,
    getUploadedImageUrl,
    isImageFile,
    normalizeRichTextImageAlign,
    normalizeRichTextImageAttributes,
    normalizeRichTextImageCrop,
    normalizeRichTextImageLayout,
    normalizeRichTextImageSize,
    normalizeRichTextImageTextAttribute,
    richTextImageFigureSx,
    richTextImageSx,
} from "@/utils/richTextImages";

const getImageCaptionFromElement = (element) =>
    normalizeRichTextImageTextAttribute(
        element.getAttribute(RICH_TEXT_IMAGE_CAPTION_ATTRIBUTE) ||
            element
                .closest?.(`figure[${RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE}]`)
                ?.getAttribute(RICH_TEXT_IMAGE_CAPTION_ATTRIBUTE) ||
            element.closest?.("figure")?.querySelector("figcaption")
                ?.textContent,
    );

const RichTextImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            alt: {
                default: "",
                parseHTML: (element) =>
                    normalizeRichTextImageTextAttribute(
                        element.getAttribute("alt"),
                    ),
                renderHTML: (attributes) => ({
                    alt: normalizeRichTextImageTextAttribute(attributes.alt),
                }),
            },
            decorative: {
                default: false,
                parseHTML: (element) =>
                    element.getAttribute("data-rich-text-image-decorative") ===
                    "true",
                renderHTML: (attributes) =>
                    attributes.decorative
                        ? {
                              "data-rich-text-image-decorative": "true",
                              role: "presentation",
                          }
                        : {},
            },
            imageSize: {
                default: DEFAULT_RICH_TEXT_IMAGE_ATTRIBUTES.imageSize,
                parseHTML: (element) =>
                    normalizeRichTextImageSize(
                        element.getAttribute("data-rich-text-image-size"),
                    ),
                renderHTML: (attributes) => ({
                    "data-rich-text-image-size":
                        getRichTextImageDataAttributes(attributes)[
                            "data-rich-text-image-size"
                        ],
                }),
            },
            imageAlign: {
                default: DEFAULT_RICH_TEXT_IMAGE_ATTRIBUTES.imageAlign,
                parseHTML: (element) =>
                    normalizeRichTextImageAlign(
                        element.getAttribute("data-rich-text-image-align"),
                    ),
                renderHTML: (attributes) => ({
                    "data-rich-text-image-align":
                        getRichTextImageDataAttributes(attributes)[
                            "data-rich-text-image-align"
                        ],
                }),
            },
            imageCrop: {
                default: DEFAULT_RICH_TEXT_IMAGE_ATTRIBUTES.imageCrop,
                parseHTML: (element) =>
                    normalizeRichTextImageCrop(
                        element.getAttribute("data-rich-text-image-crop"),
                    ),
                renderHTML: (attributes) => ({
                    "data-rich-text-image-crop":
                        getRichTextImageDataAttributes(attributes)[
                            "data-rich-text-image-crop"
                        ],
                }),
            },
            imageLayout: {
                default: DEFAULT_RICH_TEXT_IMAGE_ATTRIBUTES.imageLayout,
                parseHTML: (element) =>
                    normalizeRichTextImageLayout(
                        element.getAttribute("data-rich-text-image-layout"),
                    ),
                renderHTML: (attributes) => ({
                    "data-rich-text-image-layout":
                        getRichTextImageDataAttributes(attributes)[
                            "data-rich-text-image-layout"
                        ],
                }),
            },
            imageCaption: {
                default: "",
                parseHTML: getImageCaptionFromElement,
                renderHTML: (attributes) => {
                    const imageCaption = normalizeRichTextImageTextAttribute(
                        attributes.imageCaption,
                    );
                    return imageCaption
                        ? {
                              [RICH_TEXT_IMAGE_CAPTION_ATTRIBUTE]: imageCaption,
                          }
                        : {};
                },
            },
        };
    },
});

const TextDirection = Extension.create({
    name: "richTextDirection",
    addGlobalAttributes() {
        return [
            {
                types: ["paragraph", "heading"],
                attributes: {
                    dir: {
                        default: null,
                        parseHTML: (element) => {
                            const value = element.getAttribute("dir");
                            return ["ltr", "rtl"].includes(value)
                                ? value
                                : null;
                        },
                        renderHTML: (attributes) =>
                            attributes.dir ? { dir: attributes.dir } : {},
                    },
                },
            },
        ];
    },
});

const extensions = [
    StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
    }),
    Underline,
    Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: { class: "text-link" },
    }),
    RichTextImage.configure({
        allowBase64: true,
        resize: {
            enabled: true,
            directions: [
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
            ],
            minWidth: 80,
            minHeight: 40,
            alwaysPreserveAspectRatio: true,
        },
    }),
    TextStyleKit,
    TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
    }),
    Subscript,
    Superscript,
    TextDirection,
];

const getImageInsertErrorMessage = (error) => {
    const responseData = error?.response?.data;
    return (
        responseData?.error ||
        responseData?.message ||
        error?.message ||
        "Could not insert the image. Please try again."
    );
};

const SCROLLABLE_OVERFLOW_VALUES = new Set(["auto", "scroll", "overlay"]);

const getNearestScrollTarget = (element) => {
    if (!element || typeof window === "undefined") {
        return null;
    }

    let currentElement = element.parentElement;
    while (currentElement && currentElement !== document.body) {
        const style = window.getComputedStyle(currentElement);
        const canScrollY =
            SCROLLABLE_OVERFLOW_VALUES.has(style.overflowY) ||
            SCROLLABLE_OVERFLOW_VALUES.has(style.overflow);
        if (
            canScrollY &&
            currentElement.scrollHeight > currentElement.clientHeight
        ) {
            return currentElement;
        }
        currentElement = currentElement.parentElement;
    }
    return window;
};

const getSelectedImageElement = (editor) => {
    if (!editor?.isActive("image")) {
        return null;
    }
    const node = editor.view.nodeDOM(editor.state.selection.from);
    if (node instanceof HTMLImageElement) return node;
    return node instanceof Element ? node.querySelector("img") : null;
};

const isElementVisible = (element, scrollTarget) => {
    if (!element || !scrollTarget) return false;
    const elementRect = element.getBoundingClientRect();
    const containerRect =
        scrollTarget === window
            ? {
                  top: 0,
                  left: 0,
                  bottom: window.innerHeight,
                  right: window.innerWidth,
              }
            : scrollTarget.getBoundingClientRect();
    return (
        elementRect.bottom > containerRect.top &&
        elementRect.top < containerRect.bottom &&
        elementRect.right > containerRect.left &&
        elementRect.left < containerRect.right
    );
};

export default function RichTextEditorImpl({
    value,
    onChange,
    placeholder,
    minHeight = 150,
    imageUploadUrl,
    onImageUploadError,
}) {
    const editorSurfaceRef = React.useRef(null);
    const editorRef = React.useRef(null);
    const imageUploadUrlRef = React.useRef(imageUploadUrl);
    const onImageUploadErrorRef = React.useRef(onImageUploadError);
    const [, refreshToolbar] = React.useReducer((count) => count + 1, 0);
    const [uploadingImageCount, setUploadingImageCount] = React.useState(0);
    const [imageInsertError, setImageInsertError] = React.useState("");
    const [imageMenuVisible, setImageMenuVisible] = React.useState(true);
    const [imageMenuScrollTarget, setImageMenuScrollTarget] =
        React.useState(null);
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [linkDialog, setLinkDialog] = React.useState({
        open: false,
        value: EMPTY_LINK_VALUE,
        selectionText: "",
    });
    const [imageDialog, setImageDialog] = React.useState({
        open: false,
        mode: "insert",
        value: EMPTY_IMAGE_VALUE,
    });

    React.useEffect(() => {
        imageUploadUrlRef.current = imageUploadUrl;
        onImageUploadErrorRef.current = onImageUploadError;
    }, [imageUploadUrl, onImageUploadError]);

    React.useEffect(() => {
        if (!isFullscreen) return undefined;
        const onKeyDown = (event) => {
            if (event.key === "Escape") setIsFullscreen(false);
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [isFullscreen]);

    const resolveImageSource = React.useCallback(async (file) => {
        const uploadUrl = imageUploadUrlRef.current;
        if (!uploadUrl) return fileToDataUrl(file);

        const formData = new FormData();
        formData.append("file", file);
        const response = await axios.post(uploadUrl, formData);
        const uploadedUrl = getUploadedImageUrl(response.data);
        if (!uploadedUrl) {
            throw new Error("The upload completed without an image URL.");
        }
        return uploadedUrl;
    }, []);

    const insertImageFiles = React.useCallback(
        async (files) => {
            const imageFiles = files.filter(isImageFile);
            const currentEditor = editorRef.current;
            if (!currentEditor || imageFiles.length === 0) return;

            setImageInsertError("");
            setUploadingImageCount((count) => count + imageFiles.length);
            try {
                for (const file of imageFiles) {
                    const src = await resolveImageSource(file);
                    currentEditor
                        .chain()
                        .focus()
                        .setImage({
                            src,
                            alt:
                                file.name
                                    ?.replace(/\.[^.]+$/, "")
                                    .replace(/[-_]+/g, " ") || "Image",
                            decorative: false,
                            ...DEFAULT_RICH_TEXT_IMAGE_ATTRIBUTES,
                        })
                        .run();
                }
            } catch (error) {
                const message = getImageInsertErrorMessage(error);
                setImageInsertError(message);
                onImageUploadErrorRef.current?.(message, error);
            } finally {
                setUploadingImageCount((count) =>
                    Math.max(0, count - imageFiles.length),
                );
            }
        },
        [resolveImageSource],
    );

    const handlePaste = React.useCallback(
        (_view, event) => {
            const imageFiles = getImageFilesFromClipboard(event.clipboardData);
            if (imageFiles.length === 0) return false;
            event.preventDefault();
            void insertImageFiles(imageFiles);
            return true;
        },
        [insertImageFiles],
    );

    const editor = useEditor({
        extensions,
        content: value || "",
        onUpdate: ({ editor: currentEditor }) =>
            onChange?.(currentEditor.getHTML()),
        onSelectionUpdate: ({ editor: currentEditor }) => {
            setImageMenuVisible(currentEditor.isActive("image"));
            refreshToolbar();
        },
        onTransaction: refreshToolbar,
        editorProps: {
            handlePaste,
            attributes: {
                class: "rich-text-editor-content",
                style: `min-height: ${minHeight}px; outline: none; padding: 16px;`,
            },
        },
    });

    editorRef.current = editor;

    React.useLayoutEffect(() => {
        const target = getNearestScrollTarget(editorSurfaceRef.current);
        if (!target) return;
        setImageMenuScrollTarget((current) =>
            current?.target === target
                ? current
                : { target, key: (current?.key || 0) + 1 },
        );
    }, [editor, isFullscreen]);

    React.useEffect(() => {
        const scrollTarget = imageMenuScrollTarget?.target;
        if (!scrollTarget) return undefined;
        const onScroll = () => {
            const selected = getSelectedImageElement(editorRef.current);
            if (selected) {
                setImageMenuVisible(isElementVisible(selected, scrollTarget));
            }
        };
        scrollTarget.addEventListener("scroll", onScroll, { passive: true });
        return () => scrollTarget.removeEventListener("scroll", onScroll);
    }, [imageMenuScrollTarget]);

    React.useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || "");
        }
    }, [editor, value]);

    if (!editor) return null;

    const openLinkDialog = () => {
        const { from, to } = editor.state.selection;
        const selectionText = editor.state.doc.textBetween(from, to, " ");
        const attributes = editor.getAttributes("link");
        setLinkDialog({
            open: true,
            selectionText,
            value: {
                href: attributes.href || "",
                text: selectionText,
                title: attributes.title || "",
                target: attributes.target || "",
                isExisting: editor.isActive("link"),
            },
        });
    };

    const saveLink = ({ href, text, title, target }) => {
        const attributes = {
            href,
            title: title || null,
            target: target || null,
            rel: target === "_blank" ? "noopener noreferrer" : null,
        };
        const replacementText = text || linkDialog.selectionText;
        if (replacementText && replacementText !== linkDialog.selectionText) {
            editor
                .chain()
                .focus()
                .deleteSelection()
                .insertContent({
                    type: "text",
                    text: replacementText,
                    marks: [{ type: "link", attrs: attributes }],
                })
                .run();
        } else {
            let command = editor.chain().focus();
            if (editor.isActive("link")) {
                command = command.extendMarkRange("link");
            }
            command.setLink(attributes).run();
        }
        setLinkDialog((current) => ({ ...current, open: false }));
    };

    const removeLink = () => {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
        setLinkDialog((current) => ({ ...current, open: false }));
    };

    const activeImageAttributes = {
        ...normalizeRichTextImageAttributes(editor.getAttributes("image")),
        ...editor.getAttributes("image"),
    };
    const isImageSelected = editor.isActive("image");

    const openImageDialog = () => {
        const attrs = editor.getAttributes("image");
        setImageDialog({
            open: true,
            mode: isImageSelected ? "edit" : "insert",
            value: isImageSelected
                ? {
                      source: attrs.src || "",
                      alt: attrs.alt || "",
                      decorative: Boolean(attrs.decorative),
                      title: attrs.title || "",
                      caption: attrs.imageCaption || "",
                      width: attrs.width ? String(attrs.width) : "",
                      height: attrs.height ? String(attrs.height) : "",
                      lockAspectRatio: true,
                  }
                : EMPTY_IMAGE_VALUE,
        });
    };

    const saveImage = (attributes) => {
        if (imageDialog.mode === "edit" && isImageSelected) {
            editor.chain().focus().updateAttributes("image", attributes).run();
        } else {
            editor
                .chain()
                .focus()
                .setImage({
                    ...attributes,
                    ...DEFAULT_RICH_TEXT_IMAGE_ATTRIBUTES,
                })
                .run();
        }
        setImageDialog((current) => ({ ...current, open: false }));
    };

    const updateSelectedImage = (attributes) => {
        if (!isImageSelected) return;
        editor.chain().focus().updateAttributes("image", attributes).run();
    };

    const deleteSelectedImage = () => {
        if (!isImageSelected) return;
        editor.chain().focus().deleteSelection().run();
        setImageMenuVisible(false);
        setImageDialog((current) => ({ ...current, open: false }));
    };

    return (
        <>
            <Paper
                ref={editorSurfaceRef}
                variant="outlined"
                sx={{
                    borderRadius: isFullscreen ? 0 : 1,
                    overflow: "auto",
                    ...(isFullscreen && {
                        position: "fixed",
                        inset: 0,
                        zIndex: (theme) => theme.zIndex.modal + 1,
                        bgcolor: "background.paper",
                        display: "flex",
                        flexDirection: "column",
                    }),
                }}
            >
                <RichTextEditorToolbar
                    editor={editor}
                    onOpenLink={openLinkDialog}
                    onOpenImage={openImageDialog}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={() =>
                        setIsFullscreen((current) => !current)
                    }
                />
                {uploadingImageCount > 0 && <LinearProgress />}
                {imageInsertError && (
                    <Alert
                        severity="error"
                        onClose={() => setImageInsertError("")}
                        sx={{ borderRadius: 0 }}
                    >
                        {imageInsertError}
                    </Alert>
                )}
                {imageMenuScrollTarget && imageMenuVisible && (
                    <BubbleMenu
                        key={imageMenuScrollTarget.key}
                        editor={editor}
                        pluginKey="richTextImageControls"
                        updateDelay={0}
                        shouldShow={({ editor: currentEditor }) =>
                            currentEditor.isActive("image")
                        }
                        options={{
                            placement: "top",
                            offset: 12,
                            scrollTarget: imageMenuScrollTarget.target,
                        }}
                    >
                        <Paper
                            elevation={8}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.25,
                                p: 0.75,
                                borderRadius: 1.5,
                                border: 1,
                                borderColor: "divider",
                            }}
                        >
                            <ImageQuickControls
                                attributes={activeImageAttributes}
                                onUpdate={updateSelectedImage}
                                onEdit={openImageDialog}
                                onDelete={deleteSelectedImage}
                            />
                        </Paper>
                    </BubbleMenu>
                )}
                <Box
                    sx={(theme) => ({
                        bgcolor: "background.paper",
                        color: "text.primary",
                        flex: isFullscreen ? 1 : "initial",
                        overflow: isFullscreen ? "auto" : "visible",
                        "& .ProseMirror": {
                            ...richTextContentSx,
                            minHeight: isFullscreen
                                ? "calc(100vh - 112px)"
                                : minHeight,
                            "&:focus": { outline: "none" },
                            "& p": { margin: 0, marginBottom: "0.75em" },
                            "& h1, & h2, & h3": {
                                marginTop: "1em",
                                marginBottom: "0.5em",
                                color: "text.primary",
                            },
                            "& ul, & ol": {
                                paddingLeft: "1.75em",
                                marginBottom: "0.75em",
                            },
                            "& blockquote": {
                                borderLeft: `3px solid ${theme.palette.primary.main}`,
                                marginLeft: 0,
                                paddingLeft: "1em",
                                color: "text.secondary",
                            },
                            "& pre": {
                                bgcolor:
                                    theme.palette.mode === "dark"
                                        ? "grey.900"
                                        : "grey.100",
                                padding: "0.75em",
                                borderRadius: 1,
                                overflow: "auto",
                            },
                            "& code": {
                                bgcolor:
                                    theme.palette.mode === "dark"
                                        ? "grey.900"
                                        : "grey.100",
                                padding: "0.1em 0.3em",
                                borderRadius: "3px",
                                fontFamily: "monospace",
                            },
                            "& a": { color: "primary.main" },
                            "& img": { ...richTextImageSx, my: 1.5 },
                            [`& figure[${RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE}]`]: {
                                ...richTextImageFigureSx,
                                my: 1.5,
                            },
                            "& [data-resize-container]": {
                                justifyContent: "center",
                                maxWidth: "100%",
                                my: 1.5,
                            },
                            "& [data-resize-wrapper]": { maxWidth: "100%" },
                            "& [data-resize-wrapper] > img": {
                                display: "block",
                                maxWidth: "100%",
                                height: "auto",
                                m: 0,
                            },
                            "& [data-resize-handle]": {
                                width: 12,
                                height: 12,
                                bgcolor: "primary.main",
                                border: "2px solid",
                                borderColor: "background.paper",
                                borderRadius: "2px",
                                boxShadow: 1,
                            },
                            "& [data-resize-handle='top-left']": {
                                cursor: "nwse-resize",
                                transform: "translate(-50%, -50%)",
                            },
                            "& [data-resize-handle='top-right']": {
                                cursor: "nesw-resize",
                                transform: "translate(50%, -50%)",
                            },
                            "& [data-resize-handle='bottom-left']": {
                                cursor: "nesw-resize",
                                transform: "translate(-50%, 50%)",
                            },
                            "& [data-resize-handle='bottom-right']": {
                                cursor: "nwse-resize",
                                transform: "translate(50%, 50%)",
                            },
                            "& [data-resize-container].ProseMirror-selectednode [data-resize-wrapper]":
                                {
                                    outline: `2px solid ${theme.palette.primary.main}`,
                                    outlineOffset: 3,
                                },
                        },
                        "& .ProseMirror p.is-editor-empty:first-of-type::before":
                            {
                                content: `"${placeholder || "Start typing..."}"`,
                                color: "text.disabled",
                                float: "left",
                                pointerEvents: "none",
                                height: 0,
                            },
                    })}
                >
                    <EditorContent editor={editor} />
                </Box>
            </Paper>
            <RichTextLinkDialog
                open={linkDialog.open}
                initialValue={linkDialog.value}
                onClose={() =>
                    setLinkDialog((current) => ({ ...current, open: false }))
                }
                onSave={saveLink}
                onRemove={removeLink}
            />
            <RichTextImageDialog
                open={imageDialog.open}
                mode={imageDialog.mode}
                initialValue={imageDialog.value}
                resolveImageSource={resolveImageSource}
                onClose={() =>
                    setImageDialog((current) => ({ ...current, open: false }))
                }
                onSave={saveImage}
                onDelete={deleteSelectedImage}
            />
        </>
    );
}

export { LMS_RICH_TEXT_FONT_FAMILY, RICH_TEXT_IMAGE_DATA_ATTRIBUTE_NAMES };
