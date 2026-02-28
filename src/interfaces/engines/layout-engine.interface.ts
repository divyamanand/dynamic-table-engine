export interface ILayoutEngine {
    rebuild(): void
    isLayoutDirty(): boolean
}