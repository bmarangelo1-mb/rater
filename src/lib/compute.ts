import type { Band, RatingRow, Settings } from '../types'

export function clampNumber(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

export function sanitizeSettings(settings: Settings): Settings {
  const raters = Math.max(1, Math.min(20, Math.floor(settings.raters)))
  const rowsCount = Math.max(1, Math.floor(settings.rowsCount))
  const behavioralColumns = Math.max(1, Math.floor(settings.behavioralColumns))
  const competencyColumns = Math.max(1, Math.floor(settings.competencyColumns))
  const behavioralWeight = Math.max(0, settings.behavioralWeight)
  const competencyWeight = Math.max(0, settings.competencyWeight)
  const bands: Band[] =
    Array.isArray(settings.bands) && settings.bands.length > 0
      ? settings.bands.map((b) => ({
          min: Number.isFinite(b.min) ? b.min : 0,
          max: Number.isFinite(b.max) ? b.max : 0,
          label: typeof b.label === 'string' ? b.label : '',
        }))
      : []

  return normalizeWeights({
    ...settings,
    raters,
    rowsCount,
    behavioralColumns,
    competencyColumns,
    behavioralWeight,
    competencyWeight,
    bands,
  })
}

export function roundTo(n: number, decimals: number) {
  const p = 10 ** decimals
  return Math.round(n * p) / p
}

export function normalizeWeights(settings: Settings): Settings {
  const bw = Math.max(0, settings.behavioralWeight)
  const cw = Math.max(0, settings.competencyWeight)
  const sum = bw + cw
  if (sum <= 0) {
    return { ...settings, behavioralWeight: 0.3, competencyWeight: 0.7 }
  }
  return {
    ...settings,
    behavioralWeight: bw / sum,
    competencyWeight: cw / sum,
  }
}

export function resizeNumberArray(
  input: number[],
  nextLen: number,
  fillValue = 0,
): number[] {
  const len = Math.max(0, Math.floor(nextLen))
  if (input.length === len) return input
  if (input.length > len) return input.slice(0, len)
  return input.concat(Array.from({ length: len - input.length }, () => fillValue))
}

export function ensureRowShape(row: RatingRow, raters: number): RatingRow {
  return {
    ...row,
    behavioralRawByRater: resizeNumberArray(row.behavioralRawByRater, raters, 0),
    competencyRawByRater: resizeNumberArray(row.competencyRawByRater, raters, 0),
  }
}

export function createEmptyRow(opts: {
  id: string
  label: string
  raters: number
}): RatingRow {
  return {
    id: opts.id,
    label: opts.label,
    behavioralRawByRater: Array.from({ length: opts.raters }, () => 0),
    competencyRawByRater: Array.from({ length: opts.raters }, () => 0),
  }
}

export function average(nums: number[]) {
  if (nums.length === 0) return 0
  let sum = 0
  for (const n of nums) sum += n
  return sum / nums.length
}

export function eqBehavioral(raw: number, settings: Settings) {
  const divisor = Math.max(1, settings.behavioralColumns)
  return (raw / divisor) * settings.behavioralWeight
}

export function eqCompetency(raw: number, settings: Settings) {
  const divisor = Math.max(1, settings.competencyColumns)
  return (raw / divisor) * settings.competencyWeight
}

export function bandLabelForScore(bands: Band[], score: number) {
  const s = Number.isFinite(score) ? score : 0
  const hit = bands.find((b) => s >= b.min && s <= b.max)
  return hit?.label ?? ''
}

export type DerivedRow = {
  eqBehavioralByRater: number[]
  eqCompetencyByRater: number[]
  behavioralTotal: number
  competencyTotal: number
  grandTotal: number
  overallLabel: string
}

export function deriveRow(row: RatingRow, settingsRaw: Settings): DerivedRow {
  const settings = normalizeWeights(settingsRaw)
  const raters = Math.max(1, settings.raters)
  const shaped = ensureRowShape(row, raters)

  const eqB = shaped.behavioralRawByRater.map((raw) => eqBehavioral(raw || 0, settings))
  const eqC = shaped.competencyRawByRater.map((raw) => eqCompetency(raw || 0, settings))

  const behavioralTotal = average(eqB)
  const competencyTotal = average(eqC)
  const grandTotal = behavioralTotal + competencyTotal

  return {
    eqBehavioralByRater: eqB,
    eqCompetencyByRater: eqC,
    behavioralTotal,
    competencyTotal,
    grandTotal,
    overallLabel: bandLabelForScore(settings.bands, grandTotal),
  }
}

