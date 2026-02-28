import { MergeRegion } from "../../types";
import { Rect } from "../../types/common";

export interface IMergeRegistry {
    //keep private in class
    // mergeRegistry: Map<string, MergeRegion>

    //it will take all the cells and the root will be the minimum of col or row
    createMerge(rect: Rect): string
    isValidMerge(rect: Rect): boolean
    getMergeByRootId(cellID: string): MergeRegion | undefined
    deleteMerge(cellID: string): void
}