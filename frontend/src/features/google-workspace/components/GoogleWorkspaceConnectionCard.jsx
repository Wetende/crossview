import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import TroubleshootOutlinedIcon from "@mui/icons-material/TroubleshootOutlined";

import { workspaceApi } from "../api/workspaceApi";

const safeConnectionSnapshot = (connection) => ({
    available: connection?.available,
    connected: connection?.connected,
    status: connection?.status,
    googleEmail: connection?.googleEmail,
    grantedScopes: connection?.grantedScopes || [],
    grantedCapabilities: connection?.grantedCapabilities || [],
    lastError: connection?.lastError || "",
    calendarAccess: connection?.diagnostics?.calendarAccess || null,
    oauthCallback: connection?.oauthCallback || null,
});

export default function GoogleWorkspaceConnectionCard() {
    const [connection, setConnection] = useState(null);
    const [busy, setBusy] = useState("");
    const [error, setError] = useState("");
    const [testResult, setTestResult] = useState(null);

    const loadConnection = useCallback(async () => {
        setBusy("refresh");
        setError("");
        try {
            const result = await workspaceApi.connection();
            setConnection(result);
            const snapshot = safeConnectionSnapshot(result);
            if (result.oauthCallback?.status === "error") {
                console.error(
                    "[Google Workspace dashboard] OAuth callback failed",
                    snapshot,
                );
            } else if (!result.available) {
                console.warn(
                    "[Google Workspace dashboard] Integration is not configured",
                    snapshot,
                );
            } else if (!result.connected) {
                console.warn(
                    "[Google Workspace dashboard] No teacher credential is stored",
                    snapshot,
                );
            } else if (
                !result.grantedCapabilities?.includes("calendar_events")
            ) {
                console.error(
                    "[Google Workspace dashboard] Calendar capability is missing",
                    snapshot,
                );
            } else {
                console.info(
                    "[Google Workspace dashboard] Connection loaded",
                    snapshot,
                );
            }
        } catch (loadError) {
            console.error(
                "[Google Workspace dashboard] Connection request failed",
                loadError,
            );
            setError(loadError.message);
        } finally {
            setBusy("");
        }
    }, []);

    useEffect(() => {
        void loadConnection();
    }, [loadConnection]);

    const connect = async () => {
        setBusy("connect");
        setError("");
        try {
            const result = await workspaceApi.connect({
                capabilities: ["calendar_events"],
                returnTo: window.location.pathname + window.location.search,
            });
            console.info(
                "[Google Workspace dashboard] Redirecting to Google authorization",
                { returnTo: window.location.pathname + window.location.search },
            );
            window.location.assign(result.authorizationUrl);
        } catch (connectError) {
            console.error(
                "[Google Workspace dashboard] Authorization could not start",
                connectError,
            );
            setError(connectError.message);
            setBusy("");
        }
    };

    const testCalendar = async () => {
        setBusy("test");
        setError("");
        setTestResult(null);
        try {
            const result = await workspaceApi.testConnection();
            setConnection(result.connection);
            setTestResult(result);
            const snapshot = {
                ok: result.ok,
                diagnostic: result.diagnostic,
                connection: safeConnectionSnapshot(result.connection),
            };
            if (result.ok) {
                console.info(
                    "[Google Workspace dashboard] Live Calendar access test passed",
                    snapshot,
                );
            } else {
                console.error(
                    "[Google Workspace dashboard] Live Calendar access test failed",
                    snapshot,
                );
            }
        } catch (testError) {
            console.error(
                "[Google Workspace dashboard] Live Calendar access test request failed",
                testError,
            );
            setError(testError.message);
        } finally {
            setBusy("");
        }
    };

    const calendarAuthorized =
        connection?.grantedCapabilities?.includes("calendar_events");
    const diagnostic =
        testResult?.diagnostic || connection?.diagnostics?.calendarAccess;

    return (
        <Paper
            variant="outlined"
            sx={{
                p: { xs: 2.25, md: 2.75 },
                borderRadius: 3,
                borderColor: calendarAuthorized ? "success.light" : "divider",
            }}
        >
            <Stack spacing={2}>
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    sx={{
                        alignItems: { xs: "flex-start", md: "center" },
                        justifyContent: "space-between",
                    }}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                            sx={{
                                width: 46,
                                height: 46,
                                display: "grid",
                                placeItems: "center",
                                borderRadius: 2.5,
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
                            <Typography variant="h6" fontWeight={700}>
                                Google Calendar for live classes
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Connect once, then test the saved teacher access
                                before creating Google Meet lessons.
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{ flexWrap: "wrap", rowGap: 1 }}
                    >
                        <Button
                            variant={
                                connection?.connected ? "outlined" : "contained"
                            }
                            disabled={!connection?.available || Boolean(busy)}
                            onClick={connect}
                        >
                            {busy === "connect"
                                ? "Opening Google…"
                                : connection?.connected
                                  ? "Reconnect Google Calendar"
                                  : "Connect Google Calendar"}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<TroubleshootOutlinedIcon />}
                            disabled={!connection?.connected || Boolean(busy)}
                            onClick={testCalendar}
                        >
                            {busy === "test" ? "Testing…" : "Test access"}
                        </Button>
                        <Button
                            startIcon={<RefreshOutlinedIcon />}
                            disabled={Boolean(busy)}
                            onClick={loadConnection}
                        >
                            Refresh
                        </Button>
                    </Stack>
                </Stack>

                {error && <Alert severity="error">{error}</Alert>}
                {connection?.oauthCallback?.status === "error" && (
                    <Alert severity="error">
                        {connection.oauthCallback.message}
                        <Typography
                            component="span"
                            variant="caption"
                            sx={{ display: "block", mt: 0.5 }}
                        >
                            Callback diagnostic:{" "}
                            {connection.oauthCallback.stage}
                            {connection.oauthCallback.category
                                ? ` · ${connection.oauthCallback.category}`
                                : ""}
                        </Typography>
                    </Alert>
                )}
                {connection?.oauthCallback?.status === "success" && (
                    <Alert severity="success">
                        {connection.oauthCallback.message}
                    </Alert>
                )}
                {connection && !connection.available && (
                    <Alert severity="warning">
                        Google Workspace is not configured on this deployment.
                    </Alert>
                )}
                {testResult?.ok && (
                    <Alert severity="success">
                        Live Calendar access confirmed. Airads can read the
                        teacher calendar and create Google Meet events.
                    </Alert>
                )}
                {testResult && !testResult.ok && (
                    <Alert severity="error">
                        Calendar access test failed. Review the diagnostic below
                        and the browser console.
                    </Alert>
                )}

                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
                >
                    <Chip
                        size="small"
                        color={connection?.connected ? "success" : "default"}
                        label={
                            connection?.connected
                                ? "Account saved"
                                : "Account not saved"
                        }
                    />
                    <Chip
                        size="small"
                        color={calendarAuthorized ? "success" : "warning"}
                        label={
                            calendarAuthorized
                                ? "Calendar permission present"
                                : "Calendar permission missing"
                        }
                    />
                    {connection?.googleEmail && (
                        <Typography variant="body2" color="text.secondary">
                            {connection.googleEmail}
                        </Typography>
                    )}
                </Stack>

                {diagnostic && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ overflowWrap: "anywhere" }}
                    >
                        Diagnostic: {diagnostic.status || "unknown"}
                        {diagnostic.category ? ` · ${diagnostic.category}` : ""}
                        {diagnostic.statusCode
                            ? ` · HTTP ${diagnostic.statusCode}`
                            : ""}
                    </Typography>
                )}
                {connection?.lastError && (
                    <Alert severity="warning">{connection.lastError}</Alert>
                )}
            </Stack>
        </Paper>
    );
}
