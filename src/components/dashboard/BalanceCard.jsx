import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react"

export default function BalanceCard({ balance = 0, income = 0, expenses = 0 }) {
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

    return (
        <div className={`rounded-3xl border p-6 shadow-sm ${card}`}>
            {/* HEADER */}
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${subCard}`}>
                            <Wallet className="h-4 w-4" />
                        </div>
                        <p className={`text-sm ${muted}`}>Saldo attuale</p>
                    </div>

                    <h2 className="mt-3 text-3xl font-extrabold tracking-tight truncate">
                        {fmt(balance)}
                    </h2>
                </div>

                <div className="text-right shrink-0">
                    <p className={`text-xs ${muted}`}>Oggi</p>
                    <p className="text-sm font-medium">{today}</p>
                </div>
            </div>

            {/* INCOME / EXPENSES */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {/* ENTRATE */}
                <div className={`rounded-2xl border p-4 ${subCard}`}>
                    <div className="flex items-center justify-between">
                        <p className={`text-xs uppercase tracking-wide ${muted}`}>Entrate</p>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
                            <ArrowUpRight className="h-4 w-4 text-emerald-700" />
                        </div>
                    </div>

                    <p className="mt-2 text-lg font-bold text-emerald-700">{fmt(income)}</p>
                </div>

                {/* USCITE */}
                <div className={`rounded-2xl border p-4 ${subCard}`}>
                    <div className="flex items-center justify-between">
                        <p className={`text-xs uppercase tracking-wide ${muted}`}>Uscite</p>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100">
                            <ArrowDownRight className="h-4 w-4 text-rose-700" />
                        </div>
                    </div>

                    <p className="mt-2 text-lg font-bold text-rose-700">{fmt(expenses)}</p>
                </div>
            </div>
        </div>
    )
}
