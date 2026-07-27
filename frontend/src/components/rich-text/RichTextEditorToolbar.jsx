import React from "react";
import {
    Box,
    ButtonBase,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Select,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    BorderColor,
    Code as CodeIcon,
    Crop169,
    Delete as DeleteIcon,
    FormatAlignCenter,
    FormatAlignLeft,
    FormatAlignRight,
    FormatBold,
    FormatClear,
    FormatColorText,
    FormatItalic,
    FormatLineSpacing,
    FormatListBulleted,
    FormatListNumbered,
    FormatQuote,
    FormatTextdirectionLToR,
    FormatTextdirectionRToL,
    FormatUnderlined,
    Fullscreen,
    FullscreenExit,
    InsertLink,
    InsertPhoto,
    Redo,
    Remove,
    StrikethroughS,
    Subscript,
    Superscript,
    Undo,
    ViewColumn,
    ViewStream,
} from "@mui/icons-material";

import {
    RICH_TEXT_BACKGROUND_COLORS,
    RICH_TEXT_COLORS,
    RICH_TEXT_FONT_OPTIONS,
    RICH_TEXT_FONT_SIZES,
    RICH_TEXT_LINE_HEIGHTS,
    getActiveFontSize,
    getAdjacentFontSize,
} from "./richTextEditorConfig";
import {
    RICH_TEXT_IMAGE_CROPS,
    RICH_TEXT_IMAGE_LAYOUTS,
    RICH_TEXT_IMAGE_SIZES,
} from "@/utils/richTextImages";

export const ToolbarButton = ({
    onClick,
    active,
    disabled,
    icon,
    title,
    tone,
}) => (
    <Tooltip title={title} arrow>
        <span>
            <IconButton
                size="small"
                onClick={onClick}
                disabled={disabled}
                aria-label={title}
                aria-pressed={active || undefined}
                sx={{
                    width: 34,
                    height: 34,
                    color:
                        tone === "danger"
                            ? "error.main"
                            : active
                              ? "primary.main"
                              : "text.secondary",
                    bgcolor: active ? "primary.lighter" : "transparent",
                    borderRadius: 1,
                    "&:hover": {
                        bgcolor:
                            tone === "danger"
                                ? "error.lighter"
                                : active
                                  ? "primary.lighter"
                                  : "action.hover",
                    },
                }}
            >
                {icon}
            </IconButton>
        </span>
    </Tooltip>
);

const ToolbarDivider = () => (
    <Divider
        orientation="vertical"
        flexItem
        sx={{ mx: 0.25, height: 26, alignSelf: "center" }}
    />
);

const TEXT_BLOCK_FORMATS = [
    { value: "paragraph", label: "Paragraph" },
    { value: "heading2", label: "Heading 2" },
    { value: "heading3", label: "Heading 3" },
];

const getActiveBlockFormat = (editor) => {
    if (editor.isActive("heading", { level: 2 })) return "heading2";
    if (editor.isActive("heading", { level: 3 })) return "heading3";
    return "paragraph";
};

const CompactSelect = ({ title, value, onChange, children, sx }) => (
    <Tooltip title={title} arrow>
        <Select
            size="small"
            value={value}
            onChange={onChange}
            variant="outlined"
            displayEmpty
            inputProps={{ "aria-label": title }}
            sx={{
                height: 34,
                borderRadius: 1,
                color: "text.secondary",
                bgcolor: "background.paper",
                "& .MuiSelect-select": {
                    py: 0.5,
                    pl: 1,
                    pr: 3.5,
                    fontSize: 13,
                    fontWeight: 600,
                },
                ...sx,
            }}
        >
            {children}
        </Select>
    </Tooltip>
);

