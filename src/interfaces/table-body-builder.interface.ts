import { CellAddress } from "../types/common";
import { ICell } from "./cell.interface";

/**
 * ITableBodyBuilder - Table body construction and header resolution
 * Consumed by: layout engine, computed body operations
 * Responsibility: Build table body from region intersections, resolve headers (LSP fix for getCellHeaders)
 */
export interface ITableBodyBuilder {
    buildTableBody(): void;
    getCellHeaders(
        cellID?: string,
        cellAddress?: CellAddress
    ): { lheader: ICell | null; rheader: ICell | null; theader: ICell | null };
}
