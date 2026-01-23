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

export default function Home({ onOpenSettings }) {
    // add/edit modal
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTx, setEditingTx] = useState(null)
    const [createType, setCreateType] = useState("uscita")

    // prefill (da notifica ricorrente)
    const [prefill, setPrefill] = useState(null)

    // all transactions dialog
    const [allOpen, setAllOpen] = useState(false)
    const [allInitialQuery, setAllInitialQuery] = useState("")

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

    // search (Premium): la Home fa solo da "lente" e apre l'elenco completo
    const [homeSearch, setHomeSearch] = useState("")

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
        if (monthStats.net < 0) return `Questo mese sei a ${formatEUR(monthStats.net)}. Respira. È solo matematica.`
        if (monthStats.net === 0) return `Equilibrio perfetto: ${formatEUR(0)}. Sospetto.`
        return `Questo mese sei a ${formatEUR(monthStats.net)}. Continua così (finché dura).`
    }, [hasAny, monthStats.net])

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
        const onScroll = () => {
            const y = window.scrollY || 0
            const goingDown = y > lastScrollY.current
            if (goingDown && y > 24) setShowHeader(false)
            else setShowHeader(true)
            lastScrollY.current = y
        }
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    const muted = "text-[rgb(var(--muted-fg))]"

    return (
        <div className="min-h-[100dvh] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
            {/* Header */}
            <div
                className={[
                    "sticky top-0 z-20 transition-transform duration-200",
                    showHeader ? "translate-y-0" : "-translate-y-full",
                    "bg-[rgb(var(--bg))]/80 backdrop-blur-xl",
                ].join(" ")}
            >
                <div className="pt-[env(safe-area-inset-top)]" />
                <div className="px-4 py-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-lg font-extrabold tracking-tight">HOW AM I POOR</h1>
                        <p className={`text-xs ${muted}`}>I miei conti • local storage • giudizio quotidiano</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            className="h-10 px-3 rounded-2xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] text-sm font-semibold hover:bg-[rgb(var(--card-2))]"
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
                            onClick={onOpenSettings}
                            title="Impostazioni"
                        >
                            <SettingsIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <main className="px-4 pb-10 pt-2">
                <div className="max-w-6xl mx-auto">
                    <BalanceCard />

                    <div className="mt-3 rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] p-5">
                        <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-sm font-extrabold tracking-tight">😈 Verdetto del giorno</p>
                                <p className={`mt-1 text-sm ${muted}`}>{insightText}</p>
                            </div>
                            <Button variant="outline" className="shrink-0" onClick={() => openNewTransaction("uscita")}>
                                <Plus className="h-4 w-4 mr-2" />
                                Nuovo
                            </Button>
                        </div>
                    </div>

                    <AdSlot isPremium={isPremium} adsConsent={adsConsent} placement="home-top" />

                    {isLoading ? (
                        <div className={`mt-6 text-sm ${muted}`}>Carico i tuoi rimpianti…</div>
                    ) : (
                        <>
                            <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-4">
                                {/* LEFT */}
                                <div className="lg:col-span-2 min-w-0 space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <h2 className="text-base font-extrabold tracking-tight">Grafico</h2>
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
                                                Elenco
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
                                                Distribuzione
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
                                            title="30 giorni"
                                        >
                                            30 giorni
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => (isPremium ? setChartRange("all") : openPremium("chart_all"))}
                                            className={[
                                                "h-9 px-3 rounded-2xl border text-xs font-semibold inline-flex items-center gap-2",
                                                effectiveRange === "all"
                                                    ? "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
                                                    : "bg-[rgb(var(--card))] border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]",
                                            ].join(" ")}
                                            title={isPremium ? "Tutto" : "Tutto (Premium)"}
                                        >
                                            {!isPremium && <Lock className="h-3.5 w-3.5" />}
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

                                    {/* ✅ Search Premium vero: apre l'elenco completo con query */}
                                    <div className="flex items-center gap-2 w-full min-w-0">
                                        <div className="relative flex-1 min-w-0">
                                            <input
                                                value={isPremium ? homeSearch : ""}
                                                onChange={(e) => {
                                                    if (!isPremium) return
                                                    const v = e.target.value
                                                    setHomeSearch(v)
                                                    setAllInitialQuery(v)
                                                    setAllOpen(true)
                                                }}
                                                readOnly={!isPremium}
                                                onClick={() => {
                                                    if (!isPremium) return openPremium("search")
                                                    setAllInitialQuery(homeSearch)
                                                    setAllOpen(true)
                                                }}
                                                placeholder={isPremium ? "Cerca tra tutti i movimenti..." : "Cerca movimenti (Premium)"}
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
                                            transactions={homeVisible}
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
                </div>
            </main>

            <AllTransactionsDialog
                open={allOpen}
                onClose={() => {
                    setAllOpen(false)
                    setAllInitialQuery("")
                    setHomeSearch("")
                }}
                transactions={transactions}
                isPremium={isPremium}
                onPremium={openPremiumFromAllDialog}
                onEdit={(tx) => openEditTransaction(tx)}
                onDelete={handleDelete}
                initialQuery={allInitialQuery}
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
