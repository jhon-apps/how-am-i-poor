import { useMemo, useState, useEffect } from "react"
import { ArrowLeft, Plus, Repeat, Trash2, Pencil, Lock, X, AlarmClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import useRecurring from "@/hooks/useRecurring"
import usePremium from "@/hooks/usePremium"
import PremiumUpsellDialog from "@/components/ui/PremiumUpsellDialog"
import PremiumHub from "@/components/premium/PremiumHub"
import BillingNotReadyDialog from "@/components/ui/BillingNotReadyDialog"
import { APP_CONFIG } from "@/config/config"
import { computeNextRecurringAt, debugScheduleRecurringSoon } from "@/services/recurringNotifications"

import {
    getCategoriesByType,
    getDefaultCategoryByType,
    isCategoryAllowedForType,
    getCategoryLabel,
} from "@/entities/categories"

const INTRO_KEY = "howamipoor:recurringIntroSeen:v1"

function fmtEUR(n) {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(n) || 0)
}

function clampDay(v) {
    const n = Number(v)
    if (!Number.isFinite(n)) return 1
    return Math.min(31, Math.max(1, Math.trunc(n)))
}

function RecurringForm({ initial, onCancel, onSave }) {
    const muted = "text-[rgb(var(--muted-fg))]"
    const soft = "rounded-2xl border bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"

    const [type, setType] = useState(initial?.type ?? "uscita")
    const [description, setDescription] = useState(initial?.description ?? "")
    const [amount, setAmount] = useState(initial?.amount ?? "")
    const [day, setDay] = useState(initial?.schedule?.day ?? 1)

    // ✅ nel tuo progetto: getCategoriesByType ritorna array di {key,label}
    const categoriesForType = useMemo(() => getCategoriesByType(type), [type])

    const [category, setCategory] = useState(() => {
        const from = initial?.category
        if (from && isCategoryAllowedForType(from, type)) return from
        return getDefaultCategoryByType(type)
    })

    // se cambio tipo, riallinea categoria se non compatibile
    useEffect(() => {
        setCategory((prev) => {
            if (prev && isCategoryAllowedForType(prev, type)) return prev
            return getDefaultCategoryByType(type)
        })
    }, [type])

    // notification prefs
    const [notifyEnabled, setNotifyEnabled] = useState(initial?.notify?.enabled ?? true)
    const [notifyTime, setNotifyTime] = useState(initial?.notify?.time ?? "09:00")
    const [daysBefore, setDaysBefore] = useState(initial?.notify?.daysBefore ?? 0)

    const submit = () => {
        const parsed = Number(String(amount).replace(",", "."))
        const cleanAmount = Number.isFinite(parsed) ? Math.abs(parsed) : 0

        onSave?.({
            ...(initial?.id ? { id: initial.id } : {}),
            type,
            description: String(description).trim(),
            amount: cleanAmount,
            category, // ✅ key della categoria
            schedule: { freq: "monthly", day: clampDay(day) },
            notify: {
                enabled: !!notifyEnabled,
                time: String(notifyTime).slice(0, 5),
                daysBefore: Math.min(7, Math.max(0, Number(daysBefore) || 0)),
            },
            active: initial?.active !== false,
        })
    }

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
                    className="w-full rounded-xl border px-3 py-2 bg-[rgb(var(--card))] border-[rgb(var(--border))]"
                    placeholder="Es. Netflix"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className={soft + " p-3 space-y-2"}>
                    <label className={`text-xs ${muted}`}>Importo</label>
                    <input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        inputMode="decimal"
                        className="w-full rounded-xl border px-3 py-2 bg-[rgb(var(--card))] border-[rgb(var(--border))]"
                        placeholder="7,00"
                    />
                </div>

                {/* ✅ select categorie (key/label) */}
                <div className={soft + " p-3 space-y-2"}>
                    <label className={`text-xs ${muted}`}>Categoria</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-xl border px-3 py-2 bg-[rgb(var(--card))] border-[rgb(var(--border))]"
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
                        className="w-20 rounded-xl border px-3 py-2 bg-[rgb(var(--card))] border-[rgb(var(--border))]"
                    />
                </div>
            </div>

            <div className={soft + " p-3 space-y-3"}>
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold">Notifica</p>
                        <p className={`text-xs ${muted}`}>Ti avvisa e apre la modale precompilata.</p>
                    </div>
                    <input type="checkbox" checked={notifyEnabled} onChange={(e) => setNotifyEnabled(e.target.checked)} className="h-5 w-5" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={`text-xs ${muted}`}>Ora</label>
                        <input
                            type="time"
                            value={notifyTime}
                            onChange={(e) => setNotifyTime(e.target.value)}
                            className="mt-2 w-full rounded-xl border px-3 py-2 bg-[rgb(var(--card))] border-[rgb(var(--border))]"
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
                            className="mt-2 w-full rounded-xl border px-3 py-2 bg-[rgb(var(--card))] border-[rgb(var(--border))]"
                            disabled={!notifyEnabled}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={onCancel} type="button">
                    Annulla
                </Button>
                <Button onClick={submit} type="button">
                    Salva
                </Button>
            </div>
        </div>
    )
}

export default function Recurring({ onBack }) {
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

    // premium flow
    const [upsellOpen, setUpsellOpen] = useState(false)
    const [hubOpen, setHubOpen] = useState(false)
    const [billingNotReadyOpen, setBillingNotReadyOpen] = useState(false)

    const surface = "rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const soft = "rounded-2xl border bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"
    const muted = "text-[rgb(var(--muted-fg))]"

    const header = (
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

                <div className="min-w-0 flex-1">
                    <h1 className="text-base font-extrabold tracking-tight">Ricorrenti</h1>
                    <p className={`text-xs ${muted} truncate`}>
                        {isPremium ? "Abbonamenti ed entrate fisse, tutto ordinato." : "Premium: ricorrenti + avvisi di scalo."}
                    </p>
                </div>

                {isPremium && (
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
                )}
            </div>
        </div>
    )

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
            <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
                {header}
                <main className="mx-auto max-w-3xl px-3 py-6 space-y-4">
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
        <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
            {header}

            <main className="mx-auto max-w-3xl px-3 py-6 space-y-4">
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

                    <p className={`text-xs ${muted}`}>Notifiche ricorrenti attive</p>
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
        </div>
    )
}
