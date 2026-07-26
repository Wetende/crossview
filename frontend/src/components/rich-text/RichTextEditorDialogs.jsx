import React from "react";
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    Close,
    DeleteOutlineOutlined,
    InsertLink,
    LinkOff,
    Lock,
    LockOpen,
    UploadFile,
} from "@mui/icons-material";

import { normalizeImageSource, normalizeLinkUrl } from "./richTextEditorConfig";

const DialogCloseButton = ({ onClose }) => (
    <IconButton
        aria-label="Close dialog"
        onClick={onClose}
        sx={{ position: "absolute", right: 12, top: 12 }}
    >
        <Close />
    </IconButton>
);

export function RichTextLinkDialog({
    open,
    initialValue,
    onClose,
    onSave,
    onRemove,
}) {
    const [form, setForm] = React.useState(initialValue);
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        if (open) {
            setForm(initialValue);
            setError("");
        }
    }, [initialValue, open]);

    const update = (field) => (event) => {
        setForm((current) => ({ ...current, [field]: event.target.value }));
        setError("");
    };

    const submit = (event) => {
        event.preventDefault();
        const href = normalizeLinkUrl(form.href);
        if (!href) {
            setError(
                "Enter a valid web, email, telephone, anchor, or relative URL.",
            );
            return;
        }

        onSave({
            href,
            text: form.text.trim(),
            title: form.title.trim(),
            target: form.target,
        });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            slotProps={{
                paper: { component: "form", onSubmit: submit },
            }}
        >
            <DialogTitle sx={{ pr: 7 }}>Insert or edit link</DialogTitle>
            <DialogCloseButton onClose={onClose} />
            <DialogContent dividers>
                <Stack spacing={2.25}>
                    <TextField
                        autoFocus
                        required
                        fullWidth
                        label="URL"
                        value={form.href}
                        onChange={update("href")}
                        error={Boolean(error)}
                        helperText={
                            error ||
                            "Examples: https://example.com, /courses, mailto:name@example.com"
                        }
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <InsertLink fontSize="small" />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                    <TextField
                        fullWidth
                        label="Text to display"
                        value={form.text}
                        onChange={update("text")}
                        helperText="Leave unchanged to keep the selected text."
                    />
                    <TextField
                        fullWidth
                        label="Link title (optional)"
                        value={form.title}
                        onChange={update("title")}
                    />
                    <TextField
                        select
                        fullWidth
                        label="Open link in"
                        value={form.target}
                        onChange={update("target")}
                        slotProps={{ select: { native: true } }}
                    >
                        <option value="">Current window</option>
                        <option value="_blank">New window</option>
                    </TextField>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ justifyContent: "space-between", px: 3 }}>
                <Button
                    color="error"
                    startIcon={<LinkOff />}
                    onClick={onRemove}
                    disabled={!initialValue.isExisting}
                >
                    Remove link
                </Button>
                <Box>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained" sx={{ ml: 1 }}>
                        Save link
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
}

