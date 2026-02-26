import { Region } from "../types/common";

export interface ITableRegion {
    region: Region;
    cells: number[];

    addNewPrimaryCell(cell: number): void
    addNewChildrenCell(cell: number, parentCellID: number): void
    removeCell(cellID: number): void
}
