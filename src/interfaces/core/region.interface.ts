import { Region } from "../../types/common";
import { ICell } from "./cell.interface";

export interface ITableRegion {
    region: Region;
    primaryNodes: Map<string, ICell>;

    addCell(cell: ICell): void;
    removeCell(cellID: string): void;
    hasCellID(cellID: string): boolean;
    getCellIDs(): ReadonlySet<string>;
    getPrimaryNodes(): ReadonlyMap<string, ICell>;
    getLeafCount(): number;
    getAllCells(): ICell[];
}
