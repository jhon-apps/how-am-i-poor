/**
 * Config globale dell'app (feature flags / capabilities).
 * ⚠️ Non dipende dall'utente.
 * ⚠️ Non rappresenta "premium attivo".
 */
export const APP_CONFIG = {
    BILLING_READY: false,
    ADS_ENABLED: true,
    NOTIFICATIONS_ENABLED: true,

    IS_DEV: import.meta.env.DEV,

    DEV_TOOLS_ENABLED: import.meta.env.VITE_DEVTOOLS === "true" || import.meta.env.DEV,
}



