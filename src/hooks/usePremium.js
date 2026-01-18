import { useEffect, useState } from "react"

const KEY = "how-am-i-poor:isPremium"

export default function usePremium() {
    const [isPremium, setIsPremium] = useState(() => {
        const v = localStorage.getItem(KEY)
        return v === "true"
    })

    useEffect(() => {
        localStorage.setItem(KEY, String(isPremium))
    }, [isPremium])

    // DEBUG ONLY (rimuoveremo più avanti)
    const enablePremium = () => setIsPremium(true)
    const disablePremium = () => setIsPremium(false)

    return { isPremium, enablePremium, disablePremium }
}
