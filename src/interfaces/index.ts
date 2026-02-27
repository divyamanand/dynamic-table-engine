// Core domain interfaces
export { ICell } from "./core/cell.interface";
export { ITableRegion } from "./core/region.interface";

// Service interfaces
export { ICellNavigator } from "./services/cell-navigator.interface";
export { ICellMutationService } from "./services/cell-mutation-service.interface";
export { IRegionIndexManager } from "./services/region-index-manager.interface";
export { IRegionQueryService } from "./services/region-query-service.interface";
export { ILayoutManager } from "./services/layout-manager.interface";
export { IMergeService } from "./services/merge-service.interface";
export { IStructureStore } from "./services/structure-store.interface";
export { ITableBodyBuilder } from "./services/table-body-builder.interface";

// Table composition interfaces
export { ITable } from "./table/table.interface";
export { ITableNavigator } from "./table/table-navigator.interface";
export { ITableCellStore } from "./table/table-cell-store.interface";
export { ITableRegionQuery } from "./table/table-region-query.interface";
export { ITableMerge } from "./table/table-merge.interface";

// Factory interfaces
export { ICellFactory } from "./cell-factory.interface";
export { ITableRegionFactory } from "./table-factory.interface";
