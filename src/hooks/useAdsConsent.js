import { useEffect, useState } from "react"

const KEY = "how-am-i-poor:adsConsent"

function normalize(v) {
    // compat: vecchi valori
    if (v === "unset") return "unknown"
    if (v === "granted" || v === "denied" || v === "unknown") return v
    return "unknown"
}

export default function useAdsConsent() {
    const [adsConsent, setAdsConsent] = useState(() => {
        const v = localStorage.getItem(KEY)
        return normalize(v)
    })

    useEffect(() => {
        localStorage.setItem(KEY, normalize(adsConsent))
    }, [adsConsent])

    const grantConsent = () => setAdsConsent("granted")
    const denyConsent = () => setAdsConsent("denied")

    return { adsConsent: normalize(adsConsent), setAdsConsent, grantConsent, denyConsent }
}
