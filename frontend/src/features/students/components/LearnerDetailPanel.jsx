import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Drawer,
    IconButton,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    Stack,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import {
    Close as CloseIcon,
    MessageOutlined as MessageIcon,
} from "@mui/icons-material";

import { ACTION_LABELS, getLearnerActions } from "./learnerActions";

const apiUrl = (programId, enrollmentId) =>
    `/api/learning-operations/programs/${programId}/learners/${enrollmentId}/`;

const readable = (value) => String(value || "—").replaceAll("_", " ");
const dateTime = (value, fallback = "Not recorded") =>
    value ? new Date(value).toLocaleString() : fallback;

function DetailField({ label, children }) {
    return (
        <Box>
            <Typography variant="caption" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
                {children}
            </Typography>
        </Box>
    );
}

function Section({ title, children }) {
    return (
        <Box
            component="section"
            aria-labelledby={`learner-panel-${title.replaceAll(" ", "-")}`}
        >
            <Typography
                id={`learner-panel-${title.replaceAll(" ", "-")}`}
                variant="subtitle1"
                fontWeight={700}
                sx={{ mb: 1 }}
            >
                {title}
            </Typography>
            {children}
        </Box>
    );
}

export default function LearnerDetailPanel({
    open,
    learner,
    programId,
    onClose,
    onAction,
    remindersEnabled = false,
}) {
    const theme = useTheme();
    const mobile = useMediaQuery(theme.breakpoints.down("md"));
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [loadingMore, setLoadingMore] = useState(false);

    const load = async () => {
        if (!learner?.enrollmentId) return;
        setLoading(true);
        setError("");
        try {
            const { data } = await axios.get(
                apiUrl(programId, learner.enrollmentId),
            );
            setDetail(data);
        } catch (requestError) {
            setError(
                requestError?.response?.data?.detail ||
                    "Learner details could not be loaded.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!open) return;
        setDetail(null);
        load();
        // The enrollment identifier is the stable identity for the open panel.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, learner?.enrollmentId, programId]);

    const loadMore = async () => {
        const pagination = detail?.curriculumProgress?.pagination;
        if (!pagination?.hasMore) return;
        setLoadingMore(true);
        try {
            const { data } = await axios.get(
                apiUrl(programId, learner.enrollmentId),
                {
                    params: {
                        curriculumOffset: pagination.offset + pagination.limit,
                        curriculumLimit: pagination.limit,
                    },
                },
            );
            setDetail((current) => ({
                ...current,
                curriculumProgress: {
                    results: [
                        ...(current.curriculumProgress?.results || []),
                        ...(data.curriculumProgress?.results || []),
                    ],
                    pagination: data.curriculumProgress.pagination,
                },
            }));
        } catch (requestError) {
            setError(
                requestError?.response?.data?.detail ||
                    "More curriculum progress could not be loaded.",
            );
        } finally {
            setLoadingMore(false);
        }
    };

    const visibleActions = useMemo(
        () =>
            getLearnerActions(detail || learner, { remindersEnabled }).filter(
                (action) => action !== "view",
            ),
        [detail, learner, remindersEnabled],
    );

    const content = detail || learner;

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            ModalProps={{ keepMounted: true }}
            slotProps={{
                paper: {
                    component: "div",
                    role: "dialog",
                    "aria-modal": true,
                    "aria-labelledby": "learner-detail-title",
                    onKeyDown: (event) => {
                        if (event.key === "Escape") onClose();
                    },
                    sx: {
                        width: { xs: "100%", md: 560 },
                        maxWidth: "100%",
                    },
                },
            }}
        >
            <Stack sx={{ height: "100%" }}>
                <Box
                    sx={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        bgcolor: "background.paper",
                        px: { xs: 2, sm: 3 },
                        py: 2,
                        borderBottom: 1,
                        borderColor: "divider",
                    }}
                >
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "flex-start" }}
                    >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                                id="learner-detail-title"
                                variant="h5"
                                fontWeight={700}
                                noWrap={!mobile}
                            >
                                {content?.name || "Learner details"}
                            </Typography>
                            <Typography color="text.secondary" variant="body2">
                                {content?.email}
                            </Typography>
                        </Box>
                        <IconButton
                            onClick={onClose}
                            aria-label="Close learner details"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </Box>

                <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 2, sm: 3 } }}>
                    {loading ? (
                        <Stack spacing={2} sx={{ py: 8, alignItems: "center" }}>
                            <CircularProgress aria-label="Loading learner details" />
                            <Typography color="text.secondary">
                                Loading learner details…
                            </Typography>
                        </Stack>
                    ) : error && !detail ? (
                        <Alert
                            severity="error"
                            action={<Button onClick={load}>Retry</Button>}
                        >
                            {error}
                        </Alert>
                    ) : (
                        <Stack spacing={3}>
                            {error && <Alert severity="error">{error}</Alert>}

                            {detail?.attention ? (
                                <Alert
                                    severity={
                                        detail.attention.severity || "warning"
                                    }
                                >
                                    <Typography
                                        fontWeight={700}
                                        variant="body2"
                                    >
                                        {detail.attention.title}
                                    </Typography>
                                    {detail.attention.message}
                                </Alert>
                            ) : (
                                <Alert severity="success">
                                    No urgent learner attention is required.
                                </Alert>
                            )}

                            <Section title="Learning overview">
                                <Stack spacing={2}>
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        useFlexGap
                                        sx={{ flexWrap: "wrap" }}
                                    >
                                        <Chip
                                            label={`Access: ${readable(detail?.status)}`}
                                        />
                                        <Chip
                                            label={`Learning: ${readable(detail?.learnerState)}`}
                                        />
                                    </Stack>
                                    <Box>
                                        <Stack
                                            direction="row"
                                            sx={{
                                                justifyContent: "space-between",
                                            }}
                                        >
                                            <Typography variant="body2">
                                                Progress
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                fontWeight={700}
                                            >
                                                {detail?.progressPercent || 0}%
                                            </Typography>
                                        </Stack>
                                        <LinearProgress
                                            variant="determinate"
                                            value={detail?.progressPercent || 0}
                                            sx={{
                                                mt: 0.75,
                                                height: 8,
                                                borderRadius: 4,
                                            }}
                                        />
                                    </Box>
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={2}
                                        useFlexGap
                                    >
                                        <DetailField label="Completed lessons">
                                            {detail?.completedNodes || 0} of{" "}
                                            {detail?.totalNodes || 0}
                                        </DetailField>
                                        <DetailField label="Current position">
                                            {detail?.currentPosition?.title ||
                                                "Course complete or not set"}
                                        </DetailField>
                                    </Stack>
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={2}
                                        useFlexGap
                                    >
                                        <DetailField label="Last activity">
                                            {dateTime(
                                                detail?.lastActivity,
                                                "No activity",
                                            )}
                                        </DetailField>
                                        <DetailField label="Enrolled">
                                            {dateTime(detail?.enrolledAt)}
                                        </DetailField>
                                        <DetailField label="Access expires">
                                            {dateTime(
                                                detail?.expiresAt,
                                                "No expiry",
                                            )}
                                        </DetailField>
                                    </Stack>
                                </Stack>
                            </Section>

                            <Divider />
                            <Section title="Upcoming deadlines">
                                {detail?.upcomingDeadlines?.length ? (
                                    <List disablePadding>
                                        {detail.upcomingDeadlines.map(
                                            (item) => (
                                                <ListItem
                                                    key={`${item.type}-${item.id}`}
                                                    disableGutters
                                                >
                                                    <ListItemText
                                                        primary={item.title}
                                                        secondary={dateTime(
                                                            item.dueAt,
                                                        )}
                                                    />
                                                </ListItem>
                                            ),
                                        )}
                                    </List>
                                ) : (
                                    <Typography
                                        color="text.secondary"
                                        variant="body2"
                                    >
                                        No upcoming deadlines.
                                    </Typography>
                                )}
                            </Section>

                            <Divider />
                            <Section title="Published grades and feedback">
                                {detail?.publishedGrades?.length ? (
                                    <List disablePadding>
                                        {detail.publishedGrades.map((grade) => (
                                            <ListItem
                                                key={`${grade.type}-${grade.id}`}
                                                disableGutters
                                            >
                                                <ListItemText
                                                    primary={grade.title}
                                                    secondary={[
                                                        grade.score != null
                                                            ? `${grade.score}%`
                                                            : null,
                                                        grade.status,
                                                        grade.letterGrade,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" · ")}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography
                                        color="text.secondary"
                                        variant="body2"
                                    >
                                        No published grades yet.
                                    </Typography>
                                )}
                                {(detail?.feedback || []).map((item) => (
                                    <Alert
                                        key={item.id}
                                        severity="info"
                                        sx={{ mt: 1 }}
                                    >
                                        <strong>{item.title}:</strong>{" "}
                                        {item.message}
                                    </Alert>
                                ))}
                            </Section>

                            <Divider />
                            <Section title="Recent activity">
                                {detail?.recentActivity?.length ? (
                                    <List disablePadding>
                                        {detail.recentActivity.map(
                                            (item, index) => (
                                                <ListItem
                                                    key={`${item.occurredAt}-${index}`}
                                                    disableGutters
                                                >
                                                    <ListItemText
                                                        primary={item.title}
                                                        secondary={`${item.detail} · ${dateTime(item.occurredAt)}`}
                                                    />
                                                </ListItem>
                                            ),
                                        )}
                                    </List>
                                ) : (
                                    <Typography
                                        color="text.secondary"
                                        variant="body2"
                                    >
                                        No learning activity recorded.
                                    </Typography>
                                )}
                            </Section>

                            <Divider />
                            <Section title="Curriculum progress">
                                <List disablePadding>
                                    {(
                                        detail?.curriculumProgress?.results ||
                                        []
                                    ).map((node) => (
                                        <ListItem
                                            key={node.nodeId}
                                            disableGutters
                                        >
                                            <ListItemText
                                                primary={node.title}
                                                secondary={
                                                    node.completed
                                                        ? `Completed ${dateTime(node.completedAt)}`
                                                        : "Not complete"
                                                }
                                            />
                                            <Chip
                                                size="small"
                                                color={
                                                    node.completed
                                                        ? "success"
                                                        : "default"
                                                }
                                                label={
                                                    node.completed
                                                        ? "Completed"
                                                        : "Not complete"
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                                {detail?.curriculumProgress?.pagination
                                    ?.hasMore && (
                                    <Button
                                        onClick={loadMore}
                                        disabled={loadingMore}
                                        sx={{ mt: 1 }}
                                    >
                                        {loadingMore ? "Loading…" : "Load more"}
                                    </Button>
                                )}
                            </Section>
                        </Stack>
                    )}
                </Box>

                {!loading && detail && (
                    <Box
                        sx={{
                            position: "sticky",
                            bottom: 0,
                            zIndex: 2,
                            bgcolor: "background.paper",
                            px: { xs: 2, sm: 3 },
                            py: 1.5,
                            borderTop: 1,
                            borderColor: "divider",
                        }}
                    >
                        <Stack
                            direction="row"
                            spacing={1}
                            sx={{ overflowX: "auto" }}
                        >
                            {visibleActions.map((action) => (
                                <Button
                                    key={action}
                                    variant={
                                        action === "message"
                                            ? "contained"
                                            : "outlined"
                                    }
                                    startIcon={
                                        action === "message" ? (
                                            <MessageIcon />
                                        ) : undefined
                                    }
                                    color={
                                        action === "withdraw"
                                            ? "error"
                                            : "primary"
                                    }
                                    onClick={() => onAction(action, detail)}
                                    sx={{ whiteSpace: "nowrap" }}
                                >
                                    {ACTION_LABELS[action]}
                                </Button>
                            ))}
                        </Stack>
                    </Box>
                )}
            </Stack>
        </Drawer>
    );
}
