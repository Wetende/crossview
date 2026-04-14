import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    Paper,
    Stack,
    Tab,
    Tabs,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    PlayArrow as RunIcon,
    RestartAlt as ResetIcon,
    Check as SubmitIcon,
    Code as CodeIcon,
    Visibility as PreviewIcon,
    TerminalRounded as ConsoleIcon,
    ContentCopy as CopyIcon,
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon,
} from "@mui/icons-material";
import DOMPurify from "dompurify";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";

/**
 * Language → CodeMirror extension mapping.
 * Keep in sync with the builder's LANGUAGE_CONFIG.
 */
const LANG_EXTENSIONS = {
    html_css_js: [html()],
    javascript: [javascript()],
    python: [python()],
    java: [java()],
    c_cpp: [cpp()],
};

const LANG_LABELS = {
    html_css_js: "HTML / CSS / JS",
    javascript: "JavaScript",
    python: "Python",
    java: "Java",
    c_cpp: "C / C++",
};

/**
 * Build the srcdoc string for the sandboxed iframe.
 * Captures console.log/warn/error into a postMessage to the parent.
 */
const buildIframeSrcdoc = (code, language) => {
    if (language === "html_css_js") {
        // Inject console capture script into the HTML
        const consoleCapture = `
<script>
(function() {
    var _origLog = console.log;
    var _origWarn = console.warn;
    var _origError = console.error;
    function send(level, args) {
        try {
            window.parent.postMessage({
                type: 'console',
                level: level,
                data: Array.from(args).map(function(a) {
                    if (typeof a === 'object') return JSON.stringify(a, null, 2);
                    return String(a);
                }).join(' ')
            }, '*');
        } catch(e) {}
    }
    console.log = function() { send('log', arguments); _origLog.apply(console, arguments); };
    console.warn = function() { send('warn', arguments); _origWarn.apply(console, arguments); };
    console.error = function() { send('error', arguments); _origError.apply(console, arguments); };
    window.addEventListener('error', function(e) {
        send('error', [e.message + ' (line ' + e.lineno + ')']);
    });
})();
</script>`;
        // Insert console capture at the top of <head> (or before anything else)
        if (code.includes("<head>")) {
            return code.replace("<head>", "<head>" + consoleCapture);
        }
        // No <head> tag — wrap the whole code
        return consoleCapture + code;
    }

    if (language === "javascript") {
        // Wrap standalone JS in an HTML shell with console capture
        return `<!DOCTYPE html>
<html>
<head>
<style>
    body { font-family: monospace; padding: 1rem; background: #1e1e1e; color: #d4d4d4; white-space: pre-wrap; }
</style>
<script>
(function() {
    var output = [];
    var _origLog = console.log;
    function send(level, args) {
        var text = Array.from(args).map(function(a) {
            if (typeof a === 'object') return JSON.stringify(a, null, 2);
            return String(a);
        }).join(' ');
        output.push(text);
        document.getElementById('output').textContent = output.join('\\n');
        try {
            window.parent.postMessage({ type: 'console', level: level, data: text }, '*');
        } catch(e) {}
    }
    console.log = function() { send('log', arguments); _origLog.apply(console, arguments); };
    console.warn = function() { send('warn', arguments); };
    console.error = function() { send('error', arguments); };
    window.addEventListener('error', function(e) {
        send('error', [e.message + ' (line ' + e.lineno + ')']);
    });
})();
</script>
</head>
<body>
<div id="output"></div>
<script>
${code}
</script>
</body>
</html>`;
    }

    // For server-side languages (python, java, c_cpp) — show a placeholder message
    return `<!DOCTYPE html>
<html>
<head><style>
body { font-family: sans-serif; padding: 2rem; text-align: center; color: #888; background: #1e1e1e; }
h2 { color: #ccc; }
</style></head>
<body>
<h2>⚙️ Server execution required</h2>
<p>${LANG_LABELS[language] || language} code execution is coming soon.<br/>For now, review your code in the editor.</p>
</body>
</html>`;
};

