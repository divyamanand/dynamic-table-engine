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

    getColumnsCount(): number {
        let lastTheaderRowIndex = -1;

        // Find the last row that contains theader cells
        for (let row = 0; row < this.cells.length; row++) {
            if (this.cells[row].some((cell) => cell.inRegion === 'theader')) {
                lastTheaderRowIndex = row;
            }
        }

        // If no theader found, return 0
        if (lastTheaderRowIndex === -1) {
            return 0;
        }

        // Count theader cells in the last theader row
        return this.cells[lastTheaderRowIndex].filter(
            (cell) => cell.inRegion === 'theader'
        ).length;
    }

    getTotalCellCount(): { rows: number; columns: number[] } {
        return {
            rows: this.cells.length,
            columns: this.cells.map((row) => row.length),
        };
    }
}
