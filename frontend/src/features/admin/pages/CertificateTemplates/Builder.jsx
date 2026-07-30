import { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    Alert,
    Box,
    Button,
    ButtonGroup,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    InputLabel,
    IconButton,
    MenuItem,
    Paper,
    Select,
    Stack,
    Switch,
    Tab,
    Tabs,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PreviewIcon from "@mui/icons-material/Preview";
import PublishIcon from "@mui/icons-material/Publish";
import RedoIcon from "@mui/icons-material/Redo";
import SaveIcon from "@mui/icons-material/Save";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import UndoIcon from "@mui/icons-material/Undo";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";

import CertificateCanvas from "@/features/certifications/components/CertificateCanvas";
import {
    certificateSampleContent,
    fitCertificateText,
} from "@/features/certifications/certificateContent";
import DashboardLayout from "@/layouts/DashboardLayout";
import { getCsrfHeaders } from "@/utils/csrf";

import {
    ADDITIONAL_ELEMENT_GROUPS,
    ELEMENT_LIBRARY,
    PRIMARY_ELEMENT_GROUPS,
} from "./certificateElementLibrary";

const elementDisplayName = (element) => {
    if (element.name) return element.name;
    const matchingDefinition = ELEMENT_LIBRARY.find(
        (item) =>
            item.type === element.type &&
            item.content &&
            item.content === element.content,
    );
    if (matchingDefinition) return matchingDefinition.label;
    return element.type
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

function makeElement(definition, widthMm, heightMm, index) {
    const isQr = definition.type === "qr_code";
    const isLine = definition.type === "line";
    const isAsset = ["image", "signature"].includes(definition.type);
    let width = isQr
        ? 28
        : isLine
          ? 70
          : definition.type === "shape"
            ? 45
            : isAsset
              ? 48
              : 120;
    let height = isQr
        ? 28
        : isLine
          ? 3
          : definition.type === "shape"
            ? 35
            : isAsset
              ? 28
              : 18;
    let x = Math.max(0, (widthMm - width) / 2);
    let y = Math.max(0, (heightMm - height) / 2);
    let rotation = 0;
    if (definition.variant === "page-border") {
        width = Math.max(1, widthMm - 20);
        height = Math.max(1, heightMm - 20);
        x = 10;
        y = 10;
    }
    if (definition.variant === "watermark") {
        width = widthMm * 0.72;
        height = heightMm * 0.22;
        x = (widthMm - width) / 2;
        y = (heightMm - height) / 2;
        rotation = -28;
    }
    const textStyles = {
        fontFamily: "Albert Sans",
        fontSize: definition.type === "dynamic_text" ? 22 : 16,
        minFontSize: definition.type === "dynamic_text" ? 10 : 8,
        maxFontSize: definition.type === "dynamic_text" ? 22 : 16,
        autoShrink: definition.type === "dynamic_text",
        singleLine: false,
        textOverflow: "ellipsis",
        fontWeight: definition.type === "dynamic_text" ? 600 : 400,
        fontStyle: "normal",
        textDecoration: "none",
        textTransform: "none",
        color: "#172033",
        textAlign: "center",
        lineHeight: 1.2,
        letterSpacing: 0,
        opacity: 1,
    };
    const styles =
        definition.type === "shape"
            ? {
                  fill: "#3157d5",
                  stroke: "transparent",
                  strokeWidth: 1,
                  borderRadius: 0,
                  opacity: 1,
              }
            : definition.type === "line"
              ? { stroke: "#3157d5", strokeWidth: 1, opacity: 1 }
              : isAsset
                ? {
                      objectFit: "contain",
                      opacity: 1,
                      borderColor: "transparent",
                      borderWidth: 0,
                      borderRadius: 0,
                  }
                : isQr
                  ? {
                        foreground: "#172033",
                        background: "#ffffff",
                        errorCorrection: "M",
                        padding: 1.5,
                        borderColor: "transparent",
                        borderWidth: 0,
                    }
                  : textStyles;
    return {
        id: `${definition.type}-${Date.now()}-${index}`,
        name: definition.label,
        type: definition.type,
        x,
        y,
        width,
        height,
        rotation,
        locked: false,
        hidden: false,
        zIndex: index + 1,
        content: definition.content,
        assetUrl: definition.assetUrl,
        shape: definition.type === "shape" ? "rectangle" : undefined,
        styles: { ...styles, ...(definition.styles || {}) },
    };
}

function PaletteButton({ item, onAdd }) {
    const Icon = item.icon;
    return (
        <Button
            color="inherit"
            fullWidth
            disableRipple
            onClick={() => onAdd(item)}
            sx={{
                justifyContent: "flex-start",
                minHeight: 34,
                px: 0.5,
                py: 0.4,
                border: 0,
                borderRadius: 1.25,
                bgcolor: "transparent",
                color: "#354052",
                fontSize: "0.82rem",
                fontWeight: 550,
                lineHeight: 1.25,
                textTransform: "none",
                "&:hover": {
                    bgcolor: "#e8edf5",
                    color: "#172033",
                },
                "& .MuiButton-startIcon": {
                    ml: 0,
                    mr: 1.15,
                    color: "#66758b",
                },
                "& .MuiButton-startIcon svg": {
                    fontSize: 18,
                },
            }}
            startIcon={<Icon fontSize="small" />}
        >
            {item.label}
        </Button>
    );
}

function ElementPaletteGroup({ group, onAdd }) {
    const items = ELEMENT_LIBRARY.filter((item) => item.group === group);
    if (!items.length) return null;

    return (
        <Box>
            <Typography
                variant="overline"
                sx={{
                    display: "block",
                    mb: 0.45,
                    color: "#7b879a",
                    fontSize: "0.64rem",
                    fontWeight: 750,
                    letterSpacing: "0.055em",
                    lineHeight: 1.3,
                }}
            >
                {group}
            </Typography>
            <Stack spacing={0.1}>
                {items.map((item) => (
                    <PaletteButton
                        key={`${item.group}-${item.label}`}
                        item={item}
                        onAdd={onAdd}
                    />
                ))}
            </Stack>
        </Box>
    );
}

function CertificateRail({ templates, currentTemplateId, onCreate, onSelect }) {
    return (
        <Box
            component="aside"
            sx={{
                borderRight: { sm: "1px solid" },
                borderBottom: { xs: "1px solid", sm: 0 },
                borderColor: "divider",
                bgcolor: "#f5f7fb",
                minWidth: 0,
            }}
        >
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                    px: 1.5,
                    py: 1.25,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                }}
            >
                <Typography variant="subtitle2" fontWeight={800}>
                    Certificates{" "}
                    <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                    >
                        {templates.length}
                    </Typography>
                </Typography>
                <Tooltip title="Create certificate">
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={onCreate}
                        aria-label="Create certificate"
                    >
                        <AddIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>
            <Stack
                spacing={1}
                sx={{
                    p: 1,
                    maxHeight: { sm: "calc(100vh - 240px)" },
                    overflowY: "auto",
                }}
            >
                {templates.map((item) => {
                    const active = item.id === currentTemplateId;
                    return (
                        <Paper
                            key={item.id}
                            component="button"
                            type="button"
                            elevation={0}
                            aria-current={active ? "page" : undefined}
                            onClick={() => onSelect(item)}
                            sx={{
                                width: "100%",
                                p: 0,
                                overflow: "hidden",
                                textAlign: "left",
                                cursor: "pointer",
                                border: "2px solid",
                                borderColor: active
                                    ? "primary.main"
                                    : "divider",
                                borderRadius: 1.5,
                                bgcolor: "background.paper",
                                transition:
                                    "border-color 140ms ease, box-shadow 140ms ease",
                                "&:hover": {
                                    borderColor: "primary.main",
                                    boxShadow:
                                        "0 7px 20px rgba(25, 37, 61, .10)",
                                },
                                "&:focus-visible": {
                                    outline: "3px solid",
                                    outlineColor: "primary.light",
                                    outlineOffset: 2,
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    p: 0.75,
                                    height: 102,
                                    display: "grid",
                                    placeItems: "center",
                                    bgcolor: "#eef1f6",
                                    overflow: "hidden",
                                }}
                            >
                                <CertificateCanvas
                                    layout={item.layout}
                                    widthMm={item.widthMm}
                                    heightMm={item.heightMm}
                                    sx={{
                                        width:
                                            item.orientation === "portrait"
                                                ? "46%"
                                                : "100%",
                                        maxHeight: "100%",
                                        boxShadow:
                                            "0 4px 12px rgba(25, 37, 61, .12)",
                                    }}
                                />
                            </Box>
                            <Typography
                                variant="caption"
                                fontWeight={700}
                                noWrap
                                sx={{ display: "block", px: 1, py: 0.75 }}
                            >
                                {item.name}
                            </Typography>
                        </Paper>
                    );
                })}
            </Stack>
        </Box>
    );
}

function closestSnap(value, targets, threshold = 2) {
    const closest = targets.reduce(
        (closest, target) =>
            Math.abs(target - value) < Math.abs(closest - value)
                ? target
                : closest,
        value,
    );
    return Math.abs(closest - value) <= threshold ? closest : value;
}

function snapElementPosition({
    element,
    x,
    y,
    elements,
    widthMm,
    heightMm,
    safeAreaMm,
}) {
    const otherElements = elements.filter((item) => item.id !== element.id);
    const xTargets = [
        0,
        safeAreaMm,
        (widthMm - element.width) / 2,
        widthMm - safeAreaMm - element.width,
        widthMm - element.width,
    ];
    const yTargets = [
        0,
        safeAreaMm,
        (heightMm - element.height) / 2,
        heightMm - safeAreaMm - element.height,
        heightMm - element.height,
    ];
    otherElements.forEach((item) => {
        xTargets.push(
            item.x,
            item.x + item.width - element.width,
            item.x + item.width / 2 - element.width / 2,
        );
        yTargets.push(
            item.y,
            item.y + item.height - element.height,
            item.y + item.height / 2 - element.height / 2,
        );
    });
    return {
        x: closestSnap(Math.round(x), xTargets),
        y: closestSnap(Math.round(y), yTargets),
    };
}

export default function CertificateTemplateBuilder({
    template,
    templates = [],
}) {
    const widthMm = Number(template.widthMm);
    const heightMm = Number(template.heightMm);
    const [name, setName] = useState(template.name);
    const [layout, setLayout] = useState(template.layout);
    const [selectedId, setSelectedId] = useState(null);
    const [past, setPast] = useState([]);
    const [future, setFuture] = useState([]);
    const [zoom, setZoom] = useState(0.82);
    const [rightTab, setRightTab] = useState("elements");
    const [showAdditionalFields, setShowAdditionalFields] = useState(false);
    const [sampleProfile, setSampleProfile] = useState("standard");
    const [showSafeArea, setShowSafeArea] = useState(true);
    const [snapEnabled, setSnapEnabled] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [publishOpen, setPublishOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState(
        "Untitled certificate",
    );
    const [newTemplateOrientation, setNewTemplateOrientation] =
        useState("landscape");
    const canvasRef = useRef(null);
    const assetInputRef = useRef(null);
    const uploadModeRef = useRef("image");
    const uploadLayerNameRef = useRef("Image / logo");
    const replaceAssetIdRef = useRef(null);
    const initialDocument = useRef(
        JSON.stringify({ name: template.name, layout: template.layout }),
    );
    const isDirty =
        JSON.stringify({ name, layout }) !== initialDocument.current;
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor),
    );

    const selected = useMemo(
        () =>
            layout.elements.find((element) => element.id === selectedId) ||
            null,
        [layout.elements, selectedId],
    );
    const selectedFit = useMemo(() => {
        if (!selected || !["text", "dynamic_text"].includes(selected.type)) {
            return null;
        }
        return fitCertificateText({
            text: certificateSampleContent(selected.content, sampleProfile),
            element: selected,
            pageWidthMm: widthMm,
            pageHeightMm: heightMm,
        });
    }, [heightMm, sampleProfile, selected, widthMm]);
    const selectedIsText = Boolean(
        selected && ["text", "dynamic_text"].includes(selected.type),
    );
    const selectedIsAsset = Boolean(
        selected && ["image", "signature"].includes(selected.type),
    );

    useEffect(() => {
        const warnBeforeLeaving = (event) => {
            if (!isDirty) return;
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", warnBeforeLeaving);
        return () =>
            window.removeEventListener("beforeunload", warnBeforeLeaving);
    }, [isDirty]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            const tagName = event.target?.tagName?.toLowerCase();
            if (["input", "textarea", "select"].includes(tagName)) return;
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "z"
            ) {
                event.preventDefault();
                if (event.shiftKey) redo();
                else undo();
                return;
            }
            if (!selected) return;
            if (event.key === "Delete" || event.key === "Backspace") {
                event.preventDefault();
                deleteSelected();
                return;
            }
            const delta = event.shiftKey ? 5 : 1;
            const positions = {
                ArrowLeft: [-delta, 0],
                ArrowRight: [delta, 0],
                ArrowUp: [0, -delta],
                ArrowDown: [0, delta],
            };
            if (!positions[event.key]) return;
            event.preventDefault();
            const [xDelta, yDelta] = positions[event.key];
            updateSelectedPosition(
                selected.id,
                Math.min(
                    widthMm - selected.width,
                    Math.max(0, selected.x + xDelta),
                ),
                Math.min(
                    heightMm - selected.height,
                    Math.max(0, selected.y + yDelta),
                ),
            );
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    });

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
                element.id === selected.id
                    ? { ...element, ...updates }
                    : element,
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
        if (["image", "signature"].includes(definition.type)) {
            uploadModeRef.current = definition.type;
            uploadLayerNameRef.current = definition.label;
            replaceAssetIdRef.current = null;
            assetInputRef.current?.click();
            return;
        }
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

    const uploadAsset = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        const body = new FormData();
        body.append("file", file);
        setProcessing(true);
        try {
            const response = await fetch("/admin/certificate-assets/upload/", {
                method: "POST",
                credentials: "same-origin",
                headers: getCsrfHeaders(),
                body,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Upload failed.");
            if (uploadModeRef.current === "background") {
                commitLayout({
                    ...layout,
                    background: {
                        ...(layout.background || {}),
                        image: result.url,
                    },
                });
                setRightTab("elements");
            } else if (replaceAssetIdRef.current) {
                const assetId = replaceAssetIdRef.current;
                commitLayout({
                    ...layout,
                    elements: layout.elements.map((element) =>
                        element.id === assetId
                            ? {
                                  ...element,
                                  content: result.url,
                                  assetUrl: result.url,
                              }
                            : element,
                    ),
                });
            } else {
                const element = makeElement(
                    {
                        type: uploadModeRef.current,
                        label: uploadLayerNameRef.current,
                        content: result.url,
                        assetUrl: result.url,
                    },
                    widthMm,
                    heightMm,
                    layout.elements.length,
                );
                commitLayout({
                    ...layout,
                    elements: [...layout.elements, element],
                });
                setSelectedId(element.id);
            }
        } catch (error) {
            window.alert(error.message);
        } finally {
            replaceAssetIdRef.current = null;
            setProcessing(false);
        }
    };

    const deleteSelected = () => {
        if (!selected) return;
        commitLayout({
            ...layout,
            elements: layout.elements.filter(
                (element) => element.id !== selected.id,
            ),
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

    const moveSelectedLayer = (direction) => {
        if (!selected) return;
        const next = Math.max(
            0,
            Math.min(layout.elements.length + 1, selected.zIndex + direction),
        );
        updateSelected({ zIndex: next });
    };

    const alignSelected = (alignment) => {
        if (!selected) return;
        const safeArea = Number(layout.safeAreaMm) || 0;
        const positions = {
            left: { x: safeArea },
            center: { x: (widthMm - selected.width) / 2 },
            right: { x: widthMm - safeArea - selected.width },
            top: { y: safeArea },
            middle: { y: (heightMm - selected.height) / 2 },
            bottom: { y: heightMm - safeArea - selected.height },
        };
        const next = positions[alignment] || {};
        updateSelected({
            ...(next.x === undefined
                ? {}
                : {
                      x: Math.max(
                          0,
                          Math.min(widthMm - selected.width, next.x),
                      ),
                  }),
            ...(next.y === undefined
                ? {}
                : {
                      y: Math.max(
                          0,
                          Math.min(heightMm - selected.height, next.y),
                      ),
                  }),
        });
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
        let nextX = Math.min(
            widthMm - element.width,
            Math.max(0, element.x + delta.x / pixelsPerMm),
        );
        let nextY = Math.min(
            heightMm - element.height,
            Math.max(0, element.y + delta.y / pixelsPerMm),
        );
        if (snapEnabled) {
            const snapped = snapElementPosition({
                element,
                x: nextX,
                y: nextY,
                elements: layout.elements,
                widthMm,
                heightMm,
                safeAreaMm: Number(layout.safeAreaMm) || 0,
            });
            nextX = snapped.x;
            nextY = snapped.y;
        }
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
                onSuccess: () => {
                    initialDocument.current = JSON.stringify({
                        name: name.trim(),
                        layout,
                    });
                },
                onFinish: () => {
                    setProcessing(false);
                    setPublishOpen(false);
                },
            },
        );
    };

    const openPdfPreview = async (download = false) => {
        setProcessing(true);
        try {
            const response = await fetch(
                `/admin/certificate-templates/${template.id}/preview/`,
                {
                    method: "POST",
                    credentials: "same-origin",
                    headers: getCsrfHeaders({
                        "Content-Type": "application/json",
                    }),
                    body: JSON.stringify({ layout, sampleProfile }),
                },
            );
            if (!response.ok) {
                const result = await response.json();
                throw new Error(
                    result.error || "Preview could not be generated.",
                );
            }
            const url = URL.createObjectURL(await response.blob());
            if (download) {
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = `${name.trim() || "certificate"}-test.pdf`;
                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();
            } else {
                window.open(url, "_blank", "noopener,noreferrer");
            }
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (error) {
            window.alert(error.message);
        } finally {
            setProcessing(false);
        }
    };

    const openBuilderTemplate = (nextTemplate) => {
        if (nextTemplate.id === template.id) return;
        if (
            isDirty &&
            !window.confirm(
                "You have unsaved changes. Open another certificate anyway?",
            )
        ) {
            return;
        }
        router.visit(
            `/admin/certificate-templates/${nextTemplate.id}/builder/`,
        );
    };

    const createCertificate = () => {
        setProcessing(true);
        router.post(
            "/admin/certificate-templates/create/",
            {
                name: newTemplateName.trim() || "Untitled certificate",
                orientation: newTemplateOrientation,
            },
            {
                onFinish: () => {
                    setProcessing(false);
                    setCreateOpen(false);
                },
            },
        );
    };

    return (
        <DashboardLayout
            role="admin"
            breadcrumbs={[
                {
                    label: "Certificate templates",
                    href: "/admin/certificate-templates/",
                },
                { label: template.name },
            ]}
        >
            <Head title={`Edit ${template.name}`} />

            <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
                gap={1}
                sx={{ mb: 1.5, px: 0.5 }}
            >
                <Typography variant="h5" component="h1" fontWeight={780}>
                    Certificate Builder
                </Typography>
                <Tabs
                    value="certificates"
                    aria-label="Certificate builder sections"
                    sx={{
                        minHeight: 38,
                        "& .MuiTab-root": {
                            minHeight: 38,
                            py: 0.5,
                            textTransform: "none",
                            fontWeight: 750,
                        },
                    }}
                >
                    <Tab
                        value="certificates"
                        label="Certificates"
                        component={Link}
                        href="/admin/certificate-templates/"
                    />
                    <Tab
                        value="link"
                        label="Link certificates"
                        component={Link}
                        href="/admin/certificate-templates/?tab=link"
                    />
                </Tabs>
            </Stack>

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
                    color={
                        template.status === "published" ? "success" : "default"
                    }
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
                            <IconButton
                                onClick={redo}
                                disabled={!future.length}
                            >
                                <RedoIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                </ButtonGroup>
                <Button
                    startIcon={<ContentCopyIcon />}
                    color="inherit"
                    onClick={duplicateSelected}
                    disabled={!selected}
                >
                    Duplicate
                </Button>
                <Button
                    startIcon={<PreviewIcon />}
                    color="inherit"
                    onClick={() => setPreviewOpen(true)}
                >
                    Preview
                </Button>
                <Button
                    startIcon={<DownloadOutlinedIcon />}
                    color="inherit"
                    onClick={() => openPdfPreview(true)}
                    disabled={processing}
                >
                    Test PDF
                </Button>
                {isDirty && (
                    <Typography variant="caption" color="warning.main">
                        Unsaved changes
                    </Typography>
                )}
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
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "185px minmax(0, 1fr) 220px",
                        md: "210px minmax(0, 1fr) 250px",
                        xl: "230px minmax(0, 1fr) 270px",
                    },
                    minHeight: 720,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                    overflow: "hidden",
                    bgcolor: "background.paper",
                }}
            >
                <CertificateRail
                    templates={templates}
                    currentTemplateId={template.id}
                    onCreate={() => setCreateOpen(true)}
                    onSelect={openBuilderTemplate}
                />

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
                        useFlexGap
                        flexWrap="wrap"
                        sx={{
                            py: 1.25,
                            px: 1,
                            borderBottom: "1px solid rgba(25,37,61,.08)",
                        }}
                    >
                        <IconButton
                            size="small"
                            onClick={() =>
                                setZoom((value) => Math.max(0.45, value - 0.1))
                            }
                        >
                            <ZoomOutIcon fontSize="small" />
                        </IconButton>
                        <Typography
                            variant="caption"
                            sx={{ minWidth: 42, textAlign: "center" }}
                        >
                            {Math.round(zoom * 100)}%
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() =>
                                setZoom((value) => Math.min(1.2, value + 0.1))
                            }
                        >
                            <ZoomInIcon fontSize="small" />
                        </IconButton>
                        <Tooltip title="Fit canvas">
                            <IconButton
                                size="small"
                                onClick={() => setZoom(0.82)}
                            >
                                <CenterFocusStrongIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Divider orientation="vertical" flexItem />
                        <FormControl size="small" sx={{ minWidth: 148 }}>
                            <InputLabel>Preview data</InputLabel>
                            <Select
                                label="Preview data"
                                value={sampleProfile}
                                onChange={(event) =>
                                    setSampleProfile(event.target.value)
                                }
                            >
                                <MenuItem value="standard">
                                    Standard sample
                                </MenuItem>
                                <MenuItem value="stress">
                                    Long-name test
                                </MenuItem>
                            </Select>
                        </FormControl>
                        <FormControlLabel
                            control={
                                <Switch
                                    size="small"
                                    checked={showSafeArea}
                                    onChange={(event) =>
                                        setShowSafeArea(event.target.checked)
                                    }
                                />
                            }
                            label={
                                <Typography variant="caption">
                                    Safe area
                                </Typography>
                            }
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    size="small"
                                    checked={snapEnabled}
                                    onChange={(event) =>
                                        setSnapEnabled(event.target.checked)
                                    }
                                />
                            }
                            label={
                                <Typography variant="caption">Snap</Typography>
                            }
                        />
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
                            <DndContext
                                sensors={sensors}
                                onDragEnd={handleDragEnd}
                            >
                                <CertificateCanvas
                                    ref={canvasRef}
                                    layout={layout}
                                    widthMm={widthMm}
                                    heightMm={heightMm}
                                    selectedId={selectedId}
                                    interactive
                                    onSelect={(elementId) => {
                                        setSelectedId(elementId);
                                        if (elementId) {
                                            setRightTab("elements");
                                        }
                                    }}
                                    sampleProfile={sampleProfile}
                                    showSafeArea={showSafeArea}
                                />
                            </DndContext>
                        </Box>
                    </Box>
                </Box>

                <Box
                    component="aside"
                    sx={{
                        borderLeft: { sm: "1px solid" },
                        borderTop: { xs: "1px solid", sm: 0 },
                        borderColor: "divider",
                        minWidth: 0,
                        bgcolor: "#f5f7fb",
                        maxHeight: { sm: "calc(100vh - 190px)" },
                        overflowY: "auto",
                    }}
                >
                    <Tabs
                        value={rightTab}
                        onChange={(_, value) => {
                            setRightTab(value);
                            if (value === "backgrounds") {
                                setSelectedId(null);
                            }
                        }}
                        variant="fullWidth"
                        sx={{
                            p: 1.25,
                            minHeight: 50,
                            bgcolor: "#f5f7fb",
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                            "& .MuiTabs-flexContainer": {
                                gap: 0.35,
                                p: 0.35,
                                borderRadius: 1.5,
                                bgcolor: "#e5eaf2",
                            },
                            "& .MuiTabs-indicator": {
                                display: "none",
                            },
                            "& .MuiTab-root": {
                                minHeight: 32,
                                py: 0.35,
                                px: 1,
                                borderRadius: 1.1,
                                color: "#5f6b7d",
                                fontSize: "0.78rem",
                                textTransform: "none",
                                fontWeight: 650,
                            },
                            "& .MuiTab-root.Mui-selected": {
                                bgcolor: "background.paper",
                                color: "#182134",
                                boxShadow: "0 1px 3px rgba(20, 31, 50, 0.12)",
                            },
                        }}
                    >
                        <Tab value="elements" label="Elements" />
                        <Tab value="backgrounds" label="Backgrounds" />
                    </Tabs>
                    {rightTab === "backgrounds" ? (
                        <Stack spacing={2} sx={{ p: 1.5 }}>
                            <Typography
                                variant="overline"
                                fontWeight={800}
                                color="text.secondary"
                            >
                                Background image
                            </Typography>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 1,
                                    minHeight: 130,
                                    display: "grid",
                                    placeItems: "center",
                                    overflow: "hidden",
                                    bgcolor: "background.paper",
                                }}
                            >
                                {layout.background?.image ? (
                                    <Box
                                        component="img"
                                        src={layout.background.image}
                                        alt="Certificate background"
                                        sx={{
                                            width: "100%",
                                            maxHeight: 160,
                                            objectFit: "contain",
                                        }}
                                    />
                                ) : (
                                    <Stack
                                        spacing={1}
                                        alignItems="center"
                                        sx={{ color: "text.secondary" }}
                                    >
                                        <ImageOutlinedIcon />
                                        <Typography variant="caption">
                                            No background image
                                        </Typography>
                                    </Stack>
                                )}
                            </Paper>
                            <Button
                                variant="outlined"
                                startIcon={<ImageOutlinedIcon />}
                                onClick={() => {
                                    uploadModeRef.current = "background";
                                    replaceAssetIdRef.current = null;
                                    assetInputRef.current?.click();
                                }}
                                disabled={Boolean(layout.background?.locked)}
                            >
                                {layout.background?.image
                                    ? "Change background"
                                    : "Select image"}
                            </Button>
                            {layout.background?.image && (
                                <Button
                                    color="error"
                                    startIcon={<DeleteOutlineIcon />}
                                    disabled={Boolean(
                                        layout.background?.locked,
                                    )}
                                    onClick={() =>
                                        commitLayout({
                                            ...layout,
                                            background: {
                                                ...(layout.background || {}),
                                                image: null,
                                            },
                                        })
                                    }
                                >
                                    Remove background
                                </Button>
                            )}
                            <Divider />
                            <Typography fontWeight={750}>
                                Page settings
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                <Chip
                                    size="small"
                                    label="A4"
                                    variant="outlined"
                                />
                                <Chip
                                    size="small"
                                    label={template.orientation}
                                    variant="outlined"
                                    sx={{ textTransform: "capitalize" }}
                                />
                            </Stack>
                            <TextField
                                type="color"
                                size="small"
                                label="Background colour"
                                value={layout.background?.color || "#ffffff"}
                                disabled={Boolean(layout.background?.locked)}
                                onChange={(event) =>
                                    commitLayout({
                                        ...layout,
                                        background: {
                                            ...(layout.background || {}),
                                            color: event.target.value,
                                        },
                                    })
                                }
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                type="number"
                                size="small"
                                label="Safe margin (mm)"
                                value={layout.safeAreaMm ?? 10}
                                inputProps={{
                                    min: 0,
                                    max: Math.min(widthMm, heightMm) / 3,
                                    step: 1,
                                }}
                                onChange={(event) =>
                                    commitLayout({
                                        ...layout,
                                        safeAreaMm: Math.max(
                                            0,
                                            Math.min(
                                                Math.min(widthMm, heightMm) / 3,
                                                Number(event.target.value),
                                            ),
                                        ),
                                    })
                                }
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        size="small"
                                        checked={Boolean(
                                            layout.background?.locked,
                                        )}
                                        onChange={(event) =>
                                            commitLayout({
                                                ...layout,
                                                background: {
                                                    ...(layout.background ||
                                                        {}),
                                                    locked: event.target
                                                        .checked,
                                                },
                                            })
                                        }
                                    />
                                }
                                label="Lock background"
                            />
                        </Stack>
                    ) : selected ? (
                        <Stack spacing={2} sx={{ p: 1.5 }}>
                            <Box>
                                <Button
                                    size="small"
                                    color="inherit"
                                    onClick={() => setSelectedId(null)}
                                    sx={{ mb: 1, px: 0 }}
                                >
                                    ← All elements
                                </Button>
                                <Typography fontWeight={700}>
                                    {elementDisplayName(selected)}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    {selected.type.replace("_", " ")}
                                </Typography>
                            </Box>
                            {selectedFit?.overflows && (
                                <Alert severity="warning">
                                    This sample still overflows at{" "}
                                    {selectedFit.fontSize}px. Enlarge the text
                                    box, allow wrapping, or reduce the minimum
                                    font size.
                                </Alert>
                            )}
                            {selectedIsText && (
                                <TextField
                                    label="Content"
                                    multiline
                                    minRows={2}
                                    value={selected.content}
                                    onChange={(event) =>
                                        updateSelected({
                                            content: event.target.value,
                                        })
                                    }
                                    fullWidth
                                />
                            )}
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(2, minmax(0, 1fr))",
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
                                        inputProps={{
                                            min:
                                                key === "width" ||
                                                key === "height"
                                                    ? 1
                                                    : 0,
                                            max: maximum,
                                        }}
                                        onChange={(event) =>
                                            updateSelected({
                                                [key]: Math.max(
                                                    key === "width" ||
                                                        key === "height"
                                                        ? 1
                                                        : 0,
                                                    Math.min(
                                                        maximum,
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    ),
                                                ),
                                            })
                                        }
                                    />
                                ))}
                            </Box>
                            <TextField
                                type="number"
                                size="small"
                                label="Rotation (degrees)"
                                value={selected.rotation || 0}
                                inputProps={{ min: -360, max: 360 }}
                                onChange={(event) =>
                                    updateSelected({
                                        rotation: Math.max(
                                            -360,
                                            Math.min(
                                                360,
                                                Number(event.target.value),
                                            ),
                                        ),
                                    })
                                }
                            />
                            <Box>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: "block", mb: 0.75 }}
                                >
                                    Align within safe area
                                </Typography>
                                <ButtonGroup
                                    size="small"
                                    variant="outlined"
                                    fullWidth
                                    sx={{ mb: 0.75 }}
                                >
                                    <Button
                                        onClick={() => alignSelected("left")}
                                    >
                                        Left
                                    </Button>
                                    <Button
                                        onClick={() => alignSelected("center")}
                                    >
                                        Centre
                                    </Button>
                                    <Button
                                        onClick={() => alignSelected("right")}
                                    >
                                        Right
                                    </Button>
                                </ButtonGroup>
                                <ButtonGroup
                                    size="small"
                                    variant="outlined"
                                    fullWidth
                                >
                                    <Button
                                        onClick={() => alignSelected("top")}
                                    >
                                        Top
                                    </Button>
                                    <Button
                                        onClick={() => alignSelected("middle")}
                                    >
                                        Middle
                                    </Button>
                                    <Button
                                        onClick={() => alignSelected("bottom")}
                                    >
                                        Bottom
                                    </Button>
                                </ButtonGroup>
                            </Box>
                            {selectedIsText && (
                                <>
                                    <FormControl size="small" fullWidth>
                                        <InputLabel>Font</InputLabel>
                                        <Select
                                            label="Font"
                                            value={
                                                selected.styles?.fontFamily ||
                                                "Albert Sans"
                                            }
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "fontFamily",
                                                    event.target.value,
                                                )
                                            }
                                        >
                                            <MenuItem value="Albert Sans">
                                                Albert Sans
                                            </MenuItem>
                                            <MenuItem value="Georgia">
                                                Georgia
                                            </MenuItem>
                                            <MenuItem value="Arial">
                                                Arial
                                            </MenuItem>
                                            <MenuItem value="Times New Roman">
                                                Times New Roman
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "repeat(3, minmax(0, 1fr))",
                                            gap: 1,
                                        }}
                                    >
                                        <TextField
                                            type="number"
                                            size="small"
                                            label="Font"
                                            value={
                                                selected.styles?.fontSize || 16
                                            }
                                            inputProps={{
                                                min: 6,
                                                max: 160,
                                            }}
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "fontSize",
                                                    Math.max(
                                                        6,
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    ),
                                                )
                                            }
                                        />
                                        <TextField
                                            type="number"
                                            size="small"
                                            label="Minimum"
                                            value={
                                                selected.styles?.minFontSize ||
                                                Math.min(
                                                    12,
                                                    selected.styles?.fontSize ||
                                                        16,
                                                )
                                            }
                                            inputProps={{
                                                min: 6,
                                                max: 160,
                                            }}
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "minFontSize",
                                                    Math.max(
                                                        6,
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    ),
                                                )
                                            }
                                        />
                                        <TextField
                                            type="number"
                                            size="small"
                                            label="Maximum"
                                            value={
                                                selected.styles?.maxFontSize ||
                                                selected.styles?.fontSize ||
                                                16
                                            }
                                            inputProps={{
                                                min: 6,
                                                max: 160,
                                            }}
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "maxFontSize",
                                                    Math.max(
                                                        6,
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    ),
                                                )
                                            }
                                        />
                                    </Box>
                                    <TextField
                                        type="number"
                                        size="small"
                                        label="Font weight"
                                        value={
                                            selected.styles?.fontWeight || 400
                                        }
                                        inputProps={{
                                            min: 300,
                                            max: 900,
                                            step: 100,
                                        }}
                                        onChange={(event) =>
                                            updateSelectedStyle(
                                                "fontWeight",
                                                Number(event.target.value),
                                            )
                                        }
                                    />
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        useFlexGap
                                        flexWrap="wrap"
                                    >
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    size="small"
                                                    checked={
                                                        selected.styles
                                                            ?.autoShrink ??
                                                        selected.type ===
                                                            "dynamic_text"
                                                    }
                                                    onChange={(event) =>
                                                        updateSelectedStyle(
                                                            "autoShrink",
                                                            event.target
                                                                .checked,
                                                        )
                                                    }
                                                />
                                            }
                                            label="Auto-shrink"
                                        />
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    size="small"
                                                    checked={Boolean(
                                                        selected.styles
                                                            ?.singleLine,
                                                    )}
                                                    onChange={(event) =>
                                                        updateSelectedStyle(
                                                            "singleLine",
                                                            event.target
                                                                .checked,
                                                        )
                                                    }
                                                />
                                            }
                                            label="One line"
                                        />
                                    </Stack>
                                    <Stack direction="row" spacing={1}>
                                        <FormControl size="small" fullWidth>
                                            <InputLabel>Case</InputLabel>
                                            <Select
                                                label="Case"
                                                value={
                                                    selected.styles
                                                        ?.textTransform ||
                                                    "none"
                                                }
                                                onChange={(event) =>
                                                    updateSelectedStyle(
                                                        "textTransform",
                                                        event.target.value,
                                                    )
                                                }
                                            >
                                                <MenuItem value="none">
                                                    As entered
                                                </MenuItem>
                                                <MenuItem value="uppercase">
                                                    UPPERCASE
                                                </MenuItem>
                                                <MenuItem value="lowercase">
                                                    lowercase
                                                </MenuItem>
                                                <MenuItem value="capitalize">
                                                    Capitalise
                                                </MenuItem>
                                            </Select>
                                        </FormControl>
                                        <FormControl size="small" fullWidth>
                                            <InputLabel>Overflow</InputLabel>
                                            <Select
                                                label="Overflow"
                                                value={
                                                    selected.styles
                                                        ?.textOverflow ||
                                                    "ellipsis"
                                                }
                                                onChange={(event) =>
                                                    updateSelectedStyle(
                                                        "textOverflow",
                                                        event.target.value,
                                                    )
                                                }
                                            >
                                                <MenuItem value="ellipsis">
                                                    Ellipsis
                                                </MenuItem>
                                                <MenuItem value="clip">
                                                    Clip
                                                </MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Stack>
                                    <ToggleButtonGroup
                                        size="small"
                                        value={[
                                            selected.styles?.fontStyle ===
                                            "italic"
                                                ? "italic"
                                                : null,
                                            selected.styles?.textDecoration ===
                                            "underline"
                                                ? "underline"
                                                : null,
                                        ].filter(Boolean)}
                                        onChange={(_, values) => {
                                            updateSelected({
                                                styles: {
                                                    ...(selected.styles || {}),
                                                    fontStyle: values.includes(
                                                        "italic",
                                                    )
                                                        ? "italic"
                                                        : "normal",
                                                    textDecoration:
                                                        values.includes(
                                                            "underline",
                                                        )
                                                            ? "underline"
                                                            : "none",
                                                },
                                            });
                                        }}
                                        fullWidth
                                    >
                                        <ToggleButton value="italic">
                                            Italic
                                        </ToggleButton>
                                        <ToggleButton value="underline">
                                            Underline
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                    <Stack direction="row" spacing={1}>
                                        <TextField
                                            type="number"
                                            size="small"
                                            label="Line height"
                                            value={
                                                selected.styles?.lineHeight ||
                                                1.2
                                            }
                                            inputProps={{
                                                min: 0.8,
                                                max: 3,
                                                step: 0.1,
                                            }}
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "lineHeight",
                                                    Number(event.target.value),
                                                )
                                            }
                                        />
                                        <TextField
                                            type="number"
                                            size="small"
                                            label="Letter spacing"
                                            value={
                                                selected.styles
                                                    ?.letterSpacing || 0
                                            }
                                            inputProps={{
                                                min: -5,
                                                max: 20,
                                                step: 0.5,
                                            }}
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "letterSpacing",
                                                    Number(event.target.value),
                                                )
                                            }
                                        />
                                    </Stack>
                                    <TextField
                                        type="color"
                                        size="small"
                                        label="Text colour"
                                        value={
                                            selected.styles?.color || "#172033"
                                        }
                                        onChange={(event) =>
                                            updateSelectedStyle(
                                                "color",
                                                event.target.value,
                                            )
                                        }
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <Stack direction="row" spacing={1}>
                                        <TextField
                                            type="number"
                                            size="small"
                                            label="Opacity"
                                            value={
                                                selected.styles?.opacity ?? 1
                                            }
                                            inputProps={{
                                                min: 0,
                                                max: 1,
                                                step: 0.05,
                                            }}
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "opacity",
                                                    Math.max(
                                                        0,
                                                        Math.min(
                                                            1,
                                                            Number(
                                                                event.target
                                                                    .value,
                                                            ),
                                                        ),
                                                    ),
                                                )
                                            }
                                        />
                                        <FormControl size="small" fullWidth>
                                            <InputLabel>Vertical</InputLabel>
                                            <Select
                                                label="Vertical"
                                                value={
                                                    selected.styles
                                                        ?.verticalAlign ||
                                                    "center"
                                                }
                                                onChange={(event) =>
                                                    updateSelectedStyle(
                                                        "verticalAlign",
                                                        event.target.value,
                                                    )
                                                }
                                            >
                                                <MenuItem value="top">
                                                    Top
                                                </MenuItem>
                                                <MenuItem value="center">
                                                    Centre
                                                </MenuItem>
                                                <MenuItem value="bottom">
                                                    Bottom
                                                </MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Stack>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                size="small"
                                                checked={Boolean(
                                                    selected.styles?.textShadow,
                                                )}
                                                onChange={(event) =>
                                                    updateSelectedStyle(
                                                        "textShadow",
                                                        event.target.checked,
                                                    )
                                                }
                                            />
                                        }
                                        label="Text shadow"
                                    />
                                    <ToggleButtonGroup
                                        exclusive
                                        size="small"
                                        value={
                                            selected.styles?.textAlign ||
                                            "center"
                                        }
                                        onChange={(_, value) =>
                                            value &&
                                            updateSelectedStyle(
                                                "textAlign",
                                                value,
                                            )
                                        }
                                        fullWidth
                                    >
                                        <ToggleButton value="left">
                                            Left
                                        </ToggleButton>
                                        <ToggleButton value="center">
                                            Centre
                                        </ToggleButton>
                                        <ToggleButton value="right">
                                            Right
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                </>
                            )}
                            {selectedIsAsset && (
                                <Stack spacing={1.5}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<ImageOutlinedIcon />}
                                        onClick={() => {
                                            uploadModeRef.current =
                                                selected.type;
                                            uploadLayerNameRef.current =
                                                selected.name || "Image / logo";
                                            replaceAssetIdRef.current =
                                                selected.id;
                                            assetInputRef.current?.click();
                                        }}
                                    >
                                        Replace image
                                    </Button>
                                    <FormControl size="small" fullWidth>
                                        <InputLabel>Image fit</InputLabel>
                                        <Select
                                            label="Image fit"
                                            value={
                                                selected.styles?.objectFit ||
                                                "contain"
                                            }
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "objectFit",
                                                    event.target.value,
                                                )
                                            }
                                        >
                                            <MenuItem value="contain">
                                                Fit inside
                                            </MenuItem>
                                            <MenuItem value="cover">
                                                Crop to fill
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "repeat(2, minmax(0, 1fr))",
                                            gap: 1,
                                        }}
                                    >
                                        <TextField
                                            type="number"
                                            size="small"
                                            label="Opacity"
                                            value={
                                                selected.styles?.opacity ?? 1
                                            }
                                            inputProps={{
                                                min: 0,
                                                max: 1,
                                                step: 0.05,
                                            }}
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "opacity",
                                                    Math.max(
                                                        0,
                                                        Math.min(
                                                            1,
                                                            Number(
                                                                event.target
                                                                    .value,
                                                            ),
                                                        ),
                                                    ),
                                                )
                                            }
                                        />
                                        <TextField
                                            type="number"
                                            size="small"
                                            label="Corner radius"
                                            value={
                                                selected.styles?.borderRadius ||
                                                0
                                            }
                                            inputProps={{
                                                min: 0,
                                                max: 100,
                                            }}
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "borderRadius",
                                                    Math.max(
                                                        0,
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    ),
                                                )
                                            }
                                        />
                                        <TextField
                                            type="number"
                                            size="small"
                                            label="Border width"
                                            value={
                                                selected.styles?.borderWidth ||
                                                0
                                            }
                                            inputProps={{ min: 0, max: 20 }}
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "borderWidth",
                                                    Math.max(
                                                        0,
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    ),
                                                )
                                            }
                                        />
                                        <TextField
                                            type="color"
                                            size="small"
                                            label="Border colour"
                                            value={
                                                selected.styles?.borderColor ===
                                                "transparent"
                                                    ? "#ffffff"
                                                    : selected.styles
                                                          ?.borderColor ||
                                                      "#ffffff"
                                            }
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "borderColor",
                                                    event.target.value,
                                                )
                                            }
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    </Box>
                                </Stack>
                            )}
                            {selected.type === "qr_code" && (
                                <Stack spacing={1.5}>
                                    <FormControl size="small" fullWidth>
                                        <InputLabel>
                                            Error correction
                                        </InputLabel>
                                        <Select
                                            label="Error correction"
                                            value={
                                                selected.styles
                                                    ?.errorCorrection || "M"
                                            }
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "errorCorrection",
                                                    event.target.value,
                                                )
                                            }
                                        >
                                            <MenuItem value="L">Low</MenuItem>
                                            <MenuItem value="M">
                                                Medium
                                            </MenuItem>
                                            <MenuItem value="Q">
                                                Quartile
                                            </MenuItem>
                                            <MenuItem value="H">High</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "repeat(2, minmax(0, 1fr))",
                                            gap: 1,
                                        }}
                                    >
                                        <TextField
                                            type="color"
                                            size="small"
                                            label="Foreground"
                                            value={
                                                selected.styles?.foreground ||
                                                "#172033"
                                            }
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "foreground",
                                                    event.target.value,
                                                )
                                            }
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                        <TextField
                                            type="color"
                                            size="small"
                                            label="Background"
                                            value={
                                                selected.styles?.background ||
                                                "#ffffff"
                                            }
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "background",
                                                    event.target.value,
                                                )
                                            }
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                        <TextField
                                            type="number"
                                            size="small"
                                            label="Padding (mm)"
                                            value={
                                                selected.styles?.padding ?? 1.5
                                            }
                                            inputProps={{
                                                min: 0,
                                                max: 10,
                                                step: 0.5,
                                            }}
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "padding",
                                                    Math.max(
                                                        0,
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    ),
                                                )
                                            }
                                        />
                                        <TextField
                                            type="number"
                                            size="small"
                                            label="Border width"
                                            value={
                                                selected.styles?.borderWidth ||
                                                0
                                            }
                                            inputProps={{ min: 0, max: 20 }}
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "borderWidth",
                                                    Math.max(
                                                        0,
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    ),
                                                )
                                            }
                                        />
                                    </Box>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        The QR code always uses this
                                        certificate&apos;s public verification
                                        URL.
                                    </Typography>
                                </Stack>
                            )}
                            {selected.type === "shape" && (
                                <Stack spacing={1}>
                                    <FormControl size="small" fullWidth>
                                        <InputLabel>Shape</InputLabel>
                                        <Select
                                            label="Shape"
                                            value={
                                                selected.shape || "rectangle"
                                            }
                                            onChange={(event) => {
                                                const shape =
                                                    event.target.value;
                                                const size = Math.min(
                                                    selected.width,
                                                    selected.height,
                                                );
                                                updateSelected({
                                                    shape,
                                                    ...(shape === "circle"
                                                        ? {
                                                              width: size,
                                                              height: size,
                                                          }
                                                        : {}),
                                                });
                                            }}
                                        >
                                            <MenuItem value="rectangle">
                                                Rectangle
                                            </MenuItem>
                                            <MenuItem value="circle">
                                                Circle
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Stack direction="row" spacing={1}>
                                        <TextField
                                            type="color"
                                            size="small"
                                            fullWidth
                                            label="Fill"
                                            value={
                                                selected.styles?.fill ===
                                                "transparent"
                                                    ? "#ffffff"
                                                    : selected.styles?.fill ||
                                                      "#3157d5"
                                            }
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "fill",
                                                    event.target.value,
                                                )
                                            }
                                            InputLabelProps={{ shrink: true }}
                                        />
                                        <TextField
                                            type="color"
                                            size="small"
                                            fullWidth
                                            label="Outline"
                                            value={
                                                selected.styles?.stroke ===
                                                "transparent"
                                                    ? "#3157d5"
                                                    : selected.styles?.stroke ||
                                                      "#3157d5"
                                            }
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "stroke",
                                                    event.target.value,
                                                )
                                            }
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Stack>
                                    <Stack direction="row" spacing={1}>
                                        <TextField
                                            type="number"
                                            size="small"
                                            fullWidth
                                            label="Outline width"
                                            value={
                                                selected.styles?.strokeWidth ??
                                                1
                                            }
                                            inputProps={{
                                                min: 0,
                                                max: 20,
                                                step: 0.5,
                                            }}
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "strokeWidth",
                                                    Math.max(
                                                        0,
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    ),
                                                )
                                            }
                                        />
                                        {selected.shape !== "circle" && (
                                            <TextField
                                                type="number"
                                                size="small"
                                                fullWidth
                                                label="Corner radius"
                                                value={
                                                    selected.styles
                                                        ?.borderRadius ?? 0
                                                }
                                                inputProps={{
                                                    min: 0,
                                                    max: 100,
                                                }}
                                                onChange={(event) =>
                                                    updateSelectedStyle(
                                                        "borderRadius",
                                                        Math.max(
                                                            0,
                                                            Number(
                                                                event.target
                                                                    .value,
                                                            ),
                                                        ),
                                                    )
                                                }
                                            />
                                        )}
                                        <TextField
                                            type="number"
                                            size="small"
                                            fullWidth
                                            label="Opacity"
                                            value={
                                                selected.styles?.opacity ?? 1
                                            }
                                            inputProps={{
                                                min: 0,
                                                max: 1,
                                                step: 0.05,
                                            }}
                                            onChange={(event) =>
                                                updateSelectedStyle(
                                                    "opacity",
                                                    Math.max(
                                                        0,
                                                        Math.min(
                                                            1,
                                                            Number(
                                                                event.target
                                                                    .value,
                                                            ),
                                                        ),
                                                    ),
                                                )
                                            }
                                        />
                                    </Stack>
                                </Stack>
                            )}
                            <Divider />
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                <Button
                                    size="small"
                                    onClick={() =>
                                        updateSelected({
                                            locked: !selected.locked,
                                        })
                                    }
                                >
                                    {selected.locked ? "Unlock" : "Lock"}
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() =>
                                        updateSelected({
                                            hidden: !selected.hidden,
                                        })
                                    }
                                >
                                    {selected.hidden ? "Show" : "Hide"}
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => moveSelectedLayer(1)}
                                >
                                    Forward
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => moveSelectedLayer(-1)}
                                >
                                    Back
                                </Button>
                            </Stack>
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
                        <Stack spacing={1.65} sx={{ px: 1.5, pb: 2, pt: 0.75 }}>
                            {PRIMARY_ELEMENT_GROUPS.map((group) => (
                                <ElementPaletteGroup
                                    key={group}
                                    group={group}
                                    onAdd={addElement}
                                />
                            ))}
                            <Box
                                sx={{
                                    pt: 0.75,
                                    borderTop: "1px solid",
                                    borderColor: "#dfe4ec",
                                }}
                            >
                                <Button
                                    color="inherit"
                                    fullWidth
                                    onClick={() =>
                                        setShowAdditionalFields(
                                            (value) => !value,
                                        )
                                    }
                                    endIcon={
                                        <ExpandMoreIcon
                                            sx={{
                                                transform: showAdditionalFields
                                                    ? "rotate(180deg)"
                                                    : "rotate(0deg)",
                                                transition:
                                                    "transform 160ms ease",
                                            }}
                                        />
                                    }
                                    aria-expanded={showAdditionalFields}
                                    sx={{
                                        justifyContent: "space-between",
                                        px: 0.5,
                                        py: 0.5,
                                        color: "#566276",
                                        fontSize: "0.75rem",
                                        fontWeight: 700,
                                        textTransform: "none",
                                    }}
                                >
                                    Additional fields
                                </Button>
                            </Box>
                            {showAdditionalFields && (
                                <>
                                    {ADDITIONAL_ELEMENT_GROUPS.map((group) => (
                                        <ElementPaletteGroup
                                            key={group}
                                            group={group}
                                            onAdd={addElement}
                                        />
                                    ))}
                                </>
                            )}
                        </Stack>
                    )}
                </Box>
            </Box>

            <input
                ref={assetInputRef}
                type="file"
                hidden
                accept="image/png,image/jpeg,image/webp"
                onChange={uploadAsset}
            />

            <Dialog
                open={createOpen}
                onClose={() => !processing && setCreateOpen(false)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Create a certificate</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField
                            label="Certificate name"
                            value={newTemplateName}
                            onChange={(event) =>
                                setNewTemplateName(event.target.value)
                            }
                            autoFocus
                            fullWidth
                        />
                        <FormControl fullWidth>
                            <InputLabel>Orientation</InputLabel>
                            <Select
                                label="Orientation"
                                value={newTemplateOrientation}
                                onChange={(event) =>
                                    setNewTemplateOrientation(
                                        event.target.value,
                                    )
                                }
                            >
                                <MenuItem value="landscape">Landscape</MenuItem>
                                <MenuItem value="portrait">Portrait</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setCreateOpen(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={createCertificate}
                        disabled={processing || !newTemplateName.trim()}
                    >
                        {processing ? "Creating…" : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>

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
                        sampleProfile={sampleProfile}
                        showSafeArea={false}
                        sx={{
                            width:
                                template.orientation === "portrait"
                                    ? "54%"
                                    : "100%",
                            mx: "auto",
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => openPdfPreview(false)}
                        disabled={processing}
                    >
                        Open PDF preview
                    </Button>
                    <Button
                        startIcon={<DownloadOutlinedIcon />}
                        onClick={() => openPdfPreview(true)}
                        disabled={processing}
                    >
                        Download test PDF
                    </Button>
                    <Button onClick={() => setPreviewOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={publishOpen} onClose={() => setPublishOpen(false)}>
                <DialogTitle>Publish this certificate?</DialogTitle>
                <DialogContent>
                    <Typography color="text.secondary">
                        Publishing freezes version {template.version}. Later
                        edits will begin a new draft so issued certificates
                        remain unchanged.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPublishOpen(false)}>
                        Cancel
                    </Button>
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
