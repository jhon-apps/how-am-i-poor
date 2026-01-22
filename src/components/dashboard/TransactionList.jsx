import TransactionItem from "./TransactionItem"

export default function TransactionList({ transactions = [], onDelete, onEdit, isPremium, onPremium }) {
    const card = "bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const soft = "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
    const muted = "text-[rgb(var(--muted-fg))]"

    if (!transactions.length) {
        return (
            <div className={`rounded-3xl border p-4 shadow-sm ${soft}`}>
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">Nessun movimento</p>
                <p className={`mt-1 text-xs ${muted}`}>Aggiungine uno e vediamo come va a finire.</p>
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
