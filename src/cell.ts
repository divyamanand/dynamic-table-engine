import { CellPayload, Region, Style } from "./types/index";
import { ICell } from "./interfaces";

export class Cell implements ICell {
    cellID: string;
    inRegion: Region;
    children: string[];
    merged: string[];
    mergedInto?: string;
    rawValue: string | number;
    style: Style;
    parent?: string;
    computedValue?: string | number;

    constructor(
        cellID: string,
        inRegion?: Region,
        children: string[] = [],
        merged: string[] = [],
        rawValue: string | number = "",
        style?: Style,
        computedValue?: string | number,
        parent?: string,
        mergedInto?: string
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

    getAllMergedCell(): string[] {
        return this.merged;
    }

    getCellChildren(): string[] {
        return this.children;
    }


    addCellChildren(cellID: string): void {
        if (!this.children.includes(cellID)) {
            this.children.push(cellID);
        }
    }

    mergeCell(cellID: string): void {
        if (!this.merged.includes(cellID)) {
            this.merged.push(cellID);
        }
    }

    unmergeCells(): void {
        this.merged = [];
    }

    getParentOfCell(): string | number {
        return this.parent ?? -1;
    }

    updateCell(payload: CellPayload): void {
    for (const [key, value] of Object.entries(payload)) {

        if (value !== undefined) {
            (this as any)[key] = value;
        }
    }}
    
}