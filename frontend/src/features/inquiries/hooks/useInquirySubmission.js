import { useCallback, useState } from "react";

import { submitInquiry } from "../api/submitInquiry";

const initialState = {
    status: "idle",
    message: "",
    errors: {},
};

export default function useInquirySubmission() {
    const [state, setState] = useState(initialState);

    const submit = useCallback(async (payload) => {
        setState({ status: "submitting", message: "", errors: {} });

        try {
            const data = await submitInquiry(payload);
            setState({
                status: "success",
                message: data.message || "Your inquiry has been received.",
                errors: {},
            });
            return { ok: true, data };
        } catch (error) {
            setState({
                status: "error",
                message:
                    error?.message ||
                    "We could not send your inquiry. Please try again.",
                errors: error?.errors || {},
            });
            return { ok: false, error };
        }
    }, []);

    const resetFeedback = useCallback(() => {
        setState(initialState);
    }, []);

    return {
        ...state,
        isSubmitting: state.status === "submitting",
        submit,
        resetFeedback,
    };
}
