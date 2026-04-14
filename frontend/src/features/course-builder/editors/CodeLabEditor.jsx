import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import {
    Box,
    Typography,
    Button,
    TextField,
    Tabs,
    Tab,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Paper,
    Tooltip,
    Snackbar,
    Alert,
    FormHelperText,
    Chip,
    Divider,
    IconButton,
    Collapse,
} from "@mui/material";
import {
    Code as CodeIcon,
    InfoOutlined as InfoIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    RestartAlt as ResetIcon,
} from "@mui/icons-material";
import RichTextEditor from "@/components/RichTextEditor";
import FileUploader from "@/components/FileUploader";
import GamificationSettings from "../components/GamificationSettings";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";

/**
 * Language configuration map — defines display name, CodeMirror extension,
 * and default starter code for each supported language.
 */
const LANGUAGE_CONFIG = {
    html_css_js: {
        label: "HTML / CSS / JS",
        extensions: [html()],
        defaultCode: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; padding: 2rem; }
        h1 { color: #1976d2; }
    </style>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>Edit this code and click <strong>Run</strong> to see the result.</p>

    <script>
        console.log("Hello from the console!");
    </script>
</body>
</html>`,
    },
    javascript: {
        label: "JavaScript",
        extensions: [javascript()],
        defaultCode: `// Write your JavaScript code here\nfunction greet(name) {\n    return "Hello, " + name + "!";\n}\n\nconsole.log(greet("World"));\n`,
    },
    python: {
        label: "Python",
        extensions: [python()],
        defaultCode: `# Write your Python code here\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("World"))\n`,
    },
    java: {
        label: "Java",
        extensions: [java()],
        defaultCode: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n`,
    },
    c_cpp: {
        label: "C / C++",
        extensions: [cpp()],
        defaultCode: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n`,
    },
};

/** Layout options for the student-facing editor */
const LAYOUT_OPTIONS = [
    { value: "split_horizontal", label: "Side by side" },
    { value: "split_vertical", label: "Top / bottom" },
    { value: "tabbed", label: "Tabbed" },
];

