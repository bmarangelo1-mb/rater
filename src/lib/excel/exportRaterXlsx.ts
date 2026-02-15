import * as ExcelJS from 'exceljs'
import type { RatingRow, Settings } from '../../types'
import { downloadBlob } from '../download'

function colToLetter(col: number) {
  let n = col
  let s = ''
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

function addr(row: number, col: number) {
  return `${colToLetter(col)}${row}`
}

const BLACK = 'FF000000'
const greenFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 11, color: { argb: 'FF00B050' } }
const normalFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 11 }
const headerFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 11 }
const groupFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 18, bold: true }
type BorderSide = { style: ExcelJS.BorderStyle; color: { argb: string } }
const thin: BorderSide = { style: 'thin', color: { argb: BLACK } }
const medium: BorderSide = { style: 'medium', color: { argb: BLACK } }

function setTemplateColumnWidths(ws: ExcelJS.Worksheet, overallCol: number) {
  // Matches template column widths observed in rater6/rater7.
  const setRange = (min: number, max: number, width: number) => {
    for (let c = min; c <= max; c++) ws.getColumn(c).width = width
  }

  // A..D
  setRange(1, 4, 8.71)
  // E
  if (overallCol >= 5) ws.getColumn(5).width = 9.43
  // F
  if (overallCol >= 6) ws.getColumn(6).width = 8.71
  // G
  if (overallCol >= 7) ws.getColumn(7).width = 10.14
  // H..(overallCol-2)
  if (overallCol - 2 >= 8) setRange(8, overallCol - 2, 8.71)
  // grand total / over-all score widths
  if (overallCol >= 2) ws.getColumn(overallCol - 1).width = 15.14
  ws.getColumn(overallCol).width = 20.14
}

function borderBox(opts: {
  left?: BorderSide
  right?: BorderSide
  top?: BorderSide
  bottom?: BorderSide
}): Partial<ExcelJS.Borders> {
  return {
    left: opts.left,
    right: opts.right,
    top: opts.top,
    bottom: opts.bottom,
  }
}

function applyBorderToRange(
  ws: ExcelJS.Worksheet,
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  getBorder: (r: number, c: number) => Partial<ExcelJS.Borders>,
) {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      ws.getCell(r, c).border = getBorder(r, c)
    }
  }
}

