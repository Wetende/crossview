import { useMemo, useState } from "react";
import { Link } from "@inertiajs/react";
import {
    Box,
    Button,
    Chip,
    LinearProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";

import {
    HIGH_DROP_OFF_PERCENT,
    formatCount,
    formatDuration,
    formatPercent,
} from "./format";

const visuallyHidden = {
    border: 0,
    clip: "rect(0 0 0 0)",
    height: 1,
    margin: -1,
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    whiteSpace: "nowrap",
    width: 1,
};

const SORTABLE_COLUMNS = {
    position: "course order",
    completionRate: "completion",
    dropOff: "drop-off",
};

function compareRows(orderBy, order) {
    const direction = order === "asc" ? 1 : -1;
    return (a, b) => {
        const left = a[orderBy] ?? -1;
        const right = b[orderBy] ?? -1;
        if (left === right) return a.position - b.position;
        return left < right ? -direction : direction;
    };
}

function isHighDropOff(value) {
    return (
        value !== null && value !== undefined && value > HIGH_DROP_OFF_PERCENT
    );
}

function SortableHeader({
    column,
    orderBy,
    order,
    onSort,
    children,
    ...props
}) {
    const active = orderBy === column;
    return (
        <TableCell {...props} sortDirection={active ? order : false}>
            <TableSortLabel
                active={active}
                direction={active ? order : "asc"}
                onClick={() => onSort(column)}
                aria-label={`Sort by ${SORTABLE_COLUMNS[column]}`}
            >
                {children}
            </TableSortLabel>
        </TableCell>
    );
}

export function LessonEngagementTable({ lessons, builderUrl }) {
    const [orderBy, setOrderBy] = useState("position");
    const [order, setOrder] = useState("asc");
    const results = lessons?.results;
    const rows = results || [];

    const sortedRows = useMemo(
        () => [...(results || [])].sort(compareRows(orderBy, order)),
        [results, orderBy, order],
    );

    const handleSort = (column) => {
        if (orderBy === column) {
            setOrder(order === "asc" ? "desc" : "asc");
            return;
        }
        setOrderBy(column);
        setOrder(column === "position" ? "asc" : "desc");
    };

    if (!rows.length) {
        return (
            <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography color="textSecondary" sx={{ mb: 2 }}>
                    No published lessons yet.
                </Typography>
                {builderUrl && (
                    <Button
                        component={Link}
                        href={builderUrl}
                        variant="outlined"
                    >
                        Open course builder
                    </Button>
                )}
            </Box>
        );
    }

    return (
        <>
            <TableContainer sx={{ maxHeight: 520 }}>
                <Table stickyHeader size="small" aria-label="Lesson engagement">
                    <TableHead>
                        <TableRow>
                            <SortableHeader
                                column="position"
                                orderBy={orderBy}
                                order={order}
                                onSort={handleSort}
                                sx={{ width: 56 }}
                            >
                                #
                            </SortableHeader>
                            <TableCell>Lesson</TableCell>
                            <TableCell align="right">Started</TableCell>
                            <TableCell align="right">Completed</TableCell>
                            <SortableHeader
                                column="completionRate"
                                orderBy={orderBy}
                                order={order}
                                onSort={handleSort}
                                sx={{ minWidth: 160 }}
                            >
                                Completion
                            </SortableHeader>
                            <SortableHeader
                                column="dropOff"
                                orderBy={orderBy}
                                order={order}
                                onSort={handleSort}
                                align="right"
                            >
                                Drop-off
                            </SortableHeader>
                            <TableCell align="right">Avg. time</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedRows.map((row) => {
                            const highDropOff = isHighDropOff(row.dropOff);
                            return (
                                <TableRow
                                    key={row.id}
                                    hover
                                    sx={
                                        highDropOff
                                            ? {
                                                  bgcolor: (theme) =>
                                                      alpha(
                                                          theme.palette.error
                                                              .main,
                                                          0.06,
                                                      ),
                                              }
                                            : undefined
                                    }
                                >
                                    <TableCell>{row.position}</TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 600 }}
                                        >
                                            {row.title}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="textSecondary"
                                            sx={{ textTransform: "capitalize" }}
                                        >
                                            {String(row.type || "").replace(
                                                /_/g,
                                                " ",
                                            )}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        {formatCount(row.started)}
                                    </TableCell>
                                    <TableCell align="right">
                                        {formatCount(row.completed)}
                                    </TableCell>
                                    <TableCell>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            sx={{ alignItems: "center" }}
                                        >
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min(
                                                    100,
                                                    row.completionRate || 0,
                                                )}
                                                aria-label={`${row.title} completion`}
                                                sx={{
                                                    flex: 1,
                                                    height: 6,
                                                    borderRadius: 3,
                                                }}
                                            />
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    minWidth: 44,
                                                    textAlign: "right",
                                                }}
                                            >
                                                {formatPercent(
                                                    row.completionRate,
                                                )}
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="right">
                                        {highDropOff ? (
                                            <Stack
                                                direction="row"
                                                spacing={0.5}
                                                sx={{
                                                    alignItems: "center",
                                                    justifyContent: "flex-end",
                                                    color: "error.main",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                <TrendingDownOutlinedIcon
                                                    fontSize="small"
                                                    titleAccess="High drop-off"
                                                />
                                                <span>
                                                    {formatPercent(row.dropOff)}
                                                </span>
                                            </Stack>
                                        ) : (
                                            formatPercent(row.dropOff)
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        {formatDuration(row.avgActiveSeconds)}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            {lessons.truncated && (
                <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ mt: 1, display: "block" }}
                >
                    Showing the first {formatCount(rows.length)} of{" "}
                    {formatCount(lessons.total)} lessons.
                </Typography>
            )}
        </>
    );
}

export function AssessmentTable({ assessments = [], gradebookUrl }) {
    if (!assessments.length) {
        return (
            <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography color="textSecondary">
                    No graded quizzes or assignments yet.
                </Typography>
            </Box>
        );
    }

    return (
        <TableContainer>
            <Table size="small" aria-label="Assessment performance">
                <TableHead>
                    <TableRow>
                        <TableCell>Assessment</TableCell>
                        <TableCell align="right">Attempts</TableCell>
                        <TableCell align="right">Learners</TableCell>
                        <TableCell align="right">Pass rate</TableCell>
                        <TableCell align="right">Avg. score</TableCell>
                        <TableCell align="right">Awaiting grading</TableCell>
                        <TableCell align="right">
                            <Box component="span" sx={visuallyHidden}>
                                Actions
                            </Box>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {assessments.map((row) => (
                        <TableRow key={`${row.kind}-${row.id}`} hover>
                            <TableCell>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{ alignItems: "center" }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 600 }}
                                    >
                                        {row.title}
                                    </Typography>
                                    <Chip
                                        label={
                                            row.kind === "quiz"
                                                ? "Quiz"
                                                : "Assignment"
                                        }
                                        size="small"
                                        variant="outlined"
                                    />
                                </Stack>
                            </TableCell>
                            <TableCell align="right">
                                {formatCount(row.attempts)}
                            </TableCell>
                            <TableCell align="right">
                                {formatCount(row.learners)}
                            </TableCell>
                            <TableCell align="right">
                                {formatPercent(row.passRate)}
                            </TableCell>
                            <TableCell align="right">
                                {formatPercent(row.averageScore)}
                            </TableCell>
                            <TableCell align="right">
                                {row.awaitingGrading > 0 ? (
                                    <Chip
                                        label={formatCount(row.awaitingGrading)}
                                        size="small"
                                        color="warning"
                                    />
                                ) : (
                                    formatCount(row.awaitingGrading)
                                )}
                            </TableCell>
                            <TableCell align="right">
                                {(row.url || gradebookUrl) && (
                                    <Button
                                        component={Link}
                                        href={row.url || gradebookUrl}
                                        size="small"
                                    >
                                        {row.url ? "Review" : "Gradebook"}
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
