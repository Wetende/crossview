import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, LinearProgress, Paper, Typography } from "@mui/material";
import {
    createActivitySessionId,
    recordActivityProgress,
} from "../../api/activityProgressApi";

export default function AudioRenderer({
    url,
    enrollmentId,
    nodeId,
    activityProgress = {},
    onRequirementMet,
}) {
    const audioRef = useRef(null);
    const sessionIdRef = useRef(createActivitySessionId());
    const sequenceRef = useRef(0);
    const lastSentRef = useRef(0);
    const [progress, setProgress] = useState(activityProgress);
    const [error, setError] = useState("");

    useEffect(() => {
        const audio = audioRef.current;
        const resume = Number(activityProgress?.resumePositionSeconds || 0);
        if (audio && resume > 0) audio.currentTime = resume;
    }, [activityProgress?.resumePositionSeconds, url]);

    const sendEvidence = useCallback(
        async (eventType) => {
            const audio = audioRef.current;
            if (!audio || !enrollmentId || !nodeId) return;
            try {
                const result = await recordActivityProgress(
                    enrollmentId,
                    nodeId,
                    {
                        eventType,
                        sessionId: sessionIdRef.current,
                        sequence: ++sequenceRef.current,
                        positionSeconds: audio.currentTime,
                        durationSeconds:
                            Math.round(audio.duration || 0) || undefined,
                    },
                );
                setProgress(result);
                setError("");
                if (result.isCompleted) onRequirementMet?.();
            } catch (requestError) {
                setError(requestError.message);
            }
        },
        [enrollmentId, nodeId, onRequirementMet],
    );

    const handleTimeUpdate = () => {
        const current = audioRef.current?.currentTime || 0;
        if (current - lastSentRef.current >= 5) {
            lastSentRef.current = current;
            void sendEvidence("playback");
        }
    };

    if (!url)
        return (
            <Alert severity="warning">
                No audio is available for this lesson.
            </Alert>
        );

    return (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Box
                component="audio"
                ref={audioRef}
                src={url}
                controls
                preload="metadata"
                onTimeUpdate={handleTimeUpdate}
                onPause={() => void sendEvidence("pause")}
                onEnded={() => void sendEvidence("ended")}
                sx={{ width: "100%" }}
            />
            <Typography variant="caption" color="text.secondary">
                Listened: {progress?.progressPercent || 0}%
            </Typography>
            <LinearProgress
                variant="determinate"
                value={progress?.progressPercent || 0}
                sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
            />
            {error && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                    {error}
                </Alert>
            )}
        </Paper>
    );
}
