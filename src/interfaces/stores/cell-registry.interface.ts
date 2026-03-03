import {CellPayload, Region, Style } from "../../types";
import { ICell } from "../core";

export interface ICellRegistry {
    //keep them private in class
    // cellsById: Map<string, ICell>
    // cellsByAddress: Map<string, ICell>

    //add new cell in a region, just create an random id and store the cell
    createCell(region: Region, rawValue?: string, style?: Style, isDynamic?: boolean): string
    getCellById(cellId: string): ICell | undefined
    getCellByAddress(address: string): ICell | undefined
    updateCell(cellId: string, payload: CellPayload): void
    deleteCell(cellId: string): void
    setCellAddress(cellId: string, row: number, col: number): void
    clearCellAddress(cellId: string): void
}