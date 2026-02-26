import { Region } from "../types/common";
import { ICell } from "./cell.interface";

/**
 * ICellFactory - Abstract cell creation (DIP fix)
 * Consumed by: CellMutationService
 * Responsibility: Create new cells with proper ID generation (removes direct dependency on randomUUID and Cell constructor)
 */
export interface ICellFactory {
    create(region: Region): ICell;
}
