import { Fragment } from 'react'
import type { Settings } from '../../types'

type Props = {
  settings: Settings
}

const thBase =
  'border border-white/10 px-2 py-2 text-center text-xs font-semibold text-white/80 backdrop-blur'

export function TableHeader({ settings }: Props) {
  const n = settings.raters
  const behavioralCols = n * 2 + 1
  const competencyCols = n * 2 + 1
  const bPct = Math.round(settings.behavioralWeight * 1000) / 10
  const cPct = Math.round(settings.competencyWeight * 1000) / 10

  return (
    <thead className="select-none">
      <tr>
        <th
          rowSpan={2}
          className={`${thBase} sticky top-0 z-30 w-[220px] bg-black/30`}
        >
          Item
        </th>

        <th
          colSpan={behavioralCols}
          className={`${thBase} sticky top-0 z-30 bg-sky-500/20 text-white/90`}
        >
          BEHAVIORAL ({bPct}%)
        </th>

        <th
          colSpan={competencyCols}
          className={`${thBase} sticky top-0 z-30 border-l-2 border-l-white/20 bg-emerald-500/20 text-white/90`}
        >
          COMPETENCY ({cPct}%)
        </th>

        <th
          rowSpan={2}
          className={`${thBase} sticky top-0 z-30 border-l-2 border-l-white/20 bg-yellow-400/20 text-white/95`}
        >
          GRAND TOTAL
        </th>

        <th
          rowSpan={2}
          className={`${thBase} sticky top-0 z-30 w-[340px] bg-black/30`}
        >
          OVER-ALL SCORE (PERSONAL CHARACTERISTICS AND PERSONALITY TRAITS)
        </th>
      </tr>

      <tr>
        {Array.from({ length: n }, (_, i) => {
          const idx = i + 1
          return (
            <Fragment key={`b-pair${idx}`}>
              <th
                className={`${thBase} sticky top-9 z-20 bg-sky-500/15`}
              >
                Rater {idx}
              </th>
              <th
                className={`${thBase} sticky top-9 z-20 bg-sky-500/10 text-white/70`}
              >
                Eq. Rate ({bPct}%)
              </th>
            </Fragment>
          )
        })}
        <th
          className={`${thBase} sticky top-9 z-20 bg-sky-500/25 text-white/90`}
        >
          TOTAL
        </th>

        {Array.from({ length: n }, (_, i) => {
          const idx = i + 1
          return (
            <Fragment key={`c-pair${idx}`}>
              <th
                className={`${thBase} sticky top-9 z-20 ${i === 0 ? 'border-l-2 border-l-white/20' : ''} bg-emerald-500/15`}
              >
                Rater {idx}
              </th>
              <th
                className={`${thBase} sticky top-9 z-20 bg-emerald-500/10 text-white/70`}
              >
                Eq. Rate ({cPct}%)
              </th>
            </Fragment>
          )
        })}
        <th
          className={`${thBase} sticky top-9 z-20 bg-emerald-500/25 text-white/90`}
        >
          TOTAL
        </th>
      </tr>
    </thead>
  )
}

