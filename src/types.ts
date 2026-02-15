export type Band = {
  min: number
  max: number
  label: string
}

export type Settings = {
  raters: number
  rowsCount: number
  behavioralColumns: number
  competencyColumns: number
  behavioralWeight: number
  competencyWeight: number
  bands: Band[]
}

export type RatingRow = {
  id: string
  label: string
  behavioralRawByRater: number[]
  competencyRawByRater: number[]
}

export type AppStateV1 = {
  version: 1
  settings: Settings
  rows: RatingRow[]
}

