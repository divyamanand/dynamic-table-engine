import { Cell } from "../core";
import { ICell, ICellRegistry } from "../interfaces";
import { CellPayload, Region, Style } from "../types";
import {v1 as uuid} from "uuid"

export const defaultStyle = {
    font: "Arial",
    fontSize: 10
}

export class CellRegistry implements ICellRegistry {

    private cellsById: Map<string, ICell>
    private cellsByAddress: Map<string, ICell>
    private cellIdToAddress: Map<string, string> = new Map()

    constructor(
    ){
        this.cellsById  = new Map()
        this.cellsByAddress = new Map()
    }

    private toAddressKey(row: number, col: number): string {
        return `${row},${col}`
    }

    setCellAddress(cellId: string, row: number, col: number): void {
        const key = this.toAddressKey(row, col)
        const cell = this.cellsById.get(cellId)
        if (cell) {
            this.cellsByAddress.set(key, cell)
            this.cellIdToAddress.set(cellId, key)
        }
    }

    clearCellAddress(cellId: string): void {
        const key = this.cellIdToAddress.get(cellId)
        if (key) {
            this.cellsByAddress.delete(key)
            this.cellIdToAddress.delete(cellId)
        }
    }

    createCell(region: Region, rawValue?: string, style?: Style, isDynamic?: boolean): string {
        const randomId = uuid()
        const newCell = new Cell(randomId, region, rawValue ?? "Cell", isDynamic ?? false, style ?? defaultStyle)
        this.cellsById.set(randomId, newCell)
        return randomId
    }

    deleteCell(cellId: string): void {
        this.clearCellAddress(cellId)
        this.cellsById.delete(cellId)
    }
    getCellByAddress(address: string): ICell | undefined {
        return this.cellsByAddress.get(address)
    }
    getCellById(cellId: string): ICell | undefined {
        return this.cellsById.get(cellId)
    }
    updateCell(cellId: string, payload: CellPayload): void {
        const cell = this.cellsById.get(cellId)
        if (cell) {
            const {inRegion, rawValue, computedValue, style} = payload
            
            if (inRegion) {
                cell.inRegion = inRegion
            }

            if (rawValue) {
                cell.rawValue = rawValue
            }

            if (computedValue) {
                cell.computedValue = computedValue
            }

            if (style) {
                cell.style = style
            }
        }
    }
}