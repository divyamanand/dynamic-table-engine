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
    children?: string[];
    merged?: string[];
    rawValue?: string | number;
    style?: Style;
    parent?: string;
    mergedInto?: string;
    computedValue?: string | number;
}
