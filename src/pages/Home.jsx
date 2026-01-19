import { useMemo, useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Plus, Lock, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

import BalanceCard from "@/components/dashboard/BalanceCard"
import ExpenseChart from "@/components/dashboard/ExpenseChart"
import CategoryBreakdownList from "@/components/dashboard/CategoryBreakdownList"
import TransactionList from "@/components/dashboard/TransactionList"
import AddTransactionModal from "@/components/transactions/AddTransactionModal"

import ResetConfirmDialog from "@/components/ui/ResetConfirmDialog"
import UndoToast from "@/components/ui/UndoToast"
import PremiumUpsellDialog from "@/components/ui/PremiumUpsellDialog"

import PremiumHub from "@/components/premium/PremiumHub"
import AdSlot from "@/components/ads/AdSlot"

import useTransactions from "@/hooks/useTransactions"
import usePremium from "@/hooks/usePremium"
import useAdsConsent from "@/hooks/useAdsConsent"
import useDebouncedValue from "@/hooks/useDebouncedValue"
import useTheme from "@/hooks/useTheme"

function formatEUR(n) {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(n) || 0)
}

function norm(s) {
    return String(s || "").toLowerCase().trim()
}

function isWithinLastDays(dateISO, days) {
    const d = new Date(dateISO)
    if (Number.isNaN(d.getTime())) return false
    const diff = Date.now() - d.getTime()
    return diff <= days * 24 * 60 * 60 * 1000
}

