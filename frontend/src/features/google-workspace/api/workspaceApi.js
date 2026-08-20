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
    if (!response.ok) throw new Error(data.detail || "Google Workspace request failed.");
    return data;
};

export const workspaceApi = {
    connection: () => request("/api/google-workspace/connection/"),
    connect: (payload) => request("/api/google-workspace/connection/", { method: "POST", body: JSON.stringify(payload) }),
    meetSettings: () => request("/api/google-workspace/meet-settings/"),
    liveClasses: () => request("/api/live-sessions/classes/"),
    meetPreview: (nodeId) => request(`/api/live-sessions/nodes/${nodeId}/google-meet/preview/`),
    createMeet: (nodeId, payload) => request(`/api/live-sessions/nodes/${nodeId}/google-meet/`, { method: "POST", body: JSON.stringify(payload) }),
    syncMeet: (nodeId) => request(`/api/live-sessions/nodes/${nodeId}/google-meet/sync/`, { method: "POST", body: "{}" }),
    meetStatus: (nodeId) =>
        request(`/api/live-sessions/nodes/${nodeId}/google-meet/sync/`),
    attendance: (nodeId) =>
        request(`/api/live-sessions/nodes/${nodeId}/attendance/`),
    overrideAttendance: (nodeId, enrollmentId, payload) =>
        request(`/api/live-sessions/nodes/${nodeId}/attendance/${enrollmentId}/`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        }),
    cancelSession: (nodeId) =>
        request(`/api/live-sessions/nodes/${nodeId}/`, { method: "DELETE" }),
    mapParticipant: (nodeId, payload) =>
        request(`/api/live-sessions/nodes/${nodeId}/google-meet/participants/map/`, {
            method: "POST",
            body: JSON.stringify(payload),
        }),
};
