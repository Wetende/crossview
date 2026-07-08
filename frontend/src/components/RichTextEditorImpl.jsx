import React from "react";
import axios from "axios";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import {
    Alert,
    Box,
    LinearProgress,
    Paper,
    IconButton,
    Divider,
    Tooltip,
} from "@mui/material";
import {
    FormatBold,
    FormatItalic,
    FormatUnderlined,
    StrikethroughS,
    FormatListBulleted,
    FormatListNumbered,
    FormatQuote,
    Code as CodeIcon,
    InsertLink,
    InsertPhoto,
    Undo,
    Redo,
    PhotoSizeSelectSmall,
    PhotoSizeSelectLarge,
    FitScreen,
    FormatAlignLeft,
    FormatAlignCenter,
    Crop169,
    ViewColumn,
    ViewStream,
} from "@mui/icons-material";
import {
    DEFAULT_RICH_TEXT_IMAGE_ATTRIBUTES,
    RICH_TEXT_IMAGE_ALIGNS,
    RICH_TEXT_IMAGE_CROPS,
    RICH_TEXT_IMAGE_LAYOUTS,
    RICH_TEXT_IMAGE_SIZES,
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
    richTextImageSx,
} from "@/utils/richTextImages";

const MenuButton = ({ onClick, active, disabled, icon, title }) => (
    <Tooltip title={title} arrow>
        <span>
            <IconButton
                size="small"
                onClick={onClick}
                disabled={disabled}
                sx={{
                    color: active ? "primary.main" : "text.secondary",
                    bgcolor: active ? "primary.lighter" : "transparent",
                    "&:hover": {
                        bgcolor: active ? "primary.lighter" : "action.hover",
                    },
                    borderRadius: 1,
                    p: 0.5,
                }}
            >
                {icon}
            </IconButton>
        </span>
    </Tooltip>
);

const RichTextImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
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
        };
    },
});

const IMAGE_SIZE_CONTROLS = [
    {
        value: RICH_TEXT_IMAGE_SIZES.SMALL,
        title: "Small image",
        icon: <PhotoSizeSelectSmall fontSize="small" />,
    },
    {
        value: RICH_TEXT_IMAGE_SIZES.MEDIUM,
        title: "Medium image",
        icon: <PhotoSizeSelectLarge fontSize="small" />,
    },
    {
        value: RICH_TEXT_IMAGE_SIZES.FULL,
        title: "Full width image",
        icon: <FitScreen fontSize="small" />,
    },
];

const IMAGE_ALIGN_CONTROLS = [
    {
        value: RICH_TEXT_IMAGE_ALIGNS.LEFT,
        title: "Align image left",
        icon: <FormatAlignLeft fontSize="small" />,
    },
    {
        value: RICH_TEXT_IMAGE_ALIGNS.CENTER,
        title: "Align image center",
        icon: <FormatAlignCenter fontSize="small" />,
    },
];

const IMAGE_LAYOUT_CONTROLS = [
    {
        value: RICH_TEXT_IMAGE_LAYOUTS.STACKED,
        title: "Place image on its own line",
        icon: <ViewStream fontSize="small" />,
    },
    {
        value: RICH_TEXT_IMAGE_LAYOUTS.INLINE,
        title: "Place image on the same line",
        icon: <ViewColumn fontSize="small" />,
    },
];

const ImageControls = ({
    activeImageAttributes,
    onUpdateImage,
    onToggleCrop,
}) => (
    <>
        {IMAGE_SIZE_CONTROLS.map((option) => (
            <MenuButton
                key={option.value}
                onClick={() =>
                    onUpdateImage({
                        imageSize: option.value,
                    })
                }
                active={activeImageAttributes.imageSize === option.value}
                icon={option.icon}
                title={option.title}
            />
        ))}

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {IMAGE_ALIGN_CONTROLS.map((option) => (
            <MenuButton
                key={option.value}
                onClick={() =>
                    onUpdateImage({
                        imageAlign: option.value,
                    })
                }
                active={activeImageAttributes.imageAlign === option.value}
                icon={option.icon}
                title={option.title}
            />
        ))}

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {IMAGE_LAYOUT_CONTROLS.map((option) => (
            <MenuButton
                key={option.value}
                onClick={() =>
                    onUpdateImage({
                        imageLayout: option.value,
                        imageSize:
                            option.value === RICH_TEXT_IMAGE_LAYOUTS.INLINE
                                ? RICH_TEXT_IMAGE_SIZES.SMALL
                                : activeImageAttributes.imageSize,
                    })
                }
                active={activeImageAttributes.imageLayout === option.value}
                icon={option.icon}
                title={option.title}
            />
        ))}

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        <MenuButton
            onClick={onToggleCrop}
            active={activeImageAttributes.imageCrop === RICH_TEXT_IMAGE_CROPS.COVER}
            icon={<Crop169 fontSize="small" />}
            title="Crop image to 16:9"
        />
    </>
);

