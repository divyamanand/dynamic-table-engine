import { Cell } from "../core";
import { ICell, ICellRegistry } from "../interfaces";
import { CellPayload, CellStyle, Region } from "../types";
import {v1 as uuid} from "uuid"

export const defaultCellStyle: CellStyle = {
    fontName: undefined,
    bold: false,
    italic: false,
    alignment: 'left',
    verticalAlignment: 'middle',
    fontSize: 13,
    lineHeight: 1,
    characterSpacing: 0,
    fontColor: '#000000',
    backgroundColor: '',
    borderColor: '#888888',
    borderWidth: { top: 0.1, right: 0.1, bottom: 0.1, left: 0.1 },
    padding: { top: 5, right: 5, bottom: 5, left: 5 },
}

/** @deprecated Use defaultCellStyle instead */
export const defaultStyle = defaultCellStyle

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
            // Clear the old address if this cellId already has one
            this.clearCellAddress(cellId)
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

    createCell(region: Region, rawValue?: string, style?: Partial<CellStyle>, isDynamic?: boolean): string {
        const randomId = uuid()
        const mergedStyle: CellStyle = { ...defaultCellStyle, ...style }
        const newCell = new Cell(randomId, region, rawValue ?? "Cell", isDynamic ?? false, mergedStyle)
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

            if (rawValue !== undefined) {
                cell.rawValue = rawValue
            }

            if ('computedValue' in payload) {
                cell.computedValue = computedValue
            }

            if (style) {
                cell.style = { ...cell.style, ...style }
            }
        }
    }
}
