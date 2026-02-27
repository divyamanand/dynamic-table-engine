import { Region } from "../../types/common";
import { ICell } from "../core/cell.interface";
import { ITableRegion } from "../core/region.interface";

export interface ITableRegionQuery {
    regionIndex: Map<Region, ITableRegion>;

    getAllCellsOfRegion(region: Region): ICell[][];
    getTotalCellCount(): { rows: number; columns: number[] };
    getLeafCounts(region: Region): number;
}
