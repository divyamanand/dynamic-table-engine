import { Cell } from "./cell";
import { CellAddress, CellPayload, Region } from "./types/index";
import { ICell, ITable } from "./interfaces/index";

export class Table implements ITable {
    cells: ICell[][];

    constructor(
        cells: ICell[][] = [],
    ) {
        this.cells = cells;
    }

    private findCellByID(cellID: number): { row: number, col: number, cell: ICell } | null {
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

    findCell(cellID?: number, cellAddress?: CellAddress): { row: number, col: number, cell: ICell } | null {
        if (cellID !== undefined) {
            return this.findCellByID(cellID);
        } else if (cellAddress !== undefined) {
            return this.findCellByAddress(cellAddress);
        }
        return null;
    }

    addNewCell(cellAddress: CellAddress, region: Region, parentCellID?: number): void {
        const { rowNumber, colNumber } = cellAddress;
        const randomId = Math.floor(Math.random() * 1e9);
        const newCell = new Cell(
            randomId,
            region,
        );

        if (parentCellID !== undefined) {
            const found = this.findCell(parentCellID);
            if (found) {
                found.cell.children.push(randomId);
                newCell.parent = parentCellID;
            }
        }

        if (!this.cells[rowNumber]) {
            this.cells[rowNumber] = [];
        }
        const cellsRow = this.cells[rowNumber];
        cellsRow.splice(colNumber, 0, newCell);
    }

    removeCell(cellID: number, cellAddress: CellAddress): void {
        const found = this.findCell(cellID, cellAddress);
        if (!found) return;
        const { row, col, cell } = found;
        if (cell.cellID !== cellID) throw new Error("The cell is not present at the mentioned cell address");
        const cellRow = this.cells[row];
        cellRow.splice(col, 1);
    }

    updateCell(cellID: number, payload: CellPayload): void {
        const found = this.findCell(cellID);
        found?.cell.updateCell(payload);
    }

    getTotalCellCount(): { rows: number; columns: number[]; } {
        const rows = this.cells.length
        const columns = []

        for (let i = 0; i < rows; i++) {
            columns.push(this.cells[i].length)
        }
        return {rows, columns}
    }

    shiftCell(newCellAddress: CellAddress, cellID?: number, cellAddress?: CellAddress, newParentCellID?: number): void {
        const found = this.findCell(cellID, cellAddress);
        if (!found) return;
        const { row, col, cell } = found;

        this.cells[row].splice(col, 1);

        const { rowNumber: newRow, colNumber: newCol } = newCellAddress;
        if (!this.cells[newRow]) {
            this.cells[newRow] = [];
        }
        this.cells[newRow].splice(newCol, 0, cell);

        if (newParentCellID !== undefined) {
            cell.parent = newParentCellID;
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
}