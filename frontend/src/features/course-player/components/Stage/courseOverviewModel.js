const ASSESSMENT_TYPES = new Set([
    "assignment",
    "quiz",
    "practicum",
    "peer_review",
]);

const normalizedType = (node) =>
    String(
        node?.properties?.lesson_type ||
            node?.activityType ||
            node?.nodeType ||
            node?.node_type ||
            "text",
    ).toLowerCase();

const isSection = (node) =>
    String(node?.nodeType || node?.node_type || "").toLowerCase() ===
        "section" || (node?.children || []).length > 0;

const collectLeaves = (nodes = []) =>
    nodes.flatMap((node) => {
        if (isSection(node) && (node.children || []).length > 0) {
            return collectLeaves(node.children);
        }
        return [node];
    });

const findUnitUrl = (leaves) => {
    const available = leaves.filter((node) => !node.isLocked && node.url);
    return (
        available.find((node) => !node.isCompleted)?.url ||
        available[0]?.url ||
        null
    );
};

export const buildUnitSummaries = (curriculum = []) => {
    const roots = curriculum.length > 0 ? curriculum : [];
    const units = roots.map((root, index) => {
        const leaves = isSection(root)
            ? collectLeaves(root.children || [])
            : [root];
        const completedCount = leaves.filter((node) => node.isCompleted).length;
        const totalCount = leaves.length;

        return {
            id: root.id || `unit-${index}`,
            title: root.title || `Unit ${index + 1}`,
            completedCount,
            totalCount,
            progressPercent:
                totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
            url: findUnitUrl(leaves),
        };
    });

    if (units.length === 0) return [];
    if (units.every((unit) => unit.totalCount <= 1) && units.length > 1) {
        const leaves = collectLeaves(roots);
        const completedCount = leaves.filter((node) => node.isCompleted).length;
        return [
            {
                id: "course-content",
                title: "Course content",
                completedCount,
                totalCount: leaves.length,
                progressPercent:
                    leaves.length > 0
                        ? (completedCount / leaves.length) * 100
                        : 0,
                url: findUnitUrl(leaves),
            },
        ];
    }

    return units;
};

export const buildAssessmentSummaries = (curriculum = []) =>
    collectLeaves(curriculum)
        .filter((node) => ASSESSMENT_TYPES.has(normalizedType(node)))
        .map((node) => {
            const bestAttempt = node.bestAttempt || null;
            const lastAttempt = node.lastAttempt || null;
            const attempt = bestAttempt || lastAttempt;
            const status = !attempt
                ? "Not submitted"
                : attempt.passed === true
                  ? "Passed"
                  : attempt.passed === false
                    ? "Needs another attempt"
                    : "Awaiting grading";

            return {
                id: node.id,
                title: node.title,
                type: normalizedType(node),
                url: node.isLocked ? null : node.url,
                score:
                    attempt && Number.isFinite(Number(attempt.score))
                        ? Number(attempt.score)
                        : null,
                attemptNumber: lastAttempt?.number || null,
                status,
            };
        });

export { collectLeaves };
