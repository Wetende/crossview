export const ACTIVITY_TYPES = Object.freeze({
    TEXT: "text",
    VIDEO: "video",
    DOCUMENT: "document",
    AUDIO: "audio",
    CODE: "code",
    QUIZ: "quiz",
    ASSIGNMENT: "assignment",
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
    if (duration === null || duration === undefined || duration === "") return "";
    if (typeof duration === "number") return `${duration} min`;

    const value = String(duration).trim();
    if (!value) return "";
    return /^\d+(?:\.\d+)?$/.test(value) ? `${value} min` : value;
};
