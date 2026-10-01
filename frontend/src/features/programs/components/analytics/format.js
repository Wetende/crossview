import { format, parseISO } from "date-fns";

export const HIGH_DROP_OFF_PERCENT = 30;

export const RANGE_LABELS = {
    "7d": "7 days",
    "30d": "30 days",
    "90d": "90 days",
    all: "All time",
};

export const RANGE_PHRASES = {
    "7d": "in the last 7 days",
    "30d": "in the last 30 days",
    "90d": "in the last 90 days",
    all: "since the course opened",
};

export const STATUS_LABELS = {
    active: "Active",
    new: "New",
    not_started: "Not started",
    stalled: "Stalled",
    inactive: "Inactive",
    completed: "Completed",
    expired: "Expired",
    suspended: "Suspended",
    withdrawn: "Withdrawn",
};

const integerFormat = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });
const decimalFormat = new Intl.NumberFormat("en", { maximumFractionDigits: 1 });

export function formatCount(value) {
    return integerFormat.format(value ?? 0);
}

export function formatPercent(value) {
    if (value === null || value === undefined) return "—";
    return `${decimalFormat.format(value)}%`;
}

export function formatDuration(seconds) {
    if (seconds === null || seconds === undefined) return "—";
    const total = Math.round(seconds);
    if (total < 60) return `${total}s`;
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    if (minutes < 60) return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const restMinutes = minutes % 60;
    return restMinutes ? `${hours}h ${restMinutes}m` : `${hours}h`;
}

export function formatBucket(
    value,
    granularity,
    long = false,
    partial = false,
) {
    if (!value) return "";
    const date = parseISO(value);
    if (granularity === "month") {
        const month = format(date, "MMM yyyy");
        return long && partial
            ? `${month} (from ${format(date, "MMM d")})`
            : month;
    }
    if (granularity === "week") {
        if (!long) return format(date, "MMM d");
        return partial
            ? `Partial week from ${format(date, "MMM d, yyyy")}`
            : `Week of ${format(date, "MMM d, yyyy")}`;
    }
    return long ? format(date, "EEE, MMM d, yyyy") : format(date, "MMM d");
}

export function humanizeStatus(status) {
    if (STATUS_LABELS[status]) return STATUS_LABELS[status];
    const text = String(status || "").replace(/_/g, " ");
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Theme status colours; labels always accompany them. */
export function statusColor(theme, status) {
    const { palette } = theme;
    const colors = {
        active: palette.success.main,
        new: palette.info.main,
        not_started: palette.warning.light,
        stalled: palette.warning.main,
        inactive: palette.error.main,
        completed: palette.primary.main,
        expired: palette.grey[400],
        suspended: palette.grey[500],
        withdrawn: palette.grey[600],
    };
    return colors[status] || palette.grey[500];
}
