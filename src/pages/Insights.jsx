import { useMemo, useState, useEffect } from "react"
import { Lock, Search } from "lucide-react"

import ExpenseChart from "@/components/dashboard/ExpenseChart"
import CategoryBreakdownList from "@/components/dashboard/CategoryBreakdownList"
import TransactionList from "@/components/dashboard/TransactionList"
import AddTransactionModal from "@/components/transactions/AddTransactionModal"

import UndoToast from "@/components/ui/UndoToast"
import PremiumUpsellDialog from "@/components/ui/PremiumUpsellDialog"
import BillingNotReadyDialog from "@/components/ui/BillingNotReadyDialog"
import PremiumHub from "@/components/premium/PremiumHub"
import AdSlot from "@/components/ads/AdSlot"

import useTransactions from "@/hooks/useTransactions"
import usePremium from "@/hooks/usePremium"
import useAdsConsent from "@/hooks/useAdsConsent"

import { isLockedTransaction, canSearchTransactions, canUseAllRange } from "@/entities/premium"
import GlobalTopBar from "@/components/layout/GlobalTopBar"

function isWithinLastDays(dateISO, days) {
    const d = new Date(dateISO)
    if (Number.isNaN(d.getTime())) return false
    const diff = Date.now() - d.getTime()
    return diff <= days * 24 * 60 * 60 * 1000
}

function useDebouncedValue(value, delayMs) {
    const [v, setV] = useState(value)
    useEffect(() => {
        const t = setTimeout(() => setV(value), delayMs)
        return () => clearTimeout(t)
    }, [value, delayMs])
    return v
}

