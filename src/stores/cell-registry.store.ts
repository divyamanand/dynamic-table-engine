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

    constructor(
    ){
        this.cellsById  = new Map()
        this.cellsByAddress = new Map()
    } 

    createCell(region: Region, rawValue?: string, style?: Style, isDynamic?: boolean): string {
        const randomId = uuid()
        const newCell = new Cell(randomId, region, rawValue ?? "Cell", isDynamic ?? false, style ?? defaultStyle)
        this.cellsById.set(randomId, newCell)
        return randomId
    }

    deleteCell(cellId: string): void {
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