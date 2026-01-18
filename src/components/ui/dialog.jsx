import { X } from "lucide-react"

export function Dialog({ open, onOpenChange, children }) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            />

            {/* Content */}
            <div className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
                {children}
            </div>
        </div>
    )
}

export function DialogContent({ children }) {
    return <div>{children}</div>
}

export function DialogHeader({ children }) {
    return <div className="mb-4">{children}</div>
}

export function DialogTitle({ children }) {
    return (
        <h2 className="text-lg font-bold text-slate-100">{children}</h2>
    )
}
