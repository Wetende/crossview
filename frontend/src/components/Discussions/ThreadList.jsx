import React, { useState } from "react";
import { router } from "@inertiajs/react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    TextField,
    Chip,
    Alert,
    CircularProgress,
} from "@mui/material";
import { formatDistanceToNow } from "date-fns";

/**
 * ThreadList Component
 * Displays discussion threads for a node.
 * Now receives threads as props from parent (Inertia pattern).
 */
const ThreadList = ({
    nodeId,
    threads = [],
    onSelectThread,
    onThreadCreated,
}) => {
    const [showNewForm, setShowNewForm] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleCreateThread = (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Use Inertia router.post() for mutation
        router.post(
            `/instructor/nodes/${nodeId}/discussions/create/`,
            {
                title: newTitle,
                content: newContent,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowNewForm(false);
                    setNewTitle("");
                    setNewContent("");
                    // Notify parent to refresh threads if needed
                    if (onThreadCreated) {
                        onThreadCreated();
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
            {!showNewForm ? (
                <Button
                    fullWidth
                    variant="contained"
                    onClick={() => setShowNewForm(true)}
                    sx={{ mb: 2 }}
                >
                    Start New Discussion
                </Button>
            ) : (
                <Box
                    component="form"
                    onSubmit={handleCreateThread}
                    sx={{ mb: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}
                >
                    <Typography variant="subtitle2" gutterBottom>
                        New Question
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        label="Title"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                        disabled={submitting}
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label="Details"
                        multiline
                        rows={3}
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                        disabled={submitting}
                    />
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            size="small"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <CircularProgress size={16} />
                            ) : (
                                "Post"
                            )}
                        </Button>
                        <Button
                            onClick={() => setShowNewForm(false)}
                            size="small"
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            )}

            {threads.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                    No questions yet. Be the first!
                </Alert>
            ) : (
                threads.map((thread) => (
                    <Card
                        key={thread.id}
                        sx={{
                            mb: 2,
                            cursor: "pointer",
                            "&:hover": { boxShadow: 3 },
                        }}
                        onClick={() => onSelectThread(thread)}
                    >
                        <CardContent sx={{ p: "16px !important" }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    mb: 0.5,
                                }}
                            >
                                <Typography
                                    variant="subtitle1"
                                    fontWeight="bold"
                                >
                                    {thread.title}
                                </Typography>
                                {thread.is_pinned && (
                                    <Chip
                                        label="Pinned"
                                        size="small"
                                        color="primary"
                                    />
                                )}
                            </Box>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                            >
                                {thread.content}
                            </Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    mt: 1,
                                    fontSize: "0.75rem",
                                    color: "text.secondary",
                                }}
                            >
                                <span>
                                    {thread.user?.first_name ||
                                        thread.user?.username ||
                                        "User"}
                                </span>
                                <span>
                                    {thread.posts_count} replies •{" "}
                                    {formatDistanceToNow(
                                        new Date(thread.latest_post_at),
                                    )}{" "}
                                    ago
                                </span>
                            </Box>
                        </CardContent>
                    </Card>
                ))
            )}
        </Box>
    );
};

export default ThreadList;