export default function Home() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTx, setEditingTx] = useState(null)

    const [showReset, setShowReset] = useState(false)

    // Left panel toggles
    const [leftView, setLeftView] = useState("chart") // "chart" | "list"
    const [chartRange, setChartRange] = useState("30d") // "30d" | "all"

    // undo
    const [undoOpen, setUndoOpen] = useState(false)
    const [lastDeleted, setLastDeleted] = useState(null)
    const [undoTimer, setUndoTimer] = useState(null)

    // premium
    const [premiumUpsellOpen, setPremiumUpsellOpen] = useState(false)
    const [premiumReason, setPremiumReason] = useState("premium")
    const [premiumHubOpen, setPremiumHubOpen] = useState(false)

    // search (premium)
    const [query, setQuery] = useState("")
    const debouncedQuery = useDebouncedValue(query, 200)

    const { isPremium, enablePremium } = usePremium()
    const { adsConsent } = useAdsConsent()

    const { theme, toggleTheme } = useTheme()
    const ThemeIcon = theme === "dark" ? Moon : Sun

    const { transactions, isLoading, add, update, remove, restore, reset, totals } = useTransactions()
    const { income, expenses, balance } = totals

    const hasAny = useMemo(() => transactions.length > 0, [transactions])

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

    const openPremium = (reason) => {
        setPremiumReason(reason)
        setPremiumUpsellOpen(true)
    }

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

    const effectiveRange = isPremium ? chartRange : "30d"

    const chartTransactions = useMemo(() => {
        if (effectiveRange === "all") return transactions
        return transactions.filter((t) => isWithinLastDays(t.date, 30))
    }, [transactions, effectiveRange])

    const filteredTransactions = useMemo(() => {
        if (!isPremium) return transactions
        const q = norm(debouncedQuery)
        if (!q) return transactions

        return transactions.filter((t) => {
            const d = norm(t.description)
            const c = norm(t.category)
            return d.includes(q) || c.includes(q)
        })
    }, [transactions, isPremium, debouncedQuery])

    /**
     * HEADER: hide on scroll
     */
    const [showHeader, setShowHeader] = useState(true)
    const lastScrollY = useRef(0)

    useEffect(() => {
        let ticking = false

        const onScroll = () => {
            if (ticking) return
            ticking = true

            window.requestAnimationFrame(() => {
                const currentY = window.scrollY || 0

                if (currentY < 8) setShowHeader(true)
                else if (currentY > lastScrollY.current && currentY > 64) setShowHeader(false)
                else if (currentY < lastScrollY.current) setShowHeader(true)

                lastScrollY.current = currentY
                ticking = false
            })
        }

        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    // Surface helpers (deterministiche via CSS vars)
    const surface = "rounded-3xl border shadow-sm bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const surfaceSoft = "rounded-2xl border shadow-sm bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
    const muted = "text-[rgb(var(--muted-fg))]"

    return (
        <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
            {/* Top bar – hide on scroll */}
            <div
                className={[
                    "fixed top-0 left-0 right-0 z-40 border-b transition-transform duration-300",
                    "bg-[rgb(var(--card))] border-[rgb(var(--border))]",
                    showHeader ? "translate-y-0" : "-translate-y-full",
                ].join(" ")}
            >
                <div className="pt-[env(safe-area-inset-top)]" />

                <div className="mx-auto max-w-6xl px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="text-lg font-extrabold tracking-tight truncate">HOW AM I POOR</h1>
                            <p className={`text-xs ${muted} truncate`}>I miei conti • local storage • giudizio quotidiano</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {/* ONE BUTTON: light <-> dark */}
                            <Button
                                variant="ghost"
                                className="h-10 w-10 rounded-xl p-0"
                                onClick={toggleTheme}
                                title={theme === "dark" ? "Tema: Scuro (clic per Chiaro)" : "Tema: Chiaro (clic per Scuro)"}
                                aria-label="Cambia tema"
                            >
                                <ThemeIcon className="h-4 w-4" />
                            </Button>

                            <Button variant="ghost" className="h-10 rounded-xl" onClick={() => setPremiumHubOpen(true)} title="Premium">
                                Premium
                            </Button>

                            <Button
                                onClick={() => {
                                    setEditingTx(null)
                                    setIsModalOpen(true)
                                }}
                                className="h-10 w-10 rounded-xl p-0 bg-slate-900 text-white hover:opacity-90"
                                aria-label="Nuovo movimento"
                                title="Nuovo movimento"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>

                            <Button
                                onClick={() => setShowReset(true)}
                                variant="secondary"
                                className="h-10 rounded-xl border hidden sm:inline-flex bg-[rgb(var(--muted))] border-[rgb(var(--border))] text-[rgb(var(--fg))] hover:opacity-90"
                                title="Svuota tutti i movimenti"
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spacer per header fixed */}
            <div className="h-[72px]" />

            <main className="mx-auto max-w-6xl px-4 py-6 md:py-8 space-y-6 pb-16">
                {isLoading ? (
                    <div className="space-y-6">
                        <div className="h-52 rounded-3xl border animate-pulse bg-[rgb(var(--card-2))] border-[rgb(var(--border))]" />
                        <div className="grid lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-2 h-80 rounded-3xl border animate-pulse bg-[rgb(var(--card-2))] border-[rgb(var(--border))]" />
                            <div className="lg:col-span-3 h-80 rounded-3xl border animate-pulse bg-[rgb(var(--card-2))] border-[rgb(var(--border))]" />
                        </div>
                    </div>
                ) : (
                    <>
                        <BalanceCard balance={balance} income={income} expenses={expenses} />

                        {/* Insight */}
                        <div className={`${surface} p-5`}>
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 h-9 w-9 shrink-0 rounded-2xl bg-[rgb(var(--muted))] flex items-center justify-center">
                                    <span className="text-sm">😈</span>
                                </div>

                                <div className="min-w-0">
                                    <p className="font-semibold tracking-tight truncate">{insightText}</p>
                                    {hasAny && (
                                        <p className={`mt-1 text-xs ${muted}`}>
                                            Mese corrente: entrate {formatEUR(monthStats.mi)} • uscite {formatEUR(monthStats.me)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ADS TOP */}
                        <AdSlot isPremium={isPremium} adsConsent={adsConsent} placement="home-top" />

                        <div className="grid lg:grid-cols-5 gap-6">
                            {/* LEFT */}
                            <div className="lg:col-span-2 min-h-[360px] space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className={`${surfaceSoft} p-1 inline-flex`}>
                                        <button
                                            onClick={() => setLeftView("chart")}
                                            className={[
                                                "px-3 py-2 text-sm rounded-xl transition",
                                                leftView === "chart"
                                                    ? "bg-slate-900 text-white"
                                                    : `text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]`,
                                            ].join(" ")}
                                        >
                                            Grafico
                                        </button>
                                        <button
                                            onClick={() => setLeftView("list")}
                                            className={[
                                                "px-3 py-2 text-sm rounded-xl transition",
                                                leftView === "list"
                                                    ? "bg-slate-900 text-white"
                                                    : `text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]`,
                                            ].join(" ")}
                                        >
                                            Elenco
                                        </button>
                                    </div>

                                    <div className={`${surfaceSoft} p-1 inline-flex`}>
                                        <button
                                            onClick={() => setChartRange("30d")}
                                            className={[
                                                "px-3 py-2 text-sm rounded-xl transition",
                                                effectiveRange === "30d"
                                                    ? "bg-slate-900 text-white"
                                                    : `text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]`,
                                            ].join(" ")}
                                            title="Ultimi 30 giorni"
                                        >
                                            30 giorni
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (!isPremium) {
                                                    openPremium("history")
                                                    return
                                                }
                                                setChartRange("all")
                                            }}
                                            className={[
                                                "px-3 py-2 text-sm rounded-xl transition flex items-center gap-2",
                                                effectiveRange === "all"
                                                    ? "bg-slate-900 text-white"
                                                    : `text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]`,
                                            ].join(" ")}
                                            title={isPremium ? "Tutto" : "Tutto (Premium)"}
                                        >
                                            {!isPremium && <Lock className="h-3.5 w-3.5" />}
                                            Tutto
                                        </button>
                                    </div>
                                </div>

                                {leftView === "chart" ? (
                                    <ExpenseChart transactions={chartTransactions} />
                                ) : (
                                    <CategoryBreakdownList transactions={chartTransactions} />
                                )}
                            </div>

                            {/* RIGHT */}
                            <div className="lg:col-span-3 space-y-3">
                                <div className="relative">
                                    <input
                                        value={isPremium ? query : ""}
                                        onChange={(e) => setQuery(e.target.value)}
                                        readOnly={!isPremium}
                                        onClick={() => {
                                            if (!isPremium) openPremium("search")
                                        }}
                                        placeholder={isPremium ? "Cerca movimenti..." : "Cerca movimenti (Premium)"}
                                        className={[
                                            "w-full rounded-2xl border px-3 py-2 text-sm outline-none shadow-sm",
                                            "bg-[rgb(var(--card))] border-[rgb(var(--border))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                                            !isPremium ? "cursor-pointer pr-10" : "",
                                        ].join(" ")}
                                    />
                                    {!isPremium && (
                                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${muted} pointer-events-none`}>
                                            <Lock className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>

                                <TransactionList
                                    transactions={filteredTransactions}
                                    onDelete={handleDelete}
                                    onEdit={(tx) => {
                                        setEditingTx(tx)
                                        setIsModalOpen(true)
                                    }}
                                    isPremium={isPremium}
                                    onPremium={openPremium}
                                />
                            </div>
                        </div>

                        {/* ADS BOTTOM */}
                        <AdSlot isPremium={isPremium} adsConsent={adsConsent} placement="home-bottom" />

                        <footer className={`mt-10 text-center text-xs ${muted}`}>
                            <a
                                href="https://jhon-apps.github.io/how-am-i-poor/privacy.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:opacity-80"
                            >
                                Privacy Policy
                            </a>
                        </footer>
                    </>
                )}
            </main>

            <AddTransactionModal
                key={`${isModalOpen}-${editingTx?.id ?? "new"}`}
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

            <ResetConfirmDialog
                open={showReset}
                onClose={() => setShowReset(false)}
                onConfirm={() => {
                    reset()
                    setShowReset(false)
                }}
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
                onConfirm={() => {
                    enablePremium()
                    setPremiumUpsellOpen(false)
                }}
            />

            <PremiumHub
                open={premiumHubOpen}
                onClose={() => setPremiumHubOpen(false)}
                isPremium={isPremium}
                onSubscribe={() => enablePremium()}
            />

            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    setEditingTx(null)
                    setIsModalOpen(true)
                }}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg flex items-center justify-center md:hidden bg-slate-900 text-white"
                aria-label="Nuovo movimento"
            >
                <Plus className="h-6 w-6" />
            </motion.button>
        </div>
    )
}
