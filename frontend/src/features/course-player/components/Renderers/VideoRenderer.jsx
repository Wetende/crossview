import { useState, useCallback, useRef, useEffect } from "react";
import { Box, Paper, Typography, LinearProgress, Stack } from "@mui/material";
import LazyReactPlayer from "@/components/LazyReactPlayer";
import {
    createActivitySessionId,
    recordActivityProgress,
} from "../../api/activityProgressApi";

/**
 * VideoRenderer - Video player with optional progress requirements
 *
 * Features:
 * - Plays videos from various sources (YouTube, Vimeo, direct URLs)
 * - Counts continuous viewing only; skipped-ahead parts do not count
 * - Shows progress indicator when requirement is set
 * - Fires onRequirementMet callback when threshold reached
 */
const VideoRenderer = ({
    url,
    onEnded,
    onProgress,
    requiredProgress = 0, // 0-100, percentage required to complete
    onRequirementMet, // Called when required % is reached
    enrollmentId,
    nodeId,
    activityProgress = {},
    seekRef = null, // Receives a (seconds) => void seek function
}) => {
    const [durationSeconds, setDurationSeconds] = useState(0);
    const [watchedSeconds, setWatchedSeconds] = useState(0);
    const [requirementMet, setRequirementMet] = useState(false);
    const [skippedAhead, setSkippedAhead] = useState(false);
    const playerRef = useRef(null);
    const hasPlayedRef = useRef(false);
    const requirementMetRef = useRef(false);
    const lastPlayedSecondsRef = useRef(null);
    const watchedSecondsRef = useRef(0);
    const sequenceRef = useRef(0);
    const sessionIdRef = useRef(createActivitySessionId());
    const lastEvidenceSentAtRef = useRef(0);
    const [serverProgress, setServerProgress] = useState(activityProgress);
    const trackingEnabled = Boolean(enrollmentId && nodeId);

    useEffect(() => {
        setDurationSeconds(0);
        setWatchedSeconds(0);
        watchedSecondsRef.current = 0;
        setRequirementMet(false);
        requirementMetRef.current = false;
        setSkippedAhead(false);
        hasPlayedRef.current = false;
        lastPlayedSecondsRef.current = null;
        sequenceRef.current = 0;
        sessionIdRef.current = createActivitySessionId();
        lastEvidenceSentAtRef.current = 0;
        setServerProgress({
            progressPercent: activityProgress?.progressPercent || 0,
        });
    }, [url, requiredProgress, nodeId, activityProgress?.progressPercent]);

    const watchedPercent = (() => {
        if (trackingEnabled) return serverProgress?.progressPercent || 0;
        if (!durationSeconds || durationSeconds <= 0) return 0;
        return Math.min(
            100,
            Math.round((watchedSeconds / durationSeconds) * 100),
        );
    })();

    const sendEvidence = useCallback(
        async (eventType, positionSeconds, reportedDuration) => {
            if (!trackingEnabled) return;
            try {
                const result = await recordActivityProgress(
                    enrollmentId,
                    nodeId,
                    {
                        eventType,
                        sessionId: sessionIdRef.current,
                        sequence: ++sequenceRef.current,
                        positionSeconds,
                        durationSeconds:
                            Math.round(reportedDuration || 0) || undefined,
                    },
                );
                setServerProgress(result);
                if (result.isCompleted && !requirementMetRef.current) {
                    requirementMetRef.current = true;
                    setRequirementMet(true);
                    onRequirementMet?.();
                }
            } catch {
                // Progress is retried on the next ordered player event.
            }
        },
        [enrollmentId, nodeId, onRequirementMet, trackingEnabled],
    );

    const handleDurationChange = useCallback((event) => {
        // ReactPlayer can re-fire duration; keep latest non-zero.
        const seconds = event?.currentTarget?.duration;
        if (typeof seconds === "number" && seconds > 0)
            setDurationSeconds(seconds);
    }, []);

    const handleProgress = useCallback(
        (state) => {
            // Count "watched" time based on playedSeconds deltas.
            // This makes requiredProgress harder to bypass via seeking.
            const playedSeconds =
                typeof state.playedSeconds === "number"
                    ? state.playedSeconds
                    : null;
            if (playedSeconds !== null) {
                const last = lastPlayedSecondsRef.current;
                lastPlayedSecondsRef.current = playedSeconds;

                if (typeof last === "number") {
                    const delta = playedSeconds - last;
                    // Ignore large forward jumps (seeks). Accept normal playback deltas.
                    if (delta > 0 && delta <= 10) {
                        watchedSecondsRef.current += delta;
                        setWatchedSeconds(watchedSecondsRef.current);
                    } else if (delta > 10 && hasPlayedRef.current) {
                        // Resume seeks happen before playback, so only a
                        // jump after play counts as skipping ahead.
                        setSkippedAhead(true);
                    }
                }
            }

            // Check if requirement met using watched percent (not just seek position).
            const localWatchedPercent = (() => {
                if (!durationSeconds || durationSeconds <= 0) return 0;
                return Math.min(
                    100,
                    Math.round(
                        (watchedSecondsRef.current / durationSeconds) * 100,
                    ),
                );
            })();

            if (
                requiredProgress > 0 &&
                localWatchedPercent >= requiredProgress &&
                !requirementMetRef.current
            ) {
                requirementMetRef.current = true;
                setRequirementMet(true);
                onRequirementMet?.();
            }

            // Forward progress event
            onProgress?.(state);

            const now = Date.now();
            if (
                trackingEnabled &&
                playedSeconds !== null &&
                now - lastEvidenceSentAtRef.current >= 5000
            ) {
                lastEvidenceSentAtRef.current = now;
                void sendEvidence("playback", playedSeconds, durationSeconds);
            }
        },
        [
            requiredProgress,
            onProgress,
            onRequirementMet,
            durationSeconds,
            sendEvidence,
            trackingEnabled,
        ],
    );

    // Seek only once metadata is known (ReactPlayer v3 fires onReady at
    // loadstart, too early) and only while the media is still at the start,
    // so playback in progress is never pulled back.
    const applyResume = useCallback(
        (media) => {
            const resume = Number(activityProgress?.resumePositionSeconds || 0);
            if (resume > 0 && media && media.currentTime < 1)
                media.currentTime = resume;
        },
        [activityProgress?.resumePositionSeconds],
    );

    // Let the notes panel jump to a saved timestamp. ReactPlayer v3 exposes
    // the media element, so seek by setting currentTime (as resume does).
    useEffect(() => {
        if (!seekRef) return undefined;
        const seek = (seconds) => {
            const media = playerRef.current;
            const target = Number(seconds);
            if (!media || !Number.isFinite(target) || target < 0) return;
            media.currentTime = target;
        };
        seekRef.current = seek;
        return () => {
            if (seekRef.current === seek) seekRef.current = null;
        };
    }, [seekRef]);

    const handleLoadedMetadata = useCallback(
        (event) => applyResume(event?.currentTarget),
        [applyResume],
    );

    // A cached file can load its metadata before React delivers the event to
    // the lazily committed player, so also resume from the ready state.
    const setPlayerRef = useCallback(
        (media) => {
            playerRef.current = media;
            if (media?.readyState >= 1) applyResume(media);
        },
        [applyResume],
    );

    // ReactPlayer v3 emits media events; adapt them to the { played,
    // playedSeconds } progress state the tracking logic and callers use.
    const handleTimeUpdate = useCallback(
        (event) => {
            const media = event?.currentTarget;
            if (typeof media?.currentTime !== "number") return;
            const duration =
                media.duration > 0 ? media.duration : durationSeconds;
            handleProgress({
                played: duration > 0 ? media.currentTime / duration : 0,
                playedSeconds: media.currentTime,
            });
        },
        [durationSeconds, handleProgress],
    );

    const handleEnded = useCallback(() => {
        const position = playerRef.current?.currentTime || durationSeconds;
        void sendEvidence("ended", position, durationSeconds);
        // Only auto-complete on end if no requirement, or if the requirement is met.
        if (requiredProgress > 0 && !requirementMetRef.current) return;
        requirementMetRef.current = true;
        setRequirementMet(true);
        onEnded?.();
    }, [durationSeconds, onEnded, requiredProgress, sendEvidence]);

    const showProgressBar = requiredProgress > 0;
    const isComplete = requirementMet || Boolean(activityProgress?.isCompleted);

    return (
        <Box>
            <Paper
                elevation={3}
                sx={{
                    overflow: "hidden",
                    borderRadius: 3,
                    bgcolor: "black",
                    position: "relative",
                    pt: "56.25%", // 16:9 Aspect Ratio
                }}
            >
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                    }}
                >
                    <LazyReactPlayer
                        ref={setPlayerRef}
                        src={url}
                        width="100%"
                        height="100%"
                        controls={true}
                        onEnded={handleEnded}
                        onPlay={() => {
                            hasPlayedRef.current = true;
                        }}
                        onPause={() => {
                            const position =
                                playerRef.current?.currentTime || 0;
                            void sendEvidence(
                                "pause",
                                position,
                                durationSeconds,
                            );
                        }}
                        onLoadedMetadata={handleLoadedMetadata}
                        onDurationChange={handleDurationChange}
                        onTimeUpdate={handleTimeUpdate}
                    />
                </Box>
            </Paper>

            {/* Progress indicator for required viewing */}
            {showProgressBar && (
                <Box sx={{ mt: 1.5, px: 0.5 }}>
                    <Stack
                        direction="row"
                        sx={{
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.5,
                        }}
                    >
                        {isComplete ? (
                            <Typography
                                variant="caption"
                                sx={{ color: "success.main", fontWeight: 700 }}
                            >
                                <span aria-hidden="true">✓ </span>
                                Watched: lesson complete
                            </Typography>
                        ) : (
                            <>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "text.primary",
                                        fontWeight: 600,
                                    }}
                                >
                                    {watchedPercent}% watched
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{ color: "text.secondary" }}
                                >
                                    Watch {requiredProgress}% to complete
                                </Typography>
                            </>
                        )}
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={watchedPercent}
                        aria-label={`${watchedPercent}% of video watched`}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: "grey.200",
                            "& .MuiLinearProgress-bar": {
                                borderRadius: 3,
                                bgcolor: isComplete
                                    ? "success.main"
                                    : "primary.main",
                            },
                        }}
                    />
                    {/* Requirement threshold marker */}
                    {requiredProgress > 0 && requiredProgress < 100 && (
                        <Box
                            sx={{
                                position: "relative",
                                mt: -0.75,
                                ml: `${requiredProgress}%`,
                                width: 2,
                                height: 10,
                                bgcolor: "warning.main",
                                borderRadius: 1,
                            }}
                        />
                    )}
                    {skippedAhead && !isComplete && (
                        <Typography
                            variant="caption"
                            sx={{
                                display: "block",
                                mt: 0.75,
                                color: "text.secondary",
                            }}
                        >
                            Skipped parts don&apos;t count toward the{" "}
                            {requiredProgress}%.
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default VideoRenderer;
