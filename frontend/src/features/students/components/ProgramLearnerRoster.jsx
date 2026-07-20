import {
    Box,
    Button,
    Card,
    Checkbox,
    Chip,
    Divider,
    LinearProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography,
} from "@mui/material";

import LearnerActionsMenu from "./LearnerActionsMenu";

const statusColors = {
    new: "info",
    not_started: "default",
    stalled: "warning",
    inactive: "error",
    active: "success",
    completed: "primary",
    withdrawn: "error",
    suspended: "warning",
};

const statusLabel = (student) =>
    String(student.learnerState || student.status || "active").replaceAll(
        "_",
        " ",
    );

function Progress({ student }) {
    const value = Number(student.progressPercent ?? student.progress ?? 0);
    return (
        <Stack spacing={0.5} sx={{ minWidth: 120 }}>
            <Typography variant="caption" fontWeight={600}>
                {value}%
            </Typography>
            <LinearProgress
                variant="determinate"
                value={value}
                aria-label={`${student.name} progress`}
                sx={{ height: 6, borderRadius: 3 }}
            />
        </Stack>
    );
}

function LearnerName({ learner, onOpen }) {
    return (
        <Button
            variant="text"
            onClick={() => onOpen(learner)}
            sx={{
                p: 0,
                minWidth: 0,
                justifyContent: "flex-start",
                textAlign: "left",
                textTransform: "none",
            }}
        >
            <Box>
                <Typography
                    variant="body2"
                    fontWeight={700}
                    color="text.primary"
                >
                    {learner.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {learner.email}
                </Typography>
            </Box>
        </Button>
    );
}

export default function ProgramLearnerRoster({
    students,
    pagination,
    selectedEnrollmentIds,
    onToggle,
    onToggleAll,
    onOpen,
    onAction,
    onPageChange,
    remindersEnabled = false,
}) {
    const visibleIds = students.map((student) => student.enrollmentId);
    const allSelected =
        visibleIds.length > 0 &&
        visibleIds.every((id) => selectedEnrollmentIds.includes(id));
    const someSelected = visibleIds.some((id) =>
        selectedEnrollmentIds.includes(id),
    );

    if (!students.length) {
        return (
            <Card sx={{ p: 5, textAlign: "center" }}>
                <Typography variant="h6">No learners found</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    Adjust your search or add a learner to this course.
                </Typography>
            </Card>
        );
    }

    return (
        <Card>
            <Box sx={{ display: { xs: "none", md: "block" } }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={allSelected}
                                        indeterminate={
                                            someSelected && !allSelected
                                        }
                                        onChange={onToggleAll}
                                        inputProps={{
                                            "aria-label":
                                                "Select visible learners",
                                        }}
                                    />
                                </TableCell>
                                <TableCell>Learner</TableCell>
                                <TableCell>Enrolled</TableCell>
                                <TableCell>Progress</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Last activity</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {students.map((student) => (
                                <TableRow key={student.enrollmentId} hover>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedEnrollmentIds.includes(
                                                student.enrollmentId,
                                            )}
                                            onChange={() =>
                                                onToggle(student.enrollmentId)
                                            }
                                            inputProps={{
                                                "aria-label": `Select ${student.name}`,
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <LearnerName
                                            learner={student}
                                            onOpen={onOpen}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {new Date(
                                            student.enrolledAt,
                                        ).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Progress student={student} />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={statusLabel(student)}
                                            size="small"
                                            color={
                                                statusColors[
                                                    student.learnerState ||
                                                        student.status
                                                ] || "default"
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {student.lastActivity
                                            ? new Date(
                                                  student.lastActivity,
                                              ).toLocaleDateString()
                                            : "No activity"}
                                    </TableCell>
                                    <TableCell align="right">
                                        <LearnerActionsMenu
                                            learner={student}
                                            onAction={onAction}
                                            remindersEnabled={remindersEnabled}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Box sx={{ display: { xs: "block", md: "none" }, p: 1.5 }}>
                <Stack
                    direction="row"
                    sx={{ px: 0.5, pb: 1, alignItems: "center" }}
                >
                    <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected && !allSelected}
                        onChange={onToggleAll}
                        inputProps={{ "aria-label": "Select visible learners" }}
                    />
                    <Typography variant="body2">
                        Select all on this page
                    </Typography>
                </Stack>
                <Stack spacing={1.5}>
                    {students.map((student) => (
                        <Box
                            key={student.enrollmentId}
                            sx={{
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 2,
                                p: 1.5,
                            }}
                        >
                            <Stack
                                direction="row"
                                spacing={1}
                                sx={{ alignItems: "flex-start" }}
                            >
                                <Checkbox
                                    checked={selectedEnrollmentIds.includes(
                                        student.enrollmentId,
                                    )}
                                    onChange={() =>
                                        onToggle(student.enrollmentId)
                                    }
                                    inputProps={{
                                        "aria-label": `Select ${student.name}`,
                                    }}
                                    sx={{ mt: -0.75, ml: -0.75 }}
                                />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <LearnerName
                                        learner={student}
                                        onOpen={onOpen}
                                    />
                                </Box>
                                <LearnerActionsMenu
                                    learner={student}
                                    onAction={onAction}
                                    remindersEnabled={remindersEnabled}
                                />
                            </Stack>
                            <Divider sx={{ my: 1.5 }} />
                            <Stack spacing={1.5}>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{ justifyContent: "space-between" }}
                                >
                                    <Chip
                                        label={statusLabel(student)}
                                        size="small"
                                        color={
                                            statusColors[
                                                student.learnerState ||
                                                    student.status
                                            ] || "default"
                                        }
                                    />
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Last activity:{" "}
                                        {student.lastActivity
                                            ? new Date(
                                                  student.lastActivity,
                                              ).toLocaleDateString()
                                            : "None"}
                                    </Typography>
                                </Stack>
                                <Progress student={student} />
                            </Stack>
                        </Box>
                    ))}
                </Stack>
            </Box>

            {pagination.totalCount > 0 && (
                <TablePagination
                    component="div"
                    count={pagination.totalCount}
                    page={(pagination.page || 1) - 1}
                    rowsPerPage={pagination.perPage || 20}
                    onPageChange={onPageChange}
                    rowsPerPageOptions={[20]}
                />
            )}
        </Card>
    );
}
