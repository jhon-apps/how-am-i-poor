import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Bell, Check, Lock, PieChart, Sparkles, Wallet } from "lucide-react"
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

    const pages = useMemo(() => {
        const nome = String(name || "").trim()
        const chiamata = nome ? nome : "campione"

        return [
            {
                key: "why",
                title: "HAIP: a cosa serve",
                subtitle: "A capire dove spariscono i soldi. Spoiler: non è magia.",
                icon: Sparkles,
                body: `Segni entrate e uscite.
HAIP ti mostra la verità.

E tu puoi continuare a fare finta di niente… finché il conto regge.`,
                bullets: ["Tutto resta sul telefono", "Panoramica pulita", "Zero scuse, zero autoinganni"],
            },
            {
                key: "name",
                title: "Come ti chiami?",
                subtitle: "Così posso giudicarti con educazione 😈",
                icon: Wallet,
                body: `Userò il tuo nome nei messaggi e nelle notifiche.
Puoi lasciarlo vuoto, ma poi non lamentarti se ti chiamo "campione".`,
                input: true,
            },
            {
                key: "how",
                title: "Come si usa",
                subtitle: "Pochi tocchi. Il resto è autocontrollo (auguri).",
                icon: Wallet,
                body: `Aggiungi un movimento da Entrate/Uscite o col tasto +.
Nella schermata iniziale vedi solo gli ultimi 5: ordine, non caos.`,
                bullets: [
                    "Aggiungi / modifica",
                    "Annulla eliminazione (per 5 secondi)",
                    "Schermata iniziale = essenziale",
                ],
            },
            {
                key: "insights",
                title: "Categorie e grafico",
                subtitle: "Capisci dove bruci tutto… con prove.",
                icon: PieChart,
                body: `Grafico e categorie ti dicono dove vanno i soldi.
Nella versione gratuita ti mostro gli ultimi 30 giorni.

Se vuoi guardare tutto lo storico (e farti male davvero)… ci arriviamo tra poco.`,
                bullets: ["Riepilogo spese", "Dettaglio per categoria", "Ultimi 30 giorni nella versione gratuita"],
            },
            {
                key: "premium",
                title: "Premium: cosa cambia davvero",
                subtitle: "Qui finisce la beneficenza.",
                icon: Lock,
                body: `Versione gratuita:
• Oltre 30 giorni lo storico è sfocato (sì, apposta).
• La ricerca completa dei movimenti è bloccata.
• Il grafico resta sui 30 giorni.

Versione Premium:
• Storico completo.
• Ricerca completa.
• Grafico anche su "Tutto".
• Ricorrenti: abbonamenti ed entrate fisse con promemoria.

Traduzione: ${chiamata}, con Premium non hai più scuse. Solo numeri.`,
                bullets: [
                    "Storico completo",
                    "Ricerca completa",
                    "Ricorrenti (abbonamenti/entrate fisse)",
                    "Grafico su tutto",
                ],
                footerNote: true,
            },
        ]
    }, [name])

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

    // Scorrimento laterale robusto: ignora lo scorrimento verticale
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

    const muted = "text-[rgb(var(--muted-fg))]"
    const surface = "bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const soft = "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"

    return (
        <div
            className={[
                "min-h-screen w-full overflow-hidden flex flex-col",
                "bg-[rgb(var(--bg))] text-[rgb(var(--fg))]",
                "pt-[env(safe-area-inset-top)]",
                "pb-[env(safe-area-inset-bottom)]",
                "pl-[env(safe-area-inset-left)]",
                "pr-[env(safe-area-inset-right)]",
            ].join(" ")}
        >
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
                        {/* scroll interno */}
                        <div className="h-full overflow-y-auto px-4 py-6">
                            <div className="mx-auto max-w-md">
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`h-12 w-12 rounded-2xl border ${soft} flex items-center justify-center shrink-0`}
                                    >
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
                                        <p className={`mt-2 text-xs ${muted}`}>
                                            Se lo lasci vuoto, userò un giudizio generico.
                                        </p>
                                    </div>
                                )}

                                {current.footerNote && (
                                    <div className={`mt-6 rounded-2xl border p-3 ${soft}`}>
                                        <div className="flex items-start gap-2">
                                            <Bell className="h-4 w-4 mt-0.5" />
                                            <p className={`text-xs ${muted}`}>
                                                Consiglio: se su Android le notifiche fanno le difficili, in Impostazioni trovi guida e pulsante
                                                per i permessi.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <p className={`mt-6 text-center text-xs ${muted}`}>Scorri a sinistra/destra (in orizzontale).</p>

                                <div className="h-8" />
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
            </div>
        </div>
    )
}