const ColorMenu = ({ editor, kind }) => {
    const [anchor, setAnchor] = React.useState(null);
    const isText = kind === "text";
    const colors = isText ? RICH_TEXT_COLORS : RICH_TEXT_BACKGROUND_COLORS;
    const activeColor =
        editor.getAttributes("textStyle")[
            isText ? "color" : "backgroundColor"
        ] || "";

    const applyColor = (value) => {
        const chain = editor.chain().focus();
        if (isText) {
            value ? chain.setColor(value).run() : chain.unsetColor().run();
        } else {
            value
                ? chain.setBackgroundColor(value).run()
                : chain.unsetBackgroundColor().run();
        }
        setAnchor(null);
    };

    return (
        <>
            <ToolbarButton
                onClick={(event) => setAnchor(event.currentTarget)}
                active={Boolean(activeColor)}
                icon={
                    isText ? (
                        <FormatColorText fontSize="small" />
                    ) : (
                        <BorderColor fontSize="small" />
                    )
                }
                title={isText ? "Text color" : "Highlight color"}
            />
            <Menu
                anchorEl={anchor}
                open={Boolean(anchor)}
                onClose={() => setAnchor(null)}
                MenuListProps={{
                    "aria-label": isText
                        ? "Choose text color"
                        : "Choose highlight color",
                    sx: { p: 1 },
                }}
            >
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 34px)",
                        gap: 0.75,
                    }}
                >
                    {colors.map((color) => (
                        <Tooltip title={color.label} key={color.value}>
                            <ButtonBase
                                aria-label={color.label}
                                onClick={() => applyColor(color.value)}
                                sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 1,
                                    bgcolor: color.value,
                                    border: 2,
                                    borderColor:
                                        activeColor === color.value
                                            ? "primary.main"
                                            : "divider",
                                    boxShadow:
                                        activeColor === color.value
                                            ? "0 0 0 2px currentColor"
                                            : "none",
                                }}
                            />
                        </Tooltip>
                    ))}
                </Box>
                <Divider sx={{ my: 1 }} />
                <MenuItem onClick={() => applyColor("")}>
                    <FormatClear fontSize="small" sx={{ mr: 1 }} />
                    Reset color
                </MenuItem>
            </Menu>
        </>
    );
};

const FontSizeControls = ({ editor }) => {
    const currentSize = getActiveFontSize(editor);
    const setSize = (size) => {
        const chain = editor.chain().focus();
        if (size === 16) {
            chain.unsetFontSize().run();
        } else {
            chain.setFontSize(`${size}px`).run();
        }
    };

    return (
        <Box sx={{ display: "flex", alignItems: "center" }}>
            <ToolbarButton
                onClick={() => setSize(getAdjacentFontSize(currentSize, -1))}
                disabled={currentSize === RICH_TEXT_FONT_SIZES[0]}
                icon={<Remove fontSize="small" />}
                title="Decrease font size"
            />
            <CompactSelect
                title="Font size"
                value={currentSize}
                onChange={(event) => setSize(event.target.value)}
                sx={{ width: 72 }}
            >
                {RICH_TEXT_FONT_SIZES.map((size) => (
                    <MenuItem key={size} value={size}>
                        {size}px
                    </MenuItem>
                ))}
            </CompactSelect>
            <ToolbarButton
                onClick={() => setSize(getAdjacentFontSize(currentSize, 1))}
                disabled={
                    currentSize ===
                    RICH_TEXT_FONT_SIZES[RICH_TEXT_FONT_SIZES.length - 1]
                }
                icon={
                    <Typography component="span" fontWeight={800}>
                        +
                    </Typography>
                }
                title="Increase font size"
            />
        </Box>
    );
};

