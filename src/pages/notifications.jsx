import { useEffect, useRef, useState } from "react"
import { Bell, Clock, ExternalLink, ShieldAlert, Beaker } from "lucide-react"
import { Button } from "@/components/ui/button"
import { applyNotificationSettings, debugTestNotification } from "@/services/notifications"
import { APP_CONFIG } from "@/config/config"

import GlobalTopBar from "@/components/layout/GlobalTopBar"

import PremiumUpsellDialog from "@/components/ui/PremiumUpsellDialog"
import BillingNotReadyDialog from "@/components/ui/BillingNotReadyDialog"
import PremiumHub from "@/components/premium/PremiumHub"

const SETTINGS_KEY = "howamipoor:settings:v1"
const PREMIUM_EVENT = "haip:openPremium"

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

export default function Notifications() {
    const [settings, setSettings] = useState(readSettings())
    const [notifStatus, setNotifStatus] = useState("")

    const [nativeInfo, setNativeInfo] = useState({
        isNative: false,
        notifPermission: "unknown", // unknown | granted | denied
    })

    const applyTimer = useRef(null)

    // premium modal state
    const [premiumUpsellOpen, setPremiumUpsellOpen] = useState(false)
    const [premiumReason, setPremiumReason] = useState("premium")
    const [premiumHubOpen, setPremiumHubOpen] = useState(false)
    const [billingNotReadyOpen, setBillingNotReadyOpen] = useState(false)

    // Persist + apply (debounced) quando cambiano i toggle
    useEffect(() => {
        writeSettings(settings)

        if (applyTimer.current) clearTimeout(applyTimer.current)
        applyTimer.current = setTimeout(async () => {
            const res = await applyNotificationSettings()
            if (res.ok) setNotifStatus("Notifiche aggiornate ✅")
            else if (res.reason === "not_native") setNotifStatus("Notifiche: disponibili solo su app Android.")
            else if (res.reason === "permission_denied")
                setNotifStatus("Permesso notifiche negato. Abilitalo nelle impostazioni Android.")
            else if (res.reason === "disabled_by_config") setNotifStatus("Notifiche disabilitate a livello di app.")
            else setNotifStatus("")
            setTimeout(() => setNotifStatus(""), 2500)
        }, 350)

        return () => {
            if (applyTimer.current) clearTimeout(applyTimer.current)
        }
    }, [settings])

    // Detect native + permission status
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

    // ✅ ascolta premium click dalla topbar/menu
    useEffect(() => {
        const onPremium = (e) => {
            const reason = e?.detail?.reason || "premium"
            setPremiumReason(reason)
            setPremiumUpsellOpen(true)
        }
        window.addEventListener(PREMIUM_EVENT, onPremium)
        return () => window.removeEventListener(PREMIUM_EVENT, onPremium)
    }, [])

    const surface = "rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))]"
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

            if (req.display === "granted") setNotifStatus("Permesso notifiche concesso ✅")
            else setNotifStatus("Permesso notifiche negato ❌")

            setTimeout(() => setNotifStatus(""), 2500)
        } catch {
            setNotifStatus("Impossibile richiedere permesso. Prova dalle impostazioni Android.")
            setTimeout(() => setNotifStatus(""), 3500)
        }
    }

    return (
        <div className="min-h-[100dvh] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
            <GlobalTopBar page="Notifiche" />

            <main className="px-4 pb-10 pt-3">
                <div className="max-w-2xl mx-auto space-y-4">
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
                            <div className="mt-4">
                                <div className={`${soft} p-3`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`h-10 w-10 rounded-2xl border ${soft} flex items-center justify-center`}>
                                            <ShieldAlert className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold">Android: consigli anti-“notifiche perse”</p>
                                            <ul className={`mt-2 text-xs ${mutedClass} list-disc pl-5 space-y-1`}>
                                                <li>Abilita le notifiche per HAIP</li>
                                                <li>Metti HAIP su “Nessuna restrizione” in Batteria</li>
                                                <li>Evita “Forza interruzione”</li>
                                            </ul>

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={openAppSettings}
                                                    className="inline-flex items-center gap-2"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                    Apri impostazioni app
                                                </Button>

                                                {nativeInfo.notifPermission !== "granted" && (
                                                    <Button onClick={requestNotifPermission}>
                                                        Richiedi permesso notifiche
                                                    </Button>
                                                )}
                                            </div>
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
                                        onChange={(e) =>
                                            setSettings((s) => ({ ...s, dailyReminderEnabled: e.target.checked }))
                                        }
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
                        </div>

                        {APP_CONFIG?.DEV_TOOLS_ENABLED && (
                            <div className="pt-2">
                                <Button
                                    variant="outline"
                                    onClick={debugTestNotification}
                                    className="inline-flex items-center gap-2"
                                >
                                    <Beaker className="h-4 w-4" />
                                    Test notifica (5s)
                                </Button>
                            </div>
                        )}

                        <div className="mt-4 flex items-center gap-2">
                            <Button onClick={() => (window.location.hash = "#/recurring")}>Gestisci ricorrenti</Button>
                        </div>
                    </section>
                </div>
            </main>

            <PremiumUpsellDialog
                open={premiumUpsellOpen}
                reason={premiumReason}
                onClose={() => setPremiumUpsellOpen(false)}
                onConfirm={() => setPremiumHubOpen(true)}
            />

            <PremiumHub
                open={premiumHubOpen}
                onClose={() => setPremiumHubOpen(false)}
                onBillingNotReady={() => setBillingNotReadyOpen(true)}
            />

            <BillingNotReadyDialog open={billingNotReadyOpen} onClose={() => setBillingNotReadyOpen(false)} />

            <div className="pb-[env(safe-area-inset-bottom)]" />
        </div>
    )
}
