import {
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    List,
    Box,
    Typography,
    LinearProgress,
    Tooltip,
} from "@mui/material";
import {
    PlayCircle as VideoIcon,
    Description as TextIcon,
    Quiz as QuizIcon,
    Assignment as AssignmentIcon,
    PictureAsPdf as DocumentIcon,
    Audiotrack as AudioIcon,
    Code as CodeIcon,
    LiveTv as StreamIcon,
    LocationOn as LocationIcon,
    VideoCameraFront as MeetingIcon,
    KeyboardArrowUp,
    KeyboardArrowDown,
    CheckCircle as CheckIcon,
    FlagOutlined as FlagIcon,
    Lock as LockIcon,
    RadioButtonUnchecked,
} from "@mui/icons-material";
import { Link } from "@inertiajs/react";
import {
    ACTIVITY_TYPES,
    getActivitySummary,
    normalizeActivityType,
} from "@/lib/activityTypes";
import { getLockText } from "./lockStatus";

// Lesson rows: 3px left accent, then a fixed icon column, then the title.
const ACCENT_WIDTH = 3;
const LOCKED_OPACITY = 0.7;
const ICON_COLUMN_WIDTH = 36;
const titleInset = (theme) =>
    `calc(${theme.spacing(2)} + ${ACCENT_WIDTH + ICON_COLUMN_WIDTH}px)`;
const iconInset = (theme) => `calc(${theme.spacing(2)} + ${ACCENT_WIDTH}px)`;

// The LMS palette inverts the grey ramp in dark mode (grey.50 is the darkest
// step there), so pick the step that renders as a dark slate in both modes.
const pickGrey = (lightStep, darkStep) => (theme) =>
    theme.palette.grey[theme.palette.mode === "dark" ? darkStep : lightStep];
const sectionHeaderBg = pickGrey(800, 50);
const sectionHeaderHoverBg = pickGrey(700, 100);
const sectionHeaderMutedText = pickGrey(300, 600);

const activeRowBg = (theme) =>
    theme.palette.primary.lighter || theme.palette.action.selected;

