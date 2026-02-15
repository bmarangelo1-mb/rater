import type { AppStateV1, Band, RatingRow, Settings } from '../types'
import { createEmptyRow } from './compute'

export function defaultBands(): Band[] {
  return [
    { min: 0.0, max: 0.59, label: 'Needs Improvement' },
    { min: 0.6, max: 0.79, label: 'Meets Expectations' },
    { min: 0.8, max: 1.0, label: 'Exceeds Expectations' },
  ]
}

export function defaultSettings(): Settings {
  return {
    raters: 6,
    rowsCount: 7,
    behavioralColumns: 4,
    competencyColumns: 7,
    behavioralWeight: 0.3,
    competencyWeight: 0.7,
    bands: defaultBands(),
  }
}

function makeId(prefix: string, idx: number) {
  return `${prefix}-${idx}-${Math.random().toString(16).slice(2)}`
}

export function createEmptyRows(rowsCount: number, raters: number): RatingRow[] {
  const count = Math.max(1, Math.floor(rowsCount))
  const r = Math.max(1, Math.floor(raters))
  return Array.from({ length: count }, (_, i) =>
    createEmptyRow({
      id: makeId('row', i + 1),
      label: `Item ${i + 1}`,
      raters: r,
    }),
  )
}

export function createDefaultState(): AppStateV1 {
  const settings = defaultSettings()
  return {
    version: 1,
    settings,
    rows: createEmptyRows(settings.rowsCount, settings.raters),
  }
}

export function createSampleState(): AppStateV1 {
  const settings: Settings = {
    ...defaultSettings(),
    raters: 6,
    rowsCount: 7,
  }

  const rows = createEmptyRows(settings.rowsCount, settings.raters).map((row, idx) => {
    // simple deterministic-ish sample values
    const baseB = 8 + idx * 2
    const baseC = 10 + idx * 2
    return {
      ...row,
      behavioralRawByRater: row.behavioralRawByRater.map((_, rIdx) =>
        Math.max(0, baseB + ((rIdx % 3) - 1) * 3),
      ),
      competencyRawByRater: row.competencyRawByRater.map((_, rIdx) =>
        Math.max(0, baseC + ((rIdx % 4) - 1) * 4),
      ),
    }
  })

  return { version: 1, settings, rows }
}

