export default function CategoryBreakdownList({ transactions = [] }) {
    const expenses = transactions.filter((t) => t.type === "uscita")
    const totals = new Map()

    for (const t of expenses) {
        const k = t.category || "altro"
        const v = Number(t.amount) || 0
        totals.set(k, (totals.get(k) || 0) + v)
    }

    const rows = Array.from(totals.entries())
        .map(([category, value]) => ({ category, value }))
        .sort((a, b) => b.value - a.value)

    const totalAll = rows.reduce((s, r) => s + r.value, 0)

    if (!rows.length) {
        return (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5">
                <p className="text-sm text-slate-300">Nessuna uscita da analizzare.</p>
            </div>
        )
    }

    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100">Spese per categoria</h3>
                <p className="text-xs text-slate-400">
                    Totale:{" "}
                    {totalAll.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                </p>
            </div>

            <div className="mt-4 space-y-3">
                {rows.map((r) => {
                    const pct = totalAll > 0 ? Math.round((r.value / totalAll) * 100) : 0
                    return (
                        <div key={r.category} className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm text-slate-200 capitalize truncate">{r.category}</p>
                                <div className="mt-1 h-2 w-48 max-w-full rounded-full bg-slate-800 overflow-hidden">
                                    <div
                                        className="h-full bg-slate-200/70"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-sm font-semibold text-slate-100">
                                    {r.value.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                                </p>
                                <p className="text-xs text-slate-400">{pct}%</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
