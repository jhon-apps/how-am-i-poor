import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react"

export default function BalanceCard({ balance = 0, income = 0, expenses = 0 }) {
    const fmt = (n) =>
        new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: "EUR",
        }).format(n)

    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl shadow-sm">
            {/* HEADER */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-800/70">
                            <Wallet className="h-4 w-4 text-slate-200" />
                        </div>
                        <p className="text-sm text-slate-400">Saldo attuale</p>
                    </div>

                    <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-50">
                        {fmt(balance)}
                    </h2>
                </div>

                <div className="text-right">
                    <p className="text-xs text-slate-500">Oggi</p>
                    <p className="text-sm font-medium text-slate-300">
                        {new Date().toLocaleDateString("it-IT", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        })}
                    </p>
                </div>
            </div>

            {/* INCOME / EXPENSES */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {/* ENTRATE */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                            Entrate
                        </p>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-900/40">
                            <ArrowUpRight className="h-4 w-4 text-emerald-300" />
                        </div>
                    </div>

                    <p className="mt-2 text-lg font-bold text-emerald-300">
                        {fmt(income)}
                    </p>
                </div>

                {/* USCITE */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                            Uscite
                        </p>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-900/40">
                            <ArrowDownRight className="h-4 w-4 text-rose-300" />
                        </div>
                    </div>

                    <p className="mt-2 text-lg font-bold text-rose-300">
                        {fmt(expenses)}
                    </p>
                </div>
            </div>
        </div>
    )
}
