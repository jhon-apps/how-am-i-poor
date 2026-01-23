import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react"

export default function BalanceCard({
                                        balance = 0,
                                        income = 0,
                                        expenses = 0,
                                        onAdd,
                                        scope = "total", // "total" | "30d"
                                        onScopeChange,
                                    }) {
    const fmt = (n) =>
        new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: "EUR",
        }).format(Number(n) || 0)

    const today = new Date().toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })

    const card = "bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const subCard = "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
    const muted = "text-[rgb(var(--muted-fg))]"

    const isTotal = scope === "total"
    const label = isTotal ? "Saldo totale" : "Saldo 30 giorni"

    return (
        <div className={`rounded-3xl border p-6 shadow-sm ${card}`}>
            {/* HEADER */}
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${subCard}`}>
                            <Wallet className="h-4 w-4" />
                        </div>
                        <p className={`text-sm ${muted}`}>{label}</p>
                    </div>

                    <h2 className="mt-3 text-3xl font-extrabold tracking-tight truncate">{fmt(balance)}</h2>
                </div>

                <div className="text-right shrink-0 space-y-2">
                    <div>
                        <p className={`text-xs ${muted}`}>Oggi</p>
                        <p className="text-sm font-medium">{today}</p>
                    </div>

                    {/* Toggle saldo: Totale / 30 giorni */}
                    <div className={`inline-flex rounded-2xl border p-1 ${subCard}`}>
                        <button
                            type="button"
                            onClick={() => onScopeChange?.("total")}
                            className={[
                                "px-3 py-1.5 text-xs font-semibold rounded-xl transition border",
                                isTotal
                                    ? `bg-[rgb(var(--card))] border-[rgb(var(--border))] text-[rgb(var(--fg))]`
                                    : `bg-transparent border-transparent ${muted} hover:bg-[rgb(var(--card))] hover:border-[rgb(var(--border))]`,
                            ].join(" ")}
                            aria-pressed={isTotal}
                        >
                            Totale
                        </button>
                        <button
                            type="button"
                            onClick={() => onScopeChange?.("30d")}
                            className={[
                                "px-3 py-1.5 text-xs font-semibold rounded-xl transition border",
                                !isTotal
                                    ? `bg-[rgb(var(--card))] border-[rgb(var(--border))] text-[rgb(var(--fg))]`
                                    : `bg-transparent border-transparent ${muted} hover:bg-[rgb(var(--card))] hover:border-[rgb(var(--border))]`,
                            ].join(" ")}
                            aria-pressed={!isTotal}
                        >
                            30g
                        </button>
                    </div>
                </div>
            </div>

            {/* INCOME / EXPENSES */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {/* ENTRATE */}
                <button
                    type="button"
                    onClick={() => onAdd?.("entrata")}
                    className={`w-full text-left rounded-2xl border p-4 ${subCard} transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    title="Aggiungi Entrata"
                    aria-label="Aggiungi Entrata"
                >
                    <div className="flex items-center justify-between">
                        <p className={`text-xs uppercase tracking-wide ${muted}`}>Entrate</p>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
                            <ArrowUpRight className="h-4 w-4 text-emerald-700" />
                        </div>
                    </div>

                    <p className="mt-2 text-lg font-bold text-emerald-700">{fmt(income)}</p>
                </button>

                {/* USCITE */}
                <button
                    type="button"
                    onClick={() => onAdd?.("uscita")}
                    className={`w-full text-left rounded-2xl border p-4 ${subCard} transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    title="Aggiungi Uscita"
                    aria-label="Aggiungi Uscita"
                >
                    <div className="flex items-center justify-between">
                        <p className={`text-xs uppercase tracking-wide ${muted}`}>Uscite</p>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100">
                            <ArrowDownRight className="h-4 w-4 text-rose-700" />
                        </div>
                    </div>

                    <p className="mt-2 text-lg font-bold text-rose-700">{fmt(expenses)}</p>
                </button>
            </div>
        </div>
    )
}
