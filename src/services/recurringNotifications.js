import { APP_CONFIG } from "@/config/config"

const RECURRING_KEY = "howamipoor:recurring:v1"
const SETTINGS_KEY = "howamipoor:settings:v1"
const USER_KEY = "howamipoor:user:v1"
const PREMIUM_KEY = "howamipoor:premium:v1"

const CHANNEL_ID = "haip_reminders"

// range IDs per evitare collisioni con altre notifiche
const REC_BASE = 200000
const REC_MAX = 299999

function safeParse(raw, fallback) {
    try {
        const v = JSON.parse(raw)
        return v ?? fallback
    } catch {
        return fallback
    }
}

function readSettings() {
    const raw = localStorage.getItem(SETTINGS_KEY)
    const p = safeParse(raw || "{}", {})
    return {
        notificationsEnabled: p?.notificationsEnabled ?? true,
    }
}

function readUserName() {
    const raw = localStorage.getItem(USER_KEY)
    const p = safeParse(raw || "{}", {})
    return String(p?.name || "").trim()
}

function isPremiumActive() {
    // source truth: premium key contiene {source:"none"|"dev"|"billing"}
    const raw = localStorage.getItem(PREMIUM_KEY)
    const p = safeParse(raw || "{}", {})
    const source = p?.source || "none"
    return source !== "none"
}

function formatName(name) {
    return name ? `${name}, ` : ""
}

function hashToInt(str) {
    let h = 2166136261
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    return Math.abs(h >>> 0)
}

function recurringNotifId(recId) {
    const n = hashToInt(String(recId || ""))
    const id = REC_BASE + (n % (REC_MAX - REC_BASE))
    return id
}

function readRecurring() {
    const raw = localStorage.getItem(RECURRING_KEY)
    const arr = safeParse(raw || "[]", [])
    if (!Array.isArray(arr)) return []
    return arr
}

function clampDay(d) {
    const n = Number(d)
    if (!Number.isFinite(n)) return 1
    return Math.min(31, Math.max(1, Math.trunc(n)))
}

function parseHHMM(timeStr, fallback = "09:00") {
    const t = String(timeStr || fallback).slice(0, 5)
    const [hh, mm] = t.split(":").map((x) => Number(x))
    return {
        hh: Number.isFinite(hh) ? hh : 9,
        mm: Number.isFinite(mm) ? mm : 0,
        norm: `${String(Number.isFinite(hh) ? hh : 9).padStart(2, "0")}:${String(Number.isFinite(mm) ? mm : 0).padStart(2, "0")}`,
    }
}

/**
 * Calcola la prossima occorrenza mensile (day-of-month).
 * Gestione fine mese: se day=31 e il mese non ha 31, usa l’ultimo giorno del mese.
 */
function nextMonthlyOccurrence(dayOfMonth) {
    const now = new Date()
    const targetDay = clampDay(dayOfMonth)

    const makeDate = (year, monthIndex) => {
        const lastDay = new Date(year, monthIndex + 1, 0).getDate()
        const d = Math.min(targetDay, lastDay)
        return new Date(year, monthIndex, d, 0, 0, 0, 0)
    }

    const thisMonth = makeDate(now.getFullYear(), now.getMonth())
    if (thisMonth.getTime() >= new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime()) {
        return thisMonth
    }

    const nextMonthIndex = now.getMonth() + 1
    const nextYear = now.getFullYear() + (nextMonthIndex > 11 ? 1 : 0)
    const nextMonth = nextMonthIndex % 12
    return makeDate(nextYear, nextMonth)
}

/**
 * Calcola il prossimo "momento notifica" per una ricorrenza:
 * - occorrenza mensile (giorno del mese)
 * - daysBefore (0..7)
 * - time (HH:MM)
 *
 * Se la data risultante è nel passato, sposta alla prossima occorrenza (mese successivo).
 */
