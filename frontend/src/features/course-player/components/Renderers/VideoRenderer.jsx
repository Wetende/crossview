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
 * - Tracks highest watched position (handles seeking)
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
}) => {
    const [highestProgress, setHighestProgress] = useState(0);
    const [currentProgress, setCurrentProgress] = useState(0);
    const [durationSeconds, setDurationSeconds] = useState(0);
    const [watchedSeconds, setWatchedSeconds] = useState(0);
    const [requirementMet, setRequirementMet] = useState(false);
    const playerRef = useRef(null);
    const requirementMetRef = useRef(false);
    const lastPlayedSecondsRef = useRef(null);
    const watchedSecondsRef = useRef(0);
    const sequenceRef = useRef(0);
    const sessionIdRef = useRef(createActivitySessionId());
    const lastEvidenceSentAtRef = useRef(0);
    const [serverProgress, setServerProgress] = useState(activityProgress);
    const trackingEnabled = Boolean(enrollmentId && nodeId);

    useEffect(() => {
        setHighestProgress(0);
        setCurrentProgress(0);
        setDurationSeconds(0);
        setWatchedSeconds(0);
        watchedSecondsRef.current = 0;
        setRequirementMet(false);
        requirementMetRef.current = false;
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

    const handleDuration = useCallback((seconds) => {
        // ReactPlayer can re-fire duration; keep latest non-zero.
        if (typeof seconds === "number" && seconds > 0)
            setDurationSeconds(seconds);
    }, []);

    const handleProgress = useCallback(
        (state) => {
            const played = Math.round(state.played * 100);
            setCurrentProgress(played);

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
                    }
                }
            }

            // Track highest position reached (prevents skipping ahead)
            if (played > highestProgress) {
                setHighestProgress(played);
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
            highestProgress,
            requiredProgress,
            onProgress,
            onRequirementMet,
            durationSeconds,
            sendEvidence,
            trackingEnabled,
        ],
    );

    const handleEnded = useCallback(() => {
        setHighestProgress(100);
        const position =
            playerRef.current?.getCurrentTime?.() || durationSeconds;
        void sendEvidence("ended", position, durationSeconds);
        // Only auto-complete on end if no requirement, or if the requirement is met.
        if (requiredProgress > 0 && !requirementMetRef.current) return;
        requirementMetRef.current = true;
        setRequirementMet(true);
        onEnded?.();
    }, [durationSeconds, onEnded, requiredProgress, sendEvidence]);

    const showProgressBar = requiredProgress > 0;

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
                        ref={playerRef}
                        url={url}
                        width="100%"
                        height="100%"
                        controls={true}
                        onEnded={handleEnded}
                        onPause={() => {
                            const position =
                                playerRef.current?.getCurrentTime?.() || 0;
                            void sendEvidence(
                                "pause",
                                position,
                                durationSeconds,
                            );
                        }}
                        onReady={() => {
                            const resume = Number(
                                activityProgress?.resumePositionSeconds || 0,
                            );
                            if (resume > 0)
                                playerRef.current?.seekTo?.(resume, "seconds");
                        }}
                        onDuration={handleDuration}
                        onProgress={handleProgress}
                        progressInterval={1000}
                        config={{
                            youtube: {
                                playerVars: { showinfo: 0, modestbranding: 1 },
                            },
                        }}
                    />
                </Box>
            </Paper>

            {/* Progress indicator for required viewing */}
            {showProgressBar && (
                <Box sx={{ mt: 1.5, px: 0.5 }}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 0.5 }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            Watched: {watchedPercent}% (seeked to{" "}
                            {highestProgress}%, now {currentProgress}%)
                            {requiredProgress > 0 &&
                                ` (${requiredProgress}% required)`}
                        </Typography>
                        {requirementMet && (
                            <Typography
                                variant="caption"
                                color="success.main"
                                fontWeight="bold"
                                aria-label="Requirement met"
                            >
                                ✓
                            </Typography>
                        )}
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={watchedPercent}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: "grey.200",
                            "& .MuiLinearProgress-bar": {
                                borderRadius: 3,
                                bgcolor: requirementMet
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
                </Box>
            )}
        </Box>
    );
};

export default VideoRenderer;
