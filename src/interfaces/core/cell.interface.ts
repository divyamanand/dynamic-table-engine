import { CellLayout, CellPayload, Region, Style } from "../../types/index";

export interface ICell {
    cellID: string;
    readonly layout?: CellLayout | undefined;
    inRegion: Region;
    children: ICell[];
    rawValue: string | number;
    style: Style;
    isDynamic: boolean;
    parent?: ICell;
    computedValue?: string | number;

    _setLayout(layout: CellLayout): void;
    getCellChildren(): ICell[];
    addCellChildren(child: ICell): void;
    getParentOfCell(): ICell | undefined;
    updateCell(payload: CellPayload): void
}
