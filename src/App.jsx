import { useState, useEffect } from 'react'
import Header from './components/Header'
import KPIRow from './components/KPIRow'
import TrendChart from './components/TrendChart'
import ProvinceGrid from './components/ProvinceGrid'
import ProvinceRankings from './components/ProvinceRankings'
import { usePHACData } from './hooks/usePHACData'

export default function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('wwsurv-ca-theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [selectedProvs, setSelectedProvs] = useState([])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('wwsurv-ca-theme', theme)
  }, [theme])

  const { nationalTrend, provTimeSeries, currentByProv, stats, loading, error, usingFallback, reload } =
    usePHACData()

  function toggleProv(name) {
    setSelectedProvs(prev =>
      prev.includes(name)
        ? prev.filter(p => p !== name)
        : prev.length >= 5 ? prev : [...prev, name]
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
      <Header
        theme={theme}
        setTheme={setTheme}
        lastUpdated={stats?.lastUpdated}
        loading={loading}
        onReload={reload}
        usingFallback={usingFallback}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {error && (
          <div
            className="rounded-lg px-4 py-3 text-sm flex items-center gap-3"
            style={{ background: 'rgba(208,59,59,0.1)', border: '1px solid var(--critical)', color: 'var(--critical)' }}
          >
            <span>⚠</span>
            <span>Could not load data: {error}</span>
            <button onClick={reload} className="ml-auto underline text-xs">Retry</button>
          </div>
        )}

        {usingFallback && (
          <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
            Displaying illustrative data based on documented Canadian wastewater surveillance patterns.{' '}
            <a
              href="https://search.open.canada.ca/opendata/"
              target="_blank" rel="noopener noreferrer"
              className="underline hover:opacity-70"
            >
              PHAC open data available here
            </a>
          </p>
        )}

        <KPIRow stats={stats} loading={loading} />

        <TrendChart
          nationalTrend={nationalTrend}
          provTimeSeries={provTimeSeries}
          selectedProvs={selectedProvs}
          setSelectedProvs={setSelectedProvs}
          loading={loading}
          theme={theme}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProvinceGrid
            currentByProv={currentByProv}
            loading={loading}
            theme={theme}
            selectedProvs={selectedProvs}
            onProvClick={toggleProv}
          />
          <ProvinceRankings
            currentByProv={currentByProv}
            loading={loading}
            theme={theme}
            selectedProvs={selectedProvs}
            setSelectedProvs={setSelectedProvs}
          />
        </div>

        <footer className="text-xs text-center py-4" style={{ color: 'var(--muted)' }}>
          Data: Public Health Agency of Canada · Wastewater Surveillance ·{' '}
          <a
            href="https://health-infobase.canada.ca/wastewater/"
            target="_blank" rel="noopener noreferrer"
            className="underline hover:opacity-70"
          >
            PHAC Dashboard
          </a>{' '}
          ·{' '}
          <a
            href="https://search.open.canada.ca/opendata/"
            target="_blank" rel="noopener noreferrer"
            className="underline hover:opacity-70"
          >
            Open Dataset
          </a>
        </footer>
      </main>
    </div>
  )
}
