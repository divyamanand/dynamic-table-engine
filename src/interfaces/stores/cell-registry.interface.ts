import { CellAddress, CellPayload, Region } from "../../types";
import { ICell } from "../core";

export interface ICellRegistry {
    //keep them private in class
    // cellsById: Map<string, ICell>
    // cellsByAddress: Map<string, ICell>

    //add new cell in a region, just create an random id and store the cell
    createCell(region: Region, parentId?: string, isDynamic?: boolean): string
    getCellById(cellID: string): ICell | undefined
    getCellByAddress(address: CellAddress): ICell | undefined
    updateCell(cellID: string, payload: CellPayload): void
    deleteCell(cellID: string): void
}