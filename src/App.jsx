import { useEffect, useMemo, useRef, useState } from "react"
import Home from "@/pages/Home"
import Settings from "@/pages/Settings"
import Onboarding from "@/pages/Onboarding"
import Recurring from "@/pages/Recurring"
import useAppLifecycle from "@/hooks/useAppLifecycle"
import useNotificationActions from "@/hooks/useNotificationActions"

import Insights from "@/pages/Insights"
import Premium from "@/pages/Premium"
import Profile from "@/pages/Profile"
import Notifications from "@/pages/Notifications"
import Tutorial from "@/pages/Tutorial"
import About from "@/pages/About"
import DevTools from "@/pages/DevTools"

const ONBOARDING_KEY = "howamipoor:onboardingDone:v1"

function readOnboardingDone() {
    try {
        const raw = localStorage.getItem(ONBOARDING_KEY)
        if (!raw) return false
        if (raw === "true") return true
        if (raw === "false") return false
        const parsed = JSON.parse(raw)
        if (typeof parsed === "boolean") return parsed
        return !!parsed?.done
    } catch {
        return false
    }
}

function writeOnboardingDone() {
    try {
        localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ done: true, at: Date.now() }))
    } catch {
        // ignore
    }
}

function getRouteFromHash() {
    const h = String(window.location.hash || "#/").trim()
    if (h === "#/" || h === "#" || h === "") return "home"
    if (h.startsWith("#/settings")) return "settings"
    if (h.startsWith("#/onboarding")) return "onboarding"
    if (h.startsWith("#/recurring")) return "recurring"

    if (h.startsWith("#/insights")) return "insights"
    if (h.startsWith("#/premium")) return "premium"
    if (h.startsWith("#/profile")) return "profile"
    if (h.startsWith("#/notifications")) return "notifications"
    if (h.startsWith("#/tutorial")) return "tutorial"
    if (h.startsWith("#/about")) return "about"
    if (h.startsWith("#/dev")) return "dev"

    return "home"
}

function nav(path, { replace = false } = {}) {
    const hash = path.startsWith("#") ? path : `#${path}`
    if (replace) {
        window.history.replaceState(null, "", hash)
        window.dispatchEvent(new HashChangeEvent("hashchange"))
        return
    }
    window.location.hash = hash
}

export default function App() {
    useAppLifecycle()
    useNotificationActions()

    const [route, setRoute] = useState(getRouteFromHash())

    const homeCloseNewTxModalRef = useRef(null)

    const backArmedRef = useRef(false)
    const backArmTimerRef = useRef(null)

    useEffect(() => {
        const onHash = () => setRoute(getRouteFromHash())
        window.addEventListener("hashchange", onHash)
        return () => window.removeEventListener("hashchange", onHash)
    }, [])

    useEffect(() => {
        const done = readOnboardingDone()
        if (!done && route !== "onboarding") {
            nav("/onboarding", { replace: false })
        }
    }, [route])

    useEffect(() => {
        let remove = null

        const setup = async () => {
            try {
                const core = await import("@capacitor/core")
                const { Capacitor } = core
                if (!Capacitor.isNativePlatform()) return

                const app = await import("@capacitor/app")
                const AppPlugin = app.App

                const sub = AppPlugin.addListener("backButton", () => {
                    if (route === "home" && typeof homeCloseNewTxModalRef.current === "function") {
                        homeCloseNewTxModalRef.current()
                        return
                    }

                    if (route !== "home") {
                        nav("/", { replace: true })
                        return
                    }

                    if (backArmedRef.current) {
                        try {
                            AppPlugin.minimizeApp()
                        } catch {
                            // ignore
                        }
                        return
                    }

                    backArmedRef.current = true
                    if (backArmTimerRef.current) clearTimeout(backArmTimerRef.current)
                    backArmTimerRef.current = setTimeout(() => {
                        backArmedRef.current = false
                    }, 1500)
                })

                remove = () => sub.remove()
            } catch {
                // ignore
            }
        }

        setup()

        return () => {
            if (backArmTimerRef.current) clearTimeout(backArmTimerRef.current)
            if (remove) remove()
        }
    }, [route])

    const view = useMemo(() => {
        if (route === "onboarding") {
            return (
                <Onboarding
                    onDone={() => {
                        writeOnboardingDone()
                        nav("/", { replace: false })
                    }}
                    onBack={() => {
                        const done = readOnboardingDone()
                        nav(done ? "/" : "/onboarding", { replace: true })
                    }}
                />
            )
        }

        if (route === "recurring") return <Recurring onBack={() => nav("/", { replace: true })} />
        if (route === "settings") return <Settings onBack={() => nav("/", { replace: true })} />

        if (route === "insights") return <Insights />
        if (route === "premium") return <Premium />
        if (route === "profile") return <Profile />
        if (route === "notifications") return <Notifications />
        if (route === "tutorial") return <Tutorial />
        if (route === "about") return <About />
        if (route === "dev") return <DevTools />

        return (
            <Home
                registerCloseNewTxModal={(fn) => {
                    homeCloseNewTxModalRef.current = typeof fn === "function" ? fn : null
                }}
            />
        )
    }, [route])

    return view
}
