export default function AdSlot({
                                   isPremium,
                                   adsConsent = "unknown", // "unknown" | "granted" | "denied"
                                   placement = "banner",
                                   height = 90,
                               }) {
    if (isPremium) return null
    if (adsConsent === "denied") return null

    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-400">Annuncio</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
          {placement}
        </span>
            </div>

            <div
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 flex items-center justify-center"
                style={{ height }}
            >
                <span className="text-sm text-slate-400">Ad banner (placeholder)</span>
            </div>

            <p className="mt-2 text-[11px] text-slate-500">
                Rimuovi la pubblicità con Premium.
            </p>
        </div>
    )
}
