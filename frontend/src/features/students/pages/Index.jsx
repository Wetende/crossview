import { useState } from "react";
import axios from "axios";
import { Head, Link, router } from "@inertiajs/react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    InputAdornment,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";

import InstructorLayout from "@/layouts/InstructorLayout";
import { ReportToolbar } from "@/features/reports";
import LearnerDetailPanel from "../components/LearnerDetailPanel";
import LearnerManagementToolbar from "../components/LearnerManagementToolbar";
import LearnerReminderDialog from "../components/LearnerReminderDialog";
import ProgramLearnerRoster from "../components/ProgramLearnerRoster";

const statusColors = {
    active: "success",
    completed: "primary",
    withdrawn: "error",
    suspended: "warning",
};

const baseUrl = (programId) => `/api/learning-operations/programs/${programId}`;

function reminderResultMessage(result) {
    const parts = [
        `${result.processed} reminder${result.processed === 1 ? "" : "s"} prepared`,
    ];
    if (result.skipped) parts.push(`${result.skipped} skipped`);
    if (result.unavailableChannels?.inApp) {
        parts.push(
            `in-app unavailable for ${result.unavailableChannels.inApp}`,
        );
    }
    if (result.unavailableChannels?.email) {
        parts.push(`email unavailable for ${result.unavailableChannels.email}`);
    }
    return `${parts.join("; ")}.`;
}

