import { useEffect, useMemo, useState } from "react"
import { loadTransactions, saveTransactions } from "@/entities/storage/transactionsStorage"
import { isValidCategory, isCategoryAllowedForType } from "@/entities/categories"

function sortByDateDesc(list) {
    return [...list].sort((a, b) => new Date(b.date) - new Date(a.date))
}

function normalizeTx(t) {
    const type = t?.type === "entrata" || t?.type === "uscita" ? t.type : "uscita"
    const rawAmount = Number(t?.amount)
    const amount = Number.isFinite(rawAmount) ? Math.abs(rawAmount) : 0

    const cat = t?.category
    const category =
        isValidCategory(cat) && isCategoryAllowedForType(cat, type) ? cat : "altro"

    return { ...t, type, amount, category }
}

export default function useTransactions() {
    const [transactions, setTransactions] = useState(() => {
        return sortByDateDesc(loadTransactions().map(normalizeTx))
    })

    useEffect(() => {
        saveTransactions(transactions)
    }, [transactions])

    const add = (data) => {
        const tx = normalizeTx({
            id: crypto.randomUUID(),
            ...data,
            amount: Math.abs(Number(data.amount)),
            createdAt: new Date().toISOString(),
        })

        setTransactions((prev) => sortByDateDesc([tx, ...prev]))
    }

    const update = (updatedTx) => {
        const tx = normalizeTx({
            ...updatedTx,
            amount: Math.abs(Number(updatedTx.amount)),
        })

        setTransactions((prev) =>
            prev.map((t) => (t.id === tx.id ? { ...t, ...tx } : t))
        )
    }

    const remove = (id) => setTransactions((prev) => prev.filter((t) => t.id !== id))
    const restore = (tx) => {
        if (!tx?.id) return
        const normalized = normalizeTx(tx)
        setTransactions((prev) => sortByDateDesc([normalized, ...prev]))
    }

    const reset = () => setTransactions([])

    const totals = useMemo(() => {
        const income = transactions
            .filter((t) => t.type === "entrata")
            .reduce((s, t) => s + (Number(t.amount) || 0), 0)

        const expenses = transactions
            .filter((t) => t.type === "uscita")
            .reduce((s, t) => s + (Number(t.amount) || 0), 0)

        return { income, expenses, balance: income - expenses }
    }, [transactions])

    return { transactions, add, update, remove, restore, reset, totals, isLoading: false }
}