const extensions = [
    StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
    }),
    Underline,
    Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-link" },
    }),
    RichTextImage,
];

const getImageInsertErrorMessage = (error) => {
    const responseData = error?.response?.data;
    if (typeof responseData?.error === "string") {
        return responseData.error;
    }
    if (typeof responseData?.message === "string") {
        return responseData.message;
    }
    if (typeof error?.message === "string") {
        return error.message;
    }
    return "Could not insert the image. Please try again.";
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

        if (canScrollY && currentElement.scrollHeight > currentElement.clientHeight) {
            return currentElement;
        }

        currentElement = currentElement.parentElement;
    }

    return window;
};

const getSelectedImageElement = (currentEditor) => {
    if (!currentEditor?.isActive("image")) {
        return null;
    }

    const selectedNode = currentEditor.view.nodeDOM(
        currentEditor.state.selection.from,
    );

    if (selectedNode instanceof HTMLImageElement) {
        return selectedNode;
    }

    if (selectedNode instanceof Element) {
        return selectedNode.matches("img")
            ? selectedNode
            : selectedNode.querySelector("img");
    }

    return null;
};

const isElementVisibleInScrollTarget = (element, scrollTarget) => {
    if (!element || !scrollTarget) {
        return false;
    }

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
    const imageInputRef = React.useRef(null);
    const editorSurfaceRef = React.useRef(null);
    const editorRef = React.useRef(null);
    const imageUploadUrlRef = React.useRef(imageUploadUrl);
    const onImageUploadErrorRef = React.useRef(onImageUploadError);
    const imageMenuScrollTargetRef = React.useRef(null);
    const [, refreshToolbar] = React.useReducer((value) => value + 1, 0);
    const [uploadingImageCount, setUploadingImageCount] = React.useState(0);
    const [imageInsertError, setImageInsertError] = React.useState("");
    const [imageMenuVisible, setImageMenuVisible] = React.useState(true);
    const [imageMenuScrollTarget, setImageMenuScrollTarget] =
        React.useState(null);

    React.useEffect(() => {
        imageUploadUrlRef.current = imageUploadUrl;
    }, [imageUploadUrl]);

    React.useEffect(() => {
        onImageUploadErrorRef.current = onImageUploadError;
    }, [onImageUploadError]);

    const resolveImageSource = React.useCallback(async (file) => {
        const uploadUrl = imageUploadUrlRef.current;
        if (!uploadUrl) {
            return fileToDataUrl(file);
        }

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
            if (!currentEditor || imageFiles.length === 0) {
                return;
            }

            setImageInsertError("");
            setUploadingImageCount((count) => count + imageFiles.length);

            try {
                let insertAfterSelection =
                    currentEditor.isActive("image")
                        ? currentEditor.state.selection.to
                        : null;
                const selectedImageAttributes = normalizeRichTextImageAttributes(
                    currentEditor.getAttributes("image"),
                );

                for (const file of imageFiles) {
                    const src = await resolveImageSource(file);
                    const imageAttributes = {
                        src,
                        alt: file.name || "Image",
                        ...DEFAULT_RICH_TEXT_IMAGE_ATTRIBUTES,
                        ...(selectedImageAttributes.imageLayout ===
                        RICH_TEXT_IMAGE_LAYOUTS.INLINE
                            ? {
                                  imageLayout: RICH_TEXT_IMAGE_LAYOUTS.INLINE,
                                  imageSize:
                                      selectedImageAttributes.imageSize ===
                                      RICH_TEXT_IMAGE_SIZES.FULL
                                          ? RICH_TEXT_IMAGE_SIZES.SMALL
                                          : selectedImageAttributes.imageSize,
                                  imageAlign:
                                      selectedImageAttributes.imageAlign,
                                  imageCrop: selectedImageAttributes.imageCrop,
                              }
                            : {}),
                    };

                    if (insertAfterSelection !== null) {
                        currentEditor
                            .chain()
                            .focus()
                            .insertContentAt(insertAfterSelection, {
                                type: "image",
                                attrs: imageAttributes,
                            })
                            .run();
                        insertAfterSelection += 1;
                        continue;
                    }

                    currentEditor.chain().focus().setImage(imageAttributes).run();
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
            if (imageFiles.length === 0) {
                return false;
            }

            event.preventDefault();
            void insertImageFiles(imageFiles);
            return true;
        },
        [insertImageFiles],
    );

    const selectImageFromEvent = React.useCallback(
        (event, { preventDefault = true } = {}) => {
            const target = event.target;
            if (!(target instanceof Element)) {
                return false;
            }

            const imageElement = target.closest(".ProseMirror img");
            const currentEditor = editorRef.current;
            if (!imageElement || !currentEditor?.view.dom.contains(imageElement)) {
                return false;
            }

            if (preventDefault) {
                event.preventDefault();
            }
            const position = currentEditor.view.posAtDOM(imageElement, 0);
            currentEditor.chain().focus().setNodeSelection(position).run();
            setImageMenuVisible(true);
            return true;
        },
        [],
    );

    const refreshEditorToolbar = React.useCallback(({ editor: currentEditor }) => {
        setImageMenuVisible(currentEditor.isActive("image"));
        refreshToolbar();
    }, []);

    const editor = useEditor({
        extensions,
        content: value || "",
        onUpdate: ({ editor: currentEditor }) => {
            if (onChange) {
                onChange(currentEditor.getHTML());
            }
        },
        onSelectionUpdate: refreshEditorToolbar,
        onTransaction: refreshToolbar,
        editorProps: {
            handlePaste,
            handleDOMEvents: {
                click: (_view, event) =>
                    selectImageFromEvent(event, { preventDefault: false }),
                contextmenu: (_view, event) => selectImageFromEvent(event),
            },
            attributes: {
                class: "rich-text-editor-content",
                style: `min-height: ${minHeight}px; outline: none; padding: 16px;`,
            },
        },
    });

    if (editor) {
        editorRef.current = editor;
    }

    React.useLayoutEffect(() => {
        const nextScrollTarget = getNearestScrollTarget(editorSurfaceRef.current);
        if (!nextScrollTarget || imageMenuScrollTargetRef.current === nextScrollTarget) {
            return;
        }

        imageMenuScrollTargetRef.current = nextScrollTarget;
        setImageMenuScrollTarget((currentTarget) => ({
            target: nextScrollTarget,
            key: (currentTarget?.key || 0) + 1,
        }));
    }, [editor, minHeight, value]);

    React.useEffect(() => {
        const scrollTarget = imageMenuScrollTarget?.target;
        if (!scrollTarget) {
            return undefined;
        }

        const handleScroll = () => {
            const currentEditor = editorRef.current;
            const selectedImageElement = getSelectedImageElement(currentEditor);
            if (!selectedImageElement) {
                return;
            }

            setImageMenuVisible(
                isElementVisibleInScrollTarget(
                    selectedImageElement,
                    scrollTarget,
                ),
            );
        };

        scrollTarget.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            scrollTarget.removeEventListener("scroll", handleScroll);
        };
    }, [imageMenuScrollTarget]);

    React.useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || "");
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    const addLink = () => {
        const url = window.prompt("Enter URL:");
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    const addImage = () => {
        imageInputRef.current?.click();
    };

    const handleImageFileChange = (event) => {
        const imageFiles = Array.from(event.target.files || []).filter(
            isImageFile,
        );
        if (imageFiles.length === 0) {
            event.target.value = "";
            return;
        }

        void insertImageFiles(imageFiles);
        event.target.value = "";
    };

    const isImageSelected = editor.isActive("image");
    const activeImageAttributes = normalizeRichTextImageAttributes(
        editor.getAttributes("image"),
    );

    const updateSelectedImage = (attributes) => {
        if (!isImageSelected) {
            return;
        }

        editor
            .chain()
            .focus()
            .updateAttributes(
                "image",
                normalizeRichTextImageAttributes({
                    ...activeImageAttributes,
                    ...attributes,
                }),
            )
            .run();
    };

    const toggleImageCrop = () => {
        updateSelectedImage({
            imageCrop:
                activeImageAttributes.imageCrop === RICH_TEXT_IMAGE_CROPS.COVER
                    ? RICH_TEXT_IMAGE_CROPS.NONE
                    : RICH_TEXT_IMAGE_CROPS.COVER,
        });
    };

    return (
        <Paper
            ref={editorSurfaceRef}
            variant="outlined"
            sx={{ borderRadius: 1, overflow: "hidden" }}
        >
            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 0.5,
                    p: 1,
                    borderBottom: 1,
                    borderColor: "divider",
                    bgcolor: "background.neutral",
                }}
            >
                <MenuButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    icon={<Undo fontSize="small" />}
                    title="Undo"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    icon={<Redo fontSize="small" />}
                    title="Redo"
                />

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive("bold")}
                    icon={<FormatBold fontSize="small" />}
                    title="Bold (Ctrl+B)"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive("italic")}
                    icon={<FormatItalic fontSize="small" />}
                    title="Italic (Ctrl+I)"
                />
                <MenuButton
                    onClick={() =>
                        editor.chain().focus().toggleUnderline().run()
                    }
                    active={editor.isActive("underline")}
                    icon={<FormatUnderlined fontSize="small" />}
                    title="Underline (Ctrl+U)"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    active={editor.isActive("strike")}
                    icon={<StrikethroughS fontSize="small" />}
                    title="Strikethrough"
                />

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                <MenuButton
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                    active={editor.isActive("bulletList")}
                    icon={<FormatListBulleted fontSize="small" />}
                    title="Bullet List"
                />
                <MenuButton
                    onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                    }
                    active={editor.isActive("orderedList")}
                    icon={<FormatListNumbered fontSize="small" />}
                    title="Numbered List"
                />
                <MenuButton
                    onClick={() =>
                        editor.chain().focus().toggleBlockquote().run()
                    }
                    active={editor.isActive("blockquote")}
                    icon={<FormatQuote fontSize="small" />}
                    title="Quote"
                />
                <MenuButton
                    onClick={() =>
                        editor.chain().focus().toggleCodeBlock().run()
                    }
                    active={editor.isActive("codeBlock")}
                    icon={<CodeIcon fontSize="small" />}
                    title="Code Block"
                />

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                <MenuButton
                    onClick={addLink}
                    active={editor.isActive("link")}
                    icon={<InsertLink fontSize="small" />}
                    title="Insert Link"
                />
                <MenuButton
                    onClick={addImage}
                    icon={<InsertPhoto fontSize="small" />}
                    title="Insert Image"
                />

                {isImageSelected && (
                    <>
                        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                        <ImageControls
                            activeImageAttributes={activeImageAttributes}
                            onUpdateImage={updateSelectedImage}
                            onToggleCrop={toggleImageCrop}
                        />
                    </>
                )}
            </Box>

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
                        offset: 8,
                        scrollTarget: imageMenuScrollTarget.target,
                    }}
                >
                    <Paper
                        elevation={6}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            p: 0.75,
                            borderRadius: 1,
                            border: 1,
                            borderColor: "divider",
                            bgcolor: "background.paper",
                        }}
                    >
                        <ImageControls
                            activeImageAttributes={activeImageAttributes}
                            onUpdateImage={updateSelectedImage}
                            onToggleCrop={toggleImageCrop}
                        />
                    </Paper>
                </BubbleMenu>
            )}

            <Box
                sx={(theme) => ({
                    bgcolor: "background.paper",
                    color: "text.primary",
                    "& .ProseMirror": {
                        minHeight,
                        "&:focus": { outline: "none" },
                        "& p": { margin: 0, marginBottom: "0.5em" },
                        "& h1, & h2, & h3": {
                            marginTop: "1em",
                            marginBottom: "0.5em",
                            color: "text.primary",
                        },
                        "& ul, & ol": {
                            paddingLeft: "1.5em",
                            marginBottom: "0.5em",
                        },
                        "& blockquote": {
                            borderLeft: `3px solid ${theme.palette.divider}`,
                            marginLeft: 0,
                            paddingLeft: "1em",
                            color: "text.secondary",
                        },
                        "& pre": {
                            bgcolor:
                                theme.palette.mode === "dark"
                                    ? "grey.900"
                                    : "grey.100",
                            padding: "0.5em",
                            borderRadius: 1,
                            overflow: "auto",
                            color:
                                theme.palette.mode === "dark"
                                    ? "text.secondary"
                                    : "inherit",
                        },
                        "& code": {
                            bgcolor:
                                theme.palette.mode === "dark"
                                    ? "grey.900"
                                    : "grey.100",
                            padding: "0.1em 0.3em",
                            borderRadius: "3px",
                            fontFamily: "monospace",
                            color:
                                theme.palette.mode === "dark"
                                    ? "secondary.main"
                                    : "inherit",
                        },
                        "& a": { color: "primary.main" },
                        "& img": { ...richTextImageSx, my: 1.5 },
                        "& img.ProseMirror-selectednode": {
                            outline: `2px solid ${theme.palette.primary.main}`,
                            outlineOffset: 2,
                        },
                    },
                    "& .ProseMirror p.is-editor-empty:first-child::before": {
                        content: `"${placeholder || "Start typing..."}"`,
                        color: "text.disabled",
                        float: "left",
                        pointerEvents: "none",
                        height: 0,
                    },
                })}
            >
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleImageFileChange}
                />
                <EditorContent editor={editor} />
            </Box>
        </Paper>
    );
}