function StudentDirectory({ students }) {
    return (
        <Card>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Student</TableCell>
                            <TableCell>Programs</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {students.length ? (
                            students.map((student) => (
                                <TableRow key={student.id} hover>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            fontWeight={700}
                                        >
                                            {student.name}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {student.email}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Stack
                                            direction="row"
                                            spacing={0.5}
                                            useFlexGap
                                            sx={{ flexWrap: "wrap" }}
                                        >
                                            {student.programs?.map((course) => (
                                                <Chip
                                                    key={course.id}
                                                    label={course.name}
                                                    size="small"
                                                    color={
                                                        statusColors[
                                                            course.status
                                                        ] || "default"
                                                    }
                                                    variant="outlined"
                                                />
                                            ))}
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            component={Link}
                                            href={`/instructor/students/${student.id}/`}
                                            size="small"
                                        >
                                            View profile
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={3}
                                    align="center"
                                    sx={{ py: 5 }}
                                >
                                    No students found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Card>
    );
}

export default function InstructorStudentsIndex({
    program,
    students,
    filters,
}) {
    const isProgramView = Boolean(program);
    const [search, setSearch] = useState(filters?.search || "");
    const [status, setStatus] = useState(filters?.status || "");
    const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState([]);
    const [activeLearner, setActiveLearner] = useState(null);
    const [pendingAction, setPendingAction] = useState(null);
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);
    const [reminderEnrollmentIds, setReminderEnrollmentIds] = useState([]);

    const studentsList = Array.isArray(students)
        ? students
        : students?.results || [];
    const pagination = Array.isArray(students)
        ? {}
        : students?.pagination || {};
    const visibleEnrollmentIds = studentsList
        .map((student) => student.enrollmentId)
        .filter(Boolean);
    const allVisibleSelected =
        visibleEnrollmentIds.length > 0 &&
        visibleEnrollmentIds.every((id) => selectedEnrollmentIds.includes(id));

    const breadcrumbs = isProgramView
        ? [
              { label: "Dashboard", href: "/dashboard/" },
              { label: "My Programs", href: "/instructor/programs/" },
              {
                  label: program.name,
                  href: `/instructor/programs/${program.id}/`,
              },
              { label: "Learners" },
          ]
        : [
              { label: "Dashboard", href: "/dashboard/" },
              { label: "My Students" },
          ];
    const pageTitle = isProgramView
        ? `Learners — ${program.name}`
        : "My Students";

    const handleFilterChange = (newFilters) => {
        const target = isProgramView
            ? `/instructor/programs/${program.id}/students/`
            : "/instructor/students/";
        router.visit(target, {
            data: { ...filters, ...newFilters },
            preserveState: true,
            preserveScroll: true,
            only: ["students", "filters"],
        });
    };

    const toggleAllVisible = () => {
        setSelectedEnrollmentIds((current) =>
            allVisibleSelected
                ? current.filter((id) => !visibleEnrollmentIds.includes(id))
                : [...new Set([...current, ...visibleEnrollmentIds])],
        );
    };

    const toggleEnrollment = (id) => {
        setSelectedEnrollmentIds((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id],
        );
    };

    const reloadRoster = ({ clearSelection = false } = {}) => {
        if (clearSelection) setSelectedEnrollmentIds([]);
        router.reload({ only: ["students"] });
    };

    const executeStatusAction = async (action, learner, actionReason = "") => {
        setBusy(true);
        setMessage(null);
        try {
            const { data } = await axios.post(
                `${baseUrl(program.id)}/learners/bulk/`,
                {
                    enrollmentIds: [learner.enrollmentId],
                    action: action === "restore" ? "reactivate" : action,
                    reason: actionReason,
                },
            );
            setMessage({
                severity: data.skipped ? "warning" : "success",
                text: data.skipped
                    ? data.results?.[0]?.detail ||
                      "This action is not available."
                    : action === "restore"
                      ? "Learner access restored."
                      : action === "suspend"
                        ? "Learner access suspended."
                        : "Learner withdrawn.",
            });
            setPendingAction(null);
            setReason("");
            setActiveLearner(null);
            reloadRoster();
        } catch (error) {
            const detail = error?.response?.data?.detail;
            const reasonError = error?.response?.data?.reason;
            setMessage({
                severity: "error",
                text:
                    (Array.isArray(reasonError)
                        ? reasonError[0]
                        : reasonError) ||
                    detail ||
                    "The learner could not be updated.",
            });
        } finally {
            setBusy(false);
        }
    };

    const handleLearnerAction = (action, learner) => {
        if (action === "view") {
            setActiveLearner(learner);
            return;
        }
        if (action === "message") {
            router.visit(`/messages/new/?recipient_id=${learner.userId}`);
            return;
        }
        if (action === "reminder") {
            setReminderEnrollmentIds([learner.enrollmentId]);
            return;
        }
        if (action === "restore") {
            executeStatusAction(action, learner);
            return;
        }
        if (action === "suspend" || action === "withdraw") {
            setReason("");
            setPendingAction({ action, learner });
        }
    };

    return (
        <InstructorLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />
            <Stack spacing={3}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{
                        justifyContent: "space-between",
                        alignItems: { sm: "center" },
                    }}
                >
                    <Box>
                        <Typography variant="h4" fontWeight={700}>
                            {pageTitle}
                        </Typography>
                        {isProgramView && (
                            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                                Review progress, support learners, and manage
                                course access.
                            </Typography>
                        )}
                    </Box>
                    {!isProgramView && (
                        <ReportToolbar
                            scope="instructor"
                            reportId="instructor.roster"
                            queryParams={{
                                search: filters?.search,
                                status: filters?.status,
                            }}
                        />
                    )}
                </Stack>

                {message && (
                    <Alert severity={message.severity}>{message.text}</Alert>
                )}

                {isProgramView && (
                    <LearnerManagementToolbar
                        programId={program.id}
                        filters={filters}
                        selectedEnrollmentIds={selectedEnrollmentIds}
                        onClearSelection={() => setSelectedEnrollmentIds([])}
                        onSendReminder={() =>
                            setReminderEnrollmentIds(selectedEnrollmentIds)
                        }
                        onComplete={() =>
                            reloadRoster({ clearSelection: true })
                        }
                    />
                )}

                <Card>
                    <CardContent>
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                        >
                            <Box
                                component="form"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    handleFilterChange({ search, page: 1 });
                                }}
                                sx={{ flex: 1 }}
                            >
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Search by name or email…"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Box>
                            {isProgramView && (
                                <TextField
                                    select
                                    size="small"
                                    value={status}
                                    onChange={(event) => {
                                        setStatus(event.target.value);
                                        handleFilterChange({
                                            status: event.target.value,
                                            page: 1,
                                        });
                                    }}
                                    sx={{ minWidth: 170 }}
                                    label="Learner state"
                                >
                                    <MenuItem value="">
                                        All learner states
                                    </MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="new">New</MenuItem>
                                    <MenuItem value="not_started">
                                        Not started
                                    </MenuItem>
                                    <MenuItem value="stalled">Stalled</MenuItem>
                                    <MenuItem value="inactive">
                                        Inactive
                                    </MenuItem>
                                    <MenuItem value="completed">
                                        Completed
                                    </MenuItem>
                                    <MenuItem value="withdrawn">
                                        Withdrawn
                                    </MenuItem>
                                    <MenuItem value="suspended">
                                        Suspended
                                    </MenuItem>
                                </TextField>
                            )}
                        </Stack>
                    </CardContent>
                </Card>

                {isProgramView ? (
                    <ProgramLearnerRoster
                        students={studentsList}
                        pagination={pagination}
                        selectedEnrollmentIds={selectedEnrollmentIds}
                        onToggle={toggleEnrollment}
                        onToggleAll={toggleAllVisible}
                        onOpen={setActiveLearner}
                        onAction={handleLearnerAction}
                        onPageChange={(_, page) =>
                            handleFilterChange({ page: page + 1 })
                        }
                        remindersEnabled
                    />
                ) : (
                    <StudentDirectory students={studentsList} />
                )}
            </Stack>

            {isProgramView && (
                <LearnerDetailPanel
                    open={Boolean(activeLearner)}
                    learner={activeLearner}
                    programId={program.id}
                    onClose={() => setActiveLearner(null)}
                    onAction={handleLearnerAction}
                    remindersEnabled
                />
            )}

            {isProgramView && (
                <LearnerReminderDialog
                    open={reminderEnrollmentIds.length > 0}
                    programId={program.id}
                    enrollmentIds={reminderEnrollmentIds}
                    onClose={() => setReminderEnrollmentIds([])}
                    onSent={(result) => {
                        setReminderEnrollmentIds([]);
                        setSelectedEnrollmentIds([]);
                        setMessage({
                            severity:
                                result.skipped ||
                                result.unavailableChannels?.inApp ||
                                result.unavailableChannels?.email
                                    ? "warning"
                                    : "success",
                            text: reminderResultMessage(result),
                        });
                    }}
                />
            )}

            <Dialog
                open={Boolean(pendingAction)}
                onClose={() => !busy && setPendingAction(null)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>
                    {pendingAction?.action === "withdraw"
                        ? `Withdraw ${pendingAction.learner.name}?`
                        : `Suspend access for ${pendingAction?.learner.name}?`}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <Alert
                            severity={
                                pendingAction?.action === "withdraw"
                                    ? "warning"
                                    : "info"
                            }
                        >
                            Progress, attempts, submissions, grades, and
                            certificates are preserved.
                        </Alert>
                        {pendingAction?.action === "withdraw" && (
                            <TextField
                                autoFocus
                                required
                                multiline
                                minRows={2}
                                label="Reason for withdrawal"
                                value={reason}
                                onChange={(event) =>
                                    setReason(event.target.value)
                                }
                            />
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setPendingAction(null)}
                        disabled={busy}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color={
                            pendingAction?.action === "withdraw"
                                ? "error"
                                : "primary"
                        }
                        disabled={
                            busy ||
                            (pendingAction?.action === "withdraw" &&
                                !reason.trim())
                        }
                        onClick={() =>
                            executeStatusAction(
                                pendingAction.action,
                                pendingAction.learner,
                                reason,
                            )
                        }
                    >
                        {pendingAction?.action === "withdraw"
                            ? "Withdraw learner"
                            : "Suspend access"}
                    </Button>
                </DialogActions>
            </Dialog>
        </InstructorLayout>
    );
}
