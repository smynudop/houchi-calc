/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from "@vitejs/plugin-vue"

export default defineConfig({
    plugins: [vue()],
    server: {
        host: "0.0.0.0",
        port: 7638
    },
    base: "./",
    root: "./src",
    publicDir: "../public",
    build: {
        outDir: "../dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                skill_grand: "./src/skill_grand.html",
                skill_normal: "./src/skill_normal.html",
                gachi_grand: "./src/gachi_grand.html"
            }
        }
    },
    test: {
        include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
    }
})