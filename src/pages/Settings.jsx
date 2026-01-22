import { useEffect, useRef, useState } from "react"
import {
    ArrowLeft,
    Bell,
    RotateCcw,
    User,
    Clock,
    Beaker,
    ExternalLink,
    ShieldAlert,
    HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import ResetConfirmDialog from "@/components/ui/ResetConfirmDialog"
import useTransactions from "@/hooks/useTransactions"
import { applyNotificationSettings, debugTestNotification } from "@/services/notifications"
import { APP_CONFIG } from "@/config/config"
import { Repeat } from "lucide-react"


const USER_KEY = "howamipoor:user:v1"
const SETTINGS_KEY = "howamipoor:settings:v1"

function readUserName() {
    try {
        const raw = localStorage.getItem(USER_KEY)
        if (!raw) return ""
        const p = JSON.parse(raw)
        return String(p?.name || "")
    } catch {
        return ""
    }
}

function writeUserName(name) {
    localStorage.setItem(USER_KEY, JSON.stringify({ name: String(name || "").trim() }))
}

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

function writeSettings(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

export default function Settings({ onBack }) {
    const { reset } = useTransactions()

    const [showReset, setShowReset] = useState(false)
    const [name, setName] = useState(readUserName())
    const [settings, setSettings] = useState(readSettings())
    const [notifStatus, setNotifStatus] = useState("")

    const [nativeInfo, setNativeInfo] = useState({
        isNative: false,
        notifPermission: "unknown", // unknown | granted | denied
    })

    const applyTimer = useRef(null)

    useEffect(() => {
        writeUserName(name)
    }, [name])

    // ✅ Debounce applyNotificationSettings (evita stutter mentre scrolli/cambi toggle)
    useEffect(() => {
        writeSettings(settings)

        if (applyTimer.current) clearTimeout(applyTimer.current)
        applyTimer.current = setTimeout(async () => {
            const res = await applyNotificationSettings()
            if (res.ok) setNotifStatus("Notifiche aggiornate ✅")
            else if (res.reason === "not_native") setNotifStatus("Notifiche: disponibili solo su app Android.")
            else if (res.reason === "permission_denied") setNotifStatus("Permesso notifiche negato. Abilitalo nelle impostazioni Android.")
            else if (res.reason === "disabled_by_config") setNotifStatus("Notifiche disabilitate a livello di app.")
            else setNotifStatus("")
            setTimeout(() => setNotifStatus(""), 2500)
        }, 350)

        return () => {
            if (applyTimer.current) clearTimeout(applyTimer.current)
        }
    }, [settings])

    useEffect(() => {
        ;(async () => {
            try {
                const { Capacitor } = await import("@capacitor/core")
                const isNative = Capacitor.isNativePlatform()
                if (!isNative) {
                    setNativeInfo({ isNative: false, notifPermission: "unknown" })
                    return
                }

                const { LocalNotifications } = await import("@capacitor/local-notifications")
                const perm = await LocalNotifications.checkPermissions()
                setNativeInfo({
                    isNative: true,
                    notifPermission: perm.display === "granted" ? "granted" : "denied",
                })
            } catch {
                setNativeInfo({ isNative: false, notifPermission: "unknown" })
            }
        })()
    }, [])

    const surface = "rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))]" // ✅ no shadow
    const soft = "rounded-2xl border bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
    const mutedClass = "text-[rgb(var(--muted-fg))]"

    const openAppSettings = async () => {
        try {
            const { Capacitor } = await import("@capacitor/core")
            if (!Capacitor.isNativePlatform()) {
                setNotifStatus("Disponibile solo su Android.")
                setTimeout(() => setNotifStatus(""), 2500)
                return
            }

            const { App } = await import("@capacitor/app")
            await App.openSettings()
            setNotifStatus("Aprendo impostazioni app…")
            setTimeout(() => setNotifStatus(""), 1500)
        } catch {
            setNotifStatus("Apri manualmente: Impostazioni → App → HAIP → Notifiche/Batteria.")
            setTimeout(() => setNotifStatus(""), 4000)
        }
    }

    const requestNotifPermission = async () => {
        try {
            const { Capacitor } = await import("@capacitor/core")
            if (!Capacitor.isNativePlatform()) return

            const { LocalNotifications } = await import("@capacitor/local-notifications")
            const req = await LocalNotifications.requestPermissions()

            setNativeInfo((p) => ({
                ...p,
                notifPermission: req.display === "granted" ? "granted" : "denied",
            }))

            setNotifStatus(req.display === "granted" ? "Permesso OK ✅" : "Permesso non concesso.")
            setTimeout(() => setNotifStatus(""), 2500)
        } catch {
            setNotifStatus("Impossibile richiedere permessi.")
            setTimeout(() => setNotifStatus(""), 2500)
        }
    }

    return (
        <div className="min-h-screen overflow-x-hidden bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
            <div className="sticky top-0 z-40 border-b bg-[rgb(var(--card))] border-[rgb(var(--border))]">
                <div className="pt-[env(safe-area-inset-top)]" />
                <div className="mx-auto max-w-3xl px-3 py-3 flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="h-10 w-10 rounded-2xl border bg-[rgb(var(--card-2))] border-[rgb(var(--border))] flex items-center justify-center"
                        aria-label="Torna indietro"
                        title="Torna indietro"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>

                    <div className="min-w-0">
                        <h1 className="text-base font-extrabold tracking-tight">Impostazioni</h1>
                        <p className={`text-xs ${mutedClass} truncate`}>Personalizza HAIP e sposta le cose “da adulti” qui.</p>
                    </div>
                </div>
            </div>

            <main className="mx-auto max-w-3xl px-3 py-5 space-y-4 pb-10">
                {/* Aiuto / Tutorial */}
                <section className={`${surface} p-4`}>
                    <div className="flex items-center gap-2">
                        <div className={`h-10 w-10 rounded-2xl border ${soft} flex items-center justify-center`}>
                            <HelpCircle className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold">Aiuto</p>
                            <p className={`text-xs ${mutedClass}`}>Rivedi il tutorial quando vuoi.</p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                        <Button onClick={() => (window.location.hash = "#/onboarding")}>Rivedi tutorial</Button>
                        <Button variant="outline" onClick={onBack}>Torna alla Home</Button>
                    </div>
                </section>

                {/* Profilo */}
                <section className={`${surface} p-4`}>
                    <div className="flex items-center gap-2">
                        <div className={`h-10 w-10 rounded-2xl border ${soft} flex items-center justify-center`}>
                            <User className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold">Profilo</p>
                            <p className={`text-xs ${mutedClass}`}>Nome usato in messaggi e notifiche.</p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className={`text-xs ${mutedClass}`}>Il tuo nome</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Es. Jhon"
                            className={[
                                "mt-2 w-full rounded-2xl border px-3 py-2 text-sm outline-none",
                                "bg-[rgb(var(--card-2))] border-[rgb(var(--border))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                            ].join(" ")}
                        />
                        <p className={`mt-2 text-xs ${mutedClass}`}>Puoi lasciarlo vuoto: HAIP ti giudica comunque.</p>
                    </div>
                </section>

                {/* Notifiche */}
                <section className={`${surface} p-4`}>
                    <div className="flex items-center gap-2">
                        <div className={`h-10 w-10 rounded-2xl border ${soft} flex items-center justify-center`}>
                            <Bell className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold">Notifiche</p>
                            <p className={`text-xs ${mutedClass}`}>Reminder giornaliero + inattività.</p>
                        </div>
                    </div>

                    {notifStatus && <p className={`mt-3 text-xs ${mutedClass}`}>{notifStatus}</p>}

                    {nativeInfo.isNative && (
                        <div className={`mt-4 rounded-2xl border p-3 ${soft}`}>
                            <div className="flex items-start gap-2">
                                <ShieldAlert className="h-4 w-4 mt-0.5" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold">Se le notifiche non arrivano…</p>
                                    <p className={`mt-1 text-xs ${mutedClass}`}>
                                        Se chiudi l’app dai “Recenti” o hai risparmio batteria aggressivo, alcune ROM bloccano le notifiche.
                                    </p>

                                    <ul className={`mt-2 text-xs ${mutedClass} list-disc pl-5 space-y-1`}>
                                        <li>Abilita le notifiche per HAIP</li>
                                        <li>Metti HAIP su “Nessuna restrizione” in Batteria</li>
                                        <li>Evita “Forza interruzione”</li>
                                    </ul>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Button variant="outline" onClick={openAppSettings} className="inline-flex items-center gap-2">
                                            <ExternalLink className="h-4 w-4" />
                                            Apri impostazioni app
                                        </Button>

                                        {nativeInfo.notifPermission !== "granted" && (
                                            <Button onClick={requestNotifPermission}>Richiedi permesso notifiche</Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 space-y-3">
                        <div className={`${soft} p-3 flex items-center justify-between gap-3`}>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold">Notifiche abilitate</p>
                                <p className={`text-xs ${mutedClass}`}>Disattiva tutto con un colpo solo.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={!!settings.notificationsEnabled}
                                onChange={(e) => setSettings((s) => ({ ...s, notificationsEnabled: e.target.checked }))}
                                className="h-5 w-5"
                            />
                        </div>

                        <div className={`${soft} p-3 space-y-2`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Reminder giornaliero
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={!!settings.dailyReminderEnabled}
                                    disabled={!settings.notificationsEnabled}
                                    onChange={(e) => setSettings((s) => ({ ...s, dailyReminderEnabled: e.target.checked }))}
                                    className="h-5 w-5"
                                />
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <label className={`text-xs ${mutedClass}`}>Orario</label>
                                <input
                                    type="time"
                                    value={settings.dailyReminderTime}
                                    disabled={!settings.notificationsEnabled || !settings.dailyReminderEnabled}
                                    onChange={(e) => setSettings((s) => ({ ...s, dailyReminderTime: e.target.value }))}
                                    className={[
                                        "rounded-xl border px-3 py-2 text-sm outline-none",
                                        "bg-[rgb(var(--card))] border-[rgb(var(--border))] text-[rgb(var(--fg))]",
                                    ].join(" ")}
                                />
                            </div>
                        </div>

                        <div className={`${soft} p-3 flex items-start justify-between gap-3`}>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold">Notifica inattività (5 giorni)</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={!!settings.inactivityEnabled}
                                disabled={!settings.notificationsEnabled}
                                onChange={(e) => setSettings((s) => ({ ...s, inactivityEnabled: e.target.checked }))}
                                className="h-5 w-5"
                            />
                        </div>

                        {APP_CONFIG.DEV_TOOLS_ENABLED && (
                            <div className="pt-2">
                                <Button variant="outline" onClick={debugTestNotification}>
                                    Test notifica (5s)
                                </Button>
                            </div>
                        )}
                    </div>
                </section>
                {/* Ricorrenti */}
                <section className={`${surface} p-4`}>
                    <div className="flex items-center gap-2">
                        <div className={`h-10 w-10 rounded-2xl border ${soft} flex items-center justify-center`}>
                            <Repeat className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold">Ricorrenti</p>
                            <p className={`text-xs ${mutedClass}`}>Abbonamenti, entrate fisse, e promemoria.</p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                        <Button onClick={() => (window.location.hash = "#/recurring")}>
                            Gestisci ricorrenti
                        </Button>
                    </div>
                </section>

                {/* Reset */}
                <section className={`${surface} p-4`}>
                    <div className="flex items-center gap-2">
                        <div className={`h-10 w-10 rounded-2xl border ${soft} flex items-center justify-center`}>
                            <RotateCcw className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold">Reset</p>
                            <p className={`text-xs ${mutedClass}`}>Svuota tutti i movimenti (irreversibile).</p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <Button variant="secondary" onClick={() => setShowReset(true)}>
                            Reset movimenti
                        </Button>
                    </div>
                </section>

                {/* Developer section */}
                {APP_CONFIG.DEV_TOOLS_ENABLED && (
                    <section className={`${surface} p-4`}>
                        <div className="flex items-center gap-2">
                            <div className={`h-10 w-10 rounded-2xl border ${soft} flex items-center justify-center`}>
                                <Beaker className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold">Developer</p>
                                <p className={`text-xs ${mutedClass}`}>Strumenti temporanei per test.</p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <Button
                                onClick={async () => {
                                    const { seedTransactions } = await import("@/dev/seedTransactions")
                                    seedTransactions(1200)
                                    location.reload()
                                }}
                            >
                                Seed 1200
                            </Button>

                            <Button variant="outline" onClick={onBack}>
                                Torna alla Home
                            </Button>
                        </div>
                        <Button
                            variant="outline"
                            onClick={async () => {
                                const { debugListPendingNotifications } = await import("@/services/notifications")
                                const res = await debugListPendingNotifications()
                                console.log("PENDING:", res)
                                alert(res.ok ? `Pending: ${res.pending.notifications?.length || 0}\nGuarda console/logcat` : `Errore: ${res.reason}`)
                            }}
                        >
                            Debug pending notif
                        </Button>
                    </section>
                )}
            </main>

            <ResetConfirmDialog
                open={showReset}
                onClose={() => setShowReset(false)}
                onConfirm={() => {
                    reset()
                    setShowReset(false)
                }}
            />
        </div>
    )
}
