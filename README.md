## Zor's Rater (Excel-like)

Single-page rater sheet app that mimics the provided `rater6.xlsx` / `rater7.xlsx` workflow with:

- Dynamic **Number of Raters** (1–20)
- Dynamic **Behavioral/Competency column divisors** (used in Eq. formulas)
- Instant computations + spreadsheet-like UI
- LocalStorage persistence (no backend)
- **Export to Excel (.xlsx)** with merged headers + formulas (ExcelJS)

### Tech stack

- React + Vite + TypeScript
- Tailwind CSS
- `lucide-react` (icons)
- `framer-motion` (subtle UI motion)
- `exceljs` (styled `.xlsx` export with formulas)

### Run locally

```bash
npm install
npm run dev
```

### Data model

Stored in LocalStorage under key `zors-rater.appState.v1` (will also read legacy `koting-rater.appState.v1`):

- `settings`
  - `raters`
  - `rowsCount`
  - `behavioralColumns`
  - `competencyColumns`
  - `behavioralWeight`
  - `competencyWeight`
  - `bands[]` (`min/max/label`)
- `rows[]`
  - `id`, `label`
  - `behavioralRawByRater: number[]`
  - `competencyRawByRater: number[]`

Derived values (Eq/Total/Grand Total) are computed on render and **not** stored.

### Computation formulas (in-app)

For each row, for each rater:

- Behavioral equivalent:
  - `eqB = (rawB / behavioralColumns) * behavioralWeight`
- Competency equivalent:
  - `eqC = (rawC / competencyColumns) * competencyWeight`
- Totals:
  - `behavioralTotal = average(eqB across raters)`
  - `competencyTotal = average(eqC across raters)`
- Final:
  - `grandTotal = behavioralTotal + competencyTotal`
- Empty inputs are treated as `0`.

### Keyboard navigation

- **Tab / Shift+Tab**: default browser tab order across editable cells
- **Enter / Shift+Enter**: move down/up within the same editable “column” (label column, each rater raw column)

### Export CSV

Exports the currently visible sheet values (raw + derived values) to `zors-rater.csv`.

### Export Excel (.xlsx) template matching

Excel export is implemented in [`src/lib/excel/exportRaterXlsx.ts`](src/lib/excel/exportRaterXlsx.ts) and mirrors the provided templates:

- Worksheet name: **`Sheet1`**
- Table starts at **column D** (to match the templates’ layout)
- Header rows:
  - Row 1: merged group headers `Behavioral` and `Competency`
  - Row 2: repeating `Rater k`, `Eq. Rate (...)`, then `TOTAL`, then `GRAND TOTAL (Behavioral + Competency)`, then the long `OVER-ALL SCORE ...` text
- **Column Settings** block:
  - Merged header cell: `Column Settings`
  - `Number of Columns` label
  - `Behavioral (30%)` + divisor value
  - `Compentency (70%)` + divisor value (typo kept to match the template)

#### Excel formulas

Eq cell formulas use absolute references to the divisor cells in the Column Settings block:

- Behavioral Eq (per row, per rater):
  - `=SUM(<RawCell>/$F$<BehavioralDivRow>)*0.3` (template-style)
- Competency Eq:
  - `=SUM(<RawCell>/$F$<CompetencyDivRow>)*0.7` (template-style)
- Behavioral TOTAL:
  - `=SUM(<all behavioral eq cells>)/<raters>`
- Competency TOTAL:
  - `=SUM(<all competency eq cells>)/<raters>`
- GRAND TOTAL:
  - `=SUM(<competencyTotalCell>+<behavioralTotalCell>)`

The **Over-all score** column is left blank in the exported Excel to match the provided templates.

#### Column Settings placement

To match the templates’ spacing:

- If `rowsCount <= 15`, Column Settings starts at **row 21** (like the provided files).
- If `rowsCount > 15`, the block is pushed down to keep a small gap below the data rows, and the exported formulas’ absolute references are updated accordingly.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
