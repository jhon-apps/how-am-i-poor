import { useEffect, useMemo, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { ChevronDown, ChevronUp } from "lucide-react"

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

function isDark() {
    return document?.documentElement?.classList?.contains("dark")
}

function cap(s) {
    const x = String(s || "")
    if (!x) return ""
    return x.charAt(0).toUpperCase() + x.slice(1)
}

export default function ExpenseChart({ transactions = [] }) {
    const [detailsOpen, setDetailsOpen] = useState(true)

    // ✅ Recharts fix: render solo dopo mount (evita width/height -1 su mobile)
    const [ready, setReady] = useState(false)
    useEffect(() => {
        const t = setTimeout(() => setReady(true), 0)
        return () => clearTimeout(t)
    }, [])

    const expenses = useMemo(() => transactions.filter((t) => t.type === "uscita"), [transactions])

    const data = useMemo(() => {
        const byCategory = expenses.reduce((acc, t) => {
            const key = t.category || "altro"
            const value = Math.abs(Number(t.amount) || 0)
            acc[key] = (acc[key] || 0) + value
            return acc
        }, {})

        return Object.entries(byCategory)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
    }, [expenses])

    const total = useMemo(() => data.reduce((s, x) => s + x.value, 0), [data])

    const card = "bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const sub = "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
    const muted = "text-[rgb(var(--muted-fg))]"

    return (
        <div className={`rounded-3xl border p-6 shadow-sm ${card}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-base font-semibold">Distribuzione Spese</h3>
                    <p className={`mt-1 text-sm ${muted}`}>
                        {total > 0
                            ? `Totale uscite: ${total.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}`
                            : "Aggiungi una uscita per vedere la torta."}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setDetailsOpen((v) => !v)}
                    className={`shrink-0 rounded-2xl border px-3 py-2 text-xs font-extrabold hover:bg-[rgb(var(--card-2))] ${sub}`}
                    title={detailsOpen ? "Nascondi dettagli" : "Mostra dettagli"}
                >
          <span className="inline-flex items-center gap-2">
            Dettagli {detailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
                </button>
            </div>

            {/* ✅ wrapper con altezza garantita (hard) */}
            <div className="mt-4 w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                <div className="w-full min-h-[280px] h-[280px]">
                    {total <= 0 ? (
                        <div className={`h-full rounded-2xl border border-dashed flex flex-col items-center justify-center text-center ${sub}`}>
                            <div className={`h-10 w-10 rounded-2xl border flex items-center justify-center ${sub}`}>
                                <span>🥧</span>
                            </div>
                            <p className="mt-3 text-sm font-medium">Nessuna spesa registrata</p>
                            <p className={`text-xs ${muted}`}>Prova con “uscita → alimentari → 12€” 😉</p>
                        </div>
                    ) : !ready ? (
                        // ✅ fallback mentre il layout non è ancora calcolabile
                        <div className={`h-full rounded-2xl border border-dashed flex flex-col items-center justify-center text-center ${sub}`}>
                            <p className={`text-sm ${muted}`}>Carico il grafico…</p>
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
                                        const pct = total > 0 ? (value / total) * 100 : 0

                                        const dark = isDark()

                                        return (
                                            <div
                                                style={{
                                                    backgroundColor: dark ? "rgba(2,6,23,.95)" : "rgba(255,255,255,.98)",
                                                    border: dark ? "1px solid rgba(148,163,184,.25)" : "1px solid rgba(226,232,240,1)",
                                                    borderRadius: 12,
                                                    padding: "10px 12px",
                                                    color: dark ? "#e2e8f0" : "#0f172a",
                                                    boxShadow: "0 10px 30px rgba(0,0,0,.20)",
                                                    minWidth: 180,
                                                }}
                                            >
                                                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Categoria</div>
                                                <div style={{ fontSize: 14, fontWeight: 800 }}>{cap(name)}</div>

                                                <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", gap: 12 }}>
                                                    <span style={{ fontSize: 12, opacity: 0.8 }}>Totale</span>
                                                    <span style={{ fontSize: 14, fontWeight: 800 }}>
                            {value.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                          </span>
                                                </div>

                                                <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", gap: 12 }}>
                                                    <span style={{ fontSize: 12, opacity: 0.8 }}>Percentuale</span>
                                                    <span style={{ fontSize: 13, fontWeight: 800 }}>{pct.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        )
                                    }}
                                />

                                {/* ✅ PIE PIENA */}
                                <Pie
                                    data={data}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={100}
                                    paddingAngle={2}
                                    isAnimationActive={false}
                                >
                                    {data.map((entry) => (
                                        <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#94A3B8"} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* dettagli sempre ordinati (toggle) */}
            {detailsOpen && total > 0 ? (
                <div className={`mt-5 rounded-3xl border p-4 ${sub}`}>
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-extrabold tracking-tight">Dettaglio categorie</p>
                        <p className={`text-xs ${muted}`}>Ordinate per importo</p>
                    </div>

                    <div className="mt-3">
                        <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-2 pb-2 text-[11px] font-extrabold uppercase tracking-tight text-[rgb(var(--muted-fg))]">
                            <div>Categoria</div>
                            <div className="text-right">Totale</div>
                            <div className="text-right">%</div>
                        </div>

                        <div className="space-y-1">
                            {data.map((row) => {
                                const pct = total > 0 ? (row.value / total) * 100 : 0
                                const color = CATEGORY_COLORS[row.name] || "#94A3B8"

                                return (
                                    <div
                                        key={row.name}
                                        className="grid grid-cols-[1fr_auto_auto] gap-3 items-center rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-2"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
                                            <span className="text-sm font-semibold truncate">{cap(row.name)}</span>
                                        </div>

                                        <div className="text-sm font-extrabold text-right tabular-nums">
                                            {row.value.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                                        </div>

                                        <div className={`text-sm font-extrabold text-right tabular-nums ${muted}`}>
                                            {pct.toFixed(1)}%
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}
