import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";

import { workspaceApi } from "../api/workspaceApi";

export default function GoogleWorkspaceConnectionCard() {
    const [connection, setConnection] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const loadConnection = useCallback(async () => {
        try {
            setConnection(await workspaceApi.connection());
            setError("");
        } catch (loadError) {
            setError(loadError.message);
        }
    }, []);

    useEffect(() => {
        void loadConnection();
    }, [loadConnection]);

    const connect = async () => {
        setBusy(true);
        setError("");
        try {
            const result = await workspaceApi.connect({
                capabilities: ["calendar_events"],
                returnTo: window.location.pathname + window.location.search,
            });
            window.location.assign(result.authorizationUrl);
        } catch (connectError) {
            setError(connectError.message);
            setBusy(false);
        }
    };

    if (!connection && !error) return null;

    const calendarAuthorized =
        connection?.grantedCapabilities?.includes("calendar_events");

    return (
        <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3 }}>
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
            >
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                        sx={{
                            width: 42,
                            height: 42,
                            display: "grid",
                            placeItems: "center",
                            borderRadius: 2,
                            bgcolor: calendarAuthorized
                                ? "success.lighter"
                                : "primary.lighter",
                            color: calendarAuthorized
                                ? "success.main"
                                : "primary.main",
                        }}
                    >
                        <CalendarMonthOutlinedIcon />
                    </Box>
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography fontWeight={700}>
                                Google Calendar
                            </Typography>
                            {calendarAuthorized && (
                                <Chip
                                    size="small"
                                    color="success"
                                    label="Connected"
                                />
                            )}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                            {calendarAuthorized
                                ? connection.googleEmail
                                : "Connect once to create Google Meet lessons."}
                        </Typography>
                    </Box>
                </Stack>
                <Button
                    variant={calendarAuthorized ? "text" : "contained"}
                    disabled={!connection?.available || busy}
                    onClick={connect}
                >
                    {busy
                        ? "Opening Google…"
                        : calendarAuthorized
                          ? "Reconnect"
                          : "Connect Google Calendar"}
                </Button>
            </Stack>
            {(error || connection?.oauthCallback?.status === "error") && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error || connection.oauthCallback.message}
                </Alert>
            )}
            {connection?.oauthCallback?.status === "success" && (
                <Alert severity="success" sx={{ mt: 2 }}>
                    {connection.oauthCallback.message}
                </Alert>
            )}
            {connection && !connection.available && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                    Google Calendar is not available on this deployment.
                </Alert>
            )}
            {connection?.lastError && !calendarAuthorized && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                    Google Calendar needs to be reconnected.
                </Alert>
            )}
        </Paper>
    );
}
