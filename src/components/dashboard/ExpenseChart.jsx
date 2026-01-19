import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const CATEGORY_COLORS = {
    alimentari: "#10B981",
    trasporti: "#3B82F6",
    bollette: "#F59E0B",
    svago: "#A855F7",
    salute: "#EF4444",
    abbigliamento: "#EC4899",
    casa: "#64748B",
    stipendio: "#22C55E",
    altro: "#94A3B8",
}

function isDarkThemeActive() {
    return document?.documentElement?.classList?.contains("dark")
}

export default function ExpenseChart({ transactions = [] }) {
    const expenses = transactions.filter((t) => t.type === "uscita")

    const byCategory = expenses.reduce((acc, t) => {
        const key = t.category || "altro"
        const value = Math.abs(Number(t.amount) || 0)
        acc[key] = (acc[key] || 0) + value
        return acc
    }, {})

    const data = Object.entries(byCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

    const total = data.reduce((s, x) => s + x.value, 0)

    return (
        <div className="rounded-3xl border p-6 shadow-sm bg-white border-slate-200 dark:bg-slate-900/40 dark:border-slate-800 backdrop-blur-xl">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Distribuzione Spese</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {total > 0 ? `Totale uscite: ${total.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}` : "Aggiungi una uscita per vedere la torta."}
            </p>

            {/* container stabile: evita warning size */}
            <div className="mt-4 min-h-[16rem] h-64">
                {total <= 0 ? (
                    <div className="h-full rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-950/30">
                        <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center">
                            <span>🥧</span>
                        </div>
                        <p className="mt-3 text-sm font-medium text-slate-900 dark:text-slate-200">Nessuna spesa registrata</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Prova con “uscita → alimentari → 12€” 😉</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip
                                cursor={false}
                                wrapperStyle={{ zIndex: 9999 }}
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null

                                    const item = payload[0]
                                    const name = item?.name ?? item?.payload?.name ?? ""
                                    const value = Number(item?.value ?? item?.payload?.value ?? 0)

                                    const dark = isDarkThemeActive()

                                    return (
                                        <div
                                            style={{
                                                backgroundColor: dark ? "rgba(2,6,23,.95)" : "rgba(255,255,255,.98)",
                                                border: dark ? "1px solid rgba(148,163,184,.25)" : "1px solid rgba(226,232,240,1)",
                                                borderRadius: 12,
                                                padding: "10px 12px",
                                                color: dark ? "#e2e8f0" : "#0f172a",
                                                boxShadow: "0 10px 30px rgba(0,0,0,.20)",
                                            }}
                                        >
                                            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Categoria</div>
                                            <div style={{ fontSize: 14, fontWeight: 800, textTransform: "capitalize" }}>{name}</div>

                                            <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", gap: 12 }}>
                                                <span style={{ fontSize: 12, opacity: 0.8 }}>Totale</span>
                                                <span style={{ fontSize: 14, fontWeight: 800 }}>
                                                    {value.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                }}
                            />

                            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2} isAnimationActive={false}>
                                {data.map((entry) => (
                                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#94A3B8"} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    )
}
