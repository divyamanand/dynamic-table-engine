import { TableInstanceManager } from '../../../renderers/pdfme/instance-manager'
import { Table } from '../../../core/table'
import { StructureStore } from '../../../stores/structure.store'
import { CellRegistry } from '../../../stores/cell-registry.store'
import { MergeRegistry } from '../../../stores/merge-registry.stores'
import { LayoutEngine } from '../../../engines/layout.engine'
import { RuleEngine } from '../../../rules/rule-engine'
import { RuleRegistry } from '../../../rules/rule-registry'
import { toPdfmeCellSchema, getCellDisplayValue } from '../../../renderers/pdfme/helpers/cell-schema-mapper'
import { createDefaultTableValue } from '../../../renderers/pdfme/prop-panel'
import type { TableExportData } from '../../../renderers/types/serialization.types'

function createTable(): Table {
    const structureStore = new StructureStore()
    const cellRegistry = new CellRegistry()
    const mergeRegistry = new MergeRegistry(structureStore)
    const layoutEngine = new LayoutEngine(mergeRegistry, structureStore, cellRegistry)
    const ruleRegistry = new RuleRegistry()

    const tempTable = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, {} as any)
    const ruleEngine = new RuleEngine(ruleRegistry, cellRegistry, structureStore, tempTable)
    return new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, ruleEngine)
}

describe('pdfme Plugin Round-Trip Integration', () => {
    let manager: TableInstanceManager

    beforeEach(() => {
        manager = new TableInstanceManager()
    })

    describe('full lifecycle: create → serialize → cache → render → edit → re-serialize', () => {
        it('should preserve all data through the full lifecycle', () => {
            // Step 1: Create a table with headers and body
            const table = createTable()
            const h1 = table.addHeaderCell('theader')
            const h2 = table.addHeaderCell('theader')
            table.updateCell(h1, { rawValue: 'Name' })
            table.updateCell(h2, { rawValue: 'Score' })
            table.buildBody([
                ['Alice', '95'],
                ['Bob', '87'],
                ['Charlie', '92'],
            ])
            table.setColumnWidth(0, 50)
            table.setColumnWidth(1, 30)

            // Step 2: Export and serialize (as pdfme value)
            const exportData = table.exportState()
            const pdfmeValue = JSON.stringify(exportData)

            // Step 3: Load through instance manager (simulates pdfme calling pdf() or ui())
            const { renderable } = manager.getOrCreate('testTable', pdfmeValue)

            // Step 4: Verify renderable has correct structure
            const theaderRows = renderable.getRowsInRegion('theader')
            expect(theaderRows.length).toBeGreaterThan(0)

            const bodyRows = renderable.getRowsInRegion('body')
            expect(bodyRows.length).toBe(3)

            // Verify column widths
            expect(renderable.columns[0].width).toBe(50)
            expect(renderable.columns[1].width).toBe(30)

            // Step 5: Map cells to pdfme schemas (simulates what pdf.ts does)
            const firstBodyRow = bodyRows[0]
            const firstCell = firstBodyRow.cells.get(0)!
            const cellSchema = toPdfmeCellSchema(firstCell, 10, 20) // table at (10, 20)

            expect(cellSchema.position.x).toBe(10 + firstCell.layout.x)
            expect(cellSchema.position.y).toBe(20 + firstCell.layout.y)
            expect(cellSchema.width).toBe(firstCell.layout.width)
            expect(getCellDisplayValue(firstCell)).toBe('Alice')

            // Step 6: Edit a cell (simulates form mode onChange)
            const newValue = manager.update('testTable', (t) => {
                const exported = t.exportState()
                const cellId = exported.body[0][0].cellId
                t.updateCell(cellId, { rawValue: 'Alice Updated' })
            })

            // Step 7: Verify the update round-trips correctly
            const newData: TableExportData = JSON.parse(newValue)
            expect(newData.body[0][0].rawValue).toBe('Alice Updated')

            // Step 8: Verify the new value reconstructs correctly
            const restoredTable = Table.fromExportData(newData)
            const reExported = restoredTable.exportState()
            expect(reExported.body[0][0].rawValue).toBe('Alice Updated')
            expect(reExported.body[1][0].rawValue).toBe('Bob')
            expect(reExported.headerTrees.theader[0].rawValue).toBe('Name')
        })
    })

    describe('defaultValue round-trip', () => {
        it('should create a valid default table that round-trips', () => {
            const defaultValue = createDefaultTableValue()

            // Load through instance manager
            const { renderable } = manager.getOrCreate('default', defaultValue)

            // Should have 3 columns
            expect(renderable.columns.length).toBe(3)

            // Should have theader and body
            const theaderRows = renderable.getRowsInRegion('theader')
            expect(theaderRows.length).toBeGreaterThan(0)

            const bodyRows = renderable.getRowsInRegion('body')
            expect(bodyRows.length).toBe(3)

            // Should have positive dimensions
            expect(renderable.getWidth()).toBeGreaterThan(0)
            expect(renderable.getHeight()).toBeGreaterThan(0)
        })
    })

    describe('cache behavior under multiple operations', () => {
        it('should cache hit when rendering same value multiple times', () => {
            const table = createTable()
            table.addHeaderCell('theader')
            table.buildBody([['A']])
            const value = JSON.stringify(table.exportState())

            const result1 = manager.getOrCreate('t', value)
            const result2 = manager.getOrCreate('t', value)
            const result3 = manager.getOrCreate('t', value)

            // All should return the same cached instances
            expect(result1.table).toBe(result2.table)
            expect(result2.table).toBe(result3.table)
            expect(result1.renderable).toBe(result2.renderable)
        })

        it('should cache miss after update', () => {
            const table = createTable()
            table.addHeaderCell('theader')
            table.buildBody([['A']])
            const originalValue = JSON.stringify(table.exportState())

            const result1 = manager.getOrCreate('t', originalValue)

            // Update the table
            manager.update('t', (t) => {
                const exported = t.exportState()
                t.updateCell(exported.body[0][0].cellId, { rawValue: 'B' })
            })

            // Original value should cause a cache miss now
            const result2 = manager.getOrCreate('t', originalValue)
            expect(result2.table).not.toBe(result1.table)
        })
    })

    describe('style preservation through round-trip', () => {
        it('should preserve cell styles in the pdfme cell schema', () => {
            const table = createTable()
            const h = table.addHeaderCell('theader')
            table.buildBody([['Styled']])

            // Style a body cell
            const cellId = table.exportState().body[0][0].cellId
            table.updateCell(cellId, {
                style: { bold: true, fontSize: 18, fontColor: '#FF0000' },
            })

            const value = JSON.stringify(table.exportState())
            const { renderable } = manager.getOrCreate('styled', value)

            // Get the styled body cell
            const bodyRows = renderable.getRowsInRegion('body')
            const styledCell = bodyRows[0].cells.get(0)!

            // Verify resolved style (cascade applied)
            expect(styledCell.style.bold).toBe(true)
            expect(styledCell.style.fontSize).toBe(18)
            expect(styledCell.style.fontColor).toBe('#FF0000')

            // Map to pdfme cell schema
            const cellSchema = toPdfmeCellSchema(styledCell, 0, 0)
            expect(cellSchema.bold).toBe(true)
            expect(cellSchema.fontSize).toBe(18)
            expect(cellSchema.fontColor).toBe('#FF0000')
        })
    })
})
