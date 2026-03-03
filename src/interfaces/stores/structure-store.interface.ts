import { Region } from "../../types"

export interface IStructureStore {

    // =====================================================
    // HEADER TREE (Topology)
    // =====================================================

    // Roots
    addRootCell(cellId: string, region: Region): void
    removeRootCell(cellId: string, region: Region): void
    getRoots(region: Region): readonly string[] | undefined
    
    // Parent-Child
    addChildCell(parentId: string, region: Region, childId?: string, index?: number): void
    removeChildCell(parentId: string, childId: string, region: Region): void
    getChildren(parentId: string): readonly string[] | undefined
    
    
    // =====================================================
    // BODY GRID (2D Ordered Structure)
    // =====================================================
    
    insertBodyRow(rowIndex: number, data?: (string | number)[]): void
    removeBodyRow(rowIndex: number): void

    // insertBodyCell(rowIndex: number, colIndex: number, cellId: string): void
    // removeBodyCell(rowIndex: number, colIndex: number): void

    insertBodyCol(colIndex: number, data?: (string | number)[]): void
    removeBodyCol(colIndex: number): void
    
    getBodyCell(rowIndex: number, colIndex: number): string | undefined
    getBody(): readonly (readonly string[])[]

    countTotalRows(): number
    countTotalCols(): number

    getLeafCells(cellId: string): string[]
    getCompleteGrid(): string[][]
    getHeightOfCell(cellId: string): number
    isLeafCell(cellId: string): boolean
    getLeafCount(region: Region): number

    reorderHeaderCell(region: Region, fromIndex: number, toIndex: number, withChildren?: boolean): void
}