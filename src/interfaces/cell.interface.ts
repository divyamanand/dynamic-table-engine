import { CellPayload, Region, Style } from "../types/index";

export interface ICell {
    cellID: string;
    inRegion: Region;
    children: string[];
    merged: string[];
    mergedInto?: string;
    rawValue: string | number;
    style: Style;
    parent?: string;
    computedValue?: string | number;

    getCellChildren(): string[];
    addCellChildren(cellID: string): void;
    mergeCell(cellID: string): void;
    getAllMergedCell(): string[];
    unmergeCells(): void;
    getParentOfCell(): string | number;
    updateCell(payload: CellPayload): void
}
