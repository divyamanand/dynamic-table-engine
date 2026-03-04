import { ICell } from "../core"
import { CellPayload, Region } from "../../types"
import { Rect } from "../../types/common"

export interface ITable {
    // Header operations
    addHeaderCell(region: Region, parentId?: string, index?: number): string
    removeHeaderCell(cellId: string, region: Region, isRoot: boolean, parentId?: string): void

    // Body operations
    buildBody(data: (string | number)[][]): void
    insertBodyRow(rowIndex: number, data?: (string | number)[]): void
    removeBodyRow(rowIndex: number): void
    insertBodyCol(colIndex: number, data?: (string | number)[]): void
    removeBodyCol(colIndex: number): void

    // Cell access
    getCellById(cellId: string): ICell | undefined
    getCellByAddress(row: number, col: number): ICell | undefined
    updateCell(cellId: string, payload: CellPayload): void

    // Merge
    mergeCells(rect: Rect): void
    unmergeCells(cellId: string): void

    // Layout
    getCompleteGrid(): string[][]
}
