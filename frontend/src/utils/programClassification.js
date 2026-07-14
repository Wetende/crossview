export const PROGRAM_LEVEL_FILTERS = [
    { value: "all", label: "All" },
    { value: "Diploma", label: "Diploma" },
    { value: "Certificate", label: "Certificate" },
    { value: "Artisan", label: "Artisan" },
    { value: "Short Course", label: "Short Course" },
];

const normalize = (value) => String(value || "").trim().toLowerCase();

export function isShortCourseProgram(program) {
    const examBody = normalize(program?.examBody || program?.exam_body);
    const family = normalize(
        program?.qualificationFamily || program?.qualification_family,
    );
    const level = normalize(program?.level);

    return (
        examBody === "internal" ||
        family.includes("short course") ||
        family === "certificate of participation" ||
        level.includes("short course")
    );
}

export function matchesProgramLevel(program, activeLevel) {
    const target = normalize(activeLevel);
    if (!target || target === "all") {
        return true;
    }

    if (target === "short course" || target === "short courses") {
        return isShortCourseProgram(program);
    }

    const searchableFields = [
        normalize(program?.qualificationFamily || program?.qualification_family),
        normalize(program?.level),
    ].filter(Boolean);

    if (target === "certificate" && isShortCourseProgram(program)) {
        return false;
    }

    return searchableFields.some((field) => field.includes(target));
}
