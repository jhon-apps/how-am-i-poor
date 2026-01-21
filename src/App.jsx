import { useEffect, useState } from "react"
import Home from "@/pages/Home"
import Settings from "@/pages/Settings"
import Onboarding from "@/pages/Onboarding"
import Recurring from "@/pages/Recurring"
import useAppLifecycle from "@/hooks/useAppLifecycle"
import useNotificationActions from "@/hooks/useNotificationActions"

const ONBOARDING_KEY = "howamipoor:onboardingDone:v1"

function onboardingDone() {
    try {
        const raw = localStorage.getItem(ONBOARDING_KEY)
        if (!raw) return false
        const p = JSON.parse(raw)
        return !!p?.done
    } catch {
        return false
    }
}

function getRouteFromHash() {
    const h = window.location.hash || "#/"
    if (h.startsWith("#/settings")) return "settings"
    if (h.startsWith("#/onboarding")) return "onboarding"
    if (h.startsWith("#/recurring")) return "recurring"
    return "home"
}

export default function App() {
    useAppLifecycle()
    useNotificationActions()

    const [route, setRoute] = useState(getRouteFromHash())
    const [showFirstRunOnboarding, setShowFirstRunOnboarding] = useState(!onboardingDone())

    useEffect(() => {
        const onHashChange = () => setRoute(getRouteFromHash())
        window.addEventListener("hashchange", onHashChange)
        return () => window.removeEventListener("hashchange", onHashChange)
    }, [])

    if (showFirstRunOnboarding) {
        return (
            <Onboarding
                onFinish={() => {
                    setShowFirstRunOnboarding(false)
                    window.location.hash = "#/"
                }}
            />
        )
    }

    if (route === "onboarding") {
        return (
            <Onboarding
                mode="manual"
                onFinish={() => {
                    window.location.hash = "#/settings"
                }}
            />
        )
    }

    // ✅ FIX: ricorrenti torna alla HOME
    if (route === "recurring") {
        return <Recurring onBack={() => (window.location.hash = "#/")} />
    }

    if (route === "settings") {
        return <Settings onBack={() => (window.location.hash = "#/")} />
    }

    return <Home onOpenSettings={() => (window.location.hash = "#/settings")} />
}
