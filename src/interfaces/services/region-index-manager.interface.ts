import { CellLayout, Region } from "../../types";
import { ITableRegion } from "../core/region.interface";
import { ICell } from "../core/cell.interface";


export interface IRegionIndexManager {
    getIndex(): Map<Region, ITableRegion>;
    getRegion(region: Region): ITableRegion | undefined;
    add(region: Region, cell: ICell): void;
    remove(region: Region, cellID: string): void;
    move(fromRegion: Region, toRegion: Region, cell: ICell): void;
    rebuild(cells: ICell[][]): void;
    getCellHeaders(targetLayout: CellLayout): { lheader: ICell | null; rheader: ICell | null; theader: ICell | null };
}