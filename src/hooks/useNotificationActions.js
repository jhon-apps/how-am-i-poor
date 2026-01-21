import { useEffect } from "react"

const PENDING_KEY = "howamipoor:pendingAction:v1"
const EVENT = "haip:pendingAction"

export default function useNotificationActions() {
    useEffect(() => {
        let remove = null
        let cancelled = false

        ;(async () => {
            try {
                const { Capacitor } = await import("@capacitor/core")
                if (!Capacitor.isNativePlatform()) return

                const { LocalNotifications } = await import("@capacitor/local-notifications")

                const handler = LocalNotifications.addListener("localNotificationActionPerformed", (ev) => {
                    if (cancelled) return

                    const extra = ev?.notification?.extra || {}
                    if (extra.kind !== "recurring") return

                    localStorage.setItem(
                        PENDING_KEY,
                        JSON.stringify({
                            kind: "recurring",
                            recurringId: extra.recurringId,
                            ts: Date.now(),
                        })
                    )
                    window.dispatchEvent(new Event(EVENT))

                    // porta alla home (dove apriremo la modale)
                    window.location.hash = "#/"
                })

                remove = handler
            } catch {
                // ignore
            }
        })()

        return () => {
            cancelled = true
            try {
                remove?.remove?.()
            } catch {
                // ignore
            }
        }
    }, [])
}
