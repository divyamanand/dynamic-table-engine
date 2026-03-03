import { ICellRegistry, ILayoutEngine, IMergeRegistry, IStructureStore } from "../interfaces";

export class LayoutEngine implements ILayoutEngine {

    private mergeRegistry: IMergeRegistry
    private structureStore: IStructureStore
    private cellRegistry: ICellRegistry

    constructor(
        mergeRegistry: IMergeRegistry,
        structureStore: IStructureStore,
        cellRegistry: ICellRegistry
    ) {
        this.mergeRegistry = mergeRegistry
        this.structureStore = structureStore
        this.cellRegistry = cellRegistry
    }

    calculateHeaderCellLayout(cellId: string): {rowSpan: Map<string, number>, colSpan: Map<string, number>} {
        //for each cell and its child cell -> rowSpan (if leaf cell -> 1 else height of root cell (from structure store) - current level (taking root as level 1) + 1)
        const heightMax = this.structureStore.getHeightOfCell(cellId)
        const rowSpan: Map<string, number> = new Map()
        const colSpan: Map<string, number> = new Map()
        this.calculateRowSpan(cellId, rowSpan, 1, heightMax)
        this.calculateColSpan(cellId, colSpan)

        return {rowSpan, colSpan}
    }

    calculateColSpan(cellId: string, res: Map<string, number>): number {
        if (this.structureStore.isLeafCell(cellId)) {
            res.set(cellId, 1)
            return 1
        }

        let total = 0
        const children = this.structureStore.getChildren(cellId) ?? []

        for (const child of children) {
            total += this.calculateColSpan(child, res)
        }

        res.set(cellId, total)
        return total
    }

    calculateRowSpan(cellId: string, res: Map<string, number>, currLevel: number, heightMax: number): void {
        if (this.structureStore.isLeafCell(cellId)) {
            res.set(cellId, heightMax - currLevel + 1)
            return
        } else {
            res.set(cellId, 1)
        }

        const children = this.structureStore.getChildren(cellId) ?? []

        for (const child of children) {
            this.calculateRowSpan(child, res, currLevel + 1, heightMax)
        }

    }

    calculateTHeaderLayout() {
        const [lastRow, lastCol] = [-1,-1]
        

    }

    rebuild(): void {
        
    }

    isLayoutDirty(): boolean {
        
    }
}