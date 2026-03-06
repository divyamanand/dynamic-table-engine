import { ITable } from '../interfaces/table/table.inteface'
import { ICell } from '../interfaces/core/cell.interface'
import { Region } from '../types'
import {
  RenderableCell,
  RenderableRow,
  RenderableColumn,
  RenderableMerge,
  RenderableTableInstance,
} from './types/renderable-types'

/**
 * RenderableTable is an adapter that converts your dynamic Table (Facade)
 * into a renderable instance optimized for PDF/HTML rendering.
 *
 * Flow:
 * Table (facade) → RenderableTable.create() → RenderableTableInstance
 *                                                        ↓
 *                                         pdfRender / uiRender
 *
 * The wrapper extracts data from all Table engines and organizes it
 * in a flat, rendering-friendly structure.
 */
export class RenderableTable {
  /**
   * Convert a Table instance into a RenderableTableInstance
   *
   * This extracts:
   * - All cells from all regions (theader, lheader, rheader, footer, body)
   * - Calculated layouts from layout engine
   * - Rule evaluation results
   * - Merge information
   * - Settings and styles
   */
  static create(table: ITable): RenderableTableInstance {
    const settings = table.getSettings()
    const columnWidths = table.getColumnWidths()
    const rowHeights = table.getRowHeights()
    const tablePosition = table.getTablePosition()

    // Step 1: Initialize collections
    const cellsById = new Map<string, RenderableCell>()
    const evaluationResults = new Map<string, any>()

    const regions = {
      theader: [] as RenderableRow[],
      lheader: [] as RenderableRow[],
      rheader: [] as RenderableRow[],
      footer: [] as RenderableRow[],
      body: [] as RenderableRow[],
    }

    // Step 2: Iterate through all cells and organize by region
    // Since Table stores cells by ID and we need to iterate by region,
    // we need to extract all cells and group them

    // We'll build the regions by getting cells from the table
    // The table has a complete grid that we can use as reference

    const completeGrid = table.getCompleteGrid()

    // Map to track which cells belong to which region
    const cellsByRegion = new Map<Region, Map<number, RenderableCell[]>>()
    const regionList: Region[] = ['theader', 'lheader', 'rheader', 'footer', 'body']

    for (const region of regionList) {
      cellsByRegion.set(region, new Map())
    }

    // Extract all cells and group by region
    let rowIndexByRegion: Record<Region, number> = {
      theader: 0,
      lheader: 0,
      rheader: 0,
      footer: 0,
      body: 0,
    }

    // Iterate through rows and columns to build regions
    for (let rowIdx = 0; rowIdx < rowHeights.length; rowIdx++) {
      const rowCellsByRegion: Record<Region, RenderableCell[]> = {
        theader: [],
        lheader: [],
        rheader: [],
        footer: [],
        body: [],
      }

      for (let colIdx = 0; colIdx < columnWidths.length; colIdx++) {
        // Try to get cell at this address
        const cell = table.getCellByAddress(rowIdx, colIdx)

        if (cell) {
          const renderableCell = this.convertCell(cell, table, evaluationResults)
          cellsById.set(cell.cellID, renderableCell)

          // Add to the appropriate region
          const region = cell.inRegion
          if (rowCellsByRegion[region]) {
            rowCellsByRegion[region].push(renderableCell)
          }
        }
      }

      // Build rows for each region that has cells in this row index
      for (const region of regionList) {
        if (rowCellsByRegion[region].length > 0) {
          const cells = new Map<number, RenderableCell>()
          const rawValues: (string | number)[] = []
          let colIdx = 0

          for (const cell of rowCellsByRegion[region]) {
            cells.set(colIdx, cell)
            rawValues.push(cell.rawValue)
            colIdx++
          }

          regions[region].push({
            rowIndex: rowIndexByRegion[region],
            region,
            height: rowHeights[rowIdx] || 20,
            cells,
            rawValues,
          })

          rowIndexByRegion[region]++
        }
      }
    }

    // Step 3: Create columns
    const columns: RenderableColumn[] = columnWidths.map((width, idx) => ({
      colIndex: idx,
      width,
      alignment: settings.columnStyles?.alignment?.[idx],
    }))

    // Step 4: Extract merges
    const mergeSet = table.getMerges()
    const merges: RenderableMerge[] = Array.from(mergeSet.values()).map((rect) => ({
      cellID: rect.cellId,
      startRow: rect.startRow,
      startCol: rect.startCol,
      endRow: rect.endRow,
      endCol: rect.endCol,
      primaryRegion: rect.primaryRegion || 'body',
    }))

    // Step 5: Calculate dimensions
    const getHeadHeight = (): number => {
      return (
        (regions.theader.reduce((sum, row) => sum + row.height, 0) || 0) +
        (regions.lheader.reduce((sum, row) => sum + row.height, 0) || 0) +
        (regions.rheader.reduce((sum, row) => sum + row.height, 0) || 0)
      )
    }

    const getBodyHeight = (): number => {
      return regions.body.reduce((sum, row) => sum + row.height, 0) || 0
    }

    const getFooterHeight = (): number => {
      return regions.footer.reduce((sum, row) => sum + row.height, 0) || 0
    }

    const getWidth = (): number => {
      return columns.reduce((sum, col) => sum + col.width, 0) || 0
    }

    // Step 6: Combine into instance
    const instance: RenderableTableInstance = {
      settings,
      tableStyles: settings.tableStyles || { borderColor: '#000', borderWidth: 0.1 },
      columns,
      regions,
      cellsById,
      merges,
      evaluationResults,

      // Helper methods
      getCellAt(row: number, col: number, region: Region): RenderableCell | undefined {
        const rows = this.regions[region]
        return rows[row]?.cells.get(col)
      },

      getCellByID(cellID: string): RenderableCell | undefined {
        return this.cellsById.get(cellID)
      },

      getRowsInRegion(region: Region): RenderableRow[] {
        return this.regions[region]
      },

      getWidth(): number {
        return getWidth()
      },

      getHeight(): number {
        return getHeadHeight() + getBodyHeight() + getFooterHeight()
      },

      getHeadHeight(): number {
        return getHeadHeight()
      },

      getBodyHeight(): number {
        return getBodyHeight()
      },

      getFooterHeight(): number {
        return getFooterHeight()
      },
    }

    return instance
  }

  /**
   * Check if cell belongs to a specific region
   */
  private static isCellInRegion(cell: ICell, region: Region): boolean {
    return cell.inRegion === region
  }

  /**
   * Convert ICell to RenderableCell with all calculated properties
   */
  private static convertCell(
    cell: ICell,
    table: ITable,
    evaluationResults: Map<string, any>
  ): RenderableCell {
    // Get evaluation result if cell is dynamic
    const evalResult = cell.isDynamic ? table.getEvaluationResult(cell.cellID) : undefined

    if (evalResult) {
      evaluationResults.set(cell.cellID, evalResult)
    }

    return {
      cellID: cell.cellID,
      rawValue: cell.rawValue,
      computedValue: cell.computedValue,
      layout: cell.layout!,  // Layout engine calculated this
      style: cell.style,
      inRegion: cell.inRegion,
      evaluationResult: evalResult,
      isDynamic: cell.isDynamic,
      mergeRect: undefined,  // Will be set from merge registry if needed
    }
  }
}