/**
 * CodeLabRenderer — Student-facing interactive code playground.
 *
 * Props follow the same pattern as VideoRenderer / TextRenderer:
 *   - `node` contains `properties` with all code-lab data
 *   - `enrollmentId` for persistence
 *   - `onComplete` callback to mark lesson complete
 */
const CodeLabRenderer = ({ node, enrollmentId, onComplete }) => {
    const props = node?.properties || {};
    const language = props.language || "html_css_js";
    const starterCode = props.starter_code || "";
    const instructionsHtml = props.instructions || props.content || "";
    const allowReset = props.allow_reset !== false;
    const showConsole = props.show_console !== false;
    const layoutPref = props.layout || "split_horizontal";

    // ── Local state ──
    const storageKey = `codelab_${enrollmentId}_${node?.id}`;
    const [code, setCode] = useState(() => {
        // Restore from localStorage if available
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) return saved;
        } catch {
            /* ignore */
        }
        return starterCode;
    });
    const [consoleOutput, setConsoleOutput] = useState([]);
    const [hasRun, setHasRun] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activePane, setActivePane] = useState("editor"); // for tabbed layout
    const iframeRef = useRef(null);
    const [iframeKey, setIframeKey] = useState(0); // Force iframe re-render

    // CodeMirror extensions
    const cmExtensions = useMemo(
        () => LANG_EXTENSIONS[language] || [javascript()],
        [language],
    );

    // ── Auto-save to localStorage ──
    const handleCodeChange = useCallback(
        (value) => {
            setCode(value);
            try {
                localStorage.setItem(storageKey, value);
            } catch {
                /* ignore */
            }
        },
        [storageKey],
    );

    // ── Console message listener ──
    const handleMessage = useCallback((event) => {
        if (event.data?.type === "console") {
            setConsoleOutput((prev) => [
                ...prev,
                {
                    level: event.data.level,
                    text: event.data.data,
                    ts: Date.now(),
                },
            ]);
        }
    }, []);

    // Attach/detach message listener
    useEffect(() => {
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [handleMessage]);

    // ── Run code ──
    const handleRun = useCallback(() => {
        setConsoleOutput([]);
        setHasRun(true);
        // Force iframe remount
        setIframeKey((k) => k + 1);
    }, []);

    // ── Reset ──
    const handleReset = useCallback(() => {
        setCode(starterCode);
        setConsoleOutput([]);
        setHasRun(false);
        try {
            localStorage.removeItem(storageKey);
        } catch {
            /* ignore */
        }
        setIframeKey((k) => k + 1);
    }, [starterCode, storageKey]);

    // ── Submit / Mark Complete ──
    const handleSubmit = useCallback(() => {
        onComplete?.();
    }, [onComplete]);

    // ── Copy code ──
    const handleCopy = useCallback(() => {
        navigator.clipboard?.writeText(code);
    }, [code]);

    // ── Toggle fullscreen ──
    const handleFullscreen = useCallback(() => {
        setIsFullscreen((f) => !f);
    }, []);

    // Sanitized instructions
    const sanitizedInstructions = DOMPurify.sanitize(instructionsHtml);

    // Build srcdoc
    const srcdoc = useMemo(
        () => buildIframeSrcdoc(code, language),
        [code, language, iframeKey],
    );

    // Decide if preview is browser-runnable
    const isBrowserRunnable =
        language === "html_css_js" || language === "javascript";

    // ── Layout rendering ──
    const isHorizontal = layoutPref === "split_horizontal";

    const editorPanel = (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                minHeight: 0,
            }}
        >
            {/* Editor toolbar */}
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                    px: 1.5,
                    py: 0.75,
                    bgcolor: "#1e1e1e",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <Stack direction="row" spacing={1} alignItems="center">
                    <CodeIcon sx={{ fontSize: 16, color: "#4ec9b0" }} />
                    <Typography
                        variant="caption"
                        sx={{ color: "#ccc", fontWeight: 600 }}
                    >
                        {LANG_LABELS[language] || language}
                    </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Copy code">
                        <IconButton size="small" onClick={handleCopy}>
                            <CopyIcon
                                sx={{ fontSize: 16, color: "#888" }}
                            />
                        </IconButton>
                    </Tooltip>
                    <Tooltip
                        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    >
                        <IconButton size="small" onClick={handleFullscreen}>
                            {isFullscreen ? (
                                <FullscreenExitIcon
                                    sx={{ fontSize: 16, color: "#888" }}
                                />
                            ) : (
                                <FullscreenIcon
                                    sx={{ fontSize: 16, color: "#888" }}
                                />
                            )}
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Stack>

            {/* CodeMirror editor */}
            <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                <CodeMirror
                    value={code}
                    height={isFullscreen ? "calc(100vh - 200px)" : "400px"}
                    theme={vscodeDark}
                    extensions={cmExtensions}
                    onChange={handleCodeChange}
                    basicSetup={{
                        lineNumbers: true,
                        foldGutter: true,
                        autocompletion: true,
                        bracketMatching: true,
                        highlightActiveLine: true,
                    }}
                />
            </Box>
        </Box>
    );

    const outputPanel = (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                minHeight: 0,
                bgcolor: "#fff",
            }}
        >
            {/* Output header */}
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                    px: 1.5,
                    py: 0.75,
                    bgcolor: "#f5f5f5",
                    borderBottom: "1px solid #e0e0e0",
                }}
            >
                <Stack direction="row" spacing={1} alignItems="center">
                    <PreviewIcon sx={{ fontSize: 16, color: "#666" }} />
                    <Typography
                        variant="caption"
                        sx={{ color: "#666", fontWeight: 600 }}
                    >
                        Output
                    </Typography>
                </Stack>
                {!hasRun && (
                    <Typography variant="caption" color="text.disabled">
                        Click "Run" to see output
                    </Typography>
                )}
            </Stack>

            {/* Iframe preview */}
            <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                {hasRun && isBrowserRunnable ? (
                    <iframe
                        key={iframeKey}
                        ref={iframeRef}
                        srcDoc={srcdoc}
                        title="Code output"
                        sandbox="allow-scripts"
                        style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                            background: "#fff",
                        }}
                    />
                ) : hasRun && !isBrowserRunnable ? (
                    <Box
                        sx={{
                            p: 3,
                            textAlign: "center",
                            color: "text.secondary",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "column",
                        }}
                    >
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            ⚙️ Server-side execution for{" "}
                            <strong>{LANG_LABELS[language]}</strong> is coming
                            soon.
                        </Typography>
                        <Typography variant="caption">
                            Your code is saved. An instructor will review it upon
                            submission.
                        </Typography>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            p: 4,
                            textAlign: "center",
                            color: "text.disabled",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Typography variant="body2">
                            Output will appear here after you run your code.
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Console panel */}
            {showConsole && (
                <Box
                    sx={{
                        maxHeight: 150,
                        overflow: "auto",
                        bgcolor: "#1e1e1e",
                        borderTop: "1px solid #333",
                    }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ px: 1.5, py: 0.5 }}
                    >
                        <ConsoleIcon sx={{ fontSize: 14, color: "#888" }} />
                        <Typography
                            variant="caption"
                            sx={{ color: "#888", fontWeight: 600 }}
                        >
                            Console
                        </Typography>
                        {consoleOutput.length > 0 && (
                            <Chip
                                label={consoleOutput.length}
                                size="small"
                                sx={{
                                    height: 16,
                                    fontSize: "0.65rem",
                                    bgcolor: "#333",
                                    color: "#ccc",
                                }}
                            />
                        )}
                    </Stack>
                    {consoleOutput.length === 0 ? (
                        <Typography
                            variant="caption"
                            sx={{ px: 1.5, pb: 1, color: "#555", display: "block" }}
                        >
                            No console output yet.
                        </Typography>
                    ) : (
                        consoleOutput.map((entry, idx) => (
                            <Typography
                                key={idx}
                                variant="caption"
                                component="div"
                                sx={{
                                    px: 1.5,
                                    py: 0.25,
                                    fontFamily: "monospace",
                                    fontSize: "0.75rem",
                                    color:
                                        entry.level === "error"
                                            ? "#f44336"
                                            : entry.level === "warn"
                                              ? "#ff9800"
                                              : "#d4d4d4",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                }}
                            >
                                {entry.text}
                            </Typography>
                        ))
                    )}
                </Box>
            )}
        </Box>
    );

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                ...(isFullscreen && {
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1300,
                    bgcolor: "background.paper",
                }),
            }}
        >
            {/* Instructions bar */}
            {sanitizedInstructions && (
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2, md: 3 },
                        borderRadius: isFullscreen ? 0 : 2,
                        mb: isFullscreen ? 0 : 2,
                        bgcolor: "background.paper",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        "& h1, & h2, & h3": { fontWeight: 700, mt: 1, mb: 1 },
                        "& p": { mb: 1, lineHeight: 1.6 },
                        "& ul, & ol": { mb: 1, pl: 2 },
                        "& code": {
                            bgcolor: "action.hover",
                            px: 0.5,
                            borderRadius: 0.5,
                            fontFamily: "monospace",
                            fontSize: "0.9em",
                        },
                    }}
                >
                    <div
                        dangerouslySetInnerHTML={{
                            __html: sanitizedInstructions,
                        }}
                    />
                </Paper>
            )}

            {/* Split-pane editor + output */}
            <Paper
                variant="outlined"
                sx={{
                    borderRadius: isFullscreen ? 0 : 2,
                    overflow: "hidden",
                    flex: isFullscreen ? 1 : undefined,
                    display: "flex",
                    flexDirection: isHorizontal ? "row" : "column",
                    minHeight: isFullscreen ? 0 : 500,
                }}
            >
                {layoutPref === "tabbed" ? (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            width: "100%",
                            height: "100%",
                        }}
                    >
                        <Tabs
                            value={activePane}
                            onChange={(_, v) => setActivePane(v)}
                            sx={{
                                bgcolor: "#252526",
                                "& .MuiTab-root": { color: "#888" },
                                "& .Mui-selected": { color: "#fff" },
                            }}
                        >
                            <Tab
                                value="editor"
                                label="Editor"
                                icon={<CodeIcon sx={{ fontSize: 16 }} />}
                                iconPosition="start"
                                sx={{
                                    textTransform: "none",
                                    minHeight: 40,
                                    py: 0,
                                }}
                            />
                            <Tab
                                value="output"
                                label="Output"
                                icon={<PreviewIcon sx={{ fontSize: 16 }} />}
                                iconPosition="start"
                                sx={{
                                    textTransform: "none",
                                    minHeight: 40,
                                    py: 0,
                                }}
                            />
                        </Tabs>
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            {activePane === "editor"
                                ? editorPanel
                                : outputPanel}
                        </Box>
                    </Box>
                ) : (
                    <>
                        <Box
                            sx={{
                                flex: 1,
                                minWidth: 0,
                                minHeight: 0,
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            {editorPanel}
                        </Box>
                        <Divider
                            orientation={
                                isHorizontal ? "vertical" : "horizontal"
                            }
                            flexItem
                        />
                        <Box
                            sx={{
                                flex: 1,
                                minWidth: 0,
                                minHeight: 0,
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            {outputPanel}
                        </Box>
                    </>
                )}
            </Paper>

            {/* Action bar */}
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                    mt: isFullscreen ? 0 : 2,
                    p: isFullscreen ? 1.5 : 0,
                    borderTop: isFullscreen ? "1px solid" : "none",
                    borderColor: "divider",
                }}
            >
                <Stack direction="row" spacing={1}>
                    {allowReset && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ResetIcon />}
                            onClick={handleReset}
                            sx={{ textTransform: "none" }}
                        >
                            Reset
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<RunIcon />}
                        onClick={handleRun}
                        color="success"
                        sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                        Run ▶
                    </Button>
                </Stack>
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<SubmitIcon />}
                    onClick={handleSubmit}
                    sx={{ textTransform: "none" }}
                >
                    Submit & Complete
                </Button>
            </Stack>
        </Box>
    );
};

export default CodeLabRenderer;
