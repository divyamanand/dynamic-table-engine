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
      const cell = new Cell(1, 'theader');
      const cells = [[cell]];
      const customTable = new Table(cells);
      expect(customTable.cells).toEqual(cells);
    });
  });

  describe('findCell', () => {
    beforeEach(() => {
      const cell1 = new Cell(1, 'theader');
      const cell2 = new Cell(2, 'lheader');
      const cell3 = new Cell(3, 'footer');
      table.cells = [
        [cell1, cell2],
        [cell3],
      ];
    });

    it('should find cell by ID', () => {
      const result = table.findCell(1);
      expect(result).not.toBeNull();
      expect(result?.cell.cellID).toBe(1);
      expect(result?.row).toBe(0);
      expect(result?.col).toBe(0);
    });

    it('should return null when cell ID not found', () => {
      const result = table.findCell(999);
      expect(result).toBeNull();
    });

    it('should find cell by address', () => {
      const address: CellAddress = { rowNumber: 1, colNumber: 0 };
      const result = table.findCell(undefined, address);
      expect(result).not.toBeNull();
      expect(result?.cell.cellID).toBe(3);
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
      const parentCell = new Cell(100, 'theader');
      table.cells = [[parentCell]];

      const address: CellAddress = { rowNumber: 1, colNumber: 0 };
      table.addNewCell(address, 'footer', 100);

      const addedCell = table.cells[1][0];
      expect(addedCell.parent).toBe(100);
      expect(parentCell.children).toContain(addedCell.cellID);
    });

    it('should not add parent if parent cell does not exist', () => {
      const address: CellAddress = { rowNumber: 0, colNumber: 0 };
      table.addNewCell(address, 'theader', 999);
      const addedCell = table.cells[0][0];
      expect(addedCell.parent).toBeUndefined();
    });

    it('should insert cell at correct column position', () => {
      const cell1 = new Cell(1, 'theader');
      const cell2 = new Cell(2, 'theader');
      table.cells = [[cell1, cell2]];

      const address: CellAddress = { rowNumber: 0, colNumber: 1 };
      table.addNewCell(address, 'theader');

      expect(table.cells[0].length).toBe(3);
      expect(table.cells[0][0].cellID).toBe(1);
      expect(table.cells[0][2].cellID).toBe(2);
    });
  });

  describe('removeCell', () => {
    beforeEach(() => {
      const cell1 = new Cell(1, 'theader');
      const cell2 = new Cell(2, 'lheader');
      const cell3 = new Cell(3, 'footer');
      table.cells = [
        [cell1, cell2],
        [cell3],
      ];
    });

    it('should remove cell at specified address', () => {
      const address: CellAddress = { rowNumber: 0, colNumber: 0 };
      table.removeCell(1, address);
      expect(table.cells[0].length).toBe(1);
      expect(table.cells[0][0].cellID).toBe(2);
    });

    it('should not remove cell if cell ID does not match address', () => {
      const address: CellAddress = { rowNumber: 0, colNumber: 0 };
      table.removeCell(2, address);
      // Cell 1 should still be there since the cellID didn't match
      expect(table.cells[0][0].cellID).toBe(1);
    });

    it('should do nothing if cell is not found', () => {
      const address: CellAddress = { rowNumber: 5, colNumber: 5 };
      expect(() => table.removeCell(999, address)).not.toThrow();
      expect(table.cells[0].length).toBe(2);
    });
  });

  describe('updateCell', () => {
    beforeEach(() => {
      const cell = new Cell(1, 'theader');
      cell.rawValue = 'original';
      table.cells = [[cell]];
    });

    it('should update cell properties via payload', () => {
      table.updateCell(1, { rawValue: 'updated' });
      const cell = table.cells[0][0];
      expect(cell.rawValue).toBe('updated');
    });

    it('should not throw if cell is not found', () => {
      expect(() => table.updateCell(999, { rawValue: 'test' })).not.toThrow();
    });

    it('should update multiple properties', () => {
      table.updateCell(1, {
        rawValue: 'new value',
        computedValue: 'computed',
        parent: 10,
      });
      const cell = table.cells[0][0];
      expect(cell.rawValue).toBe('new value');
      expect(cell.computedValue).toBe('computed');
      expect(cell.parent).toBe(10);
    });
  });

  describe('shiftCell', () => {
    beforeEach(() => {
      const cell1 = new Cell(1, 'theader');
      const cell2 = new Cell(2, 'lheader');
      const cell3 = new Cell(3, 'footer');
      table.cells = [
        [cell1, cell2],
        [cell3],
      ];
    });

    it('should move cell to new address by ID', () => {
      const currentAddress: CellAddress = { rowNumber: 0, colNumber: 0 };
      const newAddress: CellAddress = { rowNumber: 1, colNumber: 0 };
      table.shiftCell(newAddress, 1, currentAddress);

      expect(table.cells[0].length).toBe(1);
      expect(table.cells[1].length).toBe(2);
      expect(table.cells[1][0].cellID).toBe(1);
    });

    it('should move cell to new address by address', () => {
      const currentAddress: CellAddress = { rowNumber: 0, colNumber: 1 };
      const newAddress: CellAddress = { rowNumber: 1, colNumber: 1 };
      table.shiftCell(newAddress, undefined, currentAddress);

      expect(table.cells[0].length).toBe(1);
      expect(table.cells[1][1].cellID).toBe(2);
    });

    it('should update parent when shifting with new parent', () => {
      const parentCell = new Cell(100, 'theader');
      table.cells[0][0] = parentCell;

      const currentAddress: CellAddress = { rowNumber: 0, colNumber: 1 };
      const newAddress: CellAddress = { rowNumber: 1, colNumber: 0 };
      table.shiftCell(newAddress, 2, currentAddress, 100);

      expect(table.cells[1][0].parent).toBe(100);
    });

    it('should create new row if destination row does not exist', () => {
      const currentAddress: CellAddress = { rowNumber: 0, colNumber: 0 };
      const newAddress: CellAddress = { rowNumber: 5, colNumber: 0 };
      table.shiftCell(newAddress, 1, currentAddress);

      expect(table.cells[5]).toBeDefined();
      expect(table.cells[5][0].cellID).toBe(1);
    });

    it('should not throw if cell is not found', () => {
      const currentAddress: CellAddress = { rowNumber: 5, colNumber: 5 };
      const newAddress: CellAddress = { rowNumber: 1, colNumber: 1 };
      expect(() => table.shiftCell(newAddress, 999, currentAddress)).not.toThrow();
    });

    it('should inherit parent region when shifting with new parent', () => {
      const parentCell = new Cell(100, 'lheader');
      const childCell = new Cell(2, 'body');
      table.cells = [[parentCell], [childCell]];

      const currentAddress: CellAddress = { rowNumber: 1, colNumber: 0 };
      const newAddress: CellAddress = { rowNumber: 0, colNumber: 1 };
      table.shiftCell(newAddress, 2, currentAddress, 100);

      // Child should inherit parent's region
      expect(table.cells[0][1].inRegion).toBe('lheader');
    });

    it('should update region index when shifting cell to new parent with different region', () => {
      const parentCell = new Cell(100, 'rheader');
      const childCell = new Cell(2, 'footer');
      table.cells = [[parentCell], [childCell]];

      const currentAddress: CellAddress = { rowNumber: 1, colNumber: 0 };
      const newAddress: CellAddress = { rowNumber: 0, colNumber: 1 };
      table.shiftCell(newAddress, 2, currentAddress, 100);

      // Region index should be updated
      expect(table.regionIndex.get('footer')?.has(2)).toBe(false);
      expect(table.regionIndex.get('rheader')?.has(2)).toBe(true);
    });
  });

  describe('getTotalCellCount', () => {
    it('should return 0 rows and empty columns array for empty table', () => {
      const result = table.getTotalCellCount();
      expect(result.rows).toBe(0);
      expect(result.columns).toEqual([]);
    });

    it('should return correct row and column counts', () => {
      const cell1 = new Cell(1, 'theader');
      const cell2 = new Cell(2, 'lheader');
      const cell3 = new Cell(3, 'footer');
      const cell4 = new Cell(4, 'footer');
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
      const cell1 = new Cell(1, 'theader');
      const cell2 = new Cell(2, 'lheader');
      const cell3 = new Cell(3, 'theader');
      const cell4 = new Cell(4, 'lheader');
      table.cells = [
        [cell1, cell2],
        [cell3, cell4],
      ];

      const result = table.getAllCellsOfRegion('theader');
      const flatResult = result.flat();
      expect(flatResult.map((c: Cell) => c.cellID).sort()).toEqual([1, 3]);
    });

    it('should return empty result if no cells in region', () => {
      const cell1 = new Cell(1, 'theader');
      table.cells = [[cell1]];

      const result = table.getAllCellsOfRegion('footer');
      const flatResult = result.flat();
      expect(flatResult.length).toBe(0);
    });
  });
});
