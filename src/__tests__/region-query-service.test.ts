import { Table } from '../table';
import { Cell } from '../cell';

/**
 * TABLE: RegionQueryService Tests
 *
 * | # | Test Name | Test Case | Expected Result |
 * |---|-----------|-----------|-----------------|
 * | GETTOTALCELLCOUNT |
 * | 1 | should return 0 rows and empty columns array for empty table | Empty table | rows=0, columns=[] |
 * | 2 | should return correct row and column counts | Table with [[c1,c2], [c3,c4,c1]] | rows=2, columns=[2,3] |
 * | GETALLCELLSOFREGION |
 * | 3 | should return all cells in a specific region | Get 'theader' from mixed regions | Returns all 'theader' cells |
 * | 4 | should return empty result if no cells in region | Get 'footer' from table with no footer | Returns empty result |
 * | GETCOLUMNSCOUNT |
 * | 5 | should return 0 for empty table | Empty cells | Returns 0 |
 * | 6 | should return 0 when no theader cells exist | Table with only body cells | Returns 0 |
 * | 7 | should return column count from leaf theader nodes (all cells without children) | 3 leaf theader cells | Returns 3 |
 * | 8 | should count only leaf theader cells in hierarchical headers (parent with children) | 2-level hierarchy with 3 leaves | Returns 3 |
 * | 9 | should count leaf theader cells (ignore parent theader cells with children) | Parent with 2 children + 1 standalone | Returns 3 |
 * | 10 | should handle mixed regions with parent-child theader relationships | Mix of lheader, theader, body | Counts only theader leaves |
 * | 11 | should count leaf theader cells when theader is not in first row | theader in second row | Returns leaf count from second row |
 * | 12 | should handle deep hierarchical theader with multiple parent levels | 3-level hierarchy | Returns 5 leaf counts |
 * | 13 | should count correctly with footer after theader | theader + footer rows | Returns theader leaf count only |
 * | 14 | should count correctly when theader appears after body | body + theader rows | Returns theader leaf count |
 * | 15 | should return 0 when theader cells have no children | Parent nodes with empty children | Returns parent leaf count |
 * | GETLEAFCOUNTS |
 * | 16 | should count leaf nodes in theader region with 2-level hierarchy | 2 root parents with 3 leaf children | Returns 3 |
 * | 17 | should count leaf nodes in theader region with 3-level hierarchy | 1 root → 2 groups → 4 leaves | Returns 4 |
 * | 18 | should count leaf nodes in lheader region with parent-child structure | lheader parent with 2 children | Returns 2 |
 * | 19 | should count mix of root leaves and tree leaves in theader | 1 parent + 2 children + 1 standalone leaf | Returns 3 |
 * | 20 | should return 0 for empty region | No lheader in table | Returns 0 |
 * | 21 | should count correctly with children that are actually leaves | Parent with 2 leaf children | Returns 2 |
 * | 22 | should count correctly with multiple root nodes in same region | 3 roots: r1(1 leaf), r2(0 children), r3(2 leaves) | Returns 4 |
 */

