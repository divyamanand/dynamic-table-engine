import type { ICell } from '../interfaces/core/cell.interface';

export interface CellAddress {
    rowNumber: number;
    colNumber: number
}


export interface CellLayout {
    readonly row: number;
    readonly col: number;
    readonly rowSpan: number;
    readonly colSpan: number;
}

export type Region = 'theader' | 'lheader' | 'rheader' | 'footer' | 'body'

export interface Style {
    font: string;
    fontSize: string;
}

export type Rect = {
   cellId: string
   startRow: number
   startCol: number
   endRow: number
   endCol: number
}

export type MergeRegion = {
    rootID: string;
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
}

export type CellPayload = {
    cellID?: string;
    inRegion?: Region;
    children?: ICell[];
    rawValue?: string | number;
    style?: Style;
    parent?: ICell;
    layout?: CellLayout;
    computedValue?: string | number;
}
