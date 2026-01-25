import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X, Moon, Sun } from "lucide-react"
import useTheme from "@/hooks/useTheme"
import { APP_CONFIG } from "@/config/config"

const PREMIUM_EVENT = "haip:openPremium"

function getActiveRouteKey() {
    const h = String(window.location.hash || "#/").trim()
    if (h === "#/" || h === "#" || h === "") return "home"
    if (h.startsWith("#/insights")) return "insights"
    if (h.startsWith("#/recurring")) return "recurring"
    if (h.startsWith("#/profile")) return "profile"
    if (h.startsWith("#/notifications")) return "notifications"
    if (h.startsWith("#/tutorial")) return "tutorial"
    if (h.startsWith("#/about")) return "about"
    if (h.startsWith("#/dev")) return "dev"
    if (h.startsWith("#/premium")) return "premium"
    return "home"
}

function MenuItem({ label, onClick, active = false }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                "w-full text-left px-4 py-3 rounded-2xl transition",
                active
                    ? "bg-[rgb(var(--card-2))] border border-[rgb(var(--border))]"
                    : "hover:bg-[rgb(var(--card-2))]",
                "active:scale-[0.99]",
            ].join(" ")}
        >
            <span className={["text-sm", active ? "font-extrabold" : "font-semibold"].join(" ")}>{label}</span>
        </button>
    )
}

export default function GlobalTopBar({ page = "Home", onPremium }) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [activeKey, setActiveKey] = useState(getActiveRouteKey())

    const { theme, toggleTheme } = useTheme()
    const ThemeIcon = theme === "dark" ? Moon : Sun

    useEffect(() => {
        const onHash = () => setActiveKey(getActiveRouteKey())
        window.addEventListener("hashchange", onHash)
        return () => window.removeEventListener("hashchange", onHash)
    }, [])

    const go = (hash) => {
        window.location.hash = hash
        setMenuOpen(false)
    }

    const handlePremium = () => {
        if (typeof onPremium === "function") return onPremium()
        window.dispatchEvent(new CustomEvent(PREMIUM_EVENT, { detail: { reason: "premium" } }))
    }

    // Spacer per topbar fixed
    const spacerStyle = { height: "calc(max(env(safe-area-inset-top), 24px) + 64px)" }

    // Stili sezione
    const sectionWrap =
        "rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]/70 backdrop-blur-xl p-2"
    const sectionTitle =
        "px-3 pt-2 pb-1 text-[11px] font-extrabold tracking-tight text-[rgb(var(--muted-fg))] uppercase"
    const sectionBody = "space-y-1"

    const showDev = useMemo(() => Boolean(APP_CONFIG.DEV_TOOLS_ENABLED), [])

    return (
        <>
            {/* Glow animation (3s) */}
            <style>{`
@keyframes haipPremiumGlow {
  0%, 72% { box-shadow: 0 0 0 rgba(0,0,0,0); transform: translateZ(0); }
  78% { box-shadow: 0 0 0 rgba(0,0,0,0); }
  84% {
    box-shadow:
      0 0 0 1px rgba(234,179,8,0.55),
      0 0 22px rgba(234,179,8,0.35),
      0 0 44px rgba(234,179,8,0.18);
  }
  92% {
    box-shadow:
      0 0 0 1px rgba(234,179,8,0.35),
      0 0 14px rgba(234,179,8,0.22),
      0 0 28px rgba(234,179,8,0.10);
  }
  100% { box-shadow: 0 0 0 rgba(0,0,0,0); }
}
.haip-premium-glow { animation: haipPremiumGlow 3s ease-in-out infinite; will-change: box-shadow; }
`}</style>

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

                        {/* Drawer panel: più chiaro */}
                        <motion.div
                            className="
                absolute left-0 top-0 h-full w-[86%] max-w-sm
                border-r border-[rgb(var(--border))]
                shadow-2xl
                bg-[rgb(var(--bg))]/70
                backdrop-blur-2xl
              "
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

                            <div className="px-3 space-y-3">
                                {/* Sezione Premium */}
                                <div className={sectionWrap}>
                                    <div className={sectionTitle}>Premium</div>
                                    <div className={sectionBody}>
                                        <button
                                            type="button"
                                            className={[
                                                "haip-premium-glow w-full text-left px-4 py-3 rounded-2xl border",
                                                "bg-[rgb(var(--card))] border-[rgba(234,179,8,0.55)]",
                                                "text-sm font-extrabold text-amber-400 hover:bg-[rgb(var(--card-2))] active:scale-[0.99]",
                                                activeKey === "premium" ? "ring-1 ring-amber-400/40" : "",
                                            ].join(" ")}
                                            onClick={() => {
                                                setMenuOpen(false)
                                                handlePremium()
                                            }}
                                        >
                                            Premium
                                        </button>
                                    </div>
                                </div>

                                {/* Sezione Navigazione */}
                                <div className={sectionWrap}>
                                    <div className={sectionTitle}>Navigazione</div>
                                    <div className={sectionBody}>
                                        <MenuItem label="Home" active={activeKey === "home"} onClick={() => go("#/")} />
                                        <MenuItem
                                            label="Grafici e movimenti"
                                            active={activeKey === "insights"}
                                            onClick={() => go("#/insights")}
                                        />
                                        <MenuItem
                                            label="Ricorrenti"
                                            active={activeKey === "recurring"}
                                            onClick={() => go("#/recurring")}
                                        />
                                    </div>
                                </div>

                                {/* Sezione Impostazioni */}
                                <div className={sectionWrap}>
                                    <div className={sectionTitle}>Impostazioni</div>
                                    <div className={sectionBody}>
                                        <MenuItem label="Profilo" active={activeKey === "profile"} onClick={() => go("#/profile")} />
                                        <MenuItem
                                            label="Notifiche"
                                            active={activeKey === "notifications"}
                                            onClick={() => go("#/notifications")}
                                        />
                                        <MenuItem label="About" active={activeKey === "about"} onClick={() => go("#/about")} />
                                        <MenuItem label="Tutorial" active={activeKey === "tutorial"} onClick={() => go("#/tutorial")} />
                                    </div>
                                </div>

                                {/* Sezione Dev (solo dev) */}
                                {showDev ? (
                                    <div className={sectionWrap}>
                                        <div className={sectionTitle}>Dev</div>
                                        <div className={sectionBody}>
                                            <MenuItem label="Dev Tools" active={activeKey === "dev"} onClick={() => go("#/dev")} />
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <div className="pb-[env(safe-area-inset-bottom)]" />
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Top bar fixed */}
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
                haip-premium-glow
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
