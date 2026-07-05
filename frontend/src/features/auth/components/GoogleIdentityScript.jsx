import { useEffect, useRef, useState } from "react";

const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-services-client";
const DEFAULT_BUTTON_WIDTH = 320;

function loadGoogleIdentityScript() {
    if (window.google?.accounts?.id) {
        return Promise.resolve(window.google);
    }

    const existingScript = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID);
    if (existingScript) {
        return new Promise((resolve, reject) => {
            existingScript.addEventListener("load", () => resolve(window.google), { once: true });
            existingScript.addEventListener("error", reject, { once: true });
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.id = GOOGLE_IDENTITY_SCRIPT_ID;
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.google);
        script.onerror = reject;

        document.head.appendChild(script);
    });
}

export default function GoogleIdentityScript() {
    useEffect(() => {
        loadGoogleIdentityScript().catch(() => {});
    }, []);

    return null;
}

export function GoogleSignInButton({
    clientId,
    loginUri,
    nextUrl = "",
    context = "signin",
    text = "continue_with",
    autoPrompt = false,
    maxWidth = DEFAULT_BUTTON_WIDTH,
}) {
    const wrapperRef = useRef(null);
    const buttonRef = useRef(null);
    const [buttonWidth, setButtonWidth] = useState(DEFAULT_BUTTON_WIDTH);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) {
            return undefined;
        }

        const updateWidth = () => {
            const availableWidth = Math.floor(wrapper.getBoundingClientRect().width);
            if (availableWidth > 0) {
                setButtonWidth(Math.min(maxWidth, availableWidth));
            }
        };

        updateWidth();

        if (!window.ResizeObserver) {
            window.addEventListener("resize", updateWidth);
            return () => window.removeEventListener("resize", updateWidth);
        }

        const observer = new window.ResizeObserver(updateWidth);
        observer.observe(wrapper);
        return () => observer.disconnect();
    }, [maxWidth]);

    useEffect(() => {
        if (!clientId || !loginUri || !buttonRef.current) {
            return undefined;
        }

        let cancelled = false;
        const buttonElement = buttonRef.current;
        buttonElement.innerHTML = "";

        loadGoogleIdentityScript()
            .then((google) => {
                if (cancelled || !google?.accounts?.id || !buttonElement.isConnected) {
                    return;
                }

                google.accounts.id.initialize({
                    client_id: clientId,
                    context,
                    ux_mode: "redirect",
                    login_uri: loginUri,
                    use_fedcm_for_prompt: true,
                    use_fedcm_for_button: true,
                });
                google.accounts.id.renderButton(buttonElement, {
                    type: "standard",
                    size: "large",
                    theme: "outline",
                    text,
                    shape: "rectangular",
                    logo_alignment: "left",
                    state: nextUrl || undefined,
                    width: buttonWidth,
                });
                if (autoPrompt) {
                    google.accounts.id.prompt();
                }
            })
            .catch(() => {});

        return () => {
            cancelled = true;
            buttonElement.innerHTML = "";
        };
    }, [autoPrompt, buttonWidth, clientId, context, loginUri, nextUrl, text]);

    return (
        <div
            ref={wrapperRef}
            style={{
                display: "flex",
                justifyContent: "center",
                marginInline: "auto",
                width: "100%",
                maxWidth,
            }}
        >
            <div ref={buttonRef} />
        </div>
    );
}
