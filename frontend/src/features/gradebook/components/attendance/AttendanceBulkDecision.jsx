import { Button, MenuItem, Stack, TextField, Typography } from "@mui/material";

export default function AttendanceBulkDecision({
    selectedCount,
    status,
    reason,
    disabled,
    busy,
    onStatusChange,
    onReasonChange,
    onApply,
}) {
    return (
        <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            sx={{ alignItems: { md: "flex-start" } }}
        >
            <TextField
                select
                size="small"
                label="Attendance decision"
                value={status}
                onChange={(event) => onStatusChange(event.target.value)}
                sx={{ minWidth: 190 }}
            >
                <MenuItem value="present">Present</MenuItem>
                <MenuItem value="absent">Absent</MenuItem>
                <MenuItem value="excused">Excused</MenuItem>
            </TextField>
            <TextField
                size="small"
                label="Audited reason"
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
                required
                fullWidth
                placeholder="Example: Signed class register"
                slotProps={{
                    htmlInput: { "aria-label": "Audited reason" },
                }}
            />
            <Button
                variant="contained"
                disabled={
                    disabled ||
                    busy ||
                    !selectedCount ||
                    !status ||
                    !reason.trim()
                }
                onClick={onApply}
                sx={{ whiteSpace: "nowrap", minHeight: 40 }}
            >
                Mark {selectedCount || 0}
            </Button>
            {disabled && (
                <Typography variant="caption" color="text.secondary">
                    Attendance opens at the scheduled start time.
                </Typography>
            )}
        </Stack>
    );
}
