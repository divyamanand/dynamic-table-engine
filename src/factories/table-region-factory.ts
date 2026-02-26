import { Region } from "../types/common";
import { ITableRegion } from "../interfaces/region.interface";
import { TableRegion } from "../region";
import { ITableRegionFactory } from "../interfaces/table-factory.interface";


export class TableRegionFactory implements ITableRegionFactory {
    create(region: Region): ITableRegion {
        return new TableRegion(region);
    }
}
