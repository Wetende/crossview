import React, { useState } from "react";
import { router } from "@inertiajs/react";
import {
    Box,
    Typography,
    Button,
    TextField,
    Avatar,
    Divider,
    CircularProgress,
} from "@mui/material";
import { formatDistanceToNow } from "date-fns";

/**
 * ThreadDetail Component
 * Displays a discussion thread and its posts.
 * Now receives posts as props from parent (Inertia pattern).
 */
const ThreadDetail = ({ thread, posts = [], onBack, onPostCreated }) => {
    const [replyContent, setReplyContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleReply = (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        setSubmitting(true);

        // Use Inertia router.post() for mutation
        router.post(
            "/instructor/discussions/reply/",
            {
                thread: thread.id,
                content: replyContent,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReplyContent("");
                    // Notify parent to refresh posts if needed
                    if (onPostCreated) {
                        onPostCreated();
                    }
                },
                onFinish: () => {
                    setSubmitting(false);
                },
            },
        );
    };

    return (
        <Box>
            {/* Back Button */}
            <Button onClick={onBack} size="small" sx={{ mb: 2 }}>
                &larr; Back to discussions
            </Button>

            {/* Thread Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    {thread.title}
                </Typography>
                <Typography variant="body1" paragraph>
                    {thread.content}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: "0.75rem" }}>
                        {thread.user?.first_name?.[0] || "U"}
                    </Avatar>
                    <Typography variant="caption" color="text.secondary">
                        {thread.user?.first_name || "User"} •{" "}
                        {formatDistanceToNow(new Date(thread.created_at))} ago
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Posts List */}
            <Box sx={{ mb: 4 }}>
                {posts.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        No replies yet. Be the first to respond!
                    </Typography>
                ) : (
                    posts.map((post) => (
                        <Box
                            key={post.id}
                            sx={{ mb: 2, pl: 2, borderLeft: "2px solid #eee" }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 0.5,
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    sx={{ fontSize: "0.85rem" }}
                                >
                                    {post.user?.first_name ||
                                        post.user?.username ||
                                        "User"}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    {formatDistanceToNow(
                                        new Date(post.created_at),
                                    )}{" "}
                                    ago
                                </Typography>
                            </Box>
                            <Typography variant="body2">
                                {post.content}
                            </Typography>
                        </Box>
                    ))
                )}
            </Box>

            {/* Reply Form */}
            <Box
                component="form"
                onSubmit={handleReply}
                sx={{ position: "sticky", bottom: 0, bgcolor: "white", pt: 1 }}
            >
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Write a reply..."
                    multiline
                    maxRows={4}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    disabled={submitting}
                    InputProps={{
                        endAdornment: (
                            <Button
                                type="submit"
                                variant="contained"
                                size="small"
                                disabled={!replyContent.trim() || submitting}
                                sx={{ ml: 1 }}
                            >
                                {submitting ? (
                                    <CircularProgress size={16} />
                                ) : (
                                    "Send"
                                )}
                            </Button>
                        ),
                    }}
                />
            </Box>
        </Box>
    );
};

export default ThreadDetail;
