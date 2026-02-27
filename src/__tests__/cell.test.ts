import { Cell } from '../cell';
import { Style, Region } from '../types/index';

/**
 * TABLE: Cell Tests
 *
 * | # | Test Name | Test Case | Expected Result |
 * |---|-----------|-----------|-----------------|
 * | CONSTRUCTOR |
 * | 1 | should initialize cellID | Create Cell('cell-1', 'theader') | cellID === 'cell-1' |
 * | 2 | should initialize inRegion | Create Cell with 'theader' region | inRegion === 'theader' |
 * | 3 | should initialize children as empty array by default | Default constructor | children === [] |
 * | 4 | should initialize merged as empty array by default | Default constructor | merged === [] |
 * | 5 | should initialize rawValue as empty string by default | Default constructor | rawValue === '' |
 * | 6 | should accept custom values in constructor | Create Cell with custom params | All properties set correctly |
 * | GETALLMERGEDCELL |
 * | 7 | should return empty array when no cells are merged | Call getAllMergedCell() | Returns [] |
 * | 8 | should return merged cell IDs | Call getAllMergedCell() with merged=[...] | Returns merged array |
 * | GETCELLCHILDREN |
 * | 9 | should return empty array when no children exist | Call getCellChildren() | Returns [] |
 * | 10 | should return children cells | Call getCellChildren() with children=[...] | Returns all children with correct IDs |
 * | ADDCELLCHILDREN |
 * | 11 | should add a child cell | addCellChildren(child) | child in children array |
 * | 12 | should not add duplicate children | addCellChildren(same child twice) | children.length === 1 |
 * | 13 | should add multiple different children | addCellChildren(3 different children) | children.length === 3 |
 * | MERGECELL |
 * | 14 | should add a merged cell ID | mergeCell('merged-50') | merged contains 'merged-50' |
 * | 15 | should not add duplicate merged IDs | mergeCell(same ID twice) | Only one instance |
 * | 16 | should add multiple different merged cells | mergeCell(3 different IDs) | merged === [id1, id2, id3] |
 * | UNMERGECELLS |
 * | 17 | should clear all merged cells | unmergeCells() with merged=[...] | merged === [] |
 * | 18 | should handle unmergeCells when already empty | unmergeCells() when merged=[] | merged === [] |
 * | GETPARENTOFCELL |
 * | 19 | should return parent cell when parent is set | Set parent, call getParentOfCell() | Returns parent cell object |
 * | 20 | should return undefined when parent is not set | Call getParentOfCell() | Returns undefined |
 * | 21 | should return undefined when parent is explicitly undefined | Set parent=undefined | Returns undefined |
 * | UPDATECELL |
 * | 22 | should update rawValue from payload | updateCell({rawValue: 'new'}) | rawValue === 'new' |
 * | 23 | should update multiple fields from payload | updateCell with rawValue, computedValue, parent | All fields updated |
 * | 24 | should ignore undefined values in payload | updateCell({rawValue: undefined}) | rawValue unchanged |
 * | 25 | should update style from payload | updateCell({style: newStyle}) | style updated correctly |
 * | 26 | should update arrays from payload | updateCell({children: [...], merged: [...]}) | Arrays updated correctly |
 */

