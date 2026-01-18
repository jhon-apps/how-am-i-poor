import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Lock, Search, CalendarClock, FileSpreadsheet, BadgeCheck } from "lucide-react"
import BillingNotReadyDialog from "@/components/ui/BillingNotReadyDialog"
import { BILLING_READY } from "@/config/billing"
import { useState } from "react"

export default function PremiumUpsellDialog({ open, onClose, onConfirm, reason = "premium" }) {
    const [notReadyOpen, setNotReadyOpen] = useState(false)

    const reasonTitle =
        reason === "search" ? "Ricerca movimenti" : reason === "history" ? "Storico completo" : "Premium"

    const handleSubscribe = () => {
        if (!BILLING_READY) {
            setNotReadyOpen(true)
            return
        }
        onConfirm?.()
    }

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sblocca Premium</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
                            <div className="flex items-start gap-3">
                                <div className="h-9 w-9 rounded-xl bg-slate-800/60 flex items-center justify-center">
                                    <Lock className="h-4 w-4 text-slate-100" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-100">Funzione bloccata: {reasonTitle}</p>
                                    <p className="mt-1 text-sm text-slate-300">Meno blur. Più verità. Zero pubblicità.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-slate-200">
                                <Search className="h-4 w-4 text-slate-300" />
                                <span>Ricerca movimenti</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-200">
                                <CalendarClock className="h-4 w-4 text-slate-300" />
                                <span>Storico completo (oltre 30 giorni)</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-200">
                                <FileSpreadsheet className="h-4 w-4 text-slate-300" />
                                <span>Export Excel (in arrivo)</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-200">
                                <BadgeCheck className="h-4 w-4 text-slate-300" />
                                <span>Niente pubblicità</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-100">5,00 € / mese</p>
                                <p className="text-xs text-slate-400">Annulla quando vuoi</p>
                            </div>
                            <div className="text-xs text-slate-500">Google Play</div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={onClose}>
                                Non ora
                            </Button>
                            <Button onClick={handleSubscribe} className="bg-slate-100 text-slate-900 hover:bg-white">
                                Sblocca Premium
                            </Button>
                        </div>

                        {!BILLING_READY && (
                            <p className="text-xs text-slate-500">
                                Nota: Billing non ancora attivo in questa versione.
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <BillingNotReadyDialog open={notReadyOpen} onClose={() => setNotReadyOpen(false)} />
        </>
    )
}
