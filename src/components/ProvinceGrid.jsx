import { mapColor, LEVEL_LABEL, getLevel } from '../utils/dataHelpers'

/* East-to-west ordering of the 10 provinces, then 3 territories */
const PROVINCES = [
  { full: 'Newfoundland and Labrador', abbr: 'NL', short: 'NL' },
  { full: 'Prince Edward Island',      abbr: 'PE', short: 'PEI' },
  { full: 'Nova Scotia',               abbr: 'NS', short: 'NS' },
  { full: 'New Brunswick',             abbr: 'NB', short: 'NB' },
  { full: 'Quebec',                    abbr: 'QC', short: 'QC' },
  { full: 'Ontario',                   abbr: 'ON', short: 'ON' },
  { full: 'Manitoba',                  abbr: 'MB', short: 'MB' },
  { full: 'Saskatchewan',             abbr: 'SK', short: 'SK' },
  { full: 'Alberta',                   abbr: 'AB', short: 'AB' },
  { full: 'British Columbia',          abbr: 'BC', short: 'BC' },
]

const TERRITORIES = [
  { full: 'Nunavut',               abbr: 'NU', short: 'NU' },
  { full: 'Northwest Territories', abbr: 'NT', short: 'NT' },
  { full: 'Yukon',                 abbr: 'YT', short: 'YT' },
]

function ProvCard({ prov, data, isDark, selected, onClick }) {
  const color  = mapColor(data?.pct, isDark)
  const trend  = data?.trend
  const arrow  = trend > 5 ? '↑' : trend < -5 ? '↓' : '→'
  const arrowColor = trend > 5 ? 'var(--critical)' : trend < -5 ? 'var(--good)' : 'var(--muted)'

  return (
    <button
      onClick={onClick}
      title={`${prov.full}${data ? ` · ${Math.round(data.pct)}th percentile · ${LEVEL_LABEL[data.level]}` : ' · no data'}`}
      className="relative flex flex-col items-center justify-center rounded-xl transition-all"
      style={{
        minHeight: 76,
        padding: '8px 4px 6px',
        background: selected
          ? (isDark ? `${color}28` : `${color}18`)
          : 'var(--surface-2)',
        border: `2px solid ${selected ? color : 'var(--border)'}`,
        cursor: 'pointer',
        boxShadow: selected ? `0 0 0 1px ${color}55` : 'none',
      }}
    >
      {/* top color strip */}
      <div
        className="absolute top-0 left-0 right-0 rounded-t-xl"
        style={{ height: 4, background: data ? color : 'var(--grid)' }}
      />

      {/* abbreviation */}
      <span
        className="text-xl font-bold tracking-tight mt-1"
        style={{ color: data ? color : 'var(--muted)', lineHeight: 1 }}
      >
        {prov.abbr}
      </span>

      {/* short label */}
      <span
        className="text-[9px] text-center mt-0.5 leading-tight"
        style={{ color: 'var(--muted)', maxWidth: 56 }}
      >
        {prov.full.length <= 10 ? prov.full : prov.abbr}
      </span>

      {/* signal + trend */}
      {data ? (
        <div className="flex items-center gap-0.5 mt-1">
          <span className="text-[10px] font-semibold tabular-nums" style={{ color }}>
            {Math.round(data.pct)}
          </span>
          <span className="text-[10px]" style={{ color: arrowColor }}>
            {arrow}
          </span>
        </div>
      ) : (
        <span className="text-[9px] mt-1" style={{ color: 'var(--muted)' }}>no data</span>
      )}
    </button>
  )
}

export default function ProvinceGrid({ currentByProv, loading, theme, selectedProvs, onProvClick }) {
  const isDark = theme === 'dark'

  return (
    <div className="panel">
      <div className="mb-4">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          Signal by province & territory
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
          Click to overlay on the trend chart (up to 5)
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-5 gap-2">
          {[...PROVINCES, ...TERRITORIES].map(p => (
            <div key={p.abbr} className="skeleton rounded-xl" style={{ height: 76 }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Provinces — 2 rows of 5 */}
          <div className="grid grid-cols-5 gap-2">
            {PROVINCES.slice(0, 5).map(p => (
              <ProvCard
                key={p.abbr}
                prov={p}
                data={currentByProv?.[p.full]}
                isDark={isDark}
                selected={selectedProvs?.includes(p.full)}
                onClick={() => onProvClick?.(p.full)}
              />
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {PROVINCES.slice(5).map(p => (
              <ProvCard
                key={p.abbr}
                prov={p}
                data={currentByProv?.[p.full]}
                isDark={isDark}
                selected={selectedProvs?.includes(p.full)}
                onClick={() => onProvClick?.(p.full)}
              />
            ))}
          </div>

          {/* Territories — row of 3 with divider */}
          <div
            className="flex items-center gap-2 mt-1"
            style={{ borderTop: '1px solid var(--grid)', paddingTop: 8 }}
          >
            <span className="text-[9px] font-medium shrink-0" style={{ color: 'var(--muted)' }}>
              TERRITORIES
            </span>
            <div className="grid gap-2 flex-1" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {TERRITORIES.map(p => (
                <ProvCard
                  key={p.abbr}
                  prov={p}
                  data={currentByProv?.[p.full]}
                  isDark={isDark}
                  selected={selectedProvs?.includes(p.full)}
                  onClick={() => onProvClick?.(p.full)}
                />
              ))}
            </div>
            {/* fill remaining columns */}
            <div style={{ gridColumn: 'span 0' }} />
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 flex-wrap">
        {[
          { label: 'Low',      pct: 12 },
          { label: 'Moderate', pct: 37 },
          { label: 'Mod–High', pct: 62 },
          { label: 'High',     pct: 87 },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: mapColor(item.pct, isDark) }}
            />
            {item.label}
          </div>
        ))}
        <span className="text-xs ml-auto" style={{ color: 'var(--muted)' }}>
          Number = percentile · arrow = 15-day trend
        </span>
      </div>
    </div>
  )
}
