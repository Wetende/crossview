import {
    Box,
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
import { VisibilityOutlined } from "@mui/icons-material";

const statusColor = (status) => {
    if (status === "Passed") return "success";
    if (status === "Not passed") return "error";
    if (status === "Pending review") return "info";
    return "default";
};

const AttemptStatus = ({ status }) => (
    <Chip
        size="small"
        label={status}
        color={statusColor(status)}
        variant={statusColor(status) === "default" ? "outlined" : "filled"}
        sx={{ fontWeight: 700 }}
    />
);

const AttemptHistory = ({ attempts = [], selectedId, onReview }) => {
    if (attempts.length === 0) return null;

    return (
        <Box component="section" aria-labelledby="attempt-history-title">
            <Typography
                id="attempt-history-title"
                component="h2"
                variant="h6"
                sx={{ mb: 1.5 }}
            >
                Attempt history
            </Typography>

            <Stack spacing={1.25} sx={{ display: { xs: "flex", md: "none" } }}>
                {attempts.map((attempt) => {
                    const selected = attempt.id === selectedId;
                    return (
                        <Paper
                            key={attempt.id}
                            variant="outlined"
                            sx={{
                                p: 2,
                                borderColor: selected
                                    ? "primary.main"
                                    : "divider",
                            }}
                        >
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                spacing={1}
                            >
                                <Box>
                                    <Typography fontWeight={800}>
                                        {attempt.title}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {attempt.submittedAt}
                                    </Typography>
                                </Box>
                                <AttemptStatus status={attempt.status} />
                            </Stack>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(2, minmax(0, 1fr))",
                                    gap: 1.5,
                                    my: 1.5,
                                }}
                            >
                                <Box>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Score
                                    </Typography>
                                    <Typography fontWeight={800}>
                                        {attempt.score}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Points
                                    </Typography>
                                    <Typography fontWeight={800}>
                                        {attempt.points}
                                    </Typography>
                                </Box>
                            </Box>
                            <Button
                                type="button"
                                variant={selected ? "text" : "outlined"}
                                startIcon={<VisibilityOutlined />}
                                onClick={() => onReview(attempt.id)}
                                disabled={selected}
                                fullWidth
                            >
                                {selected
                                    ? "Currently viewing"
                                    : "Review attempt"}
                            </Button>
                        </Paper>
                    );
                })}
            </Stack>

            <Paper
                variant="outlined"
                sx={{ display: { xs: "none", md: "block" } }}
            >
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Attempt</TableCell>
                                <TableCell>Score</TableCell>
                                <TableCell>Points</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Submitted</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {attempts.map((attempt) => {
                                const selected = attempt.id === selectedId;
                                return (
                                    <TableRow
                                        key={attempt.id}
                                        selected={selected}
                                    >
                                        <TableCell>{attempt.title}</TableCell>
                                        <TableCell>{attempt.score}</TableCell>
                                        <TableCell>{attempt.points}</TableCell>
                                        <TableCell>
                                            <AttemptStatus
                                                status={attempt.status}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {attempt.submittedAt}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button
                                                type="button"
                                                size="small"
                                                startIcon={
                                                    <VisibilityOutlined />
                                                }
                                                onClick={() =>
                                                    onReview(attempt.id)
                                                }
                                                disabled={selected}
                                            >
                                                {selected
                                                    ? "Viewing"
                                                    : "Review"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default AttemptHistory;
