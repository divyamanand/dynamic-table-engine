import { Table } from '../table';
import { Cell } from '../cell';
import { CellAddress } from '../types/index';

describe('Table', () => {
  let table: Table;

  beforeEach(() => {
    table = new Table([]);
  });

  describe('constructor', () => {
    it('should initialize with empty cells array', () => {
      expect(table.cells).toEqual([]);
    });

    it('should initialize with provided cells array', () => {
      const cell = new Cell('cell-1', 'theader');
      const cells = [[cell]];
      const customTable = new Table(cells);
      expect(customTable.cells).toEqual(cells);
    });
  });

  describe('findCell', () => {
    beforeEach(() => {
      const cell1 = new Cell('cell-1', 'theader');
      const cell2 = new Cell('cell-2', 'lheader');
      const cell3 = new Cell('cell-3', 'footer');
      table.cells = [
        [cell1, cell2],
        [cell3],
      ];
    });

    it('should find cell by ID', () => {
      const result = table.findCell('cell-1');
      expect(result).not.toBeNull();
      expect(result?.cell.cellID).toBe('cell-1');
      expect(result?.row).toBe(0);
      expect(result?.col).toBe(0);
    });

    it('should return null when cell ID not found', () => {
      const result = table.findCell('cell-999');
      expect(result).toBeNull();
    });

    it('should find cell by address', () => {
      const address: CellAddress = { rowNumber: 1, colNumber: 0 };
      const result = table.findCell(undefined, address);
      expect(result).not.toBeNull();
      expect(result?.cell.cellID).toBe('cell-3');
    });

    it('should return null when address is out of bounds', () => {
      const address: CellAddress = { rowNumber: 5, colNumber: 0 };
      const result = table.findCell(undefined, address);
      expect(result).toBeNull();
    });

    it('should return null when column is out of bounds', () => {
      const address: CellAddress = { rowNumber: 0, colNumber: 10 };
      const result = table.findCell(undefined, address);
      expect(result).toBeNull();
    });

    it('should return null when neither ID nor address is provided', () => {
      const result = table.findCell();
      expect(result).toBeNull();
    });
  });

  describe('addNewCell', () => {
    it('should add a new cell at specified address', () => {
      const address: CellAddress = { rowNumber: 0, colNumber: 0 };
      table.addNewCell(address, 'theader');
      expect(table.cells[0]).toBeDefined();
      expect(table.cells[0][0]).toBeDefined();
      expect(table.cells[0][0].inRegion).toBe('theader');
    });

    it('should create new row if it does not exist', () => {
      const address: CellAddress = { rowNumber: 5, colNumber: 0 };
      table.addNewCell(address, 'lheader');
      expect(table.cells[5]).toBeDefined();
      expect(table.cells[5][0]).toBeDefined();
    });

    it('should add cell with parent relationship', () => {
      const parentCell = new Cell('parent-100', 'theader');
      table.cells = [[parentCell]];

      const address: CellAddress = { rowNumber: 1, colNumber: 0 };
      table.addNewCell(address, 'footer', 'parent-100');

      const addedCell = table.cells[1][0];
      expect(addedCell.parent).toBe('parent-100');
      expect(parentCell.children).toContain(addedCell.cellID);
    });

    it('should not add parent if parent cell does not exist', () => {
      const address: CellAddress = { rowNumber: 0, colNumber: 0 };
      table.addNewCell(address, 'theader', 'parent-999');
      const addedCell = table.cells[0][0];
      expect(addedCell.parent).toBeUndefined();
    });

    it('should insert cell at correct column position', () => {
      const cell1 = new Cell('cell-1', 'theader');
      const cell2 = new Cell('cell-2', 'theader');
      table.cells = [[cell1, cell2]];

      const address: CellAddress = { rowNumber: 0, colNumber: 1 };
      table.addNewCell(address, 'theader');

      expect(table.cells[0].length).toBe(3);
      expect(table.cells[0][0].cellID).toBe('cell-1');
      expect(table.cells[0][2].cellID).toBe('cell-2');
    });
  });

  describe('removeCell', () => {
    beforeEach(() => {
      const cell1 = new Cell('cell-1', 'theader');
      const cell2 = new Cell('cell-2', 'lheader');
      const cell3 = new Cell('cell-3', 'footer');
      table.cells = [
        [cell1, cell2],
        [cell3],
      ];
    });

    it('should remove cell at specified address', () => {
      const address: CellAddress = { rowNumber: 0, colNumber: 0 };
      table.removeCell('cell-1', address);
      expect(table.cells[0].length).toBe(1);
      expect(table.cells[0][0].cellID).toBe('cell-2');
    });

    it('should not remove cell if cell ID does not match address', () => {
      const address: CellAddress = { rowNumber: 0, colNumber: 0 };
      table.removeCell('cell-2', address);
      // Cell 1 should still be there since the cellID didn't match
      expect(table.cells[0][0].cellID).toBe('cell-1');
    });

    it('should do nothing if cell is not found', () => {
      const address: CellAddress = { rowNumber: 5, colNumber: 5 };
      expect(() => table.removeCell('cell-999', address)).not.toThrow();
      expect(table.cells[0].length).toBe(2);
    });
  });

  describe('updateCell', () => {
    beforeEach(() => {
      const cell = new Cell('cell-1', 'theader');
      cell.rawValue = 'original';
      table.cells = [[cell]];
    });

    it('should update cell properties via payload', () => {
      table.updateCell('cell-1', { rawValue: 'updated' });
      const cell = table.cells[0][0];
      expect(cell.rawValue).toBe('updated');
    });

    it('should not throw if cell is not found', () => {
      expect(() => table.updateCell('cell-999', { rawValue: 'test' })).not.toThrow();
    });

    it('should update multiple properties', () => {
      table.updateCell('cell-1', {
        rawValue: 'new value',
        computedValue: 'computed',
        parent: 'parent-10',
      });
      const cell = table.cells[0][0];
      expect(cell.rawValue).toBe('new value');
      expect(cell.computedValue).toBe('computed');
      expect(cell.parent).toBe('parent-10');
    });
  });

  describe('shiftCell', () => {
    beforeEach(() => {
      const cell1 = new Cell('cell-1', 'theader');
      const cell2 = new Cell('cell-2', 'lheader');
      const cell3 = new Cell('cell-3', 'footer');
      table.cells = [
        [cell1, cell2],
        [cell3],
      ];
    });

    it('should move cell to new address by ID', () => {
      const currentAddress: CellAddress = { rowNumber: 0, colNumber: 0 };
      const newAddress: CellAddress = { rowNumber: 1, colNumber: 0 };
      table.shiftCell(newAddress, 'cell-1', currentAddress);

      expect(table.cells[0].length).toBe(1);
      expect(table.cells[1].length).toBe(2);
      expect(table.cells[1][0].cellID).toBe('cell-1');
    });

    it('should move cell to new address by address', () => {
      const currentAddress: CellAddress = { rowNumber: 0, colNumber: 1 };
      const newAddress: CellAddress = { rowNumber: 1, colNumber: 1 };
      table.shiftCell(newAddress, undefined, currentAddress);

      expect(table.cells[0].length).toBe(1);
      expect(table.cells[1][1].cellID).toBe('cell-2');
    });

    it('should update parent when shifting with new parent', () => {
      const parentCell = new Cell('parent-100', 'theader');
      table.cells[0][0] = parentCell;

      const currentAddress: CellAddress = { rowNumber: 0, colNumber: 1 };
      const newAddress: CellAddress = { rowNumber: 1, colNumber: 0 };
      table.shiftCell(newAddress, 'cell-2', currentAddress, 'parent-100');

      expect(table.cells[1][0].parent).toBe('parent-100');
    });

    it('should create new row if destination row does not exist', () => {
      const currentAddress: CellAddress = { rowNumber: 0, colNumber: 0 };
      const newAddress: CellAddress = { rowNumber: 5, colNumber: 0 };
      table.shiftCell(newAddress, 'cell-1', currentAddress);

      expect(table.cells[5]).toBeDefined();
      expect(table.cells[5][0].cellID).toBe('cell-1');
    });

    it('should not throw if cell is not found', () => {
      const currentAddress: CellAddress = { rowNumber: 5, colNumber: 5 };
      const newAddress: CellAddress = { rowNumber: 1, colNumber: 1 };
      expect(() => table.shiftCell(newAddress, 'cell-999', currentAddress)).not.toThrow();
    });

    it('should inherit parent region when shifting with new parent', () => {
      const parentCell = new Cell('parent-100', 'lheader');
      const childCell = new Cell('cell-2', 'body');
      table.cells = [[parentCell], [childCell]];

      const currentAddress: CellAddress = { rowNumber: 1, colNumber: 0 };
      const newAddress: CellAddress = { rowNumber: 0, colNumber: 1 };
      table.shiftCell(newAddress, 'cell-2', currentAddress, 'parent-100');

      // Child should inherit parent's region
      expect(table.cells[0][1].inRegion).toBe('lheader');
    });

    it('should update region index when shifting cell to new parent with different region', () => {
      const parentCell = new Cell('parent-100', 'rheader');
      const childCell = new Cell('cell-2', 'footer');
      table.cells = [[parentCell], [childCell]];

      const currentAddress: CellAddress = { rowNumber: 1, colNumber: 0 };
      const newAddress: CellAddress = { rowNumber: 0, colNumber: 1 };
      table.shiftCell(newAddress, 'cell-2', currentAddress, 'parent-100');

      // Region index should be updated
      expect(table.regionIndex.get('footer')?.hasCellID('cell-2')).toBe(false);
      expect(table.regionIndex.get('rheader')?.hasCellID('cell-2')).toBe(true);
    });

    it('should change region when newRegion parameter is provided (no parent)', () => {
      const cell = new Cell('cell-1', 'body');
      table.cells = [[cell]];

      const currentAddress: CellAddress = { rowNumber: 0, colNumber: 0 };
      const newAddress: CellAddress = { rowNumber: 1, colNumber: 0 };
      table.shiftCell(newAddress, 'cell-1', currentAddress, undefined, 'theader');

      // Cell should have new region
      expect(table.cells[1][0].inRegion).toBe('theader');
      expect(table.regionIndex.get('body')?.hasCellID('cell-1')).toBe(false);
      expect(table.regionIndex.get('theader')?.hasCellID('cell-1')).toBe(true);
    });

    it('should prefer parent region over newRegion parameter', () => {
      const parentCell = new Cell('parent-100', 'lheader');
      const cell = new Cell('cell-2', 'body');
      table.cells = [[parentCell], [cell]];

      const currentAddress: CellAddress = { rowNumber: 1, colNumber: 0 };
      const newAddress: CellAddress = { rowNumber: 0, colNumber: 1 };
      // Provide both parent and newRegion - parent should win
      table.shiftCell(newAddress, 'cell-2', currentAddress, 'parent-100', 'footer');

      // Cell should inherit parent's region, not the explicitly provided newRegion
      expect(table.cells[0][1].inRegion).toBe('lheader');
      expect(table.cells[0][1].parent).toBe('parent-100');
      expect(table.regionIndex.get('lheader')?.hasCellID('cell-2')).toBe(true);
      expect(table.regionIndex.get('footer')?.hasCellID('cell-2')).toBe(false);
    });
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
      const parent1 = new Cell('parent1', 'theader', ['leaf1', 'leaf2']); // Parent with 2 children
      const parent2 = new Cell('parent2', 'theader', ['leaf3']); // Parent with 1 child

      // Row 1: Leaf headers (actual columns, no children)
      const leaf1 = new Cell('leaf1', 'theader'); // No children = leaf node
      const leaf2 = new Cell('leaf2', 'theader'); // No children = leaf node
      const leaf3 = new Cell('leaf3', 'theader'); // No children = leaf node

      table.cells = [
        [parent1, parent2],
        [leaf1, leaf2, leaf3],
      ];

      // Only count leaf theader cells in the last theader row (3 leaves)
      expect(table.getColumnsCount()).toBe(3);
    });

    it('should count leaf theader cells (ignore parent theader cells with children)', () => {
      // Parent with children (not a leaf)
      const parent = new Cell('parent', 'theader', ['child1', 'child2']);
      // Leaf cells (no children)
      const child1 = new Cell('child1', 'theader');
      const child2 = new Cell('child2', 'theader');
      const leaf3 = new Cell('leaf3', 'theader'); // Standalone leaf

      table.cells = [[parent, child1, child2, leaf3]];

      // Count only cells without children: child1, child2, leaf3 = 3 columns
      expect(table.getColumnsCount()).toBe(3);
    });

    it('should handle mixed regions with parent-child theader relationships', () => {
      const lh = new Cell('lh', 'lheader');
      const parent = new Cell('h-parent', 'theader', ['h-leaf1', 'h-leaf2']);
      const h1 = new Cell('h-leaf1', 'theader');
      const h2 = new Cell('h-leaf2', 'theader');
      const b = new Cell('b', 'body');

      table.cells = [[lh, parent, h1, h2, b]];

      // Count only theader leaf cells: h1, h2 = 2 columns
      expect(table.getColumnsCount()).toBe(2);
    });

    it('should count leaf theader cells when theader is not in first row', () => {
      const lh = new Cell('lh', 'lheader');
      const parent = new Cell('h-parent', 'theader', ['h-leaf1', 'h-leaf2']);
      const h1 = new Cell('h-leaf1', 'theader');
      const h2 = new Cell('h-leaf2', 'theader');

      table.cells = [
        [lh],
        [parent, h1, h2],
      ];

      // Count leaf theader cells: h1, h2 = 2 columns
      expect(table.getColumnsCount()).toBe(2);
    });

    it('should handle deep hierarchical theader with multiple parent levels', () => {
      // Row 0: Top-level parent
      const root = new Cell('root', 'theader', ['group1', 'group2']);

      // Row 1: Mid-level parents
      const group1 = new Cell('group1', 'theader', ['leaf1', 'leaf2']);
      const group2 = new Cell('group2', 'theader', ['leaf3', 'leaf4', 'leaf5']);

      // Row 2: Leaf headers (no children)
      const leaf1 = new Cell('leaf1', 'theader');
      const leaf2 = new Cell('leaf2', 'theader');
      const leaf3 = new Cell('leaf3', 'theader');
      const leaf4 = new Cell('leaf4', 'theader');
      const leaf5 = new Cell('leaf5', 'theader');

      table.cells = [
        [root],
        [group1, group2],
        [leaf1, leaf2, leaf3, leaf4, leaf5],
      ];

      // Count from last theader row: only leaf cells with no children = 5 columns
      expect(table.getColumnsCount()).toBe(5);
    });

    it('should count correctly with footer after theader', () => {
      const parent = new Cell('h-parent', 'theader', ['h-leaf1', 'h-leaf2']);
      const h1 = new Cell('h-leaf1', 'theader');
      const h2 = new Cell('h-leaf2', 'theader');
      const f1 = new Cell('f1', 'footer');
      const f2 = new Cell('f2', 'footer');

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
      const parent = new Cell('h-parent', 'theader', ['h-leaf1']);
      const h1 = new Cell('h-leaf1', 'theader');

      table.cells = [
        [b1, b2],
        [parent, h1],
      ];

      // Count from the last theader row: only h1 (leaf cell) = 1 column
      expect(table.getColumnsCount()).toBe(1);
    });

    it('should return 0 when theader cells have children but no leaf nodes', () => {
      const parent1 = new Cell('parent1', 'theader', ['child1']);
      const parent2 = new Cell('parent2', 'theader', ['child2']);
      // Only parents, no actual leaf cells

      table.cells = [[parent1, parent2]];

      // Count leaf theader cells in last row: 0 (both have children)
      expect(table.getColumnsCount()).toBe(0);
    });
  });
});