describe('Cell', () => {
  let cell: Cell;
  const cellID = 'cell-1';
  const region: Region = 'theader';
  const style: Style = { font: 'Arial', fontSize: '12px' };

  beforeEach(() => {
    cell = new Cell(cellID, region);
  });

  describe('constructor', () => {
    it('should initialize cellID', () => {
      expect(cell.cellID).toBe(cellID);
    });

    it('should initialize inRegion', () => {
      expect(cell.inRegion).toBe(region);
    });

    it('should initialize children as empty array by default', () => {
      expect(cell.children).toEqual([]);
    });

    it('should initialize merged as empty array by default', () => {
      expect(cell.merged).toEqual([]);
    });

    it('should initialize rawValue as empty string by default', () => {
      expect(cell.rawValue).toBe('');
    });

    it('should accept custom values in constructor', () => {
      const child1 = new Cell('child-1', 'theader');
      const child2 = new Cell('child-2', 'theader');
      const customCell = new Cell('cell-2', 'lheader', [child1, child2], ['merged-1', 'merged-2'], 'test value', style, 'computed', cell);
      expect(customCell.cellID).toBe('cell-2');
      expect(customCell.children.length).toBe(2);
      expect(customCell.children[0].cellID).toBe('child-1');
      expect(customCell.children[1].cellID).toBe('child-2');
      expect(customCell.merged).toEqual(['merged-1', 'merged-2']);
      expect(customCell.rawValue).toBe('test value');
      expect(customCell.style).toEqual(style);
      expect(customCell.computedValue).toBe('computed');
      expect(customCell.parent).toBe(cell);
    });
  });

  describe('getAllMergedCell', () => {
    it('should return empty array when no cells are merged', () => {
      expect(cell.getAllMergedCell()).toEqual([]);
    });

    it('should return merged cell IDs', () => {
      cell.merged = ['merged-1', 'merged-2', 'merged-3'];
      expect(cell.getAllMergedCell()).toEqual(['merged-1', 'merged-2', 'merged-3']);
    });
  });

  describe('getCellChildren', () => {
    it('should return empty array when no children exist', () => {
      expect(cell.getCellChildren()).toEqual([]);
    });

    it('should return children cells', () => {
      const child1 = new Cell('child-10', 'theader');
      const child2 = new Cell('child-20', 'theader');
      const child3 = new Cell('child-30', 'theader');
      cell.children = [child1, child2, child3];
      const children = cell.getCellChildren();
      expect(children.length).toBe(3);
      expect(children[0].cellID).toBe('child-10');
      expect(children[1].cellID).toBe('child-20');
      expect(children[2].cellID).toBe('child-30');
    });
  });

  describe('addCellChildren', () => {
    it('should add a child cell', () => {
      const child = new Cell('child-100', 'theader');
      cell.addCellChildren(child);
      expect(cell.children).toContain(child);
    });

    it('should not add duplicate children', () => {
      const child = new Cell('child-100', 'theader');
      cell.addCellChildren(child);
      cell.addCellChildren(child);
      expect(cell.children.length).toBe(1);
    });

    it('should add multiple different children', () => {
      const child1 = new Cell('child-100', 'theader');
      const child2 = new Cell('child-200', 'theader');
      const child3 = new Cell('child-300', 'theader');
      cell.addCellChildren(child1);
      cell.addCellChildren(child2);
      cell.addCellChildren(child3);
      expect(cell.children.length).toBe(3);
      expect(cell.children[0].cellID).toBe('child-100');
      expect(cell.children[1].cellID).toBe('child-200');
      expect(cell.children[2].cellID).toBe('child-300');
    });
  });

  describe('mergeCell', () => {
    it('should add a merged cell ID', () => {
      cell.mergeCell('merged-50');
      expect(cell.merged).toContain('merged-50');
    });

    it('should not add duplicate merged IDs', () => {
      cell.mergeCell('merged-50');
      cell.mergeCell('merged-50');
      expect(cell.merged.filter(id => id === 'merged-50').length).toBe(1);
    });

    it('should add multiple different merged cells', () => {
      cell.mergeCell('merged-50');
      cell.mergeCell('merged-60');
      cell.mergeCell('merged-70');
      expect(cell.merged).toEqual(['merged-50', 'merged-60', 'merged-70']);
    });
  });

  describe('unmergeCells', () => {
    it('should clear all merged cells', () => {
      cell.merged = ['merged-1', 'merged-2', 'merged-3', 'merged-4', 'merged-5'];
      cell.unmergeCells();
      expect(cell.merged).toEqual([]);
    });

    it('should handle unmergeCells when already empty', () => {
      expect(cell.merged).toEqual([]);
      cell.unmergeCells();
      expect(cell.merged).toEqual([]);
    });
  });

  describe('getParentOfCell', () => {
    it('should return parent cell when parent is set', () => {
      const parent = new Cell('parent-42', 'theader');
      cell.parent = parent;
      expect(cell.getParentOfCell()).toBe(parent);
    });

    it('should return undefined when parent is not set', () => {
      expect(cell.getParentOfCell()).toBeUndefined();
    });

    it('should return undefined when parent is explicitly undefined', () => {
      cell.parent = undefined;
      expect(cell.getParentOfCell()).toBeUndefined();
    });
  });

  describe('updateCell', () => {
    it('should update rawValue from payload', () => {
      cell.updateCell({ rawValue: 'new value' });
      expect(cell.rawValue).toBe('new value');
    });

    it('should update multiple fields from payload', () => {
      const parentCell = new Cell('parent-5', 'theader');
      cell.updateCell({
        rawValue: 'updated',
        computedValue: 'computed',
        parent: parentCell,
      });
      expect(cell.rawValue).toBe('updated');
      expect(cell.computedValue).toBe('computed');
      expect(cell.parent).toBe(parentCell);
    });

    it('should ignore undefined values in payload', () => {
      cell.rawValue = 'original';
      cell.updateCell({ rawValue: undefined });
      expect(cell.rawValue).toBe('original');
    });

    it('should update style from payload', () => {
      const newStyle: Style = { font: 'Times', fontSize: '14px' };
      cell.updateCell({ style: newStyle });
      expect(cell.style).toEqual(newStyle);
    });

    it('should update arrays from payload', () => {
      const child1 = new Cell('child-1', 'theader');
      const child2 = new Cell('child-2', 'theader');
      const child3 = new Cell('child-3', 'theader');
      cell.updateCell({ children: [child1, child2, child3], merged: ['merged-4', 'merged-5'] });
      expect(cell.children.length).toBe(3);
      expect(cell.children[0].cellID).toBe('child-1');
      expect(cell.children[1].cellID).toBe('child-2');
      expect(cell.children[2].cellID).toBe('child-3');
      expect(cell.merged).toEqual(['merged-4', 'merged-5']);
    });
  });
});
