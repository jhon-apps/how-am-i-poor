import { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle } from "lucide-react"

export default function ConfirmDeleteDialog({
                                                open = false,
                                                title = "Conferma eliminazione",
                                                message = "Vuoi eliminare questo movimento? L’azione è reversibile solo subito.",
                                                confirmText = "Elimina",
                                                cancelText = "Annulla",
                                                onConfirm,
                                                onCancel,
                                            }) {
    // Scroll lock (come le altre modali)
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

    // ESC chiude
    useEffect(() => {
        if (!open) return
        const onKey = (e) => {
            if (e.key === "Escape") onCancel?.()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [open, onCancel])

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="fixed inset-0 z-[90]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="absolute inset-0 bg-black/60" onClick={onCancel} />

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
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card-2))] flex items-center justify-center">
                                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-base font-extrabold tracking-tight">{title}</p>
                                        <p className="mt-1 text-sm text-[rgb(var(--muted-fg))]">{message}</p>
                                    </div>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={onCancel}
                                        className="
                      h-12 rounded-2xl
                      border border-[rgb(var(--border))]
                      bg-[rgb(var(--card))]
                      hover:bg-[rgb(var(--card-2))]
                      text-sm font-extrabold
                    "
                                    >
                                        {cancelText}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={onConfirm}
                                        className="
                      h-12 rounded-2xl
                      border border-red-500/40
                      bg-red-500/20
                      hover:bg-red-500/25
                      text-sm font-extrabold
                      text-red-200
                    "
                                    >
                                        {confirmText}
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
