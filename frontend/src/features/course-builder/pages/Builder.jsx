import { useCallback, useEffect, useRef, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Drawer,
    List,
    ListItem,
    Divider,
    IconButton,
    Stack,
    Button,
} from "@mui/material";
import { TouchApp as TouchAppIcon } from "@mui/icons-material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CloseIcon from "@mui/icons-material/Close";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { useThemeMode } from "@/theme/index";
import DOMPurify from "dompurify";
import CourseBuilderLayout from "@/layouts/CourseBuilderLayout";
import CurriculumTree, { flattenNodes } from "../components/CurriculumTree";
import EditorContainer from "../editors/EditorContainer";
import SettingsPanel from "../components/SettingsPanel";
import CoursePublicationControls from "../components/CoursePublicationControls";
import {
    getBuilderTabUrl,
    getRequestedSettingsSection,
    getSettingsSectionUrl,
    getRequestedBuilderTab,
    normalizeBuilderTab,
    normalizeSettingsSection,
} from "../utils/builderTabs";

const RIGHT_DRAWER_WIDTH = 300;
const EMPTY_LIBRARY_VERSIONS = {};
const getInitialTab = (program) =>
    normalizeBuilderTab(program, getRequestedBuilderTab());

const syncBuilderTabUrl = (
    programId,
    tab,
    { replace = false, settingsSection = "main" } = {},
) => {
    if (typeof window === "undefined") {
        return;
    }

    const nextUrl =
        tab === "settings"
            ? getSettingsSectionUrl(programId, settingsSection)
            : getBuilderTabUrl(programId, tab);
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (currentUrl === nextUrl) {
        return;
    }

    const method = replace ? "replaceState" : "pushState";
    window.history[method]({}, "", nextUrl);
};

