import { Cell } from '../cell';
import { Style, Region } from '../types/index';

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
      const customCell = new Cell('cell-2', 'lheader', ['child-1', 'child-2'], ['merged-1', 'merged-2'], 'test value', style, 'computed', 'parent-1');
      expect(customCell.cellID).toBe('cell-2');
      expect(customCell.children).toEqual(['child-1', 'child-2']);
      expect(customCell.merged).toEqual(['merged-1', 'merged-2']);
      expect(customCell.rawValue).toBe('test value');
      expect(customCell.style).toEqual(style);
      expect(customCell.computedValue).toBe('computed');
      expect(customCell.parent).toBe('parent-1');
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

    it('should return children cell IDs', () => {
      cell.children = ['child-10', 'child-20', 'child-30'];
      expect(cell.getCellChildren()).toEqual(['child-10', 'child-20', 'child-30']);
    });
  });

  describe('addCellChildren', () => {
    it('should add a child cell ID', () => {
      cell.addCellChildren('child-100');
      expect(cell.children).toContain('child-100');
    });

    it('should not add duplicate child IDs', () => {
      cell.addCellChildren('child-100');
      cell.addCellChildren('child-100');
      expect(cell.children.filter(id => id === 'child-100').length).toBe(1);
    });

    it('should add multiple different children', () => {
      cell.addCellChildren('child-100');
      cell.addCellChildren('child-200');
      cell.addCellChildren('child-300');
      expect(cell.children).toEqual(['child-100', 'child-200', 'child-300']);
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
    it('should return parent ID when parent is set', () => {
      cell.parent = 'parent-42';
      expect(cell.getParentOfCell()).toBe('parent-42');
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
        parent: 'parent-5',
      });
      expect(cell.rawValue).toBe('updated');
      expect(cell.computedValue).toBe('computed');
      expect(cell.parent).toBe('parent-5');
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
      cell.updateCell({ children: ['child-1', 'child-2', 'child-3'], merged: ['merged-4', 'merged-5'] });
      expect(cell.children).toEqual(['child-1', 'child-2', 'child-3']);
      expect(cell.merged).toEqual(['merged-4', 'merged-5']);
    });
  });
});
