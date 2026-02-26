import { CellAddress, Region } from "../types/common";
import { ICell } from "./cell.interface";

export interface ITable {
    cells: ICell[][]

    addNewCell(cellAddress: CellAddress, region: Region, parentCellID?: number): void
    getTotalCellCount(): {rows: number, columns: number[]}
    removeCell(cellID: number, cellAddress: CellAddress): void
    // findCellByID(cellID: number): {row: number, col: number, cell: ICell} | null
    // findCellByAddress(cellAddress: CellAddress): {row: number, col: number, cell: ICell} | null
    updateCell(cellID: number, payload: object): void
    shiftCell(newCellAddress: CellAddress, cellID?: number, cellAddress?: CellAddress, newParentCellID?: number): void
    getAllCellsOfRegion(region: Region): ICell[][]
    findCell(cellID?: number, cellAddress?: CellAddress): { row: number, col: number, cell: ICell } | null
}
