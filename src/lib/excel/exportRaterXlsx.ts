import * as ExcelJS from 'exceljs'
import type { RatingRow, Settings } from '../../types'
import { deriveRow, roundTo } from '../compute'
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

function pctLabel(weight: number) {
  const p = Math.round(weight * 100)
  return `${p}%`
}

const borderThin: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: '33FFFFFF' } },
  left: { style: 'thin', color: { argb: '33FFFFFF' } },
  bottom: { style: 'thin', color: { argb: '33FFFFFF' } },
  right: { style: 'thin', color: { argb: '33FFFFFF' } },
}

function applyBorder(ws: ExcelJS.Worksheet, r1: number, c1: number, r2: number, c2: number) {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      ws.getCell(r, c).border = borderThin
    }
  }
}

export async function exportRaterXlsx(opts: { settings: Settings; rows: RatingRow[] }) {
  const { settings, rows } = opts

  const wb = new ExcelJS.Workbook()
  wb.creator = "Zor's Rater"
  wb.created = new Date()
  const ws = wb.addWorksheet('Sheet1', {
    views: [{ state: 'frozen', ySplit: 2 }],
  })

  // Template-like offset: Behavioral begins at column D.
  const startCol = 4 // D
  const raters = Math.max(1, Math.floor(settings.raters))

  const behavioralStart = startCol
  const behavioralTotalCol = behavioralStart + raters * 2
  const competencyStart = behavioralTotalCol + 1
  const competencyTotalCol = competencyStart + raters * 2
  const grandTotalCol = competencyTotalCol + 1
  const overallCol = grandTotalCol + 1

  const lastDataRow = 2 + Math.max(1, Math.floor(settings.rowsCount))

  // Column Settings block placement: keep at 21 if <= 15 rows, else push down.
  const defaultBlockStart = 21
  const rowsStart = 3
  const blockStartRow =
    settings.rowsCount <= 15 ? defaultBlockStart : rowsStart + settings.rowsCount + 3

  const behavioralDivRow = blockStartRow + 3
  const competencyDivRow = blockStartRow + 4
  const bDivAbs = `$F$${behavioralDivRow}`
  const cDivAbs = `$F$${competencyDivRow}`

  // Set column widths (roughly template-ish).
  ws.getColumn(1).width = 3
  ws.getColumn(2).width = 3
  ws.getColumn(3).width = 3
  for (let c = startCol; c <= overallCol; c++) ws.getColumn(c).width = 13
  ws.getColumn(overallCol).width = 52

  // Header row 1 (group labels).
  ws.mergeCells(1, behavioralStart, 1, behavioralTotalCol)
  ws.getCell(1, behavioralStart).value = 'Behavioral'
  ws.getCell(1, behavioralStart).alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getCell(1, behavioralStart).font = { bold: true }
  ws.getCell(1, behavioralStart).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '3329B6F6' }, // light blue
  }

  ws.mergeCells(1, competencyStart, 1, competencyTotalCol)
  ws.getCell(1, competencyStart).value = 'Competency'
  ws.getCell(1, competencyStart).alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getCell(1, competencyStart).font = { bold: true }
  ws.getCell(1, competencyStart).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '3334D399' }, // light green
  }

  // Header row 2 (detailed columns).
  const eqBText = `Eq. Rate (${pctLabel(settings.behavioralWeight)})`
  const eqCText = `Eq. Rate (${pctLabel(settings.competencyWeight)})`

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

  // Style header row 2.
  for (let c = behavioralStart; c <= overallCol; c++) {
    const cell = ws.getCell(2, c)
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.font = { bold: true, size: 10 }
    if (c <= behavioralTotalCol) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: c === behavioralTotalCol ? '3329B6F6' : '1F29B6F6' },
      }
    } else if (c <= competencyTotalCol) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: c === competencyTotalCol ? '3334D399' : '1F34D399' },
      }
    } else if (c === grandTotalCol) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '33FACC15' } }
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1AFFFFFF' } }
    }
  }

  // Data rows with formulas.
  const bw = roundTo(settings.behavioralWeight, 6)
  const cw = roundTo(settings.competencyWeight, 6)

  for (let rIdx = 0; rIdx < rows.length; rIdx++) {
    const excelRow = 3 + rIdx
    const row = rows[rIdx]
    const d = deriveRow(row, settings)

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

    // Over-all score label (value, not formula).
    ws.getCell(excelRow, overallCol).value = d.overallLabel

    // Alignment / formats
    for (let c = behavioralStart; c <= overallCol; c++) {
      const cell = ws.getCell(excelRow, c)
      if (c === overallCol) {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: false }
        continue
      }
      cell.alignment = { horizontal: 'right', vertical: 'middle' }
      if (c === grandTotalCol) {
        cell.numFmt = '0.000000'
      } else if (c === behavioralTotalCol || c === competencyTotalCol) {
        cell.numFmt = '0.000000'
      } else if ((c - behavioralStart) % 2 === 1 && c <= behavioralTotalCol) {
        // Behavioral eq columns
        cell.numFmt = '0.000000'
      } else if ((c - competencyStart) % 2 === 1 && c >= competencyStart && c <= competencyTotalCol) {
        // Competency eq columns
        cell.numFmt = '0.000000'
      } else {
        cell.numFmt = '0.0'
      }
    }
  }

  // Column Settings block (template wording + merges + divisor values at Fxx).
  ws.mergeCells(blockStartRow, 4, blockStartRow + 1, 7) // D..G, 2 rows
  ws.getCell(blockStartRow, 4).value = 'Column Settings'
  ws.getCell(blockStartRow, 4).font = { bold: true }
  ws.getCell(blockStartRow, 4).alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getCell(blockStartRow, 4).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1AFFFFFF' },
  }

  ws.mergeCells(blockStartRow + 2, 6, blockStartRow + 2, 7) // F..G
  ws.getCell(blockStartRow + 2, 6).value = 'Number of Columns'
  ws.getCell(blockStartRow + 2, 6).font = { bold: true }
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

  // Borders across used grid area + settings block.
  const gridR1 = 1
  const gridC1 = behavioralStart
  const gridR2 = Math.max(lastDataRow, blockStartRow + 4)
  const gridC2 = overallCol
  applyBorder(ws, gridR1, gridC1, gridR2, gridC2)
  applyBorder(ws, blockStartRow, 4, blockStartRow + 4, 7)

  // Slightly thicker separators (visual grouping).
  for (let r = 1; r <= gridR2; r++) {
    ws.getCell(r, competencyStart).border = {
      ...ws.getCell(r, competencyStart).border,
      left: { style: 'medium', color: { argb: '55FFFFFF' } },
    }
    ws.getCell(r, grandTotalCol).border = {
      ...ws.getCell(r, grandTotalCol).border,
      left: { style: 'medium', color: { argb: '55FFFFFF' } },
    }
  }

  const buf = await wb.xlsx.writeBuffer()
  downloadBlob(
    'zors-rater.xlsx',
    new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  )
}

