import { CellAddress, CellPayload, Region } from "../types/common";
import { ICell, ICellFactory, IRegionIndexManager } from "../interfaces";
import { CellNavigator } from "./cell-navigator";


export class CellMutationService {
    constructor(
        private readonly cells: ICell[][],
        private readonly navigator: CellNavigator,
        private readonly regionIndex: IRegionIndexManager,
        private readonly cellFactory: ICellFactory
    ) {}

    addNewCell(
        cellAddress: CellAddress,
        region: Region,
        parentCellID?: string
    ): void {
        const { rowNumber, colNumber } = cellAddress;
        const newCell = this.cellFactory.create(region);

        if (parentCellID !== undefined) {
            const found = this.navigator.findCell(parentCellID);
            if (found) {
                found.cell.children.push(newCell);
                newCell.parent = found.cell;
            }
        }

        if (!this.cells[rowNumber]) {
            this.cells[rowNumber] = [];
        }
        this.cells[rowNumber].splice(colNumber, 0, newCell);
        this.regionIndex.add(region, newCell);
    }

    removeCell(cellID: string, cellAddress: CellAddress): void {
        const found = this.navigator.findCell(cellID, cellAddress);
        if (!found) return;
        const { row, col, cell } = found;
        if (cell.cellID !== cellID)
            throw new Error("Cell ID does not match the address");
        
        if (cell.parent === undefined) {
            const children = [...cell.children]
            
        }


        this.cells[row].splice(col, 1);
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
        const { row, col, cell } = found;

        const oldRegion = cell.inRegion;

        this.cells[row].splice(col, 1);

        const { rowNumber: newRow, colNumber: newCol } = newCellAddress;
        if (!this.cells[newRow]) {
            this.cells[newRow] = [];
        }
        this.cells[newRow].splice(newCol, 0, cell);

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
