import { Table } from '../../../core/table'
import { StructureStore } from '../../../stores/structure.store'
import { CellRegistry } from '../../../stores/cell-registry.store'
import { MergeRegistry } from '../../../stores/merge-registry.stores'
import { LayoutEngine } from '../../../engines/layout.engine'
import { RuleEngine } from '../../../rules/rule-engine'
import { RuleRegistry } from '../../../rules/rule-registry'
import { TableSettings, TableStyle, RegionStyleMap, Rect } from '../../../types'

function createTable(settings?: Partial<TableSettings>, tableStyle?: TableStyle, regionStyles?: RegionStyleMap): Table {
    const structureStore = new StructureStore()
    const cellRegistry = new CellRegistry()
    const mergeRegistry = new MergeRegistry(structureStore)
    const layoutEngine = new LayoutEngine(mergeRegistry, structureStore, cellRegistry)
    const ruleRegistry = new RuleRegistry()

    const tempTable = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, {} as any, settings, tableStyle, regionStyles)
    const ruleEngine = new RuleEngine(ruleRegistry, cellRegistry, structureStore, tempTable)
    const table = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, ruleEngine, settings, tableStyle, regionStyles)

    return table
}

describe('Table serialization (exportState / fromExportData)', () => {

    describe('empty table round-trip', () => {
        it('should export and import an empty table', () => {
            const table = createTable()
            const exported = table.exportState()

            expect(exported.headerTrees.theader).toEqual([])
            expect(exported.headerTrees.lheader).toEqual([])
            expect(exported.body).toEqual([])
            expect(exported.merges).toEqual([])

            const restored = Table.fromExportData(exported)
            const reExported = restored.exportState()

            expect(reExported.headerTrees).toEqual(exported.headerTrees)
            expect(reExported.body).toEqual(exported.body)
            expect(reExported.settings).toEqual(exported.settings)
        })
    })

    describe('headers round-trip', () => {
        it('should preserve theader root cells', () => {
            const table = createTable()
            const h1 = table.addHeaderCell('theader')
            const h2 = table.addHeaderCell('theader')
            const h3 = table.addHeaderCell('theader')

            table.updateCell(h1, { rawValue: 'Name' })
            table.updateCell(h2, { rawValue: 'Age' })
            table.updateCell(h3, { rawValue: 'Email' })

            const exported = table.exportState()
            expect(exported.headerTrees.theader).toHaveLength(3)
            expect(exported.headerTrees.theader[0].rawValue).toBe('Name')
            expect(exported.headerTrees.theader[1].rawValue).toBe('Age')
            expect(exported.headerTrees.theader[2].rawValue).toBe('Email')

            const restored = Table.fromExportData(exported)
            const reExported = restored.exportState()

            expect(reExported.headerTrees.theader).toHaveLength(3)
            expect(reExported.headerTrees.theader[0].rawValue).toBe('Name')
            expect(reExported.headerTrees.theader[0].cellId).toBe(exported.headerTrees.theader[0].cellId)
            expect(reExported.headerTrees.theader[1].rawValue).toBe('Age')
            expect(reExported.headerTrees.theader[2].rawValue).toBe('Email')
        })

        it('should preserve nested header trees', () => {
            const table = createTable()
            const parent = table.addHeaderCell('theader')
            table.updateCell(parent, { rawValue: 'Contact' })
            const child1 = table.addHeaderCell('theader', parent)
            const child2 = table.addHeaderCell('theader', parent)
            table.updateCell(child1, { rawValue: 'Phone' })
            table.updateCell(child2, { rawValue: 'Email' })

            const exported = table.exportState()
            expect(exported.headerTrees.theader).toHaveLength(1)
            expect(exported.headerTrees.theader[0].children).toHaveLength(2)
            expect(exported.headerTrees.theader[0].children[0].rawValue).toBe('Phone')
            expect(exported.headerTrees.theader[0].children[1].rawValue).toBe('Email')

            const restored = Table.fromExportData(exported)
            const reExported = restored.exportState()

            expect(reExported.headerTrees.theader[0].cellId).toBe(parent)
            expect(reExported.headerTrees.theader[0].children[0].cellId).toBe(child1)
            expect(reExported.headerTrees.theader[0].children[1].cellId).toBe(child2)
            expect(reExported.headerTrees.theader[0].children[0].rawValue).toBe('Phone')
        })

        it('should preserve multi-region headers', () => {
            const table = createTable()
            const th = table.addHeaderCell('theader')
            const lh = table.addHeaderCell('lheader')
            table.updateCell(th, { rawValue: 'TopHeader' })
            table.updateCell(lh, { rawValue: 'LeftHeader' })

            const exported = table.exportState()
            const restored = Table.fromExportData(exported)
            const reExported = restored.exportState()

            expect(reExported.headerTrees.theader[0].rawValue).toBe('TopHeader')
            expect(reExported.headerTrees.lheader[0].rawValue).toBe('LeftHeader')
        })
    })

    describe('body round-trip', () => {
        it('should preserve body data', () => {
            const table = createTable()
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')
            table.buildBody([
                ['Alice', '30'],
                ['Bob', '25'],
            ])

            const exported = table.exportState()
            expect(exported.body).toHaveLength(2)
            expect(exported.body[0]).toHaveLength(2)
            expect(exported.body[0][0].rawValue).toBe('Alice')
            expect(exported.body[0][1].rawValue).toBe('30')
            expect(exported.body[1][0].rawValue).toBe('Bob')

            const restored = Table.fromExportData(exported)
            const reExported = restored.exportState()

            expect(reExported.body).toHaveLength(2)
            expect(reExported.body[0][0].rawValue).toBe('Alice')
            expect(reExported.body[0][0].cellId).toBe(exported.body[0][0].cellId)
            expect(reExported.body[1][0].rawValue).toBe('Bob')
        })

        it('should preserve body cell styles', () => {
            const table = createTable()
            table.addHeaderCell('theader')
            table.buildBody([['Styled']])

            const cellId = table.exportState().body[0][0].cellId
            table.updateCell(cellId, {
                style: { backgroundColor: '#ff0000', bold: true },
            })

            const exported = table.exportState()
            expect(exported.body[0][0].style.backgroundColor).toBe('#ff0000')
            expect(exported.body[0][0].style.bold).toBe(true)

            const restored = Table.fromExportData(exported)
            const cell = restored.getCellById(cellId)
            expect(cell?.styleOverrides.backgroundColor).toBe('#ff0000')
            expect(cell?.styleOverrides.bold).toBe(true)
        })
    })

    describe('cell ID preservation', () => {
        it('should preserve all cell IDs across round-trip', () => {
            const table = createTable()
            const h1 = table.addHeaderCell('theader')
            const h2 = table.addHeaderCell('theader')
            table.buildBody([['a', 'b'], ['c', 'd']])

            const exported = table.exportState()
            const bodyCellIds = exported.body.map(row => row.map(c => c.cellId))

            const restored = Table.fromExportData(exported)

            // Header cells preserved
            expect(restored.getCellById(h1)).toBeDefined()
            expect(restored.getCellById(h2)).toBeDefined()

            // Body cells preserved
            for (const row of bodyCellIds) {
                for (const cellId of row) {
                    expect(restored.getCellById(cellId)).toBeDefined()
                }
            }
        })
    })

    describe('merges round-trip', () => {
        it('should preserve body merges', () => {
            const table = createTable()
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')
            table.buildBody([
                ['a', 'b', 'c'],
                ['d', 'e', 'f'],
                ['g', 'h', 'i'],
            ])

            const exported1 = table.exportState()
            // Get the body cell at position (row offset + 0, col offset + 0) for merge root
            const rootCellId = exported1.body[0][0].cellId

            const merge: Rect = {
                cellId: rootCellId,
                startRow: 1, // theader takes row 0, body starts at row 1
                startCol: 0,
                endRow: 2,
                endCol: 1,
            }
            table.mergeCells(merge)

            const exported = table.exportState()
            expect(exported.merges.length).toBeGreaterThan(0)

            const restored = Table.fromExportData(exported)
            const restoredMerges = restored.getMerges()

            expect(restoredMerges.size).toBe(exported.merges.length)
            // Verify the root cell ID is preserved in the merge
            expect(restoredMerges.has(rootCellId)).toBe(true)
        })
    })

    describe('geometry round-trip', () => {
        it('should preserve column widths and row heights', () => {
            const table = createTable()
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')
            table.buildBody([['a', 'b']])

            table.setColumnWidth(0, 50)
            table.setColumnWidth(1, 80)
            table.setRowHeight(0, 15) // theader row
            table.setRowHeight(1, 20) // body row

            const exported = table.exportState()
            expect(exported.columnWidths[0]).toBe(50)
            expect(exported.columnWidths[1]).toBe(80)

            const restored = Table.fromExportData(exported)
            const restoredWidths = restored.getColumnWidths()
            const restoredHeights = restored.getRowHeights()

            expect(restoredWidths[0]).toBe(50)
            expect(restoredWidths[1]).toBe(80)
            expect(restoredHeights[0]).toBe(exported.rowHeights[0])
            expect(restoredHeights[1]).toBe(exported.rowHeights[1])
        })

        it('should preserve default cell dimensions', () => {
            const table = createTable()
            table.setDefaultCellWidth(45)
            table.setDefaultCellHeight(12)

            const exported = table.exportState()
            expect(exported.defaultCellWidth).toBe(45)
            expect(exported.defaultCellHeight).toBe(12)

            const restored = Table.fromExportData(exported)
            const reExported = restored.exportState()
            expect(reExported.defaultCellWidth).toBe(45)
            expect(reExported.defaultCellHeight).toBe(12)
        })
    })

    describe('settings round-trip', () => {
        it('should preserve custom table settings', () => {
            const table = createTable({
                overflow: 'increase-height',
                minRows: 5,
                maxRows: 100,
                headerVisibility: { theader: false, lheader: true, rheader: false },
            })

            const exported = table.exportState()
            expect(exported.settings.overflow).toBe('increase-height')
            expect(exported.settings.minRows).toBe(5)

            const restored = Table.fromExportData(exported)
            const settings = restored.getSettings()
            expect(settings.overflow).toBe('increase-height')
            expect(settings.minRows).toBe(5)
            expect(settings.maxRows).toBe(100)
            expect(settings.headerVisibility?.theader).toBe(false)
        })
    })

    describe('isDynamic and computedValue round-trip', () => {
        it('should preserve isDynamic flag on cells', () => {
            const table = createTable()
            const h1 = table.addHeaderCell('theader')
            table.buildBody([['val']])

            // Mark header as dynamic
            table.updateCell(h1, { rawValue: 'Dynamic Header' })
            // We can't set isDynamic through updateCell, but we test the body cell
            const exported = table.exportState()

            // Modify exported data to set isDynamic for testing
            exported.headerTrees.theader[0].isDynamic = true
            exported.body[0][0].isDynamic = true
            exported.body[0][0].computedValue = 'computed!'

            const restored = Table.fromExportData(exported)
            const headerCell = restored.getCellById(h1)
            expect(headerCell?.isDynamic).toBe(true)

            const bodyCellId = exported.body[0][0].cellId
            const bodyCell = restored.getCellById(bodyCellId)
            expect(bodyCell?.isDynamic).toBe(true)
            expect(bodyCell?.computedValue).toBe('computed!')
        })
    })

    describe('layout recomputation after import', () => {
        it('should have valid cell layouts after fromExportData', () => {
            const table = createTable()
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')
            table.buildBody([['a', 'b'], ['c', 'd']])

            const exported = table.exportState()
            const restored = Table.fromExportData(exported)

            // Check that cells have layouts after restoration
            const bodyCellId = exported.body[0][0].cellId
            const cell = restored.getCellById(bodyCellId)
            expect(cell?.layout).toBeDefined()
            expect(cell?.layout?.width).toBeGreaterThan(0)
            expect(cell?.layout?.height).toBeGreaterThan(0)
        })
    })

    describe('full round-trip fidelity', () => {
        it('should produce identical export data after round-trip', () => {
            const table = createTable(
                { overflow: 'increase-height' },
                { borderColor: '#000000', borderWidth: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 } },
            )

            // Build a non-trivial table
            const parent = table.addHeaderCell('theader')
            table.updateCell(parent, { rawValue: 'Group' })
            const c1 = table.addHeaderCell('theader', parent)
            const c2 = table.addHeaderCell('theader', parent)
            table.updateCell(c1, { rawValue: 'Sub1' })
            table.updateCell(c2, { rawValue: 'Sub2' })

            const h3 = table.addHeaderCell('theader')
            table.updateCell(h3, { rawValue: 'Solo' })

            table.buildBody([
                ['a', 'b', 'c'],
                ['d', 'e', 'f'],
            ])

            table.setColumnWidth(0, 40)
            table.setColumnWidth(1, 60)
            table.setColumnWidth(2, 35)
            table.setDefaultCellWidth(50)
            table.setDefaultCellHeight(15)

            // Style a body cell
            const bodyCellId = table.exportState().body[0][1].cellId
            table.updateCell(bodyCellId, {
                style: { fontSize: 16, fontColor: '#0000ff' },
            })

            const exported = table.exportState()
            const restored = Table.fromExportData(exported)
            const reExported = restored.exportState()

            // Compare header trees
            expect(reExported.headerTrees.theader.length).toBe(exported.headerTrees.theader.length)
            expect(reExported.headerTrees.theader[0].rawValue).toBe('Group')
            expect(reExported.headerTrees.theader[0].children.length).toBe(2)
            expect(reExported.headerTrees.theader[1].rawValue).toBe('Solo')

            // Compare body
            expect(reExported.body.length).toBe(exported.body.length)
            for (let r = 0; r < exported.body.length; r++) {
                for (let c = 0; c < exported.body[r].length; c++) {
                    expect(reExported.body[r][c].cellId).toBe(exported.body[r][c].cellId)
                    expect(reExported.body[r][c].rawValue).toBe(exported.body[r][c].rawValue)
                }
            }

            // Compare geometry
            expect(reExported.columnWidths).toEqual(exported.columnWidths)
            expect(reExported.defaultCellWidth).toBe(exported.defaultCellWidth)
            expect(reExported.defaultCellHeight).toBe(exported.defaultCellHeight)

            // Compare settings
            expect(reExported.settings.overflow).toBe(exported.settings.overflow)
            expect(reExported.tableStyle.borderColor).toBe('#000000')

            // Compare styled cell
            const reExportedStyledCell = reExported.body[0][1]
            expect(reExportedStyledCell.style.fontSize).toBe(16)
            expect(reExportedStyledCell.style.fontColor).toBe('#0000ff')
        })
    })

    describe('JSON serialization compatibility', () => {
        it('should survive JSON.stringify/parse round-trip', () => {
            const table = createTable()
            table.addHeaderCell('theader')
            table.addHeaderCell('theader')
            table.buildBody([['hello', 'world']])

            const exported = table.exportState()
            const json = JSON.stringify(exported)
            const parsed = JSON.parse(json)

            const restored = Table.fromExportData(parsed)
            const reExported = restored.exportState()

            expect(reExported.body[0][0].rawValue).toBe('hello')
            expect(reExported.body[0][1].rawValue).toBe('world')
            expect(reExported.headerTrees.theader).toHaveLength(2)
        })
    })
})
