import React from "react"

export function Dialog({ open, onOpenChange, children }) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60" onClick={() => onOpenChange(false)} />

            {/* Wrapper (nessun padding/border qui) */}
            <div className="relative z-10 w-full max-w-lg px-3 sm:px-0">
                {children}
            </div>
        </div>
    )
}

/**
 * ✅ Ora DialogContent è la "card" vera della modale
 * Default: border + bg + shadow + padding
 * e puoi aggiungere className per personalizzare (es Premium border più visibile)
 */
export function DialogContent({ children, className = "", style }) {
    return (
        <div
            className={[
                "w-full rounded-3xl border shadow-xl p-6",
                "bg-[rgb(var(--card))] border-[rgb(var(--border))] text-[rgb(var(--fg))]",
                className,
            ].join(" ")}
            style={style}
        >
            {children}
        </div>
    )
}

export function DialogHeader({ children, className = "" }) {
    return <div className={["mb-4", className].join(" ")}>{children}</div>
}

export function DialogTitle({ children, className = "" }) {
    return <h2 className={["text-lg font-bold", className].join(" ")}>{children}</h2>
}
