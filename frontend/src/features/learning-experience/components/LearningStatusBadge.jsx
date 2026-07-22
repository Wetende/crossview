import { Chip } from "@mui/material";
import {
    CheckCircleOutlined,
    ErrorOutlined,
    HourglassEmpty,
    PlayCircleOutlined,
    RadioButtonUnchecked,
} from "@mui/icons-material";

const STATUS_CONFIG = {
    active: {
        label: "In progress",
        color: "primary",
        icon: PlayCircleOutlined,
    },
    completed: {
        label: "Completed",
        color: "success",
        icon: CheckCircleOutlined,
    },
    failed: {
        label: "Needs attention",
        color: "error",
        icon: ErrorOutlined,
    },
    inactive: {
        label: "Inactive",
        color: "warning",
        icon: HourglassEmpty,
    },
    not_started: {
        label: "Not started",
        color: "default",
        icon: RadioButtonUnchecked,
    },
    stalled: {
        label: "Needs attention",
        color: "warning",
        icon: HourglassEmpty,
    },
};

const resolveStatus = (status, progressPercent) => {
    if (Number(progressPercent || 0) >= 100) return "completed";
    if (Number(progressPercent || 0) > 0 && !status) return "active";
    return String(status || "not_started").toLowerCase();
};

const LearningStatusBadge = ({ status, progressPercent, size = "small" }) => {
    const resolvedStatus = resolveStatus(status, progressPercent);
    const config = STATUS_CONFIG[resolvedStatus] || {
        label: resolvedStatus.replaceAll("_", " "),
        color: "default",
        icon: RadioButtonUnchecked,
    };
    const StatusIcon = config.icon;

    return (
        <Chip
            icon={<StatusIcon aria-hidden="true" />}
            label={config.label}
            color={config.color}
            size={size}
            variant={config.color === "default" ? "outlined" : "filled"}
            sx={{
                fontWeight: 700,
                textTransform: "capitalize",
                "& .MuiChip-icon": { fontSize: 17 },
            }}
        />
    );
};

export default LearningStatusBadge;