export default function InstructorProgramBuilder({
    program,
    curriculum: initialCurriculum,
    platformFeatures = {},
    deploymentMode = "custom",
}) {
    const { mode, toggleMode } = useThemeMode();
    const [activeTab, setActiveTab] = useState(() => getInitialTab(program));
    const [settingsSection, setSettingsSection] = useState(() =>
        getRequestedSettingsSection(),
    );
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [guideOpen, setGuideOpen] = useState(false);
    const [curriculum, setCurriculum] = useState(initialCurriculum);
    const activeEditorRef = useRef(null);
    const settingsPanelRef = useRef(null);

    // Get reactive page props for curriculum updates
    const page = usePage();

    const questionLibraryVersions =
        page.props.questionLibraryVersions || EMPTY_LIBRARY_VERSIONS;
    const questionCategories = page.props.questionCategories || [];
    const questionBanks = page.props.questionBanks || [];

    // Update curriculum when page props change (e.g., after creating a new node)
    useEffect(() => {
        if (page.props.curriculum) {
            setCurriculum(page.props.curriculum);
        }
    }, [page.props.curriculum]);

    useEffect(() => {
        const applyCurrentLocationTab = () => {
            const nextTab = getInitialTab(program);
            const nextSettingsSection = getRequestedSettingsSection();
            setActiveTab(nextTab);
            setSettingsSection(nextSettingsSection);

            const requestedSection = new URLSearchParams(
                window.location.search,
            ).get("section");
            const shouldNormalizeSettingsSection =
                nextTab === "settings" &&
                requestedSection !== nextSettingsSection;

            if (
                getRequestedBuilderTab() !== nextTab ||
                shouldNormalizeSettingsSection
            ) {
                syncBuilderTabUrl(program.id, nextTab, {
                    replace: true,
                    settingsSection: nextSettingsSection,
                });
            }
        };

        applyCurrentLocationTab();
        window.addEventListener("popstate", applyCurrentLocationTab);

        return () => {
            window.removeEventListener("popstate", applyCurrentLocationTab);
        };
    }, [page.url, program]);

    // Helper to find node by ID in the tree
    const findNode = (id) => {
        const flat = flattenNodes(curriculum);
        return flat.find((node) => String(node.id) === String(id));
    };

    const selectedNode = selectedNodeId ? findNode(selectedNodeId) : null;
    const appliedNodeRequestUrlRef = useRef(null);

    useEffect(() => {
        if (activeTab !== "curriculum" || typeof window === "undefined") {
            return;
        }

        const requestedNodeId = new URLSearchParams(window.location.search).get(
            "node",
        );
        if (!requestedNodeId) {
            appliedNodeRequestUrlRef.current = null;
            return;
        }

        // Server redirects (node create, rejected save) open a lesson with
        // ?node=. Apply it once per visit so later curriculum refreshes on the
        // same URL do not pull the instructor away from the lesson they chose.
        if (appliedNodeRequestUrlRef.current === page.url) {
            return;
        }

        const requestedNode = flattenNodes(curriculum).find(
            (node) => String(node.id) === requestedNodeId,
        );
        if (requestedNode) {
            appliedNodeRequestUrlRef.current = page.url;
            // Never swap away from a lesson whose edits autosave could not
            // save; the tree's own select (which asks first) handles that.
            if (
                String(requestedNode.id) !== String(selectedNodeId) &&
                activeEditorRef.current?.hasPausedUnsavedChanges?.()
            ) {
                return;
            }
            setSelectedNodeId(requestedNode.id);
        }
    }, [activeTab, curriculum, page.url, selectedNodeId]);

    const handleNodeSave = (nodeId, data, callbacks = {}) => {
        router.post(`/instructor/nodes/${nodeId}/update/`, data, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: callbacks.onSuccess,
            onError: callbacks.onError,
            onFinish: callbacks.onFinish,
        });
    };

    const flushActiveAutosave = useCallback(async () => {
        const [editorResult] = await Promise.all([
            activeEditorRef.current?.flushAutosave?.(),
            settingsPanelRef.current?.flushAutosave?.(),
        ]);
        return editorResult;
    }, []);

    // Flush before leaving the open lesson. If autosave is paused (the lesson
    // does not meet the server's save rules yet) its edits would be lost, so
    // ask first. Returns false when the instructor chooses to stay.
    const flushBeforeLeavingEditor = useCallback(async () => {
        const result = await flushActiveAutosave();
        if (!result?.paused) {
            return true;
        }
        const lessonLabel = result.lessonTitle
            ? ` in "${result.lessonTitle}"`
            : "";
        return window.confirm(
            `Unsaved changes${lessonLabel}: ${result.pauseReason}.\n\n` +
                "Leave this lesson and discard them?",
        );
    }, [flushActiveAutosave]);

    const handleTabChange = async (nextTab) => {
        if (!(await flushBeforeLeavingEditor())) {
            return;
        }
        const normalizedTab = normalizeBuilderTab(program, nextTab);
        const nextSettingsSection =
            normalizedTab === "settings"
                ? normalizeSettingsSection(settingsSection)
                : "main";
        setActiveTab(normalizedTab);
        if (normalizedTab === "settings") {
            setSettingsSection(nextSettingsSection);
        }
        syncBuilderTabUrl(program.id, normalizedTab, {
            settingsSection: nextSettingsSection,
        });
    };

    const handleSettingsSectionChange = (nextSection) => {
        const normalizedSection = normalizeSettingsSection(nextSection);
        setSettingsSection(normalizedSection);
        syncBuilderTabUrl(program.id, "settings", {
            settingsSection: normalizedSection,
        });
    };

    return (
        <CourseBuilderLayout
            program={program}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            platformFeatures={platformFeatures}
            deploymentMode={deploymentMode}
            // Pass the guide button to the layout's AppBar slot
            appBarActions={
                <Stack direction="row" spacing={1}>
                    <IconButton
                        onClick={toggleMode}
                        color="inherit"
                        sx={{ mr: 1 }}
                    >
                        {mode === "dark" ? (
                            <Brightness7Icon />
                        ) : (
                            <Brightness4Icon />
                        )}
                    </IconButton>
                    <Button
                        variant={guideOpen ? "contained" : "outlined"}
                        color="secondary"
                        startIcon={<MenuBookIcon />}
                        onClick={() => setGuideOpen(!guideOpen)}
                        sx={{ mr: 1 }}
                    >
                        Guide
                    </Button>
                    <CoursePublicationControls program={program} />
                </Stack>
            }
        >
            <Head title={`Manage ${program.name}`} />

            <Box
                sx={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    display: "flex",
                    minHeight: 0,
                }}
            >
                {/* Use full height and no padding for curriculum to match the sidebar design */}
                <Box
                    sx={{
                        height: "100%",
                        overflowY:
                            activeTab === "curriculum" ||
                            activeTab === "settings"
                                ? "hidden"
                                : "auto",
                        p:
                            activeTab === "curriculum" ||
                            activeTab === "settings"
                                ? 0
                                : 3,
                        flexGrow: 1, // Allow this box to grow
                        minWidth: 0,
                        minHeight: 0,
                    }}
                >
                    {activeTab === "curriculum" && (
                        <Box sx={{ display: "flex", height: "100%" }}>
                            {/* Pass onNodeSelect to update local state */}
                            <CurriculumTree
                                program={program}
                                nodes={curriculum}
                                onNodeSelect={async (node) => {
                                    if (
                                        node &&
                                        String(node.id) !==
                                            String(selectedNodeId) &&
                                        !(await flushBeforeLeavingEditor())
                                    ) {
                                        return false;
                                    }
                                    setSelectedNodeId(node ? node.id : null);
                                    return true;
                                }}
                                onCurriculumUpdate={(newCurriculum) => {
                                    setCurriculum(newCurriculum);
                                }}
                                blueprint={program.blueprint}
                            />

                            <Box sx={{ flex: 1, p: 3, overflowY: "auto" }}>
                                {selectedNode ? (
                                    <EditorContainer
                                        ref={activeEditorRef}
                                        key={selectedNode.id} // Force remount on node change
                                        node={selectedNode}
                                        onSave={handleNodeSave}
                                        blueprint={program.blueprint}
                                        programId={program.id}
                                        questionBanks={questionBanks}
                                        questionLibraryVersions={questionLibraryVersions}
                                        categories={questionCategories}
                                    />
                                ) : (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            height: "100%",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "text.secondary",
                                            flexDirection: "column",
                                        }}
                                    >
                                        <Box
                                            component={TouchAppIcon}
                                            sx={{
                                                fontSize: 80,
                                                mb: 2,
                                                opacity: 0.2,
                                            }}
                                        />
                                        <Typography variant="h6">
                                            Select a lesson to edit
                                        </Typography>
                                        <Typography variant="body2">
                                            Or create a new one from the menu on
                                            the left.
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}
                    {activeTab === "settings" && (
                        <Box
                            sx={{
                                display: "flex",
                                height: "100%",
                                width: "100%",
                                flex: 1,
                                minWidth: 0,
                                minHeight: 0,
                            }}
                        >
                            <SettingsPanel
                                ref={settingsPanelRef}
                                program={program}
                                activeTab={activeTab}
                                settingsSection={settingsSection}
                                onSettingsSectionChange={
                                    handleSettingsSectionChange
                                }
                                curriculum={curriculum}
                                platformFeatures={platformFeatures}
                                deploymentMode={deploymentMode}
                            />
                        </Box>
                    )}
                    {(activeTab === "pricing" ||
                        activeTab === "faq" ||
                        activeTab === "notice" ||
                        activeTab === "engagement" ||
                        activeTab === "drip" ||
                        activeTab === "practicum") && (
                        <Box
                            sx={{
                                maxWidth: 720,
                                mx: "auto",
                                pt: 2,
                                pb: 4,
                            }}
                        >
                            <Card>
                                <CardContent>
                                    <SettingsPanel
                                        ref={settingsPanelRef}
                                        program={program}
                                        activeTab={activeTab}
                                        settingsSection={settingsSection}
                                        onSettingsSectionChange={
                                            handleSettingsSectionChange
                                        }
                                        curriculum={curriculum}
                                        platformFeatures={platformFeatures}
                                        deploymentMode={deploymentMode}
                                    />
                                </CardContent>
                            </Card>
                        </Box>
                    )}
                </Box>
                {/* Right Drawer: Course Guide */}
                <Drawer
                    anchor="right"
                    variant="persistent"
                    open={guideOpen}
                    sx={{
                        width: guideOpen ? RIGHT_DRAWER_WIDTH : 0,
                        flexShrink: 0,
                        transition: "width 0.2s ease-out",
                        "& .MuiDrawer-paper": {
                            width: RIGHT_DRAWER_WIDTH,
                            boxSizing: "border-box",
                            top: { xs: 112, lg: 64 },
                            height: {
                                xs: "calc(100% - 112px)",
                                lg: "calc(100% - 64px)",
                            },
                            borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
                        },
                    }}
                >
                    <Box sx={{ p: 2 }}>
                        <Stack
                            direction="row"
                            sx={{
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 2,
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{ fontWeight: "bold" }}
                            >
                                Course Guide
                            </Typography>
                            <IconButton
                                size="small"
                                onClick={() => setGuideOpen(false)}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Stack>

                        {/* Learning Outcomes */}
                        <Box sx={{ mb: 4 }}>
                            <Typography
                                variant="subtitle2"
                                color="primary"
                                gutterBottom
                                sx={{ fontWeight: "bold" }}
                            >
                                LEARNING OUTCOMES
                            </Typography>
                            {program.whatYouLearnHtml ? (
                                <Box
                                    sx={{
                                        "& ul, & ol": { pl: 3, mb: 1.5 },
                                        "& li": { mb: 0.5 },
                                        "& h1, & h2, & h3": { mb: 1, mt: 1.5 },
                                        "& p": { mb: 0.75 },
                                    }}
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(
                                            program.whatYouLearnHtml,
                                        ),
                                    }}
                                />
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="textSecondary"
                                    sx={{ fontStyle: "italic" }}
                                >
                                    No learning outcomes defined.
                                </Typography>
                            )}
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        {/* Resources */}
                        <Box>
                            <Typography
                                variant="subtitle2"
                                color="primary"
                                gutterBottom
                                sx={{ fontWeight: "bold" }}
                            >
                                INSTRUCTOR RESOURCES
                            </Typography>
                            {program.resources &&
                            program.resources.length > 0 ? (
                                <List dense>
                                    {program.resources.map((res) => (
                                        <ListItem
                                            key={res.id}
                                            disablePadding
                                            sx={{
                                                mb: 1,
                                                bgcolor: "action.hover",
                                                borderRadius: 1,
                                            }}
                                        >
                                            <Button
                                                component="a"
                                                href={res.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                fullWidth
                                                color="inherit"
                                                sx={{
                                                    justifyContent:
                                                        "flex-start",
                                                    textTransform: "none",
                                                    py: 1,
                                                    textAlign: "left",
                                                }}
                                                startIcon={
                                                    res.ext === "pdf" ? (
                                                        <PictureAsPdfIcon color="error" />
                                                    ) : (
                                                        <DescriptionIcon color="info" />
                                                    )
                                                }
                                            >
                                                <Box
                                                    sx={{
                                                        minWidth: 0,
                                                        flexGrow: 1,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        noWrap
                                                    >
                                                        {res.title}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="textSecondary"
                                                    >
                                                        Click to Open
                                                    </Typography>
                                                </Box>
                                            </Button>
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="textSecondary"
                                    sx={{ fontStyle: "italic" }}
                                >
                                    No resources attached.
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Drawer>
            </Box>
        </CourseBuilderLayout>
    );
}
