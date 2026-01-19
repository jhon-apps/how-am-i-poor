export default function AdSlot({
                                   isPremium,
                                   adsConsent = "unknown", // "unknown" | "granted" | "denied"
                                   placement = "banner",
                                   height = 90,
                               }) {
    if (isPremium) return null
    if (adsConsent === "denied") return null

    const card = "bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const sub = "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
    const muted = "text-[rgb(var(--muted-fg))]"

    return (
        <div className={`rounded-3xl border p-4 shadow-sm ${card}`}>
            <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] ${muted}`}>Annuncio</span>
                <span className={`text-[10px] uppercase tracking-wider ${muted}`}>{placement}</span>
            </div>

            <div
                className={`w-full rounded-2xl border flex items-center justify-center ${sub}`}
                style={{ height }}
            >
                <span className={`text-sm ${muted}`}>Ad banner (placeholder)</span>
            </div>

            <p className={`mt-2 text-[11px] ${muted}`}>Rimuovi la pubblicità con Premium.</p>
        </div>
    )
}
