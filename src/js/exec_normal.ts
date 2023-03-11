import App from "../components/App.vue"
import "../css/houchi.scss"
import { createApp } from 'vue'

createApp(App, {
    isGrand: false,
    isHouchi: true
}).mount("#app")