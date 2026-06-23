/**
 * NotificationPanel - Dropdown panel for viewing and managing notifications.
 *
 * Fetches unread counts and items on demand via the notifications API instead
 * of relying on globally shared Inertia props on every page response.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { router } from "@inertiajs/react";
import {
    Badge,
    Box,
    Button,
    CircularProgress,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Popover,
    Tooltip,
    Typography,
} from "@mui/material";
import AnnouncementIcon from "@mui/icons-material/Announcement";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import GradeIcon from "@mui/icons-material/Grade";
import InfoIcon from "@mui/icons-material/Info";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";

const POLL_INTERVAL_MS = 60_000;
const COUNT_CACHE_KEY = "lms.notification.unread_count";
const COUNT_CACHE_TTL_MS = 60_000;

const notificationIcons = {
    enrollment_confirmed: <CheckCircleIcon color="success" />,
    enrollment_approved: <CheckCircleIcon color="success" />,
    enrollment_rejected: <CancelIcon color="error" />,
    grade_published: <GradeIcon color="primary" />,
    assignment_graded: <GradeIcon color="primary" />,
    quiz_graded: <GradeIcon color="primary" />,
    announcement: <AnnouncementIcon color="info" />,
    direct_message: <MailOutlinedIcon color="info" />,
    instructor_approved: <PersonIcon color="success" />,
    instructor_rejected: <PersonIcon color="error" />,
    system: <InfoIcon color="action" />,
};

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

function loadCachedUnreadCount() {
    try {
        const raw = window.sessionStorage.getItem(COUNT_CACHE_KEY);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        if (
            typeof parsed?.count !== "number" ||
            typeof parsed?.fetchedAt !== "number"
        ) {
            return null;
        }
        if (Date.now() - parsed.fetchedAt > COUNT_CACHE_TTL_MS) {
            return null;
        }
        return parsed.count;
    } catch {
        return null;
    }
}

function persistUnreadCount(count) {
    try {
        window.sessionStorage.setItem(
            COUNT_CACHE_KEY,
            JSON.stringify({ count, fetchedAt: Date.now() }),
        );
    } catch {
        // Ignore storage failures.
    }
}

export default function NotificationPanel() {
    const [anchorEl, setAnchorEl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [unreadCount, setUnreadCount] = useState(() => {
        if (typeof window === "undefined") {
            return 0;
        }
        return loadCachedUnreadCount() ?? 0;
    });

    const open = Boolean(anchorEl);
    const hasItems = items.length > 0;

    const syncUnreadCount = useCallback(async () => {
        const response = await axios.get("/api/notifications/unread-count/");
        const nextCount = Number(response.data?.count || 0);
        setUnreadCount(nextCount);
        persistUnreadCount(nextCount);
        return nextCount;
    }, []);

    const loadNotifications = useCallback(async () => {
        const [countResponse, listResponse] = await Promise.all([
            axios.get("/api/notifications/unread-count/"),
            axios.get("/api/notifications/", {
                params: { page: 1, per_page: 10 },
            }),
        ]);

        const nextCount = Number(countResponse.data?.count || 0);
        const nextItems = listResponse.data?.notifications || [];
        setUnreadCount(nextCount);
        setItems(nextItems);
        persistUnreadCount(nextCount);
    }, []);

    useEffect(() => {
        let cancelled = false;

        const maybeFetchCount = async () => {
            const cachedCount =
                typeof window !== "undefined" ? loadCachedUnreadCount() : null;
            if (cachedCount !== null) {
                setUnreadCount(cachedCount);
                return;
            }

            try {
                const nextCount = await syncUnreadCount();
                if (cancelled) {
                    return;
                }
                setUnreadCount(nextCount);
            } catch {
                if (!cancelled) {
                    setUnreadCount((current) => current);
                }
            }
        };

        maybeFetchCount();

        return () => {
            cancelled = true;
        };
    }, [syncUnreadCount]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                syncUnreadCount().catch(() => {
                    // Ignore transient polling failures.
                });
            }
        }, POLL_INTERVAL_MS);

        return () => window.clearInterval(intervalId);
    }, [syncUnreadCount]);

    const handleOpen = async (event) => {
        setAnchorEl(event.currentTarget);
        setLoading(true);
        try {
            await loadNotifications();
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.is_read) {
            setItems((current) =>
                current.map((item) =>
                    item.id === notification.id
                        ? { ...item, is_read: true }
                        : item,
                ),
            );
            setUnreadCount((current) => {
                const nextCount = Math.max(0, current - 1);
                persistUnreadCount(nextCount);
                return nextCount;
            });

            try {
                await axios.post(`/api/notifications/${notification.id}/read/`);
            } catch {
                await loadNotifications().catch(() => {
                    // Ignore retry failure; a future poll will reconcile state.
                });
            }
        }

        if (notification.action_url) {
            handleClose();
            router.visit(notification.action_url);
        }
    };

    const handleMarkAllRead = async () => {
        setItems((current) =>
            current.map((item) => ({ ...item, is_read: true })),
        );
        setUnreadCount(0);
        persistUnreadCount(0);

        try {
            await axios.post("/api/notifications/mark-all-read/");
        } catch {
            await loadNotifications().catch(() => {
                // Ignore retry failure; a future poll will reconcile state.
            });
        }
    };

    const renderedItems = useMemo(() => items, [items]);

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
                    ) : !hasItems ? (
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
                            {renderedItems.map((notification, index) => (
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

                {hasItems && (
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