function nextNotificationAt(rec) {
    const occ = nextMonthlyOccurrence(rec?.schedule?.day ?? 1)
    const daysBefore = Math.min(7, Math.max(0, Number(rec?.notify?.daysBefore ?? 0) || 0))
    const { hh, mm, norm } = parseHHMM(rec?.notify?.time, "09:00")

    const at = new Date(occ)
    at.setDate(at.getDate() - daysBefore)
    at.setHours(hh, mm, 0, 0)

    // Se è già passato, programma per il mese successivo
    const now = new Date()
    if (at.getTime() <= now.getTime() + 15000) {
        // prossima occorrenza mese successivo
        const nextOcc = new Date(occ)
        nextOcc.setMonth(nextOcc.getMonth() + 1)

        // ricalcolo fine mese
        const lastDay = new Date(nextOcc.getFullYear(), nextOcc.getMonth() + 1, 0).getDate()
        const d = Math.min(clampDay(rec?.schedule?.day ?? 1), lastDay)
        nextOcc.setDate(d)
        nextOcc.setHours(0, 0, 0, 0)

        const at2 = new Date(nextOcc)
        at2.setDate(at2.getDate() - daysBefore)
        at2.setHours(hh, mm, 0, 0)
        return { at: at2, time: norm }
    }

    return { at, time: norm }
}

async function isNative() {
    try {
        const { Capacitor } = await import("@capacitor/core")
        return Capacitor.isNativePlatform()
    } catch {
        return false
    }
}

async function ensurePermission() {
    try {
        const { LocalNotifications } = await import("@capacitor/local-notifications")
        const perm = await LocalNotifications.checkPermissions()
        if (perm.display === "granted") return true
        const req = await LocalNotifications.requestPermissions()
        return req.display === "granted"
    } catch {
        return false
    }
}

async function cancelIds(ids) {
    try {
        const { LocalNotifications } = await import("@capacitor/local-notifications")
        await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) })
    } catch {
        // ignore
    }
}

/**
 * Schedula SOLO la prossima notifica per ogni ricorrente attiva con notify.enabled=true.
 * Reschedule avviene ad ogni apertura/resume (come per le tue altre).
 */
export async function scheduleRecurringNotifications() {
    if (!APP_CONFIG.NOTIFICATIONS_ENABLED) return { ok: false, reason: "disabled_by_config" }

    const native = await isNative()
    if (!native) return { ok: false, reason: "not_native" }

    const s = readSettings()
    if (!s.notificationsEnabled) {
        // master off: cancella tutto range ricorrenti (conoscendo solo gli attuali)
        const current = readRecurring()
        const ids = current.map((r) => recurringNotifId(r.id))
        await cancelIds(ids)
        return { ok: true, mode: "disabled" }
    }

    if (!isPremiumActive()) return { ok: true, mode: "not_premium" }

    const granted = await ensurePermission()
    if (!granted) return { ok: false, reason: "permission_denied" }

    const name = readUserName()
    const all = readRecurring()
    const active = all.filter((r) => r?.active !== false && r?.notify?.enabled !== false)

    const { LocalNotifications } = await import("@capacitor/local-notifications")

    const ids = active.map((r) => recurringNotifId(r.id))
    await cancelIds(ids)

    const notifications = active.map((r) => {
        const { at, time } = nextNotificationAt(r)
        const id = recurringNotifId(r.id)

        const title = "HAIP"
        const body =
            r.type === "entrata"
                ? `${formatName(name)}oggi è previsto: ${r.description || "Entrata"} (+${Number(r.amount || 0).toFixed(2)}€)`
                : `${formatName(name)}oggi scatta: ${r.description || "Uscita"} (-${Number(r.amount || 0).toFixed(2)}€)`

        const largeBody =
            `Ricorrente: ${r.description || "—"}\n` +
            `Importo: ${Number(r.amount || 0).toFixed(2)}€ • Categoria: ${r.category || "altro"}\n` +
            `Tocca per aggiungere il movimento precompilato.`

        return {
            id,
            title,
            body,
            largeBody,
            schedule: { at },
            channelId: CHANNEL_ID,
            smallIcon: "ic_notification",
            iconColor: "#0EA5E9",
            extra: {
                kind: "recurring",
                recurringId: r.id,
                when: at.toISOString(),
                time,
            },
        }
    })

    if (!notifications.length) return { ok: true, mode: "nothing_to_schedule" }

    await LocalNotifications.schedule({ notifications })
    return { ok: true, mode: "scheduled", count: notifications.length }
}
