import { useEffect, useState } from "react"

const KEY = "how-am-i-poor:adsConsent" // "unknown" | "granted" | "denied"

export default function useAdsConsent() {
    const [adsConsent, setAdsConsent] = useState(() => {
        const v = localStorage.getItem(KEY)
        return v || "unknown"
    })

    useEffect(() => {
        localStorage.setItem(KEY, adsConsent)
    }, [adsConsent])

    // stub helpers (in futuro li collegheremo a UMP)
    const grantConsent = () => setAdsConsent("granted")
    const denyConsent = () => setAdsConsent("denied")
    const resetConsent = () => setAdsConsent("unknown")

    return { adsConsent, setAdsConsent, grantConsent, denyConsent, resetConsent }
}
