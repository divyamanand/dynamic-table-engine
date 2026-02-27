import { CellLayout, Region } from "../../types/common";
import { TableRegionFactory } from "../../factories";
import { IRegionIndexManager, ICell, ITableRegionFactory, ITableRegion } from "../../interfaces";

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

    getCellHeaders(targetLayout: CellLayout): { lheader: ICell | null; rheader: ICell | null; theader: ICell | null } {
        const lAll = this.getRegion('lheader')?.getAllCells() ?? [];
        const rAll = this.getRegion('rheader')?.getAllCells() ?? [];
        const tAll = this.getRegion('theader')?.getAllCells() ?? [];
        const { row: tr, col: tc } = targetLayout;

        const lheader = lAll
            .filter(c => c.layout && c.layout.row === tr && c.layout.col < tc)
            .sort((a, b) => b.layout!.col - a.layout!.col)[0] ?? null;

        const rheader = rAll
            .filter(c => c.layout && c.layout.row === tr && c.layout.col > tc)
            .sort((a, b) => a.layout!.col - b.layout!.col)[0] ?? null;

        const theader = tAll
            .filter(c => c.layout && c.layout.col === tc && c.layout.row < tr)
            .sort((a, b) => b.layout!.row - a.layout!.row)[0] ?? null;

        return { lheader, rheader, theader };
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
