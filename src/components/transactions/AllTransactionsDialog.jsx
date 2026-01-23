import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import TransactionList from "@/components/dashboard/TransactionList"
import { Lock } from "lucide-react"

function toDateOnlyISO(d) {
    if (!d) return ""
    return String(d).slice(0, 10)
}

function daysBetween(aISO, bISO) {
    const a = new Date(aISO)
    const b = new Date(bISO)
    const ms = b.getTime() - a.getTime()
    return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function isOlderThan30Days(tx) {
    const txDate = toDateOnlyISO(tx?.date)
    if (!txDate) return false
    const today = new Date().toISOString().slice(0, 10)
    return daysBetween(txDate, today) > 30
}

export default function AllTransactionsDialog({
                                                  open,
                                                  onClose,
                                                  transactions = [],
                                                  isPremium = false,
                                                  onPremium,
                                                  onEdit,
                                                  onDelete,
                                              }) {
    const [query, setQuery] = useState("")

    const normalized = useMemo(() => {
        const q = String(query || "").trim().toLowerCase()
        if (!q) return transactions
        return transactions.filter((t) => {
            const desc = String(t.description || "").toLowerCase()
            const cat = String(t.category || "").toLowerCase()
            return desc.includes(q) || cat.includes(q)
        })
    }, [transactions, query])

    const { unlocked, locked } = useMemo(() => {
        const u = []
        const l = []
        for (const t of normalized) {
            if (!t) continue
            if (!isPremium && isOlderThan30Days(t)) l.push(t)
            else u.push(t)
        }
        return { unlocked: u, locked: l }
    }, [normalized, isPremium])

    const muted = "text-[rgb(var(--muted-fg))]"
    const card = "bg-[rgb(var(--card))] border-[rgb(var(--border))]"

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            {/* ✅ max height + flex column, e lo scroll lo facciamo DENTRO */}
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader className="shrink-0">
                    <DialogTitle>Tutti i movimenti</DialogTitle>
                </DialogHeader>

                {/* ✅ area scrollabile */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                    <div className="space-y-3">
                        <div className="relative">
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Cerca per descrizione o categoria…"
                                className={[
                                    "w-full rounded-2xl border px-3 py-2 text-sm outline-none shadow-sm",
                                    "bg-[rgb(var(--card))] border-[rgb(var(--border))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                                ].join(" ")}
                            />
                        </div>

                        {/* Parte sbloccata */}
                        <div className="w-full min-w-0 overflow-hidden">
                            <TransactionList
                                transactions={unlocked}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                isPremium={isPremium}
                                onPremium={onPremium}
                            />
                        </div>

                        {/* Parte bloccata: SOLO non-premium */}
                        {!isPremium && locked.length > 0 && (
                            <div className="pt-2">
                                <div className="relative">
                                    <div className="pointer-events-none select-none blur-[10px] opacity-60">
                                        <TransactionList
                                            transactions={locked}
                                            onEdit={() => {}}
                                            onDelete={() => {}}
                                            isPremium={false}
                                            onPremium={onPremium}
                                        />
                                    </div>

                                    <div
                                        className="absolute inset-0 rounded-3xl bg-[linear-gradient(to_bottom,rgba(0,0,0,0.10),rgba(0,0,0,0.45))]"
                                        aria-hidden="true"
                                    />

                                    <div className="absolute inset-x-0 bottom-3 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => onPremium?.("history")}
                                            className={[
                                                "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm shadow-lg",
                                                card,
                                            ].join(" ")}
                                            title="Sblocca storico"
                                        >
                                            <Lock className="h-4 w-4" />
                                            Storico Premium (oltre 30 giorni)
                                        </button>
                                    </div>
                                </div>

                                <p className={`mt-2 text-xs ${muted}`}>
                                    Alcuni movimenti sono nascosti perché hai la memoria di un pesce rosso. (Premium)
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ✅ footer fisso non scrolla */}
                <div className="shrink-0 pt-3 flex justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Chiudi
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
