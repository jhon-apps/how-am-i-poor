import { useMemo, useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

import BalanceCard from "@/components/dashboard/BalanceCard"
import ExpenseChart from "@/components/dashboard/ExpenseChart"
import CategoryBreakdownList from "@/components/dashboard/CategoryBreakdownList"
import TransactionList from "@/components/dashboard/TransactionList"
import AddTransactionModal from "@/components/transactions/AddTransactionModal"

import ResetConfirmDialog from "@/components/ui/ResetConfirmDialog"
import UndoToast from "@/components/ui/UndoToast"

import useTransactions from "@/hooks/useTransactions"
import { IS_PREMIUM } from "@/entities/premium"

function formatEUR(n) {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(n) || 0)
}

export default function Home() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTx, setEditingTx] = useState(null)
    const [showReset, setShowReset] = useState(false)

    // chart view toggle
    const [leftView, setLeftView] = useState("chart") // "chart" | "list"

    // undo state
    const [undoOpen, setUndoOpen] = useState(false)
    const [lastDeleted, setLastDeleted] = useState(null)
    const [undoTimer, setUndoTimer] = useState(null)

    const isPremium = IS_PREMIUM

    const { transactions, isLoading, add, update, remove, restore, reset, totals } = useTransactions()
    const { income, expenses, balance } = totals

    const hasAny = useMemo(() => transactions.length > 0, [transactions])

    // recent categories (for quick pills)
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

    // Insight mese corrente
    const monthKey = useMemo(() => new Date().toISOString().slice(0, 7), [])
    const monthStats = useMemo(() => {
        const monthTx = transactions.filter((t) => String(t.date).slice(0, 7) === monthKey)
        const mi = monthTx.filter((t) => t.type === "entrata").reduce((s, t) => s + (Number(t.amount) || 0), 0)
        const me = monthTx.filter((t) => t.type === "uscita").reduce((s, t) => s + (Number(t.amount) || 0), 0)
        return { mi, me, net: mi - me }
    }, [transactions, monthKey])

    const insightText = useMemo(() => {
        if (!hasAny) return "Aggiungi 2–3 movimenti e iniziamo a giudicare in silenzio."
        if (balance < 0) return `Questo mese sei a ${formatEUR(monthStats.net)}. Respira. È solo matematica.`
        if (balance === 0) return `Equilibrio perfetto: ${formatEUR(0)}. Sospetto.`
        return `Questo mese sei a ${formatEUR(monthStats.net)}. Continua così (finché dura).`
    }, [hasAny, balance, monthStats.net])

    useEffect(() => {
        return () => {
            if (undoTimer) clearTimeout(undoTimer)
        }
    }, [undoTimer])

    const handleDelete = (id) => {
        const tx = transactions.find((t) => t.id === id)
        if (!tx) return

        remove(id)

        if (undoTimer) clearTimeout(undoTimer)
        setLastDeleted(tx)
        setUndoOpen(true)

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

    return (
        <div className="min-h-screen text-slate-50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Top bar */}
            <div className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/70 backdrop-blur">
                <div className="mx-auto max-w-6xl px-4 py-4 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-extrabold tracking-tight">HOW AM I POOR</h1>
                        <p className="mt-1 text-sm text-slate-400">I miei conti • local storage • giudizio quotidiano</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => {
                                setEditingTx(null)
                                setIsModalOpen(true)
                            }}
                            className="h-11 rounded-xl px-4 gap-2 bg-slate-100 text-slate-900 hover:bg-white"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Nuovo Movimento</span>
                        </Button>

                        <Button
                            onClick={() => setShowReset(true)}
                            variant="secondary"
                            className="h-11 rounded-xl bg-slate-900/50 text-slate-100 border border-slate-800 hover:bg-slate-900"
                            title="Svuota tutti i movimenti"
                        >
                            Reset
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="mx-auto max-w-6xl px-4 py-6 md:py-8 space-y-6 pb-16">
                {isLoading ? (
                    <div className="space-y-6">
                        <div className="h-52 rounded-3xl bg-slate-900/40 border border-slate-800 animate-pulse" />
                        <div className="grid lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-2 h-80 rounded-3xl bg-slate-900/40 border border-slate-800 animate-pulse" />
                            <div className="lg:col-span-3 h-80 rounded-3xl bg-slate-900/40 border border-slate-800 animate-pulse" />
                        </div>
                    </div>
                ) : (
                    <>
                        <BalanceCard balance={balance} income={income} expenses={expenses} />

                        {/* micro insight */}
                        <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5">
                            <p className="text-sm text-slate-200">{insightText}</p>
                            {hasAny && (
                                <p className="mt-2 text-xs text-slate-400">
                                    Mese corrente: entrate {formatEUR(monthStats.mi)} • uscite {formatEUR(monthStats.me)}
                                </p>
                            )}
                        </div>

                        <div className="grid lg:grid-cols-5 gap-6">
                            {/* LEFT: chart/list toggle */}
                            <div className="lg:col-span-2 min-h-[360px] space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="inline-flex rounded-2xl border border-slate-800 bg-slate-900/30 p-1">
                                        <button
                                            onClick={() => setLeftView("chart")}
                                            className={`px-3 py-2 text-sm rounded-xl transition ${
                                                leftView === "chart" ? "bg-slate-100 text-slate-900" : "text-slate-200 hover:bg-slate-900"
                                            }`}
                                        >
                                            Grafico
                                        </button>
                                        <button
                                            onClick={() => setLeftView("list")}
                                            className={`px-3 py-2 text-sm rounded-xl transition ${
                                                leftView === "list" ? "bg-slate-100 text-slate-900" : "text-slate-200 hover:bg-slate-900"
                                            }`}
                                        >
                                            Elenco
                                        </button>
                                    </div>
                                </div>

                                {leftView === "chart" ? (
                                    <ExpenseChart transactions={transactions} />
                                ) : (
                                    <CategoryBreakdownList transactions={transactions} />
                                )}
                            </div>

                            {/* RIGHT: premium search placeholder + list */}
                            <div className="lg:col-span-3 space-y-3">
                                <div className="relative">
                                    <input
                                        disabled={!isPremium}
                                        placeholder={isPremium ? "Cerca movimenti..." : "Cerca movimenti (Premium)"}
                                        className={`w-full rounded-2xl border px-3 py-2 text-sm ${
                                            isPremium
                                                ? "bg-slate-900 border-slate-800 text-slate-100"
                                                : "bg-slate-900/40 border-slate-800 text-slate-400 cursor-not-allowed pr-10"
                                        }`}
                                    />
                                    {!isPremium && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Lock className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>

                                <TransactionList
                                    transactions={transactions}
                                    onDelete={handleDelete}
                                    onEdit={(tx) => {
                                        setEditingTx(tx)
                                        setIsModalOpen(true)
                                    }}
                                    isPremium={isPremium}
                                />
                            </div>
                        </div>

                        {!hasAny && (
                            <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5">
                                <p className="text-sm text-slate-300">
                                    Suggerimento: aggiungi 2–3 movimenti (una entrata e un paio di uscite) e la dashboard prende vita.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Modal */}
            <AddTransactionModal
                isOpen={isModalOpen}
                transaction={editingTx}
                recentCategories={recentCategories}
                onClose={() => {
                    setIsModalOpen(false)
                    setEditingTx(null)
                }}
                onSubmit={(data) => {
                    editingTx ? update(data) : add(data)
                    setIsModalOpen(false)
                    setEditingTx(null)
                }}
                isLoading={false}
            />

            {/* Reset confirm */}
            <ResetConfirmDialog
                open={showReset}
                onClose={() => setShowReset(false)}
                onConfirm={() => {
                    reset()
                    setShowReset(false)
                }}
            />

            {/* Undo toast */}
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

            {/* FAB mobile */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    setEditingTx(null)
                    setIsModalOpen(true)
                }}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-slate-100 text-slate-900 shadow-lg flex items-center justify-center md:hidden"
                aria-label="Nuovo movimento"
            >
                <Plus className="h-6 w-6" />
            </motion.button>
        </div>
    )
}
