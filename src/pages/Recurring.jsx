import { useMemo, useState, useEffect } from "react"
import { Plus, Repeat, Trash2, Pencil, Lock, X, AlarmClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import useRecurring from "@/hooks/useRecurring"
import usePremium from "@/hooks/usePremium"
import PremiumUpsellDialog from "@/components/ui/PremiumUpsellDialog"
import PremiumHub from "@/components/premium/PremiumHub"
import BillingNotReadyDialog from "@/components/ui/BillingNotReadyDialog"
import { APP_CONFIG } from "@/config/config"
import { computeNextRecurringAt, debugScheduleRecurringSoon } from "@/services/recurringNotifications"

import GlobalTopBar from "@/components/layout/GlobalTopBar"

import {
    getCategoriesByType,
    getDefaultCategoryByType,
    isCategoryAllowedForType,
    getCategoryLabel,
} from "@/entities/categories"

const INTRO_KEY = "howamipoor:recurringIntroSeen:v1"
const PREMIUM_EVENT = "haip:openPremium"

function fmtEUR(n) {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(n) || 0)
}

function normalizeAmountInput(raw) {
    return String(raw ?? "").trim().replace(/\s/g, "").replace(",", ".")
}

function parseAmountStrict(raw) {
    const s = normalizeAmountInput(raw)
    if (!s) return { ok: false, value: null, reason: "empty" }
    if (!/^-?\d+(\.\d{0,2})?$/.test(s)) return { ok: false, value: null, reason: "format" }
    const n = Number(s)
    if (!Number.isFinite(n)) return { ok: false, value: null, reason: "nan" }
    const v = Math.round(Math.abs(n) * 100) / 100
    if (v <= 0) return { ok: false, value: null, reason: "zero" }
    return { ok: true, value: v, reason: null }
}

function clampInt(v, min, max) {
    const n = Number(v)
    if (!Number.isFinite(n)) return null
    const t = Math.trunc(n)
    if (t < min || t > max) return null
    return t
}

