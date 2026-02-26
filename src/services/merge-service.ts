import { ICell } from "../interfaces/cell.interface";
import { ITableMerge } from "../interfaces/table-merge.interface";
import { CellNavigator } from "./cell-navigator";

/**
 * MergeService - Multi-cell merge state coordination
 * Responsibility: mergeCells, unmergeCells
 * Fixes SRP: Extracted merge logic from Table
 */
export class MergeService implements ITableMerge {
    constructor(private readonly navigator: CellNavigator) {}

    mergeCells(selectedCellsIDs: string[]): void {
        const [primaryCellId, ...rest] = selectedCellsIDs;
        const primaryCell = this.navigator.findCell(primaryCellId);
        if (!primaryCell)
            throw new Error("The cells are missing or invalid selection");

        for (const cellId of rest) {
            primaryCell.cell.mergeCell(cellId);
            const secondary = this.navigator.findCell(cellId);
            if (secondary) {
                // Update via cell's updateCell method to respect encapsulation
                secondary.cell.updateCell({ mergedInto: primaryCellId });
            }
        }
    }

    unmergeCells(selectedCellID: string): void {
        const cell = this.navigator.findCell(selectedCellID);
        if (!cell) throw new Error("No cell found to unmerge");

        // Unmerge each subsumed cell
        for (const cellId of [...cell.cell.merged]) {
            const subsumed = this.navigator.findCell(cellId);
            if (subsumed) {
                subsumed.cell.mergedInto = undefined;
            }
        }

        // Clear the merged array on the primary cell
        cell.cell.unmergeCells();
    }
}