export default function CodeLabEditor({ node, onSave, blueprint }) {
    const TITLE_MIN_LENGTH = 5;
    const TITLE_MAX_LENGTH = 100;

    // Feature flags from blueprint
    const featureFlags = blueprint?.featureFlags || {};

    // Core fields
    const [title, setTitle] = useState(node.title);
    const [activeTab, setActiveTab] = useState("lesson");
    const [description, setDescription] = useState(node.description || "");
    const [duration, setDuration] = useState(node.properties?.duration || "");
    const [isPreview, setIsPreview] = useState(
        node.properties?.is_preview || false,
    );
    const [files, setFiles] = useState(node.properties?.files || []);

    // ── Code Lab specific fields ──
    const [language, setLanguage] = useState(
        node.properties?.language || "html_css_js",
    );
    const [starterCode, setStarterCode] = useState(
        node.properties?.starter_code ||
            LANGUAGE_CONFIG["html_css_js"].defaultCode,
    );
    const [solutionCode, setSolutionCode] = useState(
        node.properties?.solution_code || "",
    );
    const [instructions, setInstructions] = useState(
        node.properties?.instructions || "",
    );
    const [allowReset, setAllowReset] = useState(
        node.properties?.allow_reset !== false,
    );
    const [showConsole, setShowConsole] = useState(
        node.properties?.show_console !== false,
    );
    const [layout, setLayout] = useState(
        node.properties?.layout || "split_horizontal",
    );

    // UI state
    const [solutionOpen, setSolutionOpen] = useState(false);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    // Gamification settings (only used when featureFlags.gamification is true)
    const [gamificationSettings, setGamificationSettings] = useState(
        node.properties?.gamification || {},
    );

    // Detect if this is a new node
    const isNew =
        !node.id ||
        node.id.toString().startsWith("temp_") ||
        node.title === "Untitled Lesson";

    // When language changes, update the starter code if it was still default
    const handleLanguageChange = (newLang) => {
        const oldConfig = LANGUAGE_CONFIG[language];
        const newConfig = LANGUAGE_CONFIG[newLang];
        // If code is unchanged from default, swap in the new default
        if (starterCode === oldConfig?.defaultCode) {
            setStarterCode(newConfig?.defaultCode || "");
        }
        setLanguage(newLang);
    };

    // ── Validation ──
    const handleBlur = (fieldName) => {
        setTouched((prev) => ({ ...prev, [fieldName]: true }));
    };

    const touchAllFields = () => {
        setTouched({
            title: true,
            duration: true,
            description: true,
            starterCode: true,
        });
    };

    const getFieldError = (fieldName) => {
        return touched[fieldName] ? errors[fieldName] : undefined;
    };

    const validate = () => {
        const newErrors = {};

        if (!title || title.trim().length < TITLE_MIN_LENGTH) {
            newErrors.title = `Title must be at least ${TITLE_MIN_LENGTH} characters`;
        } else if (title.length > TITLE_MAX_LENGTH) {
            newErrors.title = `Title must be ${TITLE_MAX_LENGTH} characters or less`;
        }

        if (!duration || duration.trim() === "") {
            newErrors.duration = "Duration is required";
        }

        const descText = description.replace(/<[^>]*>/g, "");
        if (!descText || descText.length < 50) {
            newErrors.description =
                "Description must be at least 50 characters";
        }

        if (!starterCode || starterCode.trim().length < 10) {
            newErrors.starterCode =
                "Starter code must be at least 10 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isFormValid = () => {
        if (
            !title ||
            title.trim().length < TITLE_MIN_LENGTH ||
            title.length > TITLE_MAX_LENGTH
        )
            return false;
        if (!duration || duration.trim() === "") return false;
        const descText = description.replace(/<[^>]*>/g, "");
        if (descText.length < 50) return false;
        if (!starterCode || starterCode.trim().length < 10) return false;
        return true;
    };

    // ── Save ──
    const handleSave = () => {
        touchAllFields();
        if (!validate()) {
            setSnackbar({
                open: true,
                message: "Please fix the validation errors",
                severity: "error",
            });
            return;
        }

        onSave(node.id, {
            title,
            description,
            properties: {
                ...node.properties,
                lesson_type: "code",
                language,
                starter_code: starterCode,
                solution_code: solutionCode,
                instructions,
                allow_reset: allowReset,
                show_console: showConsole,
                layout,
                duration,
                is_preview: isPreview,
                ...(featureFlags.gamification && {
                    gamification: gamificationSettings,
                }),
            },
        });

        setSnackbar({
            open: true,
            message: "Code Lab saved successfully!",
            severity: "success",
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // ── Derived values ──
    const trimmedTitleLength = title.trim().length;
    const descriptionTextLength = description.replace(/<[^>]*>/g, "").length;
    const titleMinLengthError =
        title.length > 0 && trimmedTitleLength < TITLE_MIN_LENGTH
            ? `Enter at least ${TITLE_MIN_LENGTH} characters.`
            : undefined;
    const titleMaxLengthError =
        title.length > TITLE_MAX_LENGTH
            ? `Use ${TITLE_MAX_LENGTH} characters or fewer.`
            : undefined;
    const titleErrorMessage =
        getFieldError("title") || titleMinLengthError || titleMaxLengthError;
    const descriptionMinLengthError =
        descriptionTextLength > 0 && descriptionTextLength < 50
            ? "Enter at least 50 characters."
            : undefined;
    const descriptionErrorMessage =
        getFieldError("description") || descriptionMinLengthError;

    // Get the CodeMirror extensions for the current language
    const cmExtensions = LANGUAGE_CONFIG[language]?.extensions || [
        javascript(),
    ];

    return (
        <Box>
            {/* Editor Header — mirrors ContentEditor pattern */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Box
                    sx={{
                        mr: 2,
                        display: "flex",
                        alignItems: "center",
                        color: "text.secondary",
                    }}
                >
                    <CodeIcon />
                    <Typography
                        variant="body2"
                        sx={{ ml: 1, textTransform: "capitalize" }}
                    >
                        Code Lab
                    </Typography>
                </Box>
                <TextField
                    variant="standard"
                    placeholder="Enter lesson name *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => handleBlur("title")}
                    fullWidth
                    error={!!titleErrorMessage}
                    helperText={titleErrorMessage}
                    InputProps={{ sx: { fontSize: "1.2rem", fontWeight: 500 } }}
                />
                <Button
                    variant="contained"
                    onClick={handleSave}
                    size="medium"
                    sx={{ ml: 2 }}
                    disabled={!isFormValid()}
                >
                    {isNew ? "Create" : "Save"}
                </Button>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                    <Tab
                        key="lesson"
                        label="Code Lab"
                        value="lesson"
                        sx={{ textTransform: "none", minWidth: 100 }}
                    />
                    <Tab
                        key="qa"
                        label="Q&A"
                        value="qa"
                        sx={{ textTransform: "none", minWidth: 100 }}
                    />
                </Tabs>
            </Box>

            {activeTab === "lesson" && (
                <Stack spacing={3}>
                    {/* ── Language & Layout Row ── */}
                    <Stack direction="row" spacing={2}>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel shrink sx={{ fontWeight: 500 }}>
                                Language *
                            </InputLabel>
                            <Select
                                value={language}
                                onChange={(e) =>
                                    handleLanguageChange(e.target.value)
                                }
                                label="Language *"
                            >
                                {Object.entries(LANGUAGE_CONFIG).map(
                                    ([key, config]) => (
                                        <MenuItem key={key} value={key}>
                                            {config.label}
                                        </MenuItem>
                                    ),
                                )}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel shrink sx={{ fontWeight: 500 }}>
                                Student layout
                            </InputLabel>
                            <Select
                                value={layout}
                                onChange={(e) => setLayout(e.target.value)}
                                label="Student layout"
                            >
                                {LAYOUT_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Duration *"
                            placeholder="e.g. 45m"
                            size="small"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            onBlur={() => handleBlur("duration")}
                            sx={{ width: 150 }}
                            error={!!getFieldError("duration")}
                            helperText={getFieldError("duration")}
                            InputLabelProps={{
                                shrink: true,
                                sx: { fontWeight: 500 },
                            }}
                            required
                        />
                    </Stack>

                    {/* ── Supported languages info ── */}
                    {(language === "python" ||
                        language === "java" ||
                        language === "c_cpp") && (
                        <Alert severity="info" variant="outlined">
                            <Typography variant="body2">
                                <strong>{LANGUAGE_CONFIG[language].label}</strong>{" "}
                                requires server-side execution (Judge0). For now,
                                students will see a code editor with syntax
                                highlighting but output will not auto-execute in
                                the browser. HTML/CSS/JS and standalone
                                JavaScript run fully in-browser.
                            </Typography>
                        </Alert>
                    )}

                    {/* ── Instructions (exercise prompt) ── */}
                    <Box onBlur={() => handleBlur("description")}>
                        <Typography
                            variant="body2"
                            color={
                                descriptionErrorMessage
                                    ? "error"
                                    : "text.secondary"
                            }
                            sx={{ mb: 1, fontWeight: "bold" }}
                        >
                            Exercise instructions *
                        </Typography>
                        <RichTextEditor
                            value={description}
                            onChange={setDescription}
                            placeholder="Describe the coding exercise. What should the student build? (min 50 characters)..."
                            minHeight={120}
                        />
                        {descriptionErrorMessage && (
                            <FormHelperText error>
                                {descriptionErrorMessage}
                            </FormHelperText>
                        )}
                        <Typography variant="caption" color="text.secondary">
                            {descriptionTextLength} characters
                        </Typography>
                    </Box>

                    {/* ── Starter Code ── */}
                    <Box>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mb: 1 }}
                        >
                            <Typography
                                variant="body2"
                                color={
                                    getFieldError("starterCode")
                                        ? "error"
                                        : "text.secondary"
                                }
                                sx={{ fontWeight: "bold" }}
                            >
                                Starter code *
                            </Typography>
                            <Tooltip title="Reset to language default">
                                <IconButton
                                    size="small"
                                    onClick={() =>
                                        setStarterCode(
                                            LANGUAGE_CONFIG[language]
                                                ?.defaultCode || "",
                                        )
                                    }
                                >
                                    <ResetIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                        <Paper
                            variant="outlined"
                            sx={{ borderRadius: 1, overflow: "hidden" }}
                        >
                            <CodeMirror
                                value={starterCode}
                                height="300px"
                                theme={vscodeDark}
                                extensions={cmExtensions}
                                onChange={(value) => setStarterCode(value)}
                                basicSetup={{
                                    lineNumbers: true,
                                    foldGutter: true,
                                    autocompletion: true,
                                }}
                            />
                        </Paper>
                        {getFieldError("starterCode") && (
                            <FormHelperText error>
                                {getFieldError("starterCode")}
                            </FormHelperText>
                        )}
                        <Typography variant="caption" color="text.secondary">
                            This is the code students see when they start the
                            exercise.
                        </Typography>
                    </Box>

                    {/* ── Solution Code (collapsible) ── */}
                    <Box>
                        <Button
                            size="small"
                            onClick={() => setSolutionOpen(!solutionOpen)}
                            endIcon={
                                solutionOpen ? (
                                    <ExpandLessIcon />
                                ) : (
                                    <ExpandMoreIcon />
                                )
                            }
                            sx={{ textTransform: "none", mb: 1 }}
                        >
                            Model solution (optional)
                        </Button>
                        <Collapse in={solutionOpen}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    borderRadius: 1,
                                    overflow: "hidden",
                                    mb: 1,
                                }}
                            >
                                <CodeMirror
                                    value={solutionCode}
                                    height="250px"
                                    theme={vscodeDark}
                                    extensions={cmExtensions}
                                    onChange={(value) =>
                                        setSolutionCode(value)
                                    }
                                    basicSetup={{
                                        lineNumbers: true,
                                        foldGutter: true,
                                        autocompletion: true,
                                    }}
                                />
                            </Paper>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Hidden from students. Used for instructor
                                reference only.
                            </Typography>
                        </Collapse>
                    </Box>

                    <Divider />

                    {/* ── Toggles ── */}
                    <Stack direction="row" spacing={4} flexWrap="wrap">
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={allowReset}
                                    onChange={(e) =>
                                        setAllowReset(e.target.checked)
                                    }
                                />
                            }
                            label={
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography variant="body2">
                                        Allow reset to starter code
                                    </Typography>
                                    <Tooltip
                                        title="Students can restore the original starter code"
                                        arrow
                                    >
                                        <InfoIcon
                                            fontSize="small"
                                            sx={{
                                                ml: 0.5,
                                                color: "primary.main",
                                                fontSize: 16,
                                                cursor: "help",
                                            }}
                                        />
                                    </Tooltip>
                                </Box>
                            }
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showConsole}
                                    onChange={(e) =>
                                        setShowConsole(e.target.checked)
                                    }
                                />
                            }
                            label={
                                <Typography variant="body2">
                                    Show console output
                                </Typography>
                            }
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isPreview}
                                    onChange={(e) =>
                                        setIsPreview(e.target.checked)
                                    }
                                />
                            }
                            label={
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography variant="body2">
                                        Lesson preview
                                    </Typography>
                                    <Tooltip
                                        title="Allow non-enrolled users to preview this lesson"
                                        arrow
                                    >
                                        <InfoIcon
                                            fontSize="small"
                                            sx={{
                                                ml: 0.5,
                                                color: "primary.main",
                                                fontSize: 16,
                                                cursor: "help",
                                            }}
                                        />
                                    </Tooltip>
                                </Box>
                            }
                        />
                    </Stack>

                    {/* Lesson Materials */}
                    <Box sx={{ mt: 3 }}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                        >
                            Lesson materials
                        </Typography>
                        <FileUploader
                            nodeId={node.id}
                            files={files}
                            onUploadComplete={(newFile) =>
                                setFiles([...files, newFile])
                            }
                            onDeleteComplete={(fileId) =>
                                setFiles(files.filter((f) => f.id !== fileId))
                            }
                        />
                    </Box>

                    {/* Gamification Settings */}
                    {featureFlags.gamification && (
                        <GamificationSettings
                            properties={{ gamification: gamificationSettings }}
                            onChange={(props) =>
                                setGamificationSettings(props.gamification)
                            }
                        />
                    )}

                    {/* Bottom Save Button */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 2,
                            mt: 4,
                        }}
                    >
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            size="large"
                            disabled={!isFormValid()}
                        >
                            {isNew ? "Create" : "Save"}
                        </Button>
                    </Box>
                </Stack>
            )}

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
