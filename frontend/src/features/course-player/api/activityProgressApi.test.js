import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    getCodeLabWork,
    recordActivityProgress,
    submitCodeLabWork,
} from "./activityProgressApi";

describe("course-player activity progress API", () => {
    beforeEach(() => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ isCompleted: false }),
        });
    });

    it("records ordered evidence against an enrollment and node", async () => {
        await recordActivityProgress(12, 34, {
            eventType: "playback",
            sessionId: "session-1234",
            sequence: 2,
            positionSeconds: 10,
            durationSeconds: 60,
        });

        expect(fetch).toHaveBeenCalledWith(
            "/api/learning-operations/enrollments/12/nodes/34/progress/",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    eventType: "playback",
                    sessionId: "session-1234",
                    sequence: 2,
                    positionSeconds: 10,
                    durationSeconds: 60,
                }),
            }),
        );
    });

    it("uses durable code work endpoints for load and submit", async () => {
        await getCodeLabWork(5, 9);
        await submitCodeLabWork(5, 9, "console.log('done')");

        expect(fetch).toHaveBeenNthCalledWith(
            1,
            "/api/learning-operations/enrollments/5/nodes/9/code-work/",
            expect.objectContaining({ credentials: "same-origin" }),
        );
        expect(fetch).toHaveBeenNthCalledWith(
            2,
            "/api/learning-operations/enrollments/5/nodes/9/code-work/submit/",
            expect.objectContaining({ method: "POST" }),
        );
    });
});
