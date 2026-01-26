import { ArrowDownRight, ArrowUpRight, Trash2, Pencil, AlarmClock } from "lucide-react"

function formatEUR(n) {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(n) || 0)
}

export default function TransactionItem({ tx, onDelete, onEdit }) {
    const isIncome = tx?.type === "entrata"
    const Icon = isIncome ? ArrowUpRight : ArrowDownRight

    const dateISO = String(tx?.date || "").slice(0, 10)
    const todayISO = new Date().toISOString().slice(0, 10)
    const isFuture = !!dateISO && dateISO > todayISO

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

                            <div className="mt-0.5 flex items-center gap-2 min-w-0">
                                <p className="text-sm text-[rgb(var(--muted-fg))] truncate">
                                    {dateISO} • {tx?.category || "—"}
                                </p>

                                {/* ✅ Badge FUTURO */}
                                {isFuture ? (
                                    <span
                                        className="
                                            inline-flex items-center gap-1
                                            rounded-full border border-[rgb(var(--border))]
                                            bg-[rgb(var(--card-2))]
                                            px-2 py-0.5
                                            text-[10px] font-extrabold
                                            text-[rgb(var(--muted-fg))]
                                            shrink-0
                                        "
                                        title="Movimento futuro (non influisce su statistiche finché non diventa passato)"
                                    >
                                        <AlarmClock className="h-3 w-3" />
                                        FUTURO
                                    </span>
                                ) : null}
                            </div>
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
