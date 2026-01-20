import { useState } from "react"
import { BadgeCheck, Lock, Search, CalendarClock, FileSpreadsheet, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import BillingNotReadyDialog from "@/components/ui/BillingNotReadyDialog"
import { BILLING_READY } from "@/config/billing"

export default function PremiumHub({ open, onClose, isPremium, onSubscribe }) {
    const [notReadyOpen, setNotReadyOpen] = useState(false)
    if (!open) return null

    const handleSubscribe = () => {
        if (!BILLING_READY) {
            setNotReadyOpen(true)
            return
        }
        onSubscribe?.()
        onClose?.()
    }

    const overlay = "bg-black/60"
    const card = "bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const soft = "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
    const muted = "text-[rgb(var(--muted-fg))]"

    return (
        <>
            <div className={`fixed inset-0 z-50 ${overlay}`}>
                <div className="mx-auto max-w-3xl h-full px-4 py-6 overflow-y-auto text-[rgb(var(--fg))]">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-xl font-extrabold">Premium</h1>

                        <button
                            onClick={onClose}
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
                                    <FileSpreadsheet className={`h-4 w-4 ${muted}`} />
                                    Export Excel (in arrivo)
                                </li>
                                <li className="flex gap-3">
                                    <Lock className={`h-4 w-4 ${muted}`} />
                                    Rimozione totale della pubblicità
                                </li>
                            </ul>
                        </div>

                        <div className={`rounded-3xl border p-6 flex items-center justify-between shadow-sm ${soft}`}>
                            <div>
                                <p className="font-semibold">5,00 € / mese</p>
                                <p className={`text-xs ${muted}`}>Annulla quando vuoi</p>
                            </div>

                            {isPremium ? (
                                <span className="text-emerald-700 font-semibold">Premium attivo ✓</span>
                            ) : (
                                <Button onClick={handleSubscribe}>
                                   <p className="text-amber-300" >Sblocca Premium </p>
                                </Button>
                            )}
                        </div>

                        <div className={`pt-4 text-center text-xs ${muted} space-y-2`}>
                            {!BILLING_READY && <p>Billing non ancora attivo in questa versione.</p>}
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
                </div>
            </div>

            <BillingNotReadyDialog open={notReadyOpen} onClose={() => setNotReadyOpen(false)} />
        </>
    )
}
