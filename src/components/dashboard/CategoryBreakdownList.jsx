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

    const card = "bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const muted = "text-[rgb(var(--muted-fg))]"
    const track = "bg-[rgb(var(--muted))]"

    if (!rows.length) {
        return (
            <div className={`rounded-3xl border p-5 shadow-sm ${card}`}>
                <p className={`text-sm ${muted}`}>Nessuna uscita da analizzare.</p>
            </div>
        )
    }

    return (
        <div className={`rounded-3xl border p-5 shadow-sm ${card}`}>
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Spese per categoria</h3>
                <p className={`text-xs ${muted}`}>
                    Totale: {totalAll.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                </p>
            </div>

            <div className="mt-4 space-y-3">
                {rows.map((r) => {
                    const pct = totalAll > 0 ? Math.round((r.value / totalAll) * 100) : 0
                    return (
                        <div key={r.category} className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-sm capitalize truncate">{r.category}</p>

                                <div className={`mt-1 h-2 w-48 max-w-full rounded-full overflow-hidden ${track}`}>
                                    <div
                                        className="h-full bg-slate-900/60"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>

                            <div className="text-right shrink-0">
                                <p className="text-sm font-semibold">
                                    {r.value.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                                </p>
                                <p className={`text-xs ${muted}`}>{pct}%</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
