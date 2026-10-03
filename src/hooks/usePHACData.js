import { useState, useEffect, useCallback } from 'react'
import SAMPLE_ROWS from '../data/sampleData'
import { processRows } from '../utils/dataHelpers'

/*
 * Fetches the PHAC wastewater aggregate CSV (CORS: * — works from browser).
 * Converts raw gene-copies/mL (w_avg) into a 0-100 site-relative percentile
 * by ranking each reading against the full history at that site.
 * Falls back silently to embedded illustrative data if the fetch fails.
 */
const AGGREGATE_URL =
  'https://health-infobase.canada.ca/src/data/wastewater/wastewater_aggregate.csv'

/* ── CSV parser (handles quoted fields) ── */
function parseCSV(text) {
  const lines = text.replace(/\r/g, '').trim().split('\n')
  if (lines.length < 2) return []
  const parseRow = line => {
    const out = []
    let field = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { field += '"'; i++ }
        else inQ = !inQ
      } else if (c === ',' && !inQ) {
        out.push(field.trim()); field = ''
      } else {
        field += c
      }
    }
    out.push(field.trim())
    return out
  }
  const headers = parseRow(lines[0])
  return lines.slice(1).filter(l => l.trim()).map(l => {
    const vals = parseRow(l)
    const row = {}
    headers.forEach((h, i) => { row[h] = vals[i] ?? '' })
    return row
  })
}

/* Binary search: index of rightmost value <= val (for fast percentile rank) */
function bisectRight(arr, val) {
  let lo = 0, hi = arr.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (arr[mid] <= val) lo = mid + 1
    else hi = mid
  }
  return lo
}

/* Normalize province names to match our PROV_ABBR keys */
const PROV_FIX = {
  'Québec': 'Quebec',
  'Quebec': 'Quebec',
  'British-Columbia': 'British Columbia',
}
function normProv(p) { return PROV_FIX[p?.trim()] ?? p?.trim() }

/*
 * Transform raw PHAC rows into the standard shape:
 *   { date, province, site_name, percentile (0-100), ptc_15d }
 *
 * Percentile = empirical CDF rank of w_avg within that site's full history,
 * so 75 means "higher than 75% of all readings ever recorded at this site."
 */
function transformPHACRows(rawRows) {
  const covidRows = rawRows.filter(r => {
    if (r.measureid !== 'covN2') return false
    if (!r.weekstart || !r.w_avg) return false
    const w = parseFloat(r.w_avg)
    return !isNaN(w) && w >= 0
  })

  if (!covidRows.length) return []

  /* Group readings by site */
  const bySite = {}
  for (const row of covidRows) {
    const site = (row.site || row.Location || '').trim()
    if (!site) continue
    const province = normProv(row.province)
    const w = parseFloat(row.w_avg)
    if (!bySite[site]) bySite[site] = { province, readings: [] }
    bySite[site].readings.push({ date: row.weekstart.substring(0, 10), w })
  }

  const result = []
  for (const [siteName, { province, readings }] of Object.entries(bySite)) {
    if (readings.length < 3) continue  // too few readings to rank meaningfully

    /* Sort chronologically for trend calc */
    readings.sort((a, b) => a.date.localeCompare(b.date))

    /* Sorted w_avg values for fast percentile lookup */
    const sortedW = readings.map(r => r.w).sort((a, b) => a - b)
    const n = sortedW.length

    for (let i = 0; i < readings.length; i++) {
      const { date, w } = readings[i]

      /* Percentile: fraction of site's history that is <= w */
      const rank = bisectRight(sortedW, w)
      const percentile = Math.min(99.5, (rank / n) * 100)

      /* 15-day (≈ 2-week) percent change for trend arrow */
      let ptc_15d = 0
      if (i >= 2) {
        const prev = readings[i - 2].w
        ptc_15d = prev > 0.001 ? ((w - prev) / prev) * 100 : 0
      }

      result.push({ date, province, site_name: siteName, percentile, ptc_15d })
    }
  }

  return result
}

/* ── Hook ── */
export function usePHACData() {
  /* Start with illustrative data so the UI renders immediately */
  const [state, setState] = useState(() => ({
    processed: processRows(SAMPLE_ROWS),
    loading: false,
    error: null,
    usingFallback: true,
  }))

  const load = useCallback(async () => {
    try {
      const res = await fetch(AGGREGATE_URL, { signal: AbortSignal.timeout(25000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const rawRows = parseCSV(text)
      if (rawRows.length < 100) throw new Error('Unexpectedly short response')
      const rows = transformPHACRows(rawRows)
      if (!rows.length) throw new Error('No covN2 rows found')
      const processed = processRows(rows)
      if (!processed.nationalTrend?.length) throw new Error('Processing produced no trend data')
      setState({ processed, loading: false, error: null, usingFallback: false })
    } catch {
      /* Keep showing illustrative data — no error banner */
      setState(s => ({ ...s, loading: false, usingFallback: true }))
    }
  }, [])

  useEffect(() => { load() }, [load])

  return {
    ...state.processed,
    loading: state.loading,
    error: state.error,
    usingFallback: state.usingFallback,
    reload: load,
  }
}
