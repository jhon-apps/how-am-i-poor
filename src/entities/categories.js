// === CATEGORIE ENTRATE ===
export const INCOME_CATEGORIES = [
    { key: "stipendio", label: "Stipendio" },
    { key: "entrate_extra", label: "Entrate extra" },
    { key: "bonus", label: "Bonus" },
    { key: "rimborso", label: "Rimborso" },
    { key: "prestito", label: "Prestito" },
]

// === CATEGORIE USCITE ===
export const EXPENSE_CATEGORIES = [
    { key: "casa", label: "Casa" },
    { key: "cibo", label: "Cibo" },
    { key: "trasporti", label: "Trasporti" },
    { key: "bollette", label: "Bollette" },
    { key: "salute", label: "Salute" },
    { key: "svago", label: "Svago" },
    { key: "shopping", label: "Shopping" },
    { key: "assicurazione", label: "Assicurazione" },
    { key: "prestito", label: "Prestito" },
]

export const FALLBACK_CATEGORY = { key: "altro", label: "Altro" }

export const ALL_CATEGORIES = [
    ...INCOME_CATEGORIES,
    ...EXPENSE_CATEGORIES,
    FALLBACK_CATEGORY,
]

export function getCategoriesByType(type) {
    if (type === "entrata") return [...INCOME_CATEGORIES, FALLBACK_CATEGORY]
    if (type === "uscita") return [...EXPENSE_CATEGORIES, FALLBACK_CATEGORY]
    return [FALLBACK_CATEGORY]
}

export function getDefaultCategoryByType(type) {
    const list = getCategoriesByType(type)
    return list?.[0]?.key ?? FALLBACK_CATEGORY.key
}

export function isValidCategory(key) {
    return ALL_CATEGORIES.some((c) => c.key === key)
}

export function isCategoryAllowedForType(key, type) {
    const allowed = getCategoriesByType(type).map((c) => c.key)
    return allowed.includes(key)
}

export function getCategoryLabel(key) {
    return ALL_CATEGORIES.find((c) => c.key === key)?.label ?? FALLBACK_CATEGORY.label
}
