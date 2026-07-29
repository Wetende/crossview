import { forwardRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Box, Typography } from "@mui/material";

const SAMPLE_VALUES = {
    "{{student_name}}": "Alex Morgan",
    "{{program_title}}": "Foundations of Professional Practice",
    "{{completion_date}}": "24 July 2026",
    "{{issue_date}}": "30 July 2026",
    "{{serial_number}}": "CERT-2026-00142",
    "{{instructor_name}}": "Dr Taylor Reed",
    "{{organization_name}}": "Learning Academy",
    "{{verification_url}}": "verify.example/c/CERT-2026-00142",
};

function sampleContent(value = "") {
    return Object.entries(SAMPLE_VALUES).reduce(
        (content, [placeholder, sample]) => content.replaceAll(placeholder, sample),
        value,
    );
}

function elementStyles(element, referenceWidth) {
    const styles = element.styles || {};
    return {
        fontFamily: styles.fontFamily || "Albert Sans",
        fontSize: `${((styles.fontSize || 16) / referenceWidth) * 100}cqw`,
        fontWeight: styles.fontWeight || 400,
        color: styles.color || "#172033",
        textAlign: styles.textAlign || "center",
        lineHeight: styles.lineHeight || 1.2,
        letterSpacing: `${
            ((styles.letterSpacing || 0) / referenceWidth) * 100
        }cqw`,
    };
}

function CanvasElement({
    element,
    selected,
    interactive,
    onSelect,
    referenceWidth,
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: element.id,
        disabled: !interactive || element.locked,
    });
    const translate = transform
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
        : undefined;
    const common = {
        ref: setNodeRef,
        ...(interactive ? attributes : {}),
        ...(interactive ? listeners : {}),
        ...(interactive
            ? {
                  onPointerDown: (event) => {
                      event.stopPropagation();
                      onSelect?.(element.id);
                      listeners?.onPointerDown?.(event);
                  },
              }
            : {}),
        sx: {
            position: "absolute",
            left: `${(element.x / 297) * 100}%`,
            top: `${(element.y / 210) * 100}%`,
            width: `${(element.width / 297) * 100}%`,
            height: `${(element.height / 210) * 100}%`,
            transform: `${translate || ""} rotate(${element.rotation || 0}deg)`,
            transformOrigin: "center",
            display: element.hidden ? "none" : "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: element.zIndex || 1,
            cursor: interactive ? (element.locked ? "not-allowed" : "grab") : "default",
            opacity: isDragging ? 0.74 : 1,
            outline: selected ? "2px solid #3157d5" : "1px solid transparent",
            outlineOffset: 2,
            touchAction: "none",
            userSelect: "none",
        },
    };

    if (element.type === "shape") {
        const shapeStyles = element.styles || {};
        return (
            <Box
                {...common}
                sx={{
                    ...common.sx,
                    bgcolor:
                        shapeStyles.fill === "transparent"
                            ? "transparent"
                            : shapeStyles.fill || "#3157d5",
                    border: `${shapeStyles.strokeWidth || 1}px solid ${
                        shapeStyles.stroke || "transparent"
                    }`,
                    borderRadius: element.shape === "circle" ? "50%" : 0,
                }}
            />
        );
    }

    if (element.type === "line") {
        return (
            <Box {...common}>
                <Box
                    sx={{
                        width: "100%",
                        borderTop: `${element.styles?.strokeWidth || 1}px solid ${
                            element.styles?.stroke || "#172033"
                        }`,
                    }}
                />
            </Box>
        );
    }

    if (element.type === "qr_code") {
        return (
            <Box
                {...common}
                sx={{
                    ...common.sx,
                    background:
                        "repeating-conic-gradient(#172033 0 25%, transparent 0 50%) 50% / 8px 8px",
                    border: "5px solid white",
                }}
            />
        );
    }

    if (["image", "signature"].includes(element.type)) {
        return (
            <Box {...common}>
                <Box
                    component="img"
                    src={element.assetUrl || element.content}
                    alt=""
                    draggable={false}
                    sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        pointerEvents: "none",
                    }}
                />
            </Box>
        );
    }

    return (
        <Box {...common}>
            <Typography
                component="span"
                sx={{
                    ...elementStyles(element, referenceWidth),
                    width: "100%",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                }}
            >
                {sampleContent(element.content)}
            </Typography>
        </Box>
    );
}

const CertificateCanvas = forwardRef(function CertificateCanvas(
    {
        layout,
        widthMm = 297,
        heightMm = 210,
        selectedId = null,
        interactive = false,
        onSelect,
        sx = {},
    },
    ref,
) {
    const landscapeWidth = Number(widthMm) || 297;
    const landscapeHeight = Number(heightMm) || 210;
    const referenceWidth =
        landscapeWidth >= landscapeHeight ? 960 : 620;
    const elements = layout?.elements || [];

    return (
        <Box
            ref={ref}
            onPointerDown={() => onSelect?.(null)}
            sx={{
                position: "relative",
                containerType: "inline-size",
                width: "100%",
                aspectRatio: `${landscapeWidth} / ${landscapeHeight}`,
                bgcolor: layout?.background?.color || "#ffffff",
                backgroundImage: layout?.background?.image
                    ? `url("${layout.background.image}")`
                    : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                overflow: "hidden",
                boxShadow: "0 24px 70px rgba(21, 31, 55, 0.18)",
                ...sx,
                "& > *": {
                    "--page-width": landscapeWidth,
                    "--page-height": landscapeHeight,
                },
            }}
        >
            {elements.map((element) => (
                <CanvasElement
                    key={element.id}
                    element={{
                        ...element,
                        x: (Number(element.x) / landscapeWidth) * 297,
                        y: (Number(element.y) / landscapeHeight) * 210,
                        width: (Number(element.width) / landscapeWidth) * 297,
                        height: (Number(element.height) / landscapeHeight) * 210,
                    }}
                    selected={selectedId === element.id}
                    interactive={interactive}
                    onSelect={onSelect}
                    referenceWidth={referenceWidth}
                />
            ))}
        </Box>
    );
});

export default CertificateCanvas;
