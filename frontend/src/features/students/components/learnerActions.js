export const ATTENTION_STATES = new Set(["not_started", "stalled", "inactive"]);

export function hasAttentionCondition(learner) {
    return Boolean(
        learner?.attention || ATTENTION_STATES.has(learner?.learnerState),
    );
}

export function getLearnerActions(learner, { remindersEnabled = false } = {}) {
    const actions = ["view", "message"];
    const status = learner?.status;

    if (
        remindersEnabled &&
        status === "active" &&
        hasAttentionCondition(learner)
    ) {
        actions.push("reminder");
    }
    if (status === "active") actions.push("suspend", "withdraw");
    if (status === "suspended") actions.push("restore", "withdraw");
    if (status === "withdrawn") actions.push("restore");

    return actions;
}

export function getLearnerMessageUrl(learner) {
    const params = new URLSearchParams();
    if (learner?.userId) {
        params.set("recipient_id", String(learner.userId));
    }
    if (learner?.email) {
        params.set("recipient_email", learner.email);
    }
    const query = params.toString();
    return `/messages/new/${query ? `?${query}` : ""}`;
}

export const ACTION_LABELS = {
    view: "View details",
    message: "Message learner",
    reminder: "Send reminder",
    suspend: "Suspend access",
    withdraw: "Withdraw",
    restore: "Restore access",
};
