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

    isLeafCell(cellId: string): boolean {
        return !this.childrenMap.has(cellId) || this.childrenMap.get(cellId)?.length === 0
    }

    getLeafCells(cellId: string): string[] {
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

    private getTotalLeafCount(region: Region): number {
        return (this.headerRoots.get(region) || [])
            .reduce((sum, root) => sum + this.getLeafCells(root).length, 0)
    }

    getHeightOfCell(cellId: string): number {
        if (this.isLeafCell(cellId)) return 1
        const children = this.childrenMap.get(cellId) || []

        let maxHeight = 0

        for (const child of children) {
            const height = this.getHeightOfCell(child)
            maxHeight = Math.max(maxHeight, height)
        }

        return 1 + maxHeight

    }

    insertBodyCol(colIndex: number, data?: (string | number)[]): void {
        this.body = this.body.map((bodyRow, rowIdx) => {
            const newCell = this.cellRegistry.createCell("body", data?.[rowIdx]?.toString())
            const updatedRow = [...bodyRow]
            updatedRow.splice(colIndex, 0, newCell)
            return updatedRow
        })
    }

    removeBodyCol(colIndex: number): void {
        this.body = this.body.map((bodyRow) => {
            const updatedRow = bodyRow.filter((bodyVal, idx) => colIndex !== idx )
            return updatedRow
        })
    }

    addRootCell(cellId: string, region: Region): void {
        const cellRegion = this.headerRoots.get(region) || []
        const updatedCellRegion = [...cellRegion, cellId]

        if (region === "theader") {
            const colIndex = this.getTotalLeafCount("theader")
            this.setRegionStructure(region, updatedCellRegion)
            this.insertBodyCol(colIndex)
        } else if (region === "lheader" || region === "rheader") {
            const rowIndex = this.getTotalLeafCount(region)
            this.setRegionStructure(region, updatedCellRegion)
            this.insertBodyRow(rowIndex)
        } else {
            this.setRegionStructure(region, updatedCellRegion)
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
            if (region === "theader") {
                this.removeBodyCol(rootCellIndex)
            } else if (region === "lheader" || region === "rheader") {
                this.removeBodyRow(rootCellIndex)
            }
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

        const wasLeaf = this.isLeafCell(parentId)

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

        if (!wasLeaf) {
            const newLeafIndex = this.getBodyIndexForHeaderLeafCell(region, child)
            if (region === "theader") {
                this.insertBodyCol(newLeafIndex)
            } else if (region === "lheader" || region === "rheader") {
                this.insertBodyRow(newLeafIndex)
            }
        }
    }

    getChildren(parentId: string): readonly string[] | undefined {
        return this.childrenMap.get(parentId)
    }

    insertBodyRow(rowIndex: number, data?: (string | number)[]): void {
        const numColumns = this.body.length > 0
            ? this.body[0].length
            : this.getTotalLeafCount("theader")
        const newRow: string[] = []

        for (let i = 0; i < numColumns; i++) {
            const newCell = this.cellRegistry.createCell("body", data?.[i]?.toString())
            newRow.push(newCell)
        }

        this.body.splice(rowIndex, 0, newRow)
    }

    removeBodyRow(rowIndex: number): void {
        if (rowIndex >= 0 && rowIndex < this.body.length) {
            const removedRow = this.body.splice(rowIndex, 1)[0]

            for (const cellId of removedRow) {
                this.cellRegistry.deleteCell(cellId)
            }
        }
    }

    getBodyCell(rowIndex: number, colIndex: number): string | undefined {
        const row = this.body[rowIndex]
        if (row) {
            return row[colIndex]
        }
        return undefined
    }

    getBody(): readonly (readonly string[])[] {
        return this.body
    }

    removeChildCell(parentId: string, childId: string, region: Region): void {
        
        const children = this.childrenMap.get(childId) || []
        const childrenOfParent = this.childrenMap.get(parentId) || []
        const filteredChildren = childrenOfParent.filter(id => id !== childId)
        const updatedChildren = [...filteredChildren, ...children]


        if (this.isLeafCell(childId)) {
            const index = this.getBodyIndexForHeaderLeafCell(region, childId)
            if (region === "theader") {
                this.removeBodyCol(index)
            } else if (region === "lheader" || region === "rheader") {
                this.removeBodyRow(index)
            }
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

    countTotalCols(): number {
        return this.headerRoots.get("theader")?.length ?? 0
    }

    countTotalRows(): number {
        let maxTHeaderRows = 0

        for (const header of this.headerRoots.get("theader") || []) {
            maxTHeaderRows = Math.max(maxTHeaderRows, this.getHeightOfCell(header))
        }
        return this.body.length + maxTHeaderRows
    }

    reorderHeaderCell(region: Region, fromIndex: number, toIndex: number, withChildren?: boolean): void {
        
    }

    getCompleteGrid(): string[][] {
        return [[]]
    }


}