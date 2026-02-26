import { ITableBodyBuilder, ITableCellStore, ITableMerge, ITableRegionQuery } from "./index";



export interface ITable
    extends ITableCellStore,
        ITableRegionQuery,
        ITableMerge,
        ITableBodyBuilder {}
