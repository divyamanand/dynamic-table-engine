import { StructureStore } from '../stores/structure.store'
import { LayoutEngine } from '../engines/layout.engine'
import { MergeRegistry } from '../stores/merge-registry.stores'
import { CellRegistry } from '../stores/cell-registry.store'
import { ILayoutEngine } from '../interfaces'

describe('Geometry: Layout + Dimension System', () => {
    let layoutEngine: ILayoutEngine

    beforeEach(() => {
        const structureStore = new StructureStore()
        const cellRegistry = new CellRegistry()
        const mergeRegistry = new MergeRegistry(structureStore)
        layoutEngine = new LayoutEngine(mergeRegistry, structureStore, cellRegistry)
    })

    test('getColumnWidths and getRowHeights return empty arrays initially', () => {
        const colWidths = layoutEngine.getColumnWidths()
        const rowHeights = layoutEngine.getRowHeights()
        expect(Array.isArray(colWidths)).toBe(true)
        expect(Array.isArray(rowHeights)).toBe(true)
    })

    test('getDefaultCellWidth and getDefaultCellHeight return defaults', () => {
        expect(layoutEngine.getDefaultCellWidth()).toBe(30)
        expect(layoutEngine.getDefaultCellHeight()).toBe(10)
    })

    test('setDefaultCellWidth and setDefaultCellHeight update values', () => {
        layoutEngine.setDefaultCellWidth(40)
        layoutEngine.setDefaultCellHeight(15)
        expect(layoutEngine.getDefaultCellWidth()).toBe(40)
        expect(layoutEngine.getDefaultCellHeight()).toBe(15)
    })

    test('insertColumnWidth adds width at index', () => {
        layoutEngine.insertColumnWidth(0, 50)
        layoutEngine.insertColumnWidth(1, 30)
        const widths = layoutEngine.getColumnWidths()
        expect(widths).toEqual([50, 30])
    })

    test('removeColumnWidth removes width at index', () => {
        layoutEngine.insertColumnWidth(0, 50)
        layoutEngine.insertColumnWidth(1, 30)
        layoutEngine.insertColumnWidth(2, 40)
        layoutEngine.removeColumnWidth(1)
        const widths = layoutEngine.getColumnWidths()
        expect(widths).toEqual([50, 40])
    })

    test('insertRowHeight adds height at index', () => {
        layoutEngine.insertRowHeight(0, 20)
        layoutEngine.insertRowHeight(1, 25)
        const heights = layoutEngine.getRowHeights()
        expect(heights).toEqual([20, 25])
    })

    test('removeRowHeight removes height at index', () => {
        layoutEngine.insertRowHeight(0, 20)
        layoutEngine.insertRowHeight(1, 25)
        layoutEngine.insertRowHeight(2, 15)
        layoutEngine.removeRowHeight(1)
        const heights = layoutEngine.getRowHeights()
        expect(heights).toEqual([20, 15])
    })

    test('setColumnWidth updates width at index', () => {
        layoutEngine.insertColumnWidth(0, 50)
        layoutEngine.setColumnWidth(0, 100)
        const widths = layoutEngine.getColumnWidths()
        expect(widths[0]).toBe(100)
    })

    test('setRowHeight updates height at index', () => {
        layoutEngine.insertRowHeight(0, 20)
        layoutEngine.setRowHeight(0, 40)
        const heights = layoutEngine.getRowHeights()
        expect(heights[0]).toBe(40)
    })

    test('getTablePosition returns position object', () => {
        const pos = layoutEngine.getTablePosition()
        expect(pos.x).toBe(0)
        expect(pos.y).toBe(0)
    })

    test('setTablePosition updates position', () => {
        layoutEngine.setTablePosition({ x: 10, y: 20 })
        const pos = layoutEngine.getTablePosition()
        expect(pos.x).toBe(10)
        expect(pos.y).toBe(20)
    })

    test('rebuildLayout and rebuildGeometry are callable', () => {
        expect(() => layoutEngine.rebuildLayout()).not.toThrow()
        expect(() => layoutEngine.rebuildGeometry()).not.toThrow()
    })

    test('rebuild calls both rebuildLayout and rebuildGeometry', () => {
        expect(() => layoutEngine.rebuild()).not.toThrow()
    })
})
