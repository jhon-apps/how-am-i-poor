import { useMemo, useState, useEffect } from "react"
import { Lock, ArrowLeft, Calendar, RotateCcw } from "lucide-react"
import VirtualizedTransactionList from "@/components/transactions/VirtualizedTransactionList"
import TransactionList from "@/components/dashboard/TransactionList"

function norm(s) {
    return String(s || "").toLowerCase().trim()
}

function isWithinLastDays(dateISO, days) {
    const d = new Date(dateISO)
    if (Number.isNaN(d.getTime())) return false
    const diff = Date.now() - d.getTime()
    return diff <= days * 24 * 60 * 60 * 1000
}

function toYmd(dateLike) {
    if (!dateLike) return ""
    return String(dateLike).slice(0, 10)
}

export default function AllTransactionsDialog({
                                                  open,
                                                  onClose,
                                                  transactions = [],
                                                  isPremium,
                                                  onPremium,
                                                  onEdit,
                                                  onDelete,
                                              }) {
    const [query, setQuery] = useState("")
    const [selectedDate, setSelectedDate] = useState("")

    useEffect(() => {
        if (!open) {
            setQuery("")
            setSelectedDate("")
        }
    }, [open])

    // 1) filtro data (sempre)
    const filteredByDate = useMemo(() => {
        if (!selectedDate) return transactions
        return transactions.filter((t) => toYmd(t.date) === selectedDate)
    }, [transactions, selectedDate])

    // 2) search: premium gated (come prima)
    const filtered = useMemo(() => {
        if (!isPremium) return filteredByDate
        const q = norm(query)
        if (!q) return filteredByDate
        return filteredByDate.filter((t) => norm(t.description).includes(q) || norm(t.category).includes(q))
    }, [filteredByDate, query, isPremium])

    // 3) split visible/locked (locked = >30 giorni, solo non premium)
    const { visible, locked } = useMemo(() => {
        if (isPremium) return { visible: filtered, locked: [] }

        const v = []
        const l = []
        for (const t of filtered) {
            if (isWithinLastDays(t.date, 30)) v.push(t)
            else l.push(t)
        }
        return { visible: v, locked: l }
    }, [filtered, isPremium])

    // preview locked per performance (mostriamo solo una parte)
    const LOCKED_PREVIEW_COUNT = 25
    const lockedPreview = useMemo(() => locked.slice(0, LOCKED_PREVIEW_COUNT), [locked])

    if (!open) return null

    const muted = "text-[rgb(var(--muted-fg))]"

    return (
        <div className="fixed inset-0 z-[80]">
            <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

            <div className="absolute inset-0 flex items-end md:items-center md:justify-center">
                <div
                    className={[
                        "relative z-[81] w-full h-full md:h-[90vh] md:max-w-3xl",
                        "rounded-none md:rounded-3xl border",
                        "bg-[rgb(var(--card))] border-[rgb(var(--border))] shadow-xl",
                        "overflow-hidden",
                        "flex flex-col",
                    ].join(" ")}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* HEADER */}
                    <div className="shrink-0 border-b bg-[rgb(var(--card))] border-[rgb(var(--border))]">
                        <div className="pt-[env(safe-area-inset-top)]" />

                        <div className="px-4 py-3 flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="h-10 w-10 shrink-0 rounded-2xl border bg-[rgb(var(--card-2))] border-[rgb(var(--border))] flex items-center justify-center"
                                aria-label="Torna alla Home"
                                title="Home"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-extrabold tracking-tight">Tutti i movimenti</p>
                                <p className={`text-xs ${muted} truncate`}>
                                    {isPremium ? "Ricerca + filtro giorno" : "Storico oltre 30 giorni = Premium"}
                                </p>
                            </div>
                        </div>

                        <div className="px-4 pb-3">
                            <div className="flex items-center gap-2">
                                {/* search */}
                                <div className="relative flex-2 min-w-0">
                                    <input
                                        value={isPremium ? query : ""}
                                        onChange={(e) => setQuery(e.target.value)}
                                        readOnly={!isPremium}
                                        onClick={() => {
                                            if (!isPremium) onPremium?.("search")
                                        }}
                                        placeholder={isPremium ? "Cerca..." : "Cerca (Premium)"}
                                        className={[
                                            "w-full min-w-0 rounded-2xl border px-3 py-2 text-sm outline-none shadow-sm",
                                            "bg-[rgb(var(--card-2))] border-[rgb(var(--border))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                                            !isPremium ? "cursor-pointer pr-10" : "",
                                        ].join(" ")}
                                    />
                                    {!isPremium && (
                                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${muted} pointer-events-none`}>
                                            <Lock className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>

                                {/* date */}
                                <div className="shrink-0 flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="h-10 w-10 rounded-2xl border bg-[rgb(var(--card-2))] border-[rgb(var(--border))] flex items-center justify-center"
                                        title="Filtro giorno"
                                        aria-label="Filtro giorno"
                                        onClick={() => {
                                            const el = document.getElementById("haip-date-filter")
                                            el?.showPicker?.()
                                            el?.focus?.()
                                        }}
                                    >
                                        <Calendar className="h-4 w-4" />
                                    </button>

                                    <input
                                        id="haip-date-filter"
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className={[
                                            "h-10 rounded-2xl border px-3 text-sm outline-none shadow-sm",
                                            "bg-[rgb(var(--card-2))] border-[rgb(var(--border))] text-[rgb(var(--fg))]",
                                            "w-[140px] sm:w-[160px]",
                                        ].join(" ")}
                                        title="Filtra per giorno"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setSelectedDate("")}
                                        className="h-10 w-10 rounded-2xl border bg-[rgb(var(--card-2))] border-[rgb(var(--border))] flex items-center justify-center hover:opacity-90"
                                        title="Rimuovi filtro data"
                                        aria-label="Rimuovi filtro data"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className={`mt-2 text-xs ${muted} flex items-center justify-between gap-2`}>
                                <span className="truncate">{selectedDate ? `Filtro giorno: ${selectedDate}` : "Nessun filtro giorno"}</span>
                                {!isPremium && (
                                    <span className="shrink-0 inline-flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5" />
                    oltre 30g blur
                  </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div className="flex-1 min-h-0 px-4 pb-6 overflow-y-auto overscroll-contain touch-pan-y">
                        {/* VISIBILI (<=30 giorni) */}
                        <div className="pt-4">
                            {visible.length > 0 ? (
                                <div className="h-[50vh] md:h-[55vh] min-h-[260px]">
                                    <VirtualizedTransactionList
                                        transactions={visible}
                                        onDelete={onDelete}
                                        onEdit={onEdit}
                                        isPremium={isPremium}
                                        onPremium={onPremium}
                                    />
                                </div>
                            ) : (
                                <div className="rounded-3xl border bg-[rgb(var(--card-2))] border-[rgb(var(--border))] p-5">
                                    <p className="text-sm font-semibold">Nessun movimento visibile (ultimi 30 giorni).</p>
                                    <p className={`mt-1 text-xs ${muted}`}>
                                        {locked.length > 0 ? "Ma hai contenuti nello storico Premium qui sotto." : "Prova a cambiare giorno o rimuovere il filtro data."}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* LOCKED (>30 giorni): preview blurrata + CTA */}
                        {!isPremium && locked.length > 0 && (
                            <div className="pt-5">
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`text-xs ${muted}`}>
                                        Storico bloccato: <span className="font-semibold">{locked.length}</span> movimenti oltre 30 giorni
                                        <span className="ml-2 opacity-80">(mostro {Math.min(LOCKED_PREVIEW_COUNT, locked.length)})</span>
                                    </p>

                                    <button
                                        onClick={() => onPremium?.("history")}
                                        className="inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm bg-[rgb(var(--card))] border-[rgb(var(--border))] shadow-sm"
                                        title="Sblocca storico completo"
                                    >
                                        <Lock className="h-4 w-4" />
                                        Sblocca
                                    </button>
                                </div>

                                <div className="mt-3 relative">
                                    <div className="pointer-events-none select-none blur-[10px] opacity-60">
                                        <TransactionList
                                            transactions={lockedPreview}
                                            onDelete={() => {}}
                                            onEdit={() => {}}
                                            isPremium={false}
                                            onPremium={onPremium}
                                        />
                                    </div>

                                    <div
                                        className="absolute inset-0 rounded-3xl bg-[linear-gradient(to_bottom,rgba(0,0,0,0.10),rgba(0,0,0,0.55))]"
                                        aria-hidden="true"
                                    />

                                    <div className="absolute inset-x-0 bottom-3 flex justify-center">
                                        <button
                                            onClick={() => onPremium?.("history")}
                                            className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm bg-[rgb(var(--card))] border-[rgb(var(--border))] shadow-lg"
                                            title="Sblocca storico completo"
                                        >
                                            <Lock className="h-4 w-4" />
                                            Storico Premium (oltre 30 giorni)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="h-[env(safe-area-inset-bottom)]" />
                    </div>
                </div>
            </div>
        </div>
    )
}
