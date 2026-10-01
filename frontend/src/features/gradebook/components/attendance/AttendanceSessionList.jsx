import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Stack,
    Typography,
} from "@mui/material";

const formatDateTime = (value) =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));

export default function AttendanceSessionList({
    sessions,
    selectedNodeId,
    onSelect,
}) {
    if (!sessions.length) {
        return (
            <Card variant="outlined">
                <CardContent>
                    <Typography color="text.secondary">
                        Add a Google Meet or in-person lesson to review
                        attendance here.
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Stack spacing={1.5}>
            {sessions.map((session) => {
                const reviewCount =
                    Number(session.attendanceCounts?.needsReview || 0) +
                    Number(session.unmatchedAttendanceCount || 0);
                const selected =
                    String(session.nodeId) === String(selectedNodeId || "");
                return (
                    <Card
                        key={session.id}
                        variant="outlined"
                        sx={{
                            borderColor: selected ? "primary.main" : "divider",
                        }}
                    >
                        <CardContent>
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={2}
                                sx={{
                                    justifyContent: "space-between",
                                    alignItems: {
                                        xs: "stretch",
                                        sm: "center",
                                    },
                                }}
                            >
                                <Box>
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        sx={{
                                            alignItems: "center",
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <Typography fontWeight={700}>
                                            {session.title}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label={
                                                session.kind ===
                                                "in_person_session"
                                                    ? "In person"
                                                    : "Google Meet"
                                            }
                                            color={
                                                session.kind ===
                                                "in_person_session"
                                                    ? "secondary"
                                                    : "primary"
                                            }
                                            variant="outlined"
                                        />
                                        {reviewCount > 0 &&
                                            session.hasEnded && (
                                                <Chip
                                                    size="small"
                                                    color="warning"
                                                    label={`${reviewCount} need review`}
                                                />
                                            )}
                                    </Stack>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mt: 0.5 }}
                                    >
                                        {formatDateTime(session.startsAt)}
                                        {session.sectionTitle
                                            ? ` · ${session.sectionTitle}`
                                            : ""}
                                    </Typography>
                                </Box>
                                <Button
                                    variant={
                                        selected ? "contained" : "outlined"
                                    }
                                    onClick={() => onSelect(session.nodeId)}
                                >
                                    Review attendance
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                );
            })}
        </Stack>
    );
}
