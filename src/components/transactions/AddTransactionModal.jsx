import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus, Minus } from "lucide-react"
import { CATEGORIES, DEFAULT_CATEGORY } from "@/entities/categories"

export default function AddTransactionModal({
                                                isOpen,
                                                onClose,
                                                onSubmit,
                                                transaction,
                                                isLoading,
                                                recentCategories = [],
                                            }) {
    const [type, setType] = useState("uscita")
    const [error, setError] = useState("")
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        category: DEFAULT_CATEGORY,
    })

    const pills = useMemo(() => {
        const uniq = []
        for (const c of recentCategories) {
            if (!c) continue
            if (!uniq.includes(c)) uniq.push(c)
            if (uniq.length >= 4) break
        }
        // fallback se non ci sono recenti
        if (!uniq.length) return ["cibo", "casa", "trasporti", "altro"].slice(0, 4)
        return uniq
    }, [recentCategories])

    useEffect(() => {
        setError("")
        if (transaction) {
            setType(transaction.type)
            setFormData({
                description: transaction.description ?? "",
                amount: transaction.amount ?? "",
                date: (transaction.date ?? new Date().toISOString()).slice(0, 10),
                category: transaction.category ?? DEFAULT_CATEGORY,
            })
        } else {
            setType("uscita")
            setFormData({
                description: "",
                amount: "",
                date: new Date().toISOString().split("T")[0],
                category: DEFAULT_CATEGORY,
            })
        }
    }, [transaction, isOpen])

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
                            onClick={() => setType("uscita")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition ${
                                type === "uscita" ? "bg-white dark:bg-slate-900 text-rose-500" : "text-slate-400"
                            }`}
                        >
                            <Minus size={16} /> Uscita
                        </button>

                        <button
                            type="button"
                            onClick={() => setType("entrata")}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition ${
                                type === "entrata" ? "bg-white dark:bg-slate-900 text-emerald-500" : "text-slate-400"
                            }`}
                        >
                            <Plus size={16} /> Entrata
                        </button>
                    </div>

                    {/* quick category pills */}
                    <div className="flex flex-wrap gap-2">
                        {pills.map((k) => (
                            <button
                                key={k}
                                type="button"
                                onClick={() => setFormData((p) => ({ ...p, category: k }))}
                                className={`px-3 py-1.5 rounded-full text-xs border transition ${
                                    formData.category === k
                                        ? "bg-slate-100 text-slate-900 border-slate-200"
                                        : "bg-slate-900/40 text-slate-200 border-slate-800 hover:bg-slate-900"
                                }`}
                            >
                                {CATEGORIES.find((c) => c.key === k)?.label ?? k}
                            </button>
                        ))}
                    </div>

                    {/* descrizione */}
                    <input
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2"
                        placeholder="Descrizione"
                        value={formData.description}
                        onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                        required
                    />

                    {/* importo */}
                    <input
                        type="number"
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2"
                        placeholder="Importo"
                        value={formData.amount}
                        onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                        required
                    />

                    {/* data */}
                    <input
                        type="date"
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2"
                        value={formData.date}
                        onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                    />

                    {/* categoria select */}
                    <select
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2"
                        value={formData.category}
                        onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                    >
                        {CATEGORIES.map((c) => (
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
