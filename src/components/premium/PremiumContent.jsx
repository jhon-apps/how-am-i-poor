import { BadgeCheck, Lock, Search, CalendarClock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import usePremium from "@/hooks/usePremium"

/**
 * PremiumContent = UNICA sorgente di verità per:
 * - variabili di stato premium (usePremium)
 * - logica subscribe/cta/billingNotReady/dev disable
 * - UI identica
 *
 * mode:
 * - "modal": overlay + onClose richiesto (chiusura modale)
 * - "page": full page (no overlay), close → torna Home (hash "#/")
 */
export default function PremiumContent({ mode = "modal", onClose, onBillingNotReady }) {
    const { isPremium, requestPremium, meta, disablePremium } = usePremium()

    const card = "bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const soft = "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
    const muted = "text-[rgb(var(--muted-fg))]"

    const handleClose = () => {
        if (mode === "page") {
            window.location.hash = "#/"
            return
        }
        onClose?.()
    }

    const handleSubscribe = () => {
        const res = requestPremium()

        if (res?.ok) {
            handleClose()
            return
        }

        // billing non pronto / richiesto
        handleClose()
        setTimeout(() => onBillingNotReady?.(), 0)
    }

    const wrapClass =
        mode === "modal"
            ? "fixed inset-0 z-50 bg-black/60"
            : "min-h-[100dvh] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]"

    const innerClass =
        mode === "modal"
            ? "mx-auto max-w-3xl h-full px-4 py-6 overflow-y-auto text-[rgb(var(--fg))]"
            : "max-w-3xl mx-auto px-4 pb-10 text-[rgb(var(--fg))]"

    return (
        <div className={wrapClass}>
            <div
                className={innerClass}
                style={mode === "page" ? { paddingTop: "max(env(safe-area-inset-top), 24px)" } : undefined}
            >
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-extrabold">Premium</h1>

                    <button
                        onClick={handleClose}
                        className={`h-10 w-10 rounded-xl inline-flex items-center justify-center ${muted} hover:bg-[rgb(var(--muted))] hover:opacity-90`}
                        aria-label="Chiudi"
                        title="Chiudi"
                    >
                        <X />
                    </button>
                </div>

                <div className={`rounded-3xl border p-6 space-y-4 shadow-sm ${card}`}>
                    <header className="text-center space-y-2">
                        <p className="text-lg font-semibold">Meno blur. Più verità. Zero pubblicità.</p>
                        <p className={`text-sm ${muted}`}>Supporta lo sviluppo e sblocca tutte le funzioni.</p>
                    </header>

                    <div className={`rounded-3xl border p-6 space-y-4 shadow-sm ${card}`}>
                        <div className="flex items-center gap-3">
                            <BadgeCheck className="h-6 w-6 text-emerald-700" />
                            <p className="font-semibold">Cosa ottieni con Premium</p>
                        </div>

                        <ul className="space-y-3 text-sm">
                            <li className="flex gap-3">
                                <Search className={`h-4 w-4 ${muted}`} />
                                Ricerca completa dei movimenti
                            </li>
                            <li className="flex gap-3">
                                <CalendarClock className={`h-4 w-4 ${muted}`} />
                                Storico completo (oltre 30 giorni)
                            </li>
                            <li className="flex gap-3">
                                <Lock className={`h-4 w-4 ${muted}`} />
                                Rimozione totale della pubblicità
                            </li>
                        </ul>
                    </div>

                    <div className={`rounded-3xl border p-6 flex items-center justify-between shadow-sm ${soft}`}>
                        <div>
                            <p className="font-semibold">7,00 € / mese</p>
                            <p className={`text-xs ${muted}`}>Annulla quando vuoi</p>
                        </div>

                        {isPremium ? (
                            <span className="text-emerald-700 font-semibold">
                                Premium attivo ✓ <span className={`ml-2 text-xs ${muted}`}>({meta.source})</span>
                            </span>
                        ) : (
                            <Button onClick={handleSubscribe}>
                                <p className="text-amber-300">Sblocca Premium</p>
                            </Button>
                        )}
                    </div>

                    {meta.canSimulate && isPremium && (
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={disablePremium}>
                                Disattiva Premium (DEV)
                            </Button>
                        </div>
                    )}

                    <div className={`pt-4 text-center text-xs ${muted} space-y-2`}>
                        {!meta.billingReady && <p>Billing non ancora attivo in questa versione.</p>}
                        <a
                            href="https://jhon-apps.github.io/how-am-i-poor/privacy.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:opacity-80"
                        >
                            Privacy Policy
                        </a>
                    </div>
                </div>

                {mode === "page" ? <div className="pb-[env(safe-area-inset-bottom)]" /> : null}
            </div>
        </div>
    )
}
