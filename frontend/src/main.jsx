import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import NProgress from "nprogress";
import { router } from "@inertiajs/react";
import ProviderWrapper from "@/app/ProviderWrapper";
import "@/config"; // Load fonts
import "./styles/app.css";
import "nprogress/nprogress.css";

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
            return (
                pages["./Pages/Errors/NotFound.jsx"] ||
                pages["./Pages/Dashboard.jsx"]
            );
        }

        return page;
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <ProviderWrapper>
                <App {...props} />
            </ProviderWrapper>
        );
    },
    progress: false, // We're using NProgress instead
});
