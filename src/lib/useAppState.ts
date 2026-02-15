import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppStateV1, RatingRow, Settings } from '../types'
import { ensureRowShape, sanitizeSettings } from './compute'
import { loadAppState, saveAppState } from './storage'
import { createDefaultState, createEmptyRows, createSampleState } from './sampleData'

function makeId() {
  // Prefer crypto if available (browser); fallback otherwise.
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID()
  return `id-${Math.random().toString(16).slice(2)}-${Date.now()}`
}

function normalizeLoadedState(loaded: AppStateV1 | null): AppStateV1 {
  const fallback = createDefaultState()
  if (!loaded) return fallback

  const rawSettings = loaded.settings ?? fallback.settings
  const settings = sanitizeSettings({ ...fallback.settings, ...rawSettings })

  const rawRows = Array.isArray(loaded.rows) ? loaded.rows : []
  const rowsNeeded = settings.rowsCount
  const rows: RatingRow[] = []

  for (let i = 0; i < Math.min(rowsNeeded, rawRows.length); i++) {
    const r = rawRows[i]
    rows.push(
      ensureRowShape(
        {
          id: typeof r?.id === 'string' ? r.id : makeId(),
          label: typeof r?.label === 'string' ? r.label : `Item ${i + 1}`,
          behavioralRawByRater: Array.isArray(r?.behavioralRawByRater)
            ? (r.behavioralRawByRater as number[]).map((n) => (Number.isFinite(n) ? n : 0))
            : [],
          competencyRawByRater: Array.isArray(r?.competencyRawByRater)
            ? (r.competencyRawByRater as number[]).map((n) => (Number.isFinite(n) ? n : 0))
            : [],
        },
        settings.raters,
      ),
    )
  }

  if (rows.length < rowsNeeded) {
    const more = createEmptyRows(rowsNeeded - rows.length, settings.raters).map((r) => ({
      ...r,
      id: makeId(),
    }))
    rows.push(...more)
  } else if (rows.length > rowsNeeded) {
    rows.length = rowsNeeded
  }

  return { version: 1, settings, rows }
}

function applySettingsToRows(prevRows: RatingRow[], nextSettings: Settings): RatingRow[] {
  const raters = nextSettings.raters
  const rowsCount = nextSettings.rowsCount

  const nextRows = prevRows.slice(0, rowsCount).map((r, idx) =>
    ensureRowShape(
      {
        ...r,
        label: r.label || `Item ${idx + 1}`,
      },
      raters,
    ),
  )

  if (nextRows.length < rowsCount) {
    const more = createEmptyRows(rowsCount - nextRows.length, raters).map((r, idx) => ({
      ...r,
      id: makeId(),
      label: `Item ${nextRows.length + idx + 1}`,
    }))
    nextRows.push(...more)
  }

  return nextRows
}

export type UseAppState = {
  state: AppStateV1
  settings: Settings
  rows: RatingRow[]
  setSettings: (updater: (prev: Settings) => Settings) => void
  setBands: (bands: Settings['bands']) => void
  setRowLabel: (rowId: string, label: string) => void
  setRawCell: (opts: {
    rowId: string
    section: 'behavioral' | 'competency'
    raterIndex: number
    value: number
  }) => void
  resetRow: (rowId: string) => void
  resetAll: () => void
  loadSample: () => void
}

export function useAppState(): UseAppState {
  const [state, setState] = useState<AppStateV1>(() =>
    normalizeLoadedState(loadAppState()),
  )

  useEffect(() => {
    saveAppState(state)
  }, [state])

  const setSettings = useCallback((updater: (prev: Settings) => Settings) => {
    setState((prev) => {
      const nextSettings = sanitizeSettings(updater(prev.settings))
      const nextRows = applySettingsToRows(prev.rows, nextSettings)
      return { ...prev, settings: nextSettings, rows: nextRows }
    })
  }, [])

  const setBands = useCallback((bands: Settings['bands']) => {
    setSettings((prev) => ({ ...prev, bands }))
  }, [setSettings])

  const setRowLabel = useCallback((rowId: string, label: string) => {
    setState((prev) => ({
      ...prev,
      rows: prev.rows.map((r) => (r.id === rowId ? { ...r, label } : r)),
    }))
  }, [])

  const setRawCell = useCallback(
    (opts: {
      rowId: string
      section: 'behavioral' | 'competency'
      raterIndex: number
      value: number
    }) => {
      setState((prev) => {
        const idx = Math.max(0, Math.min(prev.settings.raters - 1, Math.floor(opts.raterIndex)))
        const v = Number.isFinite(opts.value) ? opts.value : 0
        const rows = prev.rows.map((r) => {
          if (r.id !== opts.rowId) return r
          if (opts.section === 'behavioral') {
            const next = r.behavioralRawByRater.slice()
            next[idx] = v
            return { ...r, behavioralRawByRater: next }
          }
          const next = r.competencyRawByRater.slice()
          next[idx] = v
          return { ...r, competencyRawByRater: next }
        })
        return { ...prev, rows }
      })
    },
    [],
  )

  const resetRow = useCallback((rowId: string) => {
    setState((prev) => ({
      ...prev,
      rows: prev.rows.map((r) =>
        r.id === rowId
          ? {
              ...r,
              behavioralRawByRater: r.behavioralRawByRater.map(() => 0),
              competencyRawByRater: r.competencyRawByRater.map(() => 0),
            }
          : r,
      ),
    }))
  }, [])

  const resetAll = useCallback(() => {
    setState(createDefaultState())
  }, [])

  const loadSample = useCallback(() => {
    const sample = createSampleState()
    setState(normalizeLoadedState(sample))
  }, [])

  const memo = useMemo(() => {
    return {
      state,
      settings: state.settings,
      rows: state.rows,
    }
  }, [state])

  return {
    ...memo,
    setSettings,
    setBands,
    setRowLabel,
    setRawCell,
    resetRow,
    resetAll,
    loadSample,
  }
}

