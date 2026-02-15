import type { AppStateV1 } from '../types'

const STORAGE_KEY = 'koting-rater.appState.v1'

export function loadAppState(): AppStateV1 | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const v = (parsed as { version?: unknown }).version
    if (v !== 1) return null
    return parsed as AppStateV1
  } catch {
    return null
  }
}

export function saveAppState(state: AppStateV1) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota / serialization issues
  }
}

export function clearAppState() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

