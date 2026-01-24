import { useEffect, useState } from "react"

const KEY = "how-am-i-poor:adsConsent"

export default function useAdsConsent() {
    const [adsConsent, setAdsConsent] = useState(() => {
        const v = localStorage.getItem(KEY)
        return v || "unknown"
    })

    useEffect(() => {
        localStorage.setItem(KEY, adsConsent)
    }, [adsConsent])

    const grantConsent = () => setAdsConsent("granted")
    const denyConsent = () => setAdsConsent("denied")
    const resetConsent = () => setAdsConsent("unknown")

    return { adsConsent, setAdsConsent, grantConsent, denyConsent, resetConsent }
}
