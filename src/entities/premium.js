export function isOlderThanDays(dateISO, days) {
    const d = new Date(dateISO)
    if (Number.isNaN(d.getTime())) return false
    const diffMs = Date.now() - d.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    return diffDays > days
}

export function isLockedTransaction(tx, isPremium) {
    if (isPremium) return false
    return isOlderThanDays(tx?.date, 30)
}
