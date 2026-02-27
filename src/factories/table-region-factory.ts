import { Region } from "../types/common";
import { ITableRegion } from "../interfaces";
import { TableRegion } from "../core/region";
import { ITableRegionFactory } from "../interfaces";


export class TableRegionFactory implements ITableRegionFactory {
    create(region: Region): ITableRegion {
        return new TableRegion(region);
    }
}
