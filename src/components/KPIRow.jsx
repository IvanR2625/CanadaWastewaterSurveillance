import { TrendingUp, TrendingDown, Minus, Activity, MapPin, BarChart3, Globe } from 'lucide-react'

function Tile({ icon: Icon, label, value, sub, trend, loading }) {
  const trendColor =
    trend === 'up'   ? 'var(--critical)' :
    trend === 'down' ? 'var(--good)' :
    'var(--muted)'

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div className="panel flex-1 min-w-0 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
        <Icon size={12} />
        <span>{label}</span>
      </div>
      {loading ? (
        <>
          <div className="skeleton h-8 w-20 mt-1" />
          <div className="skeleton h-3 w-28 mt-1" />
        </>
      ) : (
        <>
          <div className="text-3xl font-semibold tabular-nums leading-none mt-1" style={{ color: 'var(--ink)' }}>
            {value ?? '–'}
          </div>
          <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: trendColor }}>
            {trend && <TrendIcon size={11} />}
            <span style={{ color: 'var(--ink-2)' }}>{sub}</span>
          </div>
        </>
      )}
    </div>
  )
}

export default function KPIRow({ stats, loading }) {
  const natPct  = stats?.nationalPct  != null ? Math.round(stats.nationalPct)  : null
  const pctRise = stats?.pctRising    != null ? stats.pctRising                : null
  const sites   = stats?.totalSites   != null ? stats.totalSites.toLocaleString() : null
  const provCnt = stats?.provCount    != null ? stats.provCount                : null

  const natLevel =
    natPct == null ? '' :
    natPct >= 75 ? 'High national signal' :
    natPct >= 50 ? 'Moderate–high signal' :
    natPct >= 25 ? 'Moderate signal' :
    'Low signal'

  const riseTrend =
    pctRise == null ? undefined :
    pctRise > 50 ? 'up' :
    pctRise < 30 ? 'down' :
    'flat'

  return (
    <div className="flex flex-wrap gap-3">
      <Tile
        icon={Activity}
        label="National signal"
        value={natPct != null ? `${natPct}th %ile` : null}
        sub={natLevel}
        loading={loading}
      />
      <Tile
        icon={TrendingUp}
        label="Provinces rising"
        value={pctRise != null ? `${pctRise}%` : null}
        sub="of reporting provinces"
        trend={riseTrend}
        loading={loading}
      />
      <Tile
        icon={MapPin}
        label="Monitoring sites"
        value={sites}
        sub={`across ${provCnt ?? '–'} provinces/territories`}
        loading={loading}
      />
      <Tile
        icon={Globe}
        label="Dataset"
        value="PHAC"
        sub="Canada open data"
        loading={loading}
      />
    </div>
  )
}
