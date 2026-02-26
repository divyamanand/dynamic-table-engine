import { CellAddress, CellPayload, Region } from "../types/common";
import { ITableNavigator } from "./index";


export interface ITableCellStore extends ITableNavigator {
    cells: ICell[][];

    addNewCell(cellAddress: CellAddress, region: Region, parentCellID?: string): void;
    removeCell(cellID: string, cellAddress: CellAddress): void;
    updateCell(cellID: string, payload: CellPayload): void;
    shiftCell(
        newCellAddress: CellAddress,
        cellID?: string,
        cellAddress?: CellAddress,
        newParentCellID?: string,
        newRegion?: Region
    ): void;
}

// Re-export ICell for convenience
import { ICell } from "./cell.interface";
