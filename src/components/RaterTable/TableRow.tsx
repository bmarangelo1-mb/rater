import { RotateCcw } from 'lucide-react'
import { Fragment, useMemo } from 'react'
import { deriveRow, roundTo } from '../../lib/compute'
import type { RatingRow, Settings } from '../../types'

function fmt(n: number) {
  if (!Number.isFinite(n)) return ''
  // Excel-y feel: keep some precision but avoid noisy tails.
  const s = roundTo(n, 6).toFixed(6)
  return s.replace(/(?:\.0+|(?:(\.[0-9]*?)0+))$/, '$1')
}

function RawNumberInput(props: {
  value: number
  onCommit: (next: number) => void
  ariaLabel: string
  nav?: {
    rowIndex: number
    colKey: string
  }
}) {
  const text = props.value === 0 ? '' : String(props.value)

  return (
    <input
      className="w-[86px] rounded-md border border-white/10 bg-white/5 px-2 py-1 text-right text-sm text-white/90 outline-none ring-0 transition focus:border-sky-300/30 focus:bg-white/10 focus:ring-2 focus:ring-sky-400/30"
      inputMode="decimal"
      aria-label={props.ariaLabel}
      value={text}
      data-nav-row={props.nav?.rowIndex}
      data-nav-col={props.nav?.colKey}
      onChange={(e) => {
        const nextText = e.target.value
        const trimmed = nextText.trim()
        if (trimmed === '') {
          props.onCommit(0)
          return
        }
        const parsed = Number(trimmed)
        if (Number.isFinite(parsed)) props.onCommit(parsed)
      }}
      onKeyDown={(e) => {
        if (!props.nav) return
        if (e.key !== 'Enter') return
        e.preventDefault()
        const delta = e.shiftKey ? -1 : 1
        const nextRow = props.nav.rowIndex + delta
        const next = document.querySelector<HTMLInputElement>(
          `[data-nav-row="${nextRow}"][data-nav-col="${props.nav.colKey}"]`,
        )
        next?.focus()
        next?.select?.()
      }}
    />
  )
}

type Props = {
  rowIndex: number
  row: RatingRow
  settings: Settings
  onSetLabel: (rowId: string, label: string) => void
  onSetRawCell: (opts: {
    rowId: string
    section: 'behavioral' | 'competency'
    raterIndex: number
    value: number
  }) => void
  onResetRow: (rowId: string) => void
}

const tdBase = 'border border-white/10 px-2 py-1 align-middle'
const tdReadonly = 'bg-black/20 text-white/80'

export function TableRow({
  rowIndex,
  row,
  settings,
  onSetLabel,
  onSetRawCell,
  onResetRow,
}: Props) {
  const d = useMemo(() => deriveRow(row, settings), [row, settings])
  const n = settings.raters

  return (
    <tr className="group hover:bg-white/[0.04] focus-within:bg-white/[0.05]">
      <td className={`${tdBase} bg-black/10`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white/90"
            onClick={() => onResetRow(row.id)}
            title="Reset row"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <input
            className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white/90 outline-none transition focus:border-sky-300/30 focus:bg-white/10 focus:ring-2 focus:ring-sky-400/30"
            value={row.label}
            onChange={(e) => onSetLabel(row.id, e.target.value)}
            data-nav-row={rowIndex}
            data-nav-col="label"
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              const delta = e.shiftKey ? -1 : 1
              const nextRow = rowIndex + delta
              const next = document.querySelector<HTMLInputElement>(
                `[data-nav-row="${nextRow}"][data-nav-col="label"]`,
              )
              next?.focus()
              next?.select?.()
            }}
          />
        </div>
      </td>

      {Array.from({ length: n }, (_, i) => (
        <Fragment key={`b-pair-${row.id}-${i}`}>
          <td key={`b-raw-${row.id}-${i}`} className={tdBase}>
            <RawNumberInput
              value={row.behavioralRawByRater[i] ?? 0}
              ariaLabel={`Behavioral raw rater ${i + 1}`}
              nav={{ rowIndex, colKey: `b${i}` }}
              onCommit={(value) =>
                onSetRawCell({ rowId: row.id, section: 'behavioral', raterIndex: i, value })
              }
            />
          </td>
          <td key={`b-eq-${row.id}-${i}`} className={`${tdBase} ${tdReadonly}`}>
            <div className="w-[86px] text-right font-mono text-xs">
              {fmt(d.eqBehavioralByRater[i])}
            </div>
          </td>
        </Fragment>
      ))}
      <td className={`${tdBase} bg-sky-500/10 text-right font-mono text-xs text-white/90`}>
        <div className="w-[86px]">{fmt(d.behavioralTotal)}</div>
      </td>

      {Array.from({ length: n }, (_, i) => (
        <Fragment key={`c-pair-${row.id}-${i}`}>
          <td
            key={`c-raw-${row.id}-${i}`}
            className={`${tdBase} ${i === 0 ? 'border-l-2 border-l-white/20' : ''}`}
          >
            <RawNumberInput
              value={row.competencyRawByRater[i] ?? 0}
              ariaLabel={`Competency raw rater ${i + 1}`}
              nav={{ rowIndex, colKey: `c${i}` }}
              onCommit={(value) =>
                onSetRawCell({ rowId: row.id, section: 'competency', raterIndex: i, value })
              }
            />
          </td>
          <td key={`c-eq-${row.id}-${i}`} className={`${tdBase} ${tdReadonly}`}>
            <div className="w-[86px] text-right font-mono text-xs">
              {fmt(d.eqCompetencyByRater[i])}
            </div>
          </td>
        </Fragment>
      ))}
      <td className={`${tdBase} bg-emerald-500/10 text-right font-mono text-xs text-white/90`}>
        <div className="w-[86px]">{fmt(d.competencyTotal)}</div>
      </td>

      <td
        className={`${tdBase} border-l-2 border-l-white/20 bg-yellow-400/15 text-right font-mono text-xs text-white/95`}
      >
        <div className="w-[86px]">{fmt(d.grandTotal)}</div>
      </td>

      <td className={`${tdBase} bg-black/10 text-sm text-white/80`}>
        <div className="truncate">{d.overallLabel}</div>
      </td>
    </tr>
  )
}

