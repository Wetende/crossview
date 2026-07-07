import React from "react";
import axios from "axios";
import { useEditor, EditorContent } from "@tiptap/react";
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
} from "@mui/icons-material";
import {
    fileToDataUrl,
    getImageFilesFromClipboard,
    getUploadedImageUrl,
    isImageFile,
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
    Image,
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

export default function RichTextEditorImpl({
    value,
    onChange,
    placeholder,
    minHeight = 150,
    imageUploadUrl,
    onImageUploadError,
}) {
    const imageInputRef = React.useRef(null);
    const editorRef = React.useRef(null);
    const imageUploadUrlRef = React.useRef(imageUploadUrl);
    const onImageUploadErrorRef = React.useRef(onImageUploadError);
    const [uploadingImageCount, setUploadingImageCount] = React.useState(0);
    const [imageInsertError, setImageInsertError] = React.useState("");

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
                for (const file of imageFiles) {
                    const src = await resolveImageSource(file);
                    currentEditor
                        .chain()
                        .focus()
                        .setImage({
                            src,
                            alt: file.name || "Image",
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
            if (imageFiles.length === 0) {
                return false;
            }

            event.preventDefault();
            void insertImageFiles(imageFiles);
            return true;
        },
        [insertImageFiles],
    );

    const editor = useEditor({
        extensions,
        content: value || "",
        onUpdate: ({ editor: currentEditor }) => {
            if (onChange) {
                onChange(currentEditor.getHTML());
            }
        },
        editorProps: {
            handlePaste,
            attributes: {
                class: "rich-text-editor-content",
                style: `min-height: ${minHeight}px; outline: none; padding: 16px;`,
            },
        },
    });

    if (editor) {
        editorRef.current = editor;
    }

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

    return (
        <Paper variant="outlined" sx={{ borderRadius: 1, overflow: "hidden" }}>
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
                        "& img": { maxWidth: "100%", height: "auto" },
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
