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
}
