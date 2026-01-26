import { useMemo, useState, useEffect } from "react"
import { Lock, Target } from "lucide-react"

import BalanceCard from "@/components/dashboard/BalanceCard"
import AddTransactionModal from "@/components/transactions/AddTransactionModal"

import UndoToast from "@/components/ui/UndoToast"
import PremiumUpsellDialog from "@/components/ui/PremiumUpsellDialog"
import BillingNotReadyDialog from "@/components/ui/BillingNotReadyDialog"

import PremiumHub from "@/components/premium/PremiumHub"
import AdSlot from "@/components/ads/AdSlot"

import GlobalTopBar from "@/components/layout/GlobalTopBar"

import useTransactions from "@/hooks/useTransactions"
import usePremium from "@/hooks/usePremium"
import useAdsConsent from "@/hooks/useAdsConsent"

const PENDING_KEY = "howamipoor:pendingAction:v1"
const PENDING_EVENT = "haip:pendingAction"
const RECURRING_KEY = "howamipoor:recurring:v1"

// ✅ goal key
const GOAL_KEY = "howamipoor:goal:v1"

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

/**
 * ✅ Ultimi N giorni = SOLO PASSATO:
 * include solo date con diffMs in [0 .. N giorni]
 */
function isWithinLastDays(dateISO, days) {
    const d = new Date(dateISO)
    if (Number.isNaN(d.getTime())) return false
    const diff = Date.now() - d.getTime()
    if (diff < 0) return false // futuro → escluso da stats
    return diff <= days * 24 * 60 * 60 * 1000
}

function calcTotals(list) {
    const income = list.filter((t) => t.type === "entrata").reduce((s, t) => s + (Number(t.amount) || 0), 0)
    const expenses = list.filter((t) => t.type === "uscita").reduce((s, t) => s + (Number(t.amount) || 0), 0)
    return { income, expenses, balance: income - expenses }
}

// ---- Goal helpers ----
function readGoalAmount() {
    const p = safeParse(localStorage.getItem(GOAL_KEY) || "null", null)
    const a = Number(p?.amount)
    if (!Number.isFinite(a) || a <= 0) return null
    return Math.round(a * 100) / 100
}

function writeGoalAmount(amount) {
    localStorage.setItem(GOAL_KEY, JSON.stringify({ amount, updatedAt: Date.now() }))
}

function clearGoal() {
    localStorage.removeItem(GOAL_KEY)
}

function parseAmount(raw) {
    const s = String(raw ?? "").trim().replace(/\s/g, "").replace(",", ".")
    if (!s) return null
    const n = Number(s)
    if (!Number.isFinite(n)) return null
    const v = Math.round(Math.abs(n) * 100) / 100
    if (v <= 0) return null
    return v
}

