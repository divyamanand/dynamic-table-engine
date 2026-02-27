import { Cell } from '../../../core/cell';
import { Style, Region } from '../../../types/index';

/**
 * TABLE: Cell Tests
 *
 * | # | Test Name | Test Case | Expected Result |
 * |---|-----------|-----------|-----------------|
 * | CONSTRUCTOR |
 * | 1 | should initialize cellID | Create Cell('cell-1', 'theader') | cellID === 'cell-1' |
 * | 2 | should initialize inRegion | Create Cell with 'theader' region | inRegion === 'theader' |
 * | 3 | should initialize children as empty array by default | Default constructor | children === [] |
 * | 4 | should initialize rawValue as empty string by default | Default constructor | rawValue === '' |
 * | 5 | should accept custom values in constructor | Create Cell with custom params | All properties set correctly |
 * | GETCELLCHILDREN |
 * | 6 | should return empty array when no children exist | Call getCellChildren() | Returns [] |
 * | 7 | should return children cells | Call getCellChildren() with children=[...] | Returns all children with correct IDs |
 * | ADDCELLCHILDREN |
 * | 8 | should add a child cell | addCellChildren(child) | child in children array |
 * | 9 | should not add duplicate children | addCellChildren(same child twice) | children.length === 1 |
 * | 10 | should add multiple different children | addCellChildren(3 different children) | children.length === 3 |
 * | GETPARENTOFCELL |
 * | 11 | should return parent cell when parent is set | Set parent, call getParentOfCell() | Returns parent cell object |
 * | 12 | should return undefined when parent is not set | Call getParentOfCell() | Returns undefined |
 * | 13 | should return undefined when parent is explicitly undefined | Set parent=undefined | Returns undefined |
 * | UPDATECELL |
 * | 14 | should update rawValue from payload | updateCell({rawValue: 'new'}) | rawValue === 'new' |
 * | 15 | should update multiple fields from payload | updateCell with rawValue, computedValue, parent | All fields updated |
 * | 16 | should ignore undefined values in payload | updateCell({rawValue: undefined}) | rawValue unchanged |
 * | 17 | should update style from payload | updateCell({style: newStyle}) | style updated correctly |
 * | 18 | should update children array from payload | updateCell({children: [...]}) | children array updated |
 * | LAYOUT |
 * | 19 | should return undefined layout before _setLayout | Get layout getter | layout === undefined |
 * | 20 | should set layout via _setLayout | _setLayout({row: 0, col: 0, rowSpan: 1, colSpan: 1}) | layout set correctly |
 * | 21 | should have readonly row/col in layout | Set layout with row/col | Values are readonly |
 * | 22 | should have rowSpan/colSpan in layout | _setLayout with rowSpan/colSpan | Values set correctly |
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

    it('should initialize rawValue as empty string by default', () => {
      expect(cell.rawValue).toBe('');
    });

    it('should accept custom values in constructor', () => {
      const child1 = new Cell('child-1', 'theader');
      const child2 = new Cell('child-2', 'theader');
      const customCell = new Cell('cell-2', 'lheader', [child1, child2], 'test value', false, style, 'computed', undefined);
      expect(customCell.cellID).toBe('cell-2');
      expect(customCell.children.length).toBe(2);
      expect(customCell.children[0].cellID).toBe('child-1');
      expect(customCell.children[1].cellID).toBe('child-2');
      expect(customCell.rawValue).toBe('test value');
      expect(customCell.style).toEqual(style);
      expect(customCell.computedValue).toBe('computed');
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

    it('should update children array from payload', () => {
      const child1 = new Cell('child-1', 'theader');
      const child2 = new Cell('child-2', 'theader');
      const child3 = new Cell('child-3', 'theader');
      cell.updateCell({ children: [child1, child2, child3] });
      expect(cell.children.length).toBe(3);
      expect(cell.children[0].cellID).toBe('child-1');
      expect(cell.children[1].cellID).toBe('child-2');
      expect(cell.children[2].cellID).toBe('child-3');
    });
  });

  describe('layout', () => {
    it('should return undefined layout before _setLayout', () => {
      expect(cell.layout).toBeUndefined();
    });

    it('should set layout via _setLayout', () => {
      cell._setLayout({ row: 0, col: 0, rowSpan: 1, colSpan: 1 });
      expect(cell.layout).toEqual({ row: 0, col: 0, rowSpan: 1, colSpan: 1 });
    });

    it('should have readonly row/col in layout', () => {
      cell._setLayout({ row: 5, col: 10, rowSpan: 1, colSpan: 1 });
      expect(cell.layout?.row).toBe(5);
      expect(cell.layout?.col).toBe(10);
    });

    it('should have rowSpan/colSpan in layout', () => {
      cell._setLayout({ row: 0, col: 0, rowSpan: 2, colSpan: 3 });
      expect(cell.layout?.rowSpan).toBe(2);
      expect(cell.layout?.colSpan).toBe(3);
    });
  });
});
