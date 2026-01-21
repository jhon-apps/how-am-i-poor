import { Lock, Search, Clock3, FileSpreadsheet, BadgeCheck } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function PremiumUpsellDialog({ open, onClose, onConfirm, reason = "premium" }) {
    const sub = "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
    const muted = "text-[rgb(var(--muted-fg))]"

    const handleUnlock = () => {
        // 1) chiudi upsell
        onClose?.()
        // 2) apri PremiumHub subito dopo (evita modali sovrapposte)
        setTimeout(() => onConfirm?.(), 0)
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
            {/* ✅ bordo “serio” visibile in dark e ok in light */}
            <DialogContent style={{ borderColor: "rgba(148,163,184,.45)" }}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-extrabold tracking-tight">Sblocca Premium</DialogTitle>
                </DialogHeader>

                <div className={`mt-5 rounded-2xl border p-4 ${sub}`}>
                    <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-2xl border flex items-center justify-center ${sub}`}>
                            <Lock className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                            <p className="font-semibold leading-tight">
                                Funzione bloccata:{" "}
                                {reason === "search" ? "Ricerca movimenti" : reason === "history" ? "Storico completo" : "Premium"}
                            </p>
                            <p className={`mt-1 text-sm ${muted}`}>Meno blur. Più verità. Zero pubblicità.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-5 space-y-3">
                    <div className="flex items-center gap-3">
                        <Search className={`h-5 w-5 ${muted}`} />
                        <span>Ricerca movimenti</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Clock3 className={`h-5 w-5 ${muted}`} />
                        <span>Storico completo (oltre 30 giorni)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <BadgeCheck className={`h-5 w-5 ${muted}`} />
                        <span>Niente pubblicità</span>
                    </div>
                </div>

                <div className={`mt-5 rounded-2xl border p-4 ${sub}`}>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-lg font-extrabold">7,00 € / mese</p>
                            <p className={`text-sm ${muted}`}>Annulla quando vuoi</p>
                        </div>
                        <p className={`text-sm ${muted}`}>Google Play</p>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Non ora
                    </Button>

                    {/* ✅ chiude Upsell e apre PremiumHub */}
                    <Button onClick={handleUnlock}>Sblocca Premium</Button>
                </div>

                <p className={`mt-4 text-xs ${muted}`}>Nota: Billing non ancora attivo in questa versione.</p>
            </DialogContent>
        </Dialog>
    )
}
