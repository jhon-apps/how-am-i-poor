import { useCallback, useEffect, useMemo, useState } from "react"

const KEY = "howamipoor:transactions:v1"

function safeParse(raw, fallback) {
    try {
        const v = JSON.parse(raw)
        return v ?? fallback
    } catch {
        return fallback
    }
}

function normalizeTx(tx) {
    const id = String(tx?.id || "")
    const type = tx?.type === "entrata" ? "entrata" : "uscita"
    const amount = Number(tx?.amount) || 0
    const date = String(tx?.date || "").slice(0, 10) || new Date().toISOString().slice(0, 10)
    const category = String(tx?.category || "altro")
    const description = String(tx?.description || "")
    const createdAt = Number(tx?.createdAt || 0) || Date.now()

    return { id, type, amount, date, category, description, createdAt }
}

function sortTx(a, b) {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1
    return a.id < b.id ? 1 : -1
}

function readAll() {
    const raw = localStorage.getItem(KEY)
    const arr = safeParse(raw || "[]", [])
    if (!Array.isArray(arr)) return []
    return arr.map(normalizeTx).sort(sortTx)
}

function writeAll(list) {
    localStorage.setItem(KEY, JSON.stringify(list))
    window.dispatchEvent(new Event("haip:transactions:changed"))
}

export default function useTransactions() {
    const [transactions, setTransactions] = useState(() => readAll())
    const [isLoading, setIsLoading] = useState(false)

    // sync same-tab + cross-tab
    useEffect(() => {
        const refresh = () => setTransactions(readAll())

        const onStorage = (e) => {
            if (e.key === KEY) refresh()
        }
        const onLocal = () => refresh()

        window.addEventListener("storage", onStorage)
        window.addEventListener("haip:transactions:changed", onLocal)
        return () => {
            window.removeEventListener("storage", onStorage)
            window.removeEventListener("haip:transactions:changed", onLocal)
        }
    }, [])

    const persist = useCallback((next) => {
        const sorted = [...next].map(normalizeTx).sort(sortTx)
        setTransactions(sorted)
        writeAll(sorted)
    }, [])

    const add = useCallback(
        (tx) => {
            const n = normalizeTx(tx)
            if (!n.id) {
                // fallback id robusto
                n.id = `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
            }
            persist([n, ...transactions])
        },
        [persist, transactions]
    )

    const update = useCallback(
        (tx) => {
            const n = normalizeTx(tx)
            if (!n.id) return
            const next = transactions.map((t) => (t.id === n.id ? { ...t, ...n } : t))
            persist(next)
        },
        [persist, transactions]
    )

    const remove = useCallback(
        (id) => {
            const sid = String(id || "")
            if (!sid) return
            const next = transactions.filter((t) => t.id !== sid)
            persist(next)
        },
        [persist, transactions]
    )

    // restore = rimette il record (per undo)
    const restore = useCallback(
        (tx) => {
            const n = normalizeTx(tx)
            if (!n.id) return
            // evita duplicati
            const next = transactions.filter((t) => t.id !== n.id)
            persist([n, ...next])
        },
        [persist, transactions]
    )

    const reset = useCallback(() => {
        persist([])
    }, [persist])

    const totals = useMemo(() => {
        let income = 0
        let expenses = 0
        for (const t of transactions) {
            const a = Number(t.amount) || 0
            if (t.type === "entrata") income += a
            else expenses += a
        }
        return { income, expenses, balance: income - expenses }
    }, [transactions])

    return {
        transactions,
        isLoading,
        add,
        update,
        remove,
        restore,
        reset,
        totals,
    }
}
