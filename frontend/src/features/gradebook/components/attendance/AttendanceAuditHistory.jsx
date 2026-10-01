import { useState } from "react";
import { Button, Collapse, Stack, Typography } from "@mui/material";

const formatDateTime = (value) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));

export default function AttendanceAuditHistory({ entries = [] }) {
    const [open, setOpen] = useState(false);
    if (!entries.length) return null;
    return (
        <Stack spacing={0.75} sx={{ alignItems: "flex-start" }}>
            <Button size="small" onClick={() => setOpen((value) => !value)}>
                {open ? "Hide" : "Show"} audit history ({entries.length})
            </Button>
            <Collapse in={open}>
                <Stack spacing={0.75} sx={{ pl: 1 }}>
                    {entries.map((entry, index) => (
                        <Typography
                            key={`${entry.createdAt}-${index}`}
                            variant="caption"
                            color="text.secondary"
                        >
                            {entry.actor}: {entry.previousStatus || "pending"} →{" "}
                            {entry.resultingStatus}. {entry.reason} ·{" "}
                            {formatDateTime(entry.createdAt)}
                        </Typography>
                    ))}
                </Stack>
            </Collapse>
        </Stack>
    );
}
