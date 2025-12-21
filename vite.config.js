import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ command }) => ({
    plugins: [react()],
    root: resolve("./frontend"),
    // Use '/' for dev, '/static/' for production build
    base: command === "serve" ? "/" : "/static/",
    server: {
        host: "localhost",
        port: 5173,
        open: false,
        watch: {
            usePolling: true,
            disableGlobbing: false,
        },
        // Allow Django to access Vite dev server
        cors: true,
    },
    resolve: {
        extensions: [".js", ".jsx", ".json"],
        alias: {
            "@": resolve("./frontend/src"),
        },
    },
    build: {
        outDir: resolve("./static/dist"),
        assetsDir: "",
        manifest: true,
        emptyOutDir: true,
        rollupOptions: {
            input: resolve("./frontend/src/main.jsx"),
        },
    },
}));
