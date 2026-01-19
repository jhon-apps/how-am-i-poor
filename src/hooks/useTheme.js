import { useEffect, useState } from "react"

const KEY = "how-am-i-poor-theme" // "light" | "dark"

function readTheme() {
    const v = localStorage.getItem(KEY)
    return v === "light" || v === "dark" ? v : "dark"
}

function applyTheme(theme) {
    const html = document.documentElement
    html.classList.remove("light", "dark")
    html.classList.add(theme)
}

export default function useTheme() {
    const [theme, setThemeState] = useState(readTheme)

    useEffect(() => {
        applyTheme(theme)
    }, [theme])

    const setTheme = (next) => {
        setThemeState(next)
        localStorage.setItem(KEY, next)
        applyTheme(next)
    }

    const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

    return { theme, setTheme, toggleTheme }
}
