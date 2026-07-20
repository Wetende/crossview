import { useEffect } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    Alert,
    Box,
    Button,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import DashboardLayout from "@/layouts/DashboardLayout";

export default function NewConversation({
    recipients = [],
    preselectedRecipientId = null,
    submittedContent = "",
    formErrors = {},
}) {
    const selectedRecipient = preselectedRecipientId
        ? String(preselectedRecipientId)
        : "";
    const { data, setData, post, processing } = useForm({
        recipient_id: selectedRecipient,
        content: submittedContent || "",
    });

    useEffect(() => {
        if (selectedRecipient) {
            setData("recipient_id", selectedRecipient);
        }
        // Inertia's form setter is intentionally excluded: the selected
        // recipient prop is the only input that should resync this field.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRecipient]);

    const handleSubmit = (event) => {
        event.preventDefault();
        post("/messages/new/", {
            preserveScroll: true,
        });
    };

    return (
        <DashboardLayout
            breadcrumbs={[
                { label: "Messages", href: "/messages/" },
                { label: "New Message" },
            ]}
        >
            <Head title="New Message" />

            <Stack spacing={2}>
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
                    <Typography variant="h5" fontWeight={700}>
                        New Message
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Select a recipient and send your first message.
                    </Typography>
                </Box>

                <Paper variant="outlined" sx={{ p: 2 }}>
                    {!!formErrors._global && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {formErrors._global}
                        </Alert>
                    )}

                    {recipients.length === 0 && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            No available recipients found for your role and enrollment scope.
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Stack spacing={2}>
                            <TextField
                                select
                                label="Recipient"
                                value={data.recipient_id}
                                onChange={(event) =>
                                    setData("recipient_id", event.target.value)
                                }
                                fullWidth
                                required
                                disabled={recipients.length === 0}
                                error={!!formErrors.recipient_id}
                                helperText={formErrors.recipient_id || ""}
                            >
                                {recipients.map((recipient) => (
                                    <MenuItem
                                        key={recipient.id}
                                        value={String(recipient.id)}
                                    >
                                        {recipient.name} ({recipient.email})
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                label="Message"
                                value={data.content}
                                onChange={(event) => setData("content", event.target.value)}
                                multiline
                                minRows={5}
                                fullWidth
                                required
                                disabled={recipients.length === 0}
                                error={!!formErrors.content}
                                helperText={formErrors.content || ""}
                            />

                            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={
                                        processing ||
                                        recipients.length === 0 ||
                                        !data.recipient_id ||
                                        !data.content.trim()
                                    }
                                >
                                    Send Message
                                </Button>
                            </Box>
                        </Stack>
                    </Box>
                </Paper>
            </Stack>
        </DashboardLayout>
    );
}
