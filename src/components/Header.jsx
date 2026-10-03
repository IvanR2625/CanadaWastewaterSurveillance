import { Sun, Moon, RefreshCw, ExternalLink } from 'lucide-react'
import { fmtDate } from '../utils/dataHelpers'

export default function Header({ theme, setTheme, lastUpdated, loading, onReload, usingFallback }) {
  return (
    <header
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      className="sticky top-0 z-20"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* logo mark — maple leaf wave */}
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
          <rect width="32" height="32" rx="6" fill="var(--accent)" fillOpacity="0.15"/>
          <path
            d="M4 22 Q8 8 12 18 Q16 28 20 12 Q24 2 28 10"
            stroke="var(--accent)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold leading-tight" style={{ color: 'var(--ink)' }}>
            Canada Wastewater Surveillance
          </h1>
          <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
            SARS-CoV-2 viral signal · PHAC open data
            {usingFallback && (
              <span
                className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ background: 'var(--grid)', color: 'var(--muted)' }}
              >
                illustrative data
              </span>
            )}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
          <span>Updated:</span>
          {loading
            ? <span className="skeleton inline-block w-24 h-3 rounded" />
            : <span>{lastUpdated ? fmtDate(lastUpdated) : '–'}</span>
          }
          <button
            onClick={onReload}
            aria-label="Reload data"
            className="ml-1 p-1 rounded hover:opacity-70 transition-opacity"
            style={{ color: 'var(--muted)' }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <a
          href="https://health-infobase.canada.ca/wastewater/"
          target="_blank" rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1 text-xs hover:opacity-70 transition-opacity"
          style={{ color: 'var(--muted)' }}
        >
          PHAC <ExternalLink size={10} />
        </a>

        <button
          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-1.5 rounded-md hover:opacity-70 transition-opacity"
          style={{ color: 'var(--ink-2)' }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  )
}
