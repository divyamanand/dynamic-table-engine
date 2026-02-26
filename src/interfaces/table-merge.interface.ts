/**
 * ITableMerge - Multi-cell merge state coordination
 * Consumed by: merge UI components, merge operations
 * Responsibility: Merge and unmerge cell groups
 */
export interface ITableMerge {
    mergeCells(selectedCellsIDs: string[]): void;
    unmergeCells(selectedCellID: string): void;
}
