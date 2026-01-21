import { useCallback, useEffect, useMemo, useState } from "react"

const KEY = "howamipoor:recurring:v1"
const EVENT = "haip:recurring:changed"

function safeParse(raw, fallback) {
    try {
        const v = JSON.parse(raw)
        return v ?? fallback
    } catch {
        return fallback
    }
}

function makeId() {
    return (globalThis.crypto?.randomUUID?.() ??
        `rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`)
}

function clampInt(n, min, max, fallback) {
    const x = Number(n)
    if (!Number.isFinite(x)) return fallback
    return Math.min(max, Math.max(min, Math.trunc(x)))
}

function normalizeRecurring(r) {
    const id = String(r?.id || "") || makeId()
    const type = r?.type === "entrata" ? "entrata" : "uscita"
    const description = String(r?.description || "").trim()
    const amount = Math.max(0, Number(r?.amount) || 0)
    const category = String(r?.category || "altro")

    // v1: only monthly by day-of-month
    const day = clampInt(r?.schedule?.day ?? r?.day, 1, 31, 1)
    const schedule = { freq: "monthly", day }

    // notification prefs (saved, not executed yet)
    const notifyEnabled = !!(r?.notify?.enabled ?? r?.notifyEnabled ?? true)
    const daysBefore = clampInt(r?.notify?.daysBefore ?? r?.daysBefore, 0, 7, 0)
    const time = String(r?.notify?.time ?? r?.time ?? "09:00").slice(0, 5) || "09:00"
    const notify = { enabled: notifyEnabled, daysBefore, time }

    const active = r?.active !== false
    const createdAt = Number(r?.createdAt || 0) || Date.now()
    const updatedAt = Number(r?.updatedAt || 0) || Date.now()

    return { id, type, description, amount, category, schedule, notify, active, createdAt, updatedAt }
}

function readAll() {
    const raw = localStorage.getItem(KEY)
    const arr = safeParse(raw || "[]", [])
    if (!Array.isArray(arr)) return []
    return arr.map(normalizeRecurring).sort((a, b) => b.updatedAt - a.updatedAt)
}

function writeAll(list) {
    localStorage.setItem(KEY, JSON.stringify(list))
    window.dispatchEvent(new Event(EVENT))
}

export default function useRecurring() {
    const [items, setItems] = useState(() => readAll())

    useEffect(() => {
        const refresh = () => setItems(readAll())

        const onStorage = (e) => {
            if (e.key === KEY) refresh()
        }
        const onLocal = () => refresh()

        window.addEventListener("storage", onStorage)
        window.addEventListener(EVENT, onLocal)
        return () => {
            window.removeEventListener("storage", onStorage)
            window.removeEventListener(EVENT, onLocal)
        }
    }, [])

    const persist = useCallback((next) => {
        const normalized = next.map(normalizeRecurring).sort((a, b) => b.updatedAt - a.updatedAt)
        setItems(normalized)
        writeAll(normalized)
    }, [])

    const add = useCallback(
        (rec) => {
            const n = normalizeRecurring({ ...rec, id: makeId(), createdAt: Date.now(), updatedAt: Date.now() })
            persist([n, ...items])
            return n
        },
        [items, persist]
    )

    const update = useCallback(
        (rec) => {
            const incoming = normalizeRecurring({ ...rec, updatedAt: Date.now() })
            const next = items.map((x) => (x.id === incoming.id ? { ...x, ...incoming } : x))
            persist(next)
            return incoming
        },
        [items, persist]
    )

    const remove = useCallback(
        (id) => {
            const sid = String(id || "")
            if (!sid) return
            persist(items.filter((x) => x.id !== sid))
        },
        [items, persist]
    )

    const toggleActive = useCallback(
        (id) => {
            const sid = String(id || "")
            if (!sid) return
            const next = items.map((x) =>
                x.id === sid ? { ...x, active: !x.active, updatedAt: Date.now() } : x
            )
            persist(next)
        },
        [items, persist]
    )

    const stats = useMemo(() => {
        const active = items.filter((x) => x.active).length
        return { count: items.length, active }
    }, [items])

    return { items, add, update, remove, toggleActive, stats }
}