const parseDimension = (value) => {
    if (value === "") {
        return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed >= 40 && parsed <= 2400
        ? parsed
        : null;
};

export function RichTextImageDialog({
    open,
    mode,
    initialValue,
    resolveImageSource,
    onClose,
    onSave,
    onDelete,
}) {
    const [form, setForm] = React.useState(initialValue);
    const [file, setFile] = React.useState(null);
    const [error, setError] = React.useState("");
    const [saving, setSaving] = React.useState(false);
    const aspectRatioRef = React.useRef(1);

    React.useEffect(() => {
        if (!open) {
            return;
        }
        setForm(initialValue);
        setFile(null);
        setError("");
        setSaving(false);
        const width = Number(initialValue.width);
        const height = Number(initialValue.height);
        aspectRatioRef.current = width > 0 && height > 0 ? width / height : 1;
    }, [initialValue, open]);

    const update = (field) => (event) => {
        const value =
            event.target.type === "checkbox"
                ? event.target.checked
                : event.target.value;
        setForm((current) => ({ ...current, [field]: value }));
        setError("");
    };

    const updateDimension = (field) => (event) => {
        const value = event.target.value.replace(/[^\d]/g, "");
        setForm((current) => {
            if (!current.lockAspectRatio || !value) {
                return { ...current, [field]: value };
            }
            const numeric = Number(value);
            const otherField = field === "width" ? "height" : "width";
            const otherValue =
                field === "width"
                    ? Math.round(numeric / aspectRatioRef.current)
                    : Math.round(numeric * aspectRatioRef.current);
            return {
                ...current,
                [field]: value,
                [otherField]: String(otherValue),
            };
        });
        setError("");
    };

    const handleFile = (event) => {
        const selectedFile = event.target.files?.[0] || null;
        setFile(selectedFile);
        setError("");
        if (!selectedFile) {
            return;
        }

        setForm((current) => ({
            ...current,
            source: "",
            alt:
                current.alt ||
                selectedFile.name
                    .replace(/\.[^.]+$/, "")
                    .replace(/[-_]+/g, " "),
        }));

        const objectUrl = URL.createObjectURL(selectedFile);
        const image = new window.Image();
        image.onload = () => {
            aspectRatioRef.current =
                image.naturalWidth / Math.max(1, image.naturalHeight);
            setForm((current) => ({
                ...current,
                width: current.width || String(image.naturalWidth),
                height: current.height || String(image.naturalHeight),
            }));
            URL.revokeObjectURL(objectUrl);
        };
        image.onerror = () => URL.revokeObjectURL(objectUrl);
        image.src = objectUrl;
    };

    const submit = async (event) => {
        event.preventDefault();
        if (!form.decorative && !form.alt.trim()) {
            setError("Add alternative text, or mark the image as decorative.");
            return;
        }

        const width = parseDimension(form.width);
        const height = parseDimension(form.height);
        if ((form.width && !width) || (form.height && !height)) {
            setError("Image dimensions must be between 40 and 2400 pixels.");
            return;
        }

        setSaving(true);
        try {
            const source = file
                ? await resolveImageSource(file)
                : normalizeImageSource(form.source);
            if (!source) {
                setError("Choose an image file or enter a valid image URL.");
                setSaving(false);
                return;
            }

            onSave({
                src: source,
                alt: form.decorative ? "" : form.alt.trim(),
                decorative: form.decorative,
                title: form.title.trim() || null,
                imageCaption: form.caption.trim(),
                width,
                height,
            });
        } catch (uploadError) {
            setError(
                uploadError?.message ||
                    "Could not upload the image. Please try again.",
            );
            setSaving(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={saving ? undefined : onClose}
            fullWidth
            maxWidth="sm"
            slotProps={{
                paper: { component: "form", onSubmit: submit },
            }}
        >
            <DialogTitle sx={{ pr: 7 }}>
                {mode === "edit" ? "Edit image" : "Insert image"}
            </DialogTitle>
            <DialogCloseButton onClose={onClose} />
            <DialogContent dividers>
                <Stack spacing={2.25}>
                    <Button
                        component="label"
                        variant="outlined"
                        startIcon={<UploadFile />}
                        sx={{ alignSelf: "flex-start" }}
                    >
                        {file ? "Choose another file" : "Upload image"}
                        <input
                            hidden
                            type="file"
                            accept="image/*"
                            onChange={handleFile}
                        />
                    </Button>
                    {file && (
                        <Typography variant="body2" color="text.secondary">
                            Selected: {file.name}
                        </Typography>
                    )}
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ my: -1 }}
                    >
                        or
                    </Typography>
                    <TextField
                        fullWidth
                        label="Image URL"
                        value={form.source}
                        onChange={update("source")}
                        disabled={Boolean(file)}
                        placeholder="https://example.com/image.jpg"
                    />
                    <TextField
                        required={!form.decorative}
                        fullWidth
                        label="Alternative description"
                        value={form.alt}
                        onChange={update("alt")}
                        disabled={form.decorative}
                        helperText="Describe the image’s purpose for learners using screen readers."
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={form.decorative}
                                onChange={update("decorative")}
                            />
                        }
                        label="This image is decorative"
                    />
                    <TextField
                        fullWidth
                        label="Image title (optional)"
                        value={form.title}
                        onChange={update("title")}
                    />
                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        label="Caption (optional)"
                        value={form.caption}
                        onChange={update("caption")}
                    />
                    <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{ alignItems: "center" }}
                    >
                        <TextField
                            fullWidth
                            label="Width"
                            value={form.width}
                            onChange={updateDimension("width")}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            px
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                        <Tooltip
                            title={
                                form.lockAspectRatio
                                    ? "Aspect ratio locked"
                                    : "Aspect ratio unlocked"
                            }
                        >
                            <IconButton
                                onClick={() =>
                                    setForm((current) => ({
                                        ...current,
                                        lockAspectRatio:
                                            !current.lockAspectRatio,
                                    }))
                                }
                                aria-label={
                                    form.lockAspectRatio
                                        ? "Unlock aspect ratio"
                                        : "Lock aspect ratio"
                                }
                            >
                                {form.lockAspectRatio ? <Lock /> : <LockOpen />}
                            </IconButton>
                        </Tooltip>
                        <TextField
                            fullWidth
                            label="Height"
                            value={form.height}
                            onChange={updateDimension("height")}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            px
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Stack>
                    {error && (
                        <Typography color="error" variant="body2" role="alert">
                            {error}
                        </Typography>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ justifyContent: "space-between", px: 3 }}>
                <Button
                    color="error"
                    startIcon={<DeleteOutlineOutlined />}
                    onClick={onDelete}
                    disabled={mode !== "edit" || saving}
                >
                    Delete image
                </Button>
                <Box>
                    <Button onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        sx={{ ml: 1 }}
                        disabled={saving}
                    >
                        {saving
                            ? "Saving…"
                            : mode === "edit"
                              ? "Save image"
                              : "Insert image"}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
}
