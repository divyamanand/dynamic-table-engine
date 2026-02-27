import { CellLayout, CellPayload, Region, Style } from "../types/index";
import { ICell } from "../interfaces";

export class Cell implements ICell {
    cellID: string;
    private _layout?: CellLayout;
    inRegion: Region;
    children: ICell[];
    rawValue: string | number;
    style: Style;
    isDynamic: boolean;
    parent?: ICell;
    computedValue?: string | number;

    constructor(
        cellID: string,
        inRegion?: Region,
        children: ICell[] = [],
        rawValue: string | number = "",
        isDynamic: boolean = false,
        style?: Style,
        computedValue?: string | number,
        parent?: ICell
    ) {
        this.cellID = cellID;
        this.inRegion = inRegion!;
        this.children = children;
        this.rawValue = rawValue;
        this.isDynamic = isDynamic;
        this.style = style!;
        this.computedValue = computedValue;
        this.parent = parent;
    }

    get layout(): CellLayout | undefined {
        return this._layout;
    }

    _setLayout(layout: CellLayout): void {
        this._layout = layout;
    }

    getCellChildren(): ICell[] {
        return this.children;
    }

    addCellChildren(child: ICell): void {
        if (!this.children.includes(child)) {
            this.children.push(child);
        }
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