import { useState, useMemo } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { filterByRange, fmtDate, PROV_ABBR } from '../utils/dataHelpers'

const RANGE_OPTS = [
  { v: '3m',  label: '3 mo' },
  { v: '6m',  label: '6 mo' },
  { v: '1y',  label: '1 yr' },
  { v: 'all', label: 'All'  },
]

const PROV_COLORS = [
  'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)', 'var(--s8)',
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="panel text-xs shadow-xl" style={{ minWidth: 160, zIndex: 30 }}>
      <p className="font-medium mb-2" style={{ color: 'var(--ink)' }}>{fmtDate(label)}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: 'var(--ink-2)' }}>{p.name}</span>
          <span className="font-semibold tabular-nums" style={{ color: p.color }}>
            {p.value != null ? `${Math.round(p.value)}th` : '–'}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function TrendChart({
  nationalTrend,
  provTimeSeries,
  selectedProvs,
  setSelectedProvs,
  loading,
  theme,
}) {
  const [range, setRange] = useState('all')

  const allProvs = useMemo(
    () => Object.keys(provTimeSeries ?? {}).sort(),
    [provTimeSeries]
  )

  const chartData = useMemo(() => {
    if (!nationalTrend) return []
    const filtered = filterByRange(nationalTrend, range)
    const provSeries = {}
    for (const prov of selectedProvs) {
      const ts = provTimeSeries?.[prov]
      if (ts) provSeries[prov] = Object.fromEntries(ts.map(d => [d.date, d.pct]))
    }
    return filtered.map(d => {
      const row = { date: d.date, National: d.pct }
      for (const prov of selectedProvs) {
        row[PROV_ABBR[prov] ?? prov] = provSeries[prov]?.[d.date] ?? null
      }
      return row
    })
  }, [nationalTrend, provTimeSeries, selectedProvs, range])

  const tickFormatter = iso => {
    if (!iso) return ''
    const [, m, d] = iso.split('-')
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`
  }

  const ticks = useMemo(() => {
    if (!chartData.length) return []
    const step = Math.max(1, Math.floor(chartData.length / 6))
    return chartData.filter((_, i) => i % step === 0).map(d => d.date)
  }, [chartData])

  function toggleProv(name) {
    setSelectedProvs(prev =>
      prev.includes(name)
        ? prev.filter(p => p !== name)
        : prev.length >= 5 ? prev : [...prev, name]
    )
  }

  return (
    <div className="panel">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            National viral signal over time
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            Average percentile across all reporting sites
            {selectedProvs.length > 0 && ` · ${selectedProvs.length} province${selectedProvs.length > 1 ? 's' : ''} overlaid`}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value=""
            onChange={e => { if (e.target.value) toggleProv(e.target.value) }}
            className="text-xs rounded-md px-2 py-1 border"
            style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', borderColor: 'var(--grid)' }}
          >
            <option value="" disabled>+ Compare province…</option>
            {allProvs.map(p => (
              <option key={p} value={p} disabled={selectedProvs.length >= 5 && !selectedProvs.includes(p)}>
                {PROV_ABBR[p] ?? p} — {p} {selectedProvs.includes(p) ? '✓' : ''}
              </option>
            ))}
          </select>

          <div className="flex gap-1">
            {RANGE_OPTS.map(o => (
              <button
                key={o.v}
                onClick={() => setRange(o.v)}
                className="px-2.5 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  background: range === o.v ? 'var(--accent)' : 'var(--surface-2)',
                  color: range === o.v ? '#fff' : 'var(--ink-2)',
                  border: '1px solid',
                  borderColor: range === o.v ? 'var(--accent)' : 'var(--grid)',
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedProvs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selectedProvs.map((p, i) => (
            <button
              key={p}
              onClick={() => toggleProv(p)}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border"
              style={{ borderColor: PROV_COLORS[i % PROV_COLORS.length], color: PROV_COLORS[i % PROV_COLORS.length] }}
            >
              {PROV_ABBR[p] ?? p} ×
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="skeleton h-64 w-full rounded-lg" />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="natGradCA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--s1)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--s1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" vertical={false} />
            <XAxis
              dataKey="date"
              ticks={ticks}
              tickFormatter={tickFormatter}
              tick={{ fill: 'var(--muted)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--baseline)' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fill: 'var(--muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--baseline)', strokeWidth: 1 }} />
            <ReferenceLine y={25} stroke="var(--grid)" strokeDasharray="4 4" />
            <ReferenceLine y={50} stroke="var(--grid)" strokeDasharray="4 4" />
            <ReferenceLine y={75} stroke="var(--grid)" strokeDasharray="4 4" />

            <Area
              type="monotone"
              dataKey="National"
              stroke="var(--s1)"
              strokeWidth={2}
              fill="url(#natGradCA)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls
            />

            {selectedProvs.map((p, i) => (
              <Line
                key={p}
                type="monotone"
                dataKey={PROV_ABBR[p] ?? p}
                stroke={PROV_COLORS[i % PROV_COLORS.length]}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                connectNulls
              />
            ))}

            {selectedProvs.length > 0 && (
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--ink-2)', paddingTop: 8 }} iconType="plainline" />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}

      <div className="mt-3 flex flex-col gap-1">
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Y-axis: percentile (0 = historically low; 100 = historically high). Select up to 5 provinces to compare.
        </p>
      </div>
    </div>
  )
}
