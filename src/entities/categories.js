export const CATEGORIES = [
    { key: "casa", label: "Casa" },
    { key: "cibo", label: "Cibo" },
    { key: "trasporti", label: "Trasporti" },
    { key: "bollette", label: "Bollette" },
    { key: "salute", label: "Salute" },
    { key: "svago", label: "Svago" },
    { key: "shopping", label: "Shopping" },
    { key: "risparmi", label: "Risparmi" },
    { key: "altro", label: "Altro" },
]

export const DEFAULT_CATEGORY = "altro"

export function isValidCategory(key) {
    return CATEGORIES.some((c) => c.key === key)
}

export function getCategoryLabel(key) {
    return CATEGORIES.find((c) => c.key === key)?.label ?? "Altro"
}
