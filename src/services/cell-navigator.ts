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
