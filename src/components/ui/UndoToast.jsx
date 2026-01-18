import { Button } from "@/components/ui/button"

export default function UndoToast({ open, message, onUndo, onClose }) {
    if (!open) return null

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/95 backdrop-blur px-4 py-3 shadow-xl flex items-center gap-3">
                <p className="text-sm text-slate-200">{message}</p>
                <Button
                    onClick={onUndo}
                    className="h-9 rounded-xl bg-slate-100 text-slate-900 hover:bg-white"
                >
                    Annulla
                </Button>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-200 text-sm px-2"
                    aria-label="Chiudi"
                >
                    ✕
                </button>
            </div>
        </div>
    )
}
