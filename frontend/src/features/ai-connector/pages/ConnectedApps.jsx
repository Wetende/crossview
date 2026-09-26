import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DashboardLayout from "@/layouts/DashboardLayout";
import { getFlashMessages, getFlashSeverity } from "@/utils/userMessages";

const cardSx = { borderRadius: 2, borderColor: "divider", boxShadow: "none" };

const formatDate = (value) =>
    value
        ? new Intl.DateTimeFormat(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
          }).format(new Date(value))
        : "—";

function ConnectionUrl({ url }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    return (
        <TextField
            label="Connector URL"
            value={url}
            fullWidth
            size="small"
            slotProps={{
                input: {
                    readOnly: true,
                    endAdornment: (
                        <InputAdornment position="end">
                            <Tooltip title={copied ? "Copied" : "Copy URL"}>
                                <IconButton
                                    onClick={copy}
                                    edge="end"
                                    aria-label="Copy connector URL"
                                >
                                    {copied ? (
                                        <CheckIcon fontSize="small" />
                                    ) : (
                                        <ContentCopyIcon fontSize="small" />
                                    )}
                                </IconButton>
                            </Tooltip>
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
}

function ConnectionRow({ connection, onDisconnect }) {
    return (
        <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
                py: 2,
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
            }}
        >
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                    {connection.name}
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap sx={{ my: 1, flexWrap: "wrap" }}>
                    {connection.scopes.map((scope) => (
                        <Chip key={scope} label={scope} size="small" variant="outlined" />
                    ))}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                    Connected {formatDate(connection.connectedAt)} · Last active{" "}
                    {formatDate(connection.lastActiveAt)}
                </Typography>
            </Box>
            <Button
                variant="outlined"
                color="error"
                onClick={() => onDisconnect(connection)}
                sx={{ flexShrink: 0 }}
            >
                Disconnect
            </Button>
        </Stack>
    );
}

export default function ConnectedApps({ connections = [], canConnect, connectorUrl }) {
    const [pending, setPending] = useState(null);
    const [processing, setProcessing] = useState(false);
    const flashMessages = getFlashMessages(usePage().props.flash);

    const disconnect = () => {
        if (!pending) return;
        router.post(
            `/account/connected-apps/${pending.id}/disconnect/`,
            {},
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => {
                    setProcessing(false);
                    setPending(null);
                },
            },
        );
    };

    return (
        <DashboardLayout>
            <Head title="Connected AI apps" />

            <Container maxWidth="md" disableGutters sx={{ mt: 2, mb: 8 }}>
                <Stack spacing={4}>
                    <Box>
                        <Typography variant="h5" component="h1" fontWeight={700} gutterBottom>
                            Connected AI apps
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Let an AI assistant such as ChatGPT, Claude or Codex read the
                            courses you manage and prepare changes that you approve in the
                            chat.
                        </Typography>
                    </Box>

                    {flashMessages.map((message, index) => (
                        <Alert key={index} severity={getFlashSeverity(message.type)}>
                            {message.message}
                        </Alert>
                    ))}

                    <Card variant="outlined" sx={cardSx}>
                        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                            <Typography variant="h6" component="h2" gutterBottom>
                                Connect an AI app
                            </Typography>
                            {canConnect ? (
                                <Stack spacing={2}>
                                    <Typography variant="body2" color="text.secondary">
                                        In your AI app, add a custom connector (remote MCP
                                        server) with this URL. You will be asked to sign in
                                        here and choose what the app may do.
                                    </Typography>
                                    <ConnectionUrl url={connectorUrl} />
                                    <Alert severity="info" variant="outlined">
                                        Every change is shown to you as a preview in the chat
                                        and saved only after you confirm it. AI apps cannot
                                        delete content, publish courses or change grading.
                                    </Alert>
                                </Stack>
                            ) : (
                                <Alert severity="info">
                                    Only instructors and administrators can connect AI apps.
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    <Card variant="outlined" sx={cardSx}>
                        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                            <Typography variant="h6" component="h2">
                                Your connections
                            </Typography>
                            {connections.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    No AI apps are connected to your account.
                                </Typography>
                            ) : (
                                <Stack divider={<Divider flexItem />}>
                                    {connections.map((connection) => (
                                        <ConnectionRow
                                            key={connection.id}
                                            connection={connection}
                                            onDisconnect={setPending}
                                        />
                                    ))}
                                </Stack>
                            )}
                        </CardContent>
                    </Card>
                </Stack>
            </Container>

            <Dialog open={Boolean(pending)} onClose={() => !processing && setPending(null)}>
                <DialogTitle>Disconnect {pending?.name}?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        The app immediately loses access to your courses. Changes it
                        already saved stay in place. You can connect it again at any time.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPending(null)} disabled={processing}>
                        Cancel
                    </Button>
                    <Button color="error" variant="contained" onClick={disconnect} disabled={processing}>
                        Disconnect
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
}
