import { getCsrfHeaders } from "@/utils/csrf";

const request = async (url, options = {}) => {
    const response = await fetch(url, {
        credentials: "same-origin",
        ...options,
        headers: getCsrfHeaders({
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {}),
        }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.detail || "Google Classroom request failed.");
    }
    return data;
};

export const classroomApi = {
    connection: () => request("/api/google-classroom/connection/"),
    connect: (payload) =>
        request("/api/google-classroom/connection/", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    disconnect: () =>
        request("/api/google-classroom/connection/", { method: "DELETE" }),
    courses: () => request("/api/google-classroom/courses/"),
    createCourse: (payload) =>
        request("/api/google-classroom/courses/", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
    linkStatus: (programId) =>
        request(`/api/google-classroom/programs/${programId}/`),
    linkCourse: (programId, courseId) =>
        request(`/api/google-classroom/programs/${programId}/`, {
            method: "POST",
            body: JSON.stringify({ courseId }),
        }),
    unlinkCourse: (programId) =>
        request(`/api/google-classroom/programs/${programId}/`, {
            method: "DELETE",
        }),
    previewRoster: (programId, direction = "both") =>
        request(`/api/google-classroom/programs/${programId}/roster/preview/`, {
            method: "POST",
            body: JSON.stringify({ direction }),
        }),
    applyRoster: (programId, confirmationToken) =>
        request(`/api/google-classroom/programs/${programId}/roster/apply/`, {
            method: "POST",
            body: JSON.stringify({ confirmationToken }),
        }),
    publishResources: (programId, resources) =>
        request(`/api/google-classroom/programs/${programId}/resources/publish/`, {
            method: "POST",
            body: JSON.stringify({ resources }),
        }),
    unlinkResource: (programId, mappingId) =>
        request(
            `/api/google-classroom/programs/${programId}/resources/${mappingId}/`,
            { method: "DELETE" },
        ),
    previewSync: (programId) =>
        request(`/api/google-classroom/programs/${programId}/sync/preview/`),
    syncNow: (programId) =>
        request(`/api/google-classroom/programs/${programId}/sync/`, {
            method: "POST",
            body: JSON.stringify({}),
        }),
    history: (programId) =>
        request(`/api/google-classroom/programs/${programId}/history/`),
};
