import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"

const USER_KEY = "howamipoor:user:v1"

function safeParse(raw, fallback) {
    try {
        return JSON.parse(raw) ?? fallback
    } catch {
        return fallback
    }
}

function readUser() {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return { name: "" }
    const u = safeParse(raw, { name: "" })
    return { name: typeof u?.name === "string" ? u.name : "" }
}

function writeUser(user) {
    localStorage.setItem(
        USER_KEY,
        JSON.stringify({
            name: user?.name ?? "",
            updatedAt: Date.now(),
        })
    )
}

export default function Profile() {
    const initial = useMemo(() => readUser(), [])
    const [name, setName] = useState(initial.name)
    const [savedAt, setSavedAt] = useState(null)

    useEffect(() => {
        // sync se cambia da altre tab / refresh
        const onStorage = (e) => {
            if (e.key !== USER_KEY) return
            const u = readUser()
            setName(u.name)
        }
        window.addEventListener("storage", onStorage)
        return () => window.removeEventListener("storage", onStorage)
    }, [])

    const trimmed = name.trim()
    const isValid = trimmed.length === 0 || trimmed.length >= 2

    const handleSave = () => {
        if (!isValid) return
        writeUser({ name: trimmed })
        setSavedAt(Date.now())
    }

    const handleClear = () => {
        setName("")
        writeUser({ name: "" })
        setSavedAt(Date.now())
    }

    const muted = "text-[rgb(var(--muted-fg))]"

    return (
        <div className="min-h-[100dvh] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
            <header
                className="sticky top-0 z-20 bg-[rgb(var(--bg))]/80 backdrop-blur-xl"
                style={{ paddingTop: "max(env(safe-area-inset-top), 24px)" }}
            >
                <div className="px-4 py-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-lg font-extrabold tracking-tight">Profilo</h1>
                        <p className={`text-xs ${muted}`}>Dimmi come ti chiami, così posso giudicarti meglio.</p>
                    </div>

                    <Button variant="outline" className="rounded-2xl" onClick={() => (window.location.hash = "#/")}>
                        Home
                    </Button>
                </div>
            </header>

            <main className="px-4 pb-10 pt-3">
                <div className="max-w-2xl mx-auto space-y-4">
                    <div className="rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] p-5">
                        <label className="block">
                            <span className="text-sm font-extrabold tracking-tight">Nome</span>
                            <p className={`mt-1 text-xs ${muted}`}>
                                Usato solo in locale. Nessun account. Nessun server. Nessuna scusa.
                            </p>

                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Es. Jhon"
                                className={[
                                    "mt-3 w-full rounded-2xl border px-4 py-3 text-sm outline-none shadow-sm",
                                    "bg-[rgb(var(--card))] border-[rgb(var(--border))] text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted-fg))]",
                                    !isValid ? "border-red-500/70" : "",
                                ].join(" ")}
                                maxLength={40}
                                inputMode="text"
                                autoComplete="off"
                            />

                            {!isValid ? (
                                <p className="mt-2 text-xs text-red-400">
                                    Se lo metti, almeno 2 caratteri. Non farmi perdere tempo.
                                </p>
                            ) : null}
                        </label>

                        <div className="mt-4 flex items-center gap-2">
                            <Button className="rounded-2xl" onClick={handleSave} disabled={!isValid}>
                                Salva
                            </Button>

                            <Button variant="outline" className="rounded-2xl" onClick={handleClear}>
                                Rimuovi nome
                            </Button>

                            {savedAt ? (
                                <span className={`ml-auto text-xs ${muted}`}>
                                    Salvato
                                </span>
                            ) : (
                                <span className={`ml-auto text-xs ${muted}`}> </span>
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl border bg-[rgb(var(--card))] border-[rgb(var(--border))] p-5">
                        <p className="text-sm font-extrabold tracking-tight">Preview</p>
                        <p className={`mt-2 text-sm ${muted}`}>
                            {trimmed
                                ? `Ok ${trimmed}, vediamo quanto hai sprecato oggi.`
                                : "Ok, senza nome. Rimani anonimo come le tue scelte finanziarie."}
                        </p>
                    </div>
                </div>
            </main>

            <div className="pb-[env(safe-area-inset-bottom)]" />
        </div>
    )
}
