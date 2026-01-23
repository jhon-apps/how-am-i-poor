import { useMemo, useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus, Minus } from "lucide-react"
import {
    getCategoriesByType,
    getDefaultCategoryByType,
    isCategoryAllowedForType,
    getCategoryLabel,
} from "@/entities/categories"
import { suggestCategory } from "@/entities/autoCategory"

const today = () => new Date().toISOString().split("T")[0]

function buildInitialState({ transaction, prefill, defaultType }) {
    const baseType = transaction?.type ?? prefill?.type ?? defaultType ?? "uscita"

    const categoryFromTx = transaction?.category ?? prefill?.category
    const category =
        categoryFromTx && isCategoryAllowedForType(categoryFromTx, baseType)
            ? categoryFromTx
            : getDefaultCategoryByType(baseType)

    return {
        type: baseType,
        formData: {
            description: transaction?.description ?? prefill?.description ?? "",
            amount: transaction?.amount ?? prefill?.amount ?? "",
            date: (transaction?.date ?? prefill?.date ?? today()).slice(0, 10),
            category,
        },
        error: "",
    }
}

function parseAmount(raw) {
    if (raw == null) return NaN
    let s = String(raw).trim()
    s = s.replace(/\s/g, "")
    s = s.replace(/[€$£]/g, "")
    if (s.includes(".") && s.includes(",")) {
        s = s.replace(/\./g, "")
        s = s.replace(",", ".")
        return Number(s)
    }
    if (s.includes(",") && !s.includes(".")) {
        s = s.replace(",", ".")
        return Number(s)
    }
    return Number(s)
}

