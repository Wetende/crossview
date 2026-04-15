import { useCallback } from "react";
import { router } from "@inertiajs/react";

/**
 * Shared logout action for all UI entry points.
 * Supports menu-closing hooks so controls feel responsive on request failure.
 */
export default function useLogout(defaultOptions = {}) {
    const {
        onBefore: defaultOnBefore,
        onSuccess: defaultOnSuccess,
        onError: defaultOnError,
        onFinish: defaultOnFinish,
    } = defaultOptions;

    return useCallback(
        (options = {}) => {
            const {
                onBefore = defaultOnBefore,
                onSuccess = defaultOnSuccess,
                onError = defaultOnError,
                onFinish = defaultOnFinish,
            } = options;

            onBefore?.();

            router.post(
                "/logout/",
                {},
                {
                    onSuccess: (...args) => {
                        onSuccess?.(...args);
                    },
                    onError: (...args) => {
                        onError?.(...args);
                    },
                    onFinish: (...args) => {
                        onFinish?.(...args);
                    },
                }
            );
        },
        [defaultOnBefore, defaultOnError, defaultOnFinish, defaultOnSuccess]
    );
}
