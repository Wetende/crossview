import { getCsrfHeaders } from "@/utils/csrf";

const baseUrl = (enrollmentId, nodeId) =>
    `/api/learning-operations/enrollments/${enrollmentId}/nodes/${nodeId}`;

const requestJson = async (url, options = {}) => {
    const response = await fetch(url, {
        credentials: "same-origin",
        ...options,
        headers: getCsrfHeaders({
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {}),
        }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(
            payload.detail || "Activity progress could not be saved.",
        );
    }
    return payload;
};

export const recordActivityProgress = (enrollmentId, nodeId, event) =>
    requestJson(`${baseUrl(enrollmentId, nodeId)}/progress/`, {
        method: "POST",
        body: JSON.stringify(event),
    });

export const getCodeLabWork = (enrollmentId, nodeId) =>
    requestJson(`${baseUrl(enrollmentId, nodeId)}/code-work/`);

export const saveCodeLabWork = (enrollmentId, nodeId, code) =>
    requestJson(`${baseUrl(enrollmentId, nodeId)}/code-work/`, {
        method: "PUT",
        body: JSON.stringify({ code }),
    });

export const submitCodeLabWork = (enrollmentId, nodeId, code) =>
    requestJson(`${baseUrl(enrollmentId, nodeId)}/code-work/submit/`, {
        method: "POST",
        body: JSON.stringify({ code }),
    });

export const createActivitySessionId = () => {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};
