import { useMemo, useState } from "react"
import { Beaker, AlertTriangle, Download, Trash2, Crown } from "lucide-react"

import GlobalTopBar from "@/components/layout/GlobalTopBar"
import { Button } from "@/components/ui/button"
import { APP_CONFIG } from "@/config/config"

const TX_KEY = "howamipoor:transactions:v1"
const REC_KEY = "howamipoor:recurring:v1"
const PREMIUM_KEY = "howamipoor:premium:v1"
const SETTINGS_KEY = "howamipoor:settings:v1"
const USER_KEY = "howamipoor:user:v1"
const PENDING_KEY = "howamipoor:pendingAction:v1"
const ONBOARDING_KEY = "howamipoor:onboardingDone:v1"

const PREMIUM_CHANGED_EVENT = "haip:premium:changed"

function safeParse(raw, fallback) {
    try {
        return JSON.parse(raw) ?? fallback
    } catch {
        return fallback
    }
}

function downloadText(filename, text) {
    const blob = new Blob([text], { type: "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

export default function DevTools() {
    const [status, setStatus] = useState("")

    const surface = "rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const soft = "rounded-2xl border bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
    const muted = "text-[rgb(var(--muted-fg))]"

    const counts = useMemo(() => {
        const tx = safeParse(localStorage.getItem(TX_KEY) || "[]", [])
        const rec = safeParse(localStorage.getItem(REC_KEY) || "[]", [])
        const prem = safeParse(localStorage.getItem(PREMIUM_KEY) || "null", null)
        return {
            txCount: Array.isArray(tx) ? tx.length : 0,
            recCount: Array.isArray(rec) ? rec.length : 0,
            premiumSource: prem?.source || "none",
        }
    }, [status])

    const setPremiumDev = (active) => {
        if (active) {
            localStorage.setItem(PREMIUM_KEY, JSON.stringify({ source: "dev", updatedAt: Date.now() }))
        } else {
            localStorage.setItem(PREMIUM_KEY, JSON.stringify({ source: "none", updatedAt: Date.now() }))
        }
        window.dispatchEvent(new CustomEvent(PREMIUM_CHANGED_EVENT))
    }

    const clearKeys = (keys) => {
        for (const k of keys) localStorage.removeItem(k)
    }

    if (!APP_CONFIG.DEV_TOOLS_ENABLED) {
        return (
            <div className="min-h-[100dvh] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
                <GlobalTopBar page="Dev Tools" />
                <main className="px-4 pb-10 pt-3">
                    <div className="max-w-2xl mx-auto space-y-4">
                        <div className={`${surface} p-5`}>
                            <p className="text-sm font-extrabold tracking-tight">Dev tools disabilitati</p>
                            <p className={`mt-2 text-sm ${muted}`}>
                                `DEV_TOOLS_ENABLED` è false. In release deve restare così.
                            </p>
                        </div>
                    </div>
                </main>
                <div className="pb-[env(safe-area-inset-bottom)]" />
            </div>
        )
    }

    return (
        <div className="min-h-[100dvh] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
            <GlobalTopBar page="Dev Tools" />

            <main className="px-4 pb-10 pt-3">
                <div className="max-w-2xl mx-auto space-y-4">
                    <div className={`${surface} p-4`}>
                        <div className="flex items-center gap-2">
                            <div className={`h-10 w-10 rounded-2xl border ${soft} flex items-center justify-center`}>
                                <Beaker className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold">Developer</p>
                                <p className={`text-xs ${muted}`}>Strumenti temporanei per test.</p>
                            </div>
                        </div>

                        <div className={`mt-3 text-xs ${muted}`}>
                            Movimenti: <b>{counts.txCount}</b> · Ricorrenti: <b>{counts.recCount}</b> · Premium:{" "}
                            <b>{counts.premiumSource}</b>
                        </div>

                        {status ? <p className={`mt-2 text-xs ${muted}`}>{status}</p> : null}

                        {/* SEED */}
                        <div className="mt-4 grid gap-2">
                            <p className="text-sm font-extrabold tracking-tight">Seed</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    onClick={async () => {
                                        setStatus("Genero seed 1200…")
                                        const { seedTransactions } = await import("@/dev/seedTransactions")
                                        const n = seedTransactions(1200)
                                        setStatus(`Seed creato: ${n} movimenti. Reload…`)
                                        setTimeout(() => location.reload(), 250)
                                    }}
                                >
                                    Seed 1200
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={async () => {
                                        setStatus("Genero seed 50…")
                                        const { seedTransactions } = await import("@/dev/seedTransactions")
                                        const n = seedTransactions(50)
                                        setStatus(`Seed creato: ${n} movimenti. Reload…`)
                                        setTimeout(() => location.reload(), 250)
                                    }}
                                >
                                    Seed 50
                                </Button>
                            </div>
                        </div>

                        {/* PREMIUM DEV */}
                        <div className="mt-4 grid gap-2">
                            <p className="text-sm font-extrabold tracking-tight">Premium (DEV)</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    onClick={() => {
                                        setPremiumDev(true)
                                        setStatus("Premium DEV attivato. Reload…")
                                        setTimeout(() => location.reload(), 150)
                                    }}
                                    className="inline-flex items-center gap-2"
                                >
                                    <Crown className="h-4 w-4" />
                                    Enable
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setPremiumDev(false)
                                        setStatus("Premium disattivato. Reload…")
                                        setTimeout(() => location.reload(), 150)
                                    }}
                                    className="inline-flex items-center gap-2"
                                >
                                    <Crown className="h-4 w-4" />
                                    Disable
                                </Button>
                            </div>
                        </div>

                        {/* EXPORT */}
                        <div className="mt-4 grid gap-2">
                            <p className="text-sm font-extrabold tracking-tight">Export</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const raw = localStorage.getItem(TX_KEY) || "[]"
                                        downloadText(`haip-transactions-${Date.now()}.json`, raw)
                                        setStatus("Export transazioni scaricato.")
                                        setTimeout(() => setStatus(""), 2000)
                                    }}
                                    className="inline-flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Export movimenti JSON
                                </Button>
                            </div>
                        </div>

                        {/* CLEAR */}
                        <div className="mt-4 grid gap-2">
                            <p className="text-sm font-extrabold tracking-tight">Clear</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        clearKeys([TX_KEY])
                                        setStatus("Movimenti cancellati. Reload…")
                                        setTimeout(() => location.reload(), 200)
                                    }}
                                    className="inline-flex items-center gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Clear movimenti
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        clearKeys([REC_KEY])
                                        setStatus("Ricorrenti cancellati. Reload…")
                                        setTimeout(() => location.reload(), 200)
                                    }}
                                    className="inline-flex items-center gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Clear ricorrenti
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        clearKeys([SETTINGS_KEY, USER_KEY, PENDING_KEY])
                                        setStatus("Settings/User/Pending cancellati. Reload…")
                                        setTimeout(() => location.reload(), 200)
                                    }}
                                    className="inline-flex items-center gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Clear settings/user
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        clearKeys([ONBOARDING_KEY])
                                        setStatus("Onboarding resettato (riparte).")
                                        setTimeout(() => setStatus(""), 2000)
                                    }}
                                    className="inline-flex items-center gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Reset onboarding
                                </Button>
                            </div>

                            <div className="mt-2">
                                <Button
                                    onClick={() => {
                                        // wipe soft: solo chiavi HAIP note
                                        clearKeys([TX_KEY, REC_KEY, PREMIUM_KEY, SETTINGS_KEY, USER_KEY, PENDING_KEY, ONBOARDING_KEY])
                                        setStatus("Wipe completo HAIP. Reload…")
                                        setTimeout(() => location.reload(), 200)
                                    }}
                                    className="inline-flex items-center gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    WIPE ALL HAIP DATA
                                </Button>
                            </div>
                        </div>

                        <div className="mt-4 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />
                            <p className={`text-xs ${muted}`}>
                                Questi tool devono essere **spenti in release** (`DEV_TOOLS_ENABLED=false`).
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <div className="pb-[env(safe-area-inset-bottom)]" />
        </div>
    )
}