export default function Insights() {
    const { isPremium } = usePremium()
    const { adsConsent } = useAdsConsent()

    const { transactions, isLoading, add, update, remove, restore } = useTransactions()

    const [leftView, setLeftView] = useState("chart") // chart | breakdown
    const [chartRange, setChartRange] = useState("30d") // 30d | all
    const effectiveRange = canUseAllRange(isPremium) ? chartRange : "30d"

    const [query, setQuery] = useState("")
    const debouncedQuery = useDebouncedValue(query, 180)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTx, setEditingTx] = useState(null)

    const [undoOpen, setUndoOpen] = useState(false)
    const [lastDeleted, setLastDeleted] = useState(null)
    const [undoTimer, setUndoTimer] = useState(null)

    const [premiumUpsellOpen, setPremiumUpsellOpen] = useState(false)
    const [premiumReason, setPremiumReason] = useState("premium")
    const [premiumHubOpen, setPremiumHubOpen] = useState(false)
    const [billingNotReadyOpen, setBillingNotReadyOpen] = useState(false)

    const PAGE = 60
    const [visibleCount, setVisibleCount] = useState(PAGE)

    useEffect(() => {
        setVisibleCount(PAGE)
    }, [debouncedQuery, effectiveRange, transactions.length])

    useEffect(() => {
        return () => {
            if (undoTimer) clearTimeout(undoTimer)
        }
    }, [undoTimer])

    const openPremium = (reason) => {
        setPremiumReason(reason || "premium")
        setPremiumUpsellOpen(true)
    }

    const recentCategories = useMemo(() => {
        const uniq = []
        for (const t of transactions) {
            const c = t?.category
            if (!c) continue
            if (!uniq.includes(c)) uniq.push(c)
            if (uniq.length >= 6) break
        }
        return uniq
    }, [transactions])

    const chartTransactions = useMemo(() => {
        if (effectiveRange === "all") return transactions
        return transactions.filter((t) => isWithinLastDays(t.date, 30))
    }, [transactions, effectiveRange])

    const filtered = useMemo(() => {
        const canSearch = canSearchTransactions(isPremium)
        const q = canSearch ? String(debouncedQuery || "").trim().toLowerCase() : ""
        if (!q) return transactions
        return transactions.filter((t) => {
            const desc = String(t.description || "").toLowerCase()
            const cat = String(t.category || "").toLowerCase()
            return desc.includes(q) || cat.includes(q)
        })
    }, [transactions, debouncedQuery, isPremium])

    const { unlocked, locked, hasMoreUnlocked } = useMemo(() => {
        const u = []
        const l = []
        for (const t of filtered) {
            if (!t) continue
            if (isLockedTransaction(t, isPremium)) l.push(t)
            else u.push(t)
        }
        const slicedU = u.slice(0, visibleCount)
        return { unlocked: slicedU, locked: l, hasMoreUnlocked: u.length > slicedU.length }
    }, [filtered, isPremium, visibleCount])

    const handleEdit = (tx) => {
        if (isLockedTransaction(tx, isPremium)) return openPremium("history")
        setEditingTx(tx)
        setIsModalOpen(true)
    }

    const handleDelete = (id) => {
        const tx = transactions.find((t) => t.id === id)
        if (!tx) return
        if (isLockedTransaction(tx, isPremium)) return openPremium("history")

        remove(id)
        setLastDeleted(tx)
        setUndoOpen(true)

        if (undoTimer) clearTimeout(undoTimer)
        const t = setTimeout(() => {
            setUndoOpen(false)
            setLastDeleted(null)
        }, 5000)
        setUndoTimer(t)
    }

    const handleUndo = () => {
        if (!lastDeleted) return
        if (undoTimer) clearTimeout(undoTimer)
        restore(lastDeleted)
        setUndoOpen(false)
        setLastDeleted(null)
    }

    const muted = "text-[rgb(var(--muted-fg))]"
    const canSearch = canSearchTransactions(isPremium)

    return (
        <div className="min-h-[100dvh] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
            <GlobalTopBar page="Grafici e movimenti" />

            <main className="px-4 pb-10 pt-2">
                <div className="max-w-6xl mx-auto space-y-4">
                    <div className="grid gap-3 rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] p-4">
                        {/* ✅ ADS qui, non sopra la topbar */}
                        <AdSlot isPremium={isPremium} adsConsent={adsConsent} placement="insights-top" />

                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-sm font-extrabold tracking-tight">Grafico</p>
                                <p className={`text-xs ${muted}`}>{isPremium ? "30 giorni / Tutto" : "Solo 30 giorni (free)"}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setLeftView("chart")}
                                    className={[
                                        "h-9 px-3 rounded-2xl border text-xs font-semibold",
                                        leftView === "chart"
                                            ? "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
                                            : "bg-[rgb(var(--card))] border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]",
                                    ].join(" ")}
                                >
                                    Torta
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setLeftView("breakdown")}
                                    className={[
                                        "h-9 px-3 rounded-2xl border text-xs font-semibold",
                                        leftView === "breakdown"
                                            ? "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
                                            : "bg-[rgb(var(--card))] border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]",
                                    ].join(" ")}
                                >
                                    Categorie
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setChartRange("30d")}
                                className={[
                                    "h-9 px-3 rounded-2xl border text-xs font-semibold",
                                    effectiveRange === "30d"
                                        ? "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
                                        : "bg-[rgb(var(--card))] border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]",
                                ].join(" ")}
                            >
                                30 giorni
                            </button>

                            <button
                                type="button"
                                onClick={() => (canUseAllRange(isPremium) ? setChartRange("all") : openPremium("chart_all"))}
                                className={[
                                    "h-9 px-3 rounded-2xl border text-xs font-semibold inline-flex items-center gap-2",
                                    effectiveRange === "all"
                                        ? "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
                                        : "bg-[rgb(var(--card))] border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]",
                                ].join(" ")}
                            >
                                {!canUseAllRange(isPremium) ? <Lock className="h-3.5 w-3.5" /> : null}
                                Tutto
                            </button>
                        </div>

                        <div className="w-full min-w-0 overflow-hidden">
                            {leftView === "chart" ? (
                                <ExpenseChart transactions={chartTransactions} />
                            ) : (
                                <CategoryBreakdownList transactions={chartTransactions} />
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] p-4">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-extrabold tracking-tight">Movimenti</p>
                            <button
                                type="button"
                                className="rounded-2xl border px-4 py-2 text-sm bg-[rgb(var(--card))] border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]"
                                onClick={() => {
                                    setEditingTx(null)
                                    setIsModalOpen(true)
                                }}
                            >
                                Nuovo
                            </button>
                        </div>

                        <div className="mt-3 relative">
                            <input
                                value={canSearch ? query : ""}
                                onChange={(e) => {
                                    if (!canSearch) return
                                    setQuery(e.target.value)
                                }}
                                readOnly={!canSearch}
                                onClick={() => {
                                    if (!canSearch) openPremium("search")
                                }}
                                placeholder={canSearch ? "Cerca descrizione o categoria…" : "Cerca (Premium)"}
                                className={[
                                    "w-full rounded-2xl border px-3 py-2 text-sm outline-none shadow-sm",
                                    "bg-[rgb(var(--card))] border-[rgb(var(--border))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                                    !canSearch ? "cursor-pointer pr-10" : "",
                                ].join(" ")}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                {!canSearch ? <Lock className={`h-4 w-4 ${muted}`} /> : <Search className={`h-4 w-4 ${muted}`} />}
                            </div>
                        </div>

                        <div className="mt-4">
                            {isLoading ? (
                                <div className={`text-sm ${muted}`}>Carico i tuoi rimpianti…</div>
                            ) : (
                                <>
                                    <TransactionList
                                        transactions={unlocked}
                                        onDelete={handleDelete}
                                        onEdit={handleEdit}
                                        isPremium={isPremium}
                                        onPremium={openPremium}
                                    />

                                    {hasMoreUnlocked ? (
                                        <div className="mt-4 flex justify-center">
                                            <button
                                                type="button"
                                                className="rounded-2xl border px-4 py-2 text-sm bg-[rgb(var(--card))] border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]"
                                                onClick={() => setVisibleCount((n) => n + PAGE)}
                                            >
                                                Carica altri
                                            </button>
                                        </div>
                                    ) : null}

                                    {!isPremium && locked.length > 0 ? (
                                        <div className="mt-4 relative">
                                            <div className="pointer-events-none select-none blur-[10px] opacity-60">
                                                <TransactionList
                                                    transactions={locked.slice(0, 30)}
                                                    onDelete={() => {}}
                                                    onEdit={() => {}}
                                                    isPremium={false}
                                                    onPremium={openPremium}
                                                />
                                            </div>

                                            <div
                                                className="absolute inset-0 rounded-3xl bg-[linear-gradient(to_bottom,rgba(0,0,0,0.10),rgba(0,0,0,0.45))]"
                                                aria-hidden="true"
                                            />

                                            <div className="absolute inset-x-0 bottom-3 flex justify-center">
                                                <button
                                                    onClick={() => openPremium("history")}
                                                    className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm bg-[rgb(var(--card))] border-[rgb(var(--border))] shadow-lg"
                                                >
                                                    <Lock className="h-4 w-4" />
                                                    Storico Premium (oltre 30 giorni)
                                                </button>
                                            </div>
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </div>
                    </div>

                    <AdSlot isPremium={isPremium} adsConsent={adsConsent} placement="insights-bottom" />
                </div>
            </main>

            <AddTransactionModal
                key={`${isModalOpen}-${editingTx?.id ?? "new"}`}
                isOpen={isModalOpen}
                transaction={editingTx?.id ? editingTx : null}
                defaultType={editingTx?.type ?? "uscita"}
                prefill={null}
                recentCategories={recentCategories}
                onClose={() => {
                    setIsModalOpen(false)
                    setEditingTx(null)
                }}
                onSubmit={(data) => {
                    if (editingTx?.id) update(data)
                    else add(data)
                    setIsModalOpen(false)
                    setEditingTx(null)
                }}
                isLoading={false}
            />

            <UndoToast
                open={undoOpen}
                message="Movimento eliminato."
                onUndo={handleUndo}
                onClose={() => {
                    if (undoTimer) clearTimeout(undoTimer)
                    setUndoOpen(false)
                    setLastDeleted(null)
                }}
            />

            <PremiumUpsellDialog
                open={premiumUpsellOpen}
                reason={premiumReason}
                onClose={() => setPremiumUpsellOpen(false)}
                onConfirm={() => setPremiumHubOpen(true)}
            />

            <PremiumHub
                open={premiumHubOpen}
                onClose={() => setPremiumHubOpen(false)}
                onBillingNotReady={() => setBillingNotReadyOpen(true)}
            />

            <BillingNotReadyDialog open={billingNotReadyOpen} onClose={() => setBillingNotReadyOpen(false)} />

            <div className="pb-[env(safe-area-inset-bottom)]" />
        </div>
    )
}
