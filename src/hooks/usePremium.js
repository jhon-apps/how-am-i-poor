import { useCallback, useEffect, useMemo, useState } from "react"
import { APP_CONFIG } from "@/config/config"

export const PREMIUM_KEY = "howamipoor:premium:v1"
const PREMIUM_EVENT = "haip:premium:changed"

// source è la verità: none/dev/billing
const DEFAULT_STATE = { source: "none", updatedAt: 0 }

function normalizeSource(x) {
    return x === "dev" || x === "billing" || x === "none" ? x : "none"
}

function readState() {
    try {
        const raw = localStorage.getItem(PREMIUM_KEY)
        if (!raw) return DEFAULT_STATE

        const p = JSON.parse(raw)

        // compat: vecchio formato {active:boolean}
        if (typeof p?.active === "boolean") {
            const source = p.active ? normalizeSource(p.source || "dev") : "none"
            return { source, updatedAt: Number(p.updatedAt || 0) }
        }

        return {
            source: normalizeSource(p?.source),
            updatedAt: Number(p?.updatedAt || 0),
        }
    } catch {
        return DEFAULT_STATE
    }
}

function writeState(source) {
    localStorage.setItem(
        PREMIUM_KEY,
        JSON.stringify({
            source: normalizeSource(source),
            updatedAt: Date.now(),
        })
    )
}

function broadcastPremiumChange() {
    // ✅ same-tab sync (storage non scatta nello stesso tab)
    try {
        window.dispatchEvent(new Event(PREMIUM_EVENT))
    } catch {
        // ignore
    }
}

export default function usePremium() {
    const [state, setState] = useState(() => readState())

    const refresh = useCallback(() => {
        setState(readState())
    }, [])

    useEffect(() => {
        // ✅ cross-tab sync
        const onStorage = (e) => {
            if (e.key === PREMIUM_KEY) refresh()
        }

        // ✅ same-tab sync
        const onPremiumChanged = () => refresh()

        window.addEventListener("storage", onStorage)
        window.addEventListener(PREMIUM_EVENT, onPremiumChanged)

        return () => {
            window.removeEventListener("storage", onStorage)
            window.removeEventListener(PREMIUM_EVENT, onPremiumChanged)
        }
    }, [refresh])

    const billingReady = APP_CONFIG.BILLING_READY
    const canSimulate = APP_CONFIG.DEV_TOOLS_ENABLED

    const source = state.source
    const isPremium = source !== "none"

    /**
     * Richiesta premium (finché non c'è billing vero):
     * - DEV: attiva "dev"
     * - PROD: richiede billing
     */
    const requestPremium = useCallback(() => {
        if (canSimulate) {
            writeState("dev")
            broadcastPremiumChange()
            refresh()
            return { ok: true, mode: "dev_simulation" }
        }
        return { ok: false, mode: "billing_required" }
    }, [canSimulate, refresh])

    /**
     * Da chiamare SOLO quando Google Play Billing conferma acquisto/restore.
     */
    const grantPremiumFromBilling = useCallback(() => {
        if (!billingReady) return { ok: false, mode: "billing_not_ready" }
        writeState("billing")
        broadcastPremiumChange()
        refresh()
        return { ok: true, mode: "billing" }
    }, [billingReady, refresh])

    const disablePremium = useCallback(() => {
        writeState("none")
        broadcastPremiumChange()
        refresh()
    }, [refresh])

    const meta = useMemo(
        () => ({
            source,
            updatedAt: state.updatedAt,
            billingReady,
            canSimulate,
        }),
        [source, state.updatedAt, billingReady, canSimulate]
    )

    return {
        isPremium,
        meta, // {source, updatedAt, billingReady, canSimulate}
        requestPremium,
        grantPremiumFromBilling,
        disablePremium,
    }
}
