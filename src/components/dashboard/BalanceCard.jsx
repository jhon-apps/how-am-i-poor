import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react"

export default function BalanceCard({
                                        balance = 0,
                                        income = 0,
                                        expenses = 0,
                                        scope = "total",
                                        onScopeChange,
                                        onAddIncome,
                                        onAddExpense,
                                    }) {
    const fmt = (n) =>
        new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(n) || 0)

    const today = new Date()
    const dateLabel = today.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })

    const card = "bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const soft = "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
    const muted = "text-[rgb(var(--muted-fg))]"

    const is30d = scope === "30d"
    const nextScope = is30d ? "total" : "30d"
    const title = is30d ? "Saldo 30 giorni" : "Saldo totale"
    const switchLabel = is30d ? "Totale" : "30g"

    return (
        <div className={`rounded-3xl border ${card} p-6`}>
            {/* HEADER */}
            <div className="flex items-start justify-between gap-4">
                {/* LEFT */}
                <div className="min-w-0 flex-1">
                    {/* titolo + bottone cambio */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            type="button"
                            onClick={() => onScopeChange?.(nextScope)}
                            className={[
                                "h-8 px-3 rounded-2xl border text-xs font-extrabold transition",
                                "bg-[rgb(var(--card))] border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]",
                            ].join(" ")}
                            title={`Passa a ${switchLabel}`}
                        >
                            Passa a  {switchLabel}
                        </button>
                        <div className="flex items-center gap-2 min-w-0">
                            <div className={`h-9 w-9 rounded-2xl border ${soft} flex items-center justify-center shrink-0`}>
                                <Wallet className="h-4 w-4" />
                            </div>

                            <p className={`text-sm font-semibold ${muted} truncate`}>{title}</p>
                        </div>
                    </div>

                    {/* numero: riga libera */}
                    <h2 className="mt-3 text-2xl font-extrabold tracking-tight break-words">
                        {fmt(balance)}
                    </h2>
                </div>

                {/* RIGHT */}
                <div className="shrink-0 text-right">
                    <p className={`text-xs ${muted}`}>Oggi</p>
                    <p className="text-sm font-semibold">{dateLabel}</p>
                </div>
            </div>

            {/* ENTRATE / USCITE */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* ENTRATE */}
                <button
                    type="button"
                    onClick={() => onAddIncome?.()}
                    className={[
                        "w-full text-left rounded-3xl border p-4 transition",
                        soft,
                        onAddIncome ? "cursor-pointer hover:bg-[rgb(var(--card))]" : "cursor-default",
                    ].join(" ")}
                    title={onAddIncome ? "Aggiungi entrata" : "Entrate"}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className={`text-xs uppercase tracking-wide ${muted}`}>Entrate</p>
                            <p className="mt-2 text-xl font-extrabold text-emerald-500 break-words">{fmt(income)}</p>
                        </div>

                        <div className="h-11 w-11 rounded-2xl bg-emerald-200/30 border border-emerald-200/30 flex items-center justify-center shrink-0">
                            <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                        </div>
                    </div>
                </button>

                {/* USCITE */}
                <button
                    type="button"
                    onClick={() => onAddExpense?.()}
                    className={[
                        "w-full text-left rounded-3xl border p-4 transition",
                        soft,
                        onAddExpense ? "cursor-pointer hover:bg-[rgb(var(--card))]" : "cursor-default",
                    ].join(" ")}
                    title={onAddExpense ? "Aggiungi uscita" : "Uscite"}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className={`text-xs uppercase tracking-wide ${muted}`}>Uscite</p>
                            <p className="mt-2 text-xl font-extrabold text-rose-500 break-words">{fmt(expenses)}</p>
                        </div>

                        <div className="h-11 w-11 rounded-2xl bg-rose-200/30 border border-rose-200/30 flex items-center justify-center shrink-0">
                            <ArrowDownRight className="h-5 w-5 text-rose-500" />
                        </div>
                    </div>
                </button>
            </div>
        </div>
    )
}
