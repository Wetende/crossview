const LESSON_COUNT_FIELDS = [
    "lecture_count",
    "lectureCount",
    "lesson_count",
    "lessonCount",
    "lessons_count",
    "lessonsCount",
];

const ASSESSMENT_COUNT_FIELDS = [
    "assessment_count",
    "assessmentCount",
    "assessments_count",
    "assessmentsCount",
];

const DURATION_HOURS_FIELDS = ["duration_hours", "durationHours"];
const DURATION_MINUTES_FIELDS = ["duration_minutes", "durationMinutes"];

function toMetricNumber(value) {
    if (
        value === null ||
        value === undefined ||
        value === "" ||
        typeof value === "boolean"
    ) {
        return null;
    }

    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) {
        return null;
    }

    return number;
}

function firstNumber(source, fields) {
    for (const field of fields) {
        if (!Object.prototype.hasOwnProperty.call(source, field)) continue;
        const number = toMetricNumber(source[field]);
        if (number !== null) return number;
    }
    return null;
}

export function formatMetricNumber(value) {
    const number = toMetricNumber(value) ?? 0;
    if (Number.isInteger(number)) return String(number);
    return number.toFixed(1).replace(/\.0$/, "");
}

export function pluralizeMetric(value, singular, plural = `${singular}s`) {
    return Number(value) === 1 ? singular : plural;
}

export function formatCourseDuration(value, unitCase = "lower") {
    const number = toMetricNumber(value) ?? 0;
    const unit = pluralizeMetric(number, "hour");
    const label =
        unitCase === "title" ? unit.charAt(0).toUpperCase() + unit.slice(1) : unit;
    return `${formatMetricNumber(number)} ${label}`;
}

export function resolveCourseMetrics(source = {}) {
    const lessonsCount = firstNumber(source, LESSON_COUNT_FIELDS) ?? 0;
    const assessmentsCount = firstNumber(source, ASSESSMENT_COUNT_FIELDS) ?? 0;
    const lecturesCount = lessonsCount + assessmentsCount;
    const durationHours =
        firstNumber(source, DURATION_HOURS_FIELDS) ??
        ((firstNumber(source, DURATION_MINUTES_FIELDS) ?? 0) / 60);

    return {
        lessonsCount,
        assessmentsCount,
        lecturesCount,
        durationHours,
    };
}
