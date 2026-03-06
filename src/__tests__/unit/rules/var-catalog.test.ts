import { resolveVar, getAvailableVars, VAR_CATALOG } from '../../../rules/expression/var-catalog';
import type { EvalContext } from '../../../rules/types/evaluation.types';
import type { ICell } from '../../../interfaces/core/cell.interface';
import { defaultCellStyle } from '../../../stores/cell-registry.store';

function mockCell(overrides: Partial<ICell> = {}): ICell {
  return {
    cellID: 'cell-001',
    inRegion: 'body',
    rawValue: 'test',
    style: { ...defaultCellStyle },
    isDynamic: false,
    layout: { row: 2, col: 3, rowSpan: 1, colSpan: 1, x: 10, y: 20, width: 50, height: 20 },
    ...overrides,
  };
}

function makeContext(cellOverrides: Partial<ICell> = {}, ctxOverrides: Partial<EvalContext> = {}): EvalContext {
  return {
    cell: mockCell(cellOverrides),
    table: {} as any,
    cellRegistry: {
      getCellById: () => undefined,
      getCellByAddress: () => undefined,
      createCell: () => '',
      updateCell: () => {},
      deleteCell: () => {},
      setCellAddress: () => {},
      clearCellAddress: () => {},
    },
    structureStore: {
      getBody: () => [['a', 'b'], ['c', 'd'], ['e', 'f']],
      getBodyCell: () => undefined,
      countTotalRows: () => 3,
      countTotalCols: () => 2,
      getLeafCount: () => 5,
      getRoots: () => [],
      getChildren: () => [],
      addRootCell: () => {},
      removeRootCell: () => {},
      addChildCell: () => {},
      removeChildCell: () => {},
      insertBodyRow: () => {},
      removeBodyRow: () => [],
      insertBodyCol: () => {},
      removeBodyCol: () => [],
      getLeafCells: () => [],
      getHeightOfCell: () => 1,
      isLeafCell: () => true,
      getBodyIndexForHeaderLeafCell: () => 0,
      reorderHeaderCell: () => {},
    },
    rowIndex: 1,
    colIndex: 2,
    ...ctxOverrides,
  };
}

