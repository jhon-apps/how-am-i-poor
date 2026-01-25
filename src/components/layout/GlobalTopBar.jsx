import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X, Moon, Sun } from "lucide-react"
import useTheme from "@/hooks/useTheme"

function MenuItem({ label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left px-4 py-3 rounded-2xl hover:bg-[rgb(var(--card-2))] active:scale-[0.99]"
        >
            <span className="text-sm font-semibold">{label}</span>
        </button>
    )
}

/**
 * FIX: top bar fixed + spacer
 * - sticky può rompersi se un parent ha overflow/transform
 * - fixed non si rompe mai e rende la nav coerente su tutte le pagine
 */
export default function GlobalTopBar({ page = "Home", onPremium }) {
    const [menuOpen, setMenuOpen] = useState(false)
    const { theme, toggleTheme } = useTheme()
    const ThemeIcon = theme === "dark" ? Moon : Sun

    const go = (hash) => {
        window.location.hash = hash
        setMenuOpen(false)
    }

    const handlePremium = () => {
        if (typeof onPremium === "function") return onPremium()
        window.location.hash = "#/premium"
    }

    // Altezza “pratica” della barra (paddingTop + contenuto)
    // paddingTop: max(safe-area, 24px)
    // body: circa 64px (py-4 + 2 righe testo)
    const spacerStyle = { height: "calc(max(env(safe-area-inset-top), 24px) + 64px)" }

    return (
        <>
            {/* Spacer: evita che il contenuto finisca sotto la top bar */}
            <div aria-hidden="true" style={spacerStyle} />

            {/* Drawer */}
            <AnimatePresence>
                {menuOpen ? (
                    <motion.div
                        className="fixed inset-0 z-[60]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />

                        <motion.div
                            className="absolute left-0 top-0 h-full w-[82%] max-w-sm bg-[rgb(var(--bg))] border-r border-[rgb(var(--border))] shadow-2xl"
                            initial={{ x: -24, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -24, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        >
                            <div style={{ paddingTop: "max(env(safe-area-inset-top), 24px)" }} />

                            <div className="flex items-center justify-between px-4 py-4">
                                <div>
                                    <p className="text-xs text-[rgb(var(--muted-fg))]">HAIP</p>
                                    <p className="text-base font-extrabold tracking-tight">Menu</p>
                                </div>

                                <button
                                    type="button"
                                    className="h-10 w-10 rounded-2xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] flex items-center justify-center hover:bg-[rgb(var(--card-2))]"
                                    onClick={() => setMenuOpen(false)}
                                    title="Chiudi"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <nav className="px-2 space-y-1">
                                <MenuItem label="Premium" onClick={() => go("#/premium")} />
                                <MenuItem label="Home" onClick={() => go("#/")} />
                                <MenuItem label="Grafici e movimenti" onClick={() => go("#/insights")} />
                                <MenuItem label="Ricorrenti" onClick={() => go("#/recurring")} />
                                <MenuItem label="Profilo" onClick={() => go("#/profile")} />
                                <MenuItem label="Notifiche" onClick={() => go("#/notifications")} />
                                <MenuItem label="Tutorial" onClick={() => go("#/tutorial")} />
                                <MenuItem label="About" onClick={() => go("#/about")} />
                            </nav>

                            <div className="pb-[env(safe-area-inset-bottom)]" />
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Top bar (FIXED) */}
            <header
                className="fixed top-0 left-0 right-0 z-[50] bg-[rgb(var(--bg))]/80 backdrop-blur-xl"
                style={{ paddingTop: "max(env(safe-area-inset-top), 24px)" }}
            >
                <div className="px-4 py-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-lg font-extrabold tracking-tight">HAIP</h1>
                        <p className="text-xs text-[rgb(var(--muted-fg))]">{page}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            className="
                h-10 px-3 rounded-2xl border
                bg-[rgb(var(--card))]
                border-[rgba(234,179,8,0.55)]
                text-sm font-extrabold
                text-amber-400
                hover:bg-[rgb(var(--card-2))]
              "
                            onClick={handlePremium}
                            title="Premium"
                        >
                            Premium
                        </button>

                        <button
                            type="button"
                            className="h-10 w-10 rounded-2xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] flex items-center justify-center hover:bg-[rgb(var(--card-2))]"
                            onClick={toggleTheme}
                            title="Tema"
                        >
                            <ThemeIcon className="h-4 w-4" />
                        </button>

                        <button
                            type="button"
                            className="h-10 w-10 rounded-2xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] flex items-center justify-center hover:bg-[rgb(var(--card-2))]"
                            onClick={() => setMenuOpen(true)}
                            title="Menu"
                        >
                            <Menu className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </header>
        </>
    )
}
