import TransactionItem from "./TransactionItem"

export default function TransactionList({ transactions = [], onDelete, onEdit, isPremium, onPremium }) {
    if (!transactions.length) {
        return (
            <div className="rounded-2xl border p-4 bg-white/70 border-slate-200 dark:bg-slate-900/30 dark:border-slate-800">
                <p className="text-sm text-slate-700 dark:text-slate-300">Nessun movimento</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Aggiungine uno e vediamo come va a finire.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3">
            {transactions.map((tx) => (
                <TransactionItem
                    key={tx.id}
                    tx={tx}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    isPremium={isPremium}
                    onPremium={onPremium}
                />
            ))}
        </div>
    )
}
