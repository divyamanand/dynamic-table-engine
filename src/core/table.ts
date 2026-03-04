import { ICellRegistry, ILayoutEngine, IMergeRegistry, IStructureStore, ITable } from "../interfaces"
import { ICell } from "../interfaces/core"
import { CellPayload, Region } from "../types"
import { Rect } from "../types/common"

export class Table implements ITable {
    private structureStore: IStructureStore
    private cellRegistry: ICellRegistry
    private layoutEngine: ILayoutEngine
    private mergeRegistry: IMergeRegistry

    constructor(
        structureStore: IStructureStore,
        cellRegistry: ICellRegistry,
        layoutEngine: ILayoutEngine,
        mergeRegistry: IMergeRegistry
    ) {
        this.structureStore = structureStore
        this.cellRegistry = cellRegistry
        this.layoutEngine = layoutEngine
        this.mergeRegistry = mergeRegistry
    }

    // --- Header operations ---

    addHeaderCell(region: Region, parentId?: string, index?: number): string {
        const cellId = this.cellRegistry.createCell(region)
        if (parentId) {
            this.structureStore.addChildCell(parentId, region, cellId, index)
        } else {
            this.structureStore.addRootCell(cellId, region)
        }
        return cellId
    }

    removeHeaderCell(cellId: string, region: Region, isRoot: boolean, parentId?: string): void {
        if (isRoot) {
            this.structureStore.removeRootCell(cellId, region)
        } else if (parentId) {
            this.structureStore.removeChildCell(parentId, cellId, region)
        }
    }

    // --- Body operations ---

    buildBody(data: (string | number)[][]): void {
        this.structureStore.buildBody(data)
    }

    insertBodyRow(rowIndex: number, data?: (string | number)[]): void {
        this.structureStore.insertBodyRow(rowIndex, data)
    }

    removeBodyRow(rowIndex: number): void {
        this.structureStore.removeBodyRow(rowIndex)
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
    }

    // --- Merge ---

    mergeCells(rect: Rect): void {
        this.mergeRegistry.createMerge(rect)
    }

    unmergeCells(cellId: string): void {
        this.mergeRegistry.deleteMerge(cellId)
    }

    // --- Layout ---

    rebuild(): void {
        this.layoutEngine.rebuild()
    }

    getCompleteGrid(): string[][] {
        return this.layoutEngine.getCompleteGrid()
    }
}
