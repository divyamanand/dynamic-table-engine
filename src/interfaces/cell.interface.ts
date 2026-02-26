import { CellPayload, Region, Style } from "../types/index";

export interface ICell {
    cellID: number;
    inRegion: Region;
    children: number[];
    merged: number[];
    mergedInto?: number;
    rawValue: string | number;
    style: Style;
    parent?: number;
    computedValue?: string | number;

    getCellChildren(): number[];
    addCellChildren(cellID: number): void;
    mergeCell(cellID: number): void;
    getAllMergedCell(): number[];
    unmergeCells(): void;
    getParentOfCell(): number;
    updateCell(payload: CellPayload): void
}
