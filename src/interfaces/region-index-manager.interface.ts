import { Region } from "../types";
import { ITableRegion, ICell } from "./index";


export interface IRegionIndexManager {
    getIndex(): Map<Region, ITableRegion>;
    getRegion(region: Region): ITableRegion | undefined;
    add(region: Region, cellID: string): void;
    remove(region: Region, cellID: string): void;
    move(fromRegion: Region, toRegion: Region, cellID: string): void;
    rebuild(cells: ICell[][]): void;
}