const LineHeightMenu = ({ editor }) => {
    const [anchor, setAnchor] = React.useState(null);
    const active = editor.getAttributes("textStyle").lineHeight || "1.75";

    return (
        <>
            <ToolbarButton
                onClick={(event) => setAnchor(event.currentTarget)}
                active={active !== "1.75"}
                icon={<FormatLineSpacing fontSize="small" />}
                title="Line spacing"
            />
            <Menu
                anchorEl={anchor}
                open={Boolean(anchor)}
                onClose={() => setAnchor(null)}
            >
                {RICH_TEXT_LINE_HEIGHTS.map((option) => (
                    <MenuItem
                        key={option.value}
                        selected={active === option.value}
                        onClick={() => {
                            const chain = editor.chain().focus();
                            option.value === "1.75"
                                ? chain.unsetLineHeight().run()
                                : chain.setLineHeight(option.value).run();
                            setAnchor(null);
                        }}
                    >
                        {option.label} ({option.value})
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export function RichTextEditorToolbar({
    editor,
    onOpenLink,
    onOpenImage,
    imageAttributes,
    onUpdateImage,
    onDeleteImage,
    isFullscreen,
    onToggleFullscreen,
}) {
    const isImageSelected = editor.isActive("image");
    const fontFamily = editor.getAttributes("textStyle").fontFamily || "";
    const direction =
        editor.getAttributes("paragraph").dir ||
        editor.getAttributes("heading").dir ||
        "ltr";
    const setDirection = (value) => {
        const nodeType = editor.isActive("heading") ? "heading" : "paragraph";
        editor
            .chain()
            .focus()
            .updateAttributes(nodeType, { dir: value })
            .run();
    };

    const clearFormatting = () => {
        editor
            .chain()
            .focus()
            .unsetAllMarks()
            .unsetTextAlign()
            .clearNodes()
            .run();
    };

    return (
        <Box
            role="toolbar"
            aria-label="Rich text formatting"
            sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 0.25,
                p: 1,
                borderBottom: 1,
                borderColor: "divider",
                bgcolor: "background.neutral",
            }}
        >
            <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                icon={<Undo fontSize="small" />}
                title="Undo"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                icon={<Redo fontSize="small" />}
                title="Redo"
            />
            <ToolbarDivider />
            <CompactSelect
                title="Block style"
                value={getActiveBlockFormat(editor)}
                onChange={(event) => {
                    const chain = editor.chain().focus();
                    if (event.target.value === "heading2") {
                        chain.setHeading({ level: 2 }).run();
                    } else if (event.target.value === "heading3") {
                        chain.setHeading({ level: 3 }).run();
                    } else {
                        chain.setParagraph().run();
                    }
                }}
                sx={{ width: 128 }}
            >
                {TEXT_BLOCK_FORMATS.map((format) => (
                    <MenuItem key={format.value} value={format.value}>
                        {format.label}
                    </MenuItem>
                ))}
            </CompactSelect>
            <CompactSelect
                title="Font family"
                value={fontFamily}
                onChange={(event) => {
                    const chain = editor.chain().focus();
                    event.target.value
                        ? chain.setFontFamily(event.target.value).run()
                        : chain.unsetFontFamily().run();
                }}
                sx={{ width: 158 }}
            >
                {RICH_TEXT_FONT_OPTIONS.map((font) => (
                    <MenuItem
                        key={font.label}
                        value={font.value}
                        sx={{ fontFamily: font.family }}
                    >
                        {font.shortLabel}
                    </MenuItem>
                ))}
            </CompactSelect>
            <FontSizeControls editor={editor} />
            <ToolbarDivider />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive("bold")}
                icon={<FormatBold fontSize="small" />}
                title="Bold (Ctrl+B)"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive("italic")}
                icon={<FormatItalic fontSize="small" />}
                title="Italic (Ctrl+I)"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                active={editor.isActive("underline")}
                icon={<FormatUnderlined fontSize="small" />}
                title="Underline (Ctrl+U)"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                active={editor.isActive("strike")}
                icon={<StrikethroughS fontSize="small" />}
                title="Strikethrough"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleSubscript().run()}
                active={editor.isActive("subscript")}
                icon={<Subscript fontSize="small" />}
                title="Subscript"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleSuperscript().run()}
                active={editor.isActive("superscript")}
                icon={<Superscript fontSize="small" />}
                title="Superscript"
            />
            <ColorMenu editor={editor} kind="text" />
            <ColorMenu editor={editor} kind="background" />
            <ToolbarDivider />
            <ToolbarButton
                onClick={onOpenLink}
                active={editor.isActive("link")}
                icon={<InsertLink fontSize="small" />}
                title="Insert or edit link (Ctrl+K)"
            />
            <ToolbarButton
                onClick={onOpenImage}
                active={isImageSelected}
                icon={<InsertPhoto fontSize="small" />}
                title={isImageSelected ? "Edit image details" : "Insert image"}
            />
            {isImageSelected && (
                <ImageToolbarActions
                    attributes={imageAttributes}
                    onUpdate={onUpdateImage}
                    onDelete={onDeleteImage}
                />
            )}
            <ToolbarDivider />
            {["left", "center", "right"].map((alignment) => {
                const Icon =
                    alignment === "center"
                        ? FormatAlignCenter
                        : alignment === "right"
                          ? FormatAlignRight
                          : FormatAlignLeft;
                return (
                    <ToolbarButton
                        key={alignment}
                        onClick={() => {
                            if (isImageSelected) {
                                onUpdateImage({ imageAlign: alignment });
                                return;
                            }
                            editor
                                .chain()
                                .focus()
                                .setTextAlign(alignment)
                                .run();
                        }}
                        active={
                            isImageSelected
                                ? imageAttributes.imageAlign === alignment
                                : editor.isActive({ textAlign: alignment })
                        }
                        icon={<Icon fontSize="small" />}
                        title={`Align ${isImageSelected ? "image " : ""}${alignment}`}
                    />
                );
            })}
            <LineHeightMenu editor={editor} />
            <ToolbarDivider />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive("bulletList")}
                icon={<FormatListBulleted fontSize="small" />}
                title="Bullet list"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={editor.isActive("orderedList")}
                icon={<FormatListNumbered fontSize="small" />}
                title="Numbered list"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                active={editor.isActive("blockquote")}
                icon={<FormatQuote fontSize="small" />}
                title="Quote"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                active={editor.isActive("codeBlock")}
                icon={<CodeIcon fontSize="small" />}
                title="Code block"
            />
            <ToolbarDivider />
            <ToolbarButton
                onClick={() => setDirection("ltr")}
                active={direction === "ltr"}
                icon={<FormatTextdirectionLToR fontSize="small" />}
                title="Left-to-right text"
            />
            <ToolbarButton
                onClick={() => setDirection("rtl")}
                active={direction === "rtl"}
                icon={<FormatTextdirectionRToL fontSize="small" />}
                title="Right-to-left text"
            />
            <ToolbarButton
                onClick={clearFormatting}
                icon={<FormatClear fontSize="small" />}
                title="Clear formatting"
            />
            <ToolbarButton
                onClick={onToggleFullscreen}
                active={isFullscreen}
                icon={
                    isFullscreen ? (
                        <FullscreenExit fontSize="small" />
                    ) : (
                        <Fullscreen fontSize="small" />
                    )
                }
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen editor"}
            />
        </Box>
    );
}

