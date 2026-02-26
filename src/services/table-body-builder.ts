import { ITableBodyBuilder } from "../interfaces";

/**
 * TableBodyBuilder - Table body construction and layout
 * Responsibility: Build the table body grid from header regions
 * Fixes SRP: Extracted body building from Table
 */
export class TableBodyBuilder implements ITableBodyBuilder {
    constructor() {}

    buildTableBody(): void {
        // Algorithm outline (from original Table comment):
        // 1. Take the intersection of leaf nodes from theader, lheader, rheader
        // 2. That intersection forms the body grid
        // 3. Append those cells into this.cells and update the regionIndex
        // 4. On merge: rebuild only affected rows/cols, not full body
        // 5. Handle two cases: already built + adding new cells, or no body built yet
        throw new Error("TableBodyBuilder.buildTableBody() - Not yet implemented");
    }
}