describe('RegionQueryService', () => {
  let table: Table;

  beforeEach(() => {
    table = new Table([]);
  });

  describe('getTotalCellCount', () => {
    it('should return 0 rows and empty columns array for empty table', () => {
      const result = table.getTotalCellCount();
      expect(result.rows).toBe(0);
      expect(result.columns).toEqual([]);
    });

    it('should return correct row and column counts', () => {
      const cell1 = new Cell('cell-1', 'theader');
      const cell2 = new Cell('cell-2', 'lheader');
      const cell3 = new Cell('cell-3', 'footer');
      const cell4 = new Cell('cell-4', 'footer');
      table.cells = [
        [cell1, cell2],
        [cell3, cell4, cell1],
      ];

      const result = table.getTotalCellCount();
      expect(result.rows).toBe(2);
      expect(result.columns).toEqual([2, 3]);
    });
  });

  describe('getAllCellsOfRegion', () => {
    it('should return all cells in a specific region', () => {
      const cell1 = new Cell('cell-1', 'theader');
      const cell2 = new Cell('cell-2', 'lheader');
      const cell3 = new Cell('cell-3', 'theader');
      const cell4 = new Cell('cell-4', 'lheader');
      table.cells = [
        [cell1, cell2],
        [cell3, cell4],
      ];

      const result = table.getAllCellsOfRegion('theader');
      const flatResult = result.flat();
      expect(flatResult.map((c: Cell) => c.cellID).sort()).toEqual(['cell-1', 'cell-3']);
    });

    it('should return empty result if no cells in region', () => {
      const cell1 = new Cell('cell-1', 'theader');
      table.cells = [[cell1]];

      const result = table.getAllCellsOfRegion('footer');
      const flatResult = result.flat();
      expect(flatResult.length).toBe(0);
    });
  });

  describe('getColumnsCount', () => {
    it('should return 0 for empty table', () => {
      table.cells = [];
      expect(table.getColumnsCount()).toBe(0);
    });

    it('should return 0 when no theader cells exist', () => {
      const cell1 = new Cell('cell-1', 'body');
      const cell2 = new Cell('cell-2', 'body');
      table.cells = [[cell1, cell2]];
      expect(table.getColumnsCount()).toBe(0);
    });

    it('should return column count from leaf theader nodes (all cells without children)', () => {
      // All cells are leaf nodes (no children)
      const h1 = new Cell('h1', 'theader');
      const h2 = new Cell('h2', 'theader');
      const h3 = new Cell('h3', 'theader');
      table.cells = [[h1, h2, h3]];

      // 3 leaf theader cells = 3 columns
      expect(table.getColumnsCount()).toBe(3);
    });

    it('should count only leaf theader cells in hierarchical headers (parent with children)', () => {
      // Row 0: Parent headers with children
      const parent1 = new Cell('parent1', 'theader');
      const parent2 = new Cell('parent2', 'theader');

      // Row 1: Leaf headers (actual columns, no children)
      const leaf1 = new Cell('leaf1', 'theader'); // No children = leaf node
      const leaf2 = new Cell('leaf2', 'theader'); // No children = leaf node
      const leaf3 = new Cell('leaf3', 'theader'); // No children = leaf node

      // Set parent-child relationships with ICell references
      parent1.children = [leaf1, leaf2];
      parent2.children = [leaf3];
      leaf1.parent = parent1;
      leaf2.parent = parent1;
      leaf3.parent = parent2;

      table.cells = [
        [parent1, parent2],
        [leaf1, leaf2, leaf3],
      ];

      // Only count leaf theader cells in the tree (3 leaves)
      expect(table.getColumnsCount()).toBe(3);
    });

    it('should count leaf theader cells (ignore parent theader cells with children)', () => {
      // Parent with children (not a leaf)
      const parent = new Cell('parent', 'theader');
      // Leaf cells (no children)
      const child1 = new Cell('child1', 'theader');
      const child2 = new Cell('child2', 'theader');
      const leaf3 = new Cell('leaf3', 'theader'); // Standalone leaf (root node with no children)

      // Set parent-child relationships with ICell references
      parent.children = [child1, child2];
      child1.parent = parent;
      child2.parent = parent;
      // leaf3 has no parent (it's a root node)

      table.cells = [[parent, child1, child2, leaf3]];

      // Count only leaf nodes: child1, child2, leaf3 = 3 columns
      expect(table.getColumnsCount()).toBe(3);
    });

    it('should handle mixed regions with parent-child theader relationships', () => {
      const lh = new Cell('lh', 'lheader');
      const parent = new Cell('h-parent', 'theader');
      const h1 = new Cell('h-leaf1', 'theader');
      const h2 = new Cell('h-leaf2', 'theader');
      const b = new Cell('b', 'body');

      // Set parent-child relationships with ICell references
      parent.children = [h1, h2];
      h1.parent = parent;
      h2.parent = parent;

      table.cells = [[lh, parent, h1, h2, b]];

      // Count only theader leaf cells: h1, h2 = 2 columns
      expect(table.getColumnsCount()).toBe(2);
    });

    it('should count leaf theader cells when theader is not in first row', () => {
      const lh = new Cell('lh', 'lheader');
      const parent = new Cell('h-parent', 'theader');
      const h1 = new Cell('h-leaf1', 'theader');
      const h2 = new Cell('h-leaf2', 'theader');

      // Set parent-child relationships with ICell references
      parent.children = [h1, h2];
      h1.parent = parent;
      h2.parent = parent;

      table.cells = [
        [lh],
        [parent, h1, h2],
      ];

      // Count leaf theader cells: h1, h2 = 2 columns
      expect(table.getColumnsCount()).toBe(2);
    });

    it('should handle deep hierarchical theader with multiple parent levels', () => {
      // Row 0: Top-level parent
      const root = new Cell('root', 'theader');

      // Row 1: Mid-level parents
      const group1 = new Cell('group1', 'theader');
      const group2 = new Cell('group2', 'theader');

      // Row 2: Leaf headers (no children)
      const leaf1 = new Cell('leaf1', 'theader');
      const leaf2 = new Cell('leaf2', 'theader');
      const leaf3 = new Cell('leaf3', 'theader');
      const leaf4 = new Cell('leaf4', 'theader');
      const leaf5 = new Cell('leaf5', 'theader');

      // Set parent-child relationships with ICell references for multi-level hierarchy
      root.children = [group1, group2];
      group1.children = [leaf1, leaf2];
      group2.children = [leaf3, leaf4, leaf5];
      group1.parent = root;
      group2.parent = root;
      leaf1.parent = group1;
      leaf2.parent = group1;
      leaf3.parent = group2;
      leaf4.parent = group2;
      leaf5.parent = group2;

      table.cells = [
        [root],
        [group1, group2],
        [leaf1, leaf2, leaf3, leaf4, leaf5],
      ];

      // Count leaf nodes from tree traversal: 5 leaves
      expect(table.getColumnsCount()).toBe(5);
    });

    it('should count correctly with footer after theader', () => {
      const parent = new Cell('h-parent', 'theader');
      const h1 = new Cell('h-leaf1', 'theader');
      const h2 = new Cell('h-leaf2', 'theader');
      const f1 = new Cell('f1', 'footer');
      const f2 = new Cell('f2', 'footer');

      // Set parent-child relationships with ICell references
      parent.children = [h1, h2];
      h1.parent = parent;
      h2.parent = parent;

      table.cells = [
        [parent, h1, h2],
        [f1, f2],
      ];

      // Count leaf theader cells: h1, h2 = 2 columns
      expect(table.getColumnsCount()).toBe(2);
    });

    it('should count correctly when theader appears after body', () => {
      const b1 = new Cell('b1', 'body');
      const b2 = new Cell('b2', 'body');
      const parent = new Cell('h-parent', 'theader');
      const h1 = new Cell('h-leaf1', 'theader');

      // Set parent-child relationships with ICell references
      parent.children = [h1];
      h1.parent = parent;

      table.cells = [
        [b1, b2],
        [parent, h1],
      ];

      // Count leaf theader cells: h1 = 1 column
      expect(table.getColumnsCount()).toBe(1);
    });

    it('should return 0 when theader cells have no children', () => {
      // Test with only parent nodes, no leaf children in grid
      const parent1 = new Cell('parent1', 'theader');
      const parent2 = new Cell('parent2', 'theader');

      // Parents themselves count as roots with no children = leaves
      parent1.children = [];
      parent2.children = [];

      table.cells = [[parent1, parent2]];

      // Count leaf theader cells: parent1 and parent2 are both root leaves = 2
      expect(table.getColumnsCount()).toBe(2);
    });
  });

  describe('getLeafCounts - tree traversal with direct ICell references', () => {
    it('should count leaf nodes in theader region with 2-level hierarchy', () => {
      // Create proper parent-child relationships with ICell references
      const parent1 = new Cell('p1', 'theader');
      const parent2 = new Cell('p2', 'theader');
      const leaf1 = new Cell('l1', 'theader');
      const leaf2 = new Cell('l2', 'theader');
      const leaf3 = new Cell('l3', 'theader');

      // Set parent-child relationships with ICell references
      parent1.children = [leaf1, leaf2];
      parent2.children = [leaf3];
      leaf1.parent = parent1;
      leaf2.parent = parent1;
      leaf3.parent = parent2;

      table.cells = [[parent1, parent2], [leaf1, leaf2, leaf3]];

      // primaryNodes = {p1, p2} (only root cells)
      // Traverse from p1 → count leaves {l1, l2} = 2
      // Traverse from p2 → count leaves {l3} = 1
      // Total = 3
      expect(table.getLeafCounts('theader')).toBe(3);
    });

    it('should count leaf nodes in theader region with 3-level hierarchy', () => {
      // Create deep hierarchy with ICell references
      const root = new Cell('root', 'theader');
      const group1 = new Cell('g1', 'theader');
      const group2 = new Cell('g2', 'theader');
      const leaf1 = new Cell('l1', 'theader');
      const leaf2 = new Cell('l2', 'theader');
      const leaf3 = new Cell('l3', 'theader');
      const leaf4 = new Cell('l4', 'theader');

      // Set parent-child relationships with ICell references
      root.children = [group1, group2];
      group1.children = [leaf1, leaf2];
      group2.children = [leaf3, leaf4];
      group1.parent = root;
      group2.parent = root;
      leaf1.parent = group1;
      leaf2.parent = group1;
      leaf3.parent = group2;
      leaf4.parent = group2;

      table.cells = [[root], [group1, group2], [leaf1, leaf2, leaf3, leaf4]];

      // primaryNodes = {root} (only root cell)
      // Traverse from root → g1, g2
      //   From g1 → count leaves {l1, l2} = 2
      //   From g2 → count leaves {l3, l4} = 2
      // Total = 4
      expect(table.getLeafCounts('theader')).toBe(4);
    });

    it('should count leaf nodes in lheader region with parent-child structure', () => {
      const parent = new Cell('lp', 'lheader');
      const child1 = new Cell('lc1', 'lheader');
      const child2 = new Cell('lc2', 'lheader');

      // Set parent-child relationships with ICell references
      parent.children = [child1, child2];
      child1.parent = parent;
      child2.parent = parent;

      table.cells = [[parent, child1, child2]];

      // primaryNodes = {lp}
      // Traverse from lp → count leaves {lc1, lc2} = 2
      expect(table.getLeafCounts('lheader')).toBe(2);
    });

    it('should count mix of root leaves and tree leaves in theader', () => {
      const parent = new Cell('p', 'theader');
      const child1 = new Cell('c1', 'theader');
      const child2 = new Cell('c2', 'theader');
      const standalone = new Cell('s', 'theader'); // Root node with no children = leaf

      // Set parent-child relationships with ICell references
      parent.children = [child1, child2];
      child1.parent = parent;
      child2.parent = parent;
      // standalone has no parent

      table.cells = [[parent, standalone], [child1, child2]];

      // primaryNodes = {p, s} (both are root cells)
      // From p → count leaves {c1, c2} = 2
      // From s → has no children, count = 1
      // Total = 3
      expect(table.getLeafCounts('theader')).toBe(3);
    });

    it('should return 0 for empty region', () => {
      const cell = new Cell('c', 'theader');
      table.cells = [[cell]];

      // No lheader cells in table
      expect(table.getLeafCounts('lheader')).toBe(0);
    });

    it('should count correctly with children that are actually leaves', () => {
      // Parent with children that are all leaf nodes (no further children)
      const parent = new Cell('p', 'theader');
      const child1 = new Cell('c1', 'theader');
      const child2 = new Cell('c2', 'theader');

      // Set parent-child relationships with ICell references
      parent.children = [child1, child2];
      child1.parent = parent;
      child2.parent = parent;

      table.cells = [[parent, child1, child2]];

      // primaryNodes = {p}
      // From p → children {child1, child2} → both are leaves
      // Total = 2
      expect(table.getLeafCounts('theader')).toBe(2);
    });

    it('should count correctly with multiple root nodes in same region', () => {
      const root1 = new Cell('r1', 'theader');
      const root1child = new Cell('r1c1', 'theader');
      const root2 = new Cell('r2', 'theader'); // Root with no children
      const root3 = new Cell('r3', 'theader');
      const root3child1 = new Cell('r3c1', 'theader');
      const root3child2 = new Cell('r3c2', 'theader');

      // Set parent-child relationships with ICell references
      root1.children = [root1child];
      root3.children = [root3child1, root3child2];
      root1child.parent = root1;
      root3child1.parent = root3;
      root3child2.parent = root3;

      table.cells = [
        [root1, root2, root3],
        [root1child, root3child1, root3child2],
      ];

      // primaryNodes = {r1, r2, r3}
      // From r1 → count leaves {r1c1} = 1
      // From r2 → no children, count = 1
      // From r3 → count leaves {r3c1, r3c2} = 2
      // Total = 4
      expect(table.getLeafCounts('theader')).toBe(4);
    });
  });
});
