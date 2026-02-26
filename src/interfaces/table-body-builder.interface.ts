import { CellAddress } from "../types/common";
import { ICell } from "./index";


export interface ITableBodyBuilder {
    buildTableBody(): void;
    getCellHeaders(
        cellID?: string,
        cellAddress?: CellAddress
    ): { lheader: ICell | null; rheader: ICell | null; theader: ICell | null };
}
