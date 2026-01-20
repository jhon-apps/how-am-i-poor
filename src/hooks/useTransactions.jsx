import { useCallback, useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "howamipoor:transactions:v1"

function toYmd(dateLike) {
    if (!dateLike) return ""
    return String(dateLike).slice(0, 10)
}

function safeNumber(n) {
    const x = Number(n)
    return Number.isFinite(x) ? x : 0
}

/**
 * Ordine definitivo:
 * 1) date DESC (giorno)
 * 2) createdAt DESC (ultimo inserito sopra nello stesso giorno)
 * 3) id DESC (fallback stabile)
 */
function compareTxDesc(a, b) {
    const da = toYmd(a.date)
    const db = toYmd(b.date)

    if (da < db) return 1
    if (da > db) return -1

    const ca = safeNumber(a.createdAt)
    const cb = safeNumber(b.createdAt)
    if (ca < cb) return 1
    if (ca > cb) return -1

    const ia = String(a.id ?? "")
    const ib = String(b.id ?? "")
    if (ia < ib) return 1
    if (ia > ib) return -1
    return 0
}

function normalizeTx(tx, fallbackCreatedAt) {
    const date = toYmd(tx?.date) || toYmd(new Date().toISOString())
    const type = tx?.type === "entrata" ? "entrata" : "uscita"

    return {
        id: tx?.id,
        type,
        description: String(tx?.description ?? "").trim(),
        amount: safeNumber(tx?.amount),
        category: String(tx?.category ?? "").trim(),
        date,
        createdAt: Number.isFinite(Number(tx?.createdAt)) ? Number(tx.createdAt) : fallbackCreatedAt,
    }
}

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        const parsed = raw ? JSON.parse(raw) : []
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function saveToStorage(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function migrateAndSort(rawList) {
    // Manteniamo l’ordine attuale assegnando createdAt decrescente in base all’indice.
    // Se il tuo array è già date DESC (come da test), questa migrazione preserva la coerenza.
    const base = Date.now()
    const migrated = rawList.map((t, i) => normalizeTx(t, base - i))
    migrated.sort(compareTxDesc)
    return migrated
}

export default function useTransactions() {
    const [transactions, setTransactions] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const raw = loadFromStorage()
        const needsPersist = raw.some((t) => t?.createdAt == null)

        const next = migrateAndSort(raw)

        if (needsPersist) saveToStorage(next)

        setTransactions(next)
        setIsLoading(false)
    }, [])

    const persist = useCallback((nextList) => {
        const sorted = [...nextList].sort(compareTxDesc)
        setTransactions(sorted)
        saveToStorage(sorted)
    }, [])

    const add = useCallback(
        (tx) => {
            const now = Date.now()
            const next = normalizeTx(
                {
                    ...tx,
                    createdAt: now,
                },
                now
            )

            // inseriamo e poi sortiamo per garantire ordine stabile
            persist([next, ...transactions])
        },
        [persist, transactions]
    )

    const update = useCallback(
        (tx) => {
            if (!tx?.id) return
            const existing = transactions.find((t) => t.id === tx.id)
            if (!existing) return

            const updated = normalizeTx(
                {
                    ...existing,
                    ...tx,
                    createdAt: existing.createdAt, // ✅ non cambiare createdAt in update
                },
                existing.createdAt
            )

            const replaced = transactions.map((t) => (t.id === tx.id ? updated : t))
            persist(replaced)
        },
        [persist, transactions]
    )

    const remove = useCallback(
        (id) => {
            if (!id) return
            persist(transactions.filter((t) => t.id !== id))
        },
        [persist, transactions]
    )

    const restore = useCallback(
        (tx) => {
            if (!tx?.id) return
            if (transactions.some((t) => t.id === tx.id)) return

            // restore: se manca createdAt, lo consideriamo "appena ripristinato" => in cima al suo giorno
            const now = Date.now()
            const restored = normalizeTx(
                {
                    ...tx,
                    createdAt: Number.isFinite(Number(tx.createdAt)) ? Number(tx.createdAt) : now,
                },
                now
            )

            persist([restored, ...transactions])
        },
        [persist, transactions]
    )

    const reset = useCallback(() => {
        setTransactions([])
        saveToStorage([])
    }, [])

    const totals = useMemo(() => {
        const income = transactions
            .filter((t) => t.type === "entrata")
            .reduce((s, t) => s + safeNumber(t.amount), 0)

        const expenses = transactions
            .filter((t) => t.type === "uscita")
            .reduce((s, t) => s + safeNumber(t.amount), 0)

        return {
            income,
            expenses,
            balance: income - expenses,
        }
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
