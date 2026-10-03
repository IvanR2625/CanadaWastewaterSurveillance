/*
 * Deterministic synthetic data modelling Canadian wastewater surveillance patterns.
 * Wave timing and amplitude are based on documented SARS-CoV-2 waves in Canada:
 *   Summer 2023 (XBB), Fall 2023, Winter 2023-24 (JN.1),
 *   Summer 2024 (KP.2), Fall/Winter 2024.
 * Replace this with a live PHAC CSV fetch in usePHACData.js when available.
 */

function gauss(t, mu, sigma, amp) {
  return amp * Math.exp(-0.5 * ((t - mu) / sigma) ** 2)
}

function nationalBase(day) {
  let s = 12
  s += gauss(day,  45, 22, 32)   // Aug 2023 — XBB summer wave
  s += gauss(day, 123, 28, 42)   // Nov 2023 — fall rise
  s += gauss(day, 186, 32, 58)   // Jan 2024 — JN.1 winter peak
  s += gauss(day, 381, 22, 28)   // Jul 2024 — KP.2 summer wave
  s += gauss(day, 470, 28, 44)   // Oct 2024 — fall 2024
  s += gauss(day, 545, 28, 50)   // Dec 2024 — winter 2024
  return s
}

/* deterministic per-cell noise */
function cellNoise(siteIdx, weekIdx) {
  let h = 0x12345678
  h = (Math.imul(h ^ siteIdx, 0x9e3779b9) | 0)
  h = (Math.imul(h ^ weekIdx, 0x517cc1b7) | 0)
  h = (h ^ (h >>> 15)) | 0
  return ((h >>> 0) / 0x100000000) * 2 - 1  // -1 … +1
}

const SITES = [
  { province: 'Alberta',                   name: 'Edmonton Gold Bar',         offset: -2, amp: 1.05 },
  { province: 'Alberta',                   name: 'Calgary Bonnybrook',         offset: -2, amp: 0.97 },
  { province: 'Alberta',                   name: 'Calgary Fish Creek',         offset: -3, amp: 0.99 },
  { province: 'Alberta',                   name: 'Red Deer',                   offset: -1, amp: 0.93 },
  { province: 'British Columbia',          name: 'Vancouver Annacis Island',   offset: -5, amp: 0.91 },
  { province: 'British Columbia',          name: 'Victoria Hartland',          offset: -4, amp: 0.87 },
  { province: 'British Columbia',          name: 'Abbotsford',                 offset: -4, amp: 0.89 },
  { province: 'Ontario',                   name: 'Toronto Humber',             offset:  3, amp: 1.10 },
  { province: 'Ontario',                   name: 'Toronto Highland Creek',     offset:  3, amp: 1.08 },
  { province: 'Ontario',                   name: 'Ottawa Robert O. Pickard',   offset:  2, amp: 1.03 },
  { province: 'Ontario',                   name: 'Hamilton Woodward',          offset:  2, amp: 1.05 },
  { province: 'Quebec',                    name: 'Montréal Est',               offset:  4, amp: 1.13 },
  { province: 'Quebec',                    name: 'Québec City Est',            offset:  3, amp: 1.06 },
  { province: 'Quebec',                    name: 'Sherbrooke',                 offset:  4, amp: 1.04 },
  { province: 'Manitoba',                  name: 'Winnipeg North End',         offset:  1, amp: 0.98 },
  { province: 'Saskatchewan',             name: 'Saskatoon Cairns',            offset:  0, amp: 0.96 },
  { province: 'Saskatchewan',             name: 'Regina Wascana Creek',        offset:  1, amp: 0.94 },
  { province: 'Nova Scotia',              name: 'Halifax Dartmouth',           offset:  3, amp: 0.99 },
  { province: 'New Brunswick',            name: 'Fredericton Lincoln',         offset:  4, amp: 0.97 },
  { province: 'New Brunswick',            name: 'Moncton',                     offset:  4, amp: 0.95 },
  { province: 'Newfoundland and Labrador', name: "St. John's Donovans",        offset:  5, amp: 0.89 },
  { province: 'Prince Edward Island',     name: 'Charlottetown',               offset:  4, amp: 0.86 },
  { province: 'Northwest Territories',    name: 'Yellowknife',                 offset: -3, amp: 0.72 },
  { province: 'Yukon',                    name: 'Whitehorse',                  offset: -5, amp: 0.68 },
]

function generateRows() {
  const rows = []
  const startMs = new Date('2023-07-01').getTime()
  const msPerWeek = 7 * 86400 * 1000

  for (let w = 0; w < 79; w++) {
    const date = new Date(startMs + w * msPerWeek).toISOString().substring(0, 10)
    const day = w * 7

    for (let si = 0; si < SITES.length; si++) {
      const site = SITES[si]
      const base = nationalBase(day + site.offset) * site.amp
      const noise = cellNoise(si, w) * 10
      const pct = Math.min(99, Math.max(3, base + noise))

      const dayPrev = Math.max(0, day - 14) + site.offset
      const prevBase = nationalBase(dayPrev) * site.amp
      const prevPct = Math.min(99, Math.max(3, prevBase + cellNoise(si, Math.max(0, w - 2)) * 10))
      const ptc_15d = prevPct > 0 ? ((pct - prevPct) / prevPct) * 100 : 0

      rows.push({ date, province: site.province, site_name: site.name, percentile: pct, ptc_15d })
    }
  }

  return rows
}

export default generateRows()
