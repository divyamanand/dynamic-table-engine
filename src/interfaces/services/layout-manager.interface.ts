import { ICell } from "../core/cell.interface";

/**
 * ILayoutManager - Cell geometry management
 * Responsibility: Assigning layout to cells, managing cell positioning
 * Single authority for cell._setLayout() and address registration in navigator
 */
export interface ILayoutManager {
    /**
     * Assign layout to a cell and register/update its address in the navigator.
     * This is the single entry point for all layout writes.
     *
     * @param cell - The cell to assign layout to
     * @param row - The row number
     * @param col - The column number
     * @param rowSpan - Number of rows the cell spans (default: 1)
     * @param colSpan - Number of columns the cell spans (default: 1)
     */
    assignLayout(cell: ICell, row: number, col: number, rowSpan?: number, colSpan?: number): void;
}
