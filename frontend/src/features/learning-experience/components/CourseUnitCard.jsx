import { Link } from "@inertiajs/react";
import {
    ArrowForward,
    CheckCircle,
    LockOutlined,
    PlayCircleOutlined,
} from "@mui/icons-material";
import {
    Box,
    ButtonBase,
    Card,
    CardContent,
    Stack,
    Typography,
} from "@mui/material";

import CourseProgressSummary from "./CourseProgressSummary";

const CourseUnitCard = ({ unit, index = 0 }) => {
    const completed =
        unit.totalCount > 0 && unit.completedCount >= unit.totalCount;
    const locked = !unit.url;
    const accent = ["primary", "secondary", "warning", "success"][index % 4];

    return (
        <Card
            variant="outlined"
            sx={{
                height: "100%",
                borderRadius: 2.5,
                borderColor: "divider",
                boxShadow: "none",
                transition: "border-color 180ms ease, box-shadow 180ms ease",
                "&:hover": locked
                    ? undefined
                    : {
                          borderColor: `${accent}.main`,
                          boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
                      },
                "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                },
            }}
        >
            <ButtonBase
                component={locked ? "div" : Link}
                href={locked ? undefined : unit.url}
                disabled={locked}
                aria-label={
                    locked ? `${unit.title} is locked` : `Open ${unit.title}`
                }
                sx={{
                    width: "100%",
                    height: "100%",
                    textAlign: "left",
                    alignItems: "stretch",
                }}
            >
                <CardContent
                    sx={{
                        width: "100%",
                        p: 2.25,
                        "&:last-child": { pb: 2.25 },
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                    }}
                >
                    <Box
                        sx={{
                            minHeight: 112,
                            borderRadius: 2,
                            bgcolor: `${accent}.lighter`,
                            color: `${accent}.dark`,
                            display: "grid",
                            placeItems: "center",
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            aria-hidden="true"
                            sx={{
                                position: "absolute",
                                width: 96,
                                height: 96,
                                borderRadius: "50%",
                                border: "18px solid",
                                borderColor: `${accent}.main`,
                                opacity: 0.12,
                                right: -18,
                                top: -22,
                            }}
                        />
                        <Typography
                            variant="h2"
                            component="span"
                            fontWeight={800}
                        >
                            {index + 1}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography
                            component="h3"
                            variant="h6"
                            sx={{ mb: 0.5 }}
                        >
                            {unit.title}
                        </Typography>
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.75}
                        >
                            {locked ? (
                                <LockOutlined
                                    color="disabled"
                                    sx={{ fontSize: 18 }}
                                />
                            ) : completed ? (
                                <CheckCircle
                                    color="success"
                                    sx={{ fontSize: 18 }}
                                />
                            ) : (
                                <PlayCircleOutlined
                                    color="primary"
                                    sx={{ fontSize: 18 }}
                                />
                            )}
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={600}
                            >
                                {locked
                                    ? "Locked"
                                    : completed
                                      ? "Unit complete"
                                      : "Ready to continue"}
                            </Typography>
                        </Stack>
                    </Box>

                    <Box sx={{ mt: "auto" }}>
                        <CourseProgressSummary
                            progressPercent={unit.progressPercent}
                            completedCount={unit.completedCount}
                            totalCount={unit.totalCount}
                            label="Unit progress"
                        />
                        {!locked && (
                            <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.5}
                                sx={{ mt: 1.5, color: "primary.main" }}
                            >
                                <Typography variant="body2" fontWeight={800}>
                                    {completed
                                        ? "Review unit"
                                        : unit.completedCount > 0
                                          ? "Continue unit"
                                          : "Start unit"}
                                </Typography>
                                <ArrowForward
                                    sx={{ fontSize: 18 }}
                                    aria-hidden="true"
                                />
                            </Stack>
                        )}
                    </Box>
                </CardContent>
            </ButtonBase>
        </Card>
    );
};

export default CourseUnitCard;
