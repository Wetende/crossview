import { Head, router, usePage } from "@inertiajs/react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Stack,
    Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import GradeIcon from "@mui/icons-material/Grade";
import AnnouncementIcon from "@mui/icons-material/Announcement";
import PersonIcon from "@mui/icons-material/Person";
import InfoIcon from "@mui/icons-material/Info";

import DashboardLayout from "@/layouts/DashboardLayout";

const notificationIconMap = {
    enrollment_confirmed: <CheckCircleIcon color="success" fontSize="small" />,
    enrollment_approved: <CheckCircleIcon color="success" fontSize="small" />,
    enrollment_rejected: <CancelIcon color="error" fontSize="small" />,
    grade_published: <GradeIcon color="primary" fontSize="small" />,
    assignment_graded: <GradeIcon color="primary" fontSize="small" />,
    quiz_graded: <GradeIcon color="primary" fontSize="small" />,
    announcement: <AnnouncementIcon color="info" fontSize="small" />,
    instructor_approved: <PersonIcon color="success" fontSize="small" />,
    instructor_rejected: <PersonIcon color="error" fontSize="small" />,
    system: <InfoIcon color="action" fontSize="small" />,
};

function formatDate(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString();
}

export default function NotificationsIndex({
    notifications = [],
    pagination = {},
    unread_count = 0,
}) {
    const { auth } = usePage().props;
    const role = auth?.user?.role || "student";

    const markAllRead = () => {
        router.post("/notifications/mark-all-read/");
    };

    const markRead = (notificationId) => {
        router.post(`/notifications/${notificationId}/read/`);
    };

    return (
        <DashboardLayout
            role={role}
            breadcrumbs={[{ label: "Notifications", href: "/notifications/" }]}
        >
            <Head title="Notifications" />
            <Stack spacing={3}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Box>
                        <Typography variant="h4" fontWeight={700}>
                            Notifications
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {unread_count} unread
                        </Typography>
                    </Box>
                    {unread_count > 0 && (
                        <Button variant="outlined" onClick={markAllRead}>
                            Mark all as read
                        </Button>
                    )}
                </Box>

                <Card>
                    <CardContent sx={{ p: 0 }}>
                        {notifications.length === 0 ? (
                            <Box sx={{ p: 3 }}>
                                <Typography color="text.secondary">
                                    No notifications yet.
                                </Typography>
                            </Box>
                        ) : (
                            notifications.map((notification, index) => (
                                <Box key={notification.id}>
                                    {index > 0 && <Divider />}
                                    <Box
                                        sx={{
                                            px: 2,
                                            py: 1.5,
                                            backgroundColor: notification.is_read
                                                ? "transparent"
                                                : "action.hover",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                gap: 2,
                                            }}
                                        >
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                alignItems="flex-start"
                                                sx={{ flex: 1 }}
                                            >
                                                <Box sx={{ mt: "2px" }}>
                                                    {notificationIconMap[
                                                        notification.type
                                                    ] || (
                                                        <InfoIcon
                                                            color="action"
                                                            fontSize="small"
                                                        />
                                                    )}
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography
                                                        variant="subtitle2"
                                                        fontWeight={
                                                            notification.is_read
                                                                ? 500
                                                                : 700
                                                        }
                                                    >
                                                        {notification.title}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{ mt: 0.25 }}
                                                    >
                                                        {notification.message}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.disabled"
                                                        sx={{ display: "block", mt: 0.5 }}
                                                    >
                                                        {formatDate(
                                                            notification.created_at,
                                                        )}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                alignItems="center"
                                            >
                                                <Chip
                                                    size="small"
                                                    label={
                                                        notification.is_read
                                                            ? "Read"
                                                            : "Unread"
                                                    }
                                                    color={
                                                        notification.is_read
                                                            ? "default"
                                                            : "primary"
                                                    }
                                                    variant={
                                                        notification.is_read
                                                            ? "outlined"
                                                            : "filled"
                                                    }
                                                />
                                                {!notification.is_read && (
                                                    <Button
                                                        size="small"
                                                        onClick={() =>
                                                            markRead(
                                                                notification.id,
                                                            )
                                                        }
                                                    >
                                                        Mark read
                                                    </Button>
                                                )}
                                                {notification.action_url && (
                                                    <Button
                                                        size="small"
                                                        onClick={() =>
                                                            router.visit(
                                                                notification.action_url,
                                                            )
                                                        }
                                                    >
                                                        Open
                                                    </Button>
                                                )}
                                            </Stack>
                                        </Box>
                                    </Box>
                                </Box>
                            ))
                        )}
                    </CardContent>
                </Card>

                {pagination.total_pages > 1 && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                            variant="outlined"
                            disabled={pagination.page <= 1}
                            onClick={() =>
                                router.visit(
                                    `/notifications/?page=${pagination.page - 1}`,
                                )
                            }
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outlined"
                            disabled={!pagination.has_more}
                            onClick={() =>
                                router.visit(
                                    `/notifications/?page=${pagination.page + 1}`,
                                )
                            }
                        >
                            Next
                        </Button>
                    </Box>
                )}
            </Stack>
        </DashboardLayout>
    );
}
