import { FunctionRegistry, functionRegistry } from '../../../rules/expression/functions/registry';
import type { EvalContext } from '../../../rules/types/evaluation.types';
import type { ICell } from '../../../interfaces/core/cell.interface';

function mockCell(id: string, rawValue: any = ''): ICell {
  return {
    cellID: id,
    inRegion: 'body',
    rawValue,
    style: { font: 'Arial', fontSize: 12 },
    isDynamic: false,
  };
}

function makeContext(): EvalContext {
  return {
    cell: mockCell('current', 42),
    table: {} as any,
    cellRegistry: {
      getCellById: (id: string) => {
        const map: Record<string, ICell> = {
          'c00': mockCell('c00', 10),
          'c01': mockCell('c01', 20),
          'c10': mockCell('c10', 30),
          'h0': mockCell('h0', 'Name'),
          'h1': mockCell('h1', 'Age'),
        };
        return map[id];
      },
      getCellByAddress: () => undefined,
      createCell: () => '',
      updateCell: () => {},
      deleteCell: () => {},
      setCellAddress: () => {},
      clearCellAddress: () => {},
    },
    structureStore: {
      getBody: () => [['c00', 'c01'], ['c10', 'c11']],
      getBodyCell: (r: number, c: number) => {
        const body = [['c00', 'c01'], ['c10', 'c11']];
        return body[r]?.[c];
      },
      countTotalRows: () => 2,
      countTotalCols: () => 2,
      getLeafCount: () => 2,
      getRoots: (region: string) => region === 'theader' ? ['h0', 'h1'] : [],
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
    rowIndex: 0,
    colIndex: 0,
  };
}

describe('FunctionRegistry', () => {
  // ============ Registry Structure ============

  describe('registry structure', () => {
    it('has 9 built-in functions', () => {
      expect(functionRegistry.getAvailableFunctions()).toHaveLength(9);
    });

    it('all built-in functions have name, signature, description, returnType, fn', () => {
      for (const fn of functionRegistry.getAvailableFunctions()) {
        expect(fn.name).toBeTruthy();
        expect(fn.signature).toBeTruthy();
        expect(fn.description).toBeTruthy();
        expect(['string', 'number', 'boolean']).toContain(fn.returnType);
        expect(typeof fn.fn).toBe('function');
      }
    });

    it('can get function by name', () => {
      expect(functionRegistry.getFunction('SUM')).toBeDefined();
      expect(functionRegistry.getFunction('AVG')).toBeDefined();
      expect(functionRegistry.getFunction('NONEXISTENT')).toBeUndefined();
    });
  });

  // ============ SUM ============

  describe('SUM', () => {
    const ctx = makeContext();

    it('sums numeric cell values', () => {
      const cells = [mockCell('a', 10), mockCell('b', 20), mockCell('c', 30)];
      expect(functionRegistry.call('SUM', [cells], ctx)).toBe(60);
    });

    it('returns 0 for non-array arg', () => {
      expect(functionRegistry.call('SUM', [42], ctx)).toBe(0);
    });

    it('returns 0 for empty array', () => {
      expect(functionRegistry.call('SUM', [[]], ctx)).toBe(0);
    });

    it('skips NaN values', () => {
      const cells = [mockCell('a', 10), mockCell('b', 'hello'), mockCell('c', 30)];
      expect(functionRegistry.call('SUM', [cells], ctx)).toBe(40);
    });

    it('parses string numbers', () => {
      const cells = [mockCell('a', '10'), mockCell('b', '20.5')];
      expect(functionRegistry.call('SUM', [cells], ctx)).toBe(30.5);
    });

    it('handles negative numbers', () => {
      const cells = [mockCell('a', -10), mockCell('b', 20), mockCell('c', -5)];
      expect(functionRegistry.call('SUM', [cells], ctx)).toBe(5);
    });

    it('handles null/undefined rawValues', () => {
      const cells = [mockCell('a', null), mockCell('b', undefined), mockCell('c', 10)];
      expect(functionRegistry.call('SUM', [cells], ctx)).toBe(10);
    });
  });

  // ============ AVG ============

  describe('AVG', () => {
    const ctx = makeContext();

    it('computes average', () => {
      const cells = [mockCell('a', 10), mockCell('b', 20), mockCell('c', 30)];
      expect(functionRegistry.call('AVG', [cells], ctx)).toBe(20);
    });

    it('returns 0 for empty array', () => {
      expect(functionRegistry.call('AVG', [[]], ctx)).toBe(0);
    });

    it('returns 0 for non-array', () => {
      expect(functionRegistry.call('AVG', [42], ctx)).toBe(0);
    });

    it('skips NaN and averages rest', () => {
      const cells = [mockCell('a', 10), mockCell('b', 'abc'), mockCell('c', 30)];
      // Only 10 and 30 count, avg = 20
      expect(functionRegistry.call('AVG', [cells], ctx)).toBe(20);
    });

    it('handles single cell', () => {
      const cells = [mockCell('a', 42)];
      expect(functionRegistry.call('AVG', [cells], ctx)).toBe(42);
    });
  });

  // ============ COUNT ============

  describe('COUNT', () => {
    const ctx = makeContext();

    it('counts non-empty cells', () => {
      const cells = [mockCell('a', 10), mockCell('b', 'hello'), mockCell('c', true)];
      expect(functionRegistry.call('COUNT', [cells], ctx)).toBe(3);
    });

    it('excludes empty string', () => {
      const cells = [mockCell('a', ''), mockCell('b', 10)];
      expect(functionRegistry.call('COUNT', [cells], ctx)).toBe(1);
    });

    it('excludes null', () => {
      const cells = [mockCell('a', null), mockCell('b', 10)];
      expect(functionRegistry.call('COUNT', [cells], ctx)).toBe(1);
    });

    it('excludes undefined', () => {
      const cells = [mockCell('a', undefined), mockCell('b', 10)];
      expect(functionRegistry.call('COUNT', [cells], ctx)).toBe(1);
    });

    it('counts zero as non-empty', () => {
      const cells = [mockCell('a', 0), mockCell('b', false)];
      expect(functionRegistry.call('COUNT', [cells], ctx)).toBe(2);
    });

    it('returns 0 for non-array', () => {
      expect(functionRegistry.call('COUNT', [42], ctx)).toBe(0);
    });

    it('returns 0 for empty array', () => {
      expect(functionRegistry.call('COUNT', [[]], ctx)).toBe(0);
    });
  });

  // ============ MAX ============

  describe('MAX', () => {
    const ctx = makeContext();

    it('finds maximum', () => {
      const cells = [mockCell('a', 10), mockCell('b', 50), mockCell('c', 30)];
      expect(functionRegistry.call('MAX', [cells], ctx)).toBe(50);
    });

    it('returns 0 for empty array', () => {
      expect(functionRegistry.call('MAX', [[]], ctx)).toBe(0);
    });

    it('handles all negative', () => {
      const cells = [mockCell('a', -10), mockCell('b', -20), mockCell('c', -5)];
      expect(functionRegistry.call('MAX', [cells], ctx)).toBe(-5);
    });

    it('handles single cell', () => {
      const cells = [mockCell('a', 99)];
      expect(functionRegistry.call('MAX', [cells], ctx)).toBe(99);
    });

    it('skips NaN values', () => {
      const cells = [mockCell('a', 'abc'), mockCell('b', 42)];
      expect(functionRegistry.call('MAX', [cells], ctx)).toBe(42);
    });

    it('returns 0 when all NaN', () => {
      const cells = [mockCell('a', 'abc'), mockCell('b', 'def')];
      expect(functionRegistry.call('MAX', [cells], ctx)).toBe(0);
    });
  });

  // ============ MIN ============

  describe('MIN', () => {
    const ctx = makeContext();

    it('finds minimum', () => {
      const cells = [mockCell('a', 10), mockCell('b', 50), mockCell('c', 30)];
      expect(functionRegistry.call('MIN', [cells], ctx)).toBe(10);
    });

    it('returns 0 for empty array', () => {
      expect(functionRegistry.call('MIN', [[]], ctx)).toBe(0);
    });

    it('handles all negative', () => {
      const cells = [mockCell('a', -10), mockCell('b', -20), mockCell('c', -5)];
      expect(functionRegistry.call('MIN', [cells], ctx)).toBe(-20);
    });

    it('returns 0 when all NaN', () => {
      const cells = [mockCell('a', 'abc'), mockCell('b', 'def')];
      expect(functionRegistry.call('MIN', [cells], ctx)).toBe(0);
    });
  });

  // ============ TEXT_HEIGHT / TEXT_WIDTH ============

  describe('TEXT_HEIGHT', () => {
    const ctx = makeContext();

    it('returns positive height for non-empty text', () => {
      const result = functionRegistry.call('TEXT_HEIGHT', ['hello', 12], ctx);
      expect(result).toBeGreaterThan(0);
    });

    it('returns height for empty text', () => {
      const result = functionRegistry.call('TEXT_HEIGHT', ['', 12], ctx);
      // empty string → split → [''] → 1 line → height > 0
      expect(result).toBeGreaterThan(0);
    });

    it('defaults fontSize to 12 when arg is not number', () => {
      const result = functionRegistry.call('TEXT_HEIGHT', ['hello', 'bad'], ctx);
      const expected = functionRegistry.call('TEXT_HEIGHT', ['hello', 12], ctx);
      expect(result).toBe(expected);
    });

    it('handles null text', () => {
      const result = functionRegistry.call('TEXT_HEIGHT', [null, 12], ctx);
      expect(typeof result).toBe('number');
    });

    it('multiline text has larger height', () => {
      const single = functionRegistry.call('TEXT_HEIGHT', ['hello', 12], ctx);
      const multi = functionRegistry.call('TEXT_HEIGHT', ['hello\nworld', 12], ctx);
      expect(multi).toBeGreaterThan(single);
    });
  });

  describe('TEXT_WIDTH', () => {
    const ctx = makeContext();

    it('returns positive width for non-empty text', () => {
      expect(functionRegistry.call('TEXT_WIDTH', ['hello', 12], ctx)).toBeGreaterThan(0);
    });

    it('returns 0 for empty text', () => {
      expect(functionRegistry.call('TEXT_WIDTH', ['', 12], ctx)).toBe(0);
    });

    it('longer text has larger width', () => {
      const short = functionRegistry.call('TEXT_WIDTH', ['ab', 12], ctx);
      const long = functionRegistry.call('TEXT_WIDTH', ['abcdef', 12], ctx);
      expect(long).toBeGreaterThan(short);
    });
  });

  // ============ CELL ============

  describe('CELL', () => {
    const ctx = makeContext();

    it('returns value at (0,0)', () => {
      expect(functionRegistry.call('CELL', [0, 0], ctx)).toBe(10);
    });

    it('returns value at (0,1)', () => {
      expect(functionRegistry.call('CELL', [0, 1], ctx)).toBe(20);
    });

    it('returns empty for out of bounds', () => {
      expect(functionRegistry.call('CELL', [99, 99], ctx)).toBe('');
    });

    it('handles string args (coerced to number)', () => {
      expect(functionRegistry.call('CELL', ['0', '0'], ctx)).toBe(10);
    });

    it('returns empty for negative indices', () => {
      expect(functionRegistry.call('CELL', [-1, 0], ctx)).toBe('');
    });
  });

  // ============ COLUMN ============

  describe('COLUMN', () => {
    const ctx = makeContext();

    it('returns index for matching header', () => {
      expect(functionRegistry.call('COLUMN', ['Name'], ctx)).toBe(0);
    });

    it('returns index for second header', () => {
      expect(functionRegistry.call('COLUMN', ['Age'], ctx)).toBe(1);
    });

    it('returns -1 for non-existent header', () => {
      expect(functionRegistry.call('COLUMN', ['Unknown'], ctx)).toBe(-1);
    });

    it('returns -1 for empty string', () => {
      expect(functionRegistry.call('COLUMN', [''], ctx)).toBe(-1);
    });
  });

  // ============ Custom Functions ============

  describe('custom function registration', () => {
    it('registers and calls a custom function', () => {
      const reg = new FunctionRegistry();
      reg.register({
        name: 'DOUBLE',
        signature: 'DOUBLE(n)',
        description: 'Doubles a number',
        returnType: 'number',
        fn: (args) => (args[0] as number) * 2,
      });
      expect(reg.call('DOUBLE', [21], makeContext())).toBe(42);
    });

    it('custom function overrides built-in', () => {
      const reg = new FunctionRegistry();
      reg.register({
        name: 'SUM',
        signature: 'SUM(range)',
        description: 'Custom SUM',
        returnType: 'number',
        fn: () => 999,
      });
      expect(reg.call('SUM', [[], makeContext()], makeContext())).toBe(999);
    });

    it('getAvailableFunctions includes custom', () => {
      const reg = new FunctionRegistry();
      const before = reg.getAvailableFunctions().length;
      reg.register({
        name: 'CUSTOM',
        signature: 'CUSTOM()',
        description: 'Custom fn',
        returnType: 'number',
        fn: () => 0,
      });
      expect(reg.getAvailableFunctions().length).toBe(before + 1);
    });
  });

  // ============ Error Cases ============

  describe('error cases', () => {
    it('throws on unknown function', () => {
      expect(() => functionRegistry.call('NOPE', [], makeContext())).toThrow('Unknown function');
    });
  });
});
