/**
 * Table Tests with Full Dependencies (Rule Engine, Evaluator, etc.)
 *
 * Comprehensive testing of Table facade with integrated rule engine,
 * demonstrating complete workflows from cell mutation to rule evaluation.
 */

import { Table } from '../../../core/table'
import { StructureStore } from '../../../stores/structure.store'
import { CellRegistry } from '../../../stores/cell-registry.store'
import { MergeRegistry } from '../../../stores/merge-registry.stores'
import { LayoutEngine } from '../../../engines/layout.engine'
import { RuleEngine } from '../../../rules/rule-engine'
import { RuleRegistry } from '../../../rules/rule-registry'
import { TableSettings } from '../../../types'
import { Rect } from '../../../types/common'

describe('Table with Full Dependencies (Rule Engine)', () => {
    let table: Table
    let structureStore: StructureStore
    let cellRegistry: CellRegistry
    let mergeRegistry: MergeRegistry
    let layoutEngine: LayoutEngine
    let ruleRegistry: RuleRegistry
    let ruleEngine: RuleEngine

    beforeEach(() => {
        // Initialize all stores and engines
        structureStore = new StructureStore()
        cellRegistry = new CellRegistry()
        mergeRegistry = new MergeRegistry(structureStore)
        layoutEngine = new LayoutEngine(mergeRegistry, structureStore, cellRegistry)
        ruleRegistry = new RuleRegistry()

        // Create a temporary table to initialize rule engine
        table = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, {} as any)

        // Create rule engine with full dependencies
        ruleEngine = new RuleEngine(ruleRegistry, cellRegistry, structureStore, table)

        // Create final table with rule engine (constructor takes ruleEngine before settings)
        table = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, ruleEngine)
    })

    describe('initialization with dependencies', () => {
        it('should initialize with rule engine', () => {
            expect(table).toBeDefined()
            expect(ruleEngine).toBeDefined()
            expect(ruleRegistry).toBeDefined()
        })

        it('should initialize with default settings', () => {
            const settings = table.getSettings()

            expect(settings.overflow).toBe('wrap')
            expect(settings.footer?.mode).toBe('last-page')
            expect(settings.headerVisibility?.theader).toBe(true)
            expect(settings.pagination?.repeatHeaders).toBe(true)
        })

        it('should initialize with custom settings', () => {
            const customSettings: Partial<TableSettings> = {
                overflow: 'increase-width',
                minRows: 10,
                maxRows: 20,
            }

            const customTable = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, ruleEngine, customSettings)
            const settings = customTable.getSettings()

            expect(settings.overflow).toBe('increase-width')
            expect(settings.minRows).toBe(10)
            expect(settings.maxRows).toBe(20)
        })
    })

    describe('header operations with rule evaluation', () => {
        it('should add header cell and trigger rule evaluation', () => {
            const evaluateSpy = jest.spyOn(ruleEngine, 'evaluateAll')

            const leafId = table.addHeaderCell('theader')

            expect(leafId).toBeDefined()
            expect(evaluateSpy).toHaveBeenCalled()
            evaluateSpy.mockRestore()
        })

        it('should add nested header cells', () => {
            const leaf1 = table.addHeaderCell('theader')
            const parentId = table.addHeaderCell('theader', leaf1)
            const leaf2 = table.addHeaderCell('theader', parentId)

            expect(leaf1).toBeDefined()
            expect(parentId).toBeDefined()
            expect(leaf2).toBeDefined()

            // Verify structure: leaf1 -> parentId -> leaf2
            const parent = cellRegistry.getCellById(parentId)
            expect(parent).toBeDefined()
        })

        it('should add lheader cells for row grouping', () => {
            const groupId = table.addHeaderCell('lheader')
            expect(groupId).toBeDefined()

            const cell = cellRegistry.getCellById(groupId)
            expect(cell).toBeDefined()
        })

        it('should remove header cell and update layout', () => {
            const leaf = table.addHeaderCell('theader')
            const evaluateSpy = jest.spyOn(ruleEngine, 'evaluateAll')

            table.removeHeaderCell(leaf, 'theader', true)

            expect(cellRegistry.getCellById(leaf)).toBeUndefined()
            expect(evaluateSpy).toHaveBeenCalled()
            evaluateSpy.mockRestore()
        })
    })

    describe('body operations with rule evaluation', () => {

        it('should build body with rule evaluation', () => {
            // Add header leaves to establish column count
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')

            const evaluateSpy = jest.spyOn(ruleEngine, 'evaluateAll')

            table.buildBody([
                ['A1', 'B1', 'C1'],
                ['A2', 'B2', 'C2'],
                ['A3', 'B3', 'C3'],
            ])

            expect(structureStore.getBody()).toHaveLength(3)
            expect(structureStore.getBody()[0]).toHaveLength(3)
            expect(evaluateSpy).toHaveBeenCalled()
            evaluateSpy.mockRestore()
        })

        it('should insert body row and trigger evaluation', () => {
            // Add header leaves
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')

            table.buildBody([['a', 'b', 'c']])
            const evaluateSpy = jest.spyOn(ruleEngine, 'evaluateAll')

            table.insertBodyRow(1, ['x', 'y', 'z'])

            expect(structureStore.getBody()).toHaveLength(2)
            expect(evaluateSpy).toHaveBeenCalled()
            evaluateSpy.mockRestore()
        })

        it('should remove body row and maintain minRows constraint', () => {
            const customSettings: Partial<TableSettings> = { minRows: 3 }
            const customRuleRegistry = new RuleRegistry()
            const customRuleEngine = new RuleEngine(customRuleRegistry, cellRegistry, structureStore, table)
            const customTable = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, customRuleEngine, customSettings)

            customTable.addHeaderCell('theader')

            customTable.insertBodyRow(0)
            customTable.insertBodyRow(1)
            customTable.insertBodyRow(2)

            const evaluateSpy = jest.spyOn(customRuleEngine, 'evaluateAll')

            customTable.removeBodyRow(0)

            // minRows = 3, so removing would go below. Cells should be cleared, not removed
            expect(structureStore.getBody()).toHaveLength(3)
            evaluateSpy.mockRestore()
        })

        it('should insert body column', () => {
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')

            table.buildBody([
                ['a', 'b'],
                ['c', 'd'],
            ])

            const evaluateSpy = jest.spyOn(ruleEngine, 'evaluateAll')

            table.insertBodyCol(1, ['e', 'f'])

            expect(structureStore.getBody()[0]).toHaveLength(3)
            expect(evaluateSpy).toHaveBeenCalled()
            evaluateSpy.mockRestore()
        })

        it('should respect maxRows constraint', () => {
            const customSettings: Partial<TableSettings> = { maxRows: 2 }
            const customTable = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, ruleEngine, customSettings)

            customTable.addHeaderCell('theader')

            customTable.insertBodyRow(0, ['a'])
            customTable.insertBodyRow(1, ['b'])
            customTable.insertBodyRow(2, ['c']) // Should be ignored

            expect(structureStore.getBody()).toHaveLength(2)
        })

        it('should respect maxCols constraint', () => {
            const customStructureStore = new StructureStore()
            const customCellRegistry = new CellRegistry()
            const customMergeRegistry = new MergeRegistry(customStructureStore)
            const customLayoutEngine = new LayoutEngine(customMergeRegistry, customStructureStore, customCellRegistry)
            const customRuleRegistry = new RuleRegistry()
            const customRuleEngine = new RuleEngine(customRuleRegistry, customCellRegistry, customStructureStore, table)

            const customSettings: Partial<TableSettings> = { maxCols: 2 }
            const customTable = new Table(customStructureStore, customCellRegistry, customLayoutEngine, customMergeRegistry, customRuleEngine, customSettings)

            customTable.addHeaderCell('theader')
            customTable.addHeaderCell('theader')

            customTable.insertBodyRow(0, ['a', 'b'])
            customTable.insertBodyCol(2, ['c']) // Should be ignored

            expect(customStructureStore.getBody()[0]).toHaveLength(2)
        })
    })

    describe('cell access and updates with rule evaluation', () => {
        beforeEach(() => {
            table.addHeaderCell('theader')
            table.insertBodyRow(0, ['value'])
        })

        it('should get cell by ID', () => {
            const cellId = structureStore.getBody()[0][0]
            const cell = table.getCellById(cellId)

            expect(cell).toBeDefined()
            expect(cell?.rawValue).toBe('value')
        })

        it('should get cell by address after layout rebuild', () => {
            const cellId = structureStore.getBody()[0][0]
            table.updateCell(cellId, {})

            // Body row 0 is at layout row 1 (after theader)
            const cell = table.getCellByAddress(1, 0)
            expect(cell).toBeDefined()
            expect(cell?.rawValue).toBe('value')
        })

        it('should update cell and trigger rule evaluation', () => {
            const cellId = structureStore.getBody()[0][0]
            const evaluateSpy = jest.spyOn(ruleEngine, 'evaluateCell')

            table.updateCell(cellId, { rawValue: 'updated' })

            const cell = table.getCellById(cellId)
            expect(cell?.rawValue).toBe('updated')
            expect(evaluateSpy).toHaveBeenCalled()
            evaluateSpy.mockRestore()
        })

        it('should support partial cell updates', () => {
            const cellId = structureStore.getBody()[0][0]

            table.updateCell(cellId, { rawValue: 'new-value' })

            const cell = table.getCellById(cellId)
            expect(cell?.rawValue).toBe('new-value')
        })
    })

    describe('merge operations with rule evaluation', () => {
        beforeEach(() => {
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')

            table.buildBody([
                ['a', 'b'],
                ['c', 'd'],
            ])
        })

        it('should merge cells', () => {
            const cellId = structureStore.getBody()[0][0]

            const rect: Rect = {
                cellId,
                startRow: 0,
                startCol: 0,
                endRow: 1,
                endCol: 1,
            }

            const evaluateSpy = jest.spyOn(ruleEngine, 'evaluateAll')

            table.mergeCells(rect)

            const merge = mergeRegistry.getMergeByRootId(cellId)
            expect(merge).toBeDefined()
            expect(evaluateSpy).toHaveBeenCalled()
            evaluateSpy.mockRestore()
        })

        it('should unmerge cells', () => {
            const cellId = structureStore.getBody()[0][0]

            const rect: Rect = {
                cellId,
                startRow: 0,
                startCol: 0,
                endRow: 1,
                endCol: 1,
            }

            table.mergeCells(rect)
            const evaluateSpy = jest.spyOn(ruleEngine, 'evaluateAll')

            table.unmergeCells(cellId)

            expect(mergeRegistry.getMergeByRootId(cellId)).toBeUndefined()
            expect(evaluateSpy).toHaveBeenCalled()
            evaluateSpy.mockRestore()
        })
    })

    describe('geometry operations with rule evaluation', () => {
        beforeEach(() => {
            table.addHeaderCell('theader')
        })

        it('should set column width', () => {
            table.setColumnWidth(0, 50)

            const widths = table.getColumnWidths()
            expect(widths[0]).toBe(50)
        })

        it('should set row height', () => {
            table.insertBodyRow(0)
            table.setRowHeight(1, 20) // Row 1 (body row, after header)

            const heights = table.getRowHeights()
            expect(heights[1]).toBe(20)
        })

        it('should set default cell dimensions', () => {
            layoutEngine.setDefaultCellWidth(40)
            layoutEngine.setDefaultCellHeight(15)

            expect(layoutEngine.getDefaultCellWidth()).toBe(40)
            expect(layoutEngine.getDefaultCellHeight()).toBe(15)
        })

        it('should get table position', () => {
            table.setTablePosition({ x: 10, y: 20 })

            const pos = table.getTablePosition()
            expect(pos.x).toBe(10)
            expect(pos.y).toBe(20)
        })
    })

    describe('settings management with rule evaluation', () => {
        it('should get settings as copy', () => {
            const settings1 = table.getSettings()
            const settings2 = table.getSettings()

            // Should be different objects
            expect(settings1).not.toBe(settings2)
            // But same values
            expect(settings1.overflow).toBe(settings2.overflow)
        })

        it('should update settings and trigger rebuild', () => {
            const evaluateSpy = jest.spyOn(ruleEngine, 'evaluateAll')

            table.updateSettings({ overflow: 'increase-width' })

            const settings = table.getSettings()
            expect(settings.overflow).toBe('increase-width')
            expect(evaluateSpy).toHaveBeenCalled()
            evaluateSpy.mockRestore()
        })

        it('should merge settings updates with defaults', () => {
            table.updateSettings({ minRows: 5 })

            const settings = table.getSettings()
            expect(settings.minRows).toBe(5)
            expect(settings.overflow).toBe('wrap') // Default preserved
        })
    })

    describe('complex workflows with rule engine', () => {
        it('should handle full table construction flow', () => {
            // Build hierarchical headers
            const col1 = table.addHeaderCell('theader')
            const col2 = table.addHeaderCell('theader')
            const group = table.addHeaderCell('lheader')

            // Build body
            table.buildBody([
                ['data1-1', 'data1-2'],
                ['data2-1', 'data2-2'],
                ['data3-1', 'data3-2'],
            ])

            // Verify structure
            expect(structureStore.getBody()).toHaveLength(3)
            expect(structureStore.getBody()[0]).toHaveLength(2)

            // Verify geometry
            const cell = table.getCellById(structureStore.getBody()[0][0])
            expect(cell?.layout).toBeDefined()
            expect(cell?.layout?.row).toBeDefined()
            expect(cell?.layout?.col).toBeDefined()
        })

        it('should handle dynamic table updates with rules', () => {
            // Initial setup
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')
            table.buildBody([['a', 'b'], ['c', 'd']])

            // Insert row should succeed
            expect(() => {
                table.insertBodyRow(2, ['e', 'f'])
            }).not.toThrow()

            expect(structureStore.getBody()).toHaveLength(3)

            // Update cell should succeed
            const cellId = structureStore.getBody()[0][0]
            expect(() => {
                table.updateCell(cellId, { rawValue: 'updated' })
            }).not.toThrow()

            const updatedCell = table.getCellById(cellId)
            expect(updatedCell?.rawValue).toBe('updated')
        })

        it('should maintain consistency through multiple operations', () => {
            // Setup
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')
            table.buildBody([['a', 'b'], ['c', 'd']])

            // Multiple mutations
            table.insertBodyRow(2, ['e', 'f'])
            table.insertBodyCol(2, ['x', 'y', 'z'])
            table.removeBodyRow(0)

            // Verify consistency
            expect(structureStore.getBody()).toHaveLength(2)
            expect(structureStore.getBody()[0]).toHaveLength(3)

            // All cells should have layout
            for (const row of structureStore.getBody()) {
                for (const cellId of row) {
                    const cell = table.getCellById(cellId)
                    expect(cell?.layout).toBeDefined()
                }
            }
        })

        it('should handle header and body together', () => {
            // Mixed header operations
            const h1 = table.addHeaderCell('theader')
            const h2 = table.addHeaderCell('theader')
            const lh = table.addHeaderCell('lheader')

            // Body operations
            table.buildBody([['1', '2'], ['3', '4']])

            // Verify integration
            expect(structureStore.getBody()).toHaveLength(2)

            // Update headers
            table.updateCell(h1, { rawValue: 'Header1' })
            table.updateCell(h2, { rawValue: 'Header2' })

            // Verify headers updated
            expect(table.getCellById(h1)?.rawValue).toBe('Header1')
            expect(table.getCellById(h2)?.rawValue).toBe('Header2')
        })
    })

    describe('rule engine integration', () => {
        it('should evaluate cells when rules are added', () => {
            table.addHeaderCell('theader')
            table.insertBodyRow(0, ['test'])

            const cellId = structureStore.getBody()[0][0]

            // Add a simple rule
            const ruleId = ruleRegistry.addRule({
                target: { scope: 'region', region: 'body' },
                condition: 'true',
                result: '{ type: "style", style: { backgroundColor: "#FF0000" } }',
                priority: 1,
                enabled: true,
            })

            expect(ruleId).toBeDefined()

            // Evaluate cell with rule
            const cell = table.getCellById(cellId)
            if (cell) {
                ruleEngine.evaluateCell(cell)
                const result = ruleEngine.getResult(cellId)
                expect(result).toBeDefined()
            }
        })

        it('should apply rule results to cells', () => {
            table.addHeaderCell('theader')
            table.insertBodyRow(0, ['10'])

            const cellId = structureStore.getBody()[0][0]

            // Add rule that sets computed value
            ruleRegistry.addRule({
                target: { scope: 'region', region: 'body' },
                condition: 'true',
                result: '{ type: "computedValue", value: "Calculated" }',
                priority: 1,
                enabled: true,
            })

            // Evaluate and get result
            const cell = table.getCellById(cellId)
            if (cell) {
                ruleEngine.evaluateCell(cell)
                const result = ruleEngine.getResult(cellId)

                expect(result?.computedValue).toBe('Calculated')
            }
        })

        it('should resolve cells with rule results', () => {
            table.addHeaderCell('theader')
            table.insertBodyRow(0, ['original'])

            const cellId = structureStore.getBody()[0][0]
            const cell = table.getCellById(cellId)

            if (cell) {
                // Add style rule
                ruleRegistry.addRule({
                    target: { scope: 'region', region: 'body' },
                    condition: 'true',
                    result: '{ type: "style", style: { fontColor: "#0000FF" } }',
                    priority: 1,
                    enabled: true,
                })

                // Evaluate
                ruleEngine.evaluateCell(cell)

                // Resolve cell (merges rules + base style)
                const resolved = ruleEngine.resolveCell(cell)
                expect(resolved).toBeDefined()
                expect(resolved.displayValue).toBe('original')
            }
        })
    })

    describe('edge cases with full dependencies', () => {
        it('should handle empty table', () => {
            expect(structureStore.getBody()).toHaveLength(0)
            expect(table.getColumnWidths()).toHaveLength(0)
        })

        it('should handle operations on non-existent cells', () => {
            const cell = table.getCellById('non-existent-id')
            expect(cell).toBeUndefined()

            const cellByAddr = table.getCellByAddress(999, 999)
            expect(cellByAddr).toBeUndefined()
        })

        it('should handle invalid merge coordinates', () => {
            table.addHeaderCell('theader')
            table.insertBodyRow(0)

            const cellId = structureStore.getBody()[0][0]

            // Invalid: endRow < startRow
            const rect: Rect = {
                cellId,
                startRow: 10,
                startCol: 0,
                endRow: 5,
                endCol: 0,
            }

            // Should handle gracefully (either error or no-op)
            expect(() => table.mergeCells(rect)).not.toThrow()
        })

        it('should handle rapid successive operations', () => {
            table.addHeaderCell('theader')

            for (let i = 0; i < 10; i++) {
                table.insertBodyRow(i, ['data'])
            }

            expect(structureStore.getBody()).toHaveLength(10)

            for (let i = 0; i < 5; i++) {
                table.removeBodyRow(0)
            }

            expect(structureStore.getBody()).toHaveLength(5)
        })

        it('should handle large data sets', () => {
            // Add 3 columns
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')

            // Add 100 rows
            for (let i = 0; i < 100; i++) {
                table.insertBodyRow(i, [`r${i}c1`, `r${i}c2`, `r${i}c3`])
            }

            expect(structureStore.getBody()).toHaveLength(100)

            // Verify sampling
            expect(structureStore.getBody()[0]).toHaveLength(3)
            expect(structureStore.getBody()[99]).toHaveLength(3)
        })
    })
})
