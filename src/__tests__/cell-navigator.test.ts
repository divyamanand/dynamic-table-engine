import { Table } from '../table';
import { Cell } from '../cell';
import { CellAddress } from '../types/index';

/**
 * TABLE: CellNavigator Tests (findCell)
 *
 * | # | Test Name | Test Case | Expected Result |
 * |---|-----------|-----------|-----------------|
 * | 1 | should find cell by ID | Search for 'cell-1' in [[cell1, cell2], [cell3]] | Returns cell1 with row=0, col=0 |
 * | 2 | should return null when cell ID not found | Search for 'cell-999' | Returns null |
 * | 3 | should find cell by address | Search by address {row: 1, col: 0} | Returns cell3 |
 * | 4 | should return null when address is out of bounds | Search address {row: 5, col: 0} | Returns null |
 * | 5 | should return null when column is out of bounds | Search address {row: 0, col: 10} | Returns null |
 * | 6 | should return null when neither ID nor address is provided | Call findCell() with no params | Returns null |
 */

describe('CellNavigator (findCell)', () => {
  let table: Table;

  beforeEach(() => {
    const cell1 = new Cell('cell-1', 'theader');
    const cell2 = new Cell('cell-2', 'lheader');
    const cell3 = new Cell('cell-3', 'footer');
    table = new Table([
      [cell1, cell2],
      [cell3],
    ]);
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
