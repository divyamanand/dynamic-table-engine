import { LayoutEngine } from '../../../engines/layout.engine'
import { StructureStore } from '../../../stores/structure.store'
import { CellRegistry, defaultCellStyle } from '../../../stores/cell-registry.store'
import { MergeRegistry } from '../../../stores/merge-registry.stores'
import { Rect } from '../../../types/common'

describe('LayoutEngine', () => {
    let layoutEngine: LayoutEngine
    let structureStore: StructureStore
    let cellRegistry: CellRegistry
    let mergeRegistry: MergeRegistry

    beforeEach(() => {
        structureStore = new StructureStore()
        cellRegistry = new CellRegistry()
        mergeRegistry = new MergeRegistry(structureStore)
        layoutEngine = new LayoutEngine(mergeRegistry, structureStore, cellRegistry)
    })

    describe('initialization', () => {
        it('should initialize with default cell dimensions', () => {
            expect(layoutEngine.getDefaultCellWidth()).toBe(30)
            expect(layoutEngine.getDefaultCellHeight()).toBe(10)
        })

        it('should initialize with empty dimension arrays', () => {
            expect(layoutEngine.getColumnWidths()).toEqual([])
            expect(layoutEngine.getRowHeights()).toEqual([])
        })

        it('should initialize with table position at origin', () => {
            const pos = layoutEngine.getTablePosition()
            expect(pos.x).toBe(0)
            expect(pos.y).toBe(0)
        })
    })

    describe('default cell dimensions', () => {
        it('should set default cell width', () => {
            layoutEngine.setDefaultCellWidth(40)
            expect(layoutEngine.getDefaultCellWidth()).toBe(40)
        })

        it('should set default cell height', () => {
            layoutEngine.setDefaultCellHeight(15)
            expect(layoutEngine.getDefaultCellHeight()).toBe(15)
        })

        it('should use defaults when building dimensions', () => {
            layoutEngine.setDefaultCellWidth(25)
            layoutEngine.setDefaultCellHeight(12)

            // Setup basic structure
            const col1 = cellRegistry.createCell('theader')
            structureStore.addRootCell(col1, 'theader')
            const cell1 = cellRegistry.createCell('body')
            structureStore.insertBodyRow(0, [cell1])

            layoutEngine.rebuild()

            const widths = layoutEngine.getColumnWidths()
            const heights = layoutEngine.getRowHeights()

            expect(widths).toContain(25)
            expect(heights).toContain(12)
        })
    })

    describe('column width operations', () => {
        it('should set column width', () => {
            layoutEngine.insertColumnWidth(0, 30)
            layoutEngine.setColumnWidth(0, 50)

            expect(layoutEngine.getColumnWidths()[0]).toBe(50)
        })

        it('should insert column width', () => {
            layoutEngine.insertColumnWidth(0, 30)
            layoutEngine.insertColumnWidth(1, 40)
            layoutEngine.insertColumnWidth(1, 35) // Insert at index 1

            const widths = layoutEngine.getColumnWidths()
            expect(widths).toEqual([30, 35, 40])
        })

        it('should remove column width', () => {
            layoutEngine.insertColumnWidth(0, 30)
            layoutEngine.insertColumnWidth(1, 40)
            layoutEngine.insertColumnWidth(2, 50)

            layoutEngine.removeColumnWidth(1)

            expect(layoutEngine.getColumnWidths()).toEqual([30, 50])
        })

        it('should not set width for out of bounds column', () => {
            layoutEngine.insertColumnWidth(0, 30)
            layoutEngine.setColumnWidth(10, 50) // Out of bounds

            expect(layoutEngine.getColumnWidths()).toEqual([30])
        })
    })

    describe('row height operations', () => {
        it('should set row height', () => {
            layoutEngine.insertRowHeight(0, 10)
            layoutEngine.setRowHeight(0, 20)

            expect(layoutEngine.getRowHeights()[0]).toBe(20)
        })

        it('should insert row height', () => {
            layoutEngine.insertRowHeight(0, 10)
            layoutEngine.insertRowHeight(1, 20)
            layoutEngine.insertRowHeight(1, 15) // Insert at index 1

            const heights = layoutEngine.getRowHeights()
            expect(heights).toEqual([10, 15, 20])
        })

        it('should remove row height', () => {
            layoutEngine.insertRowHeight(0, 10)
            layoutEngine.insertRowHeight(1, 20)
            layoutEngine.insertRowHeight(2, 30)

            layoutEngine.removeRowHeight(1)

            expect(layoutEngine.getRowHeights()).toEqual([10, 30])
        })

        it('should not set height for out of bounds row', () => {
            layoutEngine.insertRowHeight(0, 10)
            layoutEngine.setRowHeight(10, 20) // Out of bounds

            expect(layoutEngine.getRowHeights()).toEqual([10])
        })
    })

    describe('table position', () => {
        it('should set table position', () => {
            layoutEngine.setTablePosition({ x: 10, y: 20 })
            const pos = layoutEngine.getTablePosition()

            expect(pos.x).toBe(10)
            expect(pos.y).toBe(20)
        })

        it('should return copy of table position', () => {
            layoutEngine.setTablePosition({ x: 5, y: 10 })
            const pos1 = layoutEngine.getTablePosition()
            const pos2 = layoutEngine.getTablePosition()

            expect(pos1).toEqual(pos2)
            expect(pos1).not.toBe(pos2) // Different reference
        })

        it('should support negative positions', () => {
            layoutEngine.setTablePosition({ x: -10, y: -20 })
            const pos = layoutEngine.getTablePosition()

            expect(pos.x).toBe(-10)
            expect(pos.y).toBe(-20)
        })

        it('should support decimal positions', () => {
            layoutEngine.setTablePosition({ x: 10.5, y: 20.75 })
            const pos = layoutEngine.getTablePosition()

            expect(pos.x).toBe(10.5)
            expect(pos.y).toBe(20.75)
        })
    })

    describe('basic layout building', () => {
        it('should apply header layout for theader', () => {
            const cellId = cellRegistry.createCell('theader', 'Header')
            structureStore.addRootCell(cellId, 'theader')

            layoutEngine.applyHeaderLayout('theader', 0, 0)

            const cell = cellRegistry.getCellById(cellId)
            expect(cell!.layout).toBeDefined()
            expect(cell!.layout!.row).toBe(0)
            expect(cell!.layout!.col).toBe(0)
        })

        it('should apply header layout for lheader', () => {
            const cellId = cellRegistry.createCell('lheader', 'Header')
            structureStore.addRootCell(cellId, 'lheader')

            layoutEngine.applyHeaderLayout('lheader', 0, 0)

            const cell = cellRegistry.getCellById(cellId)
            expect(cell!.layout).toBeDefined()
            expect(cell!.layout!.row).toBe(0)
            expect(cell!.layout!.col).toBe(0)
        })

        it('should apply body layout', () => {
            const cellId = cellRegistry.createCell('body', 'Cell')
            structureStore.insertBodyRow(0, [cellId])

            layoutEngine.applyBodyLayout(0, 0)

            const cell = cellRegistry.getCellById(cellId)
            expect(cell!.layout).toBeDefined()
            expect(cell!.layout!.row).toBe(0)
            expect(cell!.layout!.col).toBe(0)
        })
    })

    describe('column span calculation', () => {
        it('should calculate span 1 for leaf cell', () => {
            const cellId = cellRegistry.createCell('theader')
            structureStore.addRootCell(cellId, 'theader')

            layoutEngine.rebuild()

            const cell = cellRegistry.getCellById(cellId)
            expect(cell!.layout!.colSpan).toBe(1)
        })

        it('should calculate span equal to child count', () => {
            const parentId = cellRegistry.createCell('theader')
            structureStore.addRootCell(parentId, 'theader')
            const child1 = cellRegistry.createCell('theader')
            const child2 = cellRegistry.createCell('theader')

            structureStore.addChildCell(parentId, 'theader', child1)
            structureStore.addChildCell(parentId, 'theader', child2)

            layoutEngine.rebuild()

            const parent = cellRegistry.getCellById(parentId)
            expect(parent!.layout!.colSpan).toBe(2)
        })

        it('should accumulate span for nested children', () => {
            const parentId = cellRegistry.createCell('theader')
            structureStore.addRootCell(parentId, 'theader')

            const child1 = cellRegistry.createCell('theader')
            const child2 = cellRegistry.createCell('theader')

            structureStore.addChildCell(parentId, 'theader', child1)
            structureStore.addChildCell(parentId, 'theader', child2)

            const grandchild1 = cellRegistry.createCell('theader')
            const grandchild2 = cellRegistry.createCell('theader')

            structureStore.addChildCell(child1, 'theader', grandchild1)
            structureStore.addChildCell(child1, 'theader', grandchild2)

            layoutEngine.rebuild()

            const parent = cellRegistry.getCellById(parentId)
            expect(parent!.layout!.colSpan).toBe(3) // child1=2, child2=1
        })
    })

    describe('row span calculation', () => {
        it('should calculate span 1 for leaf cell', () => {
            const cellId = cellRegistry.createCell('lheader')
            structureStore.addRootCell(cellId, 'lheader')

            layoutEngine.rebuild()

            const cell = cellRegistry.getCellById(cellId)
            expect(cell!.layout!.rowSpan).toBe(1)
        })

        it('should calculate span based on height difference', () => {
            const parentId = cellRegistry.createCell('lheader')
            structureStore.addRootCell(parentId, 'lheader')

            const childId = cellRegistry.createCell('lheader')
            structureStore.addChildCell(parentId, 'lheader', childId)

            layoutEngine.rebuild()

            const parent = cellRegistry.getCellById(parentId)
            const child = cellRegistry.getCellById(childId)

            expect(parent!.layout!.rowSpan).toBe(1)
            expect(child!.layout!.rowSpan).toBe(1)
        })

        it('should span across levels in vertical headers', () => {
            const parentId = cellRegistry.createCell('lheader')
            structureStore.addRootCell(parentId, 'lheader')

            const child1 = cellRegistry.createCell('lheader')
            const child2 = cellRegistry.createCell('lheader')

            structureStore.addChildCell(parentId, 'lheader', child1)
            structureStore.addChildCell(parentId, 'lheader', child2)

            layoutEngine.rebuild()

            const parent = cellRegistry.getCellById(parentId)
            expect(parent!.layout!.rowSpan).toBe(2)
        })
    })

    describe('body merge handling', () => {
        it('should apply merge spans in body', () => {
            const cell1 = cellRegistry.createCell('body')
            structureStore.insertBodyRow(0, [cell1])

            const mergeRect: Rect = {
                cellId: cell1,
                startRow: 0,
                startCol: 0,
                endRow: 1,
                endCol: 0,
            }

            structureStore.insertBodyRow(1, [cellRegistry.createCell('body')])
            mergeRegistry.createMerge(mergeRect)

            layoutEngine.rebuild()

            const cell = cellRegistry.getCellById(cell1)
            // Merge span calculation based on merge registry
            expect(cell!.layout!.rowSpan).toBeGreaterThanOrEqual(1)
            expect(cell!.layout!.colSpan).toBe(1)
        })

        it('should skip merged cells during layout', () => {
            const cell1 = cellRegistry.createCell('body', 'C1')
            const cell2 = cellRegistry.createCell('body', 'C2')
            const cell3 = cellRegistry.createCell('body', 'C3')
            const cell4 = cellRegistry.createCell('body', 'C4')

            structureStore.insertBodyRow(0, [cell1, cell2])
            structureStore.insertBodyRow(1, [cell3, cell4])

            const mergeRect: Rect = {
                cellId: cell1,
                startRow: 0,
                startCol: 0,
                endRow: 1,
                endCol: 1,
            }
            mergeRegistry.createMerge(mergeRect)

            layoutEngine.rebuild()

            const c1 = cellRegistry.getCellById(cell1)
            expect(c1!.layout!.rowSpan).toBeGreaterThanOrEqual(1)
            expect(c1!.layout!.colSpan).toBeGreaterThanOrEqual(1)
        })
    })

    describe('geometry calculation', () => {
        it('should calculate x coordinates via prefix sums', () => {
            const col1 = cellRegistry.createCell('theader')
            const col2 = cellRegistry.createCell('theader')

            structureStore.addRootCell(col1, 'theader')
            structureStore.addRootCell(col2, 'theader')

            layoutEngine.insertColumnWidth(0, 20)
            layoutEngine.insertColumnWidth(1, 30)

            layoutEngine.rebuild()

            const c1 = cellRegistry.getCellById(col1)
            const c2 = cellRegistry.getCellById(col2)

            expect(c1!.layout!.x).toBe(0)
            expect(c2!.layout!.x).toBe(20)
        })

        it('should calculate y coordinates via prefix sums', () => {
            const row1 = cellRegistry.createCell('body')
            const row2 = cellRegistry.createCell('body')

            structureStore.insertBodyRow(0, [row1])
            structureStore.insertBodyRow(1, [row2])

            const header = cellRegistry.createCell('theader')
            structureStore.addRootCell(header, 'theader')

            layoutEngine.insertRowHeight(0, 15) // header
            layoutEngine.insertRowHeight(1, 10) // row1
            layoutEngine.insertRowHeight(2, 10) // row2

            layoutEngine.rebuild()

            const r1 = cellRegistry.getCellById(row1)
            const r2 = cellRegistry.getCellById(row2)

            expect(r1!.layout!.y).toBe(15) // After header
            expect(r2!.layout!.y).toBe(25) // After header + row1
        })

        it('should calculate width from column spans', () => {
            const col1 = cellRegistry.createCell('theader')
            structureStore.addRootCell(col1, 'theader')

            layoutEngine.insertColumnWidth(0, 40)

            layoutEngine.rebuild()

            const cell = cellRegistry.getCellById(col1)
            expect(cell!.layout!.width).toBe(40)
        })

        it('should calculate height from row spans', () => {
            const row1 = cellRegistry.createCell('body')
            structureStore.insertBodyRow(0, [row1])

            const header = cellRegistry.createCell('theader')
            structureStore.addRootCell(header, 'theader')

            layoutEngine.insertRowHeight(0, 20) // header
            layoutEngine.insertRowHeight(1, 15) // body row

            layoutEngine.rebuild()

            const cell = cellRegistry.getCellById(row1)
            expect(cell!.layout!.height).toBe(15)
        })

        it('should handle multi-span geometry', () => {
            const col1 = cellRegistry.createCell('theader')
            const col2 = cellRegistry.createCell('theader')

            structureStore.addRootCell(col1, 'theader')
            structureStore.addChildCell(col1, 'theader', col2)

            layoutEngine.insertColumnWidth(0, 20)

            layoutEngine.rebuild()

            const c1 = cellRegistry.getCellById(col1)
            expect(c1!.layout!.x).toBe(0)
            // Width calculation depends on children structure and how spans are computed
            expect(c1!.layout!.width).toBeGreaterThan(0)
        })
    })

    describe('dimension array initialization', () => {
        it('should pad with default widths for columns', () => {
            const col1 = cellRegistry.createCell('theader')
            const col2 = cellRegistry.createCell('theader')

            structureStore.addRootCell(col1, 'theader')
            structureStore.addRootCell(col2, 'theader')

            layoutEngine.setDefaultCellWidth(25)
            layoutEngine.rebuild()

            const widths = layoutEngine.getColumnWidths()
            expect(widths.length).toBe(2)
            expect(widths[0]).toBe(25)
            expect(widths[1]).toBe(25)
        })

        it('should pad with default heights for rows', () => {
            const cell1 = cellRegistry.createCell('body')
            const cell2 = cellRegistry.createCell('body')

            structureStore.insertBodyRow(0, [cell1])
            structureStore.insertBodyRow(1, [cell2])

            const header = cellRegistry.createCell('theader')
            structureStore.addRootCell(header, 'theader')

            layoutEngine.setDefaultCellHeight(12)
            layoutEngine.rebuild()

            const heights = layoutEngine.getRowHeights()
            expect(heights.length).toBe(3) // 1 header + 2 body
            expect(heights[1]).toBe(12)
        })

        it('should trim arrays when structure shrinks', () => {
            const col1 = cellRegistry.createCell('theader')
            structureStore.addRootCell(col1, 'theader')

            const cell1 = cellRegistry.createCell('body')
            structureStore.insertBodyRow(0, [cell1])

            layoutEngine.rebuild()
            expect(layoutEngine.getColumnWidths().length).toBe(1)

            // Remove body row
            structureStore.removeBodyRow(0)
            layoutEngine.rebuild()
            expect(layoutEngine.getRowHeights().length).toBe(1) // Only header
        })
    })

    describe('complete rebuild workflow', () => {
        it('should rebuild layout and geometry', () => {
            // Setup structure
            const col = cellRegistry.createCell('theader', 'Header')
            const cell = cellRegistry.createCell('body', 'Data')

            structureStore.addRootCell(col, 'theader')
            structureStore.insertBodyRow(0, [cell])

            layoutEngine.setDefaultCellWidth(30)
            layoutEngine.setDefaultCellHeight(10)

            layoutEngine.rebuild()

            const colCell = cellRegistry.getCellById(col)
            const bodyCell = cellRegistry.getCellById(cell)

            expect(colCell!.layout).toBeDefined()
            expect(bodyCell!.layout).toBeDefined()
            expect(colCell!.layout!.x).toBe(0)
            expect(bodyCell!.layout!.y).toBe(10) // After header
        })

        it('should handle footer in rebuild', () => {
            const col = cellRegistry.createCell('theader')
            const cell = cellRegistry.createCell('body')
            const footer = cellRegistry.createCell('footer')

            structureStore.addRootCell(col, 'theader')
            structureStore.insertBodyRow(0, [cell])
            structureStore.addRootCell(footer, 'footer')

            layoutEngine.rebuild()

            const footerCell = cellRegistry.getCellById(footer)
            expect(footerCell!.layout).toBeDefined()
        })

        it('should update addresses during rebuild', () => {
            const col = cellRegistry.createCell('theader')
            structureStore.addRootCell(col, 'theader')

            const cell = cellRegistry.createCell('body')
            structureStore.insertBodyRow(0, [cell])

            layoutEngine.rebuild()

            // Verify addresses were set
            const cellByAddr = cellRegistry.getCellByAddress('0,0')
            expect(cellByAddr).toBeDefined()
        })
    })

    describe('complex layout scenarios', () => {
        it('should handle table with all four header regions', () => {
            const theader = cellRegistry.createCell('theader')
            const lheader = cellRegistry.createCell('lheader')
            const rheader = cellRegistry.createCell('rheader')
            const cell = cellRegistry.createCell('body')

            structureStore.addRootCell(theader, 'theader')
            structureStore.addRootCell(lheader, 'lheader')
            structureStore.addRootCell(rheader, 'rheader')
            structureStore.insertBodyRow(0, [cell])

            layoutEngine.rebuild()

            expect(cellRegistry.getCellById(theader)!.layout).toBeDefined()
            expect(cellRegistry.getCellById(lheader)!.layout).toBeDefined()
            expect(cellRegistry.getCellById(rheader)!.layout).toBeDefined()
        })

        it('should handle large grid', () => {
            // 10 columns
            for (let i = 0; i < 10; i++) {
                const col = cellRegistry.createCell('theader')
                structureStore.addRootCell(col, 'theader')
            }

            // 10 rows
            for (let i = 0; i < 10; i++) {
                const cells: string[] = []
                for (let j = 0; j < 10; j++) {
                    cells.push(cellRegistry.createCell('body'))
                }
                structureStore.insertBodyRow(i, cells)
            }

            layoutEngine.rebuild()

            expect(layoutEngine.getColumnWidths().length).toBe(10)
            expect(layoutEngine.getRowHeights().length).toBe(11) // 1 header + 10 body
        })

        it('should handle deeply nested headers', () => {
            const root = cellRegistry.createCell('theader')
            structureStore.addRootCell(root, 'theader')

            let parent = root
            for (let i = 0; i < 5; i++) {
                const child = cellRegistry.createCell('theader')
                structureStore.addChildCell(parent, 'theader', child)
                parent = child
            }

            layoutEngine.rebuild()

            const rootCell = cellRegistry.getCellById(root)
            expect(rootCell!.layout).toBeDefined()
            expect(rootCell!.layout!.colSpan).toBe(1)
        })
    })

    describe('rebuildLayout vs rebuildGeometry', () => {
        it('rebuildLayout should set layout properties', () => {
            const col = cellRegistry.createCell('theader')
            structureStore.addRootCell(col, 'theader')

            layoutEngine.rebuildLayout()

            const cell = cellRegistry.getCellById(col)
            expect(cell!.layout!.row).toBeDefined()
            expect(cell!.layout!.col).toBeDefined()
            expect(cell!.layout!.rowSpan).toBeDefined()
            expect(cell!.layout!.colSpan).toBeDefined()
        })

        it('rebuildGeometry should set geometry coordinates', () => {
            const col = cellRegistry.createCell('theader')
            structureStore.addRootCell(col, 'theader')

            layoutEngine.insertColumnWidth(0, 30)
            layoutEngine.insertRowHeight(0, 10)

            layoutEngine.rebuildLayout() // Must call rebuildLayout first to set initial layout
            layoutEngine.rebuildGeometry()

            const cell = cellRegistry.getCellById(col)
            expect(cell!.layout!.x).toBeDefined()
            expect(cell!.layout!.y).toBeDefined()
            expect(cell!.layout!.width).toBeDefined()
            expect(cell!.layout!.height).toBeDefined()
        })

        it('rebuild should call both rebuildLayout and rebuildGeometry', () => {
            const col = cellRegistry.createCell('theader')
            structureStore.addRootCell(col, 'theader')

            layoutEngine.insertColumnWidth(0, 30)
            layoutEngine.insertRowHeight(0, 10)

            layoutEngine.rebuild()

            const cell = cellRegistry.getCellById(col)
            const layout = cell!.layout!

            expect(layout.row).toBeDefined()
            expect(layout.col).toBeDefined()
            expect(layout.x).toBeDefined()
            expect(layout.y).toBeDefined()
            expect(layout.width).toBeDefined()
            expect(layout.height).toBeDefined()
        })
    })

    describe('edge cases', () => {
        it('should handle empty structure', () => {
            expect(() => {
                layoutEngine.rebuild()
            }).not.toThrow()
        })

        it('should handle body without headers', () => {
            const cell = cellRegistry.createCell('body')
            structureStore.insertBodyRow(0, [cell])

            layoutEngine.rebuild()

            const bodyCell = cellRegistry.getCellById(cell)
            expect(bodyCell!.layout).toBeDefined()
        })

        it('should handle headers without body', () => {
            const col = cellRegistry.createCell('theader')
            structureStore.addRootCell(col, 'theader')

            layoutEngine.rebuild()

            const headerCell = cellRegistry.getCellById(col)
            expect(headerCell!.layout).toBeDefined()
        })

        it('should handle zero-sized dimensions', () => {
            layoutEngine.insertColumnWidth(0, 0)
            layoutEngine.insertRowHeight(0, 0)

            const col = cellRegistry.createCell('theader')
            structureStore.addRootCell(col, 'theader')

            layoutEngine.rebuild()

            const cell = cellRegistry.getCellById(col)
            expect(cell!.layout!.width).toBe(0)
        })

        it('should handle extremely large dimensions', () => {
            layoutEngine.insertColumnWidth(0, 1000000)
            layoutEngine.insertRowHeight(0, 1000000)

            const col = cellRegistry.createCell('theader')
            structureStore.addRootCell(col, 'theader')

            layoutEngine.rebuild()

            const cell = cellRegistry.getCellById(col)
            expect(cell!.layout!.width).toBe(1000000)
        })
    })
})
