import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vitest";

import useLogout from "./useLogout";

const { postMock } = vi.hoisted(() => ({
    postMock: vi.fn(),
}));

vi.mock("@inertiajs/react", () => ({
    router: {
        post: (...args) => postMock(...args),
    },
}));

function LogoutHarness({ defaultOptions = {}, callOptions = {} }) {
    const triggerLogout = useLogout(defaultOptions);

    return <button onClick={() => triggerLogout(callOptions)}>Logout</button>;
}

describe("useLogout", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("posts to /logout/ and runs success hooks", () => {
        const onBefore = vi.fn();
        const onSuccess = vi.fn();
        const onFinish = vi.fn();

        postMock.mockImplementation((url, data, options) => {
            options.onSuccess?.({});
            options.onFinish?.();
        });

        render(
            <LogoutHarness
                defaultOptions={{
                    onBefore,
                    onSuccess,
                    onFinish,
                }}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Logout" }));

        expect(postMock).toHaveBeenCalledTimes(1);
        expect(postMock).toHaveBeenCalledWith(
            "/logout/",
            {},
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
                onFinish: expect.any(Function),
            })
        );
        expect(onBefore).toHaveBeenCalledTimes(1);
        expect(onSuccess).toHaveBeenCalledTimes(1);
        expect(onFinish).toHaveBeenCalledTimes(1);
    });

    test("supports per-call error hooks", () => {
        const onBefore = vi.fn();
        const onError = vi.fn();

        postMock.mockImplementation((url, data, options) => {
            options.onError?.({ message: "request failed" });
        });

        render(
            <LogoutHarness
                defaultOptions={{}}
                callOptions={{
                    onBefore,
                    onError,
                }}
            />
        );

        fireEvent.click(screen.getByRole("button", { name: "Logout" }));

        expect(onBefore).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledTimes(1);
    });
});
