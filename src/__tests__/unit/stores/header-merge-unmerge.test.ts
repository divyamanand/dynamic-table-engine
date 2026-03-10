/**
 * Header Merge and Unmerge Tests
 *
 * Tests merge/unmerge functionality for header regions (theader, lheader, rheader, footer)
 * Headers use tree-based layout, so merges are applied as a post-pass override
 */

import { Table } from '../../../core/table'
import { StructureStore } from '../../../stores/structure.store'
import { CellRegistry } from '../../../stores/cell-registry.store'
import { MergeRegistry } from '../../../stores/merge-registry.stores'
import { LayoutEngine } from '../../../engines/layout.engine'
import { RuleEngine } from '../../../rules/rule-engine'
import { RuleRegistry } from '../../../rules/rule-registry'
import { Rect } from '../../../types/common'

describe('Header Merge and Unmerge', () => {
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

    // Create rule engine
    ruleEngine = new RuleEngine(ruleRegistry, cellRegistry, structureStore, table)

    // Create final table with rule engine
    table = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, ruleEngine)

    // Add top header cells first (needed for buildBody to establish column count)
    const h1 = table.addHeaderCell('theader')
    const h2 = table.addHeaderCell('theader')
    const h3 = table.addHeaderCell('theader')
    table.updateCell(h1, { rawValue: 'Header 1' })
    table.updateCell(h2, { rawValue: 'Header 2' })
    table.updateCell(h3, { rawValue: 'Header 3' })

    // Create a simple body (now that column count is established)
    table.buildBody([
      ['A1', 'B1', 'C1'],
      ['A2', 'B2', 'C2'],
    ])
  })

  describe('Top Header (theader) Merges', () => {
    it('should merge two adjacent header cells in theader', () => {
      // Get header cell ID (theader is the first row, first col in the global grid)
      const grid = table.getCompleteGrid()
      const headerCellId = grid[0][0]

      // Create merge: span 2 columns
      const mergeRect: Rect = {
        cellId: headerCellId,
        startRow: 0,
        startCol: 0,
        endRow: 0,
        endCol: 1,
        primaryRegion: 'theader'
      }

      table.mergeCells(mergeRect)

      // Verify merged cell has span > 1
      const cell = table.getCellById(headerCellId)
      expect(cell?.layout?.colSpan).toBeGreaterThan(1)
    })

    it('should unmerge header cells and restore individual layout', () => {
      const grid = table.getCompleteGrid()
      const headerCellId = grid[0][0]

      // Merge
      table.mergeCells({
        cellId: headerCellId,
        startRow: 0,
        startCol: 0,
        endRow: 0,
        endCol: 1,
        primaryRegion: 'theader'
      })

      let cell = table.getCellById(headerCellId)
      const mergedColSpan = cell?.layout?.colSpan
      expect(mergedColSpan).toBeGreaterThan(1)

      // Unmerge
      table.unmergeCells(headerCellId)

      // Verify cell returns to 1x1 layout
      cell = table.getCellById(headerCellId)
      expect(cell?.layout?.colSpan).toBe(1)
    })
  })

  describe('Left Header (lheader) Merges', () => {
    it('should merge two vertical header cells in lheader', () => {
      // Add left header cells
      const lh1 = table.addHeaderCell('lheader')
      const lh2 = table.addHeaderCell('lheader')
      table.updateCell(lh1, { rawValue: 'Left 1' })
      table.updateCell(lh2, { rawValue: 'Left 2' })

      // Merge vertically
      const mergeRect: Rect = {
        cellId: lh1,
        startRow: 0,
        startCol: 0,  // lheader cells occupy col 0
        endRow: 1,
        endCol: 0,
        primaryRegion: 'lheader'
      }

      table.mergeCells(mergeRect)

      const cell = table.getCellById(lh1)
      expect(cell?.layout?.rowSpan).toBeGreaterThan(1)
    })
  })

  describe('Right Header (rheader) Merges', () => {
    it('should merge header cells in rheader', () => {
      const rh1 = table.addHeaderCell('rheader')
      const rh2 = table.addHeaderCell('rheader')
      table.updateCell(rh1, { rawValue: 'Right 1' })
      table.updateCell(rh2, { rawValue: 'Right 2' })

      const mergeRect: Rect = {
        cellId: rh1,
        startRow: 0,
        startCol: 0,
        endRow: 1,
        endCol: 0,
        primaryRegion: 'rheader'
      }

      table.mergeCells(mergeRect)

      const cell = table.getCellById(rh1)
      expect(cell?.layout?.rowSpan).toBeGreaterThan(1)
    })
  })

  describe('Footer Merges', () => {
    it('should merge footer cells', () => {
      const f1 = table.addHeaderCell('footer')
      const f2 = table.addHeaderCell('footer')
      table.updateCell(f1, { rawValue: 'Footer 1' })
      table.updateCell(f2, { rawValue: 'Footer 2' })

      const mergeRect: Rect = {
        cellId: f1,
        startRow: 0,
        startCol: 0,
        endRow: 0,
        endCol: 1,
        primaryRegion: 'footer'
      }

      table.mergeCells(mergeRect)

      const cell = table.getCellById(f1)
      expect(cell?.layout?.colSpan).toBeGreaterThan(1)
    })
  })

  describe('Multiple Region Merges', () => {
    it('should handle merges in multiple regions simultaneously', () => {
      // Merge in theader
      const grid = table.getCompleteGrid()
      const theaderCellId = grid[0][0]

      table.mergeCells({
        cellId: theaderCellId,
        startRow: 0,
        startCol: 0,
        endRow: 0,
        endCol: 1,
        primaryRegion: 'theader'
      })

      // Also add and merge in lheader
      const lh1 = table.addHeaderCell('lheader')
      table.updateCell(lh1, { rawValue: 'Left' })

      table.mergeCells({
        cellId: lh1,
        startRow: 0,
        startCol: 0,
        endRow: 1,
        endCol: 0,
        primaryRegion: 'lheader'
      })

      // Both should exist
      const theaderCell = table.getCellById(theaderCellId)
      const lheaderCell = table.getCellById(lh1)

      expect(theaderCell?.layout?.colSpan).toBeGreaterThan(1)
      expect(lheaderCell?.layout?.rowSpan).toBeGreaterThan(1)

      // Unmerge one shouldn't affect the other
      table.unmergeCells(theaderCellId)

      const theaderCellAfter = table.getCellById(theaderCellId)
      const lheaderCellAfter = table.getCellById(lh1)

      expect(theaderCellAfter?.layout?.colSpan).toBe(1)
      expect(lheaderCellAfter?.layout?.rowSpan).toBeGreaterThan(1) // Still merged
    })
  })

  describe('Header Merge with primaryRegion field', () => {
    it('should accept primaryRegion field in Rect', () => {
      const h = table.addHeaderCell('theader')
      table.updateCell(h, { rawValue: 'Test' })

      // This should not throw
      expect(() => {
        table.mergeCells({
          cellId: h,
          startRow: 0,
          startCol: 0,
          endRow: 0,
          endCol: 1,
          primaryRegion: 'theader'  // Explicitly set
        })
      }).not.toThrow()

      const cell = table.getCellById(h)
      expect(cell).toBeDefined()
    })

    it('should default primaryRegion to body if not provided', () => {
      const grid = table.getCompleteGrid()
      const bodyCellId = grid[1][0]  // First body cell (after headers)

      // Should accept without primaryRegion for body cells
      expect(() => {
        table.mergeCells({
          cellId: bodyCellId,
          startRow: 1,
          startCol: 0,
          endRow: 2,
          endCol: 1
          // No primaryRegion provided, should default to body
        })
      }).not.toThrow()
    })
  })

  describe('Validation with Header Merges', () => {
    it('should accept header merges that would be out of body bounds', () => {
      const h = table.addHeaderCell('theader')
      table.updateCell(h, { rawValue: 'Test' })

      // Try to merge with coordinates that would exceed body bounds
      // This should be allowed because theader has its own coordinate space
      expect(() => {
        table.mergeCells({
          cellId: h,
          startRow: 0,
          startCol: 0,
          endRow: 0,
          endCol: 100,  // Exceeds body column count
          primaryRegion: 'theader'
        })
      }).not.toThrow()
    })
  })

  describe('Regression: Body Merges Still Work', () => {
    it('should not break existing body merge functionality', () => {
      const grid = table.getCompleteGrid()
      const bodyCellId = grid[1][0]  // First body cell (after headers)

      // Regular body merge (no primaryRegion)
      table.mergeCells({
        cellId: bodyCellId,
        startRow: 1,
        startCol: 0,
        endRow: 2,
        endCol: 1
      })

      const cell = table.getCellById(bodyCellId)
      expect(cell?.layout?.rowSpan).toBe(2)
      expect(cell?.layout?.colSpan).toBe(2)

      // Unmerge
      table.unmergeCells(bodyCellId)

      const cellAfter = table.getCellById(bodyCellId)
      expect(cellAfter?.layout?.rowSpan).toBe(1)
      expect(cellAfter?.layout?.colSpan).toBe(1)
    })
  })
})
