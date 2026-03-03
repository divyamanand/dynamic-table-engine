import { ICellRegistry, ILayoutEngine, IMergeRegistry, IStructureStore } from "../interfaces";
import { Cell } from "../core/cell";
import { Region } from "../types";

export class LayoutEngine implements ILayoutEngine {

    private mergeRegistry: IMergeRegistry
    private structureStore: IStructureStore
    private cellRegistry: ICellRegistry

    constructor(
        mergeRegistry: IMergeRegistry,
        structureStore: IStructureStore,
        cellRegistry: ICellRegistry
    ) {
        this.mergeRegistry = mergeRegistry
        this.structureStore = structureStore
        this.cellRegistry = cellRegistry
    }

    private calculateColSpan(cellId: string, res: Map<string, number>): number {
        if (this.structureStore.isLeafCell(cellId)) {
            res.set(cellId, 1)
            return 1
        }

        let total = 0
        const children = this.structureStore.getChildren(cellId) ?? []

        for (const child of children) {
            total += this.calculateColSpan(child, res)
        }

        res.set(cellId, total)
        return total
    }

    private calculateRowSpan(cellId: string, res: Map<string, number>, currLevel: number, heightMax: number): void {
        if (this.structureStore.isLeafCell(cellId)) {
            res.set(cellId, heightMax - currLevel + 1)
            return
        } else {
            res.set(cellId, 1)
        }

        const children = this.structureStore.getChildren(cellId) ?? []

        for (const child of children) {
            this.calculateRowSpan(child, res, currLevel + 1, heightMax)
        }

    }
    
    private applyLayoutForCell(
        cellId: string,
        rowStart: number,
        colStart: number,
        rowSpanMap: Map<string, number>,
        colSpanMap: Map<string, number>
    ): void {
        const cell = this.cellRegistry.getCellById(cellId) as Cell
        const rowSpan = rowSpanMap.get(cellId) ?? 1
        const colSpan = colSpanMap.get(cellId) ?? 1

        cell._setLayout({ row: rowStart, col: colStart, rowSpan, colSpan })
        this.cellRegistry.setCellAddress(cellId, rowStart, colStart)

        const children = this.structureStore.getChildren(cellId) ?? []
        let childColStart = colStart

        for (const child of children) {
            this.applyLayoutForCell(child, rowStart + rowSpan, childColStart, rowSpanMap, colSpanMap)
            childColStart += colSpanMap.get(child) ?? 1
        }
    }

    applyHeaderLayout(region: Region): void {
        const roots = this.structureStore.getRoots(region) ?? []

        const maxHeight = roots.reduce((max, root) => {
            return Math.max(max, this.structureStore.getHeightOfCell(root))
        }, 0)

        let colStart = 0

        for (const root of roots) {
            const rowSpanMap: Map<string, number> = new Map()
            const colSpanMap: Map<string, number> = new Map()

            this.calculateRowSpan(root, rowSpanMap, 1, maxHeight)
            this.calculateColSpan(root, colSpanMap)

            this.applyLayoutForCell(root, 0, colStart, rowSpanMap, colSpanMap)

            colStart += colSpanMap.get(root) ?? 1
        }
    }

    applyBodyLayout(): void {
        const roots = this.structureStore.getRoots("theader") ?? []
        const headerRows = roots.reduce((max, root) =>
            Math.max(max, this.structureStore.getHeightOfCell(root)), 0)

        const body = this.structureStore.getBody()
        for (let r = 0; r < body.length; r++) {
            for (let c = 0; c < body[r].length; c++) {
                this.cellRegistry.setCellAddress(body[r][c], headerRows + r, c)
            }
        }
    }

    rebuild(): void {
        // TODO: implement
    }

    isLayoutDirty(): boolean {
        // TODO: implement
        return false
    }
}