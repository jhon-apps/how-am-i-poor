import { useEffect } from "react"
import { onAppBecameActive } from "@/services/notifications"

export default function useAppLifecycle() {
    useEffect(() => {
        let remove = null
        let cancelled = false

        ;(async () => {
            try {
                const { Capacitor } = await import("@capacitor/core")
                if (!Capacitor.isNativePlatform()) return

                const { App } = await import("@capacitor/app")

                await onAppBecameActive()

                const handler = App.addListener("appStateChange", async (state) => {
                    if (cancelled) return
                    if (state.isActive) {
                        await onAppBecameActive()
                    }
                })

                remove = handler
            } catch {
            }
        })()

        return () => {
            cancelled = true
            try {
                remove?.remove?.()
            } catch {
            }
        }
    }, [])
}
