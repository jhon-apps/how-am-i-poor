import { useEffect, useMemo, useState } from "react"
import { User } from "lucide-react"

import GlobalTopBar from "@/components/layout/GlobalTopBar"

import PremiumUpsellDialog from "@/components/ui/PremiumUpsellDialog"
import BillingNotReadyDialog from "@/components/ui/BillingNotReadyDialog"
import PremiumHub from "@/components/premium/PremiumHub"

const USER_KEY = "howamipoor:user:v1"
const PREMIUM_EVENT = "haip:openPremium"

function safeParse(raw, fallback) {
    try {
        return JSON.parse(raw) ?? fallback
    } catch {
        return fallback
    }
}

function readUser() {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return { name: "" }
    const u = safeParse(raw, { name: "" })
    return { name: typeof u?.name === "string" ? u.name : "" }
}

function writeUser(user) {
    localStorage.setItem(
        USER_KEY,
        JSON.stringify({
            name: user?.name ?? "",
            updatedAt: Date.now(),
        })
    )
}

export default function Profile() {
    const initial = useMemo(() => readUser(), [])
    const [name, setName] = useState(initial.name)
    const [savedAt, setSavedAt] = useState(null)

    // premium modal state
    const [premiumUpsellOpen, setPremiumUpsellOpen] = useState(false)
    const [premiumReason, setPremiumReason] = useState("premium")
    const [premiumHubOpen, setPremiumHubOpen] = useState(false)
    const [billingNotReadyOpen, setBillingNotReadyOpen] = useState(false)

    // sync da localStorage (altre tab / reload)
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key !== USER_KEY) return
            const u = readUser()
            setName(u.name)
        }
        window.addEventListener("storage", onStorage)
        return () => window.removeEventListener("storage", onStorage)
    }, [])

    // ✅ listener Premium dalla top bar / menu
    useEffect(() => {
        const onPremium = (e) => {
            const reason = e?.detail?.reason || "premium"
            setPremiumReason(reason)
            setPremiumUpsellOpen(true)
        }
        window.addEventListener(PREMIUM_EVENT, onPremium)
        return () => window.removeEventListener(PREMIUM_EVENT, onPremium)
    }, [])

    const trimmed = name.trim()
    const isValid = trimmed.length === 0 || trimmed.length >= 2
    const muted = "text-[rgb(var(--muted-fg))]"

    const handleSave = () => {
        if (!isValid) return
        writeUser({ name: trimmed })
        setSavedAt(Date.now())
    }

    const handleClear = () => {
        setName("")
        writeUser({ name: "" })
        setSavedAt(Date.now())
    }

    return (
        <div className="min-h-[100dvh] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
            <GlobalTopBar page="Profilo" />

            <main className="px-4 pb-10 pt-3">
                <div className="max-w-2xl mx-auto space-y-4">
                    <div className="rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl border bg-[rgb(var(--card-2))] border-[rgb(var(--border))] flex items-center justify-center">
                                <User className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-extrabold tracking-tight">Nome profilo</p>
                                <p className={`text-xs ${muted}`}>Usato solo in locale.</p>
                            </div>
                        </div>

                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Es. Jhon"
                            className={[
                                "mt-4 w-full rounded-2xl border px-4 py-3 text-sm outline-none shadow-sm",
                                "bg-[rgb(var(--card))] border-[rgb(var(--border))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                                !isValid ? "border-red-500/70" : "",
                            ].join(" ")}
                            maxLength={40}
                            inputMode="text"
                            autoComplete="off"
                        />

                        {!isValid ? (
                            <p className="mt-2 text-xs text-red-400">Se lo inserisci, almeno 2 caratteri.</p>
                        ) : null}

                        <div className="mt-4 flex items-center gap-2">
                            <button
                                onClick={handleSave}
                                disabled={!isValid}
                                className="rounded-2xl border px-4 py-2 text-sm bg-[rgb(var(--card))] border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))] disabled:opacity-50"
                            >
                                Salva
                            </button>

                            <button
                                onClick={handleClear}
                                className="rounded-2xl border px-4 py-2 text-sm bg-[rgb(var(--card))] border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]"
                            >
                                Rimuovi
                            </button>

                            {savedAt ? (
                                <span className={`ml-auto text-xs ${muted}`}>Salvato</span>
                            ) : (
                                <span className={`ml-auto text-xs ${muted}`}> </span>
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] p-5">
                        <p className="text-sm font-extrabold tracking-tight">Anteprima</p>
                        <p className={`mt-2 text-sm ${muted}`}>
                            {trimmed
                                ? `Ok ${trimmed}, vediamo come stai andando.`
                                : "Ok, senza nome. Rimani anonimo."}
                        </p>
                    </div>
                </div>
            </main>

            <PremiumUpsellDialog
                open={premiumUpsellOpen}
                reason={premiumReason}
                onClose={() => setPremiumUpsellOpen(false)}
                onConfirm={() => setPremiumHubOpen(true)}
            />

            <PremiumHub
                open={premiumHubOpen}
                onClose={() => setPremiumHubOpen(false)}
                onBillingNotReady={() => setBillingNotReadyOpen(true)}
            />

            <BillingNotReadyDialog open={billingNotReadyOpen} onClose={() => setBillingNotReadyOpen(false)} />

            <div className="pb-[env(safe-area-inset-bottom)]" />
        </div>
    )
}
