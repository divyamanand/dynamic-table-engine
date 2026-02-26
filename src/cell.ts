import { CellAddress, CellPayload, Region, Style } from "./types/index";
import { ICell } from "./interfaces/index";

export class Cell implements ICell {
    cellID: number;
    inRegion: Region;
    children: number[];
    merged: number[];
    mergedInto?: number;
    rawValue: string | number;
    style: Style;
    parent?: number;
    computedValue?: string | number;

    constructor(
        cellID: number,
        inRegion?: Region,
        children: number[] = [],
        merged: number[] = [],
        rawValue: string | number = "",
        style?: Style,
        computedValue?: string | number,
        parent?: number,
        mergedInto?: number
    ) {
        this.cellID = cellID;
        this.inRegion = inRegion!;
        this.children = children;
        this.merged = merged;
        this.mergedInto = mergedInto;
        this.rawValue = rawValue;
        this.style = style!;
        this.computedValue = computedValue;
        this.parent = parent;
    }

    getAllMergedCell(): number[] {
        return this.merged;
    }

    getCellChildren(): number[] {
        return this.children;
    }


    addCellChildren(cellID: number): void {
        if (!this.children.includes(cellID)) {
            this.children.push(cellID);
        }
    }

    mergeCell(cellID: number): void {
        if (!this.merged.includes(cellID)) {
            this.merged.push(cellID);
        }
    }

    unmergeCells(): void {
        this.merged = [];
    }

    getParentOfCell(): number {
        return this.parent ?? -1;
    }

    updateCell(payload: CellPayload): void {
    for (const [key, value] of Object.entries(payload)) {

        if (value !== undefined) {
            (this as any)[key] = value;
        }
    }}
    
}