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
    cellID?: number;
    inRegion?: Region;
    children?: number[];
    merged?: number[];
    rawValue?: string | number;
    style?: Style;
    parent?: number;
    mergedInto?: number;
    computedValue?: string | number;
}