function RecurringForm({ initial, onCancel, onSave }) {
    const muted = "text-[rgb(var(--muted-fg))]"
    const soft = "rounded-2xl border bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"

    const [type, setType] = useState(initial?.type ?? "uscita")
    const [description, setDescription] = useState(initial?.description ?? "")
    const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount).replace(".", ",") : "")
    const [day, setDay] = useState(initial?.schedule?.day ?? 1)

    const [tDesc, setTDesc] = useState(false)
    const [tAmount, setTAmount] = useState(false)
    const [tDay, setTDay] = useState(false)

    const categoriesForType = useMemo(() => getCategoriesByType(type), [type])

    const [category, setCategory] = useState(() => {
        const from = initial?.category
        if (from && isCategoryAllowedForType(from, type)) return from
        return getDefaultCategoryByType(type)
    })

    useEffect(() => {
        setCategory((prev) => {
            if (prev && isCategoryAllowedForType(prev, type)) return prev
            return getDefaultCategoryByType(type)
        })
    }, [type])

    const [notifyEnabled, setNotifyEnabled] = useState(initial?.notify?.enabled ?? true)
    const [notifyTime, setNotifyTime] = useState(initial?.notify?.time ?? "09:00")
    const [daysBefore, setDaysBefore] = useState(initial?.notify?.daysBefore ?? 0)

    const descOk = useMemo(() => String(description || "").trim().length > 0, [description])
    const amountParsed = useMemo(() => parseAmountStrict(amount), [amount])
    const dayInt = useMemo(() => clampInt(day, 1, 31), [day])
    const dayOk = useMemo(() => dayInt != null, [dayInt])

    const daysBeforeClamped = useMemo(() => {
        const n = Number(daysBefore)
        if (!Number.isFinite(n)) return 0
        return Math.min(7, Math.max(0, Math.trunc(n)))
    }, [daysBefore])

    const canSubmit = useMemo(() => {
        if (!descOk) return false
        if (!amountParsed.ok) return false
        if (!dayOk) return false
        return true
    }, [descOk, amountParsed.ok, dayOk])

    const amountErrorText = useMemo(() => {
        if (amountParsed.ok) return ""
        if (amountParsed.reason === "empty") return "Inserisci un importo."
        if (amountParsed.reason === "format") return "Formato non valido. Usa 12,34 oppure 12.34"
        if (amountParsed.reason === "zero") return "L’importo deve essere > 0."
        return "Importo non valido."
    }, [amountParsed])

    const submit = () => {
        // forza touched per mostrare errori se prova a salvare
        setTDesc(true)
        setTAmount(true)
        setTDay(true)

        if (!canSubmit) return

        onSave?.({
            ...(initial?.id ? { id: initial.id } : {}),
            type,
            description: String(description).trim(),
            amount: amountParsed.value,
            category,
            schedule: { freq: "monthly", day: dayInt },
            notify: {
                enabled: !!notifyEnabled,
                time: String(notifyTime).slice(0, 5),
                daysBefore: daysBeforeClamped,
            },
            active: initial?.active !== false,
        })
    }

    const inputBase = "w-full rounded-xl border px-3 py-2 bg-[rgb(var(--card))] border-[rgb(var(--border))] outline-none"
    const badBorder = "border-red-500/60"

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Button
                    variant={type === "uscita" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setType("uscita")}
                    type="button"
                >
                    Uscita
                </Button>
                <Button
                    variant={type === "entrata" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setType("entrata")}
                    type="button"
                >
                    Entrata
                </Button>
            </div>

            <div className={soft + " p-3 space-y-2"}>
                <label className={`text-xs ${muted}`}>Descrizione</label>
                <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => setTDesc(true)}
                    className={[inputBase, tDesc && !descOk ? badBorder : ""].join(" ")}
                    placeholder="Es. Netflix"
                />
                {tDesc && !descOk ? <p className="text-xs text-red-400">Inserisci una descrizione.</p> : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className={soft + " p-3 space-y-2"}>
                    <label className={`text-xs ${muted}`}>Importo</label>
                    <input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onBlur={() => setTAmount(true)}
                        inputMode="decimal"
                        className={[inputBase, tAmount && !amountParsed.ok ? badBorder : ""].join(" ")}
                        placeholder="7,00"
                    />
                    {tAmount && !amountParsed.ok ? <p className="text-xs text-red-400">{amountErrorText}</p> : null}
                </div>

                <div className={soft + " p-3 space-y-2"}>
                    <label className={`text-xs ${muted}`}>Categoria</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={inputBase}
                    >
                        {categoriesForType.map((c) => (
                            <option key={c.key} value={c.key}>
                                {c.label ?? getCategoryLabel(c.key)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={soft + " p-3 space-y-2"}>
                <label className={`text-xs ${muted}`}>Ricorrenza (mensile)</label>
                <div className="flex items-center gap-3">
                    <span className={`text-sm ${muted}`}>Giorno del mese</span>
                    <input
                        type="number"
                        min={1}
                        max={31}
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                        onBlur={() => setTDay(true)}
                        className={[ "w-20 rounded-xl border px-3 py-2 bg-[rgb(var(--card))] border-[rgb(var(--border))] outline-none", tDay && !dayOk ? badBorder : ""].join(" ")}
                    />
                </div>
                {tDay && !dayOk ? <p className="text-xs text-red-400">Inserisci un giorno valido (1–31).</p> : null}
            </div>

            <div className={soft + " p-3 space-y-3"}>
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold">Notifica</p>
                        <p className={`text-xs ${muted}`}>Ti avvisa e apre la modale precompilata.</p>
                    </div>
                    <input
                        type="checkbox"
                        checked={notifyEnabled}
                        onChange={(e) => setNotifyEnabled(e.target.checked)}
                        className="h-5 w-5"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={`text-xs ${muted}`}>Ora</label>
                        <input
                            type="time"
                            value={notifyTime}
                            onChange={(e) => setNotifyTime(e.target.value)}
                            className={"mt-2 " + inputBase}
                            disabled={!notifyEnabled}
                        />
                    </div>

                    <div>
                        <label className={`text-xs ${muted}`}>Giorni prima</label>
                        <input
                            type="number"
                            min={0}
                            max={7}
                            value={daysBefore}
                            onChange={(e) => setDaysBefore(e.target.value)}
                            className={"mt-2 " + inputBase}
                            disabled={!notifyEnabled}
                        />
                        {notifyEnabled && Number(daysBefore) !== daysBeforeClamped ? (
                            <p className={`mt-1 text-xs ${muted}`}>Valore applicato: {daysBeforeClamped} (max 7)</p>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={onCancel} type="button">
                    Annulla
                </Button>
                <Button onClick={submit} type="button" disabled={!canSubmit}>
                    Salva
                </Button>
            </div>
        </div>
    )
}

export default function Recurring() {
    const { isPremium } = usePremium()
    const { items, add, update, remove, toggleActive, stats } = useRecurring()

    const [editing, setEditing] = useState(null)
    const [showForm, setShowForm] = useState(false)

    const [showIntro, setShowIntro] = useState(() => {
        try {
            const raw = localStorage.getItem(INTRO_KEY)
            if (!raw) return true
            const p = JSON.parse(raw)
            return !p?.seen
        } catch {
            return true
        }
    })

    const dismissIntro = () => {
        setShowIntro(false)
        localStorage.setItem(INTRO_KEY, JSON.stringify({ seen: true, ts: Date.now() }))
    }

    const [upsellOpen, setUpsellOpen] = useState(false)
    const [hubOpen, setHubOpen] = useState(false)
    const [billingNotReadyOpen, setBillingNotReadyOpen] = useState(false)

    useEffect(() => {
        const onPremium = () => setUpsellOpen(true)
        window.addEventListener(PREMIUM_EVENT, onPremium)
        return () => window.removeEventListener(PREMIUM_EVENT, onPremium)
    }, [])

    const surface = "rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const soft = "rounded-2xl border bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
    const muted = "text-[rgb(var(--muted-fg))]"

    const introBanner = showIntro ? (
        <div className={`${surface} p-4`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-extrabold">Che roba è questa pagina?</p>
                    <p className={`mt-1 text-sm ${muted}`}>
                        Qui gestisci abbonamenti e movimenti fissi (Netflix, affitto, stipendio).
                        <br />
                        HAIP ti avvisa il giorno dello “scalo” e ti prepara il movimento.
                    </p>
                </div>

                <button
                    onClick={dismissIntro}
                    className={`h-10 w-10 rounded-2xl border ${soft} flex items-center justify-center shrink-0`}
                    aria-label="Chiudi"
                    title="Chiudi"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    ) : null

    if (!isPremium) {
        return (
            <div className="min-h-[100dvh] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
                <GlobalTopBar page="Ricorrenti" />

                <main className="mx-auto max-w-3xl px-3 py-6 space-y-4 pb-[calc(24px+env(safe-area-inset-bottom))]">
                    {introBanner}

                    <div className={`${surface} p-5`}>
                        <div className="flex items-start gap-3">
                            <div className={`h-10 w-10 rounded-2xl border ${soft} flex items-center justify-center`}>
                                <Lock className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-extrabold">Ricorrenti è Premium</p>
                                <p className={`mt-1 text-sm ${muted}`}>
                                    Abbonamenti come Netflix, affitto, stipendio… e notifica il giorno dello scalo.
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <Button onClick={() => setUpsellOpen(true)}>Sblocca Premium</Button>
                        </div>
                    </div>
                </main>

                <PremiumUpsellDialog open={upsellOpen} onClose={() => setUpsellOpen(false)} onConfirm={() => setHubOpen(true)} reason="premium" />
                <PremiumHub open={hubOpen} onClose={() => setHubOpen(false)} onBillingNotReady={() => setBillingNotReadyOpen(true)} />
                <BillingNotReadyDialog open={billingNotReadyOpen} onClose={() => setBillingNotReadyOpen(false)} />
            </div>
        )
    }

    return (
        <div className="min-h-[100dvh] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
            <GlobalTopBar page="Ricorrenti" />

            <main className="mx-auto max-w-3xl px-3 py-6 space-y-4 pb-[calc(24px+env(safe-area-inset-bottom))]">
                {introBanner}

                <div className={`${surface} p-4 flex items-center justify-between gap-3`}>
                    <div className="flex items-center gap-2">
                        <div className={`h-10 w-10 rounded-2xl border ${soft} flex items-center justify-center`}>
                            <Repeat className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Ricorrenti</p>
                            <p className={`text-xs ${muted}`}>{stats.active}/{stats.count} attive</p>
                        </div>
                    </div>

                    <Button
                        onClick={() => {
                            setEditing(null)
                            setShowForm(true)
                        }}
                        className="rounded-2xl"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nuova
                    </Button>
                </div>

                {items.length === 0 ? (
                    <div className={`${surface} p-5`}>
                        <p className="text-sm font-semibold">Nessuna ricorrenza.</p>
                        <p className={`mt-1 text-xs ${muted}`}>Crea Netflix, affitto, stipendio, ecc.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((r) => {
                            const nextInfo = r?.notify?.enabled !== false && r?.active !== false ? computeNextRecurringAt(r) : null
                            return (
                                <div key={r.id} className={`${surface} p-4`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-extrabold truncate">
                                                {r.description || "(senza nome)"}{" "}
                                                <span className={`ml-2 text-xs ${muted}`}>{r.type === "entrata" ? "Entrata" : "Uscita"}</span>
                                            </p>
                                            <p className={`mt-1 text-sm ${muted}`}>
                                                {fmtEUR(r.amount)} • {getCategoryLabel(r.category || "altro")} • ogni mese il giorno {r.schedule.day}
                                            </p>
                                            <p className={`mt-1 text-xs ${muted}`}>
                                                Notifica: {r.notify.enabled ? `ON (${r.notify.time}, ${r.notify.daysBefore}g prima)` : "OFF"}
                                            </p>

                                            {nextInfo && (
                                                <p className={`mt-2 text-xs ${muted} flex items-center gap-2`}>
                                                    <AlarmClock className="h-4 w-4" />
                                                    Prossima: {new Date(nextInfo.at).toLocaleString("it-IT")}
                                                </p>
                                            )}
                                        </div>

                                        <div className="shrink-0 text-right">
                                            <label className={`text-xs ${muted} mr-2`}>Attiva</label>
                                            <input type="checkbox" checked={!!r.active} onChange={() => toggleActive(r.id)} className="h-5 w-5" />
                                        </div>
                                    </div>

                                    <div className="mt-3 flex justify-end gap-2 flex-wrap">
                                        {APP_CONFIG.DEV_TOOLS_ENABLED && (
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const res = await debugScheduleRecurringSoon(r.id, 15)
                                                    console.log("DEBUG recurring test:", res)
                                                    alert(res.ok ? "Test schedulato (15s). Metti app in background." : `Errore: ${res.reason}`)
                                                }}
                                                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${soft} hover:opacity-90`}
                                                title="Test 15s"
                                            >
                                                <AlarmClock className="h-4 w-4" />
                                                Test 15s
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditing(r)
                                                setShowForm(true)
                                            }}
                                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${soft} hover:opacity-90`}
                                            title="Modifica"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Modifica
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => remove(r.id)}
                                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${soft} hover:opacity-90`}
                                            title="Elimina"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Elimina
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {showForm && (
                    <div className={`${surface} p-5`}>
                        <p className="text-sm font-extrabold">{editing ? "Modifica ricorrente" : "Nuova ricorrente"}</p>
                        <div className="mt-4">
                            <RecurringForm
                                initial={editing}
                                onCancel={() => {
                                    setShowForm(false)
                                    setEditing(null)
                                }}
                                onSave={(data) => {
                                    if (editing?.id) update({ ...editing, ...data })
                                    else add(data)
                                    setShowForm(false)
                                    setEditing(null)
                                }}
                            />
                        </div>
                    </div>
                )}
            </main>

            <PremiumUpsellDialog open={upsellOpen} onClose={() => setUpsellOpen(false)} onConfirm={() => setHubOpen(true)} reason="premium" />
            <PremiumHub open={hubOpen} onClose={() => setHubOpen(false)} onBillingNotReady={() => setBillingNotReadyOpen(true)} />
            <BillingNotReadyDialog open={billingNotReadyOpen} onClose={() => setBillingNotReadyOpen(false)} />

            <div className="pb-[env(safe-area-inset-bottom)]" />
        </div>
    )
}
