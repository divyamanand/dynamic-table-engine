import { CellPayload, Region, Style } from "./types/index";
import { ICell } from "./interfaces";

export class Cell implements ICell {
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

    constructor(
        cellID: string,
        inRegion?: Region,
        children: ICell[] = [],
        merged: string[] = [],
        rawValue: string | number = "",
        isDynamic: boolean = false,
        style?: Style,
        computedValue?: string | number,
        parent?: ICell,
        mergedInto?: string
    ) {
        this.cellID = cellID;
        this.inRegion = inRegion!;
        this.children = children;
        this.merged = merged;
        this.mergedInto = mergedInto;
        this.rawValue = rawValue;
        this.isDynamic = isDynamic;
        this.style = style!;
        this.computedValue = computedValue;
        this.parent = parent;
    }

    getAllMergedCell(): string[] {
        return this.merged;
    }

    getCellChildren(): ICell[] {
        return this.children;
    }


    addCellChildren(child: ICell): void {
        if (!this.children.includes(child)) {
            this.children.push(child);
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

    getParentOfCell(): ICell | undefined {
        return this.parent;
    }

    updateCell(payload: CellPayload): void {
    for (const [key, value] of Object.entries(payload)) {

        if (value !== undefined) {
            (this as any)[key] = value;
        }
    }}
    
}