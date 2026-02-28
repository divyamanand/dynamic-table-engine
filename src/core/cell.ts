import { CellLayout,Region, Style } from "../types/index";
import { ICell } from "../interfaces";

export class Cell implements ICell {
    public readonly cellID: string;
    public inRegion: Region;
    public rawValue: string | number;
    public style: Style;
    public isDynamic: boolean;
    public computedValue?: string | number;
    
    private _layout?: CellLayout;

    constructor(
        cellID: string,
        inRegion: Region,
        rawValue: string | number,
        isDynamic: boolean = false,
        style: Style,
        computedValue?: string | number,
    ) {
        this.cellID = cellID;
        this.inRegion = inRegion;
        this.rawValue = rawValue;
        this.isDynamic = isDynamic;
        this.style = style;
        this.computedValue = computedValue;
    }

    public get layout(): CellLayout | undefined {
        return this._layout;
    }

    public clearLayout(): void {
    this._layout = undefined;
}

    public _setLayout(layout: CellLayout): void {
        this._layout = layout;
    }
}