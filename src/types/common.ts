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

export type Style = {
    font: string;
    fontSize: number;
}

export type Rect = {
   cellId: string
   startRow: number
   startCol: number
   endRow: number
   endCol: number
   primaryRegion?: Region
}


export type CellPayload = {
    inRegion?: Region;
    rawValue?: string | number;
    style?: Style;
    computedValue?: string | number;
}
