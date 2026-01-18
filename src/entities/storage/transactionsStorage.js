const KEY = "howamipoor:transactions:v1";

export function loadTransactions() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return [];
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

export function saveTransactions(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
}
