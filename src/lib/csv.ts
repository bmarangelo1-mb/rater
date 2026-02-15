import { deriveRow, roundTo } from './compute'
import type { RatingRow, Settings } from '../types'
import { downloadBlob } from './download'

function csvEscape(value: string) {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

function fmt(n: number) {
  if (!Number.isFinite(n)) return ''
  return String(roundTo(n, 6))
}

export function exportRaterCsv(opts: { settings: Settings; rows: RatingRow[] }) {
  const { settings, rows } = opts
  const n = settings.raters

  const header: string[] = ['Item']
  for (let i = 1; i <= n; i++) {
    header.push(`Behavioral Rater ${i} Raw`, `Behavioral Eq. Rate`)
  }
  header.push('Behavioral TOTAL')
  for (let i = 1; i <= n; i++) {
    header.push(`Competency Rater ${i} Raw`, `Competency Eq. Rate`)
  }
  header.push('Competency TOTAL', 'GRAND TOTAL (Behavioral + Competency)', 'OVER-ALL SCORE')

  const lines: string[] = []
  lines.push(header.map(csvEscape).join(','))

  for (const row of rows) {
    const d = deriveRow(row, settings)
    const out: string[] = [row.label]
    for (let i = 0; i < n; i++) {
      out.push(String(row.behavioralRawByRater[i] ?? 0), fmt(d.eqBehavioralByRater[i] ?? 0))
    }
    out.push(fmt(d.behavioralTotal))
    for (let i = 0; i < n; i++) {
      out.push(String(row.competencyRawByRater[i] ?? 0), fmt(d.eqCompetencyByRater[i] ?? 0))
    }
    out.push(fmt(d.competencyTotal), fmt(d.grandTotal), d.overallLabel)
    lines.push(out.map((v) => csvEscape(String(v))).join(','))
  }

  const csv = lines.join('\r\n')
  downloadBlob('koting-rater.csv', new Blob([csv], { type: 'text/csv;charset=utf-8' }))
}

