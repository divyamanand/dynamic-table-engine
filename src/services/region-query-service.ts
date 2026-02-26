import { Region } from "../types/common";
import { ICell, ITableRegionQuery, IRegionIndexManager } from "../interfaces";


export class RegionQueryService implements ITableRegionQuery {
    get regionIndex() {
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
