import { ICell, ILayoutManager, ICellNavigator, IMergeService, IStructureStore } from '../../interfaces';
import { CellLayout } from '../../types';

/**
 * LayoutManager — single authority for geometry
 * Only this class is permitted to call cell._setLayout() and update cellsByAddress in CellNavigator.
 * Reads from StructureStore and MergeService to determine span dimensions.
 */
export class LayoutManager implements ILayoutManager {
    constructor(
        private readonly structureStore: IStructureStore,
        private readonly mergeService: IMergeService,
        private readonly navigator: ICellNavigator
    ) {}

    /**
     * Assign layout to a cell and register/update its address in the navigator.
     * This is the single entry point for all layout writes.
     * Full computeLayout() (reading StructureStore + MergeService for auto-span) is deferred.
     */
    assignLayout(cell: ICell, row: number, col: number, rowSpan = 1, colSpan = 1): void {
        // Remove old address key if cell was already registered
        if (cell.layout) {
            this.navigator.removeFromAddress(cell.cellID, cell.layout.row, cell.layout.col);
        }
        const layout: CellLayout = { row, col, rowSpan, colSpan };
        cell._setLayout(layout);
        // Register/update address in navigator
        this.navigator.registerAddress(cell.cellID, row, col);
    }
}
