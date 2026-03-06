import { ICellRegistry, ILayoutEngine, IMergeRegistry, IStructureStore, ITable } from "../interfaces"
import { ICell } from "../interfaces/core"
import { IRuleEngine } from "../interfaces/rules/rule-engine.interface"
import { EvaluationResult } from "../rules/types/evaluation.types"
import { CellPayload, Region, TableSettings } from "../types"
import { Rect } from "../types/common"

const DEFAULT_TABLE_SETTINGS: TableSettings = {
    overflow: 'wrap',
    footer: { mode: 'last-page' },
    headerVisibility: { theader: true, lheader: true, rheader: true },
    defaultStyle: { font: 'Arial', fontSize: 10 },
    pagination: { repeatHeaders: true }
}

export class Table implements ITable {
    private structureStore: IStructureStore
    private cellRegistry: ICellRegistry
    private layoutEngine: ILayoutEngine
    private mergeRegistry: IMergeRegistry
    private settings: TableSettings
    private ruleEngine?: IRuleEngine

    constructor(
        structureStore: IStructureStore,
        cellRegistry: ICellRegistry,
        layoutEngine: ILayoutEngine,
        mergeRegistry: IMergeRegistry,
        settings?: TableSettings
    ) {
        this.structureStore = structureStore
        this.cellRegistry = cellRegistry
        this.layoutEngine = layoutEngine
        this.mergeRegistry = mergeRegistry
        this.settings = { ...DEFAULT_TABLE_SETTINGS, ...settings }
    }

    // --- Rule engine ---

    setRuleEngine(engine: IRuleEngine): void {
        this.ruleEngine = engine
    }

    getEvaluationResult(cellId: string): EvaluationResult | undefined {
        return this.ruleEngine?.getResult(cellId)
    }

    private rebuildAndEvaluate(): void {
        this.layoutEngine.rebuild()
        this.ruleEngine?.evaluateAll()
    }

    private rebuildGeometryAndEvaluate(): void {
        this.layoutEngine.rebuildGeometry()
        this.ruleEngine?.evaluateAll()
    }

    // --- Settings ---

    getSettings(): TableSettings {
        return { ...this.settings }
    }

    updateSettings(patch: Partial<TableSettings>): void {
        this.settings = { ...this.settings, ...patch }
        this.rebuildAndEvaluate()
    }

    // --- Header operations ---

    addHeaderCell(region: Region, parentId?: string, index?: number): string {
        const cellId = this.cellRegistry.createCell(region)

        if (parentId) {
            const wasLeaf = this.structureStore.isLeafCell(parentId)
            this.structureStore.addChildCell(parentId, region, cellId, index)
            if (!wasLeaf) {
                const newLeafIndex = this.structureStore.getBodyIndexForHeaderLeafCell(region, cellId)
                this.insertBodySliceForRegion(region, newLeafIndex)
            }
        } else {
            const leafIndex = this.structureStore.getLeafCount(region)
            this.structureStore.addRootCell(cellId, region)
            this.insertBodySliceForRegion(region, leafIndex)
        }

        this.rebuildAndEvaluate()
        return cellId
    }

    removeHeaderCell(cellId: string, region: Region, isRoot: boolean, parentId?: string): void {
        const isLeaf = this.structureStore.isLeafCell(cellId)
        const bodyIndex = this.structureStore.getBodyIndexForHeaderLeafCell(region, cellId)

        if (isRoot) {
            this.structureStore.removeRootCell(cellId, region)
        } else if (parentId) {
            this.structureStore.removeChildCell(parentId, cellId, region)
        }

        if (isLeaf) {
            this.removeBodySliceForRegion(region, bodyIndex)
        }

        this.cellRegistry.deleteCell(cellId)
        this.rebuildAndEvaluate()
    }

    // --- Body slice helpers ---

    private insertBodySliceForRegion(region: Region, index: number): void {
        if (region === "theader") this.insertBodyCol(index)
        else if (region === "lheader" || region === "rheader") this.insertBodyRow(index)
    }

    private removeBodySliceForRegion(region: Region, index: number): void {
        if (region === "theader") this.removeBodyCol(index)
        else if (region === "lheader" || region === "rheader") this.removeBodyRow(index)
    }

    // --- Body operations ---

    buildBody(data: (string | number)[][]): void {
        while (this.structureStore.getBody().length > 0) {
            this.removeBodyRow(0)
        }
        for (let i = 0; i < data.length; i++) {
            this.insertBodyRow(i, data[i])
        }
        // pad with empty rows up to minRows
        const minRows = this.settings.minRows
        if (minRows !== undefined) {
            while (this.structureStore.getBody().length < minRows) {
                this.insertBodyRow(this.structureStore.getBody().length)
            }
        }
    }

