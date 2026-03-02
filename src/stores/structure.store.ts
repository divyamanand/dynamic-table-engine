import { ICellRegistry, ILayoutEngine, IStructureStore } from "../interfaces";
import { Region } from "../types";

export class StructureStore implements IStructureStore {
    private headerRoots: Map<Region, string[]>
    private childrenMap: Map<string, string[]>
    private parentMap: Map<string, string>
    private body: string[][]
    public layoutEngine: ILayoutEngine
    public cellRegistry: ICellRegistry

    constructor (
        layoutEngine: ILayoutEngine,
        cellRegistry: ICellRegistry
    ) {
        this.headerRoots = new Map()
        this.body = []
        this.parentMap = new Map()
        this.childrenMap = new Map()
        this.layoutEngine = layoutEngine
        this.cellRegistry = cellRegistry
    }

  
    private setRegionStructure(region: Region, arr: string[] | string[][]): void {
        this.headerRoots.set(region, arr as string[])
    }


    private createBodyForNewColumn(index: number): void {
        this.body = this.body.map((bodyRow) => {
            const newCell = this.cellRegistry.createCell("body")
            const updatedRow = [...bodyRow]
            updatedRow.splice(index, 0, newCell)
            return updatedRow
        })
    }

    private removeBodyForColumn(index: number) : void {
        this.body = this.body.map((bodyRow) => {
            const updatedRow = bodyRow.filter((bodyVal, idx) => index !== idx )
            return updatedRow
        })
    }

    private isLeafCell(cellId: string): boolean {
        return !this.childrenMap.has(cellId) || this.childrenMap.get(cellId)?.length === 0
    }

    private getLeafCells(cellId: string): string[] {
        const children = this.childrenMap.get(cellId) || []

        if (children.length === 0) return [cellId]

        const res = []

        for (const child of children) {
            if (this.isLeafCell(child)){
                res.push(child)
            } else {
                res.push(...this.getLeafCells(child))
            }
        }

        return res
    }

    private getBodyIndexForHeaderLeafCell(region:Region, cellId: string): number {
        let index = 0
        const headers = this.headerRoots.get(region) || []

        for (const header of headers) {
            const leafCells = this.getLeafCells(header)
            if (leafCells.includes(cellId)) {
                const cellIndex = leafCells.indexOf(cellId)
                return index + cellIndex
            } else {
                index += leafCells.length
            }
        }
        return -1

    }

    addRootCell(cellId: string, region: Region): void {
        const cellRegion = this.headerRoots.get(region) || []
        const updatedCellRegion = [...cellRegion, cellId]
        this.setRegionStructure(region, updatedCellRegion)

        if (region === "theader") {
            this.createBodyForNewColumn(cellRegion.length)
        }
    }
    removeRootCell(cellId: string, region: Region): void {
        const cellRegion = this.headerRoots.get(region)
        const rootCellIndex = this.getBodyIndexForHeaderLeafCell(region, cellId)
        const children = this.childrenMap.get(cellId) || []

        const filteredRegion = cellRegion?.filter((id) => id !== cellId) || []
        const updatedCellRegion = [...filteredRegion, ...children]
        this.setRegionStructure(region, updatedCellRegion)

        if (this.isLeafCell(cellId)) {
            this.removeBodyForColumn(rootCellIndex)
        }
        
        if (this.childrenMap.has(cellId)) {
            this.childrenMap.delete(cellId)
        } 

        for (const child of children) {
            this.parentMap.delete(child)
        }
        
        this.cellRegistry.deleteCell(cellId)
    }

    getRoots(region: Region): readonly string[] | undefined {
        return this.headerRoots.get(region)
    }

    addChildCell(parentId: string, region: Region, childId?: string, index?: number): void {
        let child = childId
        if (!child) {
            child = this.cellRegistry.createCell(region)
        }
        this.parentMap.set(child, parentId)
        let children = this.childrenMap.get(parentId)
        if (!children) {
            children = []
            this.childrenMap.set(parentId, children)
        }
        if (index !== undefined) {
            children.splice(index, 0, child)
        } else {
            children.push(child)
        }

    }

    removeChildCell(parentId: string, childId: string, region: Region): void {
        
        const children = this.childrenMap.get(childId) || []
        const childrenOfParent = this.childrenMap.get(parentId) || []
        const filteredChildren = childrenOfParent.filter(id => id !== childId)
        const updatedChildren = [...filteredChildren, ...children]


        if (this.isLeafCell(childId)) {
            const index = this.getBodyIndexForHeaderLeafCell(region, childId)
            this.removeBodyForColumn(index)
        }

        if (this.childrenMap.has(childId)) {
            this.childrenMap.delete(childId)
        }

        this.childrenMap.set(parentId, updatedChildren)
        this.parentMap.delete(childId)

        for (const child of children) {
            this.parentMap.set(child, parentId)
        }

        this.cellRegistry.deleteCell(childId)
    }


}