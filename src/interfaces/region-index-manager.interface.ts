import { Region } from "../types";
import { ITableRegion, ICell } from "./index";


export interface IRegionIndexManager {
    getIndex(): Map<Region, ITableRegion>;
    getRegion(region: Region): ITableRegion | undefined;
    add(region: Region, cell: ICell): void;
    remove(region: Region, cellID: string): void;
    move(fromRegion: Region, toRegion: Region, cell: ICell): void;
    rebuild(cells: ICell[][]): void;
}