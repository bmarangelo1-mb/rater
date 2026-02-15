import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp, Settings2 } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import type { Settings } from '../types'

type Props = {
  settings: Settings
  onChange: (updater: (prev: Settings) => Settings) => void
}

function Field(props: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-white/60">{props.label}</span>
      {props.children}
    </label>
  )
}

function NumberInput(props: {
  value: number
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  step?: number
  min?: number
  max?: number
  onChange: (value: number) => void
}) {
  const step = props.step ?? 1
  const min = props.min
  const max = props.max

  function clamp(v: number) {
    let out = v
    if (typeof min === 'number') out = Math.max(min, out)
    if (typeof max === 'number') out = Math.min(max, out)
    return out
  }

  function nudge(delta: 1 | -1) {
    const cur = Number.isFinite(props.value) ? props.value : 0
    const next = clamp(cur + delta * step)
    // Avoid float noise for decimal steps.
    const normalized =
      step < 1 ? Number(next.toFixed(String(step).split('.')[1]?.length ?? 2)) : next
    props.onChange(normalized)
  }

  return (
    <div className="relative">
      <input
        className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 pr-9 text-right text-sm text-white outline-none transition focus:ring-2 focus:ring-sky-400/40"
        inputMode={props.inputMode ?? 'decimal'}
        value={Number.isFinite(props.value) ? props.value : 0}
        step={step}
        min={min}
        max={max}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
      <div className="absolute inset-y-0 right-1 flex flex-col justify-center">
        <button
          type="button"
          className="rounded-sm p-1 text-white/60 hover:bg-white/10 hover:text-white/90"
          onClick={() => nudge(1)}
          aria-label="Increment"
          tabIndex={-1}
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded-sm p-1 text-white/60 hover:bg-white/10 hover:text-white/90"
          onClick={() => nudge(-1)}
          aria-label="Decrement"
          tabIndex={-1}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function SettingsPanel({ settings, onChange }: Props) {
  const behavioralPct = Math.round(settings.behavioralWeight * 1000) / 10
  const competencyPct = Math.round(settings.competencyWeight * 1000) / 10

  return (
    <motion.div
      layout
      className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center gap-2">
        <div className="rounded-lg border border-white/10 bg-black/20 p-2">
          <Settings2 className="h-4 w-4 text-white/80" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white/90">Settings</div>
          <div className="text-xs text-white/60">
            Dynamic raters, divisors, weights, rows. Saved automatically.
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Field label="Number of raters (1–20)">
          <NumberInput
            value={settings.raters}
            inputMode="numeric"
            min={1}
            max={20}
            step={1}
            onChange={(v) => onChange((s) => ({ ...s, raters: v }))}
          />
        </Field>

        <Field label="Number of rows/items (≥1)">
          <NumberInput
            value={settings.rowsCount}
            inputMode="numeric"
            min={1}
            step={1}
            onChange={(v) => onChange((s) => ({ ...s, rowsCount: v }))}
          />
        </Field>

        <Field label="Behavioral columns (divisor)">
          <NumberInput
            value={settings.behavioralColumns}
            inputMode="numeric"
            min={1}
            step={1}
            onChange={(v) => onChange((s) => ({ ...s, behavioralColumns: v }))}
          />
        </Field>

        <Field label="Competency columns (divisor)">
          <NumberInput
            value={settings.competencyColumns}
            inputMode="numeric"
            min={1}
            step={1}
            onChange={(v) => onChange((s) => ({ ...s, competencyColumns: v }))}
          />
        </Field>

        <Field label={`Behavioral weight (${behavioralPct}%)`}>
          <NumberInput
            value={settings.behavioralWeight}
            step={0.01}
            min={0}
            onChange={(v) => onChange((s) => ({ ...s, behavioralWeight: v }))}
          />
        </Field>

        <Field label={`Competency weight (${competencyPct}%)`}>
          <NumberInput
            value={settings.competencyWeight}
            step={0.01}
            min={0}
            onChange={(v) => onChange((s) => ({ ...s, competencyWeight: v }))}
          />
        </Field>
      </div>

      <div className="mt-3 text-xs text-white/60">
        Weights are auto-normalized to sum to 1.0.
      </div>
    </motion.div>
  )
}