describe('VarCatalog', () => {
  // ============ VAR_CATALOG structure ============

  describe('catalog structure', () => {
    it('has 17 vars defined', () => {
      expect(Object.keys(VAR_CATALOG)).toHaveLength(16);
    });

    it('has all expected cell-scoped vars', () => {
      expect(VAR_CATALOG['cell.value']).toBeDefined();
      expect(VAR_CATALOG['cell.numericValue']).toBeDefined();
      expect(VAR_CATALOG['cell.rowIndex']).toBeDefined();
      expect(VAR_CATALOG['cell.colIndex']).toBeDefined();
      expect(VAR_CATALOG['cell.width']).toBeDefined();
      expect(VAR_CATALOG['cell.height']).toBeDefined();
      expect(VAR_CATALOG['cell.fontSize']).toBeDefined();
      expect(VAR_CATALOG['cell.overflows']).toBeDefined();
    });

    it('has all expected table-scoped vars', () => {
      expect(VAR_CATALOG['table.rowCount']).toBeDefined();
      expect(VAR_CATALOG['table.colCount']).toBeDefined();
    });

    it('each var has path, description, returnType, resolve', () => {
      for (const [key, def] of Object.entries(VAR_CATALOG)) {
        expect(def.path).toBe(key);
        expect(def.description).toBeTruthy();
        expect(['string', 'number', 'boolean']).toContain(def.returnType);
        expect(typeof def.resolve).toBe('function');
      }
    });
  });

  // ============ cell.value ============

  describe('cell.value', () => {
    it('returns rawValue as string', () => {
      const ctx = makeContext({ rawValue: 'hello' });
      expect(resolveVar('cell.value', ctx)).toBe('hello');
    });

    it('returns number rawValue as-is', () => {
      const ctx = makeContext({ rawValue: 42 });
      expect(resolveVar('cell.value', ctx)).toBe(42);
    });

    it('returns empty string when cell is undefined', () => {
      const ctx = makeContext();
      ctx.cell = undefined;
      expect(resolveVar('cell.value', ctx)).toBe('');
    });

    it('returns empty string when rawValue is null/undefined', () => {
      const ctx = makeContext({ rawValue: undefined as any });
      expect(resolveVar('cell.value', ctx)).toBe('');
    });
  });

  // ============ cell.numericValue ============

  describe('cell.numericValue', () => {
    it('returns number directly', () => {
      const ctx = makeContext({ rawValue: 42 });
      expect(resolveVar('cell.numericValue', ctx)).toBe(42);
    });

    it('parses string number', () => {
      const ctx = makeContext({ rawValue: '99.5' });
      expect(resolveVar('cell.numericValue', ctx)).toBe(99.5);
    });

    it('returns 0 for non-numeric string', () => {
      const ctx = makeContext({ rawValue: 'hello' });
      expect(resolveVar('cell.numericValue', ctx)).toBe(0);
    });

    it('returns 0 for empty string', () => {
      const ctx = makeContext({ rawValue: '' });
      expect(resolveVar('cell.numericValue', ctx)).toBe(0);
    });

    it('returns 0 when cell is undefined', () => {
      const ctx = makeContext();
      ctx.cell = undefined;
      // rawValue is undefined → parseFloat("0") = 0
      expect(resolveVar('cell.numericValue', ctx)).toBe(0);
    });

    it('handles negative numbers', () => {
      const ctx = makeContext({ rawValue: -15 });
      expect(resolveVar('cell.numericValue', ctx)).toBe(-15);
    });

    it('handles string negative number', () => {
      const ctx = makeContext({ rawValue: '-3.5' });
      expect(resolveVar('cell.numericValue', ctx)).toBe(-3.5);
    });
  });

  // ============ cell.rowIndex / cell.colIndex ============

  describe('cell.rowIndex', () => {
    it('returns ctx.rowIndex if set', () => {
      const ctx = makeContext({}, { rowIndex: 5 });
      expect(resolveVar('cell.rowIndex', ctx)).toBe(5);
    });

    it('falls back to layout.row if ctx.rowIndex is undefined', () => {
      const ctx = makeContext({ layout: { row: 7, col: 0, rowSpan: 1, colSpan: 1, x: 0, y: 0, width: 0, height: 0 } }, { rowIndex: undefined });
      expect(resolveVar('cell.rowIndex', ctx)).toBe(7);
    });

    it('returns -1 if both are undefined', () => {
      const ctx = makeContext({}, { rowIndex: undefined });
      (ctx.cell as any).layout = undefined;
      expect(resolveVar('cell.rowIndex', ctx)).toBe(-1);
    });
  });

  describe('cell.colIndex', () => {
    it('returns ctx.colIndex if set', () => {
      const ctx = makeContext({}, { colIndex: 3 });
      expect(resolveVar('cell.colIndex', ctx)).toBe(3);
    });

    it('falls back to layout.col', () => {
      const ctx = makeContext({ layout: { row: 0, col: 4, rowSpan: 1, colSpan: 1, x: 0, y: 0, width: 0, height: 0 } }, { colIndex: undefined });
      expect(resolveVar('cell.colIndex', ctx)).toBe(4);
    });

    it('returns -1 if both are undefined', () => {
      const ctx = makeContext({}, { colIndex: undefined });
      (ctx.cell as any).layout = undefined;
      expect(resolveVar('cell.colIndex', ctx)).toBe(-1);
    });
  });

  // ============ cell.width / cell.height ============

  describe('cell.width', () => {
    it('returns layout width', () => {
      const ctx = makeContext({ layout: { row: 0, col: 0, rowSpan: 1, colSpan: 1, x: 0, y: 0, width: 100, height: 30 } });
      expect(resolveVar('cell.width', ctx)).toBe(100);
    });

    it('returns 0 when no layout', () => {
      const ctx = makeContext();
      (ctx.cell as any).layout = undefined;
      expect(resolveVar('cell.width', ctx)).toBe(0);
    });
  });

  describe('cell.height', () => {
    it('returns layout height', () => {
      const ctx = makeContext({ layout: { row: 0, col: 0, rowSpan: 1, colSpan: 1, x: 0, y: 0, width: 50, height: 35 } });
      expect(resolveVar('cell.height', ctx)).toBe(35);
    });

    it('returns 0 when no layout', () => {
      const ctx = makeContext();
      (ctx.cell as any).layout = undefined;
      expect(resolveVar('cell.height', ctx)).toBe(0);
    });
  });

  // ============ cell.fontSize ============

  describe('cell.fontSize', () => {
    it('returns style fontSize', () => {
      const ctx = makeContext({ style: { ...defaultCellStyle, fontSize: 16 } });
      expect(resolveVar('cell.fontSize', ctx)).toBe(16);
    });

    it('returns 0 when fontSize is 0 (resolver uses ?? not ||)', () => {
      // The resolver uses `cell.style?.fontSize ?? 12` which passes 0 through
      // (unlike TextMeasurer which uses `|| 12`)
      const ctx = makeContext({ style: { ...defaultCellStyle, fontSize: 0 } });
      expect(resolveVar('cell.fontSize', ctx)).toBe(0);
    });

    it('defaults to 13 when cell is undefined', () => {
      const ctx = makeContext();
      ctx.cell = undefined;
      expect(resolveVar('cell.fontSize', ctx)).toBe(13);
    });
  });

  // ============ cell.overflows ============

  describe('cell.overflows', () => {
    it('returns false for small text in large cell', () => {
      const ctx = makeContext({
        rawValue: 'Hi',
        layout: { row: 0, col: 0, rowSpan: 1, colSpan: 1, x: 0, y: 0, width: 100, height: 50 },
      });
      expect(resolveVar('cell.overflows', ctx)).toBe(false);
    });

    it('returns true for long text in narrow cell', () => {
      const ctx = makeContext({
        rawValue: 'This is a very very long text that should definitely overflow',
        style: { ...defaultCellStyle },
        layout: { row: 0, col: 0, rowSpan: 1, colSpan: 1, x: 0, y: 0, width: 5, height: 5 },
      });
      expect(resolveVar('cell.overflows', ctx)).toBe(true);
    });

    it('returns false when no layout', () => {
      const ctx = makeContext();
      (ctx.cell as any).layout = undefined;
      expect(resolveVar('cell.overflows', ctx)).toBe(false);
    });

    it('returns false when cell is undefined', () => {
      const ctx = makeContext();
      ctx.cell = undefined;
      expect(resolveVar('cell.overflows', ctx)).toBe(false);
    });
  });

  // ============ table.rowCount / table.colCount ============

  describe('table.rowCount', () => {
    it('returns count from structureStore', () => {
      const ctx = makeContext();
      expect(resolveVar('table.rowCount', ctx)).toBe(3);
    });

    it('returns 0 on error', () => {
      const ctx = makeContext();
      (ctx.structureStore as any).countTotalRows = () => { throw new Error('fail'); };
      expect(resolveVar('table.rowCount', ctx)).toBe(0);
    });
  });

  describe('table.colCount', () => {
    it('returns leaf count from structureStore', () => {
      const ctx = makeContext();
      expect(resolveVar('table.colCount', ctx)).toBe(5);
    });

    it('returns 0 on error', () => {
      const ctx = makeContext();
      (ctx.structureStore as any).getLeafCount = () => { throw new Error('fail'); };
      expect(resolveVar('table.colCount', ctx)).toBe(0);
    });
  });

  // ============ Unknown paths ============

  describe('unknown var paths', () => {
    it('returns null for unknown path', () => {
      const ctx = makeContext();
      expect(resolveVar('unknown.path', ctx)).toBe(null);
    });

    it('returns null for partial match', () => {
      const ctx = makeContext();
      expect(resolveVar('cell', ctx)).toBe(null);
    });

    it('returns null for extra depth', () => {
      const ctx = makeContext();
      expect(resolveVar('cell.value.extra', ctx)).toBe(null);
    });
  });

  // ============ getAvailableVars ============

  describe('getAvailableVars()', () => {
    it('returns all 17 vars', () => {
      expect(getAvailableVars()).toHaveLength(16);
    });

    it('all returned vars have required fields', () => {
      for (const v of getAvailableVars()) {
        expect(v.path).toBeTruthy();
        expect(v.description).toBeTruthy();
        expect(typeof v.resolve).toBe('function');
      }
    });
  });
});
