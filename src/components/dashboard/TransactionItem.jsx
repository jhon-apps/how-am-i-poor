import { Trash2, ArrowDownRight, ArrowUpRight, Lock } from "lucide-react"
import { isLockedTransaction } from "@/entities/premium"

function formatEUR(n) {
    return (Number(n) || 0).toLocaleString("it-IT", { style: "currency", currency: "EUR" })
}

export default function TransactionItem({ tx, onDelete, onEdit, isPremium, onPremium }) {
    if (!tx) return null

    const locked = isLockedTransaction(tx, isPremium)
    const isExpense = tx.type === "uscita"

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
                "relative flex items-center justify-between gap-4 rounded-2xl border p-4 transition",
                "bg-white/80 border-slate-200 hover:bg-white",
                "dark:bg-slate-900/40 dark:border-slate-800 dark:hover:bg-slate-900/55",
                locked ? "cursor-pointer" : "cursor-pointer",
            ].join(" ")}
        >
            {/* LEFT */}
            <div className="flex items-center gap-4 min-w-0">
                <div
                    className={[
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                        isExpense
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
                        locked ? "opacity-60" : "",
                    ].join(" ")}
                    aria-hidden="true"
                >
                    {isExpense ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                </div>

                <div className={["min-w-0", locked ? "opacity-60" : ""].join(" ")}>
                    <p className="font-bold tracking-tight truncate">
                        {tx.description}
                    </p>

                    <p className="tracking-tight">
                        {new Date(tx.date).toLocaleDateString("it-IT")} • {tx.category}
                    </p>
                </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3 shrink-0">
                <span
                    className={[
                        "font-semibold tabular-nums",
                        isExpense ? "text-rose-700 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300",
                        locked ? "opacity-60" : "",
                    ].join(" ")}
                >
                    {isExpense ? "-" : "+"}
                    {formatEUR(tx.amount)}
                </span>

                <button
                    type="button"
                    onClick={onRemove}
                    className={[
                        "h-10 w-10 rounded-xl inline-flex items-center justify-center transition",
                        "text-slate-500 hover:text-rose-700 hover:bg-rose-50",
                        "dark:text-slate-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/10",
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
                        className="
                            rounded-full border px-3 py-1 text-xs flex items-center gap-2
                            bg-white/90 border-slate-200 text-slate-800
                            dark:bg-slate-950/80 dark:border-slate-700 dark:text-slate-200
                            shadow-sm
                        "
                    >
                        <Lock className="h-3.5 w-3.5" />
                        Storico Premium (30+ giorni)
                    </div>
                </div>
            )}
        </div>
    )
}
