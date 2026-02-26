import { ICell, ITableNavigator } from "../interfaces";
import { CellAddress } from "../types/common";


export class CellNavigator implements ITableNavigator {
    constructor(private readonly cells: ICell[][]) {}

    findCell(
        cellID?: string,
        cellAddress?: CellAddress
    ): { row: number; col: number; cell: ICell } | null {
        if (cellID !== undefined) {
            return this.findCellByID(cellID);
        } else if (cellAddress !== undefined) {
            return this.findCellByAddress(cellAddress);
        }
        return null;
    }

    getCellHeaders(
        cellID?: string,
        cellAddress?: CellAddress
    ): { lheader: ICell | null; rheader: ICell | null; theader: ICell | null } {
        // Find the cell position first
        const cellResult = this.findCell(cellID, cellAddress);
        if (!cellResult) {
            return { lheader: null, rheader: null, theader: null };
        }

        const { row, col } = cellResult;

        // Find headers in the same row/col with specific regions
        let lheader: ICell | null = null;
        let rheader: ICell | null = null;
        let theader: ICell | null = null;

        // Find left header in the same row
        for (let c = 0; c < col; c++) {
            if (this.cells[row]?.[c]?.inRegion === 'lheader') {
                lheader = this.cells[row][c];
            }
        }

        // Find right header in the same row
        for (let c = this.cells[row]?.length - 1; c > col; c--) {
            if (this.cells[row][c]?.inRegion === 'rheader') {
                rheader = this.cells[row][c];
            }
        }

        // Find top header in the same column
        for (let r = 0; r < row; r++) {
            if (this.cells[r]?.[col]?.inRegion === 'theader') {
                theader = this.cells[r][col];
            }
        }

        return { lheader, rheader, theader };
    }


    private findCellByID(
        cellID: string
    ): { row: number; col: number; cell: ICell } | null {
        const totalRows = this.cells.length;
        for (let row = 0; row < totalRows; row++) {
            const totalCols = this.cells[row].length;
            for (let col = 0; col < totalCols; col++) {
                if (this.cells[row][col].cellID === cellID) {
                    return { row, col, cell: this.cells[row][col] };
                }
            }
        }
        return null;
    }

    private findCellByAddress(
        cellAddress: CellAddress
    ): { row: number; col: number; cell: ICell } | null {
        const { rowNumber, colNumber } = cellAddress;
        if (!this.cells[rowNumber] || !this.cells[rowNumber][colNumber]) {
            return null;
        }
        return {
            row: rowNumber,
            col: colNumber,
            cell: this.cells[rowNumber][colNumber],
        };
    }
}
