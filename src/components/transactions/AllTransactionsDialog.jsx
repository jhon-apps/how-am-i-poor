import { useMemo, useState, useEffect } from "react"
import { X, Lock, ArrowLeft } from "lucide-react"
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
    const [daysFilter, setDaysFilter] = useState("all") // "30" | "90" | "all"

    useEffect(() => {
        if (!open) {
            setQuery("")
            setDaysFilter("all")
        }
    }, [open])

    // 1) filtro giorni
    const filteredByDays = useMemo(() => {
        if (daysFilter === "all") return transactions
        const days = daysFilter === "30" ? 30 : 90
        return transactions.filter((t) => isWithinLastDays(t.date, days))
    }, [transactions, daysFilter])

    // 2) filtro search (premium gated)
    const filtered = useMemo(() => {
        const q = norm(query)
        if (!q) return filteredByDays
        return filteredByDays.filter((t) => norm(t.description).includes(q) || norm(t.category).includes(q))
    }, [filteredByDays, query])

    // 3) split visible/locked (storico premium)
    const { visible, locked } = useMemo(() => {
        if (isPremium) return { visible: filtered, locked: [] }

        // Non premium: tutto oltre 30 giorni va in locked (anche se daysFilter è 90/all)
        const v = []
        const l = []
        for (const t of filtered) {
            if (isWithinLastDays(t.date, 30)) v.push(t)
            else l.push(t)
        }
        return { visible: v, locked: l }
    }, [filtered, isPremium])

    if (!open) return null

    const muted = "text-[rgb(var(--muted-fg))]"
    const pillBase =
        "px-3 py-2 text-sm rounded-xl border transition whitespace-nowrap " +
        "bg-[rgb(var(--card-2))] border-[rgb(var(--border))] hover:opacity-90"

    const pillActive = "bg-slate-900 text-white border-slate-900"

    return (
        <div className="fixed inset-0 z-[80]">
            {/* overlay */}
            <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

            {/* sheet wrapper */}
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
                    {/* header */}
                    <div className="shrink-0 border-b bg-[rgb(var(--card))] border-[rgb(var(--border))]">
                        <div className="pt-[env(safe-area-inset-top)]" />

                        <div className="px-4 py-3 flex items-center justify-between gap-3">
                            {/* ✅ BACK/Home */}
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
                                    {isPremium ? "Ricerca + filtri + storico completo" : "Storico completo è Premium (30+ giorni)"}
                                </p>
                            </div>

                            {/* close */}
                            <button
                                onClick={onClose}
                                className="h-10 w-10 shrink-0 rounded-2xl border bg-[rgb(var(--card-2))] border-[rgb(var(--border))] flex items-center justify-center"
                                aria-label="Chiudi"
                                title="Chiudi"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* search + filtro giorni */}
                        <div className="px-4 pb-3">
                            <div className="flex items-center gap-2">
                                {/* ✅ search più stretta */}
                                <div className="relative flex-1 min-w-0">
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

                                {/* ✅ filtro giorni */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setDaysFilter("30")}
                                        className={[pillBase, daysFilter === "30" ? pillActive : ""].join(" ")}
                                        title="Ultimi 30 giorni"
                                    >
                                        30g
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            // 90g è ok anche non premium (ma oltre 30 verrà blur/locked)
                                            setDaysFilter("90")
                                        }}
                                        className={[pillBase, daysFilter === "90" ? pillActive : ""].join(" ")}
                                        title="Ultimi 90 giorni"
                                    >
                                        90g
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setDaysFilter("all")}
                                        className={[pillBase, daysFilter === "all" ? pillActive : ""].join(" ")}
                                        title="Tutto"
                                    >
                                        Tutto
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* content scroll */}
                    <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 pb-6">
                        <div className="pt-4">
                            <TransactionList
                                transactions={visible}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                isPremium={isPremium}
                                onPremium={onPremium}
                            />
                        </div>

                        {!isPremium && locked.length > 0 && (
                            <div className="pt-5">
                                <div className="relative">
                                    <div className="pointer-events-none select-none opacity-90 blur-[2px]">
                                        <TransactionList
                                            transactions={locked}
                                            onDelete={() => {}}
                                            onEdit={() => {}}
                                            isPremium={false}
                                            onPremium={onPremium}
                                        />
                                    </div>

                                    <div className="sticky bottom-4 mt-[-88px] flex justify-center">
                                        <button
                                            onClick={() => onPremium?.("history")}
                                            className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm bg-[rgb(var(--card))] border-[rgb(var(--border))] shadow-lg"
                                            title="Sblocca storico completo"
                                        >
                                            <Lock className="h-4 w-4" />
                                            Storico Premium (30+ giorni)
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
