import { Region } from "../types/common";

/**
 * ITableRegion - Represents a table region with its cell membership
 * Fixed: Changed from number to string cell IDs (UUID-based)
 */
export interface ITableRegion {
    region: Region;
    cellIDs: Set<string>;

    addCell(cellID: string): void;
    removeCell(cellID: string): void;
    hasCellID(cellID: string): boolean;
    getCellIDs(): ReadonlySet<string>;
}
