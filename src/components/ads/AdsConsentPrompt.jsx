import { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Megaphone, X } from "lucide-react"

export default function AdsConsentPrompt({
                                             open = false,
                                             onAccept,
                                             onReject,
                                             onClose,
                                         }) {
    // scroll lock
    useEffect(() => {
        if (!open) return

        const body = document.body
        const html = document.documentElement

        const prevBodyOverflow = body.style.overflow
        const prevBodyPosition = body.style.position
        const prevBodyTop = body.style.top
        const prevBodyWidth = body.style.width
        const prevHtmlOverscroll = html.style.overscrollBehaviorY

        const scrollY = window.scrollY || 0

        body.style.overflow = "hidden"
        body.style.position = "fixed"
        body.style.top = `-${scrollY}px`
        body.style.width = "100%"
        html.style.overscrollBehaviorY = "none"

        return () => {
            body.style.overflow = prevBodyOverflow
            body.style.position = prevBodyPosition
            body.style.top = prevBodyTop
            body.style.width = prevBodyWidth
            html.style.overscrollBehaviorY = prevHtmlOverscroll

            const y = Math.abs(parseInt(body.style.top || "0", 10)) || scrollY
            window.scrollTo(0, y)
        }
    }, [open])

    const muted = "text-[rgb(var(--muted-fg))]"

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="fixed inset-0 z-[90]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="absolute inset-0 bg-black/60" onClick={onClose} />

                    <div className="absolute inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4">
                        <motion.div
                            className="
                w-full sm:max-w-md
                rounded-t-3xl sm:rounded-3xl
                border border-[rgb(var(--border))]
                bg-[rgb(var(--bg))]/92
                backdrop-blur-2xl
                shadow-2xl
                overflow-hidden
              "
                            initial={{ y: 18, opacity: 0, scale: 0.98 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 18, opacity: 0, scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 420, damping: 34 }}
                            onClick={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                        >
                            <div className="pt-[env(safe-area-inset-top)]" />

                            <div className="px-5 py-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="h-10 w-10 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card-2))] flex items-center justify-center">
                                            <Megaphone className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-base font-extrabold tracking-tight">Pubblicità</p>
                                            <p className={`mt-1 text-sm ${muted}`}>
                                                Scegli come vuoi vedere le ads.
                                                Premium = zero pubblicità.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="h-10 w-10 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:bg-[rgb(var(--card-2))] flex items-center justify-center"
                                        onClick={onClose}
                                        title="Chiudi"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card-2))] px-4 py-3">
                                    <p className={`text-xs ${muted}`}>
                                        Se rifiuti, vedrai <b>pubblicità non personalizzata</b>.
                                        Se accetti, può essere personalizzata.
                                    </p>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={onReject}
                                        className="
                      h-12 rounded-2xl
                      border border-[rgb(var(--border))]
                      bg-[rgb(var(--card))]
                      hover:bg-[rgb(var(--card-2))]
                      text-sm font-extrabold
                    "
                                    >
                                        Rifiuta
                                    </button>

                                    <button
                                        type="button"
                                        onClick={onAccept}
                                        className="
                      h-12 rounded-2xl
                      border border-[rgb(var(--fg))]
                      bg-[rgb(var(--fg))]
                      text-[rgb(var(--bg))]
                      text-sm font-extrabold
                    "
                                    >
                                        Accetta
                                    </button>
                                </div>
                            </div>

                            <div className="pb-[env(safe-area-inset-bottom)]" />
                        </motion.div>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}
