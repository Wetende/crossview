import {
    CheckCircle as CheckCircleIcon,
    ReportProblem as ReportProblemIcon,
} from "@mui/icons-material";
import { Chip, CircularProgress, Tooltip } from "@mui/material";

const formatSavedTime = (value) => {
    if (!value) return "";
    return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
    }).format(value);
};

export default function AutosaveStatus({
    status,
    lastSavedAt,
    disabledReason = "",
}) {
    if (status === "disabled") {
        return disabledReason ? (
            <Tooltip title={disabledReason}>
                <Chip
                    label="Autosave off"
                    size="small"
                    variant="outlined"
                    sx={{ flexShrink: 0 }}
                />
            </Tooltip>
        ) : null;
    }

    if (status === "idle") {
        return null;
    }

    if (status === "dirty") {
        return (
            <Chip
                label="Unsaved"
                size="small"
                variant="outlined"
                color="warning"
                sx={{ flexShrink: 0 }}
            />
        );
    }

    if (status === "saving") {
        return (
            <Chip
                icon={<CircularProgress size={14} />}
                label="Saving..."
                size="small"
                variant="outlined"
                color="info"
                sx={{ flexShrink: 0 }}
            />
        );
    }

    if (status === "saved") {
        const savedTime = formatSavedTime(lastSavedAt);
        return (
            <Chip
                icon={<CheckCircleIcon />}
                label={savedTime ? `Saved ${savedTime}` : "Saved"}
                size="small"
                variant="outlined"
                color="success"
                sx={{ flexShrink: 0 }}
            />
        );
    }

    if (status === "error") {
        return (
            <Tooltip title="Autosave failed. Use Save to try again.">
                <Chip
                    icon={<ReportProblemIcon />}
                    label="Save failed"
                    size="small"
                    variant="outlined"
                    color="error"
                    sx={{ flexShrink: 0 }}
                />
            </Tooltip>
        );
    }

    return null;
}
