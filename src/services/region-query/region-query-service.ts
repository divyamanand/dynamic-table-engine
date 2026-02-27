import { Region } from "../../types/common";
import { ICell, IRegionQueryService, IRegionIndexManager, ICellNavigator } from "../../interfaces";

export class RegionQueryService implements IRegionQueryService {
    get regionIndex() {
        return this.regionIndexManager.getIndex();
    }

    constructor(
        private readonly navigator: ICellNavigator,
        private readonly regionIndexManager: IRegionIndexManager
    ) {}

    getAllCellsOfRegion(region: Region): ICell[][] {
        const cells = this.regionIndexManager.getRegion(region)?.getAllCells() ?? [];
        const rowMap = new Map<number, ICell[]>();
        for (const cell of cells) {
            const r = cell.layout?.row ?? 0;
            if (!rowMap.has(r)) rowMap.set(r, []);
            rowMap.get(r)!.push(cell);
        }
        return [...rowMap.entries()]
            .sort(([a], [b]) => a - b)
            .map(([, row]) => row.sort((a, b) => (a.layout?.col ?? 0) - (b.layout?.col ?? 0)));
    }

    getLeafCounts(region: Region): number {
        const tableRegion = this.regionIndexManager.getRegion(region);
        if (!tableRegion) return 0;

        // Direct tree traversal with ICell references (no resolver needed)
        return tableRegion.getLeafCount();
    }

    getTotalCellCount(): { rows: number; columns: number[] } {
        const rowMap = new Map<number, number>();
        for (const cell of this.navigator.getAll()) {
            const r = cell.layout?.row ?? 0;
            rowMap.set(r, (rowMap.get(r) ?? 0) + 1);
        }
        const sorted = [...rowMap.entries()].sort(([a], [b]) => a - b);
        return { rows: sorted.length, columns: sorted.map(([, n]) => n) };
    }
}
