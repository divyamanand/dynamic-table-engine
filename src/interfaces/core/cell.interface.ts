import { CellLayout, Region, Style } from "../../types/index";

export interface ICell {
    cellID: string;
    readonly layout?: CellLayout;
    inRegion: Region;
    rawValue: string | number;
    style: Style;
    isDynamic: boolean;
    computedValue?: string | number;

    // _setLayout(layout: CellLayout): void; create this method in concrete class as private
}
