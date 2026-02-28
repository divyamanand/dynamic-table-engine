import { Region } from "../../types"

export interface IStructureStore {

    addRootCell(cellId: string, region: Region): void
    addChildCell(parentId: string, childId: string): void

    removeCellFromHeader(cellId: string): void

    reorderRoot(region: Region, fromIndex: number, toIndex: number): void
    reorderChild(parentId: string, fromIndex: number, toIndex: number): void

    getChildren(parentId: string): readonly string[]
    getRoots(region: Region): readonly string[]

    insertBodyCell(rowIndex: number, colIndex: number, cellId: string): void
    removeBodyCell(rowIndex: number, colIndex: number): void

    insertBodyRow(rowIndex: number): void
    removeBodyRow(rowIndex: number): void

    getBodyCell(rowIndex: number, colIndex: number): string | undefined
    getBody(): readonly (readonly string[])[]
}