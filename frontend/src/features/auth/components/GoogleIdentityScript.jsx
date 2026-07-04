import { useEffect } from "react";

const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-services-client";

export default function GoogleIdentityScript() {
    useEffect(() => {
        if (document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID)) {
            return;
        }

        const script = document.createElement("script");
        script.id = GOOGLE_IDENTITY_SCRIPT_ID;
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;

        document.head.appendChild(script);
    }, []);

    return null;
}
