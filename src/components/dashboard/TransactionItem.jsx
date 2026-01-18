import { Trash2, ArrowDownRight, ArrowUpRight, Lock } from "lucide-react"
import { isLockedTransaction } from "@/entities/premium"

export default function TransactionItem({ tx, onDelete, onEdit, isPremium, onPremium }) {
    if (!tx) return null

    const locked = isLockedTransaction(tx, isPremium)
    const isExpense = tx.type === "uscita"

    return (
        <div className={`relative flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/40 p-4 ${locked ? "opacity-80" : ""}`}>
            <div
                className={`flex items-center gap-4 ${locked ? "cursor-pointer" : "cursor-pointer"}`}
                onClick={() => {
                    if (locked) {
                        onPremium?.("history")
                        return
                    }
                    onEdit?.(tx)
                }}
            >
                <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                        isExpense ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
                    } ${locked ? "blur-[1.5px]" : ""}`}
                >
                    {isExpense ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                </div>

                <div className={locked ? "blur-[3px]" : ""}>
                    <p className="font-medium text-slate-100">{tx.description}</p>
                    <p className="text-xs text-slate-400">
                        {new Date(tx.date).toLocaleDateString("it-IT")} • {tx.category}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
        <span className={`font-semibold ${isExpense ? "text-rose-400" : "text-emerald-400"} ${locked ? "blur-[3px]" : ""}`}>
          {isExpense ? "-" : "+"}
            {tx.amount.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
        </span>

                <button
                    onClick={() => {
                        if (locked) {
                            onPremium?.("history")
                            return
                        }
                        onDelete(tx.id)
                    }}
                    className={`text-slate-500 hover:text-rose-400 ${locked ? "opacity-70" : ""}`}
                    title={locked ? "Storico Premium" : "Elimina"}
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {locked && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs text-slate-200 flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5" />
                        Storico Premium (30+ giorni)
                    </div>
                </div>
            )}
        </div>
    )
}
