import { Region } from "./types/index";
import { ITableRegion } from "./interfaces";


export class TableRegion implements ITableRegion {
    readonly region: Region;
    readonly cellIDs: Set<string>;

    constructor(region: Region, cellIDs: Set<string> = new Set()) {
        this.region = region;
        this.cellIDs = cellIDs;
    }

    addCell(cellID: string): void {
        this.cellIDs.add(cellID);
    }

    removeCell(cellID: string): void {
        this.cellIDs.delete(cellID);
    }

    hasCellID(cellID: string): boolean {
        return this.cellIDs.has(cellID);
    }

    getCellIDs(): ReadonlySet<string> {
        return this.cellIDs;
    }
}