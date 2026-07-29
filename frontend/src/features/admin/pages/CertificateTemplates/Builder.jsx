import { useMemo, useRef, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    Box,
    Button,
    ButtonGroup,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Paper,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArticleIcon from "@mui/icons-material/Article";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import LayersIcon from "@mui/icons-material/Layers";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PreviewIcon from "@mui/icons-material/Preview";
import PublishIcon from "@mui/icons-material/Publish";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import RedoIcon from "@mui/icons-material/Redo";
import SaveIcon from "@mui/icons-material/Save";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import ShapeLineIcon from "@mui/icons-material/ShapeLine";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import UndoIcon from "@mui/icons-material/Undo";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";

import CertificateCanvas from "@/features/certifications/components/CertificateCanvas";
import DashboardLayout from "@/layouts/DashboardLayout";

const ELEMENT_LIBRARY = [
    { type: "text", label: "Text", icon: TextFieldsIcon, content: "Your text" },
    {
        type: "dynamic_text",
        label: "Student name",
        icon: PersonOutlineIcon,
        content: "{{student_name}}",
    },
    {
        type: "dynamic_text",
        label: "Course title",
        icon: SchoolOutlinedIcon,
        content: "{{program_title}}",
    },
    {
        type: "dynamic_text",
        label: "Issue date",
        icon: CalendarMonthIcon,
        content: "{{issue_date}}",
    },
    { type: "shape", label: "Shape", icon: ShapeLineIcon, content: "" },
    { type: "line", label: "Line", icon: HorizontalRuleIcon, content: "" },
    { type: "qr_code", label: "QR code", icon: QrCode2Icon, content: "" },
];

function makeElement(definition, widthMm, heightMm, index) {
    const isQr = definition.type === "qr_code";
    const isLine = definition.type === "line";
    const width = isQr ? 28 : isLine ? 70 : definition.type === "shape" ? 45 : 120;
    const height = isQr ? 28 : isLine ? 3 : definition.type === "shape" ? 35 : 18;
    return {
        id: `${definition.type}-${Date.now()}-${index}`,
        type: definition.type,
        x: Math.max(0, (widthMm - width) / 2),
        y: Math.max(0, (heightMm - height) / 2),
        width,
        height,
        rotation: 0,
        locked: false,
        hidden: false,
        zIndex: index + 1,
        content: definition.content,
        shape: definition.type === "shape" ? "rectangle" : undefined,
        styles:
            definition.type === "shape"
                ? { fill: "#3157d5", stroke: "transparent", strokeWidth: 1 }
                : definition.type === "line"
                  ? { stroke: "#3157d5", strokeWidth: 1 }
                  : {
                        fontFamily: "Albert Sans",
                        fontSize: definition.type === "dynamic_text" ? 22 : 16,
                        fontWeight: definition.type === "dynamic_text" ? 600 : 400,
                        color: "#172033",
                        textAlign: "center",
                        lineHeight: 1.2,
                        letterSpacing: 0,
                    },
    };
}

function PaletteButton({ item, onAdd }) {
    const Icon = item.icon;
    return (
        <Button
            color="inherit"
            onClick={() => onAdd(item)}
            sx={{
                justifyContent: "flex-start",
                px: 1.5,
                py: 1.25,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
            }}
            startIcon={<Icon fontSize="small" />}
        >
            {item.label}
        </Button>
    );
}

export default function CertificateTemplateBuilder({ template }) {
    const widthMm = Number(template.widthMm);
    const heightMm = Number(template.heightMm);
    const [name, setName] = useState(template.name);
    const [layout, setLayout] = useState(template.layout);
    const [selectedId, setSelectedId] = useState(null);
    const [past, setPast] = useState([]);
    const [future, setFuture] = useState([]);
    const [zoom, setZoom] = useState(0.82);
    const [processing, setProcessing] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [publishOpen, setPublishOpen] = useState(false);
    const canvasRef = useRef(null);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor),
    );

    const selected = useMemo(
        () => layout.elements.find((element) => element.id === selectedId) || null,
        [layout.elements, selectedId],
    );

    const commitLayout = (nextLayout) => {
        setPast((items) => [...items, layout].slice(-50));
        setLayout(nextLayout);
        setFuture([]);
    };

    const updateSelected = (updates) => {
        if (!selected) return;
        commitLayout({
            ...layout,
            elements: layout.elements.map((element) =>
                element.id === selected.id ? { ...element, ...updates } : element,
            ),
        });
    };

    const updateSelectedStyle = (key, value) => {
        if (!selected) return;
        updateSelected({
            styles: { ...(selected.styles || {}), [key]: value },
        });
    };

    const addElement = (definition) => {
        const element = makeElement(
            definition,
            widthMm,
            heightMm,
            layout.elements.length,
        );
        commitLayout({
            ...layout,
            elements: [...layout.elements, element],
        });
        setSelectedId(element.id);
    };

    const deleteSelected = () => {
        if (!selected) return;
        commitLayout({
            ...layout,
            elements: layout.elements.filter((element) => element.id !== selected.id),
        });
        setSelectedId(null);
    };

    const duplicateSelected = () => {
        if (!selected) return;
        const copy = {
            ...selected,
            id: `${selected.type}-${Date.now()}-copy`,
            x: Math.min(widthMm - selected.width, selected.x + 5),
            y: Math.min(heightMm - selected.height, selected.y + 5),
            zIndex: layout.elements.length + 1,
        };
        commitLayout({ ...layout, elements: [...layout.elements, copy] });
        setSelectedId(copy.id);
    };

    const undo = () => {
        if (!past.length) return;
        const previous = past[past.length - 1];
        setPast((items) => items.slice(0, -1));
        setFuture((items) => [layout, ...items].slice(0, 50));
        setLayout(previous);
    };

    const redo = () => {
        if (!future.length) return;
        const next = future[0];
        setFuture((items) => items.slice(1));
        setPast((items) => [...items, layout].slice(-50));
        setLayout(next);
    };

    const handleDragEnd = ({ active, delta }) => {
        const element = layout.elements.find((item) => item.id === active.id);
        const canvasWidth = canvasRef.current?.getBoundingClientRect().width;
        if (!element || !canvasWidth) return;
        const pixelsPerMm = canvasWidth / widthMm;
        const nextX = Math.min(
            widthMm - element.width,
            Math.max(0, element.x + delta.x / pixelsPerMm),
        );
        const nextY = Math.min(
            heightMm - element.height,
            Math.max(0, element.y + delta.y / pixelsPerMm),
        );
        updateSelectedPosition(element.id, nextX, nextY);
    };

    const updateSelectedPosition = (elementId, x, y) => {
        commitLayout({
            ...layout,
            elements: layout.elements.map((element) =>
                element.id === elementId
                    ? {
                          ...element,
                          x: Number(x.toFixed(2)),
                          y: Number(y.toFixed(2)),
                      }
                    : element,
            ),
        });
    };

    const submit = (action) => {
        setProcessing(true);
        router.post(
            `/admin/certificate-templates/${template.id}/${action}/`,
            { name: name.trim(), layout },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setPublishOpen(false);
                },
            },
        );
    };

    return (
        <DashboardLayout
            role="admin"
            breadcrumbs={[
                { label: "Certificate templates", href: "/admin/certificate-templates/" },
                { label: template.name },
            ]}
        >
            <Head title={`Edit ${template.name}`} />

            <Paper
                elevation={0}
                sx={{
                    mb: 2,
                    px: 2,
                    py: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2.5,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 1.5,
                }}
            >
                <Tooltip title="Back to templates">
                    <IconButton
                        component={Link}
                        href="/admin/certificate-templates/"
                        color="inherit"
                    >
                        <ArrowBackIcon />
                    </IconButton>
                </Tooltip>
                <TextField
                    variant="standard"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    inputProps={{ "aria-label": "Template name" }}
                    sx={{ minWidth: 220, flex: "1 1 260px" }}
                />
                <Chip
                    label={template.status}
                    size="small"
                    color={template.status === "published" ? "success" : "default"}
                    sx={{ textTransform: "capitalize" }}
                />
                <Divider orientation="vertical" flexItem />
                <ButtonGroup size="small" variant="outlined">
                    <Tooltip title="Undo">
                        <span>
                            <IconButton onClick={undo} disabled={!past.length}>
                                <UndoIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="Redo">
                        <span>
                            <IconButton onClick={redo} disabled={!future.length}>
                                <RedoIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                </ButtonGroup>
                <Button
                    startIcon={<PreviewIcon />}
                    color="inherit"
                    onClick={() => setPreviewOpen(true)}
                >
                    Preview
                </Button>
                <Button
                    startIcon={<SaveIcon />}
                    variant="outlined"
                    onClick={() => submit("save")}
                    disabled={processing || !name.trim()}
                >
                    Save
                </Button>
                <Button
                    startIcon={<PublishIcon />}
                    variant="contained"
                    onClick={() => setPublishOpen(true)}
                    disabled={processing || !name.trim()}
                >
                    Publish
                </Button>
            </Paper>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "230px minmax(0, 1fr) 270px" },
                    minHeight: 720,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                    overflow: "hidden",
                    bgcolor: "background.paper",
                }}
            >
                <Box
                    component="aside"
                    sx={{
                        p: 2,
                        borderRight: { lg: "1px solid" },
                        borderBottom: { xs: "1px solid", lg: 0 },
                        borderColor: "divider",
                    }}
                >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <AddIcon color="primary" />
                        <Typography fontWeight={700}>Add elements</Typography>
                    </Stack>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "repeat(2, 1fr)", lg: "1fr" },
                            gap: 1,
                        }}
                    >
                        {ELEMENT_LIBRARY.map((item) => (
                            <PaletteButton key={item.label} item={item} onAdd={addElement} />
                        ))}
                    </Box>
                    <Divider sx={{ my: 2.5 }} />
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <LayersIcon fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={700}>
                            Layers
                        </Typography>
                    </Stack>
                    <Stack spacing={0.5}>
                        {[...layout.elements].reverse().map((element) => (
                            <Button
                                key={element.id}
                                color={selectedId === element.id ? "primary" : "inherit"}
                                variant={selectedId === element.id ? "outlined" : "text"}
                                onClick={() => setSelectedId(element.id)}
                                sx={{
                                    justifyContent: "flex-start",
                                    textTransform: "none",
                                    overflow: "hidden",
                                }}
                            >
                                <Typography variant="caption" noWrap>
                                    {element.content || element.type.replace("_", " ")}
                                </Typography>
                            </Button>
                        ))}
                    </Stack>
                </Box>

                <Box
                    sx={{
                        minWidth: 0,
                        bgcolor: "#e9edf4",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Stack
                        direction="row"
                        justifyContent="center"
                        alignItems="center"
                        spacing={1}
                        sx={{ py: 1.25, borderBottom: "1px solid rgba(25,37,61,.08)" }}
                    >
                        <IconButton
                            size="small"
                            onClick={() => setZoom((value) => Math.max(0.45, value - 0.1))}
                        >
                            <ZoomOutIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="caption" sx={{ minWidth: 42, textAlign: "center" }}>
                            {Math.round(zoom * 100)}%
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() => setZoom((value) => Math.min(1.2, value + 0.1))}
                        >
                            <ZoomInIcon fontSize="small" />
                        </IconButton>
                        <Tooltip title="Fit canvas">
                            <IconButton size="small" onClick={() => setZoom(0.82)}>
                                <CenterFocusStrongIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                    <Box
                        sx={{
                            flex: 1,
                            overflow: "auto",
                            p: { xs: 3, xl: 6 },
                            display: "grid",
                            placeItems: "center",
                        }}
                    >
                        <Box
                            sx={{
                                width:
                                    template.orientation === "portrait"
                                        ? `${620 * zoom}px`
                                        : `${960 * zoom}px`,
                                maxWidth: "100%",
                            }}
                        >
                            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                                <CertificateCanvas
                                    ref={canvasRef}
                                    layout={layout}
                                    widthMm={widthMm}
                                    heightMm={heightMm}
                                    selectedId={selectedId}
                                    interactive
                                    onSelect={setSelectedId}
                                />
                            </DndContext>
                        </Box>
                    </Box>
                </Box>

                <Box
                    component="aside"
                    sx={{
                        p: 2,
                        borderLeft: { lg: "1px solid" },
                        borderTop: { xs: "1px solid", lg: 0 },
                        borderColor: "divider",
                    }}
                >
                    {selected ? (
                        <Stack spacing={2}>
                            <Box>
                                <Typography fontWeight={700}>Properties</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {selected.type.replace("_", " ")}
                                </Typography>
                            </Box>
                            {!["shape", "line", "qr_code"].includes(selected.type) && (
                                <TextField
                                    label="Content"
                                    multiline
                                    minRows={2}
                                    value={selected.content}
                                    onChange={(event) =>
                                        updateSelected({ content: event.target.value })
                                    }
                                    fullWidth
                                />
                            )}
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                    gap: 1,
                                }}
                            >
                                {[
                                    ["X", "x", widthMm - selected.width],
                                    ["Y", "y", heightMm - selected.height],
                                    ["Width", "width", widthMm - selected.x],
                                    ["Height", "height", heightMm - selected.y],
                                ].map(([label, key, maximum]) => (
                                    <TextField
                                        key={key}
                                        type="number"
                                        size="small"
                                        label={`${label} (mm)`}
                                        value={selected[key]}
                                        inputProps={{ min: key === "width" || key === "height" ? 1 : 0, max: maximum }}
                                        onChange={(event) =>
                                            updateSelected({
                                                [key]: Math.max(
                                                    key === "width" || key === "height" ? 1 : 0,
                                                    Math.min(maximum, Number(event.target.value)),
                                                ),
                                            })
                                        }
                                    />
                                ))}
                            </Box>
                            {!["shape", "line", "qr_code"].includes(selected.type) && (
                                <>
                                    <TextField
                                        type="number"
                                        size="small"
                                        label="Font size"
                                        value={selected.styles?.fontSize || 16}
                                        onChange={(event) =>
                                            updateSelectedStyle(
                                                "fontSize",
                                                Math.max(6, Number(event.target.value)),
                                            )
                                        }
                                    />
                                    <TextField
                                        type="color"
                                        size="small"
                                        label="Text colour"
                                        value={selected.styles?.color || "#172033"}
                                        onChange={(event) =>
                                            updateSelectedStyle("color", event.target.value)
                                        }
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <ToggleButtonGroup
                                        exclusive
                                        size="small"
                                        value={selected.styles?.textAlign || "center"}
                                        onChange={(_, value) =>
                                            value && updateSelectedStyle("textAlign", value)
                                        }
                                        fullWidth
                                    >
                                        <ToggleButton value="left">Left</ToggleButton>
                                        <ToggleButton value="center">Centre</ToggleButton>
                                        <ToggleButton value="right">Right</ToggleButton>
                                    </ToggleButtonGroup>
                                </>
                            )}
                            {selected.type === "shape" && (
                                <TextField
                                    type="color"
                                    size="small"
                                    label="Fill colour"
                                    value={selected.styles?.fill || "#3157d5"}
                                    onChange={(event) =>
                                        updateSelectedStyle("fill", event.target.value)
                                    }
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}
                            <Divider />
                            <Stack direction="row" spacing={1}>
                                <Button
                                    startIcon={<ContentCopyIcon />}
                                    onClick={duplicateSelected}
                                    size="small"
                                >
                                    Duplicate
                                </Button>
                                <Button
                                    startIcon={<DeleteOutlineIcon />}
                                    onClick={deleteSelected}
                                    color="error"
                                    size="small"
                                >
                                    Delete
                                </Button>
                            </Stack>
                        </Stack>
                    ) : (
                        <Stack spacing={1.5} alignItems="center" sx={{ py: 6, textAlign: "center" }}>
                            <ArticleIcon color="disabled" sx={{ fontSize: 42 }} />
                            <Typography fontWeight={700}>Select an element</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Click an item on the certificate to edit its content,
                                position and style.
                            </Typography>
                        </Stack>
                    )}
                </Box>
            </Box>

            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                fullWidth
                maxWidth="lg"
            >
                <DialogTitle>Certificate preview</DialogTitle>
                <DialogContent sx={{ bgcolor: "#e9edf4", p: { xs: 3, md: 6 } }}>
                    <CertificateCanvas
                        layout={layout}
                        widthMm={widthMm}
                        heightMm={heightMm}
                        sx={{
                            width: template.orientation === "portrait" ? "54%" : "100%",
                            mx: "auto",
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={publishOpen} onClose={() => setPublishOpen(false)}>
                <DialogTitle>Publish this certificate?</DialogTitle>
                <DialogContent>
                    <Typography color="text.secondary">
                        Publishing freezes version {template.version}. Later edits will
                        begin a new draft so issued certificates remain unchanged.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPublishOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        startIcon={<PublishIcon />}
                        onClick={() => submit("publish")}
                        disabled={processing}
                    >
                        {processing ? "Publishing…" : "Publish version"}
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}
