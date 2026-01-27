import { useEffect, useMemo, useState } from "react"
import useAdsConsent from "@/hooks/useAdsConsent"
import usePremium from "@/hooks/usePremium"
import AdsConsentPrompt from "@/components/ads/AdsConsentPrompt"

/**
 * Gate globale:
 * - Se FREE e adsConsent === "unknown" => blocca l’app finché non sceglie.
 * - Se Premium => nessun gate.
 *
 * FIX: su mobile WebView evita overlay stacking usando una finestra di "soppressione"
 * impostata da PremiumContent quando si toggla Premium DEV.
 */
export default function AdsConsentManager() {
    const { adsConsent, grantConsent, denyConsent } = useAdsConsent()
    const { isPremium } = usePremium()

    const mustChoose = useMemo(() => {
        return !isPremium && adsConsent === "unknown"
    }, [isPremium, adsConsent])

    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (!mustChoose) {
            setVisible(false)
            return
        }

        const now = Date.now()
        const until = Number(window.__haipSuppressAdsGateUntil || 0)

        const delay = until > now ? (until - now) : 0

        const t = setTimeout(() => {
            // ricontrollo (stato potrebbe essere cambiato nel frattempo)
            const stillMustChoose = (!isPremium && adsConsent === "unknown")
            if (stillMustChoose) setVisible(true)
        }, Math.max(0, delay))

        return () => clearTimeout(t)
    }, [mustChoose, isPremium, adsConsent])

    if (!mustChoose) return null

    return (
        <AdsConsentPrompt
            open={visible}
            onAccept={grantConsent}
            onReject={denyConsent}
        />
    )
}
