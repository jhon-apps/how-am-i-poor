import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function BillingNotReadyDialog({ open, onClose }) {
    const muted = "text-[rgb(var(--muted-fg))]"

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Abbonamento in arrivo</DialogTitle>
                </DialogHeader>

                <p className="text-sm">
                    L’acquisto tramite Google Play Billing non è ancora attivo in questa versione.
                    <br />
                    <span className={muted}>Stiamo preparando la release per il Closed Test.</span>
                </p>

                <div className="mt-5 flex justify-end">
                    <Button onClick={onClose}>Ok</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
