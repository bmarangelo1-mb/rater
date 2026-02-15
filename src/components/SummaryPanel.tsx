import { Trophy } from 'lucide-react'
import { useMemo } from 'react'
import { deriveRow, roundTo } from '../lib/compute'
import type { RatingRow, Settings } from '../types'

type Props = {
  settings: Settings
  rows: RatingRow[]
}

function fmt(n: number) {
  return Number.isFinite(n) ? String(roundTo(n, 6)) : '-'
}

export function SummaryPanel({ settings, rows }: Props) {
  const summary = useMemo(() => {
    const derived = rows.map((r) => ({ row: r, d: deriveRow(r, settings) }))
    const best = derived.reduce(
      (acc, cur) => (cur.d.grandTotal > acc.d.grandTotal ? cur : acc),
      derived[0] ?? null,
    )

    const counts = new Map<string, number>()
    for (const it of derived) {
      const k = it.d.overallLabel || '(unmapped)'
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }

    return { best, counts }
  }, [rows, settings])

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="rounded-lg border border-white/10 bg-black/20 p-2">
          <Trophy className="h-4 w-4 text-yellow-200/90" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white/90">Summary</div>
          <div className="text-xs text-white/60">Live totals and band distribution.</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="text-xs font-semibold text-white/60">Highest grand total</div>
          {summary.best ? (
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <div className="truncate text-sm text-white/90">{summary.best.row.label}</div>
              <div className="font-mono text-sm font-semibold text-white/95">
                {fmt(summary.best.d.grandTotal)}
              </div>
            </div>
          ) : (
            <div className="mt-1 text-sm text-white/60">—</div>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="text-xs font-semibold text-white/60">Band counts</div>
          <div className="mt-2 space-y-1 text-sm text-white/80">
            {Array.from(summary.counts.entries()).map(([label, count]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <div className="truncate">{label}</div>
                <div className="font-mono text-white/90">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

