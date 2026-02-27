import { MergeRegion } from "../../types";
import { IMergeService, ICellNavigator } from "../../interfaces";

/**
 * MergeService - Multi-cell merge state coordination
 * Absorbs MergeRegistry state; owns merge ownership records.
 * Responsibility: mergeCells, unmergeCells, merge queries
 * Fixes SRP: Extracted merge logic from Table
 */
export class MergeService implements IMergeService {
    private merges = new Map<string, MergeRegion>();

    constructor(private readonly navigator: ICellNavigator) {}

    // --- ITableMerge operations ---

    mergeCells(selectedCellIDs: string[]): void {
        const [rootID, ...rest] = selectedCellIDs;
        const rootCell = this.navigator.findCell(rootID)?.cell;
        if (!rootCell?.layout) {
            throw new Error('Primary cell missing or has no layout');
        }

        let minRow = rootCell.layout.row, maxRow = rootCell.layout.row;
        let minCol = rootCell.layout.col, maxCol = rootCell.layout.col;

        for (const id of rest) {
            const found = this.navigator.findCell(id);
            if (!found?.cell.layout) continue;
            const { row, col } = found.cell.layout;
            minRow = Math.min(minRow, row); maxRow = Math.max(maxRow, row);
            minCol = Math.min(minCol, col); maxCol = Math.max(maxCol, col);
        }

        this.merges.set(rootID, {
            rootID,
            startRow: minRow, startCol: minCol,
            endRow: maxRow, endCol: maxCol,
        });
    }

    unmergeCells(rootID: string): void {
        this.merges.delete(rootID);
    }

    // --- Registry query methods (used by LayoutManager) ---

    getMerge(rootID: string): MergeRegion | undefined {
        return this.merges.get(rootID);
    }

    findByCell(r: number, c: number): MergeRegion | undefined {
        for (const region of this.merges.values()) {
            if (r >= region.startRow && r <= region.endRow &&
                c >= region.startCol && c <= region.endCol) {
                return region;
            }
        }
        return undefined;
    }

    getAllMerges(): ReadonlyMap<string, MergeRegion> {
        return this.merges;
    }
}
