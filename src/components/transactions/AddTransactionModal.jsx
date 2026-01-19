import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus, Minus } from "lucide-react"
import {
    getCategoriesByType,
    getDefaultCategoryByType,
    isCategoryAllowedForType,
    getCategoryLabel,
} from "@/entities/categories"

const today = () => new Date().toISOString().split("T")[0]

function buildInitialState(transaction) {
    const type = transaction?.type ?? "uscita"
    const categoryFromTx = transaction?.category
    const category =
        categoryFromTx && isCategoryAllowedForType(categoryFromTx, type)
            ? categoryFromTx
            : getDefaultCategoryByType(type)

    return {
        type,
        formData: {
            description: transaction?.description ?? "",
            amount: transaction?.amount ?? "",
            date: (transaction?.date ?? today()).slice(0, 10),
            category,
        },
        error: "",
    }
}

// ✅ Parser robusto per importi IT/EN
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
                                            }) {
    const initial = useMemo(() => buildInitialState(transaction), [transaction])
    const [type, setType] = useState(initial.type)
    const [formData, setFormData] = useState(initial.formData)
    const [error, setError] = useState(initial.error)

    const categoriesForType = useMemo(() => getCategoriesByType(type), [type])

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

    const setTypeSafe = (nextType) => {
        setError("")
        setType(nextType)
        setFormData((p) => {
            if (isCategoryAllowedForType(p.category, nextType)) return p
            return { ...p, category: getDefaultCategoryByType(nextType) }
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setError("")

        const desc = String(formData.description || "").trim()
        const parsed = parseAmount(formData.amount)
        const amount = Math.abs(parsed)

        if (desc.length < 2) {
            setError("Descrizione troppo corta.")
            return
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            setError("Inserisci un importo valido (> 0). Esempio: 10,50")
            return
        }
        if (!formData.date) {
            setError("Seleziona una data valida.")
            return
        }
        if (!isCategoryAllowedForType(formData.category, type)) {
            setError("Categoria non valida per questo tipo.")
            return
        }

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

    return (
        <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{transaction ? "Modifica movimento" : "Nuovo movimento"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* toggle type */}
                    <div
                        className="flex gap-2 p-1 rounded-2xl border
                       bg-[rgb(var(--muted))] border-[rgb(var(--border))]"
                    >
                        <button
                            type="button"
                            onClick={() => setTypeSafe("uscita")}
                            className={[
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition text-sm font-medium border",
                                type === "uscita"
                                    ? "bg-[rgb(var(--card))] border-[rgb(var(--border))] text-rose-700"
                                    : "bg-transparent border-transparent text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--card))] hover:border-[rgb(var(--border))]",
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
                                    ? "bg-[rgb(var(--card))] border-[rgb(var(--border))] text-emerald-700"
                                    : "bg-transparent border-transparent text-[rgb(var(--muted-fg))] hover:bg-[rgb(var(--card))] hover:border-[rgb(var(--border))]",
                            ].join(" ")}
                        >
                            <Plus size={16} /> Entrata
                        </button>
                    </div>

                    {/* quick pills */}
                    <div className="flex flex-wrap gap-2">
                        {pills.map((k) => {
                            const selected = formData.category === k
                            return (
                                <button
                                    key={k}
                                    type="button"
                                    onClick={() => {
                                        setError("")
                                        setFormData((p) => ({ ...p, category: k }))
                                    }}
                                    className={[
                                        pillBase,
                                        selected
                                            ? "bg-slate-900 text-white border-slate-900"
                                            : "bg-[rgb(var(--card))] text-[rgb(var(--fg))] border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]",
                                    ].join(" ")}
                                >
                                    {getCategoryLabel(k)}
                                </button>
                            )
                        })}
                    </div>

                    <input
                        className={inputBase}
                        placeholder="Descrizione"
                        value={formData.description}
                        onChange={(e) => {
                            setError("")
                            setFormData((p) => ({ ...p, description: e.target.value }))
                        }}
                        required
                    />

                    <input
                        type="text"
                        inputMode="decimal"
                        className={inputBase}
                        placeholder="Importo (es. 10,50)"
                        value={formData.amount}
                        onChange={(e) => {
                            setError("")
                            setFormData((p) => ({ ...p, amount: e.target.value }))
                        }}
                        required
                    />

                    <input
                        type="date"
                        className={inputBase}
                        value={formData.date}
                        onChange={(e) => {
                            setError("")
                            setFormData((p) => ({ ...p, date: e.target.value }))
                        }}
                    />

                    <select
                        className={selectBase}
                        value={formData.category}
                        onChange={(e) => {
                            setError("")
                            setFormData((p) => ({ ...p, category: e.target.value }))
                        }}
                    >
                        {categoriesForType.map((c) => (
                            <option key={c.key} value={c.key}>
                                {c.label}
                            </option>
                        ))}
                    </select>

                    {error && (
                        <div className="rounded-2xl border px-3 py-2 text-sm bg-rose-50 border-rose-200 text-rose-800">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {transaction ? "Salva modifiche" : "Aggiungi movimento"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
