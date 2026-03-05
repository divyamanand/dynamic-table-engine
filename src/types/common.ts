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
    readonly x: number;       // mm from table left edge
    readonly y: number;       // mm from table top edge
    readonly width: number;   // mm (sum of spanned column widths)
    readonly height: number;  // mm (sum of spanned row heights)
}

export interface TablePosition {
    x: number;    // mm from page left
    y: number;    // mm from page top
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

export type OverflowMode = 'wrap' | 'increase-height' | 'increase-width'

export type FooterPlacement =
    | { mode: 'every-page' }
    | { mode: 'last-page' }
    | { mode: 'custom'; pages: number[] }

export interface PaginationSettings {
    pageSize?: number
    repeatHeaders?: boolean
}

export interface HeaderVisibility {
    theader?: boolean
    lheader?: boolean
    rheader?: boolean
}

export interface TableSettings {
    minRows?: number
    maxRows?: number
    minCols?: number
    maxCols?: number
    overflow?: OverflowMode
    footer?: FooterPlacement
    headerVisibility?: HeaderVisibility
    defaultStyle?: Style
    pagination?: PaginationSettings
}
