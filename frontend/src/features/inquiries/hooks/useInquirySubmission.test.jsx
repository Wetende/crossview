import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { submitInquiry } from "../api/submitInquiry";
import useInquirySubmission from "./useInquirySubmission";

vi.mock("../api/submitInquiry", () => ({
    submitInquiry: vi.fn(),
}));

describe("useInquirySubmission", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("exposes submitting and success states", async () => {
        let resolveRequest;
        submitInquiry.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveRequest = resolve;
                }),
        );
        const { result } = renderHook(() => useInquirySubmission());

        let submission;
        act(() => {
            submission = result.current.submit({ name: "Example" });
        });
        expect(result.current.isSubmitting).toBe(true);

        await act(async () => {
            resolveRequest({ inquiryId: 7, message: "Received" });
            await submission;
        });

        expect(result.current.status).toBe("success");
        expect(result.current.message).toBe("Received");
        expect(result.current.isSubmitting).toBe(false);
    });

    it("surfaces request errors and can reset feedback", async () => {
        submitInquiry.mockRejectedValue({
            message: "Please correct the fields.",
            errors: { email: ["Enter a valid email address."] },
        });
        const { result } = renderHook(() => useInquirySubmission());

        await act(async () => {
            await result.current.submit({ email: "invalid" });
        });

        expect(result.current.status).toBe("error");
        expect(result.current.errors.email).toEqual([
            "Enter a valid email address.",
        ]);

        act(() => {
            result.current.resetFeedback();
        });
        expect(result.current.status).toBe("idle");
        expect(result.current.errors).toEqual({});
    });
});
