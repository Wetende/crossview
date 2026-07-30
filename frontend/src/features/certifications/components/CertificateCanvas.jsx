import { forwardRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Box, Typography } from "@mui/material";

import {
    certificateSampleContent,
    fitCertificateText,
} from "@/features/certifications/certificateContent";

function elementStyles(element, referenceWidth, fit) {
    const styles = element.styles || {};
    const shadow = styles.textShadow
        ? `${styles.shadowOffsetX ?? 1}px ${styles.shadowOffsetY ?? 1}px ${
              styles.shadowBlur ?? 2
          }px ${styles.shadowColor || "#000000"}`
        : "none";
    return {
        fontFamily: styles.fontFamily || "Albert Sans",
        fontSize: `${((fit?.fontSize || styles.fontSize || 16) / referenceWidth) * 100}cqw`,
        fontWeight: styles.fontWeight || 400,
        fontStyle: styles.fontStyle || "normal",
        textDecoration: styles.textDecoration || "none",
        textTransform: styles.textTransform || "none",
        textShadow: shadow,
        color: styles.color || "#172033",
        textAlign: styles.textAlign || "center",
        lineHeight: styles.lineHeight || 1.2,
        opacity: styles.opacity ?? 1,
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
    pageWidth,
    pageHeight,
    sampleProfile,
}) {
    const content = certificateSampleContent(element.content, sampleProfile);
    const isText = ["text", "dynamic_text"].includes(element.type);
    const textFit = isText
        ? fitCertificateText({
              text: content,
              element,
              pageWidthMm: pageWidth,
              pageHeightMm: pageHeight,
          })
        : null;
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
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
            left: `${(element.x / pageWidth) * 100}%`,
            top: `${(element.y / pageHeight) * 100}%`,
            width: `${(element.width / pageWidth) * 100}%`,
            height: `${(element.height / pageHeight) * 100}%`,
            transform: `${translate || ""} rotate(${element.rotation || 0}deg)`,
            transformOrigin: "center",
            display: element.hidden ? "none" : "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: element.zIndex || 1,
            cursor: interactive
                ? element.locked
                    ? "not-allowed"
                    : "grab"
                : "default",
            opacity: isDragging ? 0.74 : 1,
            outline: selected
                ? `2px solid ${textFit?.overflows ? "#d97706" : "#3157d5"}`
                : "1px solid transparent",
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
                    borderRadius:
                        element.shape === "circle"
                            ? "50%"
                            : `${shapeStyles.borderRadius || 0}px`,
                    opacity: shapeStyles.opacity ?? 1,
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
                        opacity: element.styles?.opacity ?? 1,
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
                    background: `repeating-conic-gradient(${
                        element.styles?.foreground || "#172033"
                    } 0 25%, ${
                        element.styles?.background || "#ffffff"
                    } 0 50%) 50% / 8px 8px`,
                    border: `${element.styles?.borderWidth || 0}px solid ${
                        element.styles?.borderColor || "transparent"
                    }`,
                    boxShadow: `inset 0 0 0 ${
                        element.styles?.padding ?? 1.5
                    }mm ${element.styles?.background || "#ffffff"}`,
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
                        objectFit: element.styles?.objectFit || "contain",
                        opacity: element.styles?.opacity ?? 1,
                        border: `${element.styles?.borderWidth || 0}px solid ${
                            element.styles?.borderColor || "transparent"
                        }`,
                        borderRadius: `${element.styles?.borderRadius || 0}px`,
                        boxSizing: "border-box",
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
                    ...elementStyles(element, referenceWidth, textFit),
                    width: "100%",
                    whiteSpace: element.styles?.singleLine
                        ? "nowrap"
                        : "pre-wrap",
                    overflowWrap: element.styles?.singleLine
                        ? "normal"
                        : "anywhere",
                    overflow: "hidden",
                    textOverflow: element.styles?.singleLine
                        ? element.styles?.textOverflow || "ellipsis"
                        : "clip",
                }}
            >
                {content}
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
        sampleProfile = "standard",
        showSafeArea = false,
        sx = {},
    },
    ref,
) {
    const landscapeWidth = Number(widthMm) || 297;
    const landscapeHeight = Number(heightMm) || 210;
    const referenceWidth = landscapeWidth >= landscapeHeight ? 960 : 620;
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
                    element={element}
                    selected={selectedId === element.id}
                    interactive={interactive}
                    onSelect={onSelect}
                    referenceWidth={referenceWidth}
                    pageWidth={landscapeWidth}
                    pageHeight={landscapeHeight}
                    sampleProfile={sampleProfile}
                />
            ))}
            {showSafeArea && (
                <Box
                    aria-hidden="true"
                    sx={{
                        pointerEvents: "none",
                        position: "absolute",
                        zIndex: 10_000,
                        left: `${((layout?.safeAreaMm || 0) / landscapeWidth) * 100}%`,
                        right: `${((layout?.safeAreaMm || 0) / landscapeWidth) * 100}%`,
                        top: `${((layout?.safeAreaMm || 0) / landscapeHeight) * 100}%`,
                        bottom: `${((layout?.safeAreaMm || 0) / landscapeHeight) * 100}%`,
                        border: "1px dashed rgba(217, 119, 6, .75)",
                        boxShadow: "0 0 0 1px rgba(255,255,255,.7)",
                    }}
                />
            )}
        </Box>
    );
});

export default CertificateCanvas;