export default function Home({ registerCloseNewTxModal }) {
    const { isPremium } = usePremium()
    const { adsConsent } = useAdsConsent()

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

    // modal add/edit
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTx, setEditingTx] = useState(null)
    const [createType, setCreateType] = useState("uscita")
    const [prefill, setPrefill] = useState(null)

    // premium flows
    const [premiumUpsellOpen, setPremiumUpsellOpen] = useState(false)
    const [premiumReason, setPremiumReason] = useState("premium")
    const [premiumHubOpen, setPremiumHubOpen] = useState(false)
    const [billingNotReadyOpen, setBillingNotReadyOpen] = useState(false)

    const [undoOpen, setUndoOpen] = useState(false)

    // ✅ goal state (edit inline)
    const [goalAmount, setGoalAmount] = useState(() => readGoalAmount())
    const [goalEditing, setGoalEditing] = useState(false)
    const [goalDraft, setGoalDraft] = useState(() => (readGoalAmount() ? String(readGoalAmount()) : ""))

    useEffect(() => {
        // sync goal se cambiato altrove (dev tools / storage)
        const onStorage = (e) => {
            if (e.key !== GOAL_KEY) return
            const g = readGoalAmount()
            setGoalAmount(g)
            setGoalDraft(g ? String(g) : "")
        }
        window.addEventListener("storage", onStorage)
        return () => window.removeEventListener("storage", onStorage)
    }, [])

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

    // ✅ Goal computed on 30 giorni (solo passato)
    const spent30d = totals30d.expenses
    const goalProgress = useMemo(() => {
        if (!goalAmount) return null
        const p = spent30d / goalAmount
        if (!Number.isFinite(p)) return null
        return p
    }, [goalAmount, spent30d])

    const goalTone = useMemo(() => {
        if (!goalAmount) return null
        const p = goalProgress ?? 0
        if (p < 0.7) return { label: "Ok. Per ora stai resistendo.", level: "ok" }
        if (p < 0.9) return { label: "Stai iniziando a sudare.", level: "warn" }
        if (p <= 1) return { label: "Sei sul filo. Non fare il fenomeno.", level: "warn" }
        return { label: "Obiettivo superato. Complimenti.", level: "bad" }
    }, [goalAmount, goalProgress])

    const goalBarClass = useMemo(() => {
        if (!goalTone) return "bg-slate-900"
        if (goalTone.level === "ok") return "bg-emerald-500/70"
        if (goalTone.level === "warn") return "bg-amber-400/70"
        return "bg-rose-500/70"
    }, [goalTone])

    const saveGoal = () => {
        const v = parseAmount(goalDraft)
        if (!v) return
        writeGoalAmount(v)
        setGoalAmount(v)
        setGoalEditing(false)
    }

    const removeGoal = () => {
        clearGoal()
        setGoalAmount(null)
        setGoalDraft("")
        setGoalEditing(false)
    }

    const muted = "text-[rgb(var(--muted-fg))]"

    return (
        <div className="min-h-[100dvh] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
            <GlobalTopBar page="Home" onPremium={() => openPremium("premium")} />

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

                    {/* ✅ Goal box (gratis) */}
                    <div className="mt-3 rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <div className="h-10 w-10 rounded-2xl border bg-[rgb(var(--card-2))] border-[rgb(var(--border))] flex items-center justify-center">
                                        <Target className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-extrabold tracking-tight">Obiettivo 30 giorni</p>
                                        <p className={`text-xs ${muted}`}>
                                            Basato sulle spese degli ultimi 30 giorni (solo passato).
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setGoalEditing((v) => !v)}
                                className="rounded-2xl border px-3 py-2 text-xs font-extrabold bg-[rgb(var(--card))] border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]"
                            >
                                {goalEditing ? "Chiudi" : goalAmount ? "Modifica" : "Imposta"}
                            </button>
                        </div>

                        {!goalAmount && !goalEditing ? (
                            <div className="mt-4">
                                <p className={`text-sm ${muted}`}>
                                    Nessun obiettivo impostato. Mettilo e vediamo quanto resisti.
                                </p>
                            </div>
                        ) : null}

                        {goalEditing ? (
                            <div className="mt-4 grid gap-3">
                                <label className="grid gap-1">
                                    <span className={`text-xs ${muted}`}>Soglia spese (ultimi 30 giorni)</span>
                                    <input
                                        value={goalDraft}
                                        onChange={(e) => setGoalDraft(e.target.value)}
                                        placeholder="Es. 900"
                                        inputMode="decimal"
                                        className="h-12 w-full rounded-2xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] px-4 text-sm outline-none"
                                    />
                                </label>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={saveGoal}
                                        className="rounded-2xl border px-4 py-2 text-sm font-extrabold bg-[rgb(var(--card))] border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]"
                                    >
                                        Salva
                                    </button>

                                    {goalAmount ? (
                                        <button
                                            type="button"
                                            onClick={removeGoal}
                                            className="rounded-2xl border px-4 py-2 text-sm font-extrabold bg-[rgb(var(--card))] border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]"
                                        >
                                            Rimuovi
                                        </button>
                                    ) : null}

                                    <span className={`ml-auto text-xs ${muted}`}>Valido: numero &gt; 0</span>
                                </div>
                            </div>
                        ) : null}

                        {goalAmount && !goalEditing ? (
                            <div className="mt-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-extrabold">
                                        Speso: {formatEUR(spent30d)} / {formatEUR(goalAmount)}
                                    </p>
                                    <p className={`text-xs ${muted}`}>{goalTone?.label}</p>
                                </div>

                                <div className="mt-3 h-3 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card-2))] overflow-hidden">
                                    <div
                                        className={`h-full ${goalBarClass}`}
                                        style={{
                                            width: `${Math.min(100, Math.max(0, (goalProgress ?? 0) * 100))}%`,
                                        }}
                                    />
                                </div>

                                <p className={`mt-2 text-xs ${muted}`}>
                                    I movimenti nel futuro non contano qui finché non diventano passato.
                                </p>
                            </div>
                        ) : null}
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
                                    <p className={`mt-1 text-sm ${muted}`}>Torta + elenco completo + search (con regole Premium).</p>
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

            <UndoToast open={undoOpen} message="Movimento eliminato." onUndo={() => {}} onClose={() => setUndoOpen(false)} />

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
