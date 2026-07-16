import { useRef, useState } from "react";
import axios from "axios";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import {
    FileDownload as ExportIcon,
    GroupAdd as InviteIcon,
    UploadFile as ImportIcon,
} from "@mui/icons-material";

const baseUrl = (programId) => `/api/learning-operations/programs/${programId}`;

export default function LearnerManagementToolbar({
    programId,
    selectedEnrollmentIds,
    onComplete,
}) {
    const fileInputRef = useRef(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [bulkAction, setBulkAction] = useState("");
    const [preview, setPreview] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);

    const fail = (error) => {
        setMessage({
            severity: "error",
            text:
                error?.response?.data?.detail ||
                "The operation could not be completed.",
        });
    };

    const invite = async () => {
        setBusy(true);
        setMessage(null);
        try {
            const { data } = await axios.post(
                `${baseUrl(programId)}/invitations/`,
                { email },
            );
            setInviteOpen(false);
            setEmail("");
            setMessage({
                severity: "success",
                text:
                    data.status === "enrolled"
                        ? "Learner enrolled."
                        : "Invitation created.",
            });
            onComplete?.();
        } catch (error) {
            fail(error);
        } finally {
            setBusy(false);
        }
    };

    const previewCsv = async (file) => {
        if (!file) return;
        setBusy(true);
        setMessage(null);
        const form = new FormData();
        form.append("file", file);
        try {
            const { data } = await axios.post(
                `${baseUrl(programId)}/roster/preview/`,
                form,
            );
            setPreview(data);
            setPreviewFile(file);
        } catch (error) {
            fail(error);
        } finally {
            setBusy(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const confirmImport = async () => {
        if (!previewFile || !preview?.confirmationToken) return;
        setBusy(true);
        const form = new FormData();
        form.append("file", previewFile);
        form.append("confirmationToken", preview.confirmationToken);
        try {
            const { data } = await axios.post(
                `${baseUrl(programId)}/roster/import/`,
                form,
            );
            setPreview(null);
            setPreviewFile(null);
            setMessage({
                severity: "success",
                text: `${data.imported} enrolled, ${data.invited} invited, ${data.skipped} skipped.`,
            });
            onComplete?.();
        } catch (error) {
            fail(error);
        } finally {
            setBusy(false);
        }
    };

    const runBulkAction = async () => {
        if (!bulkAction || selectedEnrollmentIds.length === 0) return;
        setBusy(true);
        setMessage(null);
        try {
            await axios.post(`${baseUrl(programId)}/learners/bulk/`, {
                enrollmentIds: selectedEnrollmentIds,
                action: bulkAction,
            });
            setMessage({ severity: "success", text: "Learners updated." });
            setBulkAction("");
            onComplete?.();
        } catch (error) {
            fail(error);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Stack spacing={1.5}>
            {message && (
                <Alert severity={message.severity}>{message.text}</Alert>
            )}
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1}
                alignItems={{ md: "center" }}
            >
                <Button
                    variant="contained"
                    startIcon={<InviteIcon />}
                    onClick={() => setInviteOpen(true)}
                >
                    Add or invite
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<ImportIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={busy}
                >
                    Import CSV
                </Button>
                <input
                    ref={fileInputRef}
                    hidden
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(event) => previewCsv(event.target.files?.[0])}
                />
                <Button
                    component="a"
                    href={`${baseUrl(programId)}/roster/export/`}
                    variant="outlined"
                    startIcon={<ExportIcon />}
                >
                    Export CSV
                </Button>
                <Box sx={{ flex: 1 }} />
                <TextField
                    select
                    size="small"
                    label="Bulk action"
                    value={bulkAction}
                    onChange={(event) => setBulkAction(event.target.value)}
                    sx={{ minWidth: 180 }}
                    disabled={selectedEnrollmentIds.length === 0}
                >
                    <MenuItem value="activate">Activate</MenuItem>
                    <MenuItem value="suspend">Suspend</MenuItem>
                    <MenuItem value="withdraw">Withdraw</MenuItem>
                    <MenuItem value="reactivate">Reactivate</MenuItem>
                    <MenuItem value="send_reminder">Send reminder</MenuItem>
                </TextField>
                <Button
                    variant="outlined"
                    disabled={
                        !bulkAction ||
                        selectedEnrollmentIds.length === 0 ||
                        busy
                    }
                    onClick={runBulkAction}
                >
                    Apply to {selectedEnrollmentIds.length || 0}
                </Button>
            </Stack>

            <Dialog
                open={inviteOpen}
                onClose={() => setInviteOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Add or invite learner</DialogTitle>
                <DialogContent>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                    >
                        Existing accounts are enrolled immediately. New learners
                        receive a seven-day invitation.
                    </Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        type="email"
                        label="Email address"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        disabled={!email || busy}
                        onClick={invite}
                    >
                        Continue
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={Boolean(preview)}
                onClose={() => !busy && setPreview(null)}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>Review CSV import</DialogTitle>
                <DialogContent>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                    >
                        Confirm only after reviewing every accepted, duplicate,
                        existing, and rejected row.
                    </Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Row</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Detail</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(preview?.results || []).map((row) => (
                                <TableRow key={`${row.row}-${row.email}`}>
                                    <TableCell>{row.row}</TableCell>
                                    <TableCell>{row.email || "—"}</TableCell>
                                    <TableCell>
                                        {row.status.replaceAll("_", " ")}
                                    </TableCell>
                                    <TableCell>{row.detail}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreview(null)} disabled={busy}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={confirmImport}
                        disabled={busy}
                    >
                        Confirm import
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}