export async function exportRaterXlsx(opts: { settings: Settings; rows: RatingRow[] }) {
  const { settings, rows } = opts

  const wb = new ExcelJS.Workbook()
  wb.creator = "Zor's Rater"
  wb.created = new Date()
  const ws = wb.addWorksheet('Sheet1')

  // Template-like offset: Behavioral begins at column D.
  const startCol = 4 // D
  const raters = Math.max(1, Math.floor(settings.raters))

  const behavioralStart = startCol
  const behavioralTotalCol = behavioralStart + raters * 2
  const competencyStart = behavioralTotalCol + 1
  const competencyTotalCol = competencyStart + raters * 2
  const grandTotalCol = competencyTotalCol + 1
  const overallCol = grandTotalCol + 1

  // Column Settings block placement: keep at 21 if <= 15 rows, else push down.
  const defaultBlockStart = 21
  const rowsStart = 3
  const blockStartRow =
    settings.rowsCount <= 15 ? defaultBlockStart : rowsStart + settings.rowsCount + 3

  const behavioralDivRow = blockStartRow + 3
  const competencyDivRow = blockStartRow + 4
  const bDivAbs = `$F$${behavioralDivRow}`
  const cDivAbs = `$F$${competencyDivRow}`

  // Column widths and row heights (match template).
  setTemplateColumnWidths(ws, overallCol)
  ws.getRow(1).height = 30.75
  ws.getRow(2).height = 88.5
  // Column Settings rows in the template are 21..25 (custom heights).
  ws.getRow(blockStartRow).height = 15.75
  ws.getRow(blockStartRow + 1).height = 15.75
  ws.getRow(blockStartRow + 2).height = 18.0
  ws.getRow(blockStartRow + 3).height = 15.75
  ws.getRow(blockStartRow + 4).height = 15.75

  // Header row 1 (group labels).
  const behavioralGroupEnd = Math.min(behavioralStart + 7, behavioralTotalCol)
  const competencyGroupEnd = Math.min(competencyStart + 7, competencyTotalCol)

  ws.mergeCells(1, behavioralStart, 1, behavioralGroupEnd)
  ws.getCell(1, behavioralStart).value = 'Behavioral'
  ws.getCell(1, behavioralStart).alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getCell(1, behavioralStart).font = groupFont

  ws.mergeCells(1, competencyStart, 1, competencyGroupEnd)
  ws.getCell(1, competencyStart).value = 'Competency'
  ws.getCell(1, competencyStart).alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getCell(1, competencyStart).font = groupFont

  // Header row 2 (detailed columns).
  // Template uses fixed 30% / 70% wording.
  const eqBText = 'Eq. Rate (30%)'
  const eqCText = 'Eq. Rate (70%)'

  for (let i = 0; i < raters; i++) {
    const rawCol = behavioralStart + i * 2
    const eqCol = rawCol + 1
    ws.getCell(2, rawCol).value = `Rater ${i + 1}`
    ws.getCell(2, eqCol).value = eqBText
  }
  ws.getCell(2, behavioralTotalCol).value = 'TOTAL'

  for (let i = 0; i < raters; i++) {
    const rawCol = competencyStart + i * 2
    const eqCol = rawCol + 1
    ws.getCell(2, rawCol).value = `Rater ${i + 1}`
    ws.getCell(2, eqCol).value = eqCText
  }
  ws.getCell(2, competencyTotalCol).value = 'TOTAL'
  ws.getCell(2, grandTotalCol).value = 'GRAND TOTAL (Behavioral + Competency)'
  ws.getCell(2, overallCol).value =
    'OVER-ALL SCORE (PERSONAL CHARACTERISTICS AND PERSONALITY TRAITS) Please refer to table'

  // Header styles (template-like: Calibri 11, wrapped, black borders; totals text in green).
  for (let c = behavioralStart; c <= overallCol; c++) {
    const cell = ws.getCell(2, c)
    cell.font =
      c === behavioralTotalCol || c === competencyTotalCol ? greenFont : headerFont
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  }

  // Data rows with formulas.
  // Template uses fixed *0.3 and *0.7 multipliers.
  const bw = 0.3
  const cw = 0.7

  for (let rIdx = 0; rIdx < rows.length; rIdx++) {
    const excelRow = 3 + rIdx
    const row = rows[rIdx]

    // Behavioral raw + eq
    const behavioralEqAddrs: string[] = []
    for (let i = 0; i < raters; i++) {
      const rawCol = behavioralStart + i * 2
      const eqCol = rawCol + 1
      ws.getCell(excelRow, rawCol).value = row.behavioralRawByRater[i] ?? 0
      const rawAddr = addr(excelRow, rawCol)
      const eqAddr = addr(excelRow, eqCol)
      behavioralEqAddrs.push(eqAddr)
      ws.getCell(excelRow, eqCol).value = {
        formula: `SUM(${rawAddr}/${bDivAbs})*${bw}`,
      }
    }

    // Behavioral total
    const bTotalCell = ws.getCell(excelRow, behavioralTotalCol)
    bTotalCell.value = {
      formula: `SUM(${behavioralEqAddrs.join('+')})/${raters}`,
    }

    // Competency raw + eq
    const competencyEqAddrs: string[] = []
    for (let i = 0; i < raters; i++) {
      const rawCol = competencyStart + i * 2
      const eqCol = rawCol + 1
      ws.getCell(excelRow, rawCol).value = row.competencyRawByRater[i] ?? 0
      const rawAddr = addr(excelRow, rawCol)
      const eqAddr = addr(excelRow, eqCol)
      competencyEqAddrs.push(eqAddr)
      ws.getCell(excelRow, eqCol).value = {
        formula: `SUM(${rawAddr}/${cDivAbs})*${cw}`,
      }
    }

    // Competency total
    const cTotalCell = ws.getCell(excelRow, competencyTotalCol)
    cTotalCell.value = {
      formula: `SUM(${competencyEqAddrs.join('+')})/${raters}`,
    }

    // Grand total
    const gTotalCell = ws.getCell(excelRow, grandTotalCol)
    gTotalCell.value = {
      formula: `SUM(${addr(excelRow, competencyTotalCol)}+${addr(excelRow, behavioralTotalCol)})`,
    }

    // Over-all score column is blank in the provided templates (keep layout).
    ws.getCell(excelRow, overallCol).value = ''

    // Alignment / formats (template uses centered numbers and 0.000 for eq/totals).
    for (let c = behavioralStart; c <= overallCol; c++) {
      const cell = ws.getCell(excelRow, c)
      if (c === overallCol) {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        continue
      }
      cell.font = normalFont
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      const isBehavioralEq = c >= behavioralStart && c <= behavioralTotalCol && (c - behavioralStart) % 2 === 1
      const isCompetencyEq = c >= competencyStart && c <= competencyTotalCol && (c - competencyStart) % 2 === 1
      const isTotal =
        c === behavioralTotalCol || c === competencyTotalCol || c === grandTotalCol
      if (isBehavioralEq || isCompetencyEq || isTotal) {
        cell.numFmt = '0.000'
      }
    }
  }

  // Column Settings block (template wording + merges + divisor values at Fxx).
  ws.mergeCells(blockStartRow, 4, blockStartRow + 1, 7) // D..G, 2 rows
  ws.getCell(blockStartRow, 4).value = 'Column Settings'
  ws.getCell(blockStartRow, 4).font = groupFont
  ws.getCell(blockStartRow, 4).alignment = { horizontal: 'center', vertical: 'middle' }

  ws.mergeCells(blockStartRow + 2, 6, blockStartRow + 2, 7) // F..G
  ws.getCell(blockStartRow + 2, 6).value = 'Number of Columns'
  ws.getCell(blockStartRow + 2, 6).font = headerFont
  ws.getCell(blockStartRow + 2, 6).alignment = { horizontal: 'center', vertical: 'middle' }

  ws.mergeCells(blockStartRow + 3, 4, blockStartRow + 3, 5) // D..E
  ws.getCell(blockStartRow + 3, 4).value = 'Behavioral (30%)'
  ws.getCell(blockStartRow + 3, 4).alignment = { horizontal: 'left', vertical: 'middle' }
  ws.getCell(blockStartRow + 3, 6).value = settings.behavioralColumns
  ws.getCell(blockStartRow + 3, 6).numFmt = '0.0'

  ws.mergeCells(blockStartRow + 4, 4, blockStartRow + 4, 5) // D..E
  ws.getCell(blockStartRow + 4, 4).value = 'Compentency (70%)'
  ws.getCell(blockStartRow + 4, 4).alignment = { horizontal: 'left', vertical: 'middle' }
  ws.getCell(blockStartRow + 4, 6).value = settings.competencyColumns
  ws.getCell(blockStartRow + 4, 6).numFmt = '0.0'

  // Borders (match template look: black thin grid with some medium separators).
  const dataRowCount = Math.max(1, Math.floor(settings.rowsCount))
  const lastDataRow = 2 + dataRowCount
  const lastRowUsed = Math.max(lastDataRow, blockStartRow + 4)

  // Row 1 borders exist only on the merged group headers in the templates.
  applyBorderToRange(ws, 1, behavioralStart, 1, behavioralGroupEnd, (_r, c) => {
    const left = c === behavioralStart ? medium : thin
    return borderBox({ left, top: medium, bottom: thin })
  })
  applyBorderToRange(ws, 1, competencyStart, 1, competencyGroupEnd, (_r, c) => {
    const left = c === competencyStart ? medium : thin
    return borderBox({ left, top: medium, bottom: thin })
  })

  // Main grid (row 2+): black thin grid with medium separators.
  applyBorderToRange(ws, 2, behavioralStart, lastRowUsed, overallCol, (_r, c) => {
    let left = thin
    let right = thin
    const top = thin
    const bottom = thin

    if (c === behavioralStart) left = medium
    if (c === competencyStart) left = medium
    if (c === behavioralTotalCol) right = medium
    if (c === competencyTotalCol) right = medium
    if (c === overallCol) right = medium

    return borderBox({ left, right, top, bottom })
  })

  // Column settings block has a medium top border on some cells in the templates.
  // Ensure top border medium for the block's title row and a medium bottom on the last row.
  applyBorderToRange(ws, blockStartRow, 4, blockStartRow + 4, 7, (r, c) => {
    let left = thin
    const right = thin
    let top = thin
    let bottom = thin
    if (c === 4) left = medium
    if (r === blockStartRow) top = medium
    if (r === blockStartRow + 4) bottom = medium
    return borderBox({ left, right, top, bottom })
  })

  const buf = await wb.xlsx.writeBuffer()
  downloadBlob(
    'zors-rater.xlsx',
    new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  )
}

