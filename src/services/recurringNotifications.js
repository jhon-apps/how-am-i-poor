import { APP_CONFIG } from "@/config/config"

const RECURRING_KEY = "howamipoor:recurring:v1"
const SETTINGS_KEY = "howamipoor:settings:v1"
const USER_KEY = "howamipoor:user:v1"
const PREMIUM_KEY = "howamipoor:premium:v1"

const CHANNEL_ID = "haip_reminders"
const CHANNEL_NAME = "Promemoria HAIP"

const REC_BASE = 200000
const REC_MAX = 299999

function safeParse(raw, fallback) {
    try {
        return JSON.parse(raw) ?? fallback
    } catch {
        return fallback
    }
}

function readSettings() {
    const raw = localStorage.getItem(SETTINGS_KEY)
    const p = safeParse(raw || "{}", {})
    return { notificationsEnabled: p?.notificationsEnabled ?? true }
}

function readUserName() {
    const raw = localStorage.getItem(USER_KEY)
    const p = safeParse(raw || "{}", {})
    return String(p?.name || "").trim()
}

function isPremiumActive() {
    const raw = localStorage.getItem(PREMIUM_KEY)
    const p = safeParse(raw || "{}", {})
    if (typeof p?.active === "boolean") return p.active === true
    return (p?.source || "none") !== "none"
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
    return REC_BASE + (n % (REC_MAX - REC_BASE))
}

function readRecurring() {
    const raw = localStorage.getItem(RECURRING_KEY)
    const arr = safeParse(raw || "[]", [])
    return Array.isArray(arr) ? arr : []
}

function clampDay(d) {
    const n = Number(d)
    if (!Number.isFinite(n)) return 1
    return Math.min(31, Math.max(1, Math.trunc(n)))
}

function parseHHMM(timeStr, fallback = "09:00") {
    const t = String(timeStr || fallback).slice(0, 5)
    const [hh, mm] = t.split(":").map((x) => Number(x))
    const H = Number.isFinite(hh) ? hh : 9
    const M = Number.isFinite(mm) ? mm : 0
    return { hh: H, mm: M, norm: `${String(H).padStart(2, "0")}:${String(M).padStart(2, "0")}` }
}

function monthlyOccurrenceForMonth(year, monthIndex, dayOfMonth) {
    const targetDay = clampDay(dayOfMonth)
    const lastDay = new Date(year, monthIndex + 1, 0).getDate()
    const d = Math.min(targetDay, lastDay)
    return new Date(year, monthIndex, d, 0, 0, 0, 0)
}

function nextMonthlyOccurrence(dayOfMonth) {
    const now = new Date()
    const thisOcc = monthlyOccurrenceForMonth(now.getFullYear(), now.getMonth(), dayOfMonth)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)

    if (thisOcc.getTime() >= todayStart.getTime()) return thisOcc

    const nextMonthIndex = now.getMonth() + 1
    const nextYear = now.getFullYear() + (nextMonthIndex > 11 ? 1 : 0)
    const nextMonth = nextMonthIndex % 12
    return monthlyOccurrenceForMonth(nextYear, nextMonth, dayOfMonth)
}

