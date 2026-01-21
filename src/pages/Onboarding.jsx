import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Check, Sparkles, Wallet, Search, Bell, Lock } from "lucide-react"
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

export default function Onboarding({ onFinish }) {
    const [step, setStep] = useState(0)
    const [name, setName] = useState(readUserName())

    useEffect(() => {
        // salva in tempo reale, così se l'utente abbandona non perdi
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
                    "App local-first. Zero scuse.\n" +
                    "Ti aiuto a tenere traccia di entrate/uscite e a giudicare con stile.",
            },
            {
                key: "name",
                title: "Come ti chiami?",
                subtitle: "Così posso giudicarti in modo personale 😈",
                icon: Wallet,
                body: "Il nome verrà usato in messaggi e notifiche. Puoi lasciarlo vuoto.",
                input: true,
            },
            {
                key: "add",
                title: "Aggiungi movimenti in 2 tap",
                subtitle: "Entrate / Uscite aprono la stessa modale del +",
                icon: Wallet,
                body:
                    "Aggiungi descrizione, importo e categoria.\n" +
                    "Poi HAIP fa il resto (e ti ricorda quando dimentichi).",
            },
            {
                key: "history",
                title: "Lista completa + filtro giorno",
                subtitle: "Vedi tutti i movimenti senza distruggere la Home",
                icon: Search,
                body:
                    "La Home mostra solo gli ultimi 5.\n" +
                    "“Vedi tutti” apre l’elenco completo con filtro per data.",
            },
            {
                key: "notifications",
                title: "Notifiche utili",
                subtitle: "Reminder giornaliero + inattività (5 giorni)",
                icon: Bell,
                body:
                    "Se vuoi, ti ricordo ogni giorno di aggiornare i movimenti.\n" +
                    "E se sparisci, HAIP se ne accorge.",
            },
            {
                key: "premium",
                title: "Premium (quando vuoi)",
                subtitle: "Ricerca completa + storico oltre 30 giorni + no ads",
                icon: Lock,
                body:
                    "Premium si attiva solo tramite Google Play Billing (quando sarà pronto).\n" +
                    "In dev puoi simulare per test.",
            },
        ]
    }, [])

    const total = pages.length
    const current = pages[step]

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

    const Icon = current.icon

    return (
        <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))] overflow-x-hidden">
            <div className="pt-[env(safe-area-inset-top)]" />

            <div className="mx-auto max-w-md px-4 py-6">
                {/* top */}
                <div className="flex items-center justify-between">
                    <p className="text-xs text-[rgb(var(--muted-fg))]">
                        {step + 1}/{total}
                    </p>

                    <button
                        onClick={finish}
                        className="text-xs underline text-[rgb(var(--muted-fg))] hover:opacity-80"
                        title="Salta"
                    >
                        Salta
                    </button>
                </div>

                {/* card */}
                <div className="mt-4 rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current.key}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.22 }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.08}
                            onDragEnd={handleDragEnd}
                            className="p-6"
                        >
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-2xl border bg-[rgb(var(--card-2))] border-[rgb(var(--border))] flex items-center justify-center shrink-0">
                                    <Icon className="h-6 w-6" />
                                </div>

                                <div className="min-w-0">
                                    <h1 className="text-lg font-extrabold tracking-tight leading-tight">
                                        {current.title}
                                    </h1>
                                    <p className="mt-1 text-sm text-[rgb(var(--muted-fg))]">
                                        {current.subtitle}
                                    </p>
                                </div>
                            </div>

                            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-[rgb(var(--fg))]">
                                {current.body}
                            </p>

                            {current.input && (
                                <div className="mt-5">
                                    <label className="text-xs text-[rgb(var(--muted-fg))]">Nome</label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Es. Jhon"
                                        className={[
                                            "mt-2 w-full rounded-2xl border px-3 py-2 text-sm outline-none shadow-sm",
                                            "bg-[rgb(var(--card-2))] border-[rgb(var(--border))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                                        ].join(" ")}
                                    />
                                    <p className="mt-2 text-xs text-[rgb(var(--muted-fg))]">
                                        Se lo lasci vuoto, userò un giudizio generico.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* progress bar */}
                    <div className="px-6 pb-6">
                        <div className="h-2 rounded-full bg-[rgb(var(--card-2))] border border-[rgb(var(--border))] overflow-hidden">
                            <div
                                className="h-full bg-slate-900"
                                style={{ width: `${((step + 1) / total) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* controls */}
                <div className="mt-5 flex items-center justify-between gap-2">
                    <Button
                        variant="outline"
                        onClick={prev}
                        disabled={!canPrev}
                        className="rounded-2xl"
                    >
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

                <p className="mt-4 text-center text-xs text-[rgb(var(--muted-fg))]">
                    Swipe a sinistra/destra per navigare.
                </p>
            </div>
        </div>
    )
}
