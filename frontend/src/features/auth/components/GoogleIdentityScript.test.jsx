import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { GoogleSignInButton } from "./GoogleIdentityScript";

describe("GoogleSignInButton", () => {
    afterEach(() => {
        delete window.google;
        vi.restoreAllMocks();
    });

    test("renders the Google button and preserves the resume next URL", async () => {
        const initialize = vi.fn();
        const prompt = vi.fn();
        const renderButton = vi.fn((element) => {
            element.innerHTML = "<button>Continue with Google</button>";
        });
        window.google = {
            accounts: {
                id: {
                    initialize,
                    prompt,
                    renderButton,
                },
            },
        };

        render(
            <GoogleSignInButton
                clientId="google-client-id"
                loginUri="https://crossview.test/auth/google/onetap/"
                nextUrl="/programs/enrollment/resume/?intent=signed-intent"
                autoPrompt
            />,
        );

        await waitFor(() => expect(renderButton).toHaveBeenCalled());
        expect(initialize).toHaveBeenCalledWith(
            expect.objectContaining({
                client_id: "google-client-id",
                ux_mode: "redirect",
                login_uri: "https://crossview.test/auth/google/onetap/",
            }),
        );
        expect(renderButton).toHaveBeenCalledWith(
            expect.any(HTMLDivElement),
            expect.objectContaining({
                state: "/programs/enrollment/resume/?intent=signed-intent",
                text: "continue_with",
                width: 320,
            }),
        );
        expect(prompt).toHaveBeenCalled();
    });
});
