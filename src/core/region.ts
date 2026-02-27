import { Region } from "../types/index";
import { ITableRegion, ICell } from "../interfaces";

export class TableRegion implements ITableRegion {
    readonly region: Region;
    readonly primaryNodes: Map<string, ICell>;
    private cellIDSet: Set<string>; // Track all cells in this region for quick lookup

    constructor(region: Region, primaryNodes: Map<string, ICell> = new Map()) {
        this.region = region;
        this.primaryNodes = primaryNodes;
        this.cellIDSet = new Set();
    }

    addCell(cell: ICell): void {
        // Track all cells in this region
        this.cellIDSet.add(cell.cellID);
        // Only add to primaryNodes if this is a root cell (no parent)
        if (cell.parent === undefined) {
            this.primaryNodes.set(cell.cellID, cell);
        }
    }

    removeCell(cellID: string): void {
        // Remove from tracking set
        this.cellIDSet.delete(cellID);
        // Remove from primaryNodes if it's there
        if (this.primaryNodes.has(cellID)) {
            this.primaryNodes.delete(cellID);
        }
    }

    hasCellID(cellID: string): boolean {
        // Quick lookup via Set
        return this.cellIDSet.has(cellID);
    }

    getCellIDs(): ReadonlySet<string> {
        // Return all cell IDs in this region
        return new Set(this.cellIDSet);
    }

    getPrimaryNodes(): ReadonlyMap<string, ICell> {
        return this.primaryNodes;
    }

    getLeafCount(): number {
        let count = 0;
        for (const root of this.primaryNodes.values()) {
            count += this.countLeaves(root);
        }
        return count;
    }

    getAllCells(): ICell[] {
        const result: ICell[] = [];
        for (const root of this.primaryNodes.values()) {
            this.collect(root, result);
        }
        return result;
    }

    private collect(cell: ICell, acc: ICell[]): void {
        acc.push(cell);
        for (const child of cell.children) {
            this.collect(child, acc);
        }
    }

    private countLeaves(cell: ICell): number {
        // If this cell has no children, it's a leaf node
        if (cell.children.length === 0) {
            return 1;
        }
        // Otherwise, count leaves in children (direct traversal, no resolver needed)
        return cell.children.reduce((sum, child) => {
            return sum + this.countLeaves(child);
        }, 0);
    }
}