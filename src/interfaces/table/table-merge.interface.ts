
export interface ITableMerge {
    mergeCells(selectedCellsIDs: string[]): void;
    unmergeCells(selectedCellID: string): void;
}
