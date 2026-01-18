import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function BillingNotReadyDialog({ open, onClose }) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Abbonamento in arrivo</DialogTitle>
                </DialogHeader>

                <p className="text-sm text-slate-300">
                    L’acquisto tramite Google Play Billing non è ancora attivo in questa versione.
                    <br />
                    <span className="text-slate-400">Stiamo preparando la release per il Closed Test.</span>
                </p>

                <div className="mt-5 flex justify-end">
                    <Button onClick={onClose} className="bg-slate-100 text-slate-900 hover:bg-white">
                        Ok
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
