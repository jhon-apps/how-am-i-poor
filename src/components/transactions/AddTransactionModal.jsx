import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"

import AdSlot from "@/components/ads/AdSlot"
import usePremium from "@/hooks/usePremium"
import useAdsConsent from "@/hooks/useAdsConsent"

function normalizeAmountInput(raw) {
    // mantiene solo cifre, spazi, punto, virgola, meno
    // poi pulizia semplice: spazi via, virgola -> punto
    const s = String(raw ?? "")
        .trim()
        .replace(/\s/g, "")
        .replace(",", ".")
    return s
}

function parseAmountStrict(raw) {
    const s = normalizeAmountInput(raw)

    if (!s) return { ok: false, value: null, reason: "empty" }

    // rifiuta formati strani (es: ".", "-", "1..2", "1-2")
    if (!/^-?\d+(\.\d{0,2})?$/.test(s)) return { ok: false, value: null, reason: "format" }

    const n = Number(s)
    if (!Number.isFinite(n)) return { ok: false, value: null, reason: "nan" }

    const v = Math.round(Math.abs(n) * 100) / 100
    if (v <= 0) return { ok: false, value: null, reason: "zero" }

    return { ok: true, value: v, reason: null }
}

export default function AddTransactionModal({
                                                isOpen = false,
                                                transaction = null, // {id, type, description, amount, category, date}
                                                defaultType = "uscita",
                                                prefill = null,
                                                recentCategories = [],
                                                onClose,
                                                onSubmit,
                                                isLoading = false,
                                            }) {
    const { isPremium } = usePremium()
    const { adsConsent } = useAdsConsent()
    const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), [])

    // Scroll lock
    useEffect(() => {
        if (!isOpen) return

        const body = document.body
        const html = document.documentElement

        const prevBodyOverflow = body.style.overflow
        const prevBodyPosition = body.style.position
        const prevBodyTop = body.style.top
        const prevBodyWidth = body.style.width
        const prevHtmlOverscroll = html.style.overscrollBehaviorY

        const scrollY = window.scrollY || 0

        body.style.overflow = "hidden"
        body.style.position = "fixed"
        body.style.top = `-${scrollY}px`
        body.style.width = "100%"
        html.style.overscrollBehaviorY = "none"

        return () => {
            body.style.overflow = prevBodyOverflow
            body.style.position = prevBodyPosition
            body.style.top = prevBodyTop
            body.style.width = prevBodyWidth
            html.style.overscrollBehaviorY = prevHtmlOverscroll

            const y = Math.abs(parseInt(body.style.top || "0", 10)) || scrollY
            window.scrollTo(0, y)
        }
    }, [isOpen])

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
            amount: source.amount != null ? String(source.amount).replace(".", ",") : "",
            category: source.category ?? "altro",
            date: source.date ? String(source.date).slice(0, 10) : todayISO,
        }
    }, [prefill, transaction, initialType, todayISO])

    const [type, setType] = useState(initial.type)
    const [description, setDescription] = useState(initial.description)
    const [amount, setAmount] = useState(initial.amount)
    const [category, setCategory] = useState(initial.category)
    const [date, setDate] = useState(initial.date)

    // touched flags (per mostrare errori solo dopo interazione)
    const [tDesc, setTDesc] = useState(false)
    const [tAmount, setTAmount] = useState(false)
    const [tDate, setTDate] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        setType(initial.type)
        setDescription(initial.description)
        setAmount(initial.amount)
        setCategory(initial.category)
        setDate(initial.date)

        setTDesc(false)
        setTAmount(false)
        setTDate(false)
    }, [isOpen, initial])

    const isFuture = useMemo(() => (date ? date > todayISO : false), [date, todayISO])

    const amountParsed = useMemo(() => parseAmountStrict(amount), [amount])

    const descOk = useMemo(() => String(description || "").trim().length > 0, [description])
    const dateOk = useMemo(() => !!date && String(date).length === 10, [date])

    const canSubmit = useMemo(() => {
        if (isLoading) return false
        if (!descOk) return false
        if (!dateOk) return false
        if (!amountParsed.ok) return false
        return true
    }, [isLoading, descOk, dateOk, amountParsed.ok])

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

    const showAds = !isPremium && adsConsent !== "denied"

    const handleClose = () => onClose?.()

    const handleSubmit = (e) => {
        e?.preventDefault?.()

        // forza touched per mostrare errori se prova a salvare
        setTDesc(true)
        setTAmount(true)
        setTDate(true)

        if (!canSubmit) return

        const payload = {
            ...(transaction?.id ? { id: transaction.id } : null),
            type,
            description: String(description).trim(),
            amount: amountParsed.value,
            category: category || "altro",
            date: String(date).slice(0, 10),
        }

        onSubmit?.(payload)
    }

    const muted = "text-[rgb(var(--muted-fg))]"
    const inputBase =
        "h-12 w-full rounded-2xl border bg-[rgb(var(--card))]/70 px-4 text-[rgb(var(--fg))] outline-none placeholder:text-[rgb(var(--muted-fg))]"
    const inputBorderOk = "border-[rgb(var(--border))]"
    const inputBorderBad = "border-red-500/60"

    const amountErrorText = useMemo(() => {
        if (amountParsed.ok) return ""
        if (amountParsed.reason === "empty") return "Inserisci un importo."
        if (amountParsed.reason === "format") return "Formato non valido. Usa 12,34 oppure 12.34"
        if (amountParsed.reason === "zero") return "L’importo deve essere > 0."
        return "Importo non valido."
    }, [amountParsed])

    return (
        <AnimatePresence>
            {isOpen ? (
                <motion.div className="fixed inset-0 z-[80]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

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
                            onTouchMove={(e) => e.stopPropagation()}
                        >
                            <div className="pt-[env(safe-area-inset-top)]" />

                            <div className="flex items-center justify-between gap-3 px-5 py-4">
                                <div className="min-w-0">
                                    <p className={`text-xs ${muted}`}>HAIP</p>
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
                                    <label className="grid gap-1">
                                        <span className={`text-xs ${muted}`}>Descrizione</span>
                                        <input
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            onBlur={() => setTDesc(true)}
                                            placeholder="Es. affitto, kebab, multa…"
                                            className={[
                                                inputBase,
                                                tDesc && !descOk ? inputBorderBad : inputBorderOk,
                                            ].join(" ")}
                                            autoComplete="off"
                                        />
                                        {tDesc && !descOk ? (
                                            <p className="text-xs text-red-400">Inserisci una descrizione.</p>
                                        ) : null}
                                    </label>

                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="grid gap-1">
                                            <span className={`text-xs ${muted}`}>Importo</span>
                                            <input
                                                value={amount}
                                                onChange={(e) => {
                                                    setAmount(e.target.value)
                                                }}
                                                onBlur={() => setTAmount(true)}
                                                placeholder="0,00"
                                                className={[
                                                    inputBase,
                                                    tAmount && !amountParsed.ok ? inputBorderBad : inputBorderOk,
                                                ].join(" ")}
                                                inputMode="decimal"
                                                autoComplete="off"
                                            />
                                            {tAmount && !amountParsed.ok ? (
                                                <p className="text-xs text-red-400">{amountErrorText}</p>
                                            ) : null}
                                        </label>

                                        <label className="grid gap-1">
                                            <span className={`text-xs ${muted}`}>Data</span>
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                onBlur={() => setTDate(true)}
                                                className={[
                                                    inputBase,
                                                    tDate && !dateOk ? inputBorderBad : inputBorderOk,
                                                ].join(" ")}
                                            />
                                            {tDate && !dateOk ? (
                                                <p className="text-xs text-red-400">Seleziona una data.</p>
                                            ) : null}
                                        </label>
                                    </div>

                                    {isFuture ? (
                                        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card-2))]/80 px-4 py-3">
                                            <p className={`text-xs ${muted}`}>
                                                Nota: i movimenti nel <b>futuro</b> si vedono in lista, ma <b>non influenzano</b> grafici e statistiche (30 giorni)
                                                finché non diventano passato.
                                            </p>
                                        </div>
                                    ) : null}

                                    <label className="grid gap-1">
                                        <span className={`text-xs ${muted}`}>Categoria</span>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className={[inputBase, inputBorderOk].join(" ")}
                                        >
                                            {categories.map((c) => (
                                                <option key={c} value={c}>
                                                    {c === "altro" ? "Altro" : c}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>

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
