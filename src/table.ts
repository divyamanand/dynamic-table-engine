import { Cell } from "./cell";
import { CellAddress, CellPayload, Region } from "./types/index";
import { ICell, ITable } from "./interfaces/index";
import { randomUUID } from "crypto";

export class Table implements ITable {
    cells: ICell[][];
    regionIndex: Map<Region, Set<string>>;

    constructor(
        cells: ICell[][] = [],
    ) {
        this.cells = cells;
        this.regionIndex = this.buildRegionIndex();
    }

    private buildRegionIndex(): Map<Region, Set<string>> {
        const index = new Map<Region, Set<string>>();
        const regions: Region[] = ['theader', 'lheader', 'rheader', 'footer', 'body'];
        regions.forEach(region => index.set(region, new Set()));

        for (const row of this.cells) {
            for (const cell of row) {
                index.get(cell.inRegion)?.add(cell.cellID);
            }
        }
        return index;
    }

    private findCellByID(cellID: string): { row: number, col: number, cell: ICell } | null {
        const totalRows = this.cells.length;
        for (let row = 0; row < totalRows; row++) {
            const totalCols = this.cells[row].length;
            for (let col = 0; col < totalCols; col++) {
                const cell = this.cells[row][col];
                if (cell.cellID === cellID) {
                    return { row, col, cell };
                }
            }
        }
        return null;
    }

    private findCellByAddress(cellAddress: CellAddress): { row: number, col: number, cell: ICell } | null {
        const { rowNumber, colNumber } = cellAddress;
        if (!this.cells[rowNumber] || !this.cells[rowNumber][colNumber]) {
            return null;
        }
        return { row: rowNumber, col: colNumber, cell: this.cells[rowNumber][colNumber] };
    }

    findCell(cellID?: string, cellAddress?: CellAddress): { row: number, col: number, cell: ICell } | null {
        if (cellID !== undefined) {
            return this.findCellByID(cellID);
        } else if (cellAddress !== undefined) {
            return this.findCellByAddress(cellAddress);
        }
        return null;
    }

    addNewCell(cellAddress: CellAddress, region: Region, parentCellID?: string): void {
        const { rowNumber, colNumber } = cellAddress;
        const cellID = randomUUID();
        const newCell = new Cell(
            cellID,
            region,
        );

        if (parentCellID !== undefined) {
            const found = this.findCell(parentCellID);
            if (found) {
                found.cell.children.push(cellID);
                newCell.parent = parentCellID;
            }
        }

        if (!this.cells[rowNumber]) {
            this.cells[rowNumber] = [];
        }
        const cellsRow = this.cells[rowNumber];
        cellsRow.splice(colNumber, 0, newCell);

        // Update region index
        this.regionIndex.get(region)?.add(cellID);
    }

    removeCell(cellID: string, cellAddress: CellAddress): void {
        const found = this.findCell(cellID, cellAddress);
        if (!found) return;
        const { row, col, cell } = found;
        if (cell.cellID !== cellID) throw new Error("The cell is not present at the mentioned cell address");
        const cellRow = this.cells[row];
        cellRow.splice(col, 1);

        // Update region index
        this.regionIndex.get(cell.inRegion)?.delete(cellID);
    }

    updateCell(cellID: string, payload: CellPayload): void {
        const found = this.findCell(cellID);
        if (!found) return;

        const oldRegion = found.cell.inRegion;
        found.cell.updateCell(payload);

        // If region changed, update the index
        if (payload.inRegion && payload.inRegion !== oldRegion) {
            this.regionIndex.get(oldRegion)?.delete(cellID);
            this.regionIndex.get(payload.inRegion)?.add(cellID);
        }
    }

    getTotalCellCount(): { rows: number; columns: number[]; } {
        const rows = this.cells.length
        const columns = []

        for (let i = 0; i < rows; i++) {
            columns.push(this.cells[i].length)
        }
        return {rows, columns}
    }

    shiftCell(newCellAddress: CellAddress, cellID?: string, cellAddress?: CellAddress, newParentCellID?: string, newRegion?: Region): void {
        const found = this.findCell(cellID, cellAddress);
        if (!found) return;
        const { row, col, cell } = found;

        const oldRegion = cell.inRegion;
        let regionToApply = oldRegion;

        this.cells[row].splice(col, 1);

        const { rowNumber: newRow, colNumber: newCol } = newCellAddress;
        if (!this.cells[newRow]) {
            this.cells[newRow] = [];
        }
        this.cells[newRow].splice(newCol, 0, cell);

        // Determine the new region with priority: parent region > explicit newRegion > current region
        if (newParentCellID !== undefined) {
            // Parent region has highest priority
            const parentCell = this.findCell(newParentCellID);
            if (parentCell) {
                cell.parent = newParentCellID;
                regionToApply = parentCell.cell.inRegion;
            }
        } else if (newRegion !== undefined) {
            // Use explicit region only if no parent is provided
            regionToApply = newRegion;
        }

        // Update region if it changed
        if (regionToApply !== oldRegion) {
            cell.inRegion = regionToApply;
            // Update region index
            this.regionIndex.get(oldRegion)?.delete(cell.cellID);
            this.regionIndex.get(regionToApply)?.add(cell.cellID);
        }
    }

    getAllCellsOfRegion(region: Region): ICell[][] {
        const {rows, columns} = this.getTotalCellCount()
        let regionCells: ICell[][] = []

        for (let i = 0; i < rows; i++) {
            const cells: ICell[] = []
            const totalCols = columns[i]
            for (let j = 0; j < totalCols; j++) {

                if (this.cells[i][j].inRegion === region) {
                    cells.push(this.cells[i][j])
                }
            }

            regionCells = [...regionCells, cells]
        }

        return regionCells
    }

    mergeCells(selectedCellsIDs: string[]): void {
        const [primaryCellId, ...rest] = selectedCellsIDs
        const primaryCell = this.findCell(primaryCellId)

        if (!primaryCell) throw new Error("The cells are missing or inavlid selection")
        
        for (const cellId of rest) {
            primaryCell.cell.mergeCell(cellId)
            this.updateCell(cellId, {mergedInto: primaryCellId})
        }  

    }

    unmergeCells(selectedCellID: string): void {
        const cell = this.findCell(selectedCellID)

        if (!cell) throw new Error("No cell found to unmerge")
        const allMergeCellIds = [...cell.cell.merged]

        for (const cellId of allMergeCellIds) {
            const subsumedCell = this.findCell(cellId);
            if (subsumedCell) {
                subsumedCell.cell.mergedInto = undefined;
            }
        }
        cell.cell.unmergeCells()
    }
}