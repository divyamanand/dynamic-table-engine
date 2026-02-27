import { Table } from '../table';
import { Cell } from '../cell';

/**
 * TABLE: Constructor Tests
 *
 * | # | Test Name | Test Case | Expected Result |
 * |---|-----------|-----------|-----------------|
 * | 1 | should initialize with empty cells array | Create Table with [] | table.cells equals [] |
 * | 2 | should initialize with provided cells array | Create Table with [[cell]] | table.cells equals provided cells |
 */

describe('Table Constructor', () => {
  it('should initialize with empty cells array', () => {
    const table = new Table([]);
    expect(table.cells).toEqual([]);
  });

  it('should initialize with provided cells array', () => {
    const cell = new Cell('cell-1', 'theader');
    const cells = [[cell]];
    const customTable = new Table(cells);
    expect(customTable.cells).toEqual(cells);
  });
});
