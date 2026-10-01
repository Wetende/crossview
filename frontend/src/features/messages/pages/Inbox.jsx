import { Head, Link } from "@inertiajs/react";
import {
    Box,
    Button,
    Chip,
    Divider,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";

import DashboardLayout from "@/layouts/DashboardLayout";

function formatTimestamp(dateString) {
    if (!dateString) {
        return "";
    }
    const date = new Date(dateString);
    return date.toLocaleString();
}

export default function Inbox({ conversations = [], unreadCount = 0 }) {
    return (
        <DashboardLayout breadcrumbs={[{ label: "Messages" }]}>
            <Head title="Messages" />

            <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                <Stack spacing={2}>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" } }}
                        spacing={1}
                    >
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                Messages
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {unreadCount} unread message{unreadCount === 1 ? "" : "s"}
                            </Typography>
                        </Box>
                        <Button
                            component={Link}
                            href="/messages/new/"
                            variant="contained"
                            startIcon={<MailOutlinedIcon />}
                        >
                            New Message
                        </Button>
                    </Stack>

                    <Paper variant="outlined">
                        {conversations.length === 0 ? (
                            <Box sx={{ p: 4, textAlign: "center" }}>
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    No conversations yet
                                </Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                    Start a conversation to begin messaging.
                                </Typography>
                                <Button component={Link} href="/messages/new/" variant="outlined">
                                    Compose
                                </Button>
                            </Box>
                        ) : (
                            <List disablePadding>
                                {conversations.map((conversation, index) => (
                                    <Box key={conversation.id}>
                                        {index > 0 && <Divider />}
                                        <ListItemButton
                                            component={Link}
                                            href={`/messages/${conversation.id}/`}
                                            sx={{ py: 1.5 }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Stack
                                                        direction="row"
                                                        sx={{ justifyContent: "space-between", alignItems: "center" }}
                                                        spacing={1}
                                                    >
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                            {conversation.otherUser?.name}
                                                        </Typography>
                                                        {conversation.unreadCount > 0 && (
                                                            <Chip
                                                                size="small"
                                                                color="error"
                                                                label={conversation.unreadCount}
                                                            />
                                                        )}
                                                    </Stack>
                                                }
                                                secondary={
                                                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                                        <Typography
                                                            variant="body2"
                                                            color="textSecondary"
                                                            sx={{
                                                                display: "-webkit-box",
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: "vertical",
                                                                overflow: "hidden",
                                                            }}
                                                        >
                                                            {conversation.lastMessage?.content ||
                                                                "No messages yet."}
                                                        </Typography>
                                                        <Typography variant="caption" color="textDisabled">
                                                            {formatTimestamp(
                                                                conversation.lastMessageAt ||
                                                                    conversation.lastMessage?.createdAt,
                                                            )}
                                                        </Typography>
                                                    </Stack>
                                                }
                                            />
                                        </ListItemButton>
                                    </Box>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Stack>
            </Box>
        </DashboardLayout>
    );
}
