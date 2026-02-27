import { ICell, ICellFactory, IRegionIndexManager } from "../interfaces";
import {
    CellNavigator,
    MergeService,
    RegionIndexManager,
    RegionQueryService,
    CellMutationService,
    LayoutManager,
} from "../services";
import { StructureStore } from "../store/structure-store";
import { CellFactory } from "./cell-factory";
import { Table } from "../core/table";

/**
 * TableFactory - Composition root for Table dependency wiring
 * Provides factory methods for creating Table instances with various dependency configurations.
 * Implements the composition root pattern to manage dependency creation and injection.
 */
export class TableFactory {
    /**
     * Create a Table with default implementations of all dependencies.
     *
     * @param initialCells - Initial cells to populate the table
     * @param cellFactory - Optional custom cell factory (defaults to CellFactory)
     * @returns A fully configured Table instance
     */
    static createDefault(
        initialCells: ICell[][] = [],
        cellFactory: ICellFactory = new CellFactory()
    ): Table {
        return new Table(initialCells, cellFactory);
    }

    /**
     * Create a Table with custom dependencies.
     *
     * @param initialCells - Initial cells to populate the table
     * @param cellFactory - Optional custom cell factory
     * @param navigator - Optional custom navigator
     * @param structureStore - Optional custom structure store
     * @param indexManager - Optional custom index manager
     * @param layoutManager - Optional custom layout manager
     * @param mergeService - Optional custom merge service
     * @param mutationService - Optional custom mutation service
     * @param queryService - Optional custom query service
     * @returns A Table instance with specified dependencies
     */
    static createWithDependencies(
        initialCells: ICell[][] = [],
        options?: {
            cellFactory?: ICellFactory;
            navigator?: any; // ICellNavigator
            structureStore?: any; // IStructureStore
            indexManager?: IRegionIndexManager;
            layoutManager?: any; // ILayoutManager
            mergeService?: any; // IMergeService
            mutationService?: any; // ICellMutationService
            queryService?: any; // IRegionQueryService
        }
    ): Table {
        const cellFactory = options?.cellFactory ?? new CellFactory();
        const navigator = options?.navigator ?? new CellNavigator();
        const structureStore = options?.structureStore ?? new StructureStore();
        const indexManager = options?.indexManager ?? new RegionIndexManager(initialCells);
        const layoutManager =
            options?.layoutManager ??
            new LayoutManager(
                structureStore,
                options?.mergeService ?? new MergeService(navigator),
                navigator
            );
        const mergeService = options?.mergeService ?? new MergeService(navigator);
        const mutationService =
            options?.mutationService ??
            new CellMutationService(navigator, indexManager, cellFactory, layoutManager);
        const queryService = options?.queryService ?? new RegionQueryService(navigator, indexManager);

        return new Table(
            initialCells,
            cellFactory,
            navigator,
            structureStore,
            indexManager,
            layoutManager,
            mergeService,
            mutationService,
            queryService
        );
    }

    /**
     * Create a Table for testing with mocked dependencies.
     *
     * @param initialCells - Initial cells to populate the table
     * @param mocks - Object containing mock implementations
     * @returns A Table instance with mocked dependencies
     */
    static createForTesting(
        initialCells: ICell[][] = [],
        mocks?: {
            cellFactory?: ICellFactory;
            navigator?: any;
            structureStore?: any;
            indexManager?: IRegionIndexManager;
            layoutManager?: any;
            mergeService?: any;
            mutationService?: any;
            queryService?: any;
        }
    ): Table {
        return this.createWithDependencies(initialCells, mocks);
    }
}
