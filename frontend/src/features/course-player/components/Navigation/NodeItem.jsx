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
} from "@mui/icons-material";
import { Link } from "@inertiajs/react";
import {
    ACTIVITY_TYPES,
    formatActivityDuration,
    normalizeActivityType,
} from "@/lib/activityTypes";

const NodeItem = ({
    node,
    depth = 0,
    isActive,
    onToggle,
    isExpanded,
    activeNodeId,
    enrollmentId,
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

    // Get duration label
    const getDuration = () => {
        const duration = node.properties?.duration || node.duration;
        return formatActivityDuration(duration) || null;
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
                        sx={{
                            bgcolor: "grey.100",
                            py: 1.5,
                            px: 2,
                            "&:hover": { bgcolor: "grey.200" },
                        }}
                    >
                        <ListItemText
                            primary={node.title}
                            primaryTypographyProps={{
                                variant: "subtitle2",
                                fontWeight: 600,
                                color: "text.primary",
                            }}
                        />

                        {/* Count + Chevron */}
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                {getChildCount()}
                            </Typography>
                            {isExpanded ? (
                                <KeyboardArrowUp
                                    sx={{ color: "text.secondary" }}
                                />
                            ) : (
                                <KeyboardArrowDown
                                    sx={{ color: "text.secondary" }}
                                />
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
                                />
                            ))}
                            <ListItem disablePadding>
                                <ListItemButton
                                    component={Link}
                                    href={`/student/programs/${enrollmentId}/unit/${node.id}/`}
                                    sx={{
                                        mx: 1,
                                        my: 0.75,
                                        borderRadius: 1.5,
                                        bgcolor: unitComplete
                                            ? "success.lighter"
                                            : "action.hover",
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        {unitComplete ? (
                                            <CheckIcon
                                                color="success"
                                                fontSize="small"
                                            />
                                        ) : (
                                            <FlagIcon
                                                color="action"
                                                fontSize="small"
                                            />
                                        )}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="End of unit"
                                        secondary={`${leafCompletion.completed}/${leafCompletion.total} completed`}
                                        primaryTypographyProps={{
                                            variant: "body2",
                                            fontWeight: 700,
                                        }}
                                        secondaryTypographyProps={{
                                            variant: "caption",
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        </List>
                    </Collapse>
                )}
            </>
        );
    }

    const lastAttempt = getLastAttempt();
    const bestAttempt = getBestAttempt();

    // Lesson item styling
    return (
        <ListItem
            disablePadding
            sx={{ flexDirection: "column", alignItems: "stretch" }}
        >
            <ListItemButton
                component={Link}
                href={!node.isLocked ? getHref() : undefined}
                disabled={node.isLocked}
                sx={{
                    py: 1.5,
                    px: 2,
                    borderLeft: isNodeActive
                        ? "4px solid"
                        : "4px solid transparent",
                    borderColor: isNodeActive ? "primary.main" : "transparent",
                    bgcolor: isNodeActive ? "primary.50" : "background.paper",
                    "&:hover": {
                        bgcolor: isNodeActive ? "primary.50" : "grey.50",
                    },
                    opacity: node.isLocked ? 0.5 : 1,
                }}
            >
                {/* Left: Icon */}
                <ListItemIcon sx={{ minWidth: 36 }}>{getIcon()}</ListItemIcon>

                {/* Center: Title + Duration stacked */}
                <ListItemText
                    primary={node.title}
                    secondary={getDuration()}
                    primaryTypographyProps={{
                        variant: "body2",
                        fontWeight: isNodeActive ? 600 : 400,
                        color: isNodeActive ? "primary.main" : "text.primary",
                    }}
                    secondaryTypographyProps={{
                        variant: "caption",
                        color: "text.secondary",
                    }}
                />

                {/* Right: Checkmark */}
                {node.isCompleted && (
                    <CheckIcon sx={{ color: "primary.main", fontSize: 22 }} />
                )}
            </ListItemButton>

            {/* Quiz Attempt History - show under quiz nodes */}
            {isQuiz && lastAttempt && (
                <Box sx={{ pl: 7, pr: 2, pb: 1.5 }}>
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
                        color="text.secondary"
                        sx={{ mt: 0.5, display: "block" }}
                    >
                        Last attempt #
                        {lastAttempt.number || lastAttempt.attemptNumber}:{" "}
                        {Math.round(lastAttempt.score || 0)}%
                        {lastAttempt.passed !== undefined && (
                            <span
                                style={{
                                    marginLeft: 8,
                                    color:
                                        lastAttempt.passed === true
                                            ? "var(--mui-palette-success-main)"
                                            : lastAttempt.passed === false
                                              ? "var(--mui-palette-warning-main)"
                                              : "var(--mui-palette-text-secondary)",
                                }}
                            >
                                {lastAttempt.passed === true
                                    ? "Passed"
                                    : lastAttempt.passed === false
                                      ? "Failed"
                                      : "Pending review"}
                            </span>
                        )}
                    </Typography>
                    {bestAttempt && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
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
