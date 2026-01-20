import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Lock, Search, CalendarClock, FileSpreadsheet, BadgeCheck } from "lucide-react"
import BillingNotReadyDialog from "@/components/ui/BillingNotReadyDialog"
import { BILLING_READY } from "@/config/billing"

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

    const card = "bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const soft = "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
    const muted = "text-[rgb(var(--muted-fg))]"

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sblocca Premium</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* top notice */}
                        <div className={`rounded-2xl border p-4 shadow-sm ${card}`}>
                            <div className="flex items-start gap-3">
                                <div className={`h-9 w-9 rounded-xl border flex items-center justify-center ${soft}`}>
                                    <Lock className={`h-4 w-4 ${muted}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">
                                        Funzione bloccata: {reasonTitle}
                                    </p>
                                    <p className={`mt-1 text-sm ${muted}`}>
                                        Meno blur. Più verità. Zero pubblicità.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* features */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <Search className={`h-4 w-4 ${muted}`} />
                                <span>Ricerca movimenti</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <CalendarClock className={`h-4 w-4 ${muted}`} />
                                <span>Storico completo (oltre 30 giorni)</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <FileSpreadsheet className={`h-4 w-4 ${muted}`} />
                                <span>Export Excel (in arrivo)</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <BadgeCheck className={`h-4 w-4 ${muted}`} />
                                <span>Niente pubblicità</span>
                            </div>
                        </div>

                        {/* price box */}
                        <div className={`rounded-2xl border p-4 flex items-center justify-between shadow-sm ${soft}`}>
                            <div>
                                <p className="text-sm font-semibold">5,00 € / mese</p>
                                <p className={`text-xs ${muted}`}>Annulla quando vuoi</p>
                            </div>
                            <div className={`text-xs ${muted}`}>Google Play</div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={onClose}>
                                Non ora
                            </Button>
                            <Button onClick={handleSubscribe}>
                                Sblocca Premium
                            </Button>
                        </div>

                        {!BILLING_READY && (
                            <p className={`text-xs ${muted}`}>
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
