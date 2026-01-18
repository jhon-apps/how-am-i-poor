import { useState } from "react"
import {
    BadgeCheck,
    Lock,
    Search,
    CalendarClock,
    FileSpreadsheet,
    X,
} from "lucide-react"
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

    return (
        <>
            <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur">
                <div className="mx-auto max-w-3xl h-full px-4 py-6 overflow-y-auto text-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-xl font-extrabold">Premium</h1>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-200" aria-label="Chiudi">
                            <X />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <header className="text-center space-y-2">
                            <p className="text-lg font-semibold">Meno blur. Più verità. Zero pubblicità.</p>
                            <p className="text-sm text-slate-400">Supporta lo sviluppo e sblocca tutte le funzioni.</p>
                        </header>

                        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <BadgeCheck className="h-6 w-6 text-emerald-400" />
                                <p className="font-semibold">Cosa ottieni con Premium</p>
                            </div>

                            <ul className="space-y-3 text-sm">
                                <li className="flex gap-3">
                                    <Search className="h-4 w-4 text-slate-300" />
                                    Ricerca completa dei movimenti
                                </li>
                                <li className="flex gap-3">
                                    <CalendarClock className="h-4 w-4 text-slate-300" />
                                    Storico completo (oltre 30 giorni)
                                </li>
                                <li className="flex gap-3">
                                    <FileSpreadsheet className="h-4 w-4 text-slate-300" />
                                    Export Excel (in arrivo)
                                </li>
                                <li className="flex gap-3">
                                    <Lock className="h-4 w-4 text-slate-300" />
                                    Rimozione totale della pubblicità
                                </li>
                            </ul>
                        </div>

                        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 flex items-center justify-between">
                            <div>
                                <p className="font-semibold">5,00 € / mese</p>
                                <p className="text-xs text-slate-400">Annulla quando vuoi</p>
                            </div>

                            {isPremium ? (
                                <span className="text-emerald-400 font-semibold">Premium attivo ✓</span>
                            ) : (
                                <Button onClick={handleSubscribe} className="bg-slate-100 text-slate-900 hover:bg-white">
                                    Sblocca Premium
                                </Button>
                            )}
                        </div>

                        <div className="pt-4 text-center text-xs text-slate-500 space-y-2">
                            {!BILLING_READY && <p>Billing non ancora attivo in questa versione.</p>}
                            <a
                                href="https://jhon-apps.github.io/how-am-i-poor/privacy.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-slate-300"
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
