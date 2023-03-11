import { defineConfig } from 'vite'
import vue from "@vitejs/plugin-vue"

export default defineConfig({
    plugins: [vue()],
    server: {

    },
    root: "./src",
    publicDir: "../public",
    build: {
        rollupOptions: {
            input: {
                skill_grand: "./src/skill_grand.html",
                skill_normal: "./src/skill_normal.html",
                gachi_grand: ".src/gachi_grand.html"
            }
        }
    }
})