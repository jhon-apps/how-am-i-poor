import { useMemo, useState, useEffect } from "react"
import { Lock } from "lucide-react"

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

    // (Home non elimina, quindi undo toast resta spento ma non lo tolgo per compatibilità)
    const [undoOpen, setUndoOpen] = useState(false)

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

    // recent categories per modal
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

    // back Android: chiudi modale se aperta
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

    // pending action da notifica ricorrente → apre modale prefill
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
            {/* ✅ Header unico, come tutte le altre pagine */}
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

            {/* Home non fa delete, quindi non appare; lo tengo per compatibilità */}
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
