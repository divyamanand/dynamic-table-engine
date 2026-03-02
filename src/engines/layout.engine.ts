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

    calculateHeaderCellLayout(cellId: string): {rowSpan: number, colSpan: number} {
        const colSpan = this.structureStore.getLeafCells(cellId).length
        const rowSpan = 1
        return {rowSpan, colSpan}
    }

    calculateTHeaderLayout() {
        const [lastRow, lastCol] = [-1,-1]
        

    }

    rebuild(): void {
        
    }

    isLayoutDirty(): boolean {
        
    }
}