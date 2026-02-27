import { CellAddress } from "../../types/common";
import { ICell } from "../core/cell.interface";

/**
 * ITableNavigator - Read-only cell lookup and navigation
 * Responsibility: Finding cells by ID/address
 * (getCellHeaders moved to IRegionIndexManager)
 */
export interface ITableNavigator {
    findCell(
        cellID?: string,
        cellAddress?: CellAddress
    ): { row: number; col: number; cell: ICell } | null;
}
