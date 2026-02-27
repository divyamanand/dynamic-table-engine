import { ITableNavigator } from "../table/table-navigator.interface";
import { ICell } from "../core/cell.interface";

/**
 * ICellNavigator - Cell registry and navigation service
 * Extends ITableNavigator with registry and internal addressing methods.
 * Responsibility: Cell lookup by ID/address, registration/removal, internal address management
 */
export interface ICellNavigator extends ITableNavigator {
    /**
     * Register a cell in navigation maps.
     * Cell must have layout assigned before calling.
     */
    register(cell: ICell): void;

    /**
     * Remove a cell from navigation maps.
     */
    remove(cellID: string): void;

    /**
     * Return all registered cells.
     */
    getAll(): ICell[];

    /**
     * Remove a cell's address from address map only.
     * Used when a cell is moving to a new address.
     */
    removeFromAddress(cellID: string, row: number, col: number): void;

    /**
     * Register a cell's address in address map only.
     * Used when a cell is moving to a new address.
     */
    registerAddress(cellID: string, row: number, col: number): void;
}
