import { TableHeader } from './TableHeader'
import { TableRow } from './TableRow'
import type { RatingRow, Settings } from '../../types'

type Props = {
  settings: Settings
  rows: RatingRow[]
  onSetLabel: (rowId: string, label: string) => void
  onSetRawCell: (opts: {
    rowId: string
    section: 'behavioral' | 'competency'
    raterIndex: number
    value: number
  }) => void
  onResetRow: (rowId: string) => void
}

export function RaterTable({
  settings,
  rows,
  onSetLabel,
  onSetRawCell,
  onResetRow,
}: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 shadow-sm backdrop-blur">
      <div className="overflow-x-auto">
        <table className="min-w-max border-collapse text-sm">
          <TableHeader settings={settings} />
          <tbody>
            {rows.map((row, rowIndex) => (
              <TableRow
                key={row.id}
                rowIndex={rowIndex}
                row={row}
                settings={settings}
                onSetLabel={onSetLabel}
                onSetRawCell={onSetRawCell}
                onResetRow={onResetRow}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

