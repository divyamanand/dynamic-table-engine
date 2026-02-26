import { CellAddress } from "../types/common";
import { ICell } from "../interfaces/cell.interface";
import { ITableBodyBuilder } from "../interfaces/table-body-builder.interface";
import { CellNavigator } from "./cell-navigator";

/**
 * TableBodyBuilder - Table body construction and header resolution
 * Responsibility: buildTableBody, getCellHeaders (LSP fix)
 * Fixes SRP: Extracted layout/body building from Table
 * Fixes LSP: Implements ITableBodyBuilder properly (moved from unimplemented stub in Table)
 * Note: Both methods throw "Not yet implemented" to satisfy the interface contract at the type level
 *       This is the correct way to handle unimplemented features - honest errors at runtime, not silent failures
 */
export class TableBodyBuilder implements ITableBodyBuilder {
    constructor(
        private readonly cells: ICell[][],
        private readonly navigator: CellNavigator
    ) {}

    buildTableBody(): void {
        // Algorithm outline (from original Table comment):
        // 1. Take the intersection of leaf nodes from theader, lheader, rheader
        // 2. That intersection forms the body grid
        // 3. Append those cells into this.cells and update the regionIndex
        // 4. On merge: rebuild only affected rows/cols, not full body
        // 5. Handle two cases: already built + adding new cells, or no body built yet
        throw new Error("TableBodyBuilder.buildTableBody() - Not yet implemented");
    }

    getCellHeaders(
        cellID?: string,
        cellAddress?: CellAddress
    ): { lheader: ICell | null; rheader: ICell | null; theader: ICell | null } {
        // Return the headers that frame the given cell
        // If cellID/cellAddress points to a body cell, find its row/col headers
        // If it's a header cell itself, return relevant headers
        throw new Error("TableBodyBuilder.getCellHeaders() - Not yet implemented");
    }
}
