import { CellAddress, CellPayload, Region } from "../../types/common";

/**
 * ICellMutationService - Cell CRUD and mutation operations
 * Responsibility: Adding, removing, updating, and shifting cells
 * Coordinates with navigator, region index, and layout manager
 */
export interface ICellMutationService {
    /**
     * Add a new cell to the table at the specified address and region.
     *
     * @param cellAddress - The address where the cell should be added
     * @param region - The region the cell belongs to
     * @param parentCellID - Optional parent cell ID for hierarchical relationships
     */
    addNewCell(
        cellAddress: CellAddress,
        region: Region,
        parentCellID?: string
    ): void;

    /**
     * Remove a cell from the table.
     *
     * @param cellID - The ID of the cell to remove
     * @param cellAddress - The address of the cell to remove
     */
    removeCell(cellID: string, cellAddress: CellAddress): void;

    /**
     * Update a cell with new payload data.
     *
     * @param cellID - The ID of the cell to update
     * @param payload - The new data for the cell
     */
    updateCell(cellID: string, payload: CellPayload): void;

    /**
     * Move a cell to a new address and optionally change its parent or region.
     *
     * @param newCellAddress - The new address for the cell
     * @param cellID - Optional cell ID for lookup
     * @param cellAddress - Optional current address for lookup
     * @param newParentCellID - Optional new parent cell ID
     * @param newRegion - Optional new region
     */
    shiftCell(
        newCellAddress: CellAddress,
        cellID?: string,
        cellAddress?: CellAddress,
        newParentCellID?: string,
        newRegion?: Region
    ): void;
}
