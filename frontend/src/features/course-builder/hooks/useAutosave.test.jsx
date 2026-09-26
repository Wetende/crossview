import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import useAutosave, { stableSerialize } from "./useAutosave";

describe("useAutosave", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("debounces changes and saves the latest payload", async () => {
        const save = vi.fn((payload, callbacks) => {
            callbacks.onSuccess();
            callbacks.onFinish();
        });

        const { result, rerender } = renderHook(
            ({ value }) =>
                useAutosave({
                    enabled: true,
                    value,
                    buildPayload: () => value,
                    save,
                    debounceMs: 500,
                    saveKey: "lesson:1",
                }),
            { initialProps: { value: { title: "Draft" } } },
        );

        expect(save).not.toHaveBeenCalled();

        rerender({ value: { title: "Draft updated" } });
        expect(result.current.status).toBe("dirty");

        act(() => {
            vi.advanceTimersByTime(499);
        });
        expect(save).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(1);
        });

        expect(save).toHaveBeenCalledTimes(1);
        expect(save).toHaveBeenCalledWith(
            { title: "Draft updated" },
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
                onFinish: expect.any(Function),
            }),
        );
        expect(result.current.status).toBe("saved");
    });

    it("flushes pending changes immediately", async () => {
        const save = vi.fn((payload, callbacks) => {
            callbacks.onSuccess();
        });

        const { result, rerender } = renderHook(
            ({ value }) =>
                useAutosave({
                    enabled: true,
                    value,
                    buildPayload: () => value,
                    save,
                    debounceMs: 1000,
                    saveKey: "quiz:2",
                }),
            { initialProps: { value: { question: "One" } } },
        );

        rerender({ value: { question: "Two" } });

        await act(async () => {
            await result.current.flush();
        });

        expect(save).toHaveBeenCalledTimes(1);
        expect(save.mock.calls[0][0]).toEqual({ question: "Two" });

        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(save).toHaveBeenCalledTimes(1);
    });

    it("does not autosave while disabled", () => {
        const save = vi.fn();

        const { rerender } = renderHook(
            ({ value }) =>
                useAutosave({
                    enabled: false,
                    value,
                    buildPayload: () => value,
                    save,
                    debounceMs: 250,
                    saveKey: "new-node",
                }),
            { initialProps: { value: { title: "Untitled" } } },
        );

        rerender({ value: { title: "Still local" } });

        act(() => {
            vi.advanceTimersByTime(250);
        });

        expect(save).not.toHaveBeenCalled();
    });

    it("marks a server-rejected save as error, not saved", async () => {
        const serverErrors = {
            properties:
                "Document lesson requires a primary document upload before saving.",
        };
        // Inertia calls onError (not onSuccess) when the redirected page
        // carries non-empty props.errors.
        const save = vi.fn((payload, callbacks) => {
            callbacks.onError(serverErrors);
            callbacks.onFinish();
        });

        const { result, rerender } = renderHook(
            ({ value }) =>
                useAutosave({
                    enabled: true,
                    value,
                    buildPayload: () => value,
                    save,
                    debounceMs: 500,
                    saveKey: "lesson:9",
                }),
            { initialProps: { value: { title: "Doc" } } },
        );

        rerender({ value: { title: "Doc lesson" } });
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(save).toHaveBeenCalledTimes(1);
        expect(result.current.status).toBe("error");
        expect(result.current.error).toEqual(serverErrors);
        expect(result.current.lastSavedAt).toBeNull();

        let flushResult;
        await act(async () => {
            flushResult = await result.current.flush({ force: true });
        });
        expect(flushResult).toEqual({ ok: false, error: serverErrors });
        expect(result.current.status).toBe("error");
    });

    it("holds changes while canSave is false and saves them once allowed", async () => {
        const save = vi.fn((payload, callbacks) => {
            callbacks.onSuccess();
        });

        const { result, rerender } = renderHook(
            ({ value, canSave }) =>
                useAutosave({
                    enabled: true,
                    canSave,
                    value,
                    buildPayload: () => value,
                    save,
                    debounceMs: 500,
                    saveKey: "lesson:10",
                }),
            {
                initialProps: {
                    value: { title: "Untitled Lesson" },
                    canSave: false,
                },
            },
        );

        rerender({ value: { title: "Meet lesson" }, canSave: false });
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(save).not.toHaveBeenCalled();
        expect(result.current.status).toBe("dirty");

        // The skip is reported as paused so callers can warn about the edits.
        let flushResult;
        await act(async () => {
            flushResult = await result.current.flush();
        });
        expect(flushResult).toEqual({ skipped: true, paused: true });
        expect(save).not.toHaveBeenCalled();

        // The edit that makes the lesson saveable must not be swallowed.
        rerender({
            value: { title: "Meet lesson", startDate: "2026-10-01" },
            canSave: true,
        });
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(save).toHaveBeenCalledTimes(1);
        expect(save.mock.calls[0][0]).toEqual({
            title: "Meet lesson",
            startDate: "2026-10-01",
        });
        expect(result.current.status).toBe("saved");
    });

    it("serializes object keys in stable order", () => {
        expect(stableSerialize({ b: 2, a: 1 })).toBe(
            stableSerialize({ a: 1, b: 2 }),
        );
    });
});
