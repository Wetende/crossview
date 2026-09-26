// Mirrors the server's lock reason copy for curriculum nodes that arrive
// without `lockReasonText`.
const LOCK_REASON_TEXT = Object.freeze({
    sequential: "Complete earlier content first",
    prerequisite: "Complete prerequisites first",
    scheduled: "Scheduled content is not yet available",
    drip: "This content unlocks later",
    expired: "Enrollment access has expired",
    enrollment_required: "Enrollment is required to access this content",
});

export const formatUnlockDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// "This content unlocks later · Unlocks 3 Oct 2026, 09:00"
export const getLockText = (node) => {
    const reason =
        node?.lockReasonText || LOCK_REASON_TEXT[node?.lockReason] || "Locked";
    const unlocksAt = node?.unlocksAt ? formatUnlockDate(node.unlocksAt) : "";
    return unlocksAt ? `${reason} · Unlocks ${unlocksAt}` : reason;
};
