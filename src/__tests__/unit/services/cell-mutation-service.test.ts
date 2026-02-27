import { Table } from '../../../core/table';
import { Cell } from '../../../core/cell';
import { CellAddress } from '../../../types/index';

/**
 * TABLE: CellMutationService Tests
 *
 * | # | Test Name | Test Case | Expected Result |
 * |---|-----------|-----------|-----------------|
 * | ADDNEWCELL |
 * | 1 | should add a new cell at specified address | Add cell at {row: 0, col: 0} | Cell exists at [0][0] with correct region |
 * | 2 | should create new row if it does not exist | Add cell at {row: 5, col: 0} | Row 5 created, cell added at [5][0] |
 * | 3 | should add cell with parent relationship | Add cell with parent 'parent-100' | Cell.parent === parentCell, parentCell.children contains cell |
 * | 4 | should not add parent if parent cell does not exist | Add cell with parent 'parent-999' | Cell.parent is undefined |
 * | 5 | should insert cell at correct column position | Add cell at {row: 0, col: 1} in [[cell1, cell2]] | cell1 at [0][0], new cell at [0][1], cell2 at [0][2] |
 * | REMOVECELL |
 * | 6 | should remove cell at specified address | Remove 'cell-1' from {row: 0, col: 0} | [0] length becomes 1, cell-2 remains |
 * | 7 | should not remove cell if cell ID does not match address | Try remove 'cell-2' from {row: 0, col: 0} | cell-1 still at [0][0] |
 * | 8 | should do nothing if cell is not found | Remove 'cell-999' from {row: 5, col: 5} | No error thrown, cells unchanged |
 * | UPDATECELL |
 * | 9 | should update cell properties via payload | Update 'cell-1' with {rawValue: 'updated'} | cell.rawValue === 'updated' |
 * | 10 | should not throw if cell is not found | Update 'cell-999' with payload | No error thrown |
 * | 11 | should update multiple properties | Update with {rawValue: 'new', computedValue: 'computed'} | Both properties updated |
 * | SHIFTCELL |
 * | 12 | should move cell to new address by ID | Shift 'cell-1' from {0,0} to {1,0} | [0] length 1, [1] length 2, cell-1 at [1][0] |
 * | 13 | should move cell to new address by address | Shift by address from {0,1} to {1,1} | cell-2 moves to [1][1] |
 * | 14 | should update parent when shifting with new parent | Shift 'cell-2' with parent 'parent-100' | Shifted cell.parent === parentCell |
 * | 15 | should create new row if destination row does not exist | Shift 'cell-1' from {0,0} to {5,0} | [5] created, cell-1 at [5][0] |
 * | 16 | should not throw if cell is not found | Shift 'cell-999' with any address | No error thrown |
 * | 17 | should inherit parent region when shifting with new parent | Shift cell with parent in different region | Cell inherits parent's region |
 * | 18 | should update region index when shifting to new parent with different region | Shift cell between parent in different regions | Region index updated, cell removed from old region |
 * | 19 | should change region when newRegion parameter is provided (no parent) | Shift with newRegion 'theader', no parent | Cell.inRegion === 'theader' |
 * | 20 | should prefer parent region over newRegion parameter | Shift with both parent (lheader) and newRegion (footer) | Cell inherits parent region (lheader) |
 */

describe('CellMutationService', () => {
  let table: Table;

  describe('addNewCell', () => {
    beforeEach(() => {
      table = new Table([]);
    });

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
      expect(addedCell.parent).toBe(parentCell);
      expect(parentCell.children).toContain(addedCell);
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
      table = new Table([[cell1, cell2]]);

      // Add cell at column 2 (after cell1 and cell2)
      const address: CellAddress = { rowNumber: 0, colNumber: 2 };
      table.addNewCell(address, 'theader');

      expect(table.cells[0].length).toBe(3);
      expect(table.cells[0][0].cellID).toBe('cell-1');
      expect(table.cells[0][1].cellID).toBe('cell-2');
      expect(table.cells[0].length).toBe(3);
    });
  });

  describe('removeCell', () => {
    beforeEach(() => {
      const cell1 = new Cell('cell-1', 'theader');
      const cell2 = new Cell('cell-2', 'lheader');
      const cell3 = new Cell('cell-3', 'footer');
      table = new Table([
        [cell1, cell2],
        [cell3],
      ]);
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
      table = new Table([[cell]]);
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
      });
      const cell = table.cells[0][0];
      expect(cell.rawValue).toBe('new value');
      expect(cell.computedValue).toBe('computed');
    });
  });

  describe('shiftCell', () => {
    beforeEach(() => {
      const cell1 = new Cell('cell-1', 'theader');
      const cell2 = new Cell('cell-2', 'lheader');
      const cell3 = new Cell('cell-3', 'footer');
      table = new Table([
        [cell1, cell2],
        [cell3],
      ]);
    });

    it('should move cell to new address by ID', () => {
      const currentAddress: CellAddress = { rowNumber: 0, colNumber: 0 };
      const newAddress: CellAddress = { rowNumber: 1, colNumber: 1 };
      table.shiftCell(newAddress, 'cell-1', currentAddress);

      expect(table.cells[0].length).toBe(1);
      expect(table.cells[1].length).toBe(2);
      expect(table.cells[1][1].cellID).toBe('cell-1');
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
      const cell2 = new Cell('cell-2', 'lheader');
      table = new Table([[parentCell, cell2]]);

      const currentAddress: CellAddress = { rowNumber: 0, colNumber: 1 };
      const newAddress: CellAddress = { rowNumber: 1, colNumber: 0 };
      table.shiftCell(newAddress, 'cell-2', currentAddress, 'parent-100');

      expect(table.cells[1][0].parent).toBe(parentCell);
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
      expect(table.cells[0][1].parent).toBe(parentCell);
      expect(table.regionIndex.get('lheader')?.hasCellID('cell-2')).toBe(true);
      expect(table.regionIndex.get('footer')?.hasCellID('cell-2')).toBe(false);
    });
  });
});
