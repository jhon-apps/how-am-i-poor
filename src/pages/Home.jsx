import { useMemo, useState, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Plus, Lock, Moon, Sun, Menu, X, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"

import BalanceCard from "@/components/dashboard/BalanceCard"
import AddTransactionModal from "@/components/transactions/AddTransactionModal"

import UndoToast from "@/components/ui/UndoToast"
import PremiumUpsellDialog from "@/components/ui/PremiumUpsellDialog"
import BillingNotReadyDialog from "@/components/ui/BillingNotReadyDialog"

import PremiumHub from "@/components/premium/PremiumHub"
import AdSlot from "@/components/ads/AdSlot"

import useTransactions from "@/hooks/useTransactions"
import usePremium from "@/hooks/usePremium"
import useAdsConsent from "@/hooks/useAdsConsent"
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

function isWithinLastDays(dateISO, days) {
    const d = new Date(dateISO)
    if (Number.isNaN(d.getTime())) return false
    const diff = Date.now() - d.getTime()
    return diff <= days * 24 * 60 * 60 * 1000
}

function calcTotals(list) {
    const income = list.filter((t) => t.type === "entrata").reduce((s, t) => s + (Number(t.amount) || 0), 0)
    const expenses = list.filter((t) => t.type === "uscita").reduce((s, t) => s + (Number(t.amount) || 0), 0)
    return { income, expenses, balance: income - expenses }
}

function MenuItem({ label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left px-4 py-3 rounded-2xl hover:bg-[rgb(var(--card-2))] active:scale-[0.99]"
        >
            <span className="text-sm font-semibold">{label}</span>
        </button>
    )
}

export default function Home({ registerCloseNewTxModal }) {
    const [menuOpen, setMenuOpen] = useState(false)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTx, setEditingTx] = useState(null)
    const [createType, setCreateType] = useState("uscita")
    const [prefill, setPrefill] = useState(null)

    const [undoOpen, setUndoOpen] = useState(false)
    const [lastDeleted, setLastDeleted] = useState(null)
    const [undoTimer, setUndoTimer] = useState(null)

    const [premiumUpsellOpen, setPremiumUpsellOpen] = useState(false)
    const [premiumReason, setPremiumReason] = useState("premium")
    const [premiumHubOpen, setPremiumHubOpen] = useState(false)
    const [billingNotReadyOpen, setBillingNotReadyOpen] = useState(false)

    const { isPremium } = usePremium()
    const { adsConsent } = useAdsConsent()
    const { theme, toggleTheme } = useTheme()
    const ThemeIcon = theme === "dark" ? Moon : Sun

    const { transactions, isLoading, add, update, totals } = useTransactions()

    const [balanceScope, setBalanceScope] = useState("total") // "total" | "30d"

    const totals30d = useMemo(() => {
        const last30 = transactions.filter((t) => isWithinLastDays(t.date, 30))
        return calcTotals(last30)
    }, [transactions])

    const scopedTotals =
        balanceScope === "30d"
            ? totals30d
            : { income: totals.income, expenses: totals.expenses, balance: totals.balance }

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

    useEffect(() => {
        if (!registerCloseNewTxModal) return

        if (!isModalOpen) {
            registerCloseNewTxModal(null)
            return
        }

        registerCloseNewTxModal(() => {
            setIsModalOpen(false)
            setEditingTx(null)
            setPrefill(null)
        })

        return () => registerCloseNewTxModal(null)
    }, [isModalOpen, registerCloseNewTxModal])

    useEffect(() => {
        return () => {
            if (undoTimer) clearTimeout(undoTimer)
        }
    }, [undoTimer])

    const openPremium = (reason) => {
        setPremiumReason(reason || "premium")
        setPremiumUpsellOpen(true)
    }

    const openNewTransaction = (type) => {
        setEditingTx(null)
        setCreateType(type || "uscita")
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

    const insightText = useMemo(() => {
        if (!hasAny) return "Aggiungi 2–3 movimenti e iniziamo a giudicare in silenzio."
        const v = scopedTotals.balance
        if (v < 0) return `In ${balanceScope === "30d" ? "30 giorni" : "totale"} sei a ${formatEUR(v)}. Respira.`
        if (v === 0) return `In ${balanceScope === "30d" ? "30 giorni" : "totale"} sei perfettamente a ${formatEUR(0)}. Sospetto.`
        return `In ${balanceScope === "30d" ? "30 giorni" : "totale"} sei a ${formatEUR(v)}. Continua così (finché dura).`
    }, [hasAny, scopedTotals.balance, balanceScope])

    const muted = "text-[rgb(var(--muted-fg))]"

    return (
        <div className="min-h-[100dvh] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
            {/* Drawer menu */}
            <AnimatePresence>
                {menuOpen ? (
                    <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />

                        <motion.div
                            className="absolute left-0 top-0 h-full w-[82%] max-w-sm bg-[rgb(var(--bg))] border-r border-[rgb(var(--border))] shadow-2xl"
                            initial={{ x: -24, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -24, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        >
                            <div style={{ paddingTop: "max(env(safe-area-inset-top), 24px)" }} />

                            <div className="flex items-center justify-between px-4 py-4">
                                <div>
                                    <p className="text-xs text-[rgb(var(--muted-fg))]">HAIP</p>
                                    <p className="text-base font-extrabold tracking-tight">Menu</p>
                                </div>

                                <button
                                    type="button"
                                    className="h-10 w-10 rounded-2xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] flex items-center justify-center hover:bg-[rgb(var(--card-2))]"
                                    onClick={() => setMenuOpen(false)}
                                    title="Chiudi"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <nav className="px-2 space-y-1">
                                <MenuItem
                                    label="Premium"
                                    onClick={() => {
                                        setMenuOpen(false)
                                        window.location.hash = "#/premium"
                                    }}
                                />
                                <MenuItem
                                    label="Home"
                                    onClick={() => {
                                        setMenuOpen(false)
                                        window.location.hash = "#/"
                                    }}
                                />
                                <MenuItem
                                    label="Grafici e movimenti"
                                    onClick={() => {
                                        setMenuOpen(false)
                                        window.location.hash = "#/insights"
                                    }}
                                />
                                <MenuItem
                                    label="Ricorrenti"
                                    onClick={() => {
                                        setMenuOpen(false)
                                        window.location.hash = "#/recurring"
                                    }}
                                />
                                <MenuItem
                                    label="Profilo"
                                    onClick={() => {
                                        setMenuOpen(false)
                                        window.location.hash = "#/profile"
                                    }}
                                />
                                <MenuItem
                                    label="Notifiche"
                                    onClick={() => {
                                        setMenuOpen(false)
                                        window.location.hash = "#/notifications"
                                    }}
                                />
                                <MenuItem
                                    label="Tutorial"
                                    onClick={() => {
                                        setMenuOpen(false)
                                        window.location.hash = "#/tutorial"
                                    }}
                                />
                                <MenuItem
                                    label="About"
                                    onClick={() => {
                                        setMenuOpen(false)
                                        window.location.hash = "#/about"
                                    }}
                                />
                            </nav>

                            <div className="pb-[env(safe-area-inset-bottom)]" />
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Header */}
            <header
                className="sticky top-0 z-20 bg-[rgb(var(--bg))]/80 backdrop-blur-xl"
                style={{ paddingTop: "max(env(safe-area-inset-top), 24px)" }}
            >
                <div className="px-4 py-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-lg font-extrabold tracking-tight">HAIP</h1>
                        <p className="text-xs text-[rgb(var(--muted-fg))]">Home</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            className="
                              h-10 px-3 rounded-2xl border
                              bg-[rgb(var(--card))]
                              border-[rgba(234,179,8,0.55)]
                              text-sm font-extrabold
                              text-amber-400
                              hover:bg-[rgb(var(--card-2))]
                            "
                            onClick={() => openPremium("premium")}
                            title="Premium"
                        >
                            Premium
                        </button>

                        <button
                            type="button"
                            className="h-10 w-10 rounded-2xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] flex items-center justify-center hover:bg-[rgb(var(--card-2))]"
                            onClick={toggleTheme}
                            title="Tema"
                        >
                            <ThemeIcon className="h-4 w-4" />
                        </button>

                        <button
                            type="button"
                            className="h-10 w-10 rounded-2xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] flex items-center justify-center hover:bg-[rgb(var(--card-2))]"
                            onClick={() => setMenuOpen(true)}
                            title="Menu"
                        >
                            <Menu className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="px-4 pb-10 pt-2">
                <div className="max-w-6xl mx-auto">
                    <BalanceCard
                        balance={scopedTotals.balance}
                        income={scopedTotals.income}
                        expenses={scopedTotals.expenses}
                        scope={balanceScope}
                        onScopeChange={setBalanceScope}
                        onAddIncome={() => openNewTransaction("entrata")}
                        onAddExpense={() => openNewTransaction("uscita")}
                    />

                    <div className="mt-3 rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] p-5">
                        <p className="text-sm font-extrabold tracking-tight">😈 Verdetto del giorno</p>
                        <p className={`mt-1 text-sm ${muted}`}>{insightText}</p>
                    </div>

                    <div className="mt-5">
                        <AdSlot isPremium={isPremium} adsConsent={adsConsent} placement="home-top" />
                    </div>

                    {isLoading ? (
                        <div className={`mt-6 text-sm ${muted}`}>Carico i tuoi rimpianti…</div>
                    ) : (
                        <>
                            <div className="mt-6 grid gap-3">
                                <button
                                    type="button"
                                    onClick={() => (window.location.hash = "#/insights")}
                                    className="w-full rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] p-5 text-left hover:bg-[rgb(var(--card-2))]"
                                >
                                    <p className="text-sm font-extrabold tracking-tight">📊 Grafici e movimenti</p>
                                    <p className={`mt-1 text-sm ${muted}`}>
                                        Torta + elenco completo + search (con regole Premium).
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => (window.location.hash = "#/recurring")}
                                    className="w-full rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] p-5 text-left hover:bg-[rgb(var(--card-2))]"
                                >
                                    <p className="text-sm font-extrabold tracking-tight">🔁 Ricorrenti</p>
                                    <p className={`mt-1 text-sm ${muted}`}>Entrate/uscite fisse. Premium.</p>
                                </button>

                                {!isPremium ? (
                                    <button
                                        type="button"
                                        onClick={() => openPremium("history")}
                                        className="w-full rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] p-5 text-left hover:bg-[rgb(var(--card-2))]"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Lock className="h-4 w-4" />
                                            <p className="text-sm font-extrabold tracking-tight">Sblocca storico oltre 30 giorni</p>
                                        </div>
                                        <p className={`mt-1 text-sm ${muted}`}>Se vuoi guardare il passato, paga.</p>
                                    </button>
                                ) : null}
                            </div>

                            <div className="mt-8">
                                <AdSlot isPremium={isPremium} adsConsent={adsConsent} placement="home-bottom" />
                            </div>
                        </>
                    )}
                </div>
            </main>

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
                onUndo={() => {
                    if (!lastDeleted) return
                    // qui l’undo vero lo gestisce Insights (Home non elimina più)
                    setUndoOpen(false)
                }}
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

