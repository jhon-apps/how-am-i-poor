/**
 * Config globale dell'app (feature flags / capabilities).
 * ⚠️ Non dipende dall'utente.
 * ⚠️ Non rappresenta "premium attivo".
 */
export const APP_CONFIG = {
    BILLING_READY: false,

    ADS_ENABLED: false,

    NOTIFICATIONS_ENABLED: true,

    // Env helper
    IS_DEV: import.meta.env.DEV,

    DEV_TOOLS_ENABLED: import.meta.env.DEV,
}
