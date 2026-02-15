import { motion } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import type { Band } from '../types'

type Props = {
  bands: Band[]
  onChange: (bands: Band[]) => void
}

function BandRow(props: {
  band: Band
  idx: number
  onUpdate: (next: Band) => void
  onRemove: () => void
}) {
  return (
    <div className="grid grid-cols-12 items-center gap-2">
      <div className="col-span-3">
        <input
          className="w-full rounded-md border border-white/10 bg-black/20 px-2 py-1 text-right text-sm text-white/90 outline-none focus:ring-2 focus:ring-sky-400/30"
          inputMode="decimal"
          value={props.band.min}
          onChange={(e) => props.onUpdate({ ...props.band, min: Number(e.target.value) })}
        />
      </div>
      <div className="col-span-3">
        <input
          className="w-full rounded-md border border-white/10 bg-black/20 px-2 py-1 text-right text-sm text-white/90 outline-none focus:ring-2 focus:ring-sky-400/30"
          inputMode="decimal"
          value={props.band.max}
          onChange={(e) => props.onUpdate({ ...props.band, max: Number(e.target.value) })}
        />
      </div>
      <div className="col-span-5">
        <input
          className="w-full rounded-md border border-white/10 bg-black/20 px-2 py-1 text-sm text-white/90 outline-none focus:ring-2 focus:ring-sky-400/30"
          value={props.band.label}
          onChange={(e) => props.onUpdate({ ...props.band, label: e.target.value })}
        />
      </div>
      <div className="col-span-1 flex justify-end">
        <button
          type="button"
          className="rounded-md border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white/90"
          onClick={props.onRemove}
          title="Remove band"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function BandEditor({ bands, onChange }: Props) {
  return (
    <motion.div
      layout
      className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white/90">Over-all score bands</div>
          <div className="text-xs text-white/60">
            Map grand total to a label (inclusive min/max).
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
          onClick={() => onChange([...bands, { min: 0, max: 1, label: 'New band' }])}
        >
          <Plus className="h-4 w-4" />
          Add band
        </button>
      </div>

      <div className="mt-4 grid grid-cols-12 gap-2 text-xs font-semibold text-white/60">
        <div className="col-span-3 text-right">Min</div>
        <div className="col-span-3 text-right">Max</div>
        <div className="col-span-5">Label</div>
        <div className="col-span-1" />
      </div>

      <div className="mt-2 space-y-2">
        {bands.map((band, idx) => (
          <BandRow
            key={`${idx}-${band.label}`}
            band={band}
            idx={idx}
            onUpdate={(next) => onChange(bands.map((b, i) => (i === idx ? next : b)))}
            onRemove={() => onChange(bands.filter((_, i) => i !== idx))}
          />
        ))}
      </div>
    </motion.div>
  )
}

