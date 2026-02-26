import { CellAddress, Region } from "../types/common";
import { ICell } from "./cell.interface";

export interface ITable {
    cells: ICell[][]
    regionIndex: Map<Region, Set<string>>

    mergeCells(selectedCellsIDs: string[]):void
    unmergeCells(selectedCellID: string): void
    addNewCell(cellAddress: CellAddress, region: Region, parentCellID?: string): void
    getTotalCellCount(): {rows: number, columns: number[]}
    removeCell(cellID: string, cellAddress: CellAddress): void
    // findCellByID(cellID: string): {row: number, col: number, cell: ICell} | null
    // findCellByAddress(cellAddress: CellAddress): {row: number, col: number, cell: ICell} | null
    updateCell(cellID: string, payload: object): void
    shiftCell(newCellAddress: CellAddress, cellID?: string, cellAddress?: CellAddress, newParentCellID?: string, newRegion?: Region): void
    getAllCellsOfRegion(region: Region): ICell[][]
    findCell(cellID?: string, cellAddress?: CellAddress): { row: number, col: number, cell: ICell } | null
}
