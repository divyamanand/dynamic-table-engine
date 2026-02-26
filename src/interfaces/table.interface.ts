import { ITableCellStore } from "./table-cell-store.interface";
import { ITableRegionQuery } from "./table-region-query.interface";
import { ITableMerge } from "./table-merge.interface";
import { ITableBodyBuilder } from "./table-body-builder.interface";

/**
 * ITable - Composition root interface
 *
 * Instead of a monolithic 10-method interface, ITable now composes four focused interfaces:
 *
 * - ITableCellStore: CRUD operations + cell navigation (findCell)
 *   └─ extends ITableNavigator: Read-only cell lookup
 * - ITableRegionQuery: Region-specific queries
 * - ITableMerge: Merge/unmerge operations
 * - ITableBodyBuilder: Body construction and header resolution (LSP fix: getCellHeaders now implemented)
 *
 * Fixes ISP: Each consumer depends only on the interface it needs
 * - Renderer depends on ITableNavigator + ITableRegionQuery
 * - Editor depends on ITableCellStore
 * - Merge UI depends on ITableMerge
 * - Layout engine depends on ITableBodyBuilder
 *
 * Existing code that types variables as ITable continues to work without changes.
 */
export interface ITable
    extends ITableCellStore,
        ITableRegionQuery,
        ITableMerge,
        ITableBodyBuilder {}
