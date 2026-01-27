import { useEffect, useMemo, useState } from "react"
import AdsConsentPrompt from "@/components/ads/AdsConsentPrompt"

/**
 * AdSlot placeholder:
 * - se Premium → null
 * - se adsConsent === "unset" → mostra prompt SOLO quando l’ad slot entra in view (cioè dovrebbe renderizzare)
 * - se granted/denied → mostra placeholder banner (finché non integriamo SDK)
 *
 * Quando metterai AdMob/UMP:
 * - denied => npa=1
 * - granted => personalized
 * - unset => UMP prompt
 */
export default function AdSlot({
                                   placement = "generic",
                                   isPremium = false,
                                   adsConsent = "unset", // "unset" | "granted" | "denied"
                                   height = "70px",
                               }) {
    const [promptOpen, setPromptOpen] = useState(false)
    const [promptShownOnce, setPromptShownOnce] = useState(false)

    const shouldShowAnything = !isPremium

    // apri il prompt solo alla prima occasione in cui questo slot proverebbe a mostrare ads
    useEffect(() => {
        if (!shouldShowAnything) return
        if (adsConsent !== "unset") return
        if (promptShownOnce) return

        // trigger: appena questo componente monta (cioè slot presente in pagina)
        setPromptOpen(true)
        setPromptShownOnce(true)
    }, [adsConsent, shouldShowAnything, promptShownOnce])

    const label = useMemo(() => {
        if (adsConsent === "granted") return "Pubblicità (personalizzata)"
        if (adsConsent === "denied") return "Pubblicità (non personalizzata)"
        return "Pubblicità"
    }, [adsConsent])

    if (!shouldShowAnything) return null

    // finché unset → NON mostriamo ads (per evitare ads senza scelta)
    if (adsConsent === "unset") {
        return (
            <>
                <div
                    className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] flex items-center justify-center"
                    style={{ height }}
                >
                    <p className="text-xs text-[rgb(var(--muted-fg))]">
                        Pubblicità: scelta richiesta
                    </p>
                </div>

                <AdsConsentPrompt
                    open={promptOpen}
                    onClose={() => setPromptOpen(false)}
                    onAccept={() => {
                        // il vero state lo gestisce useAdsConsent: qui usiamo evento globale storage
                        localStorage.setItem("how-am-i-poor:adsConsent", "granted")
                        window.dispatchEvent(new Event("storage"))
                        setPromptOpen(false)
                    }}
                    onReject={() => {
                        localStorage.setItem("how-am-i-poor:adsConsent", "denied")
                        window.dispatchEvent(new Event("storage"))
                        setPromptOpen(false)
                    }}
                />
            </>
        )
    }

    // placeholder finché non c’è SDK
    return (
        <div
            className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] flex items-center justify-center"
            style={{ height }}
            aria-label={`ad-slot-${placement}`}
            title={placement}
        >
            <div className="text-center">
                <p className="text-xs font-extrabold tracking-tight">{label}</p>
                <p className="mt-1 text-[11px] text-[rgb(var(--muted-fg))]">placement: {placement}</p>
            </div>
        </div>
    )
}
