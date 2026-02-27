import { Region } from "../../types";
import { ICell } from "../core";

/**
 * ICellFactory - Abstract cell creation (DIP fix)
 * Consumed by: CellMutationService
 * Responsibility: Create new cells with proper ID generation (removes direct dependency on randomUUID and Cell constructor)
 */
export interface ICellFactory {
    create(region: Region): ICell;
}
