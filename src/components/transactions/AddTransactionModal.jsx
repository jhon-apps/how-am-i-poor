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
        const amount = Math.abs(Number(formData.amount))

        if (desc.length < 2) {
            setError("Descrizione troppo corta.")
            return
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            setError("Inserisci un importo valido (> 0).")
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

    return (
        <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{transaction ? "Modifica movimento" : "Nuovo movimento"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* toggle type */}
                    <div className="flex gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
                        <button
                            type="button"
                            onClick={() => setTypeSafe("uscita")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition ${
                                type === "uscita"
                                    ? "bg-white dark:bg-slate-900 text-rose-500"
                                    : "text-slate-400"
                            }`}
                        >
                            <Minus size={16} /> Uscita
                        </button>

                        <button
                            type="button"
                            onClick={() => setTypeSafe("entrata")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition ${
                                type === "entrata"
                                    ? "bg-white dark:bg-slate-900 text-emerald-500"
                                    : "text-slate-400"
                            }`}
                        >
                            <Plus size={16} /> Entrata
                        </button>
                    </div>

                    {/* quick pills */}
                    <div className="flex flex-wrap gap-2">
                        {pills.map((k) => (
                            <button
                                key={k}
                                type="button"
                                onClick={() => {
                                    setError("")
                                    setFormData((p) => ({ ...p, category: k }))
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs border transition ${
                                    formData.category === k
                                        ? "bg-slate-100 text-slate-900 border-slate-200"
                                        : "bg-slate-900/40 text-slate-200 border-slate-800 hover:bg-slate-900"
                                }`}
                            >
                                {getCategoryLabel(k)}
                            </button>
                        ))}
                    </div>

                    <input
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2"
                        placeholder="Descrizione"
                        value={formData.description}
                        onChange={(e) => {
                            setError("")
                            setFormData((p) => ({ ...p, description: e.target.value }))
                        }}
                        required
                    />

                    <input
                        type="number"
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2"
                        placeholder="Importo"
                        value={formData.amount}
                        onChange={(e) => {
                            setError("")
                            setFormData((p) => ({ ...p, amount: e.target.value }))
                        }}
                        required
                    />

                    <input
                        type="date"
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2"
                        value={formData.date}
                        onChange={(e) => {
                            setError("")
                            setFormData((p) => ({ ...p, date: e.target.value }))
                        }}
                    />

                    <select
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2"
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
                        <div className="rounded-2xl border border-rose-800/40 bg-rose-900/20 px-3 py-2 text-sm text-rose-200">
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
