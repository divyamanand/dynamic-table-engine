import { Rect } from "../../types/common";

export interface IMergeRegistry {
    //keep private in class
    // mergeRegistry: Map<string, MergeRegion>

    //it will take all the cells and the root will be the minimum of col or row
    createMerge(rect: Rect): void
    isValidMerge(rect: Rect): boolean
    getMergeByRootId(cellId: string): Rect | undefined
    deleteMerge(cellId: string): void
    getMergeSet(): Map<string, Rect>
}