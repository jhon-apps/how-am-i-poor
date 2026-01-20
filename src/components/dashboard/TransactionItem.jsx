import { Trash2, ArrowDownRight, ArrowUpRight, Lock } from "lucide-react"
import { isLockedTransaction } from "@/entities/premium"

function formatEUR(n) {
    return (Number(n) || 0).toLocaleString("it-IT", { style: "currency", currency: "EUR" })
}

export default function TransactionItem({ tx, onDelete, onEdit, isPremium, onPremium }) {
    if (!tx) return null

    const locked = isLockedTransaction(tx, isPremium)
    const isExpense = tx.type === "uscita"

    const card = "bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const sub = "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
    const muted = "text-[rgb(var(--muted-fg))]"

    const onOpen = () => {
        if (locked) {
            onPremium?.("history")
            return
        }
        onEdit?.(tx)
    }

    const onRemove = (e) => {
        e.stopPropagation()
        if (locked) {
            onPremium?.("history")
            return
        }
        onDelete?.(tx.id)
    }

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onOpen()
            }}
            className={[
                "relative flex items-center justify-between gap-4 rounded-2xl border p-4 transition shadow-sm",
                card,
                "hover:opacity-[0.98]",
                locked ? "cursor-pointer" : "cursor-pointer",
            ].join(" ")}
        >
            {/* LEFT */}
            <div className="flex items-center gap-4 min-w-0">
                <div
                    className={[
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                        sub,
                        locked ? "opacity-60" : "",
                    ].join(" ")}
                    aria-hidden="true"
                >
                    {/* Icon color stays semantic and readable */}
                    {isExpense ? (
                        <ArrowDownRight size={18} className="text-rose-700" />
                    ) : (
                        <ArrowUpRight size={18} className="text-emerald-700" />
                    )}
                </div>

                <div className={["min-w-0", locked ? "opacity-60" : ""].join(" ")}>
                    <p className="font-bold tracking-tight truncate">{tx.description}</p>

                    <p className={["text-sm tracking-tight truncate", muted].join(" ")}>
                        {new Date(tx.date).toLocaleDateString("it-IT")} • {tx.category}
                    </p>
                </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3 shrink-0">
        <span className={["font-semibold tabular-nums", locked ? "opacity-60" : ""].join(" ")}>
          {isExpense ? "-" : "+"}
            <span className={isExpense ? "text-rose-700" : "text-emerald-700"}>{formatEUR(tx.amount)}</span>
        </span>

                <button
                    type="button"
                    onClick={onRemove}
                    className={[
                        "h-10 w-10 rounded-xl inline-flex items-center justify-center transition",
                        muted,
                        "hover:bg-[rgb(var(--muted))] hover:opacity-90",
                        locked ? "opacity-60" : "",
                    ].join(" ")}
                    title={locked ? "Storico Premium" : "Elimina"}
                    aria-label={locked ? "Storico Premium" : "Elimina movimento"}
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* LOCKED OVERLAY */}
            {locked && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                        className={[
                            "rounded-full border px-3 py-1 text-xs flex items-center gap-2 shadow-sm",
                            "bg-[rgb(var(--card))] border-[rgb(var(--border))]",
                        ].join(" ")}
                    >
                        <Lock className="h-3.5 w-3.5" />
                        Storico Premium (30+ giorni)
                    </div>
                </div>
            )}
        </div>
    )
}
