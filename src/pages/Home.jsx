import { useMemo, useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Plus, Lock, Moon, Sun, Settings as SettingsIcon, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"

import BalanceCard from "@/components/dashboard/BalanceCard"
import ExpenseChart from "@/components/dashboard/ExpenseChart"
import CategoryBreakdownList from "@/components/dashboard/CategoryBreakdownList"
import TransactionList from "@/components/dashboard/TransactionList"
import AddTransactionModal from "@/components/transactions/AddTransactionModal"
import AllTransactionsDialog from "@/components/transactions/AllTransactionsDialog"

import UndoToast from "@/components/ui/UndoToast"
import PremiumUpsellDialog from "@/components/ui/PremiumUpsellDialog"
import BillingNotReadyDialog from "@/components/ui/BillingNotReadyDialog"

import PremiumHub from "@/components/premium/PremiumHub"
import AdSlot from "@/components/ads/AdSlot"

import useTransactions from "@/hooks/useTransactions"
import usePremium from "@/hooks/usePremium"
import useAdsConsent from "@/hooks/useAdsConsent"
import useDebouncedValue from "@/hooks/useDebouncedValue"
import useTheme from "@/hooks/useTheme"

const PENDING_KEY = "howamipoor:pendingAction:v1"
const PENDING_EVENT = "haip:pendingAction"
const RECURRING_KEY = "howamipoor:recurring:v1"

function safeParse(raw, fallback) {
    try {
        return JSON.parse(raw) ?? fallback
    } catch {
        return fallback
    }
}

function consumePendingAction() {
    const p = safeParse(localStorage.getItem(PENDING_KEY) || "null", null)
    localStorage.removeItem(PENDING_KEY)
    return p
}

function findRecurringById(id) {
    const arr = safeParse(localStorage.getItem(RECURRING_KEY) || "[]", [])
    if (!Array.isArray(arr)) return null
    return arr.find((x) => x?.id === id) || null
}

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

export default function Home({ onOpenSettings }) {
    // add/edit modal
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTx, setEditingTx] = useState(null)
    const [createType, setCreateType] = useState("uscita")

    // prefill (da notifica ricorrente)
    const [prefill, setPrefill] = useState(null)

    // all transactions dialog
    const [allOpen, setAllOpen] = useState(false)

    // left panel toggles
    const [leftView, setLeftView] = useState("chart")
    const [chartRange, setChartRange] = useState("30d")

    // undo
    const [undoOpen, setUndoOpen] = useState(false)
    const [lastDeleted, setLastDeleted] = useState(null)
    const [undoTimer, setUndoTimer] = useState(null)

    // premium flow
    const [premiumUpsellOpen, setPremiumUpsellOpen] = useState(false)
    const [premiumReason, setPremiumReason] = useState("premium")
    const [premiumHubOpen, setPremiumHubOpen] = useState(false)
    const [billingNotReadyOpen, setBillingNotReadyOpen] = useState(false)

    // search (home list only)
    const [query, setQuery] = useState("")
    const debouncedQuery = useDebouncedValue(query, 200)

    // hooks
    const { isPremium } = usePremium()
    const { adsConsent } = useAdsConsent()
    const { theme, toggleTheme } = useTheme()
    const ThemeIcon = theme === "dark" ? Moon : Sun

    const { transactions, isLoading, add, update, remove, restore, totals } = useTransactions()
    const { income, expenses, balance } = totals

    const hasAny = useMemo(() => transactions.length > 0, [transactions])

    // Home snapshot: ultimi 5
    const lastFive = useMemo(() => transactions.slice(0, 5), [transactions])

    // split per blur >30 giorni (solo non premium) sulla snapshot
    const { homeVisible, homeLocked } = useMemo(() => {
        if (isPremium) return { homeVisible: lastFive, homeLocked: [] }
        const v = []
        const l = []
        for (const t of lastFive) {
            if (isWithinLastDays(t.date, 30)) v.push(t)
            else l.push(t)
        }
        return { homeVisible: v, homeLocked: l }
    }, [lastFive, isPremium])

    // categorie recenti (per modal add)
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

    // insight mese corrente
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

    // cleanup timer undo
    useEffect(() => {
        return () => {
            if (undoTimer) clearTimeout(undoTimer)
        }
    }, [undoTimer])

    // premium opener (upsell)
    const openPremium = (reason) => {
        setPremiumReason(reason || "premium")
        setPremiumUpsellOpen(true)
    }

    // called from AllTransactionsDialog: close it, then open upsell
    const openPremiumFromAllDialog = (reason) => {
        setAllOpen(false)
        setTimeout(() => openPremium(reason), 0)
    }

    // delete with undo
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

    // chart range (premium for "all")
    const effectiveRange = isPremium ? chartRange : "30d"

    const chartTransactions = useMemo(() => {
        if (effectiveRange === "all") return transactions
        return transactions.filter((t) => isWithinLastDays(t.date, 30))
    }, [transactions, effectiveRange])

    // search in home list (premium gated) — solo sugli item visibili
    const searchedVisible = useMemo(() => {
        if (!isPremium) return homeVisible
        const q = norm(debouncedQuery)
        if (!q) return homeVisible
        return homeVisible.filter((t) => norm(t.description).includes(q) || norm(t.category).includes(q))
    }, [homeVisible, isPremium, debouncedQuery])

    // open create/edit modal
    const openNewTransaction = (type) => {
        setEditingTx(null)
        setCreateType(type || "uscita")
        setPrefill(null)
        setIsModalOpen(true)
    }

    const openEditTransaction = (tx) => {
        setEditingTx(tx)
        setPrefill(null)
        setIsModalOpen(true)
    }

    // ✅ Pending action da notifica ricorrente → modale precompilata
    useEffect(() => {
        const run = () => {
            const p = consumePendingAction()
            if (!p || p.kind !== "recurring" || !p.recurringId) return

            const rec = findRecurringById(p.recurringId)
            if (!rec) return

            const today = new Date().toISOString().slice(0, 10)

            setEditingTx(null)
            setCreateType(rec.type || "uscita")
            setPrefill({
                type: rec.type || "uscita",
                description: rec.description || "",
                amount: rec.amount ?? "",
                category: rec.category || "altro",
                date: today,
            })
            setIsModalOpen(true)
        }

        run()
        window.addEventListener(PENDING_EVENT, run)
        return () => window.removeEventListener(PENDING_EVENT, run)
    }, [])

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

    // styles
    const surface = "rounded-3xl border shadow-sm bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const surfaceSoft = "rounded-2xl border shadow-sm bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
    const muted = "text-[rgb(var(--muted-fg))]"

    return (
        <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))] pb-[env(safe-area-inset-bottom)]">
            {/* Header */}
            <div
                className={[
                    "fixed top-0 left-0 right-0 z-40 border-b transition-transform duration-300",
                    "bg-[rgb(var(--card))] border-[rgb(var(--border))]",
                    showHeader ? "translate-y-0" : "-translate-y-full",
                ].join(" ")}
            >
                <div className="pt-[env(safe-area-inset-top)]" />
                <div className="mx-auto max-w-6xl px-3 py-2 md:px-4 md:py-3">
                    <div className="flex items-center justify-between gap-2">
                        {/* LEFT */}
                        <div className="min-w-0">
                            <h1 className="font-extrabold tracking-tight leading-tight">
                                <span className="block md:hidden text-base">HAIP</span>
                                <span className="hidden md:block text-lg">HOW AM I POOR</span>
                            </h1>

                            <p className={`text-xs ${muted} truncate max-w-[18rem] sm:max-w-none`}>
                                <span className="md:hidden">I miei conti</span>
                                <span className="hidden md:inline">I miei conti • local storage • giudizio quotidiano</span>
                            </p>
                        </div>

                        {/* RIGHT */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Premium: glow più spesso (solo scritta) */}
                            <Button
                                variant="outline"
                                className="h-9 rounded-xl px-3 md:h-10 md:px-4"
                                onClick={() => setPremiumHubOpen(true)}
                                title="Premium"
                            >
                                <motion.span
                                    animate={{
                                        opacity: [1, 0.85, 1],
                                        textShadow: [
                                            "0 0 0px rgba(0,0,0,0)",
                                            "0 0 14px rgba(251,191,36,0.85)",
                                            "0 0 0px rgba(0,0,0,0)",
                                        ],
                                    }}
                                    transition={{
                                        duration: 1.2,
                                        repeat: Infinity,
                                        repeatDelay: 2.2,
                                        ease: "easeInOut",
                                    }}
                                    className="text-amber-300 font-extrabold tracking-wide"
                                >
                                    Premium
                                </motion.span>
                            </Button>

                            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Cambia tema">
                                <ThemeIcon className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onOpenSettings}
                                aria-label="Impostazioni"
                                title="Impostazioni"
                                className="h-9 w-9 rounded-xl"
                            >
                                <SettingsIcon className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spacer per header fixed */}
            <div className="h-[64px] md:h-[72px]" />

            <main className="mx-auto max-w-6xl px-3 sm:px-4 py-5 md:py-8 space-y-5 md:space-y-6 pb-16">
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
                        <BalanceCard balance={balance} income={income} expenses={expenses} onAdd={(type) => openNewTransaction(type)} />

                        {/* Insight */}
                        <div className={`${surface} p-4 md:p-5`}>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 h-10 w-1.5 rounded-full bg-slate-900" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <div className="h-9 w-9 shrink-0 rounded-2xl bg-[rgb(var(--muted))] flex items-center justify-center">
                                            <span className="text-sm">😈</span>
                                        </div>
                                        <p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>Verdetto del giorno</p>
                                    </div>

                                    <p className="mt-2 text-base md:text-lg font-extrabold tracking-tight leading-snug select-none">
                                        {insightText}
                                    </p>

                                    {hasAny && (
                                        <p className={`mt-2 text-xs ${muted}`}>
                                            Mese corrente: entrate {formatEUR(monthStats.mi)} • uscite {formatEUR(monthStats.me)} • netto{" "}
                                            <span className="font-semibold">{formatEUR(monthStats.net)}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <AdSlot isPremium={isPremium} adsConsent={adsConsent} placement="home-top" />

                        <div className="grid lg:grid-cols-5 gap-5 md:gap-6">
                            {/* LEFT */}
                            <div className="lg:col-span-2 min-w-0 min-h-[360px] space-y-3">
                                <div className="flex w-full flex-wrap items-center justify-between gap-2 min-w-0">
                                    <div className={`${surfaceSoft} p-1 inline-flex flex-wrap min-w-0`}>
                                        <button
                                            onClick={() => setLeftView("chart")}
                                            className={[
                                                "px-3 py-2 text-sm rounded-xl transition whitespace-nowrap",
                                                leftView === "chart" ? "bg-slate-900 text-white" : `text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]`,
                                            ].join(" ")}
                                        >
                                            Grafico
                                        </button>
                                        <button
                                            onClick={() => setLeftView("list")}
                                            className={[
                                                "px-3 py-2 text-sm rounded-xl transition whitespace-nowrap",
                                                leftView === "list" ? "bg-slate-900 text-white" : `text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]`,
                                            ].join(" ")}
                                        >
                                            Elenco
                                        </button>
                                    </div>

                                    <div className={`${surfaceSoft} p-1 inline-flex flex-wrap min-w-0`}>
                                        <button
                                            onClick={() => setChartRange("30d")}
                                            className={[
                                                "px-3 py-2 text-sm rounded-xl transition whitespace-nowrap",
                                                effectiveRange === "30d" ? "bg-slate-900 text-white" : `text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]`,
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
                                                "px-3 py-2 text-sm rounded-xl transition flex items-center gap-2 whitespace-nowrap",
                                                effectiveRange === "all" ? "bg-slate-900 text-white" : `text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]`,
                                            ].join(" ")}
                                            title={isPremium ? "Tutto" : "Tutto (Premium)"}
                                        >
                                            {!isPremium && <Lock className="h-3.5 w-3.5" />}
                                            Tutto
                                        </button>
                                    </div>
                                </div>

                                <div className="w-full min-w-0 overflow-hidden">
                                    {leftView === "chart" ? (
                                        <ExpenseChart transactions={chartTransactions} />
                                    ) : (
                                        <CategoryBreakdownList transactions={chartTransactions} />
                                    )}
                                </div>
                            </div>

                            {/* RIGHT */}
                            <div className="lg:col-span-3 min-w-0 space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                        <h2 className="text-base font-extrabold tracking-tight">Movimenti</h2>
                                        <p className={`text-xs ${muted}`}>Ultimi 5. Per farti male con calma.</p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setAllOpen(true)}
                                        className="shrink-0 rounded-xl border px-3 py-2 text-sm bg-[rgb(var(--card))] border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]"
                                        title="Apri elenco completo"
                                    >
                                        Vedi tutti
                                    </button>
                                </div>

                                {/* ✅ Search + Ricorrenti affianco (chiaro) */}
                                <div className="flex items-center gap-2 w-full min-w-0">
                                    <div className="relative flex-1 min-w-0">
                                        <input
                                            value={isPremium ? query : ""}
                                            onChange={(e) => setQuery(e.target.value)}
                                            readOnly={!isPremium}
                                            onClick={() => {
                                                if (!isPremium) openPremium("search")
                                            }}
                                            placeholder={isPremium ? "Cerca (ultimi 5)..." : "Cerca movimenti (Premium)"}
                                            className={[
                                                "w-full max-w-full min-w-0 rounded-2xl border px-3 py-2 text-sm outline-none shadow-sm",
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

                                    <Button
                                        variant="outline"
                                        className="h-10 rounded-2xl px-3 shrink-0"
                                        onClick={() => (window.location.hash = "#/recurring")}
                                        title="Ricorrenti"
                                    >
                                        <Repeat className="h-4 w-4 mr-2" />
                                        Ricorrenti
                                    </Button>
                                </div>

                                <div className="w-full min-w-0 overflow-hidden">
                                    <TransactionList
                                        transactions={searchedVisible}
                                        onDelete={handleDelete}
                                        onEdit={(tx) => openEditTransaction(tx)}
                                        isPremium={isPremium}
                                        onPremium={openPremium}
                                    />
                                </div>

                                {!isPremium && homeLocked.length > 0 && (
                                    <div className="pt-3">
                                        <div className="relative">
                                            <div className="pointer-events-none select-none blur-[10px] opacity-60">
                                                <TransactionList
                                                    transactions={homeLocked}
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
                                                    title="Sblocca storico"
                                                >
                                                    <Lock className="h-4 w-4" />
                                                    Storico Premium (oltre 30 giorni)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

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

                        <div className={`mt-10 text-center text-xs ${muted}`}>Built by JhonApps - jhon-apps.github.io</div>
                    </>
                )}
            </main>

            <AllTransactionsDialog
                open={allOpen}
                onClose={() => setAllOpen(false)}
                transactions={transactions}
                isPremium={isPremium}
                onPremium={openPremiumFromAllDialog}
                onEdit={(tx) => openEditTransaction(tx)}
                onDelete={handleDelete}
            />

            <AddTransactionModal
                key={`${isModalOpen}-${editingTx?.id ?? `new-${createType}`}`}
                isOpen={isModalOpen}
                transaction={editingTx?.id ? editingTx : null}
                defaultType={createType}
                prefill={prefill}
                recentCategories={recentCategories}
                onClose={() => {
                    setIsModalOpen(false)
                    setEditingTx(null)
                    setPrefill(null)
                }}
                onSubmit={(data) => {
                    if (editingTx?.id) update(data)
                    else add(data)

                    setIsModalOpen(false)
                    setEditingTx(null)
                    setPrefill(null)
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

            <BillingNotReadyDialog
                open={billingNotReadyOpen}
                onClose={() => setBillingNotReadyOpen(false)}
            />

            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openNewTransaction("uscita")}
                className="fixed right-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] h-14 w-14 rounded-full shadow-lg flex items-center justify-center md:hidden bg-slate-900 text-white"
                aria-label="Nuovo movimento"
                title="Nuovo movimento"
            >
                <Plus className="h-6 w-6" />
            </motion.button>
        </div>
    )
}