const NodeItem = ({
    node,
    depth = 0,
    isActive,
    onToggle,
    isExpanded,
    activeNodeId,
    enrollmentId,
    previewMode = false, // Visitors: no progress, no unit summaries
}) => {
    const isSection =
        node.nodeType === "section" ||
        (node.children && node.children.length > 0);
    const hasChildren = node.children && node.children.length > 0;
    const isQuiz =
        node.nodeType === "quiz" || node.properties?.lesson_type === "quiz";

    // Count completed children for section label
    const getChildCount = () => {
        if (!hasChildren) return null;
        const completed = node.children.filter((c) => c.isCompleted).length;
        return `${completed}/${node.children.length}`;
    };

    const getLeafCompletion = (currentNode) => {
        const children = currentNode.children || [];
        if (children.length === 0) {
            return { completed: currentNode.isCompleted ? 1 : 0, total: 1 };
        }
        return children.reduce(
            (summary, child) => {
                const childSummary = getLeafCompletion(child);
                return {
                    completed: summary.completed + childSummary.completed,
                    total: summary.total + childSummary.total,
                };
            },
            { completed: 0, total: 0 },
        );
    };

    // Determine lesson type icon - colored icons like reference
    const getIcon = () => {
        if (node.isLocked)
            return <LockIcon sx={{ color: "text.disabled", fontSize: 20 }} />;

        const activityType = normalizeActivityType(node);
        switch (activityType) {
            case ACTIVITY_TYPES.VIDEO:
                return (
                    <VideoIcon sx={{ color: "warning.main", fontSize: 20 }} />
                );
            case ACTIVITY_TYPES.QUIZ:
                return (
                    <QuizIcon sx={{ color: "secondary.main", fontSize: 20 }} />
                );
            case ACTIVITY_TYPES.ASSIGNMENT:
                return (
                    <AssignmentIcon sx={{ color: "info.main", fontSize: 20 }} />
                );
            case ACTIVITY_TYPES.DOCUMENT:
                return (
                    <DocumentIcon sx={{ color: "error.main", fontSize: 20 }} />
                );
            case ACTIVITY_TYPES.AUDIO:
                return <AudioIcon sx={{ color: "info.main", fontSize: 20 }} />;
            case ACTIVITY_TYPES.CODE:
                return (
                    <CodeIcon sx={{ color: "success.main", fontSize: 20 }} />
                );
            case ACTIVITY_TYPES.LIVE_MEETING:
            case ACTIVITY_TYPES.GOOGLE_MEET:
                return (
                    <MeetingIcon sx={{ color: "primary.main", fontSize: 20 }} />
                );
            case ACTIVITY_TYPES.LIVE_STREAM:
                return (
                    <StreamIcon sx={{ color: "error.main", fontSize: 20 }} />
                );
            case ACTIVITY_TYPES.IN_PERSON_SESSION:
                return (
                    <LocationIcon
                        sx={{ color: "warning.main", fontSize: 20 }}
                    />
                );
            default:
                return (
                    <TextIcon sx={{ color: "success.main", fontSize: 20 }} />
                );
        }
    };

    // Get last attempt info for quizzes
    const getLastAttempt = () => {
        return node.lastAttempt || node.properties?.lastAttempt;
    };

    const getBestAttempt = () => {
        return node.bestAttempt || node.properties?.bestAttempt;
    };

    // Build navigation URL
    const getHref = () => {
        if (node.url) return node.url;
        return `/student/programs/${enrollmentId}/session/${node.id}/`;
    };

    // Active state
    const isNodeActive = isActive || node.id === activeNodeId;

    // Section styling - gray background
    if (isSection) {
        const leafCompletion = getLeafCompletion(node);
        const unitComplete =
            leafCompletion.total > 0 &&
            leafCompletion.completed === leafCompletion.total;
        return (
            <>
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={() => onToggle(node.id)}
                        aria-expanded={Boolean(isExpanded)}
                        sx={{
                            bgcolor: sectionHeaderBg,
                            py: 1.25,
                            px: 2,
                            "&:hover": { bgcolor: sectionHeaderHoverBg },
                        }}
                    >
                        <ListItemText
                            primary={node.title}
                            slotProps={{
                                primary: {
                                    variant: "subtitle2",
                                    sx: { fontWeight: 600, color: "common.white" },
                                },
                            }}
                        />

                        {/* Count + Chevron */}
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                color: sectionHeaderMutedText,
                            }}
                        >
                            {!previewMode && (
                                <Typography variant="caption" color="inherit">
                                    {getChildCount()}
                                </Typography>
                            )}
                            {isExpanded ? (
                                <KeyboardArrowUp fontSize="small" />
                            ) : (
                                <KeyboardArrowDown fontSize="small" />
                            )}
                        </Box>
                    </ListItemButton>
                </ListItem>

                {/* Children */}
                {hasChildren && (
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {node.children.map((child) => (
                                <NodeItem
                                    key={child.id}
                                    node={child}
                                    depth={depth + 1}
                                    activeNodeId={activeNodeId}
                                    isActive={child.id === activeNodeId}
                                    isExpanded={true}
                                    onToggle={onToggle}
                                    enrollmentId={enrollmentId}
                                    previewMode={previewMode}
                                />
                            ))}
                            {!previewMode && (
                                <ListItem disablePadding>
                                    <ListItemButton
                                        component={Link}
                                        href={`/student/programs/${enrollmentId}/unit/${node.id}/`}
                                        sx={{
                                            py: 0.75,
                                            pr: 2,
                                            pl: iconInset,
                                            gap: 1,
                                            "&:hover": { bgcolor: "action.hover" },
                                        }}
                                    >
                                        <ListItemIcon
                                            sx={{ minWidth: ICON_COLUMN_WIDTH - 8 }}
                                        >
                                            {unitComplete ? (
                                                <CheckIcon
                                                    sx={{
                                                        fontSize: 16,
                                                        color: "success.main",
                                                    }}
                                                />
                                            ) : (
                                                <FlagIcon
                                                    sx={{
                                                        fontSize: 16,
                                                        color: "text.secondary",
                                                    }}
                                                />
                                            )}
                                        </ListItemIcon>
                                        <Typography
                                            variant="caption"
                                            color="textSecondary"
                                            sx={{ flexGrow: 1, fontWeight: 600 }}
                                        >
                                            End of unit
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="textSecondary"
                                        >
                                            {`${leafCompletion.completed}/${leafCompletion.total} completed`}
                                        </Typography>
                                    </ListItemButton>
                                </ListItem>
                            )}
                        </List>
                    </Collapse>
                )}
            </>
        );
    }

    const lastAttempt = getLastAttempt();
    const bestAttempt = getBestAttempt();
    const lockText = node.isLocked ? getLockText(node) : null;

    const lessonRow = (
        <ListItemButton
            component={node.isLocked ? "div" : Link}
            href={node.isLocked ? undefined : getHref()}
            aria-disabled={node.isLocked ? "true" : undefined}
            disableRipple={node.isLocked}
            sx={{
                py: 1.25,
                px: 2,
                borderLeft: `${ACCENT_WIDTH}px solid`,
                borderLeftColor: isNodeActive ? "primary.main" : "transparent",
                bgcolor: isNodeActive ? activeRowBg : "transparent",
                "&:hover": {
                    bgcolor: isNodeActive ? activeRowBg : "action.hover",
                },
                cursor: node.isLocked ? "default" : "pointer",
            }}
        >
            {/* Left: Icon (dimmed when locked; the reason stays readable) */}
            <ListItemIcon
                sx={{
                    minWidth: ICON_COLUMN_WIDTH,
                    opacity: node.isLocked ? LOCKED_OPACITY : 1,
                }}
            >
                {getIcon()}
            </ListItemIcon>

            {/* Center: Title + type line (or lock reason) */}
            <ListItemText
                primary={node.title}
                secondary={lockText || getActivitySummary(node)}
                slotProps={{
                    primary: {
                        variant: "body2",
                        color: isNodeActive ? "primary" : "textPrimary",
                        sx: {
                            fontWeight: isNodeActive ? 600 : 400,
                            opacity: node.isLocked ? LOCKED_OPACITY : 1,
                        },
                    },
                    secondary: {
                        variant: "caption",
                        color: "textSecondary",
                    },
                }}
            />

            {/* Right: completion status (locked rows show the lock instead;
                visitors in a free preview have no progress to show) */}
            {!node.isLocked &&
                !previewMode &&
                (node.isCompleted ? (
                    <CheckIcon
                        data-testid="lesson-status-complete"
                        sx={{ color: "primary.main", fontSize: 20, ml: 1 }}
                    />
                ) : (
                    <RadioButtonUnchecked
                        data-testid="lesson-status-incomplete"
                        sx={{ color: "text.disabled", fontSize: 20, ml: 1 }}
                    />
                ))}
        </ListItemButton>
    );

    // Lesson item styling
    return (
        <ListItem
            disablePadding
            sx={{ flexDirection: "column", alignItems: "stretch" }}
        >
            {node.isLocked ? (
                <Tooltip title={lockText} placement="right" describeChild>
                    {lessonRow}
                </Tooltip>
            ) : (
                lessonRow
            )}

            {/* Quiz Attempt History - show under quiz nodes */}
            {isQuiz && lastAttempt && (
                <Box sx={{ pl: titleInset, pr: 2, pb: 1.5 }}>
                    <LinearProgress
                        variant="determinate"
                        value={lastAttempt.score || 0}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: "grey.200",
                            "& .MuiLinearProgress-bar": {
                                bgcolor: lastAttempt.passed
                                    ? "success.main"
                                    : "warning.main",
                            },
                        }}
                    />
                    <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ mt: 0.5, display: "block" }}
                    >
                        Last attempt #
                        {lastAttempt.number || lastAttempt.attemptNumber}:{" "}
                        {Math.round(lastAttempt.score || 0)}%
                        {lastAttempt.passed !== undefined && (
                            <Box
                                component="span"
                                sx={{
                                    ml: 1,
                                    color:
                                        lastAttempt.passed === true
                                            ? "success.main"
                                            : lastAttempt.passed === false
                                              ? "warning.main"
                                              : "text.secondary",
                                }}
                            >
                                {lastAttempt.passed === true
                                    ? "Passed"
                                    : lastAttempt.passed === false
                                      ? "Failed"
                                      : "Pending review"}
                            </Box>
                        )}
                    </Typography>
                    {bestAttempt && (
                        <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={{ mt: 0.25, display: "block", fontWeight: 600 }}
                        >
                            Best: {Math.round(bestAttempt.score || 0)}%
                        </Typography>
                    )}
                </Box>
            )}
        </ListItem>
    );
};

export default NodeItem;
