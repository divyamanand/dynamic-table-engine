/**
 * Merge and Unmerge Feature Tests
 *
 * Tests the complete merge/unmerge workflow:
 * 1. Create a merge - cells span multiple rows/columns
 * 2. Unmerge - cells return to individual 1x1 layout
 * 3. Verify layout rebuilds correctly after unmerge
 */

import { Table } from '../../../core/table'
import { StructureStore } from '../../../stores/structure.store'
import { CellRegistry } from '../../../stores/cell-registry.store'
import { MergeRegistry } from '../../../stores/merge-registry.stores'
import { LayoutEngine } from '../../../engines/layout.engine'
import { RuleEngine } from '../../../rules/rule-engine'
import { RuleRegistry } from '../../../rules/rule-registry'
import { Rect } from '../../../types/common'

describe('Merge and Unmerge Feature', () => {
  let table: Table
  let structureStore: StructureStore
  let cellRegistry: CellRegistry
  let mergeRegistry: MergeRegistry
  let layoutEngine: LayoutEngine
  let ruleRegistry: RuleRegistry
  let ruleEngine: RuleEngine

  beforeEach(() => {
    structureStore = new StructureStore()
    cellRegistry = new CellRegistry()
    mergeRegistry = new MergeRegistry(structureStore)
    layoutEngine = new LayoutEngine(mergeRegistry, structureStore, cellRegistry)
    ruleRegistry = new RuleRegistry()

    // Create temporary table for rule engine initialization
    table = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, {} as any)

    // Create rule engine
    ruleEngine = new RuleEngine(ruleRegistry, cellRegistry, structureStore, table)

    // Create final table with rule engine
    table = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, ruleEngine)

    // Add header cells to establish column count (required for buildBody)
    table.addHeaderCell('theader')
    table.addHeaderCell('theader')
    table.addHeaderCell('theader')

    // Create a simple 3x3 body
    table.buildBody([
      ['A1', 'B1', 'C1'],
      ['A2', 'B2', 'C2'],
      ['A3', 'B3', 'C3'],
    ])
  })

  describe('Merge Cells', () => {
    it('should merge a 2x2 rectangle of cells', () => {
      // Get the root cell of the merge (top-left cell)
      const grid = table.getCompleteGrid()
      const rootCellId = grid[0][0] // First cell in body

      // Create merge: covers rows 0-1, cols 0-1 of body
      const mergeRect: Rect = {
        cellId: rootCellId,
        startRow: 0,
        startCol: 0,
        endRow: 1,
        endCol: 1,
        primaryRegion: 'body',
      }

      table.mergeCells(mergeRect)

      // Verify merge exists by checking cell layout
      const cell = table.getCellById(rootCellId)
      expect(cell?.layout?.rowSpan).toBe(2)
      expect(cell?.layout?.colSpan).toBe(2)
    })

    it('should create multiple independent merges', () => {
      const grid = table.getCompleteGrid()
      const cell1 = grid[0][0]
      const cell2 = grid[0][2] // Different merge area

      // Merge 1: 2x1 in rows 0-1, col 0
      const merge1: Rect = {
        cellId: cell1,
        startRow: 0,
        startCol: 0,
        endRow: 1,
        endCol: 0,
        primaryRegion: 'body',
      }

      // Merge 2: 1x2 in row 2, cols 1-2
      const merge2: Rect = {
        cellId: cell2,
        startRow: 2,
        startCol: 1,
        endRow: 2,
        endCol: 2,
        primaryRegion: 'body',
      }

      table.mergeCells(merge1)
      table.mergeCells(merge2)

      // Both merges should exist
      const cell1After = table.getCellById(cell1)
      const cell2After = table.getCellById(cell2)

      expect(cell1After?.layout?.rowSpan).toBe(2)
      expect(cell2After?.layout?.colSpan).toBe(2)
    })
  })

  describe('Unmerge Cells', () => {
    it('should unmerge a previously merged cell', () => {
      const grid = table.getCompleteGrid()
      const rootCellId = grid[0][0]

      // First create a merge
      const mergeRect: Rect = {
        cellId: rootCellId,
        startRow: 0,
        startCol: 0,
        endRow: 1,
        endCol: 1,
        primaryRegion: 'body',
      }

      table.mergeCells(mergeRect)

      // Now unmerge using the root cell ID
      table.unmergeCells(rootCellId)

      // After unmerge, the cell should have layout of 1x1
      const cell = table.getCellById(rootCellId)
      expect(cell?.layout?.rowSpan).toBe(1)
      expect(cell?.layout?.colSpan).toBe(1)
    })

    it('should restore individual cell rendering after unmerge', () => {
      const grid = table.getCompleteGrid()
      const cell1Id = grid[0][0]
      const cell2Id = grid[0][1]
      const cell3Id = grid[1][0]
      const cell4Id = grid[1][1]

      // Merge 2x2 block
      const mergeRect: Rect = {
        cellId: cell1Id,
        startRow: 0,
        startCol: 0,
        endRow: 1,
        endCol: 1,
        primaryRegion: 'body',
      }

      table.mergeCells(mergeRect)

      // Before unmerge:
      // - cell1 should have rowSpan=2, colSpan=2
      // - cells 2,3,4 should have rowSpan=0, colSpan=0 (hidden)
      let cell1 = table.getCellById(cell1Id)
      expect(cell1?.layout?.rowSpan).toBe(2)
      expect(cell1?.layout?.colSpan).toBe(2)

      // Unmerge
      table.unmergeCells(cell1Id)

      // After unmerge:
      // - All cells should have rowSpan=1, colSpan=1
      cell1 = table.getCellById(cell1Id)
      const cell2 = table.getCellById(cell2Id)
      const cell3 = table.getCellById(cell3Id)
      const cell4 = table.getCellById(cell4Id)

      expect(cell1?.layout?.rowSpan).toBe(1)
      expect(cell1?.layout?.colSpan).toBe(1)
      expect(cell2?.layout?.rowSpan).toBe(1)
      expect(cell2?.layout?.colSpan).toBe(1)
      expect(cell3?.layout?.rowSpan).toBe(1)
      expect(cell3?.layout?.colSpan).toBe(1)
      expect(cell4?.layout?.rowSpan).toBe(1)
      expect(cell4?.layout?.colSpan).toBe(1)
    })

    it('should handle unmerge of non-existent merge gracefully', () => {
      const grid = table.getCompleteGrid()
      const cellId = grid[0][0]

      // Try to unmerge a cell that was never merged
      expect(() => {
        table.unmergeCells(cellId)
      }).not.toThrow()
    })
  })

  describe('Merge Registry Integration', () => {
    it('should track merge roots correctly', () => {
      const grid = table.getCompleteGrid()
      const cell1 = grid[0][0]
      const cell2 = grid[1][1]

      const merge1: Rect = {
        cellId: cell1,
        startRow: 0,
        startCol: 0,
        endRow: 1,
        endCol: 0,
        primaryRegion: 'body',
      }

      const merge2: Rect = {
        cellId: cell2,
        startRow: 1,
        startCol: 1,
        endRow: 2,
        endCol: 2,
        primaryRegion: 'body',
      }

      table.mergeCells(merge1)
      table.mergeCells(merge2)

      // Both should be merge roots
      const merges = table.getMerges()
      expect(merges.has(cell1)).toBe(true)
      expect(merges.has(cell2)).toBe(true)
    })

    it('should validate merge bounds', () => {
      const grid = table.getCompleteGrid()
      const cellId = grid[0][0]

      // Try to merge beyond table bounds - should be silently ignored or handled
      table.mergeCells({
        cellId,
        startRow: 0,
        startCol: 0,
        endRow: 100, // Way beyond table
        endCol: 100,
        primaryRegion: 'body',
      })

      // Cell should have reasonable layout (validation failed)
      const cell = table.getCellById(cellId)
      expect(cell?.layout).toBeDefined()
    })
  })

  describe('Layout Rebuild After Unmerge', () => {
    it('should recalculate geometry after unmerge', () => {
      const grid = table.getCompleteGrid()
      const cellId = grid[0][0]

      // Create merge with specific span
      const mergeRect: Rect = {
        cellId,
        startRow: 0,
        startCol: 0,
        endRow: 2,
        endCol: 2,
        primaryRegion: 'body',
      }

      table.mergeCells(mergeRect)
      const cell = table.getCellById(cellId)
      const mergedWidth = cell?.layout?.width || 0
      const mergedHeight = cell?.layout?.height || 0

      // Width and height should cover 3 columns/rows
      expect(mergedWidth).toBeGreaterThan(0)
      expect(mergedHeight).toBeGreaterThan(0)

      // Unmerge
      table.unmergeCells(cellId)
      const unmergedCell = table.getCellById(cellId)
      const unmergedWidth = unmergedCell?.layout?.width || 0
      const unmergedHeight = unmergedCell?.layout?.height || 0

      // Width and height should now be smaller
      expect(unmergedWidth).toBeLessThan(mergedWidth)
      expect(unmergedHeight).toBeLessThan(mergedHeight)
    })

    it('should update cell address after unmerge', () => {
      const grid = table.getCompleteGrid()
      const cellId = grid[1][1] // Cell at row 1, col 1 in body grid

      // Get the cell to find its actual global coordinates
      const cell = table.getCellById(cellId)
      const actualRow = cell!.layout!.row
      const actualCol = cell!.layout!.col

      const mergeRect: Rect = {
        cellId,
        startRow: actualRow,
        startCol: actualCol,
        endRow: actualRow + 1,
        endCol: actualCol + 1,
        primaryRegion: 'body',
      }

      table.mergeCells(mergeRect)

      // Cell address should be updated during unmerge
      table.unmergeCells(cellId)

      const cellAfter = table.getCellById(cellId)
      // Address should be preserved
      expect(cellAfter?.layout?.row).toBe(actualRow)
      expect(cellAfter?.layout?.col).toBe(actualCol)
    })
  })

  describe('Edge Cases', () => {
    it('should handle 1x1 merge (single cell)', () => {
      const grid = table.getCompleteGrid()
      const cellId = grid[0][0]

      // Merge of a single cell (1x1)
      const singleMerge: Rect = {
        cellId,
        startRow: 0,
        startCol: 0,
        endRow: 0,
        endCol: 0,
        primaryRegion: 'body',
      }

      table.mergeCells(singleMerge)
      table.unmergeCells(cellId)

      const cell = table.getCellById(cellId)
      expect(cell?.layout?.rowSpan).toBe(1)
      expect(cell?.layout?.colSpan).toBe(1)
    })

    it('should handle merge of entire row', () => {
      const grid = table.getCompleteGrid()
      const cellId = grid[0][0]

      // Merge entire first row
      const rowMerge: Rect = {
        cellId,
        startRow: 0,
        startCol: 0,
        endRow: 0,
        endCol: 2,
        primaryRegion: 'body',
      }

      table.mergeCells(rowMerge)
      const cell = table.getCellById(cellId)
      expect(cell?.layout?.colSpan).toBe(3)

      // Unmerge
      table.unmergeCells(cellId)
      const unmergedCell = table.getCellById(cellId)
      expect(unmergedCell?.layout?.colSpan).toBe(1)
    })

    it('should handle merge of entire column', () => {
      const grid = table.getCompleteGrid()
      const cellId = grid[0][0]

      // Merge entire first column
      const colMerge: Rect = {
        cellId,
        startRow: 0,
        startCol: 0,
        endRow: 2,
        endCol: 0,
        primaryRegion: 'body',
      }

      table.mergeCells(colMerge)
      const cell = table.getCellById(cellId)
      expect(cell?.layout?.rowSpan).toBe(3)

      // Unmerge
      table.unmergeCells(cellId)
      const unmergedCell = table.getCellById(cellId)
      expect(unmergedCell?.layout?.rowSpan).toBe(1)
    })
  })
})
