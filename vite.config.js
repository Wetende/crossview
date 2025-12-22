import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ command }) => ({
    plugins: [react()],
    root: resolve("./frontend"),
    // Use '/' for dev, '/static/dist/' for production build
    base: command === "serve" ? "/" : "/static/dist/",
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
        // Allow serving files from node_modules
        fs: {
            allow: [
                resolve("./frontend"),
                resolve("./node_modules"),
            ],
        },
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
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            input: resolve("./frontend/src/main.jsx"),
            output: {
                manualChunks: {
                    // Vendor chunks
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-mui': ['@mui/material', '@mui/icons-material'],
                    'vendor-motion': ['framer-motion'],
                    'vendor-charts': ['recharts'],
                    'vendor-inertia': ['@inertiajs/react'],
                },
            },
        },
    },
}));
