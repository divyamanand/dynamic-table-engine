import { Cell } from '../cell';
import { Style, Region } from '../types/index';

describe('Cell', () => {
  let cell: Cell;
  const cellID = 1;
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
      const customCell = new Cell(2, 'lheader', [1, 2], [3, 4], 'test value', style, 'computed', 0);
      expect(customCell.cellID).toBe(2);
      expect(customCell.children).toEqual([1, 2]);
      expect(customCell.merged).toEqual([3, 4]);
      expect(customCell.rawValue).toBe('test value');
      expect(customCell.style).toEqual(style);
      expect(customCell.computedValue).toBe('computed');
      expect(customCell.parent).toBe(0);
    });
  });

  describe('getAllMergedCell', () => {
    it('should return empty array when no cells are merged', () => {
      expect(cell.getAllMergedCell()).toEqual([]);
    });

    it('should return merged cell IDs', () => {
      cell.merged = [1, 2, 3];
      expect(cell.getAllMergedCell()).toEqual([1, 2, 3]);
    });
  });

  describe('getCellChildren', () => {
    it('should return empty array when no children exist', () => {
      expect(cell.getCellChildren()).toEqual([]);
    });

    it('should return children cell IDs', () => {
      cell.children = [10, 20, 30];
      expect(cell.getCellChildren()).toEqual([10, 20, 30]);
    });
  });

  describe('addCellChildren', () => {
    it('should add a child cell ID', () => {
      cell.addCellChildren(100);
      expect(cell.children).toContain(100);
    });

    it('should not add duplicate child IDs', () => {
      cell.addCellChildren(100);
      cell.addCellChildren(100);
      expect(cell.children.filter(id => id === 100).length).toBe(1);
    });

    it('should add multiple different children', () => {
      cell.addCellChildren(100);
      cell.addCellChildren(200);
      cell.addCellChildren(300);
      expect(cell.children).toEqual([100, 200, 300]);
    });
  });

  describe('mergeCell', () => {
    it('should add a merged cell ID', () => {
      cell.mergeCell(50);
      expect(cell.merged).toContain(50);
    });

    it('should not add duplicate merged IDs', () => {
      cell.mergeCell(50);
      cell.mergeCell(50);
      expect(cell.merged.filter(id => id === 50).length).toBe(1);
    });

    it('should add multiple different merged cells', () => {
      cell.mergeCell(50);
      cell.mergeCell(60);
      cell.mergeCell(70);
      expect(cell.merged).toEqual([50, 60, 70]);
    });
  });

  describe('unmergeCells', () => {
    it('should clear all merged cells', () => {
      cell.merged = [1, 2, 3, 4, 5];
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
    it('should return parent ID when parent is set', () => {
      cell.parent = 42;
      expect(cell.getParentOfCell()).toBe(42);
    });

    it('should return -1 when parent is undefined', () => {
      expect(cell.getParentOfCell()).toBe(-1);
    });

    it('should return -1 when parent is explicitly undefined', () => {
      cell.parent = undefined;
      expect(cell.getParentOfCell()).toBe(-1);
    });
  });

  describe('updateCell', () => {
    it('should update rawValue from payload', () => {
      cell.updateCell({ rawValue: 'new value' });
      expect(cell.rawValue).toBe('new value');
    });

    it('should update multiple fields from payload', () => {
      cell.updateCell({
        rawValue: 'updated',
        computedValue: 'computed',
        parent: 5,
      });
      expect(cell.rawValue).toBe('updated');
      expect(cell.computedValue).toBe('computed');
      expect(cell.parent).toBe(5);
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
      cell.updateCell({ children: [1, 2, 3], merged: [4, 5] });
      expect(cell.children).toEqual([1, 2, 3]);
      expect(cell.merged).toEqual([4, 5]);
    });
  });
});
