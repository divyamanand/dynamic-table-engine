import { CellAddress, CellPayload, Region } from "../../types/common";
import { ICell, ICellFactory, IRegionIndexManager, ICellMutationService, ICellNavigator, ILayoutManager } from "../../interfaces";

export class CellMutationService implements ICellMutationService {
    constructor(
        private readonly navigator: ICellNavigator,
        private readonly regionIndex: IRegionIndexManager,
        private readonly cellFactory: ICellFactory,
        private readonly layoutManager: ILayoutManager
    ) {}

    addNewCell(
        cellAddress: CellAddress,
        region: Region,
        parentCellID?: string
    ): void {
        const newCell = this.cellFactory.create(region);

        // Layout + address registration delegated to LayoutManager
        this.layoutManager.assignLayout(newCell, cellAddress.rowNumber, cellAddress.colNumber);

        // Parent linking
        if (parentCellID !== undefined) {
            const found = this.navigator.findCell(parentCellID);
            if (found) {
                found.cell.children.push(newCell);
                newCell.parent = found.cell;
            }
        }

        // Register in navigator and region index
        this.navigator.register(newCell);
        this.regionIndex.add(region, newCell);
    }

    removeCell(cellID: string, cellAddress: CellAddress): void {
        const found = this.navigator.findCell(cellID, cellAddress);
        if (!found) return;
        const { cell } = found;
        if (cell.cellID !== cellID)
            throw new Error("Cell ID does not match the address");

        // Remove from navigator and region index
        this.navigator.remove(cellID);
        this.regionIndex.remove(cell.inRegion, cellID);
    }

    updateCell(cellID: string, payload: CellPayload): void {
        const found = this.navigator.findCell(cellID);
        if (!found) return;

        const oldRegion = found.cell.inRegion;
        found.cell.updateCell(payload);

        // If region changed, update the index
        if (payload.inRegion && payload.inRegion !== oldRegion) {
            this.regionIndex.move(oldRegion, payload.inRegion, found.cell);
        }
    }

    shiftCell(
        newCellAddress: CellAddress,
        cellID?: string,
        cellAddress?: CellAddress,
        newParentCellID?: string,
        newRegion?: Region
    ): void {
        const found = this.navigator.findCell(cellID, cellAddress);
        if (!found) return;
        const { cell } = found;

        const oldRegion = cell.inRegion;

        // LayoutManager handles old-address removal + new layout assignment + address re-registration
        this.layoutManager.assignLayout(
            cell,
            newCellAddress.rowNumber,
            newCellAddress.colNumber,
            cell.layout?.rowSpan ?? 1,
            cell.layout?.colSpan ?? 1
        );

        // Determine the new region with priority: parent region > explicit newRegion > current region
        const regionToApply = this.resolveRegion(
            cell,
            oldRegion,
            newParentCellID,
            newRegion
        );

        // Update region if it changed
        if (regionToApply !== oldRegion) {
            cell.inRegion = regionToApply;
            this.regionIndex.move(oldRegion, regionToApply, cell);
        }
    }

    /**
     * Private: Resolve the target region for a shifted cell
     * Priority: parent region (highest) > explicit newRegion > current region
     * Fixes OCP: This logic is now named and testable, not hardcoded in shiftCell
     */
    private resolveRegion(
        cell: ICell,
        currentRegion: Region,
        newParentCellID?: string,
        newRegion?: Region
    ): Region {
        if (newParentCellID !== undefined) {
            const parentCell = this.navigator.findCell(newParentCellID);
            if (parentCell) {
                cell.parent = parentCell.cell;
                // Also add cell to parent's children array
                parentCell.cell.children.push(cell);
                return parentCell.cell.inRegion;
            }
        }
        if (newRegion !== undefined) return newRegion;
        return currentRegion;
    }
}
