const timestamp = (value) => {
    if (!value) return 0;
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
};

export const sortLearningPriority = (enrollments = []) =>
    [...enrollments].sort((left, right) => {
        const leftCompleted = Number(left.progressPercent || 0) >= 100 ? 1 : 0;
        const rightCompleted =
            Number(right.progressPercent || 0) >= 100 ? 1 : 0;
        if (leftCompleted !== rightCompleted)
            return leftCompleted - rightCompleted;

        const leftStarted = Number(left.progressPercent || 0) > 0 ? 1 : 0;
        const rightStarted = Number(right.progressPercent || 0) > 0 ? 1 : 0;
        if (leftStarted !== rightStarted) return rightStarted - leftStarted;

        const activityDifference =
            timestamp(right.lastActivity) - timestamp(left.lastActivity);
        if (activityDifference !== 0) return activityDifference;

        const progressDifference =
            Number(right.progressPercent || 0) -
            Number(left.progressPercent || 0);
        if (progressDifference !== 0) return progressDifference;

        return timestamp(right.enrolledAt) - timestamp(left.enrolledAt);
    });
