import { Region } from "../types/common";
import { ICell, ITableRegion } from "./index";

export interface ITableRegionQuery {
    regionIndex: Map<Region, ITableRegion>;

    getAllCellsOfRegion(region: Region): ICell[][];
    getTotalCellCount(): { rows: number; columns: number[] };
    getLeafCounts(region: Region): number;
}
