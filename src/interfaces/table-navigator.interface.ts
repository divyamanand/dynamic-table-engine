import { CellAddress } from "../types/common";
import { ICell } from "./cell.interface";

/**
 * ITableNavigator - Read-only cell lookup contract
 * Consumed by: renderers, read-only services, anyone that needs to find cells
 * Responsibility: Cell navigation by ID or address only
 */
export interface ITableNavigator {
    findCell(
        cellID?: string,
        cellAddress?: CellAddress
    ): { row: number; col: number; cell: ICell } | null;
}
