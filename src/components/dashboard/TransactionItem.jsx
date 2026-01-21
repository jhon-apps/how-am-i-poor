import { ArrowDownRight, ArrowUpRight, Trash2, Pencil } from "lucide-react"

function formatEUR(n) {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(n) || 0)
}

export default function TransactionItem({ tx, onDelete, onEdit }) {
    const isIncome = tx?.type === "entrata"
    const Icon = isIncome ? ArrowUpRight : ArrowDownRight

    return (
        <div className="w-full min-w-0 overflow-hidden rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] p-4">
            <div className="flex items-center gap-3 min-w-0">
                <div className="h-11 w-11 shrink-0 rounded-2xl border bg-[rgb(var(--card-2))] border-[rgb(var(--border))] flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="min-w-0">
                            <p className="font-semibold leading-tight truncate">{tx?.description || "—"}</p>
                            <p className="text-sm text-[rgb(var(--muted-fg))] truncate">
                                {(tx?.date || "").slice(0, 10)} • {tx?.category || "—"}
                            </p>
                        </div>

                        <div className="shrink-0 text-right">
                            <p className={`font-semibold ${isIncome ? "text-emerald-700" : "text-rose-700"}`}>
                                {isIncome ? "+" : "-"}
                                {formatEUR(tx?.amount)}
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onEdit?.(tx)
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs bg-[rgb(var(--card-2))] border-[rgb(var(--border))] hover:opacity-90"
                            title="Modifica"
                        >
                            <Pencil className="h-4 w-4" />
                            Modifica
                        </button>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onDelete?.(tx?.id)
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs bg-[rgb(var(--card-2))] border-[rgb(var(--border))] hover:opacity-90"
                            title="Elimina"
                        >
                            <Trash2 className="h-4 w-4" />
                            Elimina
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
