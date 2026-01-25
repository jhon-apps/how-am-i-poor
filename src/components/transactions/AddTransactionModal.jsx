import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X, Lock } from "lucide-react"

import AdSlot from "@/components/ads/AdSlot"
import usePremium from "@/hooks/usePremium"
import useAdsConsent from "@/hooks/useAdsConsent"

function formatISODate(d) {
    try {
        return new Date(d).toISOString().slice(0, 10)
    } catch {
        return new Date().toISOString().slice(0, 10)
    }
}

function parseAmount(raw) {
    const s = String(raw ?? "")
        .trim()
        .replace(/\s/g, "")
        .replace(",", ".")
    if (!s) return null
    const n = Number(s)
    if (!Number.isFinite(n)) return null
    return Math.round(n * 100) / 100
}

export default function AddTransactionModal({
                                                isOpen = false,
                                                transaction = null, // {id, type, description, amount, category, date}
                                                defaultType = "uscita", // "entrata" | "uscita"
                                                prefill = null, // {type, description, amount, category, date}
                                                recentCategories = [], // array string
                                                onClose,
                                                onSubmit,
                                                isLoading = false,
                                            }) {
    const { isPremium } = usePremium()
    const { adsConsent } = useAdsConsent()

    const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), [])

    // Normalizza type
    const initialType = useMemo(() => {
        const t = prefill?.type ?? transaction?.type ?? defaultType
        return t === "entrata" ? "entrata" : "uscita"
    }, [prefill?.type, transaction?.type, defaultType])

    const initial = useMemo(() => {
        const source = prefill ?? transaction ?? {}
        return {
            id: transaction?.id ?? null,
            type: initialType,
            description: source.description ?? "",
            amount: source.amount != null ? String(source.amount) : "",
            category: source.category ?? "altro",
            date: source.date ? String(source.date).slice(0, 10) : todayISO,
        }
    }, [prefill, transaction, initialType, todayISO])

    const [type, setType] = useState(initial.type)
    const [description, setDescription] = useState(initial.description)
    const [amount, setAmount] = useState(initial.amount)
    const [category, setCategory] = useState(initial.category)
    const [date, setDate] = useState(initial.date)

    // reset on open / when editing changes
    useEffect(() => {
        if (!isOpen) return
        setType(initial.type)
        setDescription(initial.description)
        setAmount(initial.amount)
        setCategory(initial.category)
        setDate(initial.date)
    }, [isOpen, initial])

    const isFuture = useMemo(() => {
        if (!date) return false
        // date è YYYY-MM-DD => confronto string OK
        return date > todayISO
    }, [date, todayISO])

    const amountNum = useMemo(() => parseAmount(amount), [amount])
    const canSubmit = useMemo(() => {
        if (isLoading) return false
        if (!description.trim()) return false
        if (amountNum == null || amountNum <= 0) return false
        if (!date) return false
        return true
    }, [description, amountNum, date, isLoading])

    // categorie: recent + fallback "altro" (dedup)
    const categories = useMemo(() => {
        const out = []
        for (const c of recentCategories || []) {
            if (!c) continue
            if (!out.includes(c)) out.push(c)
        }
        if (!out.includes("altro")) out.push("altro")
        return out
    }, [recentCategories])

    const title = transaction?.id ? "Modifica movimento" : type === "entrata" ? "Nuova entrata" : "Nuova uscita"

    const handleClose = () => {
        onClose?.()
    }

    const handleSubmit = (e) => {
        e?.preventDefault?.()
        if (!canSubmit) return

        const payload = {
            ...(transaction?.id ? { id: transaction.id } : null),
            type,
            description: description.trim(),
            amount: amountNum,
            category: category || "altro",
            date: String(date).slice(0, 10),
        }

        onSubmit?.(payload)
    }

    const showAds = !isPremium && adsConsent !== "denied"

    return (
        <AnimatePresence>
            {isOpen ? (
                <motion.div className="fixed inset-0 z-[80]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* backdrop */}
                    <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

                    {/* panel */}
                    <div className="absolute inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4">
                        <motion.div
                            className="
                w-full sm:max-w-lg
                rounded-t-3xl sm:rounded-3xl
                border border-[rgb(var(--border))]
                bg-[rgb(var(--bg))]/90
                backdrop-blur-2xl
                shadow-2xl
                overflow-hidden
              "
                            initial={{ y: 24, opacity: 0, scale: 0.98 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 24, opacity: 0, scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 420, damping: 34 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="pt-[env(safe-area-inset-top)]" />

                            <div className="flex items-center justify-between gap-3 px-5 py-4">
                                <div className="min-w-0">
                                    <p className="text-xs text-[rgb(var(--muted-fg))]">HAIP</p>
                                    <h2 className="text-lg font-extrabold tracking-tight truncate">{title}</h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="h-10 w-10 shrink-0 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:bg-[rgb(var(--card-2))]"
                                    aria-label="Chiudi"
                                    title="Chiudi"
                                >
                                    <X className="mx-auto h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="px-5 pb-5">
                                {/* type */}
                                <div className="mb-4 grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setType("entrata")}
                                        className={[
                                            "h-11 rounded-2xl border text-sm font-extrabold",
                                            type === "entrata"
                                                ? "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
                                                : "bg-[rgb(var(--card))] border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]",
                                        ].join(" ")}
                                    >
                                        Entrata
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType("uscita")}
                                        className={[
                                            "h-11 rounded-2xl border text-sm font-extrabold",
                                            type === "uscita"
                                                ? "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
                                                : "bg-[rgb(var(--card))] border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]",
                                        ].join(" ")}
                                    >
                                        Uscita
                                    </button>
                                </div>

                                <div className="grid gap-3">
                                    {/* descrizione */}
                                    <label className="grid gap-1">
                                        <span className="text-xs text-[rgb(var(--muted-fg))]">Descrizione</span>
                                        <input
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Es. affitto, kebab, multa…"
                                            className="
                        h-12 w-full rounded-2xl
                        border border-[rgb(var(--border))]
                        bg-[rgb(var(--card))]/70
                        px-4 text-[rgb(var(--fg))]
                        outline-none
                        placeholder:text-[rgb(var(--muted-fg))]
                      "
                                            autoComplete="off"
                                        />
                                    </label>

                                    {/* amount + date */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="grid gap-1">
                                            <span className="text-xs text-[rgb(var(--muted-fg))]">Importo</span>
                                            <input
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="0,00"
                                                className="
                          h-12 w-full rounded-2xl
                          border border-[rgb(var(--border))]
                          bg-[rgb(var(--card))]/70
                          px-4 text-[rgb(var(--fg))]
                          outline-none
                          placeholder:text-[rgb(var(--muted-fg))]
                        "
                                                inputMode="decimal"
                                                autoComplete="off"
                                            />
                                        </label>

                                        <label className="grid gap-1">
                                            <span className="text-xs text-[rgb(var(--muted-fg))]">Data</span>
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="
                          h-12 w-full rounded-2xl
                          border border-[rgb(var(--border))]
                          bg-[rgb(var(--card))]/70
                          px-4 text-[rgb(var(--fg))]
                          outline-none
                        "
                                            />
                                        </label>
                                    </div>

                                    {/* future message */}
                                    {isFuture ? (
                                        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card-2))]/80 px-4 py-3">
                                            <p className="text-xs text-[rgb(var(--muted-fg))]">
                                                Nota: i movimenti nel <b>futuro</b> si vedono in lista, ma <b>non influenzano</b> grafici e statistiche (30 giorni)
                                                finché non diventano passato.
                                            </p>
                                        </div>
                                    ) : null}

                                    {/* category */}
                                    <label className="grid gap-1">
                                        <span className="text-xs text-[rgb(var(--muted-fg))]">Categoria</span>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="
                        h-12 w-full rounded-2xl
                        border border-[rgb(var(--border))]
                        bg-[rgb(var(--card))]/70
                        px-4 text-[rgb(var(--fg))]
                        outline-none
                      "
                                        >
                                            {categories.map((c) => (
                                                <option key={c} value={c}>
                                                    {c === "altro" ? "Altro" : c}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>

                                {/* actions */}
                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="h-12 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:bg-[rgb(var(--card-2))] text-sm font-extrabold"
                                    >
                                        Annulla
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={!canSubmit}
                                        className={[
                                            "h-12 rounded-2xl border text-sm font-extrabold",
                                            canSubmit
                                                ? "bg-[rgb(var(--fg))] text-[rgb(var(--bg))] border-[rgb(var(--fg))]"
                                                : "bg-[rgb(var(--card))] text-[rgb(var(--muted-fg))] border-[rgb(var(--border))] opacity-70",
                                        ].join(" ")}
                                        title={!canSubmit ? "Completa descrizione/importo/data" : "Salva"}
                                    >
                                        {isLoading ? "Salvo…" : "Salva"}
                                    </button>
                                </div>

                                {/* ✅ Ads in fondo: solo free */}
                                {showAds ? (
                                    <div className="mt-6">
                                        <AdSlot placement="modal-new-transaction-bottom" isPremium={isPremium} adsConsent={adsConsent} />
                                    </div>
                                ) : null}

                                <div className="pb-[env(safe-area-inset-bottom)]" />
                            </form>
                        </motion.div>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}
