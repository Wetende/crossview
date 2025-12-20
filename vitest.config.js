import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./frontend/src/test/setup.js"],
        include: ["frontend/src/**/*.test.{js,jsx}"],
        coverage: {
            reporter: ["text", "json", "html"],
            include: ["frontend/src/**/*.{js,jsx}"],
            exclude: ["frontend/src/test/**"],
        },
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "./frontend/src"),
        },
    },
});
