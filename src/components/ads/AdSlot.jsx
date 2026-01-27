import { useMemo } from "react"
import useAdsConsent from "@/hooks/useAdsConsent"

// Se vuoi un accesso rapido al prompt (non bloccante):
const ADS_CONSENT_OPEN_EVENT = "haip:ads:openConsentPrompt"

export default function AdSlot({
                                   placement = "generic",
                                   isPremium = false,
                                   height = "70px",
                               }) {
    const { adsConsent } = useAdsConsent()

    if (isPremium) return null

    // ✅ unknown = denied per serving (ads comunque presenti, non personalizzate)
    const effectiveConsent = adsConsent === "unknown" ? "denied" : adsConsent

    const label = useMemo(() => {
        if (effectiveConsent === "granted") return "Pubblicità (personalizzata)"
        return "Pubblicità (non personalizzata)"
    }, [effectiveConsent])

    // Placeholder finché non integri SDK (qui in futuro metti AdMob con npa=1 quando denied/unknown)
    return (
        <div
            className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] flex items-center justify-center"
            style={{ height }}
            aria-label={`ad-slot-${placement}`}
            title={placement}
        >
            <div className="text-center">
                <p className="text-xs font-extrabold">{label}</p>
                <p className="mt-1 text-[11px] text-[rgb(var(--muted-fg))]">placement: {placement}</p>

                {/* CTA non bloccante (facoltativa): */}
                {adsConsent === "unknown" ? (
                    <button
                        type="button"
                        className="mt-2 text-[11px] underline text-[rgb(var(--muted-fg))] hover:opacity-80"
                        onClick={() => window.dispatchEvent(new Event(ADS_CONSENT_OPEN_EVENT))}
                        title="Scegli consenso pubblicità"
                    >
                        Personalizza scelta
                    </button>
                ) : null}
            </div>
        </div>
    )
}
