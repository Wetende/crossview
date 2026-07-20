import { Link } from "@inertiajs/react";
import {
    Alert,
    Box,
    Button,
    Chip,
    LinearProgress,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import {
    Event as EventIcon,
    LocationOn as LocationIcon,
    PlayArrow as PlayIcon,
    Videocam as MeetingIcon,
} from "@mui/icons-material";

const MODES = {
    self_paced: {
        label: "Self-paced",
        title: "Learn on your schedule",
        description:
            "Continue from where you stopped and keep your learning momentum.",
    },
    live_online: {
        label: "Live online",
        title: "Your live learning schedule",
        description:
            "Join scheduled sessions and use the course materials between classes.",
    },
    blended: {
        label: "Blended",
        title: "Your next learning step",
        description:
            "Balance scheduled sessions with independent online learning.",
    },
    in_person: {
        label: "In person",
        title: "Your class schedule",
        description:
            "Prepare for the next venue session and complete supporting work online.",
    },
};

const sessionDate = (value) =>
    value
        ? new Date(value).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
          })
        : "Schedule pending";

export default function DeliveryOverviewCard({
    program,
    resumeUrl,
    hasStarted,
    progressPercent = 0,
}) {
    const mode = MODES[program?.deliveryMode] || MODES.self_paced;
    const next = program?.nextScheduledSession;
    const recentRecording = program?.recentSessionRecording;
    const isPhysical = next?.kind === "in_person_session";
    const primaryIsSession =
        program?.deliveryMode !== "self_paced" && next?.lessonUrl;

    return (
        <Paper
            variant="outlined"
            sx={{ p: { xs: 2, md: 2.5 }, mb: 2.5, borderRadius: 2 }}
        >
            <Stack spacing={2}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    sx={{
                        justifyContent: "space-between",
                        alignItems: { sm: "center" },
                    }}
                >
                    <Box>
                        <Chip
                            label={mode.label}
                            size="small"
                            color="primary"
                            sx={{ mb: 1 }}
                        />
                        <Typography variant="h6" fontWeight={800}>
                            {mode.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {mode.description}
                        </Typography>
                    </Box>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        {primaryIsSession && (
                            <Button
                                component={Link}
                                href={next.lessonUrl}
                                variant="contained"
                                startIcon={
                                    isPhysical ? (
                                        <LocationIcon />
                                    ) : (
                                        <MeetingIcon />
                                    )
                                }
                            >
                                View next session
                            </Button>
                        )}
                        <Button
                            component={Link}
                            href={resumeUrl || "#"}
                            variant={
                                primaryIsSession ? "outlined" : "contained"
                            }
                            startIcon={<PlayIcon />}
                        >
                            {hasStarted ? "Resume learning" : "Start learning"}
                        </Button>
                    </Stack>
                </Stack>

                <Box>
                    <Stack
                        direction="row"
                        sx={{ justifyContent: "space-between", mb: 0.5 }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            Course progress
                        </Typography>
                        <Typography variant="caption" fontWeight={700}>
                            {Math.round(progressPercent)}%
                        </Typography>
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(Math.max(progressPercent, 0), 100)}
                        aria-label="Course progress"
                        sx={{ height: 6, borderRadius: 999 }}
                    />
                </Box>

                {next && (
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "auto 1fr",
                                sm: "auto 1fr auto",
                            },
                            gap: 1.5,
                            alignItems: "center",
                            p: 1.5,
                            bgcolor: "action.hover",
                            borderRadius: 1.5,
                        }}
                    >
                        {isPhysical ? (
                            <LocationIcon color="primary" />
                        ) : (
                            <EventIcon color="primary" />
                        )}
                        <Box sx={{ minWidth: 0 }}>
                            <Typography fontWeight={700}>
                                {next.title}
                            </Typography>
                            <Typography
                                component="time"
                                dateTime={next.startsAt}
                                variant="body2"
                                color="text.secondary"
                            >
                                {sessionDate(next.startsAt)}
                                {isPhysical && next.venue
                                    ? ` · ${next.venue}`
                                    : ""}
                            </Typography>
                        </Box>
                        <Chip
                            size="small"
                            label={
                                next.provider?.replaceAll("_", " ") ||
                                "Scheduled"
                            }
                            sx={{
                                gridColumn: { xs: "2", sm: "auto" },
                                justifySelf: "start",
                            }}
                        />
                    </Box>
                )}

                {(program?.deliveryReadiness?.warnings || []).map((warning) => (
                    <Alert key={warning} severity="info">
                        {warning}
                    </Alert>
                ))}

                {recentRecording?.recordingUrl && (
                    <Button
                        component="a"
                        href={recentRecording.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="text"
                        sx={{ alignSelf: "flex-start" }}
                    >
                        Watch the latest session recording
                    </Button>
                )}
            </Stack>
        </Paper>
    );
}
