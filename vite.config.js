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
        chunkSizeWarningLimit: 500,
        rollupOptions: {
            input: resolve("./frontend/src/main.jsx"),
            output: {
                manualChunks(id) {
                    // Node modules chunking
                    if (id.includes('node_modules')) {
                        // React core
                        if (id.includes('react-dom')) {
                            return 'vendor-react-dom';
                        }
                        if (id.includes('/react/') || id.includes('react-is') || id.includes('scheduler')) {
                            return 'vendor-react';
                        }
                        
                        // MUI - split icons from core (icons are huge)
                        if (id.includes('@mui/icons-material')) {
                            return 'vendor-mui-icons';
                        }
                        if (id.includes('@mui/material') || id.includes('@mui/system') || id.includes('@mui/styled-engine')) {
                            return 'vendor-mui';
                        }
                        if (id.includes('@mui/base') || id.includes('@mui/utils')) {
                            return 'vendor-mui-base';
                        }
                        
                        // Animation
                        if (id.includes('framer-motion')) {
                            return 'vendor-motion';
                        }
                        
                        // Charts
                        if (id.includes('recharts') || id.includes('d3-')) {
                            return 'vendor-charts';
                        }
                        
                        // Inertia
                        if (id.includes('@inertiajs')) {
                            return 'vendor-inertia';
                        }
                        
                        // DnD Kit
                        if (id.includes('@dnd-kit')) {
                            return 'vendor-dnd';
                        }
                        
                        // Rich text editor
                        if (id.includes('tiptap') || id.includes('prosemirror')) {
                            return 'vendor-editor';
                        }
                        
                        // Video players - lazy load these
                        if (id.includes('hls.js')) {
                            return 'vendor-hls';
                        }
                        if (id.includes('dashjs')) {
                            return 'vendor-dash';
                        }
                        
                        // Lodash
                        if (id.includes('lodash')) {
                            return 'vendor-lodash';
                        }
                        
                        // Emotion (CSS-in-JS for MUI)
                        if (id.includes('@emotion')) {
                            return 'vendor-emotion';
                        }
                    }
                    
                    // App code chunking - split by feature
                    if (id.includes('/features/course-builder/')) {
                        return 'feature-course-builder';
                    }
                    if (id.includes('/features/quizzes/')) {
                        return 'feature-quizzes';
                    }
                    if (id.includes('/pages/dashboard/')) {
                        return 'pages-dashboard';
                    }
                    if (id.includes('/pages/student/')) {
                        return 'pages-student';
                    }
                    if (id.includes('/pages/instructor/')) {
                        return 'pages-instructor';
                    }
                    if (id.includes('/pages/admin/')) {
                        return 'pages-admin';
                    }
                },
            },
        },
    },
}));
