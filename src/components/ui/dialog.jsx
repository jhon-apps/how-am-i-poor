import { X } from "lucide-react"

export function Dialog({ open, onOpenChange, children }) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60"
                onClick={() => onOpenChange(false)}
            />

            {/* Content */}
            <div
                className="
          relative z-10 w-full max-w-lg rounded-3xl border p-6 shadow-xl
          bg-[rgb(var(--card))] border-[rgb(var(--border))] text-[rgb(var(--fg))]
        "
            >
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
    return <h2 className="text-lg font-bold">{children}</h2>
}
