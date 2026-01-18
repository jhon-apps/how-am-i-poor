export default function AdSlot({ isPremium, placement = "banner" }) {
    if (isPremium) return null

    // Placeholder only. When we integrate AdMob, this will become a real banner.
    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-4">
            <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">Annuncio</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{placement}</p>
            </div>

            <div className="mt-3 h-[90px] w-full rounded-2xl border border-slate-800 bg-slate-950/50 flex items-center justify-center">
                <p className="text-sm text-slate-400">Ad banner placeholder (320×90)</p>
            </div>

            <p className="mt-2 text-[11px] text-slate-500">
                La pubblicità verrà rimossa con Premium.
            </p>
        </div>
    )
}
