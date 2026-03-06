import { ICell } from "../core"
import { CellPayload, Region, TableSettings, TablePosition } from "../../types"
import { Rect } from "../../types/common"
import type { IRuleEngine } from "../rules/rule-engine.interface"
import type { EvaluationResult } from "../../rules/types/evaluation.types"

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
    getMerges(): Map<string, Rect>

    // Settings
    getSettings(): TableSettings
    updateSettings(settings: Partial<TableSettings>): void

    // Geometry
    setColumnWidth(colIndex: number, width: number): void
    setRowHeight(rowIndex: number, height: number): void
    setDefaultCellWidth(width: number): void
    setDefaultCellHeight(height: number): void
    getColumnWidths(): number[]
    getRowHeights(): number[]
    setTablePosition(position: TablePosition): void
    getTablePosition(): TablePosition

    // Layout
    getCompleteGrid(): string[][]

    // Rule engine
    setRuleEngine(engine: IRuleEngine): void
    getEvaluationResult(cellId: string): EvaluationResult | undefined
}
