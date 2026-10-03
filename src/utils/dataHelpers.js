export const PROV_ABBR = {
  'Alberta':                   'AB',
  'British Columbia':          'BC',
  'Manitoba':                  'MB',
  'New Brunswick':             'NB',
  'Newfoundland and Labrador': 'NL',
  'Nova Scotia':               'NS',
  'Northwest Territories':     'NT',
  'Nunavut':                   'NU',
  'Ontario':                   'ON',
  'Prince Edward Island':      'PE',
  'Quebec':                    'QC',
  'Saskatchewan':              'SK',
  'Yukon':                     'YT',
}

export function getLevel(pct) {
  if (pct == null) return 'unknown'
  if (pct >= 75) return 'high'
  if (pct >= 50) return 'moderate-high'
  if (pct >= 25) return 'moderate'
  return 'low'
}

export const LEVEL_LABEL = {
  high: 'High',
  'moderate-high': 'Mod–High',
  moderate: 'Moderate',
  low: 'Low',
  unknown: '–',
}

/* percentile → sequential red ramp */
export function mapColor(pct, isDark) {
  if (pct == null) return isDark ? '#2c2c2a' : '#e1e0d9'
  const stops = isDark
    ? [[0,'#3a1210'],[25,'#7a2218'],[50,'#c0392b'],[75,'#e07060'],[100,'#f5c4be']]
    : [[0,'#fef0ee'],[25,'#f4a59d'],[50,'#e05246'],[75,'#b52b1f'],[100,'#6b1209']]
  for (let i = 1; i < stops.length; i++) {
    const [lo, cLo] = stops[i - 1]
    const [hi, cHi] = stops[i]
    if (pct <= hi) {
      const t = (pct - lo) / (hi - lo)
      return lerpHex(cLo, cHi, t)
    }
  }
  return stops[stops.length - 1][1]
}

function lerpHex(a, b, t) {
  const ah = parseInt(a.slice(1), 16)
  const bh = parseInt(b.slice(1), 16)
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bv = Math.round(ab + (bb - ab) * t)
  return `#${((r << 16) | (g << 8) | bv).toString(16).padStart(6, '0')}`
}

export function processRows(rows) {
  const byProvDate = {}

  for (const row of rows) {
    const prov = row.province || row.province_territory || row.Province
    if (!prov) continue
    const date = (row.date || row.sample_date || row.analysis_date || '')?.substring(0, 10)
    const pct = parseFloat(row.percentile || row.Percentile)
    const trend = parseFloat(row.ptc_15d || row.percent_change)
    if (!date || isNaN(pct)) continue

    if (!byProvDate[prov]) byProvDate[prov] = {}
    if (!byProvDate[prov][date]) byProvDate[prov][date] = { pcts: [], trends: [] }
    byProvDate[prov][date].pcts.push(pct)
    if (!isNaN(trend)) byProvDate[prov][date].trends.push(trend)
  }

  const provTimeSeries = {}
  for (const [prov, dates] of Object.entries(byProvDate)) {
    provTimeSeries[prov] = Object.entries(dates)
      .map(([date, { pcts, trends }]) => ({
        date,
        pct: avg(pcts),
        trend: avg(trends),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  const allDates = new Set(
    Object.values(provTimeSeries).flatMap(ts => ts.map(d => d.date))
  )
  const nationalTrend = Array.from(allDates)
    .sort()
    .map(date => {
      const vals = Object.values(provTimeSeries)
        .map(ts => ts.find(d => d.date === date)?.pct)
        .filter(v => v !== undefined)
      return { date, pct: vals.length ? avg(vals) : null }
    })
    .filter(d => d.pct !== null)

  const currentByProv = {}
  for (const [prov, series] of Object.entries(provTimeSeries)) {
    if (!series.length) continue
    const last = series[series.length - 1]
    currentByProv[prov] = { pct: last.pct, trend: last.trend, level: getLevel(last.pct) }
  }

  const provSnaps = Object.values(currentByProv)
  const lastUpdated = Object.values(provTimeSeries)
    .map(ts => ts[ts.length - 1]?.date).filter(Boolean).sort().at(-1) ?? null
  const rising = provSnaps.filter(s => s.trend > 5).length
  const totalSites = new Set(rows.map(r => r.site_name || r.wwtp_name).filter(Boolean)).size

  const stats = {
    nationalPct: provSnaps.length ? avg(provSnaps.map(s => s.pct)) : null,
    pctRising: provSnaps.length ? Math.round((rising / provSnaps.length) * 100) : null,
    totalSites: totalSites || null,
    provCount: provSnaps.length,
    lastUpdated,
  }

  return { nationalTrend, provTimeSeries, currentByProv, stats }
}

function avg(arr) {
  if (!arr.length) return null
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function filterByRange(series, range) {
  if (range === 'all' || !series.length) return series
  const days = { '3m': 90, '6m': 180, '1y': 365 }[range] ?? 180
  const anchor = new Date(series[series.length - 1].date + 'T00:00:00Z')
  const cutoff = new Date(anchor.getTime() - days * 86400000).toISOString().substring(0, 10)
  return series.filter(d => d.date >= cutoff)
}

export function fmtDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`
}

export function fmtDateShort(iso) {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`
}
