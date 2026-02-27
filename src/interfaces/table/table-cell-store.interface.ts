import { CellAddress, CellPayload, Region } from "../../types/common";
import { ITableNavigator } from "./table-navigator.interface";
import { ICell } from "../core/cell.interface";


export interface ITableCellStore extends ITableNavigator {
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
    loadCell(cell: ICell, address: CellAddress): void;
}
