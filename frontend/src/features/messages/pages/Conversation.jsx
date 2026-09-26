import { useEffect } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    Alert,
    Box,
    Button,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";

import DashboardLayout from "@/layouts/DashboardLayout";

function formatTimestamp(dateString) {
    if (!dateString) {
        return "";
    }
    const date = new Date(dateString);
    return date.toLocaleString();
}

export default function Conversation({
    conversation,
    messages = [],
    errorMessage = null,
    draftContent = "",
}) {
    const { data, setData, post, processing, reset } = useForm({
        content: draftContent || "",
    });

    useEffect(() => {
        // A draft (e.g. from the course player) only fills an empty reply box.
        if (draftContent && !data.content) {
            setData("content", draftContent);
        }
        // Only a new draft prop should seed the field; typing must not.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftContent]);

    const handleSubmit = (event) => {
        event.preventDefault();
        post(`/messages/${conversation.id}/send/`, {
            preserveScroll: true,
            onSuccess: () => reset("content"),
        });
    };

    return (
        <DashboardLayout
            breadcrumbs={[
                { label: "Messages", href: "/messages/" },
                { label: conversation.otherUser?.name || "Conversation" },
            ]}
        >
            <Head title={`Messages - ${conversation.otherUser?.name || "Conversation"}`} />

            <Stack spacing={2}>
                {!!errorMessage && <Alert severity="error">{errorMessage}</Alert>}

                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                        <Button
                            component={Link}
                            href="/messages/"
                            size="small"
                            startIcon={<ArrowBackIcon />}
                            sx={{ mb: 1 }}
                        >
                            Back to Inbox
                        </Button>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {conversation.otherUser?.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {conversation.otherUser?.email}
                        </Typography>
                    </Box>
                </Stack>

                <Paper variant="outlined" sx={{ p: 2, minHeight: 360, maxHeight: 520, overflowY: "auto" }}>
                    <Stack spacing={1.5}>
                        {messages.length === 0 ? (
                            <Typography color="textSecondary" sx={{ textAlign: "center", py: 4 }}>
                                No messages yet.
                            </Typography>
                        ) : (
                            messages.map((message) => (
                                <Box
                                    key={message.id}
                                    sx={{
                                        display: "flex",
                                        justifyContent: message.sender?.isMe
                                            ? "flex-end"
                                            : "flex-start",
                                    }}
                                >
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            maxWidth: "78%",
                                            px: 1.5,
                                            py: 1,
                                            borderRadius: 2,
                                            bgcolor: message.sender?.isMe
                                                ? "primary.main"
                                                : "action.hover",
                                            color: message.sender?.isMe
                                                ? "primary.contrastText"
                                                : "text.primary",
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                                            {message.content}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                display: "block",
                                                mt: 0.5,
                                                opacity: 0.8,
                                            }}
                                        >
                                            {formatTimestamp(message.createdAt)}
                                        </Typography>
                                    </Paper>
                                </Box>
                            ))
                        )}
                    </Stack>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box component="form" onSubmit={handleSubmit}>
                        <Stack spacing={1}>
                            <TextField
                                label="Reply"
                                value={data.content}
                                onChange={(event) => setData("content", event.target.value)}
                                multiline
                                minRows={3}
                                fullWidth
                                required
                            />
                            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    endIcon={<SendIcon />}
                                    disabled={processing || !data.content.trim()}
                                >
                                    Send
                                </Button>
                            </Box>
                        </Stack>
                    </Box>
                </Paper>
            </Stack>
        </DashboardLayout>
    );
}
