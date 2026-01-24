import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

const ONBOARDING_KEY = "howamipoor:onboardingDone:v1"

export default function Tutorial() {
    const [done, setDone] = useState(false)

    useEffect(() => {
        // reset immediato e redirect
        try {
            localStorage.removeItem(ONBOARDING_KEY)
        } catch {
            // ignore
        }

        // forza refresh del routing hash
        window.location.hash = "#/onboarding"
        setDone(true)
    }, [])

    const muted = "text-[rgb(var(--muted-fg))]"

    // Questo screen non si vede quasi mai (redirect immediato),
    // ma lo teniamo per sicurezza se qualcosa blocca l’hash change.
    return (
        <div
            className="min-h-[100dvh] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]"
            style={{ paddingTop: "max(env(safe-area-inset-top), 24px)" }}
        >
            <div className="px-4 py-4">
                <h1 className="text-lg font-extrabold tracking-tight">Tutorial</h1>
                <p className={`mt-1 text-sm ${muted}`}>
                    {done ? "Riavvio tutorial…" : "Resetto lo stato…"}
                </p>

                <div className="mt-4">
                    <Button className="rounded-2xl" onClick={() => (window.location.hash = "#/onboarding")}>
                        Vai al tutorial
                    </Button>

                    <Button
                        variant="outline"
                        className="rounded-2xl ml-2"
                        onClick={() => (window.location.hash = "#/")}
                    >
                        Torna Home
                    </Button>
                </div>
            </div>

            <div className="pb-[env(safe-area-inset-bottom)]" />
        </div>
    )
}
