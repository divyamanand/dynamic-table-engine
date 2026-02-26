import { CellAddress, CellPayload, Region } from "./types/index";
import { ICell, ITable, ICellFactory, IRegionIndexManager, ITableRegion } from "./interfaces/index";
import { CellMutationService, CellNavigator, MergeService, RegionIndexManager, RegionQueryService, TableBodyBuilder } from "./services";
import { CellFactory } from "./factories";


export class Table implements ITable {
    private _cells: ICell[][];
    regionIndex: Map<Region, ITableRegion>;

    private indexManager!: IRegionIndexManager;
    private navigator!: CellNavigator;
    private mutationService!: CellMutationService;
    private queryService!: RegionQueryService;
    private mergeService!: MergeService;
    private bodyBuilder!: TableBodyBuilder;
    private cellFactory!: ICellFactory;

    get cells(): ICell[][] {
        return this._cells;
    }

    set cells(newCells: ICell[][]) {
        this._cells = newCells;
        // Rebuild region index when cells are directly assigned
        this.indexManager.rebuild(newCells);
        this.regionIndex = this.indexManager.getIndex();
        // Reinitialize services with the new cells reference
        // This ensures services always work with the current cells array
        this.initializeServices();
    }

    private initializeServices(): void {
        // Note: indexManager and regionIndex are already updated
        this.navigator = new CellNavigator(this._cells);
        this.mutationService = new CellMutationService(
            this._cells,
            this.navigator,
            this.indexManager,
            this.cellFactory
        );
        this.queryService = new RegionQueryService(this._cells, this.indexManager);
        this.mergeService = new MergeService(this.navigator);
        this.bodyBuilder = new TableBodyBuilder();
    }

    constructor(
        cells: ICell[][] = [],
        cellFactory: ICellFactory = new CellFactory()
    ) {
        this._cells = cells;
        this.cellFactory = cellFactory;

        // Initialize all services with shared references
        this.indexManager = new RegionIndexManager(cells);
        this.regionIndex = this.indexManager.getIndex();

        this.initializeServices();
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

    getColumnsCount(): number {
        return this.queryService.getColumnsCount();
    }

    // --- ITableMerge interface ---
    mergeCells(selectedCellsIDs: string[]): void {
        this.mergeService.mergeCells(selectedCellsIDs);
    }

    unmergeCells(selectedCellID: string): void {
        this.mergeService.unmergeCells(selectedCellID);
    }

    // --- ITableBodyBuilder interface ---
    buildTableBody(): void {
        this.bodyBuilder.buildTableBody();
    }

    getCellHeaders(
        cellID?: string,
        cellAddress?: CellAddress
    ): { lheader: ICell | null; rheader: ICell | null; theader: ICell | null } {
        return this.navigator.getCellHeaders(cellID, cellAddress);
    }
}
