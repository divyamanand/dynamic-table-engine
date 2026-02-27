import { IStructureStore } from "../interfaces";

/**
 * StructureStore — logical cell ordering by region
 * Records which cellIDs are in which region and in what sequence.
 * Used by LayoutManager to determine logical order when computing geometry.
 */
export class StructureStore implements IStructureStore {
    headerRoots: string[] = [];
    leftHeaderRoots: string[] = [];
    rightHeaderRoots: string[] = [];
    footerRoots: string[] = [];
    bodyRows: string[][] = [];
}
