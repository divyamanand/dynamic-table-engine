import { Region } from "../../types"

export interface IStructureStore {

    // =====================================================
    // HEADER TREE (Topology)
    // =====================================================

    // Roots
    addRootCell(cellId: string, region: Region): void
    removeRootCell(cellId: string, region: Region): void
    reorderRoot(region: Region, fromIndex: number, toIndex: number): void
    getRoots(region: Region): readonly string[] | undefined

    // Parent-Child
    addChildCell(parentId: string, region: Region, childId?: string, index?: number): void
    removeChildCell(parentId: string, childId: string, region: Region): void
    reorderChild(parentId: string, fromIndex: number, toIndex: number): void
    getChildren(parentId: string): readonly string[]


    // =====================================================
    // BODY GRID (2D Ordered Structure)
    // =====================================================

    insertBodyRow(rowIndex: number): void
    removeBodyRow(rowIndex: number): void

    insertBodyCell(rowIndex: number, colIndex: number, cellId: string): void
    removeBodyCell(rowIndex: number, colIndex: number): void

    getBodyCell(rowIndex: number, colIndex: number): string | undefined
    getBody(): readonly (readonly string[])[]
}