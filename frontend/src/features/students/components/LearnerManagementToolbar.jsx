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
    Divider,
    ListItemIcon,
    ListItemText,
    Menu,
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
    Add as AddIcon,
    Download as DownloadIcon,
    ExpandMore as ExpandMoreIcon,
    FileDownloadOutlined as ExportIcon,
    GroupAddOutlined as InviteIcon,
    PrintOutlined as PrintIcon,
    NotificationsNoneOutlined as ReminderIcon,
    UploadFileOutlined as ImportIcon,
} from "@mui/icons-material";

import { buildReportUrl } from "@/features/reports/components/reportUrls";

const baseUrl = (programId) => `/api/learning-operations/programs/${programId}`;
const templateUrl =
    "data:text/csv;charset=utf-8,email%2Cfirst_name%2Clast_name%0Alearner%40example.com%2CAmina%2COtieno%0A";

export default function LearnerManagementToolbar({
    programId,
    filters,
    selectedEnrollmentIds,
    onClearSelection,
    onSendReminder,
    onComplete,
}) {
    const fileInputRef = useRef(null);
    const [addAnchor, setAddAnchor] = useState(null);
    const [moreAnchor, setMoreAnchor] = useState(null);
    const [accessAnchor, setAccessAnchor] = useState(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [preview, setPreview] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [bulkDialog, setBulkDialog] = useState(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);

    const printUrl = buildReportUrl({
        scope: "instructor",
        reportId: "instructor.roster",
        queryParams: {
            program: programId,
            search: filters?.search,
            status: filters?.status,
        },
    });

    const fail = (error) => {
        const detail = error?.response?.data?.detail;
        const reason = error?.response?.data?.reason;
        setMessage({
            severity: "error",
            text:
                (Array.isArray(reason) ? reason[0] : reason) ||
                detail ||
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
            setImportOpen(false);
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

    const startBulkAction = (action) => {
        setAccessAnchor(null);
        setBulkDialog({ action, reason: "", preview: null });
        if (action !== "withdraw") previewBulkAction(action, "");
    };

    const previewBulkAction = async (action, reason) => {
        setBusy(true);
        setMessage(null);
        try {
            const { data } = await axios.post(
                `${baseUrl(programId)}/learners/bulk/`,
                {
                    enrollmentIds: selectedEnrollmentIds,
                    action,
                    reason,
                    preview: true,
                },
            );
            setBulkDialog((current) => ({ ...current, preview: data }));
        } catch (error) {
            fail(error);
        } finally {
            setBusy(false);
        }
    };

    const applyBulkAction = async () => {
        if (!bulkDialog?.action) return;
        setBusy(true);
        setMessage(null);
        try {
            const { data } = await axios.post(
                `${baseUrl(programId)}/learners/bulk/`,
                {
                    enrollmentIds: selectedEnrollmentIds,
                    action: bulkDialog.action,
                    reason: bulkDialog.reason,
                },
            );
            setMessage({
                severity: data.skipped ? "warning" : "success",
                text: `${data.processed} learner${data.processed === 1 ? "" : "s"} updated${data.skipped ? `; ${data.skipped} skipped` : ""}.`,
            });
            setBulkDialog(null);
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
                direction="row"
                spacing={1}
                useFlexGap
                sx={{ alignItems: "center", flexWrap: "wrap" }}
            >
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    endIcon={<ExpandMoreIcon />}
                    onClick={(event) => setAddAnchor(event.currentTarget)}
                    aria-haspopup="menu"
                    aria-expanded={addAnchor ? "true" : undefined}
                >
                    Add learners
                </Button>
                <Menu
                    anchorEl={addAnchor}
                    open={Boolean(addAnchor)}
                    onClose={() => setAddAnchor(null)}
                >
                    <MenuItem
                        onClick={() => {
                            setAddAnchor(null);
                            setInviteOpen(true);
                        }}
                    >
                        <ListItemIcon>
                            <InviteIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Add or invite by email</ListItemText>
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            setAddAnchor(null);
                            setImportOpen(true);
                        }}
                    >
                        <ListItemIcon>
                            <ImportIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Import learners from CSV</ListItemText>
                    </MenuItem>
                </Menu>

                <Button
                    variant="outlined"
                    endIcon={<ExpandMoreIcon />}
                    onClick={(event) => setMoreAnchor(event.currentTarget)}
                    aria-haspopup="menu"
                    aria-expanded={moreAnchor ? "true" : undefined}
                >
                    More
                </Button>
                <Menu
                    anchorEl={moreAnchor}
                    open={Boolean(moreAnchor)}
                    onClose={() => setMoreAnchor(null)}
                >
                    <MenuItem
                        component="a"
                        href={`${baseUrl(programId)}/roster/export/`}
                        onClick={() => setMoreAnchor(null)}
                    >
                        <ListItemIcon>
                            <ExportIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Download learner data</ListItemText>
                    </MenuItem>
                    <MenuItem
                        component="a"
                        href={printUrl}
                        target="_blank"
                        onClick={() => setMoreAnchor(null)}
                    >
                        <ListItemIcon>
                            <PrintIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Print class list</ListItemText>
                    </MenuItem>
                </Menu>

                {selectedEnrollmentIds.length > 0 && (
                    <Box
                        role="region"
                        aria-label="Selected learner actions"
                        sx={{
                            ml: { md: "auto" },
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                            bgcolor: "action.selected",
                            borderRadius: 2,
                            px: 1.5,
                            py: 0.75,
                        }}
                    >
                        <Typography variant="body2" fontWeight={700}>
                            {selectedEnrollmentIds.length} learner
                            {selectedEnrollmentIds.length === 1 ? "" : "s"}{" "}
                            selected
                        </Typography>
                        <Button
                            size="small"
                            startIcon={<ReminderIcon />}
                            onClick={onSendReminder}
                        >
                            Send reminder
                        </Button>
                        <Button
                            size="small"
                            endIcon={<ExpandMoreIcon />}
                            onClick={(event) =>
                                setAccessAnchor(event.currentTarget)
                            }
                        >
                            Manage access
                        </Button>
                        <Menu
                            anchorEl={accessAnchor}
                            open={Boolean(accessAnchor)}
                            onClose={() => setAccessAnchor(null)}
                        >
                            <MenuItem
                                onClick={() => startBulkAction("suspend")}
                            >
                                Suspend access
                            </MenuItem>
                            <MenuItem
                                onClick={() => startBulkAction("reactivate")}
                            >
                                Restore access
                            </MenuItem>
                            <Divider />
                            <MenuItem
                                onClick={() => startBulkAction("withdraw")}
                                sx={{ color: "error.main" }}
                            >
                                Withdraw
                            </MenuItem>
                        </Menu>
                        <Button size="small" onClick={onClearSelection}>
                            Clear
                        </Button>
                    </Box>
                )}
            </Stack>

            <Dialog
                open={inviteOpen}
                onClose={() => !busy && setInviteOpen(false)}
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
                open={importOpen}
                onClose={() => !busy && setImportOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Import learners from CSV</DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <Typography variant="body2">
                            Include one learner per row. <strong>email</strong>{" "}
                            is required; <strong>first_name</strong> and{" "}
                            <strong>last_name</strong> are optional. Headings
                            are not case-sensitive.
                        </Typography>
                        <Alert severity="info">
                            You will review duplicates, existing learners,
                            invitations, and rejected rows before anything
                            changes.
                        </Alert>
                        <Button
                            component="a"
                            href={templateUrl}
                            download="learner-import-template.csv"
                            startIcon={<DownloadIcon />}
                        >
                            Download CSV template
                        </Button>
                        <Button
                            variant="contained"
                            component="label"
                            startIcon={<ImportIcon />}
                            disabled={busy}
                        >
                            Choose CSV file
                            <input
                                ref={fileInputRef}
                                hidden
                                type="file"
                                accept=".csv,text/csv"
                                onChange={(event) =>
                                    previewCsv(event.target.files?.[0])
                                }
                            />
                        </Button>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setImportOpen(false)}>Cancel</Button>
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
                        Nothing is imported until you confirm this preview.
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

            <Dialog
                open={Boolean(bulkDialog)}
                onClose={() => !busy && setBulkDialog(null)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>
                    {bulkDialog?.action === "withdraw"
                        ? "Withdraw selected learners"
                        : bulkDialog?.action === "suspend"
                          ? "Suspend selected learners"
                          : "Restore learner access"}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        {bulkDialog?.action === "withdraw" &&
                            !bulkDialog.preview && (
                                <TextField
                                    autoFocus
                                    required
                                    multiline
                                    minRows={2}
                                    label="Reason for withdrawal"
                                    value={bulkDialog.reason}
                                    onChange={(event) =>
                                        setBulkDialog((current) => ({
                                            ...current,
                                            reason: event.target.value,
                                        }))
                                    }
                                />
                            )}
                        {!bulkDialog?.preview &&
                            bulkDialog?.action !== "withdraw" && (
                                <Typography color="text.secondary">
                                    Checking which selected learners are
                                    eligible…
                                </Typography>
                            )}
                        {bulkDialog?.preview && (
                            <Alert
                                severity={
                                    bulkDialog.preview.ineligible
                                        ? "warning"
                                        : "info"
                                }
                            >
                                {bulkDialog.preview.eligible} eligible;{" "}
                                {bulkDialog.preview.ineligible} will be skipped.
                            </Alert>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBulkDialog(null)} disabled={busy}>
                        Cancel
                    </Button>
                    {!bulkDialog?.preview ? (
                        <Button
                            variant="contained"
                            disabled={
                                busy ||
                                (bulkDialog?.action === "withdraw" &&
                                    !bulkDialog?.reason.trim())
                            }
                            onClick={() =>
                                previewBulkAction(
                                    bulkDialog.action,
                                    bulkDialog.reason,
                                )
                            }
                        >
                            Preview changes
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color={
                                bulkDialog.action === "withdraw"
                                    ? "error"
                                    : "primary"
                            }
                            disabled={busy || !bulkDialog.preview.eligible}
                            onClick={applyBulkAction}
                        >
                            Confirm for {bulkDialog.preview.eligible}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Stack>
    );
}
