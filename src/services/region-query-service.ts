import { Region } from "../types/common";
import { ICell } from "../interfaces/cell.interface";
import { ITableRegionQuery } from "../interfaces/table-region-query.interface";
import { IRegionIndexManager } from "./region-index-manager";

/**
 * RegionQueryService - Read-only region queries
 * Responsibility: getAllCellsOfRegion, getTotalCellCount, expose regionIndex
 * Fixes SRP: Extracted region querying from Table
 */
export class RegionQueryService implements ITableRegionQuery {
    get regionIndex(): Map<Region, Set<string>> {
        return this.regionIndexManager.getIndex();
    }

    constructor(
        private readonly cells: ICell[][],
        private readonly regionIndexManager: IRegionIndexManager
    ) {}

    getAllCellsOfRegion(region: Region): ICell[][] {
        return this.cells.map((row) =>
            row.filter((cell) => cell.inRegion === region)
        );
    }

    getTotalCellCount(): { rows: number; columns: number[] } {
        return {
            rows: this.cells.length,
            columns: this.cells.map((row) => row.length),
        };
    }
}
