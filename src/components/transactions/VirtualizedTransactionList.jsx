import { Virtuoso } from "react-virtuoso"
import TransactionItem from "@/components/dashboard/TransactionItem"

export default function VirtualizedTransactionList({
                                                       transactions = [],
                                                       onDelete,
                                                       onEdit,
                                                       isPremium,
                                                       onPremium,
                                                   }) {
    return (
        <Virtuoso
            style={{ height: "100%" }}
            data={transactions}
            computeItemKey={(index, tx) => tx?.id ?? String(index)}
            increaseViewportBy={{ top: 400, bottom: 800 }}
            components={{
                Scroller: (props) => (
                    <div
                        {...props}
                        className="h-full overflow-y-auto overscroll-contain touch-pan-y"
                    />
                ),
            }}
            itemContent={(index, tx) => (
                <div className="pb-3">
                    <TransactionItem
                        tx={tx}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        isPremium={isPremium}
                        onPremium={onPremium}
                    />
                </div>
            )}
        />
    )
}
