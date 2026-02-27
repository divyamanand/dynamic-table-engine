import { CellAddress, CellPayload, Region } from "../types/index";
import {
    ICell,
    ITable,
    ICellFactory,
    IRegionIndexManager,
    ITableRegion,
    ICellNavigator,
    ILayoutManager,
    IMergeService,
    ICellMutationService,
    IRegionQueryService,
    IStructureStore,
} from "../interfaces/index";
import {
    CellMutationService,
    CellNavigator,
    MergeService,
    RegionIndexManager,
    RegionQueryService,
    TableBodyBuilder,
    LayoutManager,
} from "../services";
import { StructureStore } from "../store/structure-store";
import { CellFactory } from "../factories";

export class Table implements ITable {
    regionIndex: Map<Region, ITableRegion>;

    private navigator: ICellNavigator;
    private structureStore: IStructureStore;
    private layoutManager: ILayoutManager;
    private indexManager: IRegionIndexManager;
    private mutationService: ICellMutationService;
    private queryService: IRegionQueryService;
    private mergeService: IMergeService;
    private bodyBuilder: TableBodyBuilder;
    private cellFactory: ICellFactory;

    /**
     * Cells getter — reconstructs 2D grid from navigator for testing and inspection.
     * Not used internally; services use navigator directly.
     * Preserves sparse rows (rows without cells may be empty arrays).
     */
    get cells(): ICell[][] {
        const allCells = this.navigator.getAll();
        if (allCells.length === 0) return [];
        const rowMap = new Map<number, Map<number, ICell>>();
        let maxRow = -1;
        for (const cell of allCells) {
            const r = cell.layout?.row ?? 0;
            const c = cell.layout?.col ?? 0;
            maxRow = Math.max(maxRow, r);
            if (!rowMap.has(r)) rowMap.set(r, new Map());
            rowMap.get(r)!.set(c, cell);
        }
        // Create array with all rows from 0 to maxRow
        const result: ICell[][] = [];
        for (let i = 0; i <= maxRow; i++) {
            const colMap = rowMap.get(i);
            if (!colMap) {
                result[i] = [];
            } else {
                const cols = [...colMap.entries()].sort(([a], [b]) => a - b);
                result[i] = cols.map(([, cell]) => cell);
            }
        }
        return result;
    }

    /**
     * Cells setter — for test compatibility.
     * Rebuilds navigator, region index, and services when cells are bulk-assigned.
     */
    set cells(newCells: ICell[][]) {
        // Clear existing cells
        for (const cell of this.navigator.getAll()) {
            this.navigator.remove(cell.cellID);
        }

        // Rebuild region index
        this.indexManager.rebuild(newCells);
        this.regionIndex = this.indexManager.getIndex();

        // Repopulate navigator with new cells via LayoutManager
        for (const [ri, row] of newCells.entries()) {
            for (const [ci, cell] of row.entries()) {
                this.layoutManager.assignLayout(cell, ri, ci);
                this.navigator.register(cell);
            }
        }
    }

    constructor(
        initialCells: ICell[][] = [],
        cellFactory: ICellFactory = new CellFactory(),
        navigator: ICellNavigator = new CellNavigator(),
        structureStore: IStructureStore = new StructureStore(),
        indexManager: IRegionIndexManager = new RegionIndexManager(initialCells),
        layoutManager?: ILayoutManager,
        mergeService?: IMergeService,
        mutationService?: ICellMutationService,
        queryService?: IRegionQueryService
    ) {
        this.cellFactory = cellFactory;
        this.navigator = navigator;
        this.structureStore = structureStore;
        this.indexManager = indexManager;

        // Create mergeService with injected navigator
        this.mergeService = mergeService ?? new MergeService(this.navigator);

        // Create layoutManager with injected dependencies
        this.layoutManager =
            layoutManager ?? new LayoutManager(this.structureStore, this.mergeService, this.navigator);

        // Populate navigator from initial grid via LayoutManager (layout + address assignment)
        for (const [ri, row] of initialCells.entries()) {
            for (const [ci, cell] of row.entries()) {
                this.layoutManager.assignLayout(cell, ri, ci);
                this.navigator.register(cell);
            }
        }

        this.regionIndex = this.indexManager.getIndex();

        // Create mutation and query services with injected dependencies
        this.mutationService =
            mutationService ??
            new CellMutationService(this.navigator, this.indexManager, this.cellFactory, this.layoutManager);
        this.queryService = queryService ?? new RegionQueryService(this.navigator, this.indexManager);
        this.bodyBuilder = new TableBodyBuilder();
    }

    // --- ITableNavigator interface ---
    findCell(
        cellID?: string,
        cellAddress?: CellAddress
    ): { row: number; col: number; cell: ICell } | null {
        return this.navigator.findCell(cellID, cellAddress);
    }

    // --- ITableCellStore interface (inherits findCell via ITableNavigator) ---
    addNewCell(cellAddress: CellAddress, region: Region, parentCellID?: string): void {
        this.mutationService.addNewCell(cellAddress, region, parentCellID);
    }

    removeCell(cellID: string, cellAddress: CellAddress): void {
        this.mutationService.removeCell(cellID, cellAddress);
    }

    updateCell(cellID: string, payload: CellPayload): void {
        this.mutationService.updateCell(cellID, payload);
    }

    shiftCell(
        newCellAddress: CellAddress,
        cellID?: string,
        cellAddress?: CellAddress,
        newParentCellID?: string,
        newRegion?: Region
    ): void {
        this.mutationService.shiftCell(
            newCellAddress,
            cellID,
            cellAddress,
            newParentCellID,
            newRegion
        );
    }

    // --- ITableRegionQuery interface ---
    getAllCellsOfRegion(region: Region): ICell[][] {
        return this.queryService.getAllCellsOfRegion(region);
    }

    getTotalCellCount(): { rows: number; columns: number[] } {
        return this.queryService.getTotalCellCount();
    }

    getLeafCounts(region: Region): number {
        return this.queryService.getLeafCounts(region);
    }

    getColumnsCount(): number {
        return this.queryService.getLeafCounts('theader');
    }

    // --- ITableMerge interface ---
    mergeCells(selectedCellsIDs: string[]): void {
        this.mergeService.mergeCells(selectedCellsIDs);
    }

    unmergeCells(selectedCellID: string): void {
        this.mergeService.unmergeCells(selectedCellID);
    }

    // loadCell — for test setup and data loading; assigns layout via LayoutManager
    loadCell(cell: ICell, address: CellAddress): void {
        this.layoutManager.assignLayout(cell, address.rowNumber, address.colNumber);
        this.navigator.register(cell);
        this.indexManager.add(cell.inRegion, cell);
        this.regionIndex = this.indexManager.getIndex();
    }

    // --- ITableBodyBuilder interface ---
    buildTableBody(): void {
        this.bodyBuilder.buildTableBody();
    }

    getCellHeaders(
        cellID?: string,
        cellAddress?: CellAddress
    ): { lheader: ICell | null; rheader: ICell | null; theader: ICell | null } {
        const found = this.navigator.findCell(cellID, cellAddress);
        if (!found || !found.cell.layout) return { lheader: null, rheader: null, theader: null };
        return this.indexManager.getCellHeaders(found.cell.layout);
    }
}
