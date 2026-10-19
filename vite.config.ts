import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The Bun server (real or demo) that the dev server proxies the API to
const api = `http://localhost:${process.env.API_PORT ?? 3001}`;

export default defineConfig({
    root: "web",
    plugins: [react()],
    build: { outDir: "dist", emptyOutDir: true },
    server: {
        proxy: { "/api": api, "/dev/api": api, "/health": api },
    },
});