    insertBodyRow(rowIndex: number, data?: (string | number)[]): void {
        if (this.settings.maxRows !== undefined &&
            this.structureStore.getBody().length >= this.settings.maxRows) return

        const numCols = this.structureStore.getBody().length > 0
            ? this.structureStore.getBody()[0].length
            : this.structureStore.getLeafCount("theader")
        const cellIds: string[] = []
        for (let i = 0; i < numCols; i++) {
            cellIds.push(this.cellRegistry.createCell("body", data?.[i]?.toString()))
        }
        this.structureStore.insertBodyRow(rowIndex, cellIds)
        this.layoutEngine.insertRowHeight(rowIndex, this.layoutEngine.getDefaultCellHeight())
        this.rebuildAndEvaluate()
    }

    removeBodyRow(rowIndex: number): void {
        if (this.settings.minRows !== undefined &&
            this.structureStore.getBody().length <= this.settings.minRows) {
            const row = this.structureStore.getBody()[rowIndex]
            if (row) {
                for (const cellId of row) {
                    this.cellRegistry.updateCell(cellId, { rawValue: "", computedValue: undefined })
                }
            }
            return
        }

        const removedIds = this.structureStore.removeBodyRow(rowIndex)
        for (const id of removedIds) this.cellRegistry.deleteCell(id)
        this.layoutEngine.removeRowHeight(rowIndex)
        this.rebuildAndEvaluate()
    }

    insertBodyCol(colIndex: number, data?: (string | number)[]): void {
        if (this.settings.maxCols !== undefined &&
            this.structureStore.getBody()[0]?.length >= this.settings.maxCols) return

        const numRows = this.structureStore.getBody().length
        const cellIds: string[] = []
        for (let i = 0; i < numRows; i++) {
            cellIds.push(this.cellRegistry.createCell("body", data?.[i]?.toString()))
        }
        this.structureStore.insertBodyCol(colIndex, cellIds)
        this.layoutEngine.insertColumnWidth(colIndex, this.layoutEngine.getDefaultCellWidth())
        this.rebuildAndEvaluate()
    }

    removeBodyCol(colIndex: number): void {
        if (this.settings.minCols !== undefined &&
            this.structureStore.getBody()[0]?.length <= this.settings.minCols) return

        const removedIds = this.structureStore.removeBodyCol(colIndex)
        for (const id of removedIds) this.cellRegistry.deleteCell(id)
        this.layoutEngine.removeColumnWidth(colIndex)
        this.rebuildAndEvaluate()
    }

    // --- Cell access ---

    getCellById(cellId: string): ICell | undefined {
        return this.cellRegistry.getCellById(cellId)
    }

    getCellByAddress(row: number, col: number): ICell | undefined {
        return this.cellRegistry.getCellByAddress(`${row},${col}`)
    }

    updateCell(cellId: string, payload: CellPayload): void {
        this.cellRegistry.updateCell(cellId, payload)
        if (this.ruleEngine) {
            const cell = this.cellRegistry.getCellById(cellId)
            if (cell) this.ruleEngine.evaluateCell(cell)
        }
    }

    // --- Merge ---

    mergeCells(rect: Rect): void {
        this.mergeRegistry.createMerge(rect)
        this.rebuildAndEvaluate()
    }

    unmergeCells(cellId: string): void {
        this.mergeRegistry.deleteMerge(cellId)
        this.rebuildAndEvaluate()
    }

    // --- Geometry ---

    setColumnWidth(colIndex: number, width: number): void {
        this.layoutEngine.setColumnWidth(colIndex, width)
        this.rebuildGeometryAndEvaluate()
    }

    setRowHeight(rowIndex: number, height: number): void {
        this.layoutEngine.setRowHeight(rowIndex, height)
        this.rebuildGeometryAndEvaluate()
    }

    setDefaultCellWidth(width: number): void {
        this.layoutEngine.setDefaultCellWidth(width)
    }

    setDefaultCellHeight(height: number): void {
        this.layoutEngine.setDefaultCellHeight(height)
    }

    getColumnWidths(): number[] {
        return this.layoutEngine.getColumnWidths()
    }

    getRowHeights(): number[] {
        return this.layoutEngine.getRowHeights()
    }

    setTablePosition(position: { x: number; y: number }): void {
        this.layoutEngine.setTablePosition(position)
    }

    getTablePosition(): { x: number; y: number } {
        return this.layoutEngine.getTablePosition()
    }

    // --- Layout ---

    getCompleteGrid(): string[][] {
        return this.layoutEngine.getCompleteGrid()
    }
}
