import {
    Box,
    Checkbox,
    Chip,
    FormControlLabel,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";

import AttendanceAuditHistory from "./AttendanceAuditHistory";

const statusColor = {
    present: "success",
    absent: "error",
    excused: "info",
    pending: "warning",
    "needs-review": "warning",
};

const statusLabel = {
    present: "Present",
    absent: "Absent",
    excused: "Excused",
    pending: "Pending",
    "needs-review": "Needs review",
};

const sourceLabel = {
    provider: "Google Meet",
    instructor_override: "Instructor",
    import: "Imported",
};

const durationLabel = (seconds = 0) => {
    const minutes = Math.floor(Number(seconds) / 60);
    const remainder = Number(seconds) % 60;
    if (!minutes) return `${remainder} sec`;
    return `${minutes} min${remainder ? ` ${remainder} sec` : ""}`;
};

export default function AttendanceRosterReview({
    rows,
    session,
    selectable,
    selectedIds,
    onToggle,
    onToggleAll,
}) {
    const physical = session.kind === "in_person_session";
    const allSelected =
        rows.length > 0 &&
        rows.every((row) => selectedIds.includes(row.enrollmentId));
    return (
        <Stack spacing={1}>
            {selectable && (
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={allSelected}
                            onChange={onToggleAll}
                        />
                    }
                    label={`Select all ${rows.length} learners`}
                />
            )}
            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            {selectable && <TableCell padding="checkbox" />}
                            <TableCell>Learner</TableCell>
                            <TableCell>Status</TableCell>
                            {!physical && <TableCell>Verified time</TableCell>}
                            <TableCell>Source</TableCell>
                            <TableCell>Audit</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => {
                            const status =
                                row.status === "pending" && session.hasEnded
                                    ? "needs-review"
                                    : row.status;
                            return (
                                <TableRow key={row.enrollmentId} hover>
                                    {selectable && (
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedIds.includes(
                                                    row.enrollmentId,
                                                )}
                                                onChange={() =>
                                                    onToggle(row.enrollmentId)
                                                }
                                                slotProps={{
                                                    input: {
                                                        "aria-label": `Select ${row.learner.name}`,
                                                    },
                                                }}
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                        >
                                            {row.learner.name}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {row.learner.email}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={
                                                statusLabel[status] || status
                                            }
                                            color={
                                                statusColor[status] || "default"
                                            }
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    {!physical && (
                                        <TableCell>
                                            <Box>
                                                {durationLabel(
                                                    row.attendedSeconds,
                                                )}
                                            </Box>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {row.attendancePercent}%
                                            </Typography>
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        {sourceLabel[row.source] ||
                                            "Not reviewed"}
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 220 }}>
                                        <AttendanceAuditHistory
                                            entries={row.auditHistory}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Stack>
    );
}
