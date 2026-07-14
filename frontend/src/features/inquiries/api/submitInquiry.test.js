import { afterEach, describe, expect, it, vi } from "vitest";

import { InquirySubmissionError, submitInquiry } from "./submitInquiry";

vi.mock("@/utils/csrf", () => ({
    getCsrfHeaders: (headers) => ({ ...headers, "X-CSRFToken": "test-token" }),
}));

describe("submitInquiry", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("posts JSON with same-origin credentials and returns the response", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 201,
            json: async () => ({ inquiryId: 42, message: "Received" }),
        });
        vi.stubGlobal("fetch", fetchMock);

        await expect(
            submitInquiry({ name: "Example", email: "person@example.com" }),
        ).resolves.toEqual({ inquiryId: 42, message: "Received" });

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/inquiries/",
            expect.objectContaining({
                method: "POST",
                credentials: "same-origin",
                headers: expect.objectContaining({
                    "Content-Type": "application/json",
                    "X-CSRFToken": "test-token",
                }),
            }),
        );
    });

    it("surfaces validation fields from an unsuccessful response", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: false,
                status: 422,
                json: async () => ({
                    message: "Please correct the highlighted fields.",
                    errors: { email: ["Enter a valid email address."] },
                }),
            }),
        );

        const error = await submitInquiry({}).catch((reason) => reason);

        expect(error).toBeInstanceOf(InquirySubmissionError);
        expect(error.status).toBe(422);
        expect(error.errors.email).toEqual(["Enter a valid email address."]);
    });

    it("converts network failures into a user-facing submission error", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockRejectedValue(new TypeError("Network unavailable")),
        );

        await expect(submitInquiry({})).rejects.toMatchObject({
            name: "InquirySubmissionError",
            status: 0,
            message: expect.stringContaining("Check your connection"),
        });
    });
});
