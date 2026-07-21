import { getCsrfHeaders } from "@/utils/csrf";

export const saveManualQuizGrade = async (
    attemptId,
    { questionId, pointsAwarded, feedback },
) => {
    const response = await fetch(
        `/api/learning-operations/quiz-attempts/${attemptId}/manual-grade/`,
        {
            method: "POST",
            credentials: "same-origin",
            headers: getCsrfHeaders({
                Accept: "application/json",
                "Content-Type": "application/json",
            }),
            body: JSON.stringify({ questionId, pointsAwarded, feedback }),
        },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.detail || "The response could not be graded.");
    }
    return payload;
};
