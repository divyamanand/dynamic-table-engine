import { IMergeRegistry } from "../interfaces";
import { Rect } from "../types/common";

export class MergeRegistry implements IMergeRegistry {

    private mergeRegistry: Map<string, Rect>

    constructor() {
        this.mergeRegistry = new Map()
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
        
    }
}
