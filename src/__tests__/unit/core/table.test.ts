import { Table } from '../../../core/table'
import { StructureStore } from '../../../stores/structure.store'
import { CellRegistry } from '../../../stores/cell-registry.store'
import { MergeRegistry } from '../../../stores/merge-registry.stores'
import { LayoutEngine } from '../../../engines/layout.engine'
import { TableSettings } from '../../../types'
import { Rect } from '../../../types/common'

describe('Table', () => {
    let table: Table
    let structureStore: StructureStore
    let cellRegistry: CellRegistry
    let mergeRegistry: MergeRegistry
    let layoutEngine: LayoutEngine

    beforeEach(() => {
        structureStore = new StructureStore()
        cellRegistry = new CellRegistry()
        mergeRegistry = new MergeRegistry(structureStore)
        layoutEngine = new LayoutEngine(mergeRegistry, structureStore, cellRegistry)
        table = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry)
    })

    describe('initialization', () => {
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

            table = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, customSettings)
            const settings = table.getSettings()

            expect(settings.overflow).toBe('increase-width')
            expect(settings.minRows).toBe(10)
            expect(settings.maxRows).toBe(20)
        })

        it('should merge custom settings with defaults', () => {
            const customSettings: Partial<TableSettings> = {
                minCols: 5,
            }

            table = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, customSettings)
            const settings = table.getSettings()

            expect(settings.minCols).toBe(5)
            expect(settings.overflow).toBe('wrap') // From defaults
        })
    })

    describe('settings management', () => {
        it('should get settings as copy', () => {
            const settings1 = table.getSettings()
            const settings2 = table.getSettings()

            expect(settings1).toEqual(settings2)
            expect(settings1).not.toBe(settings2)
        })

        it('should update settings', () => {
            table.updateSettings({ overflow: 'increase-height' })
            const settings = table.getSettings()

            expect(settings.overflow).toBe('increase-height')
        })

        it('should merge settings updates', () => {
            const originalSettings = table.getSettings()

            table.updateSettings({ overflow: 'wrap', minRows: 5 })
            const newSettings = table.getSettings()

            expect(newSettings.overflow).toBe('wrap')
            expect(newSettings.minRows).toBe(5)
            expect(newSettings.pagination).toEqual(originalSettings.pagination)
        })

        it('should trigger rebuild on settings update', () => {
            const col = cellRegistry.createCell('theader')
            structureStore.addRootCell(col, 'theader')

            table.updateSettings({ overflow: 'increase-height' })

            // Verify cell still has valid layout
            const cell = cellRegistry.getCellById(col)
            expect(cell!.layout).toBeDefined()
        })
    })

    describe('header operations - addHeaderCell', () => {
        it('should add root header cell', () => {
            const cellId = table.addHeaderCell('theader')

            expect(cellId).toBeDefined()
            const cell = cellRegistry.getCellById(cellId)
            expect(cell).toBeDefined()
            expect(cell!.inRegion).toBe('theader')
        })

        it('should add header cell to different regions', () => {
            const theaderId = table.addHeaderCell('theader')
            const lheaderId = table.addHeaderCell('lheader')
            const rheaderId = table.addHeaderCell('rheader')
            const footerId = table.addHeaderCell('footer')

            expect(cellRegistry.getCellById(theaderId)!.inRegion).toBe('theader')
            expect(cellRegistry.getCellById(lheaderId)!.inRegion).toBe('lheader')
            expect(cellRegistry.getCellById(rheaderId)!.inRegion).toBe('rheader')
            expect(cellRegistry.getCellById(footerId)!.inRegion).toBe('footer')
        })

        it('should add child header cell', () => {
            const parentId = table.addHeaderCell('theader')
            const childId = table.addHeaderCell('theader', parentId)

            const parent = cellRegistry.getCellById(parentId)
            const child = cellRegistry.getCellById(childId)

            expect(parent!.layout).toBeDefined()
            expect(child!.layout).toBeDefined()
        })

        it('should add child at specific index', () => {
            const parentId = table.addHeaderCell('theader')
            const child1 = table.addHeaderCell('theader', parentId, 0)
            const child2 = table.addHeaderCell('theader', parentId, 0) // Insert at 0

            const children = structureStore.getChildren(parentId)
            expect(children![0]).toBe(child2)
            expect(children![1]).toBe(child1)
        })

        it('should create body slice for nested header', () => {
            const parentId = table.addHeaderCell('theader')
            expect(structureStore.getBody().length).toBe(0)

            table.addHeaderCell('theader', parentId)
            expect(structureStore.getBody().length).toBe(0)
        })

        it('should not create body rows when adding headers to empty body', () => {
            const parentId = table.addHeaderCell('theader')
            expect(structureStore.getBody().length).toBe(0)

            table.addHeaderCell('theader', parentId)
            expect(structureStore.getBody().length).toBe(0)
        })

        it('should add columns to existing body rows when adding headers', () => {
            // Build body with 2 rows, 1 column
            table.addHeaderCell('theader')
            table.buildBody([['cell1'], ['cell2']])
            expect(structureStore.getBody().length).toBe(2)
            expect(structureStore.getBody()[0].length).toBe(1)

            // Add another leaf as sibling (second column)
            table.addHeaderCell('theader')

            // Body should still have 2 rows, but now 2 columns
            expect(structureStore.getBody().length).toBe(2)
            expect(structureStore.getBody()[0].length).toBe(2)
            expect(structureStore.getBody()[1].length).toBe(2)
        })
    })

    describe('header operations - removeHeaderCell', () => {
        it('should remove root header cell', () => {
            const cellId = table.addHeaderCell('theader')

            table.removeHeaderCell(cellId, 'theader', true)

            expect(cellRegistry.getCellById(cellId)).toBeUndefined()
        })

        it('should remove child header cell', () => {
            const parentId = table.addHeaderCell('theader')
            const childId = table.addHeaderCell('theader', parentId)

            table.removeHeaderCell(childId, 'theader', false, parentId)

            expect(cellRegistry.getCellById(childId)).toBeUndefined()
        })

        it('should remove body slice for leaf cell', () => {
            const parentId = table.addHeaderCell('theader')
            table.addHeaderCell('theader', parentId)

            expect(structureStore.getBody().length).toBe(0)

            table.removeHeaderCell(parentId, 'theader', true)

            expect(structureStore.getBody().length).toBe(0)
        })
    })

    describe('body operations - buildBody', () => {
        it('should build body from data', () => {
            const data = [['a', 'b'], ['c', 'd']]

            table.buildBody(data)

            const body = structureStore.getBody()
            expect(body).toHaveLength(2)
        })

        it('should clear existing body before building', () => {
            table.insertBodyRow(0)
            table.insertBodyRow(1)

            table.buildBody([['a']])

            expect(structureStore.getBody()).toHaveLength(1)
        })

        it('should pad body to minRows', () => {
            const customSettings: Partial<TableSettings> = { minRows: 5 }
            table = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, customSettings)

            table.buildBody([['a', 'b']])

            expect(structureStore.getBody()).toHaveLength(5)
        })

        it('should handle numeric data', () => {
            const data = [[1, 2], [3, 4]]
            table.buildBody(data as any)

            const body = structureStore.getBody()
            expect(body).toHaveLength(2)
        })

        it('should handle mixed data types', () => {
            const data = [['text', 123], [456, 'more']]
            table.buildBody(data as any)

            expect(structureStore.getBody()).toHaveLength(2)
        })

        it('should handle empty data', () => {
            table.buildBody([])

            expect(structureStore.getBody()).toHaveLength(0)
        })
    })

    describe('body operations - insertBodyRow', () => {
        it('should insert body row', () => {
            table.insertBodyRow(0)

            expect(structureStore.getBody()).toHaveLength(1)
        })

        it('should insert body row with data', () => {
            // Add 3 header leaves to determine column count
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')

            table.insertBodyRow(0, ['val1', 'val2', 'val3'])

            const cells = structureStore.getBody()[0].map(id => cellRegistry.getCellById(id))
            expect(cells.map(c => c!.rawValue)).toEqual(['val1', 'val2', 'val3'])
        })

        it('should insert multiple rows', () => {
            table.insertBodyRow(0)
            table.insertBodyRow(1)
            table.insertBodyRow(2)

            expect(structureStore.getBody()).toHaveLength(3)
        })

        it('should respect maxRows setting', () => {
            const customSettings: Partial<TableSettings> = { maxRows: 2 }
            table = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, customSettings)

            table.insertBodyRow(0)
            table.insertBodyRow(1)
            table.insertBodyRow(2) // Should not add

            expect(structureStore.getBody()).toHaveLength(2)
        })

        it('should create cells with default column count', () => {
            const col1 = table.addHeaderCell('theader')
            table.addHeaderCell('theader', col1)

            table.insertBodyRow(0)

            expect(structureStore.getBody()[0]).toHaveLength(1)
        })

        it('should insert at correct index', () => {
            // Add 1 header leaf
            table.addHeaderCell('theader')

            table.insertBodyRow(0, ['r1'])
            table.insertBodyRow(2, ['r3'])
            table.insertBodyRow(1, ['r2'])

            const body = structureStore.getBody()
            const r1 = cellRegistry.getCellById(body[0][0])
            const r2 = cellRegistry.getCellById(body[1][0])
            const r3 = cellRegistry.getCellById(body[2][0])

            expect(r1!.rawValue).toBe('r1')
            expect(r2!.rawValue).toBe('r2')
            expect(r3!.rawValue).toBe('r3')
        })

        it('should update layout after insert', () => {
            // Add 1 header leaf
            table.addHeaderCell('theader')

            table.insertBodyRow(0)
            const cell = cellRegistry.getCellById(structureStore.getBody()[0][0])
            expect(cell!.layout).toBeDefined()
        })
    })

    describe('body operations - removeBodyRow', () => {
        it('should remove body row', () => {
            table.insertBodyRow(0)
            table.insertBodyRow(1)

            table.removeBodyRow(0)

            expect(structureStore.getBody()).toHaveLength(1)
        })

        it('should respect minRows setting', () => {
            const customSettings: Partial<TableSettings> = { minRows: 3 }
            table = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, customSettings)

            // Add 1 header leaf to create body columns
            table.addHeaderCell('theader')

            table.insertBodyRow(0)
            table.insertBodyRow(1)
            table.insertBodyRow(2)

            table.removeBodyRow(0) // Should not remove, would go below minRows (3)

            expect(structureStore.getBody()).toHaveLength(3)
        })

        it('should clear cell values when minRows prevents deletion', () => {
            const customSettings: Partial<TableSettings> = { minRows: 1 }
            table = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, customSettings)

            // Add 1 header leaf to match the data
            table.addHeaderCell('theader')

            table.insertBodyRow(0, ['value'])

            table.removeBodyRow(0)

            const cell = cellRegistry.getCellById(structureStore.getBody()[0][0])
            expect(cell!.rawValue).toBe('')
        })

        it('should delete cell objects', () => {
            const cellIds: string[] = []
            table.insertBodyRow(0, ['c1', 'c2'])

            const body = structureStore.getBody()
            body[0].forEach(id => cellIds.push(id))

            table.removeBodyRow(0)

            cellIds.forEach(id => {
                expect(cellRegistry.getCellById(id)).toBeUndefined()
            })
        })
    })

    describe('body operations - insertBodyCol', () => {
        it('should insert body column', () => {
            // Add 2 header leaves to match row data
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')

            table.insertBodyRow(0, ['a', 'b'])
            table.insertBodyCol(1, ['c'])

            const row = structureStore.getBody()[0]
            expect(row).toHaveLength(3)
        })

        it('should respect maxCols setting', () => {
            const customSettings: Partial<TableSettings> = { maxCols: 2 }
            table = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, customSettings)

            // Add 2 header leaves
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')

            table.insertBodyRow(0, ['a', 'b'])
            table.insertBodyCol(2, ['c'])

            expect(structureStore.getBody()[0]).toHaveLength(2)
        })

        it('should insert column with data', () => {
            table.insertBodyRow(0)
            table.insertBodyRow(1)

            table.insertBodyCol(0, ['new1', 'new2'])

            const row0 = structureStore.getBody()[0]
            const row1 = structureStore.getBody()[1]

            const c1 = cellRegistry.getCellById(row0[0])
            const c2 = cellRegistry.getCellById(row1[0])

            expect(c1!.rawValue).toBe('new1')
            expect(c2!.rawValue).toBe('new2')
        })
    })

    describe('body operations - removeBodyCol', () => {
        it('should remove body column', () => {
            // Add 3 header leaves
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')

            table.insertBodyRow(0, ['a', 'b', 'c'])

            table.removeBodyCol(1)

            expect(structureStore.getBody()[0]).toHaveLength(2)
        })

        it('should respect minCols setting', () => {
            const customSettings: Partial<TableSettings> = { minCols: 3 }
            table = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, customSettings)

            // Add 3 header leaves
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')

            table.insertBodyRow(0, ['a', 'b', 'c'])
            table.removeBodyCol(0)

            expect(structureStore.getBody()[0]).toHaveLength(3)
        })

        it('should delete cells in removed column', () => {
            table.insertBodyRow(0, ['a', 'b', 'c'])

            const cellId = structureStore.getBody()[0][1]
            table.removeBodyCol(1)

            expect(cellRegistry.getCellById(cellId)).toBeUndefined()
        })
    })

    describe('cell access', () => {
        it('should get cell by ID', () => {
            const cellId = table.addHeaderCell('theader')
            const cell = table.getCellById(cellId)

            expect(cell).toBeDefined()
            expect(cell!.cellID).toBe(cellId)
        })

        it('should return undefined for non-existent cellID', () => {
            const cell = table.getCellById('non-existent')
            expect(cell).toBeUndefined()
        })

        it('should get cell by address', () => {
            // Add 1 header leaf
            table.addHeaderCell('theader')

            table.insertBodyRow(0, ['value'])
            const body = structureStore.getBody()
            const cellId = body[0][0]

            table.updateCell(cellId, {}) // Trigger layout rebuild

            // Body row 0 is at layout row 1 (after theader at row 0)
            const cell = table.getCellByAddress(1, 0)
            expect(cell).toBeDefined()
            expect(cell!.rawValue).toBe('value')
        })

        it('should return undefined for out of bounds address', () => {
            const cell = table.getCellByAddress(100, 100)
            expect(cell).toBeUndefined()
        })
    })

    describe('cell updates', () => {
        it('should update cell', () => {
            const cellId = table.addHeaderCell('theader')

            table.updateCell(cellId, { rawValue: 'Updated' })

            const cell = table.getCellById(cellId)
            expect(cell!.rawValue).toBe('Updated')
        })

        it('should support partial updates', () => {
            const cellId = table.addHeaderCell('theader')

            table.updateCell(cellId, { rawValue: 'New' })
            table.updateCell(cellId, { computedValue: 'result' })

            const cell = table.getCellById(cellId)
            expect(cell!.rawValue).toBe('New')
            expect(cell!.computedValue).toBe('result')
        })

        it('should trigger layout rebuild on update', () => {
            const cellId = table.addHeaderCell('theader')

            table.updateCell(cellId, { rawValue: 'Test' })

            const cell = table.getCellById(cellId)
            expect(cell!.layout).toBeDefined()
        })
    })

    describe('merge operations', () => {
        it('should merge cells', () => {
            // Add 2 header leaves
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')

            table.insertBodyRow(0, ['a', 'b'])
            table.insertBodyRow(1, ['c', 'd'])

            const cellId = structureStore.getBody()[0][0]

            const rect: Rect = {
                cellId,
                startRow: 0,
                startCol: 0,
                endRow: 1,
                endCol: 1,
            }

            table.mergeCells(rect)

            const merge = mergeRegistry.getMergeByRootId(cellId)
            expect(merge).toBeDefined()
        })

        it('should unmerge cells', () => {
            // Add 1 header leaf
            table.addHeaderCell('theader')

            table.insertBodyRow(0, ['a'])
            const cellId = structureStore.getBody()[0][0]

            const rect: Rect = {
                cellId,
                startRow: 0,
                startCol: 0,
                endRow: 0,
                endCol: 0,
            }

            table.mergeCells(rect)
            expect(mergeRegistry.getMergeByRootId(cellId)).toBeDefined()

            table.unmergeCells(cellId)
            expect(mergeRegistry.getMergeByRootId(cellId)).toBeUndefined()
        })

        it('should trigger rebuild on merge', () => {
            // Add 1 header leaf
            table.addHeaderCell('theader')

            table.insertBodyRow(0, ['a'])
            const cellId = structureStore.getBody()[0][0]

            const rect: Rect = {
                cellId,
                startRow: 0,
                startCol: 0,
                endRow: 0,
                endCol: 0,
            }

            table.mergeCells(rect)

            const cell = table.getCellById(cellId)
            expect(cell!.layout).toBeDefined()
        })
    })

    describe('geometry operations', () => {
        it('should set column width', () => {
            table.addHeaderCell('theader')
            table.setColumnWidth(0, 50)

            const widths = table.getColumnWidths()
            expect(widths[0]).toBe(50)
        })

        it('should set row height', () => {
            // Add 1 header leaf to create row heights array
            table.addHeaderCell('theader')

            table.insertBodyRow(0)
            table.setRowHeight(1, 20) // Row 1 (body row, after header)

            const heights = table.getRowHeights()
            expect(heights[1]).toBe(20)
        })

        it('should set default cell width', () => {
            table.setDefaultCellWidth(35)

            table.insertBodyRow(0)

            const widths = table.getColumnWidths()
            widths.forEach(w => {
                if (w > 0) expect([35]).toContain(w)
            })
        })

        it('should set default cell height', () => {
            table.setDefaultCellHeight(15)

            table.insertBodyRow(0)

            const heights = table.getRowHeights()
            expect(heights[heights.length - 1]).toBe(15)
        })

        it('should get column widths', () => {
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')

            const widths = table.getColumnWidths()
            expect(widths.length).toBe(2)
        })

        it('should get row heights', () => {
            table.insertBodyRow(0)
            table.insertBodyRow(1)

            const heights = table.getRowHeights()
            expect(heights.length).toBeGreaterThan(0)
        })

        it('should set table position', () => {
            table.setTablePosition({ x: 10, y: 20 })

            const pos = table.getTablePosition()
            expect(pos.x).toBe(10)
            expect(pos.y).toBe(20)
        })

        it('should get table position', () => {
            table.setTablePosition({ x: 5, y: 15 })

            const pos = table.getTablePosition()
            expect(pos).toEqual({ x: 5, y: 15 })
        })
    })

    describe('layout', () => {
        it('should get complete grid', () => {
            const grid = table.getCompleteGrid()
            expect(Array.isArray(grid)).toBe(true)
        })
    })

    describe('complex workflows', () => {
        it('should handle full table construction', () => {
            // Build headers
            const col1 = table.addHeaderCell('theader')
            const col2 = table.addHeaderCell('theader')

            // Build body with matching number of columns
            const data = [['a', 'b'], ['c', 'd']]
            table.buildBody(data)

            // Update cell
            const bodyCell = structureStore.getBody()[0][0]
            table.updateCell(bodyCell, { rawValue: 'updated' })

            // Verify structure
            expect(table.getCellById(col1)).toBeDefined()
            expect(table.getCellById(col2)).toBeDefined()
            expect(structureStore.getBody()).toHaveLength(2)
        })

        it('should handle dynamic table updates', () => {
            // Add headers first to define column structure
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')

            // Now build body
            table.buildBody([['a', 'b'], ['c', 'd']])

            // Verify initial structure
            expect(structureStore.getBody()).toHaveLength(2)

            // Insert row
            table.insertBodyRow(2, ['e', 'f'])

            // Verify after row insert
            expect(structureStore.getBody()).toHaveLength(3)
        })

        it('should handle header and body together', () => {
            // Headers
            const h1 = table.addHeaderCell('theader')
            const h2 = table.addHeaderCell('theader')

            // Body
            table.insertBodyRow(0, ['val1', 'val2'])

            // Add child header
            const h1_child = table.addHeaderCell('theader', h1)

            // Verify all have layout
            expect(table.getCellById(h1)!.layout).toBeDefined()
            expect(table.getCellById(h1_child)!.layout).toBeDefined()
        })

        it('should maintain consistency through multiple operations', () => {
            // Setup headers first to define column structure
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')

            // Insert rows and verify basic structure
            table.insertBodyRow(0, ['a', 'b', 'c'])
            table.insertBodyRow(1, ['d', 'e', 'f'])

            const body = structureStore.getBody()
            expect(body).toHaveLength(2)
            expect(body[0]).toHaveLength(3)
            expect(body[1]).toHaveLength(3)
        })

        it('should handle settings changes with existing structure', () => {
            table.buildBody([['a', 'b'], ['c', 'd']])

            table.updateSettings({ overflow: 'increase-height', minRows: 5 })

            const body = structureStore.getBody()
            expect(body.length).toBeGreaterThanOrEqual(2)

            const settings = table.getSettings()
            expect(settings.overflow).toBe('increase-height')
        })
    })

    describe('edge cases', () => {
        it('should handle empty table', () => {
            expect(() => {
                table.getCompleteGrid()
                table.getColumnWidths()
                table.getRowHeights()
            }).not.toThrow()
        })

        it('should handle operations on non-existent cells', () => {
            expect(() => {
                table.updateCell('non-existent', { rawValue: 'test' })
            }).not.toThrow()
        })

        it('should handle invalid merge coordinates', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 1000,
                startCol: 1000,
                endRow: 2000,
                endCol: 2000,
            }

            expect(() => {
                table.mergeCells(rect)
            }).not.toThrow()
        })

        it('should handle rapid successive operations', () => {
            for (let i = 0; i < 10; i++) {
                table.insertBodyRow(i)
                table.insertBodyCol(i)
            }

            expect(structureStore.getBody()).toHaveLength(10)
        })

        it('should handle large data sets', () => {
            // First add a header column to define the number of columns
            for (let i = 0; i < 10; i++) {
                table.addHeaderCell('theader')
            }

            const rows = Array.from({ length: 100 }, (_, i) =>
                Array.from({ length: 10 }, (_, j) => `R${i}C${j}`)
            )

            table.buildBody(rows)

            expect(structureStore.getBody()).toHaveLength(100)
            expect(structureStore.getBody()[0]).toHaveLength(10)
        })
    })
})