export default function AddTransactionModal({
                                                isOpen,
                                                onClose,
                                                onSubmit,
                                                transaction,
                                                isLoading,
                                                recentCategories = [],
                                                defaultType = "uscita",
                                                prefill = null, // ✅ NEW
                                            }) {
    const initial = useMemo(
        () => buildInitialState({ transaction, prefill, defaultType }),
        [transaction, prefill, defaultType]
    )

    const [type, setType] = useState(initial.type)
    const [formData, setFormData] = useState(initial.formData)
    const [error, setError] = useState(initial.error)

    // autocategory
    const [manualCategory, setManualCategory] = useState(false)
    const [suggested, setSuggested] = useState(null)

    // getCategoriesByType() ritorna OGGETTI {key,label}; qui lavoriamo sempre con chiavi stringa
    const categoryKeysForType = useMemo(
        () => getCategoriesByType(type).map((c) => c?.key).filter(Boolean),
        [type]
    )

    const pills = useMemo(() => {
        const uniq = []
        for (const c of recentCategories) {
            if (!c) continue
            if (!isCategoryAllowedForType(c, type)) continue
            if (!uniq.includes(c)) uniq.push(c)
            if (uniq.length >= 4) break
        }
        if (!uniq.length) {
            return type === "entrata"
                ? ["stipendio", "entrate_extra", "bonus", "altro"]
                : ["cibo", "casa", "trasporti", "altro"]
        }
        return uniq
    }, [recentCategories, type])

    // Reset stato quando cambia edit/new/prefill
    useEffect(() => {
        const next = buildInitialState({ transaction, prefill, defaultType })
        setType(next.type)
        setFormData(next.formData)
        setError("")
        setManualCategory(false)
        setSuggested(null)
    }, [transaction, prefill, defaultType, isOpen])

    const setTypeSafe = (nextType) => {
        setError("")
        setType(nextType)
        setManualCategory(false)
        setFormData((p) => {
            if (isCategoryAllowedForType(p.category, nextType)) return p
            return { ...p, category: getDefaultCategoryByType(nextType) }
        })
    }

    useEffect(() => {
        const s = suggestCategory(formData.description, type)
        const valid = s && isCategoryAllowedForType(s, type) ? s : null
        setSuggested(valid)

        if (!manualCategory && valid) {
            setFormData((p) => (p.category === valid ? p : { ...p, category: valid }))
        }
    }, [formData.description, type, manualCategory])

    const handleSubmit = (e) => {
        e.preventDefault()
        setError("")

        const desc = String(formData.description || "").trim()
        const parsed = parseAmount(formData.amount)
        const amount = Math.abs(parsed)

        if (desc.length < 2) return setError("Descrizione troppo corta.")
        if (!Number.isFinite(amount) || amount <= 0) return setError("Inserisci un importo valido (> 0).")
        if (!formData.date) return setError("Seleziona una data valida.")
        if (!isCategoryAllowedForType(formData.category, type)) return setError("Categoria non valida per questo tipo.")

        onSubmit({
            ...(transaction ?? {}),
            ...formData,
            description: desc,
            amount,
            type,
        })
    }

    const inputBase =
        "w-full rounded-xl border px-3 py-2 outline-none transition shadow-sm " +
        "bg-[rgb(var(--card))] border-[rgb(var(--border))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]"

    const selectBase =
        "w-full rounded-xl border px-3 py-2 outline-none transition shadow-sm " +
        "bg-[rgb(var(--card))] border-[rgb(var(--border))] text-[rgb(var(--fg))]"

    const pillBase = "px-3 py-1.5 rounded-full text-xs border transition"
    const muted = "text-[rgb(var(--muted-fg))]"
    const card = "bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const soft = "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"

    return (
        <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{transaction?.id ? "Modifica movimento" : "Nuovo movimento"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className={`flex gap-2 p-1 rounded-2xl border ${soft}`}>
                        <button
                            type="button"
                            onClick={() => setTypeSafe("uscita")}
                            className={[
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition text-sm font-medium border",
                                type === "uscita"
                                    ? `bg-[rgb(var(--card))] border-[rgb(var(--border))] text-rose-700`
                                    : `bg-transparent border-transparent ${muted} hover:bg-[rgb(var(--card))] hover:border-[rgb(var(--border))]`,
                            ].join(" ")}
                        >
                            <Minus size={16} /> Uscita
                        </button>

                        <button
                            type="button"
                            onClick={() => setTypeSafe("entrata")}
                            className={[
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition text-sm font-medium border",
                                type === "entrata"
                                    ? `bg-[rgb(var(--card))] border-[rgb(var(--border))] text-emerald-700`
                                    : `bg-transparent border-transparent ${muted} hover:bg-[rgb(var(--card))] hover:border-[rgb(var(--border))]`,
                            ].join(" ")}
                        >
                            <Plus size={16} /> Entrata
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {pills.map((k) => {
                            const selected = formData.category === k
                            return (
                                <button
                                    key={k}
                                    type="button"
                                    onClick={() => {
                                        setError("")
                                        setManualCategory(true)
                                        setFormData((p) => ({ ...p, category: k }))
                                    }}
                                    className={[
                                        pillBase,
                                        selected
                                            ? "bg-slate-900 text-white border-slate-900"
                                            : `${card} ${muted} hover:bg-[rgb(var(--card-2))]`,
                                    ].join(" ")}
                                >
                                    {getCategoryLabel(k)}
                                </button>
                            )
                        })}
                    </div>

                    <input
                        className={inputBase}
                        value={formData.description}
                        onChange={(e) => {
                            setError("")
                            setFormData((p) => ({ ...p, description: e.target.value }))
                        }}
                        placeholder="Descrizione"
                        autoFocus
                    />

                    <div className="grid grid-cols-2 gap-2">
                        <input
                            className={inputBase}
                            value={formData.amount}
                            onChange={(e) => {
                                setError("")
                                setFormData((p) => ({ ...p, amount: e.target.value }))
                            }}
                            placeholder="Importo"
                            inputMode="decimal"
                        />
                        <input
                            className={inputBase}
                            type="date"
                            value={formData.date}
                            onChange={(e) => {
                                setError("")
                                setFormData((p) => ({ ...p, date: e.target.value }))
                            }}
                        />
                    </div>

                    <select
                        className={selectBase}
                        value={formData.category}
                        onChange={(e) => {
                            setError("")
                            setManualCategory(true)
                            setFormData((p) => ({ ...p, category: e.target.value }))
                        }}
                    >
                        {categoryKeysForType.map((key) => (
                            <option key={key} value={key}>
                                {getCategoryLabel(key)}
                            </option>
                        ))}
                    </select>

                    {error && (
                        <div className="rounded-xl border px-3 py-2 text-sm bg-rose-50 text-rose-800 border-rose-200">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-2 pt-1">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                            Annulla
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isLoading}>
                            {transaction?.id ? "Salva" : "Aggiungi"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
