/**
 * Config globale dell'app (feature flags / capabilities).
 * ⚠️ Non dipende dall'utente.
 * ⚠️ Non rappresenta "premium attivo".
 */
export const APP_CONFIG = {
    // Billing Google Play collegato e funzionante
    BILLING_READY: false,

    // Ads (quando le collegheremo)
    ADS_ENABLED: true,

    // Notifiche (quando le implementiamo)
    NOTIFICATIONS_ENABLED: true,

    // Feature future
    CSV_IMPORT_ENABLED: true,

    // Env helper
    IS_DEV: import.meta.env.DEV,
}
