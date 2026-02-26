import { Region } from "../types/common";
import { ITableRegion } from "../interfaces/region.interface";
import { TableRegion } from "../region";
import { ITableRegionFactory } from "../interfaces/table-factory.interface";

/**
 * ITableRegionFactory - Contract for creating TableRegion instances
 * Enables dependency injection and testability
 */


/**
 * TableRegionFactory - Creates TableRegion instances
 * Responsibility: Encapsulate region creation logic
 * Fixes DIP: RegionIndexManager depends on factory abstraction, not concrete TableRegion
 */
export class TableRegionFactory implements ITableRegionFactory {
    create(region: Region): ITableRegion {
        return new TableRegion(region);
    }
}
