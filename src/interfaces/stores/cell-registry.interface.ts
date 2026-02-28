import { CellAddress, CellPayload, Region } from "../../types";
import { ICell } from "../core";

export interface ICellRegistry {
    cellsById: Map<string, ICell>
    cellsByAddress: Map<string, ICell>

    //add new cell in a region, just create an random id and store the cell
    addNewCell(region: Region, isDynamic?: boolean): void
    getCellById(cellID: string): ICell
    getCellByAddress(cellAddress: CellAddress): ICell
    updateCell(cellID: string, payload: CellPayload): void
    deleteCellById(cellID: string): void
    deleteCellByAddress(cellAddress: string): void

}