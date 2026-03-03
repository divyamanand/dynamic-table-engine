import { Region } from "../../types"

export interface ILayoutEngine {
    rebuild(): void
    isLayoutDirty(): boolean
    applyHeaderLayout(region: Region): void
}