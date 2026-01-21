import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Sparkles,
    Wallet,
    Search,
    Bell,
    Lock,
    Settings as SettingsIcon,
    ListChecks,
    PieChart,
} from "lucide-react"
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
        return [
            {
                key: "welcome",
                title: "Benvenuto in HAIP",
                subtitle: "HOW AM I POOR, ma con dati veri.",
                icon: Sparkles,
                body:
                    "App local-first: resta tutto sul tuo dispositivo.\n" +
                    "Entrate, uscite, grafici e un pizzico di giudizio (pulito).",
            },
            {
                key: "name",
                title: "Come ti chiami?",
                subtitle: "Così posso essere personale 😈",
                icon: Wallet,
                body:
                    "Userò il tuo nome in messaggi e notifiche.\n" +
                    "Puoi lasciarlo vuoto, ma perderai parte del divertimento.",
                input: true,
            },
            {
                key: "add",
                title: "Aggiungi movimenti velocemente",
                subtitle: "Entrate / Uscite + pulsante +",
                icon: Wallet,
                body:
                    "Registra un movimento in pochi secondi.\n" +
                    "L’app prova anche a suggerire la categoria automaticamente.",
                bullets: ["Entrata / Uscita", "Categoria suggerita", "Modifica e eliminazione"],
            },
            {
                key: "home",
                title: "Home = panoramica pulita",
                subtitle: "Non una lista infinita",
                icon: ListChecks,
                body:
                    "In Home vedi sempre e solo gli ultimi 5 movimenti.\n" +
                    "Per l’elenco completo usi “Vedi tutti”.",
                bullets: ["Saldo, entrate/uscite", "Stato mese corrente", "Ultimi 5 movimenti"],
            },
            {
                key: "charts",
                title: "Grafici e categorie",
                subtitle: "Capisci dove vanno i soldi",
                icon: PieChart,
                body:
                    "Grafico e breakdown categorie (di default sugli ultimi 30 giorni).\n" +
                    "Così hai una vista chiara senza troppo rumore.",
                bullets: ["Grafico spese", "Breakdown categorie", "Range 30 giorni (FREE)"],
            },
            {
                key: "all",
                title: "Elenco completo + filtro giorno",
                subtitle: "Trovi tutto senza distruggere la Home",
                icon: Search,
                body:
                    "“Vedi tutti” apre l’elenco completo.\n" +
                    "Puoi filtrare per giorno (calendario).",
                bullets: ["Lista completa", "Filtro per giorno", "Esperienza fluida anche con tanti record"],
            },
            {
                key: "freeLimit",
                title: "Storico oltre 30 giorni",
                subtitle: "FREE = blur, Premium = sblocco",
                icon: Lock,
                body:
                    "Se non sei Premium, i movimenti oltre 30 giorni vengono sfocati.\n" +
                    "È la linea di confine principale.",
                bullets: ["≤ 30 giorni: visibili", "> 30 giorni: blur + blocco", "Iscriviti per sbloccare"],
            },
            {
                key: "premium",
                title: "Cosa sblocca Premium",
                subtitle: "Memoria + ricerca + zero ads",
                icon: Lock,
                body:
                    "Premium sblocca davvero ciò che serve:\n" +
                    "- storico completo (niente blur)\n" +
                    "- ricerca completa\n" +
                    "- niente pubblicità\n\n" +
                    "Premium si attiverà tramite Google Play Billing quando sarà pronto.",
                bullets: ["Storico completo", "Ricerca completa", "No ads"],
            },
            {
                key: "notifications",
                title: "Notifiche utili",
                subtitle: "Reminder + inattività",
                icon: Bell,
                body:
                    "Puoi attivare un promemoria giornaliero.\n" +
                    "E una notifica se non usi l’app per 5 giorni.\n\n" +
                    "Se un telefono blocca le notifiche, trovi le istruzioni in Impostazioni.",
                bullets: ["Reminder giornaliero", "Inattività 5 giorni", "Guida permessi/batteria in Settings"],
            },
            {
                key: "settings",
                title: "Impostazioni & tema",
                subtitle: "Tutto al suo posto",
                icon: SettingsIcon,
                body:
                    "In Impostazioni trovi:\n" +
                    "- nome\n" +
                    "- notifiche\n" +
                    "- reset\n" +
                    "- privacy\n\n" +
                    "E in Home puoi cambiare tema con un tap.",
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

    // swipe gesture
    const swipeThreshold = 80
    const handleDragEnd = (_, info) => {
        if (info.offset.x < -swipeThreshold && canNext) next()
        if (info.offset.x > swipeThreshold && canPrev) prev()
    }

    // styles
    const muted = "text-[rgb(var(--muted-fg))]"
    const surface = "bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const soft = "bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"

    return (
        <div className="min-h-screen w-full bg-[rgb(var(--bg))] text-[rgb(var(--fg))] overflow-hidden flex flex-col">
            {/* safe area top */}
            <div className="pt-[env(safe-area-inset-top)]" />

            {/* HEADER FULL WIDTH */}
            <div className={`border-b ${surface}`}>
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <p className={`text-xs ${muted}`}>
                        {step + 1}/{total}
                    </p>

                    <button
                        onClick={finish}
                        className={`text-xs underline ${muted} hover:opacity-80`}
                        title="Salta"
                    >
                        Salta
                    </button>
                </div>

                {/* progress */}
                <div className="px-4 pb-3">
                    <div className={`h-2 rounded-full overflow-hidden border ${soft}`}>
                        <div
                            className="h-full bg-slate-900"
                            style={{ width: `${((step + 1) / total) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* CONTENT FULL SCREEN */}
            <div className="flex-1 min-h-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current.key}
                        className="h-full w-full"
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ duration: 0.22 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.08}
                        onDragEnd={handleDragEnd}
                    >
                        {/* scroll interno solo per contenuti lunghi */}
                        <div className="h-full overflow-y-auto px-4 py-6">
                            <div className="mx-auto max-w-md">
                                <div className="flex items-start gap-4">
                                    <div className={`h-12 w-12 rounded-2xl border ${soft} flex items-center justify-center shrink-0`}>
                                        <Icon className="h-6 w-6" />
                                    </div>

                                    <div className="min-w-0">
                                        <h1 className="text-xl font-extrabold tracking-tight leading-tight">
                                            {current.title}
                                        </h1>
                                        <p className={`mt-1 text-sm ${muted}`}>{current.subtitle}</p>
                                    </div>
                                </div>

                                <p className="mt-5 whitespace-pre-line text-sm leading-relaxed">
                                    {current.body}
                                </p>

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

                                <p className={`mt-6 text-center text-xs ${muted}`}>
                                    Swipe a sinistra/destra per navigare.
                                </p>

                                <div className="h-10" />
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* FOOTER FULL WIDTH */}
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
