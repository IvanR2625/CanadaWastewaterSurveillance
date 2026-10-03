import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { LEVEL_LABEL, PROV_ABBR, mapColor } from '../utils/dataHelpers'

const SORT_OPTS = [
  { v: 'pct-desc',   label: 'Highest signal' },
  { v: 'pct-asc',    label: 'Lowest signal'  },
  { v: 'trend-desc', label: 'Rising most'    },
  { v: 'trend-asc',  label: 'Falling most'   },
  { v: 'alpha',      label: 'Alphabetical'   },
]

function TrendBadge({ trend }) {
  if (trend == null) return <span style={{ color: 'var(--muted)' }}>–</span>
  const up   = trend > 5
  const down = trend < -5
  const color = up ? 'var(--critical)' : down ? 'var(--good)' : 'var(--muted)'
  const Icon  = up ? TrendingUp : down ? TrendingDown : Minus
  return (
    <span className="flex items-center gap-0.5" style={{ color }}>
      <Icon size={11} />
      {trend > 0 ? '+' : ''}{Math.round(trend)}%
    </span>
  )
}

export default function ProvinceRankings({ currentByProv, loading, theme, selectedProvs, setSelectedProvs }) {
  const [sort, setSort] = useState('pct-desc')
  const isDark = theme === 'dark'

  const rows = useMemo(() => {
    if (!currentByProv) return []
    const entries = Object.entries(currentByProv).map(([name, d]) => ({ name, ...d }))
    switch (sort) {
      case 'pct-asc':    return [...entries].sort((a, b) => a.pct - b.pct)
      case 'pct-desc':   return [...entries].sort((a, b) => b.pct - a.pct)
      case 'trend-desc': return [...entries].sort((a, b) => (b.trend ?? -Infinity) - (a.trend ?? -Infinity))
      case 'trend-asc':  return [...entries].sort((a, b) => (a.trend ?? Infinity) - (b.trend ?? Infinity))
      case 'alpha':      return [...entries].sort((a, b) => a.name.localeCompare(b.name))
      default:           return entries
    }
  }, [currentByProv, sort])

  function toggleProv(name) {
    setSelectedProvs?.(prev =>
      prev.includes(name)
        ? prev.filter(p => p !== name)
        : prev.length >= 5 ? prev : [...prev, name]
    )
  }

  return (
    <div className="panel flex flex-col gap-3 overflow-hidden">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            Province rankings
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            Click a row to overlay on the trend chart
          </p>
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="text-xs rounded-md px-2 py-1 border"
          style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', borderColor: 'var(--grid)' }}
        >
          {SORT_OPTS.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-6 w-full rounded" />
          ))}
        </div>
      ) : (
        <div className="overflow-auto" style={{ maxHeight: 420 }}>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--grid)' }}>
                <th className="text-left py-1.5 pr-2 font-medium" style={{ color: 'var(--muted)' }}>Province / Territory</th>
                <th className="text-right py-1.5 pr-2 font-medium" style={{ color: 'var(--muted)' }}>Signal</th>
                <th className="text-right py-1.5 pr-2 font-medium" style={{ color: 'var(--muted)' }}>Level</th>
                <th className="text-right py-1.5 font-medium" style={{ color: 'var(--muted)' }}>15-day Δ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const isSelected = selectedProvs?.includes(row.name)
                const swatchColor = mapColor(row.pct, isDark)
                return (
                  <tr
                    key={row.name}
                    onClick={() => toggleProv(row.name)}
                    className="cursor-pointer transition-colors"
                    style={{
                      borderBottom: '1px solid var(--grid)',
                      background: isSelected ? 'var(--grid)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-2)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                    <td className="py-1.5 pr-2" style={{ color: 'var(--ink)' }}>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-block w-2 h-2 rounded-sm flex-shrink-0"
                          style={{ background: swatchColor }}
                        />
                        <span className="font-medium">{PROV_ABBR[row.name] ?? row.name}</span>
                        <span className="hidden sm:inline truncate" style={{ color: 'var(--muted)' }}>
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-1.5 pr-2 text-right tabular-nums font-semibold" style={{ color: 'var(--ink)' }}>
                      {row.pct != null ? Math.round(row.pct) : '–'}
                    </td>
                    <td className="py-1.5 pr-2 text-right" style={{ color: 'var(--ink-2)' }}>
                      {LEVEL_LABEL[row.level]}
                    </td>
                    <td className="py-1.5 text-right">
                      <TrendBadge trend={row.trend} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
