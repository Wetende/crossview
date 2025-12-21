import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import axios from "axios";
import NProgress from "nprogress";
import { router } from "@inertiajs/react";
import ProviderWrapper from "@/app/ProviderWrapper";
import "@/config"; // Load fonts
import "./styles/app.css";
import "nprogress/nprogress.css";

// Configure axios for CSRF (used by Inertia internally)
axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFToken";
axios.defaults.withCredentials = true;

// Configure NProgress
NProgress.configure({ showSpinner: false });

// Show progress bar on page transitions
router.on("start", () => NProgress.start());
router.on("finish", () => NProgress.done());

// Create Inertia app
createInertiaApp({
    resolve: (name) => {
        const pages = import.meta.glob("./Pages/**/*.jsx", { eager: true });
        const page = pages[`./Pages/${name}.jsx`];

        if (!page) {
            console.error(`Page not found: ${name}`);
            // Return a simple fallback component
            return { default: () => <div>Page not found: {name}</div> };
        }

        return page;
    },
    setup({ el, App, props }) {
        // Extract user from Inertia's initial page props
        const initialUser = props.initialPage?.props?.auth?.user || null;

        createRoot(el).render(
            <ProviderWrapper initialUser={initialUser}>
                <App {...props} />
            </ProviderWrapper>
        );
    },
    progress: false, // We're using NProgress instead
});