export function computeNextRecurringAt(rec) {
    const occ = nextMonthlyOccurrence(rec?.schedule?.day ?? 1)
    const daysBefore = Math.min(7, Math.max(0, Number(rec?.notify?.daysBefore ?? 0) || 0))
    const { hh, mm, norm } = parseHHMM(rec?.notify?.time, "09:00")

    const at = new Date(occ)
    at.setDate(at.getDate() - daysBefore)
    at.setHours(hh, mm, 0, 0)

    // se nel passato, mese successivo
    const now = new Date()
    if (at.getTime() <= now.getTime()) {
        const nextOcc = new Date(occ)
        nextOcc.setMonth(nextOcc.getMonth() + 1)
        const fixed = monthlyOccurrenceForMonth(nextOcc.getFullYear(), nextOcc.getMonth(), rec?.schedule?.day ?? 1)

        const at2 = new Date(fixed)
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

async function ensureChannel() {
    try {
        const { LocalNotifications } = await import("@capacitor/local-notifications")
        await LocalNotifications.createChannel({
            id: CHANNEL_ID,
            name: CHANNEL_NAME,
            description: "Promemoria giornaliero, inattività e ricorrenti",
            importance: 5,
            visibility: 1,
            vibration: true,
            lights: true,
        })
    } catch {
        // ignore
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

export async function scheduleRecurringNotifications() {
    if (!APP_CONFIG.NOTIFICATIONS_ENABLED) return { ok: false, reason: "disabled_by_config" }
    const native = await isNative()
    if (!native) return { ok: false, reason: "not_native" }

    const s = readSettings()
    if (!s.notificationsEnabled) return { ok: true, mode: "disabled" }

    if (!isPremiumActive()) return { ok: true, mode: "not_premium" }

    const granted = await ensurePermission()
    if (!granted) return { ok: false, reason: "permission_denied" }

    await ensureChannel()

    const name = readUserName()
    const all = readRecurring()
    const active = all.filter((r) => r?.active !== false && r?.notify?.enabled !== false)

    const ids = active.map((r) => recurringNotifId(r.id))
    await cancelIds(ids)

    if (!active.length) return { ok: true, mode: "nothing_to_schedule" }

    const { LocalNotifications } = await import("@capacitor/local-notifications")

    const notifications = active.map((r) => {
        const { at, time } = computeNextRecurringAt(r)
        const id = recurringNotifId(r.id)
        const amt = Number(r.amount || 0).toFixed(2)

        const title = "HAIP"
        const body =
            r.type === "entrata"
                ? `${formatName(name)}oggi è previsto: ${r.description || "Entrata"} (+${amt}€)`
                : `${formatName(name)}oggi scatta: ${r.description || "Uscita"} (-${amt}€)`

        const largeBody =
            `Ricorrente: ${r.description || "—"}\n` +
            `Importo: ${amt}€ • Categoria: ${r.category || "altro"}\n` +
            `Tocca per aggiungere il movimento precompilato.`

        return {
            id,
            title,
            body,
            largeBody,
            // ✅ FIX PRINCIPALE: allowWhileIdle
            schedule: { at, allowWhileIdle: true },
            channelId: CHANNEL_ID,
            smallIcon: "ic_notification",
            iconColor: "#0EA5E9",
            extra: { kind: "recurring", recurringId: r.id, when: at.toISOString(), time },
        }
    })

    await LocalNotifications.schedule({ notifications })
    return { ok: true, mode: "scheduled", count: notifications.length }
}

/**
 * ✅ DEBUG: schedula una notifica ricorrente "tra X secondi"
 * per verificare se il device consegna le ricorrenti.
 */
export async function debugScheduleRecurringSoon(recId, seconds = 15) {
    const native = await isNative()
    if (!native) return { ok: false, reason: "not_native" }
    const granted = await ensurePermission()
    if (!granted) return { ok: false, reason: "permission_denied" }
    await ensureChannel()

    const all = readRecurring()
    const rec = all.find((x) => x?.id === recId)
    if (!rec) return { ok: false, reason: "not_found" }

    const { LocalNotifications } = await import("@capacitor/local-notifications")
    const at = new Date(Date.now() + Math.max(5, seconds) * 1000)
    const id = recurringNotifId(recId)

    const name = readUserName()
    const amt = Number(rec.amount || 0).toFixed(2)

    await LocalNotifications.schedule({
        notifications: [
            {
                id,
                title: "HAIP (test ricorrente)",
                body: `${formatName(name)}test: ${rec.description || "Ricorrente"} (${amt}€)`,
                largeBody: "Se arriva, il problema NON è Android: è il calcolo data/ora.",
                schedule: { at, allowWhileIdle: true },
                channelId: CHANNEL_ID,
                smallIcon: "ic_notification",
                iconColor: "#0EA5E9",
                extra: { kind: "recurring", recurringId: recId, when: at.toISOString(), test: true },
            },
        ],
    })

    return { ok: true, when: at.toISOString(), id }
}
