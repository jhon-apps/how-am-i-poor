function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function includesAny(haystack, needles) {
  for (const n of needles) {
    if (!n) continue
    if (haystack.includes(n)) return true
  }
  return false
}

/**
 * Ritorna una categoria key (string) oppure null
 * @param {string} description
 * @param {"uscita"|"entrata"} type
 */
export function suggestCategory(description, type) {
  const d = norm(description)
  if (!d) return null

  if (type === "uscita") {
    const RULES = [
      { category: "cibo", keywords: ["bar", "caffe", "caffè", "ristorante", "pizza", "kebab", "sushi", "glovo", "deliveroo", "just eat", "esselunga", "coop", "conad", "carrefour", "spesa", "supermercato", "McDonald","Burger King","lidl"] },
      { category: "trasporti", keywords: ["tren", "treno", "metro", "bus", "atm", "taxi", "uber", "benzina", "diesel", "carburante", "parcheggio", "autostrada", "telepass", "aereo", "trenitalia", "italo"] },
      { category: "casa", keywords: ["affitto", "condominio", "spese casa", "ikea", "leroy", "brico", "casa", "arredo", "mobili"] },
      { category: "bollette", keywords: ["bolletta", "luce", "gas", "acqua", "internet", "fibra", "vodafone", "tim", "wind", "iliad"] },
      { category: "salute", keywords: ["farmacia", "medico", "dentista", "visita", "analisi", "ticket", "cura", "terapia", "fisiotera"] },
      { category: "svago", keywords: ["netflix", "spotify", "cinema", "steam", "playstation", "psn", "xbox", "gioco", "palestra", "fitness", "viaggio", "hotel", "airbnb"] },
      { category: "abbigliamento", keywords: ["zara", "hm", "h&m", "nike", "adidas", "scarpe", "maglia", "jeans", "abbigliamento"] },
      { category: "altro", keywords: ["amazon", "paypal", "satispay"] },
    ]

    for (const r of RULES) {
      if (includesAny(d, r.keywords)) return r.category
    }
    return null
  }

  if (type === "entrata") {
    const RULES = [
      { category: "stipendio", keywords: ["stipendio", "salary", "paga", "busta paga"] },
      { category: "bonus", keywords: ["bonus", "rimborso", "refund"] },
      { category: "entrate_extra", keywords: ["extra", "vendita", "freelance", "cliente", "fattura", "commissione"] },
      { category: "altro", keywords: ["regalo", "gift"] },
    ]

    for (const r of RULES) {
      if (includesAny(d, r.keywords)) return r.category
    }
    return null
  }

  return null
}
