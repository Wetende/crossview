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
        // Main bundle will be large but that's better than broken circular deps
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
            input: resolve("./frontend/src/main.jsx"),
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) {
                        return; // Let Rollup handle app code
                    }
                    
                    // Only split truly independent large libraries
                    // Video players don't depend on React/MUI at all
                    if (id.includes('hls.js')) {
                        return 'vendor-hls';
                    }
                    if (id.includes('dashjs')) {
                        return 'vendor-dash';
                    }
                    
                    // Rich text editor is also fairly independent
                    if (id.includes('tiptap') || id.includes('prosemirror')) {
                        return 'vendor-editor';
                    }
                    
                    // Charts are independent
                    if (id.includes('recharts') || id.includes('d3-')) {
                        return 'vendor-charts';
                    }
                    
                    // Framer motion is independent
                    if (id.includes('framer-motion')) {
                        return 'vendor-motion';
                    }
                    
                    // Let everything else (React, MUI, Inertia, etc.) stay together
                    // to avoid circular dependency issues
                },
            },
        },
    },
}));
