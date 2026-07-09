import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import DOMPurify from "dompurify";
import {
    RICH_TEXT_IMAGE_DATA_ATTRIBUTE_NAMES,
    RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE,
    renderRichTextImageCaptions,
    richTextImageFigureSx,
    richTextImageSx,
} from "@/utils/richTextImages";

const parseDurationToMs = (durationText) => {
    const source = String(durationText || "").toLowerCase().trim();
    if (!source) return 0;

    const hourMatch = source.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)/);
    const minuteMatch = source.match(
        /(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes)/,
    );

    let totalMinutes = 0;
    if (hourMatch) totalMinutes += Number(hourMatch[1]) * 60;
    if (minuteMatch) totalMinutes += Number(minuteMatch[1]);

    if (!hourMatch && !minuteMatch) {
        const numericOnly = Number(source.replace(/[^\d.]/g, ""));
        if (!Number.isNaN(numericOnly) && numericOnly > 0) {
            totalMinutes = numericOnly;
        }
    }

    return totalMinutes > 0 ? totalMinutes * 60 * 1000 : 0;
};

const formatMs = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
    };
};

const parseDateTime = (dateValue, timeValue) => {
    if (!dateValue) return null;
    const normalizedTime = timeValue && String(timeValue).trim() ? timeValue : "00:00";
    const parsed = new Date(`${dateValue}T${normalizedTime}:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const LiveClassRenderer = ({
    title,
    description,
    content,
    streamUrl,
    startDate,
    startTime,
    endDate,
    endTime,
    timezone,
    duration,
    allowJoinAnytime,
}) => {
    const [nowMs, setNowMs] = useState(Date.now());

    useEffect(() => {
        const timer = window.setInterval(() => {
            setNowMs(Date.now());
        }, 1000);

        return () => window.clearInterval(timer);
    }, []);

    const startAt = useMemo(
        () => parseDateTime(startDate, startTime),
        [startDate, startTime],
    );

    const explicitEndAt = useMemo(
        () => parseDateTime(endDate, endTime),
        [endDate, endTime],
    );

    const endAt = useMemo(() => {
        if (explicitEndAt) return explicitEndAt;
        if (!startAt) return null;
        const durationMs = parseDurationToMs(duration);
        return durationMs > 0 ? new Date(startAt.getTime() + durationMs) : null;
    }, [explicitEndAt, startAt, duration]);

    const msUntilStart = startAt ? startAt.getTime() - nowMs : 0;
    const isStarted = !startAt || msUntilStart <= 0;
    const isEnded = !!endAt && nowMs > endAt.getTime();
    const canJoin = !!streamUrl && (allowJoinAnytime || isStarted);

    const countdown = formatMs(msUntilStart);
    const sanitizedDescription = renderRichTextImageCaptions(
        DOMPurify.sanitize(description || "", {
            ADD_ATTR: RICH_TEXT_IMAGE_DATA_ATTRIBUTE_NAMES,
        }),
    );
    const sanitizedContent = renderRichTextImageCaptions(
        DOMPurify.sanitize(content || "", {
            ADD_ATTR: RICH_TEXT_IMAGE_DATA_ATTRIBUTE_NAMES,
        }),
    );

    return (
        <Stack spacing={3}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                <Stack spacing={2}>
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", md: "center" }}
                        spacing={1.5}
                    >
                        <Stack spacing={0.25}>
                            <Typography variant="h6" fontWeight={600}>
                                Live Session
                            </Typography>
                            {!!title && (
                                <Typography variant="body2" color="text.secondary">
                                    {title}
                                </Typography>
                            )}
                        </Stack>
                        <Chip
                            size="small"
                            color={isEnded ? "default" : isStarted ? "success" : "primary"}
                            label={isEnded ? "Session ended" : isStarted ? "Live now" : "Starts soon"}
                        />
                    </Stack>

                    {!isStarted && (
                        <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Countdown to start
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                {[
                                    { label: "Days", value: countdown.days },
                                    { label: "Hours", value: countdown.hours },
                                    { label: "Minutes", value: countdown.minutes },
                                    { label: "Seconds", value: countdown.seconds },
                                ].map((item) => (
                                    <Paper
                                        key={item.label}
                                        variant="outlined"
                                        sx={{ px: 1.5, py: 1, minWidth: 64, textAlign: "center" }}
                                    >
                                        <Typography fontWeight={700}>{item.value}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {item.label}
                                        </Typography>
                                    </Paper>
                                ))}
                            </Stack>
                        </Box>
                    )}

                    <Stack spacing={0.5}>
                        {startAt && (
                            <Typography variant="body2" color="text.secondary">
                                Starts: {startAt.toLocaleString()} {timezone ? `(${timezone})` : ""}
                            </Typography>
                        )}
                        {endAt && (
                            <Typography variant="body2" color="text.secondary">
                                Ends: {endAt.toLocaleString()} {timezone ? `(${timezone})` : ""}
                            </Typography>
                        )}
                    </Stack>

                    <Button
                        variant="contained"
                        href={canJoin ? streamUrl : undefined}
                        target={canJoin ? "_blank" : undefined}
                        rel={canJoin ? "noopener noreferrer" : undefined}
                        disabled={!canJoin}
                        sx={{ alignSelf: "flex-start" }}
                    >
                        {isStarted ? "Join live class" : "Available at start time"}
                    </Button>
                </Stack>
            </Paper>

            {!!sanitizedDescription && (
                <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                        Overview
                    </Typography>
                    <Box
                        sx={{
                            "& img": { ...richTextImageSx, borderRadius: 1, my: 2 },
                            [`& figure[${RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE}]`]: {
                                ...richTextImageFigureSx,
                                my: 2,
                                "& > img": {
                                    ...richTextImageFigureSx["& > img"],
                                    borderRadius: 1,
                                },
                            },
                        }}
                        dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                    />
                </Paper>
            )}

            {!!sanitizedContent && (
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2, md: 3 },
                        borderRadius: 2,
                        minHeight: 220,
                        "& img": { ...richTextImageSx, borderRadius: 1, my: 2 },
                        [`& figure[${RICH_TEXT_IMAGE_FIGURE_ATTRIBUTE}]`]: {
                            ...richTextImageFigureSx,
                            my: 2,
                            "& > img": {
                                ...richTextImageFigureSx["& > img"],
                                borderRadius: 1,
                            },
                        },
                    }}
                >
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                        Lesson content
                    </Typography>
                    <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
                </Paper>
            )}

            {!sanitizedDescription && !sanitizedContent && (
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, textAlign: "center" }}>
                    <Typography color="text.secondary">
                        No additional lesson notes provided yet.
                    </Typography>
                </Paper>
            )}
        </Stack>
    );
};

export default LiveClassRenderer;
