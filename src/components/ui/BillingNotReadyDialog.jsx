import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function BillingNotReadyDialog({ open, onClose }) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="bg-white text-slate-900 border border-slate-200 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="text-slate-900 dark:text-slate-100">
                        Abbonamento in arrivo
                    </DialogTitle>
                </DialogHeader>

                <p className="text-sm text-slate-700 dark:text-slate-300">
                    L’acquisto tramite Google Play Billing non è ancora attivo in questa versione.
                    <br />
                    <span className="text-slate-600 dark:text-slate-400">
                        Stiamo preparando la release per il Closed Test.
                    </span>
                </p>

                <div className="mt-5 flex justify-end">
                    <Button
                        onClick={onClose}
                        className="bg-slate-900 text-white hover:opacity-90 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                    >
                        Ok
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
