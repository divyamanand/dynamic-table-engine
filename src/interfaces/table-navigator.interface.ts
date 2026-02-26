import { CellAddress } from "../types/common";
import { ICell } from "./index";

/**
 * ITableNavigator - Read-only cell lookup and navigation
 * Responsibility: Finding cells by ID/address and their related headers
 */
export interface ITableNavigator {
    findCell(
        cellID?: string,
        cellAddress?: CellAddress
    ): { row: number; col: number; cell: ICell } | null;

    getCellHeaders(
        cellID?: string,
        cellAddress?: CellAddress
    ): { lheader: ICell | null; rheader: ICell | null; theader: ICell | null };
}
