import type { ICell } from '../interfaces/cell.interface';

export interface CellAddress {
    rowNumber: number;
    colNumber: number
}

export type Region = 'theader' | 'lheader' | 'rheader' | 'footer' | 'body'

export interface Style {
    font: string;
    fontSize: string;
}

export type CellPayload = {
    cellID?: string;
    inRegion?: Region;
    children?: ICell[];
    merged?: string[];
    rawValue?: string | number;
    style?: Style;
    parent?: ICell;
    mergedInto?: string;
    computedValue?: string | number;
}
