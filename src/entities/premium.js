// Premium flag (per ora base = false).
// Quando farai il premium vero, qui agganci purchase / entitlement.
export const IS_PREMIUM = false

export function isOlderThanDays(dateISO, days) {
    const d = new Date(dateISO)
    if (Number.isNaN(d.getTime())) return false
    const diffMs = Date.now() - d.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    return diffDays > days
}

export function isLockedTransaction(tx, isPremium = IS_PREMIUM) {
    if (isPremium) return false
    return isOlderThanDays(tx?.date, 30)
}
