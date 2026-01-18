import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function ResetConfirmDialog({ open, onClose, onConfirm }) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reset movimenti</DialogTitle>
                </DialogHeader>

                <p className="text-sm text-slate-300">
                    Eliminerai <span className="font-semibold">tutti</span> i movimenti salvati. Non è reversibile.
                </p>

                <div className="mt-5 flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>
                        Annulla
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="bg-rose-600 hover:bg-rose-500 text-white"
                    >
                        Reset
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
