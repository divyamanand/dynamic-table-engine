import { Region } from "../types/common";


export interface ITableRegion {
    region: Region;
    cellIDs: Set<string>;

    addCell(cellID: string): void;
    removeCell(cellID: string): void;
    hasCellID(cellID: string): boolean;
    getCellIDs(): ReadonlySet<string>;
}
