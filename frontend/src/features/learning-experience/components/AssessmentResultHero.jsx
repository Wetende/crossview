import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import {
    CheckCircleOutlined,
    HourglassEmpty,
    ReplayOutlined,
} from "@mui/icons-material";

const resultPresentation = (passed) => {
    if (passed === true) {
        return {
            label: "Passed",
            color: "success",
            icon: <CheckCircleOutlined aria-hidden="true" />,
        };
    }
    if (passed === false) {
        return {
            label: "Another attempt may help",
            color: "warning",
            icon: <ReplayOutlined aria-hidden="true" />,
        };
    }
    return {
        label: "Awaiting grading",
        color: "info",
        icon: <HourglassEmpty aria-hidden="true" />,
    };
};

const AssessmentResultHero = ({
    title,
    score,
    passed,
    attemptLabel,
    metrics = [],
    children,
}) => {
    const presentation = resultPresentation(passed);
    const scoreLabel =
        typeof score === "number" ? `${Math.round(score)}%` : "Pending";

    return (
        <Paper
            component="section"
            aria-labelledby="assessment-result-title"
            variant="outlined"
            sx={{
                p: { xs: 2.25, sm: 3.5 },
                borderRadius: 2.5,
                borderTop: "5px solid",
                borderTopColor: `${presentation.color}.main`,
                overflow: "hidden",
            }}
        >
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={{ xs: 2.5, md: 4 }}
                alignItems={{ md: "center" }}
            >
                <Box sx={{ minWidth: { md: 205 } }}>
                    <Chip
                        icon={presentation.icon}
                        label={presentation.label}
                        color={presentation.color}
                        size="small"
                        sx={{ mb: 1.25, fontWeight: 800 }}
                    />
                    <Typography
                        id="assessment-result-title"
                        component="h2"
                        variant="h5"
                    >
                        {title}
                    </Typography>
                    <Typography
                        component="p"
                        variant="h2"
                        color={`${presentation.color}.main`}
                        sx={{ my: 0.75, fontWeight: 800 }}
                    >
                        {scoreLabel}
                    </Typography>
                    {attemptLabel && (
                        <Typography variant="body2" color="text.secondary">
                            {attemptLabel}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ flex: 1, width: "100%" }}>
                    {metrics.length > 0 && (
                        <Box
                            component="dl"
                            sx={{
                                m: 0,
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "repeat(2, minmax(0, 1fr))",
                                    sm: `repeat(${Math.min(metrics.length, 4)}, minmax(110px, 1fr))`,
                                },
                                gap: 2,
                            }}
                        >
                            {metrics.map((metric) => (
                                <Box key={metric.label}>
                                    <Typography
                                        component="dt"
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {metric.label}
                                    </Typography>
                                    <Typography
                                        component="dd"
                                        variant="body1"
                                        fontWeight={800}
                                        sx={{ m: 0 }}
                                    >
                                        {metric.value}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                    {children && (
                        <Box sx={{ mt: metrics.length > 0 ? 2.5 : 0 }}>
                            {children}
                        </Box>
                    )}
                </Box>
            </Stack>
        </Paper>
    );
};

export default AssessmentResultHero;