const ImageToolbarActions = ({ attributes, onUpdate, onDelete }) => {
    return (
        <>
            <ToolbarButton
                onClick={() =>
                    onUpdate({
                        imageLayout: RICH_TEXT_IMAGE_LAYOUTS.STACKED,
                    })
                }
                active={
                    attributes.imageLayout === RICH_TEXT_IMAGE_LAYOUTS.STACKED
                }
                icon={<ViewStream fontSize="small" />}
                title="Image on its own line"
            />
            <ToolbarButton
                onClick={() =>
                    onUpdate({
                        imageLayout: RICH_TEXT_IMAGE_LAYOUTS.INLINE,
                        imageSize: RICH_TEXT_IMAGE_SIZES.SMALL,
                    })
                }
                active={
                    attributes.imageLayout === RICH_TEXT_IMAGE_LAYOUTS.INLINE
                }
                icon={<ViewColumn fontSize="small" />}
                title="Place images side by side"
            />
            <ToolbarButton
                onClick={() =>
                    onUpdate({
                        imageCrop:
                            attributes.imageCrop === RICH_TEXT_IMAGE_CROPS.COVER
                                ? RICH_TEXT_IMAGE_CROPS.NONE
                                : RICH_TEXT_IMAGE_CROPS.COVER,
                    })
                }
                active={attributes.imageCrop === RICH_TEXT_IMAGE_CROPS.COVER}
                icon={<Crop169 fontSize="small" />}
                title="Crop image to 16:9"
            />
            <ToolbarButton
                onClick={onDelete}
                icon={<DeleteIcon fontSize="small" />}
                title="Delete image"
                tone="danger"
            />
        </>
    );
};
