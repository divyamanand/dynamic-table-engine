import { ITableMerge } from "../table/table-merge.interface";
import { MergeRegion } from "../../types";

/**
 * IMergeService - Multi-cell merge state coordination
 * Extends ITableMerge with internal registry query methods.
 * Responsibility: Merge operations, merge state tracking and queries
 */
export interface IMergeService extends ITableMerge {
    /**
     * Get merge region by root cell ID.
     *
     * @param rootID - The ID of the root cell in the merge
     * @returns The merge region if it exists, undefined otherwise
     */
    getMerge(rootID: string): MergeRegion | undefined;

    /**
     * Find merge region containing the given row and column.
     *
     * @param r - The row number
     * @param c - The column number
     * @returns The merge region if found, undefined otherwise
     */
    findByCell(r: number, c: number): MergeRegion | undefined;

    /**
     * Get all merge regions.
     *
     * @returns Read-only map of all merges
     */
    getAllMerges(): ReadonlyMap<string, MergeRegion>;
}
