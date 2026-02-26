import { Region } from "./types/index";
import { ITableRegion } from "./interfaces/index";

class TableRegion implements ITableRegion {
    region: Region;
    cells: number[];

    constructor(
        region: Region,
        cells: number[] = []
    ){
        this.region = region
        this.cells = cells
    }

    addNewPrimaryCell(cell: number): void {
        this.cells.push(cell)
    }

    addNewChildrenCell(cellID: number, parentCellID: number): void {
        
    }

    removeCell(cellID: number): void {
        
    }
}