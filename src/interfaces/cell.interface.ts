import { CellPayload, Region, Style } from "../types/index";

export interface ICell {
    cellID: string;
    inRegion: Region;
    children: ICell[];
    merged: string[];
    mergedInto?: string;
    rawValue: string | number;
    style: Style;
    isDynamic: boolean;
    parent?: ICell;
    computedValue?: string | number;

    getCellChildren(): ICell[];
    addCellChildren(child: ICell): void;
    mergeCell(cellID: string): void;
    getAllMergedCell(): string[];
    unmergeCells(): void;
    getParentOfCell(): ICell | undefined;
    updateCell(payload: CellPayload): void
}
