import { Region } from "../types/common";
import { ICell } from "../interfaces/cell.interface";

/**
 * IRegionIndexManager - Contract for region index management
 */
export interface IRegionIndexManager {
    getIndex(): Map<Region, Set<string>>;
    add(region: Region, cellID: string): void;
    remove(region: Region, cellID: string): void;
    move(fromRegion: Region, toRegion: Region, cellID: string): void;
    rebuild(cells: ICell[][]): void;
}

/**
 * RegionIndexManager - Maintains Map<Region, Set<cellID>>
 * Responsibility: Invert index from region -> cells; encapsulate all region index mutations
 * Fixes SRP: Extracted region index management from Table
 * Fixes OCP: Region list is injectable via constructor (defaults to known regions)
 */
export const DEFAULT_REGIONS: Region[] = [
    'theader',
    'lheader',
    'rheader',
    'footer',
    'body',
];

export class RegionIndexManager implements IRegionIndexManager {
    private index: Map<Region, Set<string>>;

    constructor(
        cells: ICell[][] = [],
        private readonly knownRegions: Region[] = DEFAULT_REGIONS
    ) {
        this.index = this.buildIndex(cells);
    }

    getIndex(): Map<Region, Set<string>> {
        return this.index;
    }

    add(region: Region, cellID: string): void {
        this.index.get(region)?.add(cellID);
    }

    remove(region: Region, cellID: string): void {
        this.index.get(region)?.delete(cellID);
    }

    move(fromRegion: Region, toRegion: Region, cellID: string): void {
        this.remove(fromRegion, cellID);
        this.add(toRegion, cellID);
    }

    rebuild(cells: ICell[][]): void {
        this.index = this.buildIndex(cells);
    }

    private buildIndex(cells: ICell[][]): Map<Region, Set<string>> {
        const index = new Map<Region, Set<string>>();
        this.knownRegions.forEach((region) => index.set(region, new Set()));

        for (const row of cells) {
            for (const cell of row) {
                index.get(cell.inRegion)?.add(cell.cellID);
            }
        }
        return index;
    }
}
