import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Check, Sparkles, Wallet, PieChart, Lock, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

const USER_KEY = "howamipoor:user:v1"
const ONBOARDING_KEY = "howamipoor:onboardingDone:v1"

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

function markOnboardingDone() {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ done: true, ts: Date.now() }))
}

export default function Onboarding({ onFinish, mode = "firstRun" }) {
    const [step, setStep] = useState(0)
    const [name, setName] = useState(readUserName())

    useEffect(() => {
        writeUserName(name)
    }, [name])

    // ✅ 5 pagine: meno, più chiare, sarcastiche
    const pages = useMemo(() => {
        return [
            {
                key: "why",
                title: "HAIP: a cosa serve",
                subtitle: "A sapere dove finiscono i soldi. Triste ma utile.",
                icon: Sparkles,
                body:
                    "Registri entrate/uscite.\n" +
                    "HAIP ti mostra la verità.\n" +
                    "Tu fai finta di niente (finché puoi).",
                bullets: ["Local-first (tutto sul tuo device)", "Panoramica chiara", "Zero scuse"],
            },
            {
                key: "name",
                title: "Come ti chiami?",
                subtitle: "Così posso giudicarti con rispetto 😈",
                icon: Wallet,
                body:
                    "Userò il tuo nome in messaggi e notifiche.\n" +
                    "Puoi lasciarlo vuoto, ma poi non piangere.",
                input: true,
            },
            {
                key: "how",
                title: "Come si usa",
                subtitle: "Due tap e via.",
                icon: Wallet,
                body:
                    "Aggiungi movimenti da Entrate/Uscite o col +.\n" +
                    "In Home vedi gli ultimi 5: niente lista infinita.",
                bullets: ["Aggiungi / modifica", "Undo eliminazione", "Home = pulita"],
            },
            {
                key: "insights",
                title: "Grafici & categorie",
                subtitle: "Capisci dove bruci tutto.",
                icon: PieChart,
                body:
                    "Grafico e categorie ti dicono dove vanno i soldi.\n" +
                    "FREE: ultimi 30 giorni.\n" +
                    "Se vuoi “Tutto”… ci arriviamo.",
                bullets: ["Grafico spese", "Breakdown categorie", "30 giorni in FREE"],
            },
            {
                key: "premium",
                title: "Premium",
                subtitle: "Memoria, ricerca, zero ads.",
                icon: Lock,
                body:
                    "FREE: oltre 30 giorni = blur.\n" +
                    "Premium: storico completo + ricerca vera + niente pubblicità.\n" +
                    "E sì, ti mando pure promemoria se sparisci.",
                bullets: ["Storico completo", "Ricerca completa", "Notifiche utili"],
                footerNote: true,
            },
        ]
    }, [])

    const total = pages.length
    const current = pages[step]
    const Icon = current.icon

    const canNext = step < total - 1
    const canPrev = step > 0

    const next = () => setStep((s) => Math.min(s + 1, total - 1))
    const prev = () => setStep((s) => Math.max(s - 1, 0))

    const finish = () => {
        markOnboardingDone()
        onFinish?.()
    }

    // ✅ Swipe robusto (funziona anche con scroll)
    const startRef = useRef({ x: 0, y: 0, t: 0 })
    const onTouchStart = (e) => {
        const touch = e.touches?.[0]
        if (!touch) return
        startRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now() }
    }
    const onTouchEnd = (e) => {
        const touch = e.changedTouches?.[0]
        if (!touch) return

        const dx = touch.clientX - startRef.current.x
        const dy = touch.clientY - startRef.current.y
        const dt = Date.now() - startRef.current.t

        if (dt > 700) return
        const absX = Math.abs(dx)
        const absY = Math.abs(dy)
        if (absY > absX) return

        const threshold = 70
        if (dx < -threshold && canNext) next()
        if (dx > threshold && canPrev) prev()
    }

    // styles
    const muted = "text-[rgb(var(--muted-fg))]"
    const surface = "bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const soft = "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"

    return (
        <div className="min-h-screen w-full bg-[rgb(var(--bg))] text-[rgb(var(--fg))] overflow-hidden flex flex-col">
            <div className="pt-[env(safe-area-inset-top)]" />

            {/* HEADER */}
            <div className={`border-b ${surface}`}>
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <p className={`text-xs ${muted}`}>
                        {step + 1}/{total}
                    </p>

                    <button onClick={finish} className={`text-xs underline ${muted} hover:opacity-80`} title="Salta">
                        Salta
                    </button>
                </div>

                <div className="px-4 pb-3">
                    <div className={`h-2 rounded-full overflow-hidden border ${soft}`}>
                        <div className="h-full bg-slate-900" style={{ width: `${((step + 1) / total) * 100}%` }} />
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 min-h-0" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current.key}
                        className="h-full w-full"
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ duration: 0.22 }}
                    >
                        <div className="h-full overflow-y-auto px-4 py-6">
                            <div className="mx-auto max-w-md">
                                <div className="flex items-start gap-4">
                                    <div className={`h-12 w-12 rounded-2xl border ${soft} flex items-center justify-center shrink-0`}>
                                        <Icon className="h-6 w-6" />
                                    </div>

                                    <div className="min-w-0">
                                        <h1 className="text-xl font-extrabold tracking-tight leading-tight">{current.title}</h1>
                                        <p className={`mt-1 text-sm ${muted}`}>{current.subtitle}</p>
                                    </div>
                                </div>

                                <p className="mt-5 whitespace-pre-line text-sm leading-relaxed">{current.body}</p>

                                {current.bullets?.length > 0 && (
                                    <ul className={`mt-4 space-y-2 text-sm ${muted} list-disc pl-5`}>
                                        {current.bullets.map((b) => (
                                            <li key={b}>{b}</li>
                                        ))}
                                    </ul>
                                )}

                                {current.input && (
                                    <div className="mt-6">
                                        <label className={`text-xs ${muted}`}>Nome</label>
                                        <input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Es. Jhon"
                                            className={[
                                                "mt-2 w-full rounded-2xl border px-3 py-2 text-sm outline-none shadow-sm",
                                                `${soft} text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]`,
                                            ].join(" ")}
                                        />
                                        <p className={`mt-2 text-xs ${muted}`}>Se lo lasci vuoto, userò un giudizio generico.</p>
                                    </div>
                                )}

                                {current.footerNote && (
                                    <div className={`mt-6 rounded-2xl border p-3 ${soft}`}>
                                        <div className="flex items-start gap-2">
                                            <Bell className="h-4 w-4 mt-0.5" />
                                            <p className={`text-xs ${muted}`}>
                                                Tip: se le notifiche non arrivano su Android, in Impostazioni trovi il bottone “Apri impostazioni app”
                                                e due righe per batteria/permessi.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <p className={`mt-6 text-center text-xs ${muted}`}>
                                    Swipe a sinistra/destra (orizzontale).
                                </p>

                                <div className="h-10" />
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* FOOTER */}
            <div className={`border-t ${surface}`}>
                <div className="px-4 py-4 flex items-center justify-between gap-2">
                    <Button variant="outline" onClick={prev} disabled={!canPrev} className="rounded-2xl">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Indietro
                    </Button>

                    {canNext ? (
                        <Button onClick={next} className="rounded-2xl">
                            Avanti
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={finish} className="rounded-2xl">
                            Fine
                            <Check className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </div>

                <div className="pb-[env(safe-area-inset-bottom)]" />
            </div>
        </div>
    )
}
