import { Region } from "../types/common";
import { TableRegionFactory } from "../factories";
import { IRegionIndexManager, ICell, ITableRegionFactory, ITableRegion } from "../interfaces";

export const DEFAULT_REGIONS: Region[] = [
    'theader',
    'lheader',
    'rheader',
    'footer',
    'body',
];

export class RegionIndexManager implements IRegionIndexManager {
    private index: Map<Region, ITableRegion>;

    constructor(
        cells: ICell[][] = [],
        private readonly knownRegions: Region[] = DEFAULT_REGIONS,
        private readonly regionFactory: ITableRegionFactory = new TableRegionFactory()
    ) {
        this.index = this.buildIndex(cells);
    }

    getIndex(): Map<Region, ITableRegion> {
        return this.index;
    }

    getRegion(region: Region): ITableRegion | undefined {
        return this.index.get(region);
    }

    add(region: Region, cell: ICell): void {
        this.index.get(region)?.addCell(cell);
    }

    remove(region: Region, cellID: string): void {
        this.index.get(region)?.removeCell(cellID);
    }

    move(fromRegion: Region, toRegion: Region, cell: ICell): void {
        this.remove(fromRegion, cell.cellID);
        this.add(toRegion, cell);
    }

    rebuild(cells: ICell[][]): void {
        this.index = this.buildIndex(cells);
    }

    private buildIndex(cells: ICell[][]): Map<Region, ITableRegion> {
        const index = new Map<Region, ITableRegion>();
        this.knownRegions.forEach((region) =>
            index.set(region, this.regionFactory.create(region))
        );

        for (const row of cells) {
            for (const cell of row) {
                index.get(cell.inRegion)?.addCell(cell);
            }
        }
        return index;
    }
}
