/**
 * IStructureStore - Logical cell ordering by region
 * Responsibility: Storing logical cell sequences for each region
 * Used by LayoutManager to determine logical order when computing geometry
 */
export interface IStructureStore {
    /**
     * Root header cells (top headers)
     */
    headerRoots: string[];

    /**
     * Root cells for left header region
     */
    leftHeaderRoots: string[];

    /**
     * Root cells for right header region
     */
    rightHeaderRoots: string[];

    /**
     * Root cells for footer region
     */
    footerRoots: string[];

    /**
     * Body rows organized as sequences of cell IDs
     */
    bodyRows: string[][];
}
