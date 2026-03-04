import { Region } from "../../types"

export interface ILayoutEngine {
    rebuild(): void
    applyHeaderLayout(region: Region, rowOffset: number, colOffset: number): void
    applyBodyLayout(rowOffset: number, colOffset: number): void
    getCompleteGrid(): string[][]
}
