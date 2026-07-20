import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
    Paper,
    Skeleton,
    Stack,
    Typography,
} from "@mui/material";
import {
    CalendarMonth as CalendarIcon,
    LocationOn as LocationIcon,
    OpenInNew as OpenIcon,
    Videocam as MeetingIcon,
} from "@mui/icons-material";
import DOMPurify from "dompurify";

const PROVIDER_LABELS = {
    google_meet: "Google Meet",
    zoom: "Zoom",
    teams: "Microsoft Teams",
    youtube: "YouTube Live",
    vimeo: "Vimeo",
    custom: "External provider",
    physical: "In person",
};

const countdownText = (milliseconds) => {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days) return `${days}d ${hours}h`;
    if (hours) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

const streamEmbedUrl = (url, provider) => {
    try {
        const parsed = new URL(url);
        if (provider === "youtube") {
            const id =
                parsed.hostname === "youtu.be"
                    ? parsed.pathname.slice(1)
                    : parsed.searchParams.get("v") ||
                      parsed.pathname.match(/\/(?:embed|live)\/([^/]+)/)?.[1];
            return id ? `https://www.youtube.com/embed/${id}` : "";
        }
        if (provider === "vimeo") {
            const id = parsed.pathname.match(/\/(\d+)/)?.[1];
            return id ? `https://player.vimeo.com/video/${id}` : "";
        }
    } catch {
        return "";
    }
    return "";
};

export default function ScheduledSessionRenderer({ session, content = "" }) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 30_000);
        return () => window.clearInterval(timer);
    }, []);

    const start = session?.startsAt ? new Date(session.startsAt) : null;
    const end = session?.endsAt ? new Date(session.endsAt) : null;
    const startsIn = start ? start.getTime() - now : 0;
    const ended = session?.hasEnded || (end && end.getTime() < now);
    const embedUrl = useMemo(
        () => streamEmbedUrl(session?.joinUrl, session?.provider),
        [session?.joinUrl, session?.provider],
    );
    const safeSummary = DOMPurify.sanitize(session?.summary || "");
    const safeContent = DOMPurify.sanitize(content || "");

    if (session === undefined) {
        return (
            <Stack spacing={1} aria-label="Loading scheduled session">
                <Skeleton variant="rounded" height={120} />
                <Skeleton variant="text" width="45%" />
            </Stack>
        );
    }
    if (!session) {
        return (
            <Alert severity="warning">
                This scheduled lesson is not configured yet. Contact your
                instructor.
            </Alert>
        );
    }
    if (session.status === "cancelled") {
        return (
            <Alert severity="info">
                This session was cancelled by the instructor.
            </Alert>
        );
    }

    const isInPerson = session.kind === "in_person_session";
    const isStream = session.kind === "live_stream";
    const stateLabel = ended
        ? session.recordingUrl
            ? "Replay available"
            : "Session ended"
        : session.isJoinable
          ? isStream
              ? "Live now"
              : "Join window open"
          : startsIn > 0
            ? `Starts in ${countdownText(startsIn)}`
            : "Awaiting instructor";

    return (
        <Stack spacing={2.5}>
            {session.providerState === "authorization_required" && (
                <Alert severity="warning">
                    The instructor needs to reconnect this meeting provider.
                    Your course access and other lessons are unaffected.
                </Alert>
            )}
            {session.providerState === "sync_failed" && (
                <Alert severity="info">
                    The latest attendance or recording update is delayed.
                    Available meeting details remain usable.
                </Alert>
            )}
            {!isInPerson && !session.hasJoinDetails && !ended && (
                <Alert severity="warning">
                    The meeting provider has not supplied join details yet.
                    Check again later or contact your instructor.
                </Alert>
            )}
            <Paper
                variant="outlined"
                sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}
            >
                <Stack spacing={2}>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        sx={{
                            justifyContent: "space-between",
                            alignItems: { xs: "flex-start", sm: "center" },
                        }}
                    >
                        <Stack
                            direction="row"
                            spacing={1.5}
                            sx={{ alignItems: "center" }}
                        >
                            {isInPerson ? (
                                <LocationIcon color="primary" />
                            ) : (
                                <MeetingIcon color="primary" />
                            )}
                            <Box>
                                <Typography variant="h6" fontWeight={700}>
                                    {session.title}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {PROVIDER_LABELS[session.provider] ||
                                        session.provider}
                                </Typography>
                            </Box>
                        </Stack>
                        <Chip
                            label={stateLabel}
                            color={session.isJoinable ? "success" : "default"}
                        />
                    </Stack>

                    <Divider />
                    <Stack spacing={0.5}>
                        <Typography>
                            <strong>Starts:</strong>{" "}
                            {start?.toLocaleString(undefined, {
                                timeZoneName: "short",
                            })}
                        </Typography>
                        <Typography>
                            <strong>Ends:</strong>{" "}
                            {end?.toLocaleString(undefined, {
                                timeZoneName: "short",
                            })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Scheduled in {session.timezone}; displayed in your
                            local time.
                        </Typography>
                    </Stack>

                    {isInPerson && (
                        <Stack spacing={0.5}>
                            <Typography fontWeight={700}>
                                {session.venue}
                            </Typography>
                            {session.room && (
                                <Typography>{session.room}</Typography>
                            )}
                            <Typography>{session.address}</Typography>
                            {session.directions && (
                                <Typography color="text.secondary">
                                    {session.directions}
                                </Typography>
                            )}
                        </Stack>
                    )}

                    {session.attendanceInstructions && (
                        <Alert severity="info">
                            {session.attendanceInstructions}
                        </Alert>
                    )}

                    {ended && session.attendance && (
                        <Typography variant="body2">
                            Attendance:{" "}
                            <strong>{session.attendance.status}</strong>
                        </Typography>
                    )}

                    {session.passcode && (
                        <Typography variant="body2">
                            Meeting passcode:{" "}
                            <strong>{session.passcode}</strong>
                        </Typography>
                    )}

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        {session.isJoinable && !isInPerson && (
                            <Button
                                variant="contained"
                                href={session.joinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                endIcon={<OpenIcon />}
                            >
                                {isStream ? "Watch live" : "Join meeting"}
                            </Button>
                        )}
                        {ended && session.recordingUrl && (
                            <Button
                                variant="contained"
                                href={session.recordingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                endIcon={<OpenIcon />}
                            >
                                Watch recording
                            </Button>
                        )}
                        {session.calendarUrl && !ended && (
                            <Button
                                variant="outlined"
                                href={session.calendarUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                startIcon={<CalendarIcon />}
                            >
                                Add to calendar
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </Paper>

            {isStream && session.isJoinable && embedUrl && (
                <Box
                    sx={{
                        position: "relative",
                        pt: "56.25%",
                        bgcolor: "black",
                        borderRadius: 2,
                        overflow: "hidden",
                    }}
                >
                    <iframe
                        src={embedUrl}
                        title={`${session.title} live stream`}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            border: 0,
                        }}
                    />
                </Box>
            )}

            {(safeSummary || safeContent) && (
                <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
                    {safeSummary && (
                        <Box
                            dangerouslySetInnerHTML={{ __html: safeSummary }}
                        />
                    )}
                    {safeContent && (
                        <Box
                            sx={{ mt: safeSummary ? 2 : 0 }}
                            dangerouslySetInnerHTML={{ __html: safeContent }}
                        />
                    )}
                </Paper>
            )}
        </Stack>
    );
}
