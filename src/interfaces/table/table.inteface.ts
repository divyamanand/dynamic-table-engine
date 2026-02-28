import { Region } from "../../types";

export interface ITable {
    
    addNewCell(region: Region, parentId?: string, isDynamic?: boolean): string
    
}