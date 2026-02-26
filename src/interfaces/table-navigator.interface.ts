import { CellAddress } from "../types/common";
import { ICell } from "./index";


export interface ITableNavigator {
    findCell(
        cellID?: string,
        cellAddress?: CellAddress
    ): { row: number; col: number; cell: ICell } | null;
}
