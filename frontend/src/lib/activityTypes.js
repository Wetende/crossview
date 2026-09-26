export const ACTIVITY_TYPES = Object.freeze({
    TEXT: "text",
    VIDEO: "video",
    DOCUMENT: "document",
    AUDIO: "audio",
    CODE: "code",
    QUIZ: "quiz",
    ASSIGNMENT: "assignment",
    GOOGLE_MEET: "google_meet",
    LIVE_MEETING: "live_meeting",
    LIVE_STREAM: "live_stream",
    IN_PERSON_SESSION: "in_person_session",
});

const ACTIVITY_TYPE_ALIASES = Object.freeze({
    video_lesson: ACTIVITY_TYPES.VIDEO,
    live_class: ACTIVITY_TYPES.LIVE_MEETING,
    stream: ACTIVITY_TYPES.LIVE_STREAM,
});

export const normalizeActivityType = (node) => {
    const rawType = String(
        node?.activityType ||
            node?.properties?.lesson_type ||
            node?.lessonType ||
            node?.type ||
            node?.nodeType ||
            ACTIVITY_TYPES.TEXT,
    ).toLowerCase();

    return ACTIVITY_TYPE_ALIASES[rawType] || rawType;
};

export const formatActivityDuration = (duration) => {
    if (duration === null || duration === undefined || duration === "")
        return "";
    if (typeof duration === "number") return `${duration} min`;

    const value = String(duration).trim();
    if (!value) return "";
    return /^\d+(?:\.\d+)?$/.test(value) ? `${value} min` : value;
};

const ACTIVITY_TYPE_LABELS = Object.freeze({
    [ACTIVITY_TYPES.TEXT]: "Text lesson",
    [ACTIVITY_TYPES.VIDEO]: "Video lesson",
    [ACTIVITY_TYPES.DOCUMENT]: "Document lesson",
    [ACTIVITY_TYPES.AUDIO]: "Audio lesson",
    [ACTIVITY_TYPES.CODE]: "Code lab",
    [ACTIVITY_TYPES.QUIZ]: "Quiz",
    [ACTIVITY_TYPES.ASSIGNMENT]: "Assignment",
    [ACTIVITY_TYPES.GOOGLE_MEET]: "Live class",
    [ACTIVITY_TYPES.LIVE_MEETING]: "Live class",
    [ACTIVITY_TYPES.LIVE_STREAM]: "Live stream",
    [ACTIVITY_TYPES.IN_PERSON_SESSION]: "In-person session",
});

// Unknown types render through the text lesson renderer, so label them the same.
export const getActivityTypeLabel = (node) =>
    ACTIVITY_TYPE_LABELS[normalizeActivityType(node)] ||
    ACTIVITY_TYPE_LABELS[ACTIVITY_TYPES.TEXT];

const getQuestionCount = (node) => {
    const properties = node?.properties || {};
    if (Array.isArray(properties.questions)) return properties.questions.length;
    const count = Number(properties.question_count ?? properties.questionCount);
    return Number.isFinite(count) && count > 0 ? count : 0;
};

// "Video lesson · 9 min", "Quiz · 5 questions", "Text lesson".
export const getActivitySummary = (node) => {
    const label = getActivityTypeLabel(node);
    let detail = "";
    if (normalizeActivityType(node) === ACTIVITY_TYPES.QUIZ) {
        const count = getQuestionCount(node);
        if (count > 0) detail = `${count} ${count === 1 ? "question" : "questions"}`;
    }
    if (!detail) {
        detail = formatActivityDuration(
            node?.properties?.duration || node?.duration,
        );
    }
    return detail ? `${label} · ${detail}` : label;
};
