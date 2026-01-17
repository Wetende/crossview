/**
 * NotificationPanel - Dropdown panel for viewing and managing notifications
 *
 * Uses Inertia.js shared data and partial reloads for data fetching.
 * Polling implemented via Inertia v2's usePoll hook.
 */

import { useState, useEffect } from "react";
import { usePage, router, usePoll } from "@inertiajs/react";
import {
    Box,
    Typography,
    IconButton,
    Badge,
    Popover,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Button,
    CircularProgress,
    Tooltip,
} from "@mui/material";

// Icons
import NotificationsIcon from "@mui/icons-material/Notifications";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import GradeIcon from "@mui/icons-material/Grade";
import AnnouncementIcon from "@mui/icons-material/Announcement";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import InfoIcon from "@mui/icons-material/Info";
import DoneAllIcon from "@mui/icons-material/DoneAll";

// Map notification types to icons
const notificationIcons = {
    enrollment_approved: <CheckCircleIcon color="success" />,
    enrollment_rejected: <CancelIcon color="error" />,
    grade_published: <GradeIcon color="primary" />,
    assignment_graded: <GradeIcon color="primary" />,
    quiz_graded: <GradeIcon color="primary" />,
    announcement: <AnnouncementIcon color="info" />,
    instructor_approved: <PersonIcon color="success" />,
    instructor_rejected: <PersonIcon color="error" />,
    program_approved: <SchoolIcon color="success" />,
    program_changes_requested: <SchoolIcon color="warning" />,
    system: <InfoIcon color="action" />,
};

// Format relative time
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export default function NotificationPanel() {
    const [anchorEl, setAnchorEl] = useState(null);
    const [loading, setLoading] = useState(false);

    const open = Boolean(anchorEl);

    // Get notifications from shared props (populated by middleware)
    const { notifications: notificationData } = usePage().props;
    const unreadCount = notificationData?.unread_count || 0;
    const items = notificationData?.items || [];

    // Poll for updates every 60 seconds using Inertia v2's usePoll hook
    // Only polls for the 'notifications' prop to minimize data transfer
    const { stop: stopPolling, start: startPolling } = usePoll(
        60000,
        { only: ["notifications"] },
        { autoStart: true },
    );

    // Stop polling when panel is open to avoid conflicts
    useEffect(() => {
        if (open) {
            stopPolling();
        } else {
            startPolling();
        }
    }, [open, stopPolling, startPolling]);

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
        setLoading(true);

        // Fetch fresh notification data via partial reload
        router.reload({
            only: ["notifications"],
            onFinish: () => setLoading(false),
        });
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = (notification) => {
        // Mark as read if unread
        if (!notification.is_read) {
            router.post(
                `/notifications/${notification.id}/read/`,
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                },
            );
        }

        // Navigate if action URL provided
        if (notification.action_url) {
            handleClose();
            router.visit(notification.action_url);
        }
    };

    const handleMarkAllRead = () => {
        router.post(
            "/notifications/mark-all-read/",
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    return (
        <>
            <Tooltip title="Notifications">
                <IconButton
                    onClick={handleOpen}
                    sx={{ color: "text.secondary" }}
                    aria-label="notifications"
                >
                    <Badge badgeContent={unreadCount} color="error" max={99}>
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                    paper: {
                        sx: {
                            width: 360,
                            maxHeight: 480,
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                        },
                    },
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 2,
                        py: 1.5,
                        borderBottom: 1,
                        borderColor: "divider",
                    }}
                >
                    <Typography variant="subtitle1" fontWeight={600}>
                        Notifications
                    </Typography>
                    {unreadCount > 0 && (
                        <Button
                            size="small"
                            startIcon={<DoneAllIcon />}
                            onClick={handleMarkAllRead}
                            sx={{ textTransform: "none" }}
                        >
                            Mark all read
                        </Button>
                    )}
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, overflow: "auto" }}>
                    {loading ? (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                py: 4,
                            }}
                        >
                            <CircularProgress size={24} />
                        </Box>
                    ) : items.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: "center" }}>
                            <NotificationsIcon
                                sx={{
                                    fontSize: 48,
                                    color: "text.disabled",
                                    mb: 1,
                                }}
                            />
                            <Typography color="text.secondary" variant="body2">
                                No notifications yet
                            </Typography>
                        </Box>
                    ) : (
                        <List disablePadding>
                            {items.map((notification, index) => (
                                <Box key={notification.id}>
                                    {index > 0 && <Divider />}
                                    <ListItem
                                        component="button"
                                        onClick={() =>
                                            handleNotificationClick(
                                                notification,
                                            )
                                        }
                                        sx={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 1.5,
                                            px: 2,
                                            py: 1.5,
                                            bgcolor: notification.is_read
                                                ? "transparent"
                                                : "action.hover",
                                            cursor: "pointer",
                                            border: "none",
                                            width: "100%",
                                            textAlign: "left",
                                            "&:hover": {
                                                bgcolor: "action.selected",
                                            },
                                        }}
                                    >
                                        <ListItemIcon
                                            sx={{ minWidth: 0, mt: 0.5 }}
                                        >
                                            {notificationIcons[
                                                notification.type
                                            ] || <InfoIcon />}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={
                                                        notification.is_read
                                                            ? 400
                                                            : 600
                                                    }
                                                    sx={{
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 1,
                                                        WebkitBoxOrient:
                                                            "vertical",
                                                    }}
                                                >
                                                    {notification.title}
                                                </Typography>
                                            }
                                            secondary={
                                                <>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        component="span"
                                                        sx={{
                                                            overflow: "hidden",
                                                            textOverflow:
                                                                "ellipsis",
                                                            display:
                                                                "-webkit-box",
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient:
                                                                "vertical",
                                                        }}
                                                    >
                                                        {notification.message}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.disabled"
                                                        component="span"
                                                        sx={{
                                                            display: "block",
                                                            mt: 0.5,
                                                        }}
                                                    >
                                                        {formatRelativeTime(
                                                            notification.created_at,
                                                        )}
                                                    </Typography>
                                                </>
                                            }
                                        />
                                    </ListItem>
                                </Box>
                            ))}
                        </List>
                    )}
                </Box>

                {/* Footer - View All link */}
                {items.length > 0 && (
                    <Box
                        sx={{
                            borderTop: 1,
                            borderColor: "divider",
                            px: 2,
                            py: 1,
                        }}
                    >
                        <Button
                            fullWidth
                            size="small"
                            onClick={() => {
                                handleClose();
                                router.visit("/notifications/");
                            }}
                            sx={{ textTransform: "none" }}
                        >
                            View all notifications
                        </Button>
                    </Box>
                )}
            </Popover>
        </>
    );
}
