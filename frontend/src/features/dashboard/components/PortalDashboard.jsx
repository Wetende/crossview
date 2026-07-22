import { Link } from "@inertiajs/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

const accentColors = {
    primary: { light: "#ECFDF3", main: "#166534" },
    success: { light: "#F0FDF4", main: "#22C55E" },
    warning: { light: "#FFF8E6", main: "#D89700" },
    info: { light: "#EAF6FF", main: "#1677B8" },
    error: { light: "#FFF0F0", main: "#D14343" },
};

export const WelcomePanel = ({
    actions = null,
    firstName,
    subtitle,
    title,
}) => (
    <Paper
        sx={{
            position: "relative",
            overflow: "hidden",
            px: { xs: 2.5, md: 4 },
            py: { xs: 3, md: 3.5 },
            border: "1px solid",
            borderColor: "divider",
            background: (theme) =>
                theme.palette.mode === "dark"
                    ? "linear-gradient(120deg, #16264B 0%, #1B3061 100%)"
                    : "linear-gradient(120deg, #FFFFFF 0%, #F7F9FF 100%)",
        }}
    >
        <Box
            aria-hidden="true"
            sx={{
                position: "absolute",
                inset: 0,
                opacity: 0.5,
                backgroundImage:
                    "radial-gradient(circle, rgba(22,101,52,0.18) 1.5px, transparent 1.5px)",
                backgroundSize: "18px 18px",
                maskImage:
                    "linear-gradient(90deg, transparent 52%, black 100%)",
            }}
        />
        <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            sx={{ position: "relative", zIndex: 1 }}
        >
            <Box sx={{ maxWidth: 760 }}>
                <Typography
                    variant="overline"
                    sx={{
                        color: "success.main",
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                    }}
                >
                    {title}
                </Typography>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{ mt: 0.4, color: "primary.main", fontWeight: 700 }}
                >
                    Welcome back, {firstName}
                </Typography>
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mt: 1, maxWidth: 650 }}
                >
                    {subtitle}
                </Typography>
                {actions ? (
                    <Stack direction="row" spacing={1.25} sx={{ mt: 2.25 }}>
                        {actions}
                    </Stack>
                ) : null}
            </Box>
            <Box
                sx={{
                    width: 88,
                    height: 88,
                    display: { xs: "none", sm: "grid" },
                    placeItems: "center",
                    flexShrink: 0,
                    color: "#FFFFFF",
                    bgcolor: "primary.main",
                    borderRadius: "50%",
                    border: "9px solid",
                    borderColor: (theme) =>
                        theme.palette.mode === "dark" ? "#20386E" : "#EEF2FF",
                    boxShadow: "0 14px 30px rgba(22,101,52,0.2)",
                }}
            >
                <SchoolOutlinedIcon sx={{ fontSize: 40 }} />
            </Box>
        </Stack>
    </Paper>
);

export const MetricCard = ({
    color = "primary",
    href,
    icon: Icon,
    label,
    value,
}) => {
    const accent = accentColors[color] || accentColors.primary;
    return (
        <Paper
            sx={{
                height: "100%",
                p: 2.5,
                border: "1px solid",
                borderColor: "divider",
                transition: "transform 180ms ease, box-shadow 180ms ease",
                "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 14px 32px rgba(22,101,52,0.1)",
                },
            }}
        >
            <Stack direction="row" spacing={2} alignItems="center">
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        borderRadius: 2.5,
                        bgcolor: accent.light,
                        color: accent.main,
                    }}
                >
                    <Icon />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                        variant="h4"
                        sx={{
                            color: "primary.main",
                            fontWeight: 700,
                            lineHeight: 1.1,
                        }}
                    >
                        {value}
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.4, fontWeight: 500 }}
                    >
                        {label}
                    </Typography>
                </Box>
                {href ? (
                    <Button
                        component={Link}
                        href={href}
                        aria-label={`View ${label}`}
                        sx={{
                            minWidth: 34,
                            width: 34,
                            height: 34,
                            p: 0,
                            borderRadius: "50%",
                        }}
                    >
                        <ArrowForwardIcon sx={{ fontSize: 18 }} />
                    </Button>
                ) : null}
            </Stack>
        </Paper>
    );
};

export const SectionCard = ({
    action = null,
    children,
    subtitle = null,
    title,
}) => (
    <Paper
        sx={{ overflow: "hidden", border: "1px solid", borderColor: "divider" }}
    >
        <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
            sx={{
                px: { xs: 2.25, md: 3 },
                py: 2.25,
                borderBottom: "1px solid",
                borderColor: "divider",
            }}
        >
            <Box>
                <Typography
                    variant="h6"
                    sx={{ color: "primary.main", fontWeight: 700 }}
                >
                    {title}
                </Typography>
                {subtitle ? (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.25 }}
                    >
                        {subtitle}
                    </Typography>
                ) : null}
            </Box>
            {action}
        </Stack>
        <Box>{children}</Box>
    </Paper>
);

export const EmptyPanel = ({
    description,
    icon: Icon = Inventory2OutlinedIcon,
    title,
}) => (
    <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: 220, px: 3, py: 5, textAlign: "center" }}
    >
        <Box
            sx={{
                width: 72,
                height: 72,
                display: "grid",
                placeItems: "center",
                mb: 2,
                borderRadius: "50%",
                bgcolor: (theme) =>
                    theme.palette.mode === "dark" ? "#20335E" : "#F0F3FA",
                color: "text.secondary",
            }}
        >
            <Icon sx={{ fontSize: 37 }} />
        </Box>
        <Typography
            variant="h6"
            sx={{ color: "primary.main", fontWeight: 700 }}
        >
            {title}
        </Typography>
        <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.75, maxWidth: 420 }}
        >
            {description}
        </Typography>
    </Stack>
);

export const ProgressPanel = ({ label, value }) => (
    <Paper
        sx={{
            p: 3,
            color: "#FFFFFF",
            border: 0,
            background: "linear-gradient(145deg, #166534 0%, #14532D 100%)",
            boxShadow: "0 18px 34px rgba(22,101,52,0.24)",
        }}
    >
        <Typography
            variant="overline"
            sx={{ color: "rgba(255,255,255,0.7)", letterSpacing: "0.12em" }}
        >
            Learning progress
        </Typography>
        <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-end"
            sx={{ mt: 1.5 }}
        >
            <Box>
                <Typography
                    variant="h3"
                    sx={{ color: "#FFFFFF", fontWeight: 700 }}
                >
                    {value}%
                </Typography>
                <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.78)", mt: 0.5 }}
                >
                    {label}
                </Typography>
            </Box>
            <Chip
                label={value >= 100 ? "Completed" : "In progress"}
                sx={{ bgcolor: "#22C55E", color: "#052E16", fontWeight: 700 }}
            />
        </Stack>
        <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, value))}
            sx={{
                mt: 3,
                height: 10,
                borderRadius: 6,
                bgcolor: "rgba(255,255,255,0.26)",
                "& .MuiLinearProgress-bar": {
                    bgcolor: "#22C55E",
                    borderRadius: 6,
                },
            }}
        />
    </Paper>
);

export const StatusChip = ({ label, tone = "primary" }) => {
    const accent = accentColors[tone] || accentColors.primary;
    return (
        <Chip
            label={label}
            size="small"
            sx={{ bgcolor: accent.light, color: accent.main, fontWeight: 700 }}
        />
    );
};
