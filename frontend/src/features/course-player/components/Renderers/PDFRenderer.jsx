"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
    Box,
    IconButton,
    Stack,
    Typography,
    TextField,
    Tooltip,
    Paper,
    CircularProgress,
    Slider,
} from "@mui/material";
import {
    IconChevronLeft,
    IconChevronRight,
    IconZoomIn,
    IconZoomOut,
    IconDownload,
    IconPrinter,
    IconMaximize,
    IconMinimize,
    IconReload,
} from "@tabler/icons-react";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * PDFRenderer - Full-featured PDF viewer for course lessons
 *
 * Features:
 * - Page navigation (prev/next, go to page)
 * - Zoom controls (+/-, fit to width)
 * - Download button
 * - Print button
 * - Fullscreen toggle
 * - Progress tracking
 */
export default function PDFRenderer({
    url,
    allowDownload = true,
    allowPrint = true,
    requiredPages = 0,
    initialPagesViewed = [],
    onProgress,
    onComplete,
}) {
    const initialPagesKey = initialPagesViewed.join(",");
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [pagesViewed, setPagesViewed] = useState(
        new Set(initialPagesViewed.length ? initialPagesViewed : [1]),
    );
    const completionFiredRef = useRef(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Document loaded callback
    const onDocumentLoadSuccess = useCallback(
        ({ numPages }) => {
            setNumPages(numPages);
            setLoading(false);
            setError(null);

            if (onProgress) {
                onProgress(1, numPages, 1);
            }

            if (
                !completionFiredRef.current &&
                requiredPages > 0 &&
                requiredPages <= 1 &&
                onComplete
            ) {
                completionFiredRef.current = true;
                onComplete();
            }
        },
        [onComplete, onProgress, requiredPages],
    );

    // Document load error
    const onDocumentLoadError = useCallback((error) => {
        console.error("PDF load error:", error);
        setError("Failed to load PDF document");
        setLoading(false);
    }, []);

    useEffect(() => {
        setNumPages(null);
        setPageNumber(1);
        setScale(1.0);
        const restoredPages = initialPagesKey
            ? initialPagesKey.split(",").map(Number)
            : [1];
        setPagesViewed(new Set(restoredPages));
        completionFiredRef.current = false;
        setLoading(true);
        setError(null);
    }, [url, requiredPages, initialPagesKey]);

    // Track page view
    const trackPageView = useCallback(
        (page) => {
            setPagesViewed((prev) => {
                const newSet = new Set(prev);
                newSet.add(page);

                // Notify progress
                if (onProgress && numPages) {
                    onProgress(newSet.size, numPages, page);
                }

                // Check completion requirement
                if (
                    !completionFiredRef.current &&
                    requiredPages > 0 &&
                    newSet.size >= requiredPages &&
                    onComplete
                ) {
                    completionFiredRef.current = true;
                    onComplete();
                }

                return newSet;
            });
        },
        [numPages, onProgress, onComplete, requiredPages],
    );

    // Navigation handlers
    const goToPrevPage = () => {
        const newPage = Math.max(1, pageNumber - 1);
        setPageNumber(newPage);
        trackPageView(newPage);
    };

    const goToNextPage = () => {
        const newPage = Math.min(numPages || 1, pageNumber + 1);
        setPageNumber(newPage);
        trackPageView(newPage);
    };

    const goToPage = (page) => {
        const targetPage = Math.max(1, Math.min(numPages || 1, page));
        setPageNumber(targetPage);
        trackPageView(targetPage);
    };

    // Zoom handlers
    const zoomIn = () => setScale((prev) => Math.min(3.0, prev + 0.25));
    const zoomOut = () => setScale((prev) => Math.max(0.5, prev - 0.25));
    const resetZoom = () => setScale(1.0);

    // Download handler
    const handleDownload = async () => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = url.split("/").pop() || "document.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error("Download failed:", err);
        }
    };

    // Print handler
    const handlePrint = () => {
        const printWindow = window.open(url, "_blank");
        if (printWindow) {
            printWindow.addEventListener("load", () => {
                printWindow.print();
            });
        }
    };

    // Fullscreen handler
    const toggleFullscreen = () => {
        const container = document.getElementById("pdf-container");
        if (!container) return;

        if (!isFullscreen) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            }
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            setIsFullscreen(false);
        }
    };

    // Keyboard navigation
    const handleKeyDown = (e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            goToPrevPage();
        } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            goToNextPage();
        }
    };

    return (
        <Box
            id="pdf-container"
            sx={{
                display: "flex",
                flexDirection: "column",
                height: isFullscreen ? "100vh" : "auto",
                minHeight: 500,
                bgcolor: "grey.100",
                borderRadius: 2,
                overflow: "hidden",
            }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            {/* Toolbar */}
            <Paper
                elevation={1}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1,
                    borderRadius: 0,
                    bgcolor: "background.paper",
                    borderBottom: 1,
                    borderColor: "divider",
                }}
            >
                {/* Left: Page Navigation */}
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Tooltip title="Previous Page">
                        <span>
                            <IconButton
                                onClick={goToPrevPage}
                                disabled={pageNumber <= 1}
                                size="small"
                            >
                                <IconChevronLeft size={20} />
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <TextField
                            size="small"
                            type="number"
                            value={pageNumber}
                            onChange={(e) =>
                                goToPage(parseInt(e.target.value) || 1)
                            }
                            sx={{ width: 60 }}
                            inputProps={{
                                min: 1,
                                max: numPages || 1,
                                style: { textAlign: "center" },
                            }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            / {numPages || "—"}
                        </Typography>
                    </Stack>

                    <Tooltip title="Next Page">
                        <span>
                            <IconButton
                                onClick={goToNextPage}
                                disabled={pageNumber >= (numPages || 1)}
                                size="small"
                            >
                                <IconChevronRight size={20} />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Stack>

                {/* Center: Zoom Controls */}
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Tooltip title="Zoom Out">
                        <IconButton
                            onClick={zoomOut}
                            disabled={scale <= 0.5}
                            size="small"
                        >
                            <IconZoomOut size={20} />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Reset Zoom">
                        <IconButton onClick={resetZoom} size="small">
                            <IconReload size={18} />
                        </IconButton>
                    </Tooltip>

                    <Typography
                        variant="body2"
                        sx={{ minWidth: 50, textAlign: "center" }}
                    >
                        {Math.round(scale * 100)}%
                    </Typography>

                    <Tooltip title="Zoom In">
                        <IconButton
                            onClick={zoomIn}
                            disabled={scale >= 3.0}
                            size="small"
                        >
                            <IconZoomIn size={20} />
                        </IconButton>
                    </Tooltip>
                </Stack>

                {/* Right: Actions */}
                <Stack direction="row" alignItems="center" spacing={1}>
                    {allowDownload && (
                        <Tooltip title="Download PDF">
                            <IconButton onClick={handleDownload} size="small">
                                <IconDownload size={20} />
                            </IconButton>
                        </Tooltip>
                    )}

                    {allowPrint && (
                        <Tooltip title="Print PDF">
                            <IconButton onClick={handlePrint} size="small">
                                <IconPrinter size={20} />
                            </IconButton>
                        </Tooltip>
                    )}

                    <Tooltip
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                        <IconButton onClick={toggleFullscreen} size="small">
                            {isFullscreen ? (
                                <IconMinimize size={20} />
                            ) : (
                                <IconMaximize size={20} />
                            )}
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Paper>

            {/* PDF View Area */}
            <Box
                sx={{
                    flexGrow: 1,
                    overflow: "auto",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    py: 2,
                    bgcolor: "grey.200",
                }}
            >
                {loading && (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: 300,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                        <Typography color="error">{error}</Typography>
                    </Box>
                )}

                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={null}
                >
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        loading={
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    p: 4,
                                }}
                            >
                                <CircularProgress size={24} />
                            </Box>
                        }
                    />
                </Document>
            </Box>

            {/* Progress indicator */}
            {requiredPages > 0 && numPages && (
                <Box
                    sx={{
                        px: 2,
                        py: 1,
                        bgcolor: "background.paper",
                        borderTop: 1,
                        borderColor: "divider",
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="caption" color="text.secondary">
                            Progress: {pagesViewed.size} of {numPages} pages
                            viewed
                        </Typography>
                        <Box sx={{ flexGrow: 1 }}>
                            <Slider
                                value={(pagesViewed.size / numPages) * 100}
                                disabled
                                size="small"
                                sx={{ py: 0 }}
                            />
                        </Box>
                        {pagesViewed.size >= requiredPages && (
                            <Typography
                                variant="caption"
                                color="success.main"
                                fontWeight="bold"
                                aria-label="Requirement met"
                            >
                                ✓
                            </Typography>
                        )}
                    </Stack>
                </Box>
            )}
        </Box>
    );
}
