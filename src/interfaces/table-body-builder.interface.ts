/**
 * ITableBodyBuilder - Body construction (header intersection -> body cells)
 * Responsibility: Build the table body grid from header regions
 */
export interface ITableBodyBuilder {
    buildTableBody(): void;
}
