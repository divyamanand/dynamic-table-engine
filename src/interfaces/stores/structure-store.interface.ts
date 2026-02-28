import { Region } from "../../types"

export interface IStructureStore {
    //private
    // topHeaderPrimaryNodes: string[]
    // leftHeaderPrimaryNodes: string[]
    // rightHeaderPrimaryNodes: string[]
    // footerPrimaryNodes: string[]
    // body: string[][]

    // header trees
    addTopHeaderRoot(cellId: string): void
    addLeftHeaderRoot(cellId: string): void
    addRightHeaderRoot(cellId: string): void
    addFooterRoot(cellId: string): void

    addHeaderChild(parentId: string, childId: string): void

    getHeaderRoots(region: Region): readonly string[]

    // body
    insertBodyCell(rowIndex: number, colIndex: number, cellId: string): void
    removeBodyCell(rowIndex: number, colIndex: number): void
    getBodyCell(rowIndex: number, colIndex: number): string | undefined

    getBody(): readonly (readonly string[])[]
}