import { IStructureStore } from "../interfaces";
import { Region } from "../types";

export class StructureStore implements IStructureStore {
    private topHeaderPrimaryNodes: string[]
    private leftHeaderPrimaryNodes: string[]
    private rightHeaderPrimaryNodes: string[]
    private footerPrimaryNodes: string[]
    private body: string[][]

    constructor () {
        this.topHeaderPrimaryNodes = [],
        this.leftHeaderPrimaryNodes = [],
        this.rightHeaderPrimaryNodes = [],
        this.footerPrimaryNodes = [],
        this.body = []
    }

    addFooterRoot(cellId: string): void {
        
    }

    addHeaderChild(parentId: string, childId: string): void {
        
    }
    addLeftHeaderRoot(cellId: string): void {
        
    }
    addRightHeaderRoot(cellId: string): void {
        
    }
    addTopHeaderRoot(cellId: string): void {
        
    }
    getBody(): readonly (readonly string[])[] {
        
    }
    getBodyCell(rowIndex: number, colIndex: number): string | undefined {
        
    }
    getHeaderRoots(region: Region): readonly string[] {
        
    }
    insertBodyCell(rowIndex: number, colIndex: number, cellId: string): void {
        
    }
    removeBodyCell(rowIndex: number, colIndex: number): void {
        
    }
}