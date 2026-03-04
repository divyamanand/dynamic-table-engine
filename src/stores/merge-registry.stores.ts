import { IMergeRegistry, IStructureStore } from "../interfaces";
import { Rect } from "../types/common";

export class MergeRegistry implements IMergeRegistry {

    private mergeRegistry: Map<string, Rect>
    private structureStore: IStructureStore

    constructor(
        structureStore: IStructureStore
    ) {
        this.mergeRegistry = new Map()
        this.structureStore = structureStore
    }

    createMerge(rect: Rect): void {
        if (this.isValidMerge(rect)) {
            const {cellId} = rect
            this.mergeRegistry.set(cellId, rect)
        }
    }
    deleteMerge(cellId: string): void {
        this.mergeRegistry.delete(cellId)
    }
    getMergeByRootId(cellId: string): Rect | undefined {
        if (this.mergeRegistry.has(cellId)) {
            return this.mergeRegistry.get(cellId)
        }
    }

    isValidMerge(rect: Rect): boolean {
        const {startRow, startCol, endCol, endRow} = rect

        const maxPossibleRowsIndex = this.structureStore.countTotalRows() - 1
        const maxPosisbleColsIndex = this.structureStore.countTotalCols() - 1

        return startRow >= 0 && startCol >= 0 && endCol <= maxPosisbleColsIndex && endRow <= maxPossibleRowsIndex
    }

    private isChild(rect1: Rect, rect2: Rect): boolean {
        const {startRow: x1, startCol: y1, endRow: x2, endCol: y2} = rect1
        const {startRow: x3, startCol: y3, endRow: x4, endCol: y4} = rect2

        return x3 >= x1 && x4 <= x2 && y3 >= y1 && y4 <= y2
    }

    getMergeSet(): Map<string, Rect> {
        const rects = [...this.mergeRegistry.values()]

        rects.sort((a,b) =>  {
            if (a.startRow !== b.startRow) return a.startRow - b.startRow
            if (a.startCol !== b.startCol) return a.startCol - b.startCol
            if (a.endRow !== b.endRow) return b.endRow - a.endRow
            return b.endCol - a.endCol
        })

        const topLevel: Map<string, Rect> = new Map()
        let currentParent: Rect | null = null

        for (const rect of rects) {
            if (!currentParent || !this.isChild(currentParent, rect)) {
                topLevel.set(rect.cellId, rect)
                currentParent = rect
            }
        }

        return topLevel
    }
}
