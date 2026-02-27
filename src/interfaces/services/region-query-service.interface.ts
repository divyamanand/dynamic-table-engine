import { ITableRegionQuery } from "../table/table-region-query.interface";

/**
 * IRegionQueryService - Region-based cell queries
 * Extends ITableRegionQuery with no additional methods.
 * Responsibility: Read-only queries about cells organized by region
 *
 * This interface exists to allow IRegionQueryService implementation to be injected
 * and mocked independently from ITableRegionQuery.
 */
export interface IRegionQueryService extends ITableRegionQuery {
    // Inherits all methods from ITableRegionQuery:
    // - regionIndex: Map<Region, ITableRegion>
    // - getAllCellsOfRegion(region: Region): ICell[][]
    // - getTotalCellCount(): { rows: number; columns: number[] }
    // - getLeafCounts(region: Region): number
}
