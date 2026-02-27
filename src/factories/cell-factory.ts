import { randomUUID } from "crypto";
import { Region } from "../types/common";
import { ICell } from "../interfaces";
import { ICellFactory } from "../interfaces";
import { Cell } from "../core/cell";

/**
 * CellFactory - Concrete implementation of ICellFactory
 * Responsibility: Create new cells with deterministic UUID generation
 * Fixes DIP: Table no longer directly calls new Cell(...) or randomUUID()
 */
export class CellFactory implements ICellFactory {
    create(region: Region): ICell {
        const cellID = randomUUID();
        return new Cell(cellID, region);
    }
}
