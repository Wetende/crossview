import {
    Alert,
    Button,
    Chip,
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

const statusColor = {
    matched: "success",
    missing: "warning",
    invited: "info",
    conflict: "error",
    removed: "default",
};

export default function RosterPreviewPanel({ preview, onApply, applying }) {
    if (!preview) {
        return null;
    }
    return (
        <Stack spacing={2}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {Object.entries(preview.summary || {}).map(([label, count]) => (
                    <Chip key={label} label={`${label}: ${count}`} />
                ))}
            </Stack>
            {(preview.summary?.conflict || 0) > 0 && (
                <Alert severity="warning">
                    Conflicting identities will not be changed. Resolve them before a
                    later preview.
                </Alert>
            )}
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Email</TableCell>
                            <TableCell>Direction</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Planned action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {(preview.rows || []).map((row, index) => (
                            <TableRow key={`${row.direction}-${row.email}-${index}`}>
                                <TableCell>
                                    <Typography variant="body2">{row.email}</Typography>
                                    {row.name && (
                                        <Typography variant="caption" color="text.secondary">
                                            {row.name}
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>{row.direction.replaceAll("_", " ")}</TableCell>
                                <TableCell>
                                    <Chip
                                        size="small"
                                        label={row.status}
                                        color={statusColor[row.status] || "default"}
                                    />
                                </TableCell>
                                <TableCell>{row.action?.replaceAll("_", " ") || "None"}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Button variant="contained" onClick={onApply} disabled={applying}>
                {applying ? "Applying…" : "Apply safe additions and invitations"}
            </Button>
        </Stack>
    );
}
