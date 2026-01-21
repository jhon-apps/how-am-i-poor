import { useEffect, useState } from "react"
import Home from "@/pages/Home"
import Settings from "@/pages/Settings"
import Onboarding from "@/pages/Onboarding"
import useAppLifecycle from "@/hooks/useAppLifecycle"

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
    return "home"
}

export default function App() {
    useAppLifecycle()

    const [route, setRoute] = useState(getRouteFromHash())
    const [showFirstRunOnboarding, setShowFirstRunOnboarding] = useState(!onboardingDone())

    useEffect(() => {
        const onHashChange = () => setRoute(getRouteFromHash())
        window.addEventListener("hashchange", onHashChange)
        return () => window.removeEventListener("hashchange", onHashChange)
    }, [])

    // First run onboarding (solo la prima volta)
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

    // Manual onboarding route (da Settings)
    if (route === "onboarding") {
        return (
            <Onboarding
                onFinish={() => {
                    // torna alle impostazioni
                    window.location.hash = "#/settings"
                }}
            />
        )
    }

    if (route === "settings") {
        return <Settings onBack={() => (window.location.hash = "#/")} />
    }

    return <Home onOpenSettings={() => (window.location.hash = "#/settings")} />
}
