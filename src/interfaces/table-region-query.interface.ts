import { Region } from "../types/common";
import { ICell } from "./cell.interface";

/**
 * ITableRegionQuery - Region-specific read-only queries
 * Consumed by: renderers, statistics tools, export logic
 * Responsibility: Query cells by region, get table dimensions
 */
export interface ITableRegionQuery {
    regionIndex: Map<Region, Set<string>>;

    getAllCellsOfRegion(region: Region): ICell[][];
    getTotalCellCount(): { rows: number; columns: number[] };
}
