import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const normalizeForHash = (value, seen = new WeakSet()) => {
    if (value === null || typeof value !== "object") {
        return value;
    }

    if (typeof File !== "undefined" && value instanceof File) {
        return {
            __file: true,
            name: value.name,
            size: value.size,
            lastModified: value.lastModified,
        };
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (seen.has(value)) {
        return "[Circular]";
    }
    seen.add(value);

    if (Array.isArray(value)) {
        return value.map((item) => normalizeForHash(item, seen));
    }

    return Object.keys(value)
        .sort()
        .reduce((acc, key) => {
            acc[key] = normalizeForHash(value[key], seen);
            return acc;
        }, {});
};

export const stableSerialize = (value) =>
    JSON.stringify(normalizeForHash(value));

export default function useAutosave({
    enabled = true,
    value,
    buildPayload,
    save,
    debounceMs = 1500,
    saveKey = "default",
}) {
    const valueHash = useMemo(() => stableSerialize(value), [value]);
    const [status, setStatus] = useState(enabled ? "idle" : "disabled");
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const [error, setError] = useState(null);

    const timerRef = useRef(null);
    const mountedRef = useRef(false);
    const lastSavedHashRef = useRef(valueHash);
    const latestRef = useRef({
        enabled,
        valueHash,
        buildPayload,
        save,
    });

    const safeSetState = useCallback((updater) => {
        if (mountedRef.current) {
            updater();
        }
    }, []);

    useEffect(() => {
        latestRef.current = {
            enabled,
            valueHash,
            buildPayload,
            save,
        };
    }, [buildPayload, enabled, save, valueHash]);

    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        lastSavedHashRef.current = latestRef.current.valueHash;
        setStatus(enabled ? "idle" : "disabled");
        setLastSavedAt(null);
        setError(null);
    }, [enabled, saveKey]);

    const runSave = useCallback(
        ({
            force = false,
            onSuccess,
            onError,
            onFinish,
        } = {}) => {
            const {
                enabled: currentEnabled,
                valueHash: currentHash,
                buildPayload: currentBuildPayload,
                save: currentSave,
            } = latestRef.current;

            if (!currentBuildPayload || !currentSave) {
                return Promise.resolve({ skipped: true });
            }

            if (!currentEnabled && !force) {
                return Promise.resolve({ skipped: true });
            }

            if (!force && currentHash === lastSavedHashRef.current) {
                return Promise.resolve({ skipped: true });
            }

            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }

            let payload;
            try {
                payload = currentBuildPayload();
            } catch (payloadError) {
                safeSetState(() => {
                    setStatus("error");
                    setError(payloadError);
                });
                onError?.(payloadError);
                onFinish?.();
                return Promise.resolve({
                    ok: false,
                    error: payloadError,
                });
            }

            safeSetState(() => {
                setStatus("saving");
                setError(null);
            });

            return new Promise((resolve) => {
                let resolved = false;
                const resolveOnce = (result) => {
                    if (!resolved) {
                        resolved = true;
                        resolve(result);
                    }
                };

                try {
                    currentSave(payload, {
                        onSuccess: (...args) => {
                            lastSavedHashRef.current = currentHash;
                            safeSetState(() => {
                                setStatus("saved");
                                setLastSavedAt(new Date());
                                setError(null);
                            });
                            onSuccess?.(...args);
                            resolveOnce({ ok: true, payload });
                        },
                        onError: (saveError) => {
                            safeSetState(() => {
                                setStatus("error");
                                setError(saveError);
                            });
                            onError?.(saveError);
                            resolveOnce({ ok: false, error: saveError });
                        },
                        onFinish: (...args) => {
                            onFinish?.(...args);
                        },
                    });
                } catch (saveError) {
                    safeSetState(() => {
                        setStatus("error");
                        setError(saveError);
                    });
                    onError?.(saveError);
                    onFinish?.();
                    resolveOnce({ ok: false, error: saveError });
                }
            });
        },
        [safeSetState],
    );

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            if (
                latestRef.current.enabled &&
                latestRef.current.valueHash !== lastSavedHashRef.current
            ) {
                void runSave();
            }
        };
    }, [runSave]);

    useEffect(() => {
        if (!enabled) {
            lastSavedHashRef.current = valueHash;
            setStatus("disabled");
            setError(null);
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            return undefined;
        }

        if (valueHash === lastSavedHashRef.current) {
            setStatus((current) =>
                current === "disabled" || current === "dirty" ? "idle" : current,
            );
            return undefined;
        }

        setStatus("dirty");
        setError(null);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            void runSave();
        }, debounceMs);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [debounceMs, enabled, runSave, valueHash]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return undefined;
        }

        const flushPending = () => {
            if (
                latestRef.current.enabled &&
                latestRef.current.valueHash !== lastSavedHashRef.current
            ) {
                void runSave();
            }
        };
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                flushPending();
            }
        };

        window.addEventListener("pagehide", flushPending);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("pagehide", flushPending);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
        };
    }, [runSave]);

    return {
        status,
        lastSavedAt,
        error,
        isDirty: status === "dirty" || status === "error",
        flush: runSave,
        retry: () => runSave({ force: true }),
    };
}
