import { getCsrfHeaders } from "@/utils/csrf";

export class InquirySubmissionError extends Error {
    constructor(message, { status = 0, errors = {}, cause } = {}) {
        super(message, { cause });
        this.name = "InquirySubmissionError";
        this.status = status;
        this.errors = errors;
    }
}

const responsePayload = async (response) => {
    try {
        return await response.json();
    } catch {
        return {};
    }
};

export const submitInquiry = async (payload, { signal } = {}) => {
    let response;
    try {
        response = await fetch("/api/inquiries/", {
            method: "POST",
            credentials: "same-origin",
            headers: getCsrfHeaders({
                Accept: "application/json",
                "Content-Type": "application/json",
            }),
            body: JSON.stringify(payload),
            signal,
        });
    } catch (error) {
        throw new InquirySubmissionError(
            "We could not send your inquiry. Check your connection and try again.",
            { cause: error },
        );
    }

    const data = await responsePayload(response);
    if (!response.ok) {
        throw new InquirySubmissionError(
            data.message || "We could not send your inquiry. Please try again.",
            {
                status: response.status,
                errors: data.errors || {},
            },
        );
    }

    return data;
};
