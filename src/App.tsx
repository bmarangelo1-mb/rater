import { useAppState } from './lib/useAppState'
import { BandEditor } from './components/BandEditor'
import { SettingsPanel } from './components/SettingsPanel'
import { SummaryPanel } from './components/SummaryPanel'
import { RaterTable } from './components/RaterTable/RaterTable'
import { exportRaterCsv } from './lib/csv'
import { FileDown, FileSpreadsheet } from 'lucide-react'
import { useState } from 'react'

function App() {
  const {
    settings,
    rows,
    setSettings,
    setBands,
    setRowLabel,
    setRawCell,
    resetRow,
    resetAll,
    loadSample,
  } = useAppState()
  const [exportingXlsx, setExportingXlsx] = useState(false)

  return (
    <div className="min-h-full">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm text-white/70">Zor&apos;s Rater</div>
            <h1 className="text-2xl font-semibold tracking-tight">Excel-like rater sheet</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 backdrop-blur hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={async () => {
                if (exportingXlsx) return
                setExportingXlsx(true)
                try {
                  const mod = await import('./lib/excel/exportRaterXlsx')
                  await mod.exportRaterXlsx({ settings, rows })
                } finally {
                  setExportingXlsx(false)
                }
              }}
              type="button"
              disabled={exportingXlsx}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {exportingXlsx ? 'Exporting…' : 'Export Excel'}
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 backdrop-blur hover:bg-white/10"
              onClick={() => exportRaterCsv({ settings, rows })}
              type="button"
            >
              <FileDown className="h-4 w-4" />
              Export CSV
            </button>
            <button
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 backdrop-blur hover:bg-white/10"
              onClick={loadSample}
              type="button"
            >
              Load sample
            </button>
            <button
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 backdrop-blur hover:bg-white/10"
              onClick={resetAll}
              type="button"
            >
              Reset all
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <SettingsPanel settings={settings} onChange={setSettings} />

          <div className="grid gap-4 xl:grid-cols-12">
            <div className="xl:col-span-9">
              <RaterTable
                settings={settings}
                rows={rows}
                onSetLabel={setRowLabel}
                onSetRawCell={setRawCell}
                onResetRow={resetRow}
              />
            </div>
            <div className="space-y-4 xl:col-span-3">
              <SummaryPanel settings={settings} rows={rows} />
              <BandEditor bands={settings.bands} onChange={setBands} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
