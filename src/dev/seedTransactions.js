function toYmd(d) {
    return d.toISOString().slice(0, 10)
}

export function seedTransactions(n = 1200, key = "howamipoor:transactions:v1") {
    const categoriesExpense = ["cibo", "trasporti", "casa", "svago", "salute", "bollette", "altro"]
    const categoriesIncome = ["stipendio", "bonus", "entrate_extra", "altro"]
    const descExpense = ["Benzina", "Spesa", "Ristorante", "Bollette", "Farmacia", "Netflix", "Treno", "Palestra"]
    const descIncome = ["Stipendio", "Bonus", "Rimborso", "Vendita", "Entrata extra"]

    const rand = (min, max) => Math.random() * (max - min) + min
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

    const makeId =
        () =>
            globalThis.crypto?.randomUUID?.() ??
            `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`

    const now = Date.now()

    const dateDaysAgo = (daysAgo) => {
        const d = new Date(now)
        d.setDate(d.getDate() - daysAgo)
        return toYmd(d)
    }

    const rows = Array.from({ length: n }, (_, i) => {
        const isIncome = Math.random() < 0.18
        const type = isIncome ? "entrata" : "uscita"
        const category = isIncome ? pick(categoriesIncome) : pick(categoriesExpense)
        const description = (isIncome ? pick(descIncome) : pick(descExpense)) + ` #${i + 1}`
        const amount = isIncome ? Math.round(rand(200, 2500) * 100) / 100 : Math.round(rand(2, 160) * 100) / 100

        const bucket = Math.random()
        const daysAgo = bucket < 0.35 ? Math.floor(rand(0, 30)) : Math.floor(rand(31, 180))

        const date = dateDaysAgo(daysAgo)

        return {
            id: makeId(),
            type,
            category,
            description,
            amount,
            date,
            createdAt: now - i,
        }
    })

    rows.sort((a, b) => {
        const da = String(a.date)
        const db = String(b.date)
        if (da < db) return 1
        if (da > db) return -1
        return (b.createdAt || 0) - (a.createdAt || 0)
    })

    localStorage.setItem(key, JSON.stringify(rows))
    return rows.length
}
