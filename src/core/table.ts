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

        this.layoutEngine.rebuild()
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
        this.layoutEngine.rebuild()
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
    }

    insertBodyRow(rowIndex: number, data?: (string | number)[]): void {
        const numCols = this.structureStore.getBody().length > 0
            ? this.structureStore.getBody()[0].length
            : this.structureStore.getLeafCount("theader")
        const cellIds: string[] = []
        for (let i = 0; i < numCols; i++) {
            cellIds.push(this.cellRegistry.createCell("body", data?.[i]?.toString()))
        }
        this.structureStore.insertBodyRow(rowIndex, cellIds)
        this.layoutEngine.rebuild()
    }

    removeBodyRow(rowIndex: number): void {
        const removedIds = this.structureStore.removeBodyRow(rowIndex)
        for (const id of removedIds) this.cellRegistry.deleteCell(id)
        this.layoutEngine.rebuild()
    }

    insertBodyCol(colIndex: number, data?: (string | number)[]): void {
        const numRows = this.structureStore.getBody().length
        const cellIds: string[] = []
        for (let i = 0; i < numRows; i++) {
            cellIds.push(this.cellRegistry.createCell("body", data?.[i]?.toString()))
        }
        this.structureStore.insertBodyCol(colIndex, cellIds)
        this.layoutEngine.rebuild()
    }

    removeBodyCol(colIndex: number): void {
        const removedIds = this.structureStore.removeBodyCol(colIndex)
        for (const id of removedIds) this.cellRegistry.deleteCell(id)
        this.layoutEngine.rebuild()
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
        this.layoutEngine.rebuild()
    }

    unmergeCells(cellId: string): void {
        this.mergeRegistry.deleteMerge(cellId)
        this.layoutEngine.rebuild()
    }

    // --- Layout ---

    getCompleteGrid(): string[][] {
        return this.layoutEngine.getCompleteGrid()
    }
}
