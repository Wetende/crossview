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
            onwarn(warning, warn) {
                // Suppress the "node:module externalized" warning from Vite internals
                if (
                    warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
                    (warning.message && warning.message.includes('has been externalized for browser compatibility'))
                ) {
                    return;
                }
                warn(warning);
            },
            input: resolve("./frontend/src/main.jsx"),
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) {
                        return; // Let Rollup handle app code
                    }

                    // ===== Large standalone libraries (no React deps) =====
                    
                    // Video players - completely independent
                    if (id.includes('hls.js')) {
                        return 'vendor-hls';
                    }
                    if (id.includes('dashjs')) {
                        return 'vendor-dash';
                    }
                    
                    // Tiny helper shared by react-pdf and recharts; without its
                    // own chunk it is absorbed into vendor-pdf and the analytics
                    // page downloads the whole PDF bundle for it.
                    if (id.includes('/node_modules/tiny-invariant/')) {
                        return 'vendor-invariant';
                    }

                    // PDF rendering - very large (~500kb), independent
                    if (id.includes('react-pdf') || id.includes('pdfjs-dist')) {
                        return 'vendor-pdf';
                    }
                    
                    // Charts (recharts/d3) are deliberately not a manual chunk:
                    // Rollup pulls a manual chunk's unassigned dependencies
                    // (React, CommonJS helpers) into it, which made every page
                    // load the charts bundle. Left to Rollup, charts stay with
                    // the lazily loaded analytics page.
                    
                    // Drag and drop
                    if (id.includes('@dnd-kit')) {
                        return 'vendor-dnd';
                    }
                    
                    // ===== UI & Animation libraries =====
                    
                    // Framer motion is independent
                    if (id.includes('framer-motion')) {
                        return 'vendor-motion';
                    }
                    
                    // MUI components - large UI library
                    if (id.includes('@mui/material') || id.includes('@mui/system')) {
                        return 'vendor-mui';
                    }
                    
                    // Emotion (MUI's styling engine)
                    if (id.includes('@emotion')) {
                        return 'vendor-emotion';
                    }
                    
                    // Swiper carousel
                    if (id.includes('swiper')) {
                        return 'vendor-swiper';
                    }
                    
                    // ===== Utilities & Data libraries =====
                    
                    // Date utilities
                    if (id.includes('date-fns')) {
                        return 'vendor-date';
                    }
                    
                    // Form handling
                    if (id.includes('react-hook-form')) {
                        return 'vendor-forms';
                    }
                    
                    // Data fetching
                    if (id.includes('@tanstack/react-query')) {
                        return 'vendor-query';
                    }
                    
                    // HTTP client
                    if (id.includes('axios')) {
                        return 'vendor-axios';
                    }
                    
                    // Lodash utilities (lodash-es and lodash.* packages). The
                    // CommonJS `lodash` package is only used by recharts, so it
                    // stays with the lazily loaded analytics page.
                    if (
                        id.includes('lodash') &&
                        !id.includes('/node_modules/lodash/')
                    ) {
                        return 'vendor-lodash';
                    }
                    
                    // Let everything else (React, Inertia, etc.) stay together
                    // to avoid circular dependency issues
                },
            },
        },
    },
}));
