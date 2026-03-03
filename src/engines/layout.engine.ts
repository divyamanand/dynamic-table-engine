import { ICellRegistry, ILayoutEngine, IMergeRegistry, IStructureStore } from "../interfaces";
import { Cell } from "../core/cell";
import { Region } from "../types";

export class LayoutEngine implements ILayoutEngine {

    private mergeRegistry: IMergeRegistry
    private structureStore: IStructureStore
    private cellRegistry: ICellRegistry
    private _isLayoutDirty: boolean = false

    constructor(
        mergeRegistry: IMergeRegistry,
        structureStore: IStructureStore,
        cellRegistry: ICellRegistry
    ) {
        this.mergeRegistry = mergeRegistry
        this.structureStore = structureStore
        this.cellRegistry = cellRegistry
    }

    markDirty(): void {
        this._isLayoutDirty = true
    }

    private calculateColSpan(cellId: string, res: Map<string, number>): number {
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

    private calculateRowSpan(cellId: string, res: Map<string, number>, currLevel: number, heightMax: number): void {
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
    
    private applyLayoutForCell(
        cellId: string,
        primaryStart: number,
        secondaryStart: number,
        primarySpanMap: Map<string, number>,
        secondarySpanMap: Map<string, number>,
        orientation: "horizontal" | "vertical"
    ): void {
        const cell = this.cellRegistry.getCellById(cellId) as Cell
        const primarySpan = primarySpanMap.get(cellId) ?? 1
        const secondarySpan = secondarySpanMap.get(cellId) ?? 1

        const row = orientation === "horizontal" ? secondaryStart : primaryStart
        const col = orientation === "horizontal" ? primaryStart : secondaryStart
        const rowSpan = orientation === "horizontal" ? secondarySpan : primarySpan
        const colSpan = orientation === "horizontal" ? primarySpan : secondarySpan

        cell._setLayout({ row, col, rowSpan, colSpan })
        this.cellRegistry.setCellAddress(cellId, row, col)

        let childPrimaryStart = primaryStart
        for (const child of this.structureStore.getChildren(cellId) ?? []) {
            this.applyLayoutForCell(
                child,
                childPrimaryStart,
                secondaryStart + secondarySpan,
                primarySpanMap,
                secondarySpanMap,
                orientation
            )
            childPrimaryStart += primarySpanMap.get(child) ?? 1
        }
    }

    applyHeaderLayout(region: Region, rowOffset: number, colOffset: number): void {
        const roots = this.structureStore.getRoots(region) ?? []
        if (roots.length === 0) return

        const orientation: "horizontal" | "vertical" =
            region === "theader" ? "horizontal" : "vertical"

        const maxDepth = roots.reduce((max, root) =>
            Math.max(max, this.structureStore.getHeightOfCell(root)), 0)

        const fixedOffset = orientation === "horizontal" ? rowOffset : colOffset
        let advancingStart = orientation === "horizontal" ? colOffset : rowOffset

        for (const root of roots) {
            const primarySpanMap = new Map<string, number>()
            const secondarySpanMap = new Map<string, number>()

            this.calculateColSpan(root, primarySpanMap)
            this.calculateRowSpan(root, secondarySpanMap, 1, maxDepth)

            this.applyLayoutForCell(
                root,
                advancingStart,
                fixedOffset,
                primarySpanMap,
                secondarySpanMap,
                orientation
            )

            advancingStart += primarySpanMap.get(root) ?? 1
        }
    }

    applyBodyLayout(rowOffset: number, colOffset: number): void {
        const body = this.structureStore.getBody()
        for (let r = 0; r < body.length; r++) {
            for (let c = 0; c < body[r].length; c++) {
                const cellId = body[r][c]
                const row = rowOffset + r
                const col = colOffset + c
                const cell = this.cellRegistry.getCellById(cellId) as Cell
                cell._setLayout({ row, col, rowSpan: 1, colSpan: 1 })
                this.cellRegistry.setCellAddress(cellId, row, col)
            }
        }
    }

    rebuild(): void {
        const lhD = (this.structureStore.getRoots("lheader") ?? [])
            .reduce((max, r) => Math.max(max, this.structureStore.getHeightOfCell(r)), 0)
        const thD = (this.structureStore.getRoots("theader") ?? [])
            .reduce((max, r) => Math.max(max, this.structureStore.getHeightOfCell(r)), 0)
        const thL = this.structureStore.getLeafCount("theader")

        this.applyHeaderLayout("lheader", thD, 0)
        this.applyHeaderLayout("theader", 0, lhD)
        this.applyHeaderLayout("rheader", thD, lhD + thL)
        this.applyBodyLayout(thD, lhD)

        this._isLayoutDirty = false
    }

    isLayoutDirty(): boolean {
        return this._isLayoutDirty
    }
}