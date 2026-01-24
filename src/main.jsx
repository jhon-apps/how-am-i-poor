import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./index.css"

const KEY = "how-am-i-poor-theme"

function bootstrapTheme() {
    try {
        const v = localStorage.getItem(KEY)
        const theme = v === "light" || v === "dark" ? v : "dark"

        const html = document.documentElement
        html.classList.remove("light", "dark")
        html.classList.add(theme)

        html.style.colorScheme = theme
    } catch {
    }
}

bootstrapTheme()

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
