import { APP_CONFIG } from "@/config/config"
import { scheduleRecurringNotifications } from "@/services/recurringNotifications"

const SETTINGS_KEY = "howamipoor:settings:v1"
const USER_KEY = "howamipoor:user:v1"
const LAST_ACTIVE_KEY = "howamipoor:lastActiveAt:v1"

const ID_DAILY = 1001
const ID_INACTIVITY = 1002

const CHANNEL_ID = "haip_reminders"
const CHANNEL_NAME = "Promemoria HAIP"

function readSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY)
        if (!raw) {
            return {
                notificationsEnabled: true,
                dailyReminderEnabled: true,
                dailyReminderTime: "20:30",
                inactivityEnabled: true,
            }
        }
        const p = JSON.parse(raw)
        return {
            notificationsEnabled: p?.notificationsEnabled ?? true,
            dailyReminderEnabled: p?.dailyReminderEnabled ?? true,
            dailyReminderTime: p?.dailyReminderTime ?? "20:30",
            inactivityEnabled: p?.inactivityEnabled ?? true,
        }
    } catch {
        return {
            notificationsEnabled: true,
            dailyReminderEnabled: true,
            dailyReminderTime: "20:30",
            inactivityEnabled: true,
        }
    }
}

function readUserName() {
    try {
        const raw = localStorage.getItem(USER_KEY)
        if (!raw) return ""
        const p = JSON.parse(raw)
        return String(p?.name || "").trim()
    } catch {
        return ""
    }
}

function setLastActiveNow() {
    localStorage.setItem(LAST_ACTIVE_KEY, JSON.stringify({ ts: Date.now() }))
}

function toNextDailyDate(timeStr) {
    const [hh, mm] = String(timeStr || "20:30").split(":").map((x) => Number(x))
    const now = new Date()
    const next = new Date(now)
    next.setSeconds(0, 0)
    next.setHours(Number.isFinite(hh) ? hh : 20, Number.isFinite(mm) ? mm : 30, 0, 0)
    if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1)
    return next
}

function formatName(name) {
    return name ? `${name}, ` : ""
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

async function cancelByIds(ids) {
    try {
        const { LocalNotifications } = await import("@capacitor/local-notifications")
        await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) })
    } catch {
        // ignore
    }
}

async function scheduleDaily(timeStr, name) {
    const next = toNextDailyDate(timeStr)

    const title = "HAIP"
    const body = `${formatName(name)}hai segnato le spese oggi o stai fingendo?`
    const largeBody =
        `${formatName(name)}ti ricordo che il saldo non si aggiorna da solo.\n` +
        `Apri HAIP e aggiungi i movimenti di oggi (10 secondi).`

    const { LocalNotifications } = await import("@capacitor/local-notifications")

    await LocalNotifications.schedule({
        notifications: [
            {
                id: ID_DAILY,
                title,
                body,
                largeBody,
                schedule: { at: next, repeats: true, every: "day" },
                channelId: CHANNEL_ID,
                smallIcon: "ic_notification",
                iconColor: "#0EA5E9",
                extra: { kind: "daily" },
            },
        ],
    })
}

async function scheduleInactivity5Days(name) {
    const now = new Date()
    const in5 = new Date(now)
    in5.setDate(in5.getDate() + 5)
    in5.setSeconds(0, 0)

    const title = "HAIP"
    const body = `${formatName(name)}non ti vedo da un po’. Tutto bene? 😈`
    const largeBody =
        `${formatName(name)}sono passati 5 giorni.\n` +
        `Apri HAIP e aggiorna i movimenti.`

    const { LocalNotifications } = await import("@capacitor/local-notifications")

    await LocalNotifications.schedule({
        notifications: [
            {
                id: ID_INACTIVITY,
                title,
                body,
                largeBody,
                schedule: { at: in5 },
                channelId: CHANNEL_ID,
                smallIcon: "ic_notification",
                iconColor: "#0EA5E9",
                extra: { kind: "inactivity_5d" },
            },
        ],
    })
}

export async function applyNotificationSettings() {
    if (!APP_CONFIG.NOTIFICATIONS_ENABLED) return { ok: false, reason: "disabled_by_config" }

    const native = await isNative()
    if (!native) return { ok: false, reason: "not_native" }

    const s = readSettings()
    const name = readUserName()

    if (!s.notificationsEnabled) {
        await cancelByIds([ID_DAILY, ID_INACTIVITY])
        // ricorrenti: cancello nel servizio ricorrenti stesso (quando chiamato)
        await scheduleRecurringNotifications()
        return { ok: true, mode: "disabled" }
    }

    const granted = await ensurePermission()
    if (!granted) {
        await cancelByIds([ID_DAILY, ID_INACTIVITY])
        return { ok: false, reason: "permission_denied" }
    }

    await ensureChannel()

    // cancel + reschedule per evitare drift/duplicati
    await cancelByIds([ID_DAILY, ID_INACTIVITY])

    if (s.dailyReminderEnabled) await scheduleDaily(s.dailyReminderTime, name)
    if (s.inactivityEnabled) await scheduleInactivity5Days(name)

    await scheduleRecurringNotifications()

    return { ok: true, mode: "scheduled" }
}

export async function onAppBecameActive() {
    setLastActiveNow()
    return applyNotificationSettings()
}

export async function debugTestNotification() {
    const native = await isNative()
    if (!native) return { ok: false, reason: "not_native" }

    const granted = await ensurePermission()
    if (!granted) return { ok: false, reason: "permission_denied" }

    await ensureChannel()

    const name = readUserName()
    const { LocalNotifications } = await import("@capacitor/local-notifications")

    const at = new Date(Date.now() + 5000)

    await LocalNotifications.schedule({
        notifications: [
            {
                id: 9999,
                title: "HAIP (test)",
                body: `${formatName(name)}questa è una notifica test.`,
                largeBody: `${formatName(name)}notifica test.\nSe la vedi, siamo ok.`,
                schedule: { at },
                channelId: CHANNEL_ID,
                smallIcon: "ic_notification",
                iconColor: "#0EA5E9",
                extra: { kind: "test" },
            },
        ],
    })

    return { ok: true }
}
