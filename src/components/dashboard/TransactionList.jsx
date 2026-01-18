import TransactionItem from "./TransactionItem"

export default function TransactionList({ transactions = [], onDelete, onEdit, isPremium, onPremium }) {
    if (!transactions.length) {
        return <p className="text-slate-400 text-sm">Nessun movimento</p>
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
