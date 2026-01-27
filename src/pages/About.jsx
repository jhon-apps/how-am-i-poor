import { useEffect, useState } from "react"
import { ExternalLink, Shield, ScrollText, Megaphone } from "lucide-react"

import GlobalTopBar from "@/components/layout/GlobalTopBar"

import PremiumUpsellDialog from "@/components/ui/PremiumUpsellDialog"
import BillingNotReadyDialog from "@/components/ui/BillingNotReadyDialog"
import PremiumHub from "@/components/premium/PremiumHub"

import useAdsConsent from "@/hooks/useAdsConsent"

const PRIVACY_URL = "https://jhon-apps.github.io/how-am-i-poor/privacy.html"
const GDPR_URL = "https://jhon-apps.github.io/how-am-i-poor/gdpr.html"

const PREMIUM_EVENT = "haip:openPremium"

function LinkCard({ icon: Icon, title, desc, href }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] p-5 hover:bg-[rgb(var(--card-2))]"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-2xl border bg-[rgb(var(--card-2))] border-[rgb(var(--border))] flex items-center justify-center">
                        <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm font-extrabold tracking-tight">{title}</p>
                        <p className="mt-1 text-sm text-[rgb(var(--muted-fg))]">{desc}</p>
                    </div>
                </div>

                <ExternalLink className="h-4 w-4 text-[rgb(var(--muted-fg))] shrink-0" />
            </div>
        </a>
    )
}

export default function About() {
    // premium modal state
    const [premiumUpsellOpen, setPremiumUpsellOpen] = useState(false)
    const [premiumReason, setPremiumReason] = useState("premium")
    const [premiumHubOpen, setPremiumHubOpen] = useState(false)
    const [billingNotReadyOpen, setBillingNotReadyOpen] = useState(false)

    // ads consent
    const { adsConsent, grantConsent, denyConsent } = useAdsConsent()

    // listen premium click
    useEffect(() => {
        const onPremium = (e) => {
            const reason = e?.detail?.reason || "premium"
            setPremiumReason(reason)
            setPremiumUpsellOpen(true)
        }
        window.addEventListener(PREMIUM_EVENT, onPremium)
        return () => window.removeEventListener(PREMIUM_EVENT, onPremium)
    }, [])

    const muted = "text-[rgb(var(--muted-fg))]"
    const surface = "rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))]"
    const soft = "rounded-2xl border bg-[rgb(var(--card-2))] border-[rgb(var(--border))]"

    const consentLabel =
        adsConsent === "granted" ? "Personalizzata" : adsConsent === "denied" ? "Non personalizzata" : "Da scegliere"

    return (
        <div className="min-h-[100dvh] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
            <GlobalTopBar page="About" />

            <main className="px-4 pb-10 pt-3">
                <div className="max-w-2xl mx-auto space-y-4">
                    <div className={surface + " p-5"}>
                        <p className="text-sm font-extrabold tracking-tight">HAIP</p>
                        <p className={`mt-1 text-sm ${muted}`}>
                            App local-first per segnare spese e farti sentire in colpa in modo elegante.
                            Nessun login. Nessun backend. Nessuna pietà.
                        </p>
                    </div>

                    {/* CONSENSO PUBBLICITÀ (solo scelta personalizzazione) */}
                    <div className={surface + " p-5"}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                                <div className={`h-10 w-10 rounded-2xl border ${soft} flex items-center justify-center shrink-0`}>
                                    <Megaphone className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-extrabold tracking-tight">Pubblicità</p>
                                    <p className={`mt-1 text-sm ${muted}`}>
                                        Per utenti FREE la pubblicità è attiva. Qui scegli solo se può essere personalizzata.
                                        Premium = zero pubblicità.
                                    </p>
                                </div>
                            </div>

                            <span className={`shrink-0 text-xs ${muted}`}>
                Stato: <b className="text-[rgb(var(--fg))]">{consentLabel}</b>
              </span>
                        </div>

                        <div className="mt-4 grid gap-3">
                            <div className={`${soft} p-3`}>
                                <p className={`text-xs ${muted}`}>
                                    <b>Accetta</b> = pubblicità personalizzata.<br />
                                    <b>Rifiuta</b> = pubblicità non personalizzata (la pubblicità resta attiva).
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={grantConsent}
                                    className="rounded-2xl border px-4 py-2 text-sm font-extrabold bg-[rgb(var(--card))] border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]"
                                >
                                    Accetta (personalizzata)
                                </button>

                                <button
                                    type="button"
                                    onClick={denyConsent}
                                    className="rounded-2xl border px-4 py-2 text-sm font-extrabold bg-[rgb(var(--card))] border-[rgb(var(--border))] hover:bg-[rgb(var(--card-2))]"
                                >
                                    Rifiuta (non personalizzata)
                                </button>
                            </div>

                            <p className={`text-xs ${muted}`}>
                                Puoi cambiare questa scelta in qualsiasi momento.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-3">
                        <LinkCard
                            icon={ScrollText}
                            title="Privacy Policy"
                            desc="Come gestiamo i dati (spoiler: restano sul tuo device)."
                            href={PRIVACY_URL}
                        />

                        <LinkCard
                            icon={Shield}
                            title="GDPR"
                            desc="Informativa GDPR (diritti, trattamento, pubblicità)."
                            href={GDPR_URL}
                        />
                    </div>

                    <div className={surface + " p-5"}>
                        <p className="text-sm font-extrabold tracking-tight">Contatti</p>
                        <p className={`mt-1 text-sm ${muted}`}>
                            Sito: <span className="font-mono">jhon-apps.github.io</span>
                        </p>
                    </div>
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
