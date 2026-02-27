import { ICell, ICellNavigator } from "../../interfaces";
import { CellAddress } from "../../types/common";

/**
 * CellNavigator — cell registry and navigator
 * Dual Maps provide O(1) lookup by both cellID and address.
 * No constructor parameters — starts empty, populated via register().
 */
export class CellNavigator implements ICellNavigator {
    private cellsByID = new Map<string, ICell>();
    private cellsByAddress = new Map<string, string>(); // "r:c" → cellID

    // --- Registry methods (called by CellMutationService) ---

    /**
     * Register a cell in both maps.
     * Cell must have layout assigned before calling.
     */
    register(cell: ICell): void {
        if (!cell.layout) {
            throw new Error(`Cell ${cell.cellID} has no layout — call _setLayout before registering`);
        }
        const { row, col } = cell.layout;
        this.cellsByID.set(cell.cellID, cell);
        this.cellsByAddress.set(`${row}:${col}`, cell.cellID);
    }

    /**
     * Remove a cell from both maps.
     */
    remove(cellID: string): void {
        const cell = this.cellsByID.get(cellID);
        if (!cell) return;
        const { row, col } = cell.layout!;
        this.cellsByID.delete(cellID);
        this.cellsByAddress.delete(`${row}:${col}`);
    }

    /**
     * Return all registered cells.
     */
    getAll(): ICell[] {
        return Array.from(this.cellsByID.values());
    }

    // --- Internal address helpers (used by LayoutManager) ---

    /**
     * Remove a cell's address from cellsByAddress map only.
     * Used when a cell is moving to a new address.
     */
    removeFromAddress(_cellID: string, row: number, col: number): void {
        this.cellsByAddress.delete(`${row}:${col}`);
    }

    /**
     * Register a cell's address in cellsByAddress map only.
     * Used when a cell is moving to a new address.
     */
    registerAddress(cellID: string, row: number, col: number): void {
        this.cellsByAddress.set(`${row}:${col}`, cellID);
    }

    // --- Navigator methods (O(1) lookups via Maps) ---

    /**
     * Find a cell by ID or address.
     * O(1) lookup via Maps — no grid iteration.
     */
    findCell(
        cellID?: string,
        cellAddress?: CellAddress
    ): { row: number; col: number; cell: ICell } | null {
        if (cellID !== undefined) {
            const cell = this.cellsByID.get(cellID);
            if (!cell) return null;
            return { row: cell.layout!.row, col: cell.layout!.col, cell };
        }
        if (cellAddress !== undefined) {
            const id = this.cellsByAddress.get(`${cellAddress.rowNumber}:${cellAddress.colNumber}`);
            if (!id) return null;
            const cell = this.cellsByID.get(id)!;
            return { row: cellAddress.rowNumber, col: cellAddress.colNumber, cell };
        }
        return null;
    }
}
