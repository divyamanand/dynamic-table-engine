import { Region } from "../types";
import { ITableRegion } from "./index";

export interface ITableRegionFactory {
    create(region: Region): ITableRegion;
}