import { Region } from "./types/index";
import { ITableRegion } from "./interfaces/index";

/**
 * TableRegion - Value object representing a table region and its cell membership
 * Fixed: Uses string UUIDs for cell IDs (not number)
 * Exported: Now properly exported for use by RegionIndexManager
 */
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