import App from "../components/App.vue"
import "../css/houchi.scss"
import "@egjs/vue3-flicking/dist/flicking.css";
import { createApp } from 'vue'

createApp(App, {
    isGrand: true,
    isHouchi: true
}).mount("#app")
