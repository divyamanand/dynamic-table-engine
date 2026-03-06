import { Compiler } from '../../../rules/expression/compiler';
import { Evaluator, EvaluationError } from '../../../rules/expression/evaluator';
import type { EvalContext } from '../../../rules/types/evaluation.types';
import type { ICell } from '../../../interfaces/core/cell.interface';
import type { ExprNode } from '../../../rules/expression/ast.types';
import { defaultCellStyle } from '../../../stores/cell-registry.store';

function mockCell(overrides: Partial<ICell> = {}): ICell {
  return {
    cellID: 'cell-001',
    inRegion: 'body',
    rawValue: '',
    style: { ...defaultCellStyle },
    isDynamic: false,
    layout: {
      row: 0,
      col: 0,
      rowSpan: 1,
      colSpan: 1,
      x: 0,
      y: 0,
      width: 50,
      height: 20,
    },
    ...overrides,
  };
}

function mockContext(cellOverrides: Partial<ICell> = {}, ctxOverrides: Partial<EvalContext> = {}): EvalContext {
  const body = [
    ['cell-001', 'cell-002', 'cell-003'],
    ['cell-004', 'cell-005', 'cell-006'],
    ['cell-007', 'cell-008', 'cell-009'],
  ];

  const cells: Record<string, ICell> = {
    'cell-001': mockCell({ cellID: 'cell-001', rawValue: 10 }),
    'cell-002': mockCell({ cellID: 'cell-002', rawValue: 20 }),
    'cell-003': mockCell({ cellID: 'cell-003', rawValue: 30 }),
    'cell-004': mockCell({ cellID: 'cell-004', rawValue: 40 }),
    'cell-005': mockCell({ cellID: 'cell-005', rawValue: 50 }),
    'cell-006': mockCell({ cellID: 'cell-006', rawValue: 60 }),
    'cell-007': mockCell({ cellID: 'cell-007', rawValue: 70 }),
    'cell-008': mockCell({ cellID: 'cell-008', rawValue: 80 }),
    'cell-009': mockCell({ cellID: 'cell-009', rawValue: 90 }),
  };

  const currentCell = mockCell({ rawValue: 42, ...cellOverrides });

  return {
    cell: currentCell,
    table: {} as any,
    cellRegistry: {
      getCellById: (id: string) => cells[id] ?? undefined,
      getCellByAddress: () => undefined,
      createCell: () => '',
      updateCell: () => {},
      deleteCell: () => {},
      setCellAddress: () => {},
      clearCellAddress: () => {},
    },
    structureStore: {
      getBody: () => body,
      getBodyCell: (r: number, c: number) => body[r]?.[c] ?? undefined,
      countTotalRows: () => 3,
      countTotalCols: () => 3,
      getLeafCount: () => 3,
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
    rowIndex: 0,
    colIndex: 0,
    ...ctxOverrides,
  };
}

function evaluate(expr: string, ctx: EvalContext): any {
  const ast = Compiler.compile(expr);
  return Evaluator.evaluate(ast, ctx);
}

describe('Evaluator — Edge Cases', () => {
  // ============ Null Evaluation ============

  describe('null evaluation', () => {
    const ctx = mockContext();

    it('evaluates null literal', () => {
      expect(evaluate('null', ctx)).toBe(null);
    });

    it('null == null is true', () => {
      expect(evaluate('null == null', ctx)).toBe(true);
    });

    it('null != 0 depends on loose equality', () => {
      // In JS, null == 0 is false (null only == null and undefined)
      expect(evaluate('null == 0', ctx)).toBe(false);
    });

    it('null != "" is true', () => {
      expect(evaluate('null != ""', ctx)).toBe(true);
    });

    it('null coerces to false in AND', () => {
      expect(evaluate('null AND true', ctx)).toBe(false);
    });

    it('null coerces to false in OR', () => {
      expect(evaluate('null OR false', ctx)).toBe(false);
    });

    it('null OR true is true', () => {
      expect(evaluate('null OR true', ctx)).toBe(true);
    });

    it('NOT null is true', () => {
      const ast = Compiler.compile('NOT null');
      expect(Evaluator.evaluate(ast, ctx)).toBe(true);
    });
  });

  // ============ NOT Operator Evaluation ============

  describe('NOT operator evaluation', () => {
    const ctx = mockContext();

    it('NOT true is false', () => {
      const ast = Compiler.compile('NOT true');
      expect(Evaluator.evaluate(ast, ctx)).toBe(false);
    });

    it('NOT false is true', () => {
      const ast = Compiler.compile('NOT false');
      expect(Evaluator.evaluate(ast, ctx)).toBe(true);
    });

    it('NOT 0 is true', () => {
      const ast = Compiler.compile('NOT 0');
      expect(Evaluator.evaluate(ast, ctx)).toBe(true);
    });

    it('NOT 1 is false', () => {
      const ast = Compiler.compile('NOT 1');
      expect(Evaluator.evaluate(ast, ctx)).toBe(false);
    });

    it('NOT "" is true', () => {
      const ast = Compiler.compile('NOT ""');
      expect(Evaluator.evaluate(ast, ctx)).toBe(true);
    });

    it('NOT "hello" is false', () => {
      const ast = Compiler.compile('NOT "hello"');
      expect(Evaluator.evaluate(ast, ctx)).toBe(false);
    });

    it('double NOT true is true', () => {
      const ast = Compiler.compile('NOT NOT true');
      expect(Evaluator.evaluate(ast, ctx)).toBe(true);
    });

    it('NOT in compound: NOT a AND NOT b', () => {
      const ast = Compiler.compile('NOT false AND NOT false');
      expect(Evaluator.evaluate(ast, ctx)).toBe(true);
    });
  });

  // ============ Loose Equality Cross-Type ============

  describe('loose equality cross-type', () => {
    const ctx = mockContext();

    it('string "5" == number 5 (loose)', () => {
      // JS loose equality: "5" == 5 → true
      expect(evaluate('"5" == 5', ctx)).toBe(true);
    });

    it('string "0" == number 0 (loose)', () => {
      expect(evaluate('"0" == 0', ctx)).toBe(true);
    });

    it('empty string == 0 (loose)', () => {
      // JS: "" == 0 → true
      expect(evaluate('"" == 0', ctx)).toBe(true);
    });

    it('string != number when different', () => {
      expect(evaluate('"hello" == 0', ctx)).toBe(false);
    });

    it('boolean true == 1 (loose)', () => {
      expect(evaluate('true == 1', ctx)).toBe(true);
    });

    it('boolean false == 0 (loose)', () => {
      expect(evaluate('false == 0', ctx)).toBe(true);
    });
  });

  // ============ String Operations ============

  describe('string operations', () => {
    const ctx = mockContext();

    it('string > string uses lexicographic comparison', () => {
      expect(evaluate('"banana" > "apple"', ctx)).toBe(true);
    });

    it('string < string', () => {
      expect(evaluate('"apple" < "banana"', ctx)).toBe(true);
    });

    it('string + number coerces to string', () => {
      expect(evaluate('"count: " + 5', ctx)).toBe('count: 5');
    });

    it('number + string coerces to string', () => {
      expect(evaluate('5 + " items"', ctx)).toBe('5 items');
    });

    it('string concatenation chaining', () => {
      expect(evaluate('"a" + "b" + "c"', ctx)).toBe('abc');
    });
  });

  // ============ Arithmetic Edge Cases ============

  describe('arithmetic edge cases', () => {
    const ctx = mockContext();

    it('integer division', () => {
      expect(evaluate('7 / 2', ctx)).toBe(3.5);
    });

    it('negative modulo', () => {
      expect(evaluate('-7 % 3', ctx)).toBe(-1);
    });

    it('multiplication by zero', () => {
      expect(evaluate('100 * 0', ctx)).toBe(0);
    });

    it('subtraction yielding negative', () => {
      expect(evaluate('3 - 10', ctx)).toBe(-7);
    });

    it('large number arithmetic', () => {
      expect(evaluate('999999 * 999999', ctx)).toBe(999998000001);
    });

    it('chained operations preserve precedence', () => {
      // 2 + 3 * 4 - 1 = 2 + 12 - 1 = 13
      expect(evaluate('2 + 3 * 4 - 1', ctx)).toBe(13);
    });

    it('double unary minus evaluates correctly', () => {
      const ast = Compiler.compile('--5');
      expect(Evaluator.evaluate(ast, ctx)).toBe(5);
    });

    it('unary minus on string becomes NaN (coerced)', () => {
      const ast = Compiler.compile('-"hello"');
      expect(Evaluator.evaluate(ast, ctx)).toBeNaN();
    });
  });

  // ============ Selection Range (self) ============

  describe('selection range (self)', () => {
    it('SUM(self) resolves selection rect', () => {
      const ctx = mockContext({}, {
        selectionRect: { rowStart: 0, colStart: 0, rowEnd: 1, colEnd: 1 },
      });
      // Cells: (0,0)=10, (0,1)=20, (1,0)=40, (1,1)=50 → sum=120
      const ast = Compiler.compile('SUM(self)');
      expect(Evaluator.evaluate(ast, ctx)).toBe(120);
    });

    it('COUNT(self) counts selection', () => {
      const ctx = mockContext({}, {
        selectionRect: { rowStart: 0, colStart: 0, rowEnd: 0, colEnd: 2 },
      });
      // Row 0: cell-001, cell-002, cell-003 → all non-empty → count=3
      const ast = Compiler.compile('COUNT(self)');
      expect(Evaluator.evaluate(ast, ctx)).toBe(3);
    });

    it('self without selectionRect throws', () => {
      const ctx = mockContext({}, { selectionRect: undefined });
      const ast = Compiler.compile('SUM(self)');
      expect(() => Evaluator.evaluate(ast, ctx)).toThrow();
    });

    it('AVG(self) on single cell', () => {
      const ctx = mockContext({}, {
        selectionRect: { rowStart: 2, colStart: 2, rowEnd: 2, colEnd: 2 },
      });
      // Cell (2,2) = cell-009 with rawValue=90
      const ast = Compiler.compile('AVG(self)');
      expect(Evaluator.evaluate(ast, ctx)).toBe(90);
    });
  });

  // ============ Rect Range Resolution ============

  describe('rect range (rNcN:rNcN notation)', () => {
    it('parses and evaluates r0c0:r1c1 in SUM', () => {
      const ctx = mockContext();
      // This requires the parser to handle identifier "r0c0" : identifier "r1c1"
      // which becomes RangeRef("r0c0:r1c1")
      const ast = Compiler.compile('SUM(r0c0:r1c1)');
      // Cells: (0,0)=10, (0,1)=20, (1,0)=40, (1,1)=50 → sum=120
      expect(Evaluator.evaluate(ast, ctx)).toBe(120);
    });

    it('rect range for single row', () => {
      const ctx = mockContext();
      const ast = Compiler.compile('SUM(r0c0:r0c2)');
      // Row 0: 10, 20, 30 → sum=60
      expect(Evaluator.evaluate(ast, ctx)).toBe(60);
    });

    it('rect range for single cell', () => {
      const ctx = mockContext();
      const ast = Compiler.compile('SUM(r2c2:r2c2)');
      // Single cell (2,2) = 90
      expect(Evaluator.evaluate(ast, ctx)).toBe(90);
    });

    it('rect range out of bounds returns partial', () => {
      const ctx = mockContext();
      const ast = Compiler.compile('SUM(r0c0:r99c99)');
      // Should include all 9 cells = 450
      expect(Evaluator.evaluate(ast, ctx)).toBe(450);
    });
  });

  // ============ col:self / row:self Error Cases ============

  describe('col:self / row:self error cases', () => {
    it('col:self without colIndex throws', () => {
      const ctx = mockContext({}, { colIndex: undefined });
      const ast = Compiler.compile('SUM(col:self)');
      expect(() => Evaluator.evaluate(ast, ctx)).toThrow();
    });

    it('row:self without rowIndex throws', () => {
      const ctx = mockContext({}, { rowIndex: undefined });
      const ast = Compiler.compile('SUM(row:self)');
      expect(() => Evaluator.evaluate(ast, ctx)).toThrow();
    });
  });

  // ============ Function Edge Cases ============

  describe('function edge cases', () => {
    it('unknown function throws', () => {
      const ctx = mockContext();
      const ast = Compiler.compile('UNKNOWN(42)');
      expect(() => Evaluator.evaluate(ast, ctx)).toThrow('Unknown function');
    });

    it('SUM with non-array arg returns 0', () => {
      const ctx = mockContext();
      // Directly call SUM with a literal number (not a range)
      const ast = Compiler.compile('SUM(42)');
      // 42 is not an array, so SUM returns 0
      expect(Evaluator.evaluate(ast, ctx)).toBe(0);
    });

    it('AVG with empty array returns 0', () => {
      const ctx = mockContext();
      const ast = Compiler.compile('AVG(col:99)');
      expect(Evaluator.evaluate(ast, ctx)).toBe(0);
    });

    it('SUM with mixed string/number cells', () => {
      const ctx = mockContext();
      // Override one cell to have string value
      (ctx.cellRegistry as any).getCellById = (id: string) => {
        if (id === 'cell-001') return mockCell({ cellID: 'cell-001', rawValue: 'abc' });
        if (id === 'cell-004') return mockCell({ cellID: 'cell-004', rawValue: 40 });
        if (id === 'cell-007') return mockCell({ cellID: 'cell-007', rawValue: '70' });
        return undefined;
      };
      const ast = Compiler.compile('SUM(col:0)');
      // 'abc' → NaN (skipped), 40, '70' → 70 → sum = 110
      expect(Evaluator.evaluate(ast, ctx)).toBe(110);
    });

    it('COUNT only counts non-empty cells', () => {
      const ctx = mockContext();
      (ctx.cellRegistry as any).getCellById = (id: string) => {
        if (id === 'cell-001') return mockCell({ cellID: 'cell-001', rawValue: '' });
        if (id === 'cell-004') return mockCell({ cellID: 'cell-004', rawValue: null as any });
        if (id === 'cell-007') return mockCell({ cellID: 'cell-007', rawValue: 0 });
        return undefined;
      };
      const ast = Compiler.compile('COUNT(col:0)');
      // '' → empty (not counted), null → not counted, 0 → non-empty (counted)
      expect(Evaluator.evaluate(ast, ctx)).toBe(1);
    });

    it('MAX with all negative numbers', () => {
      const ctx = mockContext();
      (ctx.cellRegistry as any).getCellById = (id: string) => {
        if (id === 'cell-001') return mockCell({ cellID: 'cell-001', rawValue: -10 });
        if (id === 'cell-004') return mockCell({ cellID: 'cell-004', rawValue: -20 });
        if (id === 'cell-007') return mockCell({ cellID: 'cell-007', rawValue: -5 });
        return undefined;
      };
      const ast = Compiler.compile('MAX(col:0)');
      expect(Evaluator.evaluate(ast, ctx)).toBe(-5);
    });

    it('MIN with all negative numbers', () => {
      const ctx = mockContext();
      (ctx.cellRegistry as any).getCellById = (id: string) => {
        if (id === 'cell-001') return mockCell({ cellID: 'cell-001', rawValue: -10 });
        if (id === 'cell-004') return mockCell({ cellID: 'cell-004', rawValue: -20 });
        if (id === 'cell-007') return mockCell({ cellID: 'cell-007', rawValue: -5 });
        return undefined;
      };
      const ast = Compiler.compile('MIN(col:0)');
      expect(Evaluator.evaluate(ast, ctx)).toBe(-20);
    });

    it('TEXT_HEIGHT with empty string returns single line height', () => {
      const ctx = mockContext();
      const result = evaluate('TEXT_HEIGHT("", 12)', ctx);
      // Empty string split by \n → [''] → 1 line, but line has 0 chars
      // Height should be charHeight = 12 * 0.353 = 4.236
      expect(result).toBeGreaterThan(0);
    });

    it('TEXT_WIDTH with empty string returns 0', () => {
      const ctx = mockContext();
      const result = evaluate('TEXT_WIDTH("", 12)', ctx);
      expect(result).toBe(0);
    });

    it('CELL with out of bounds returns empty', () => {
      const ctx = mockContext();
      expect(evaluate('CELL(-1, 0)', ctx)).toBe('');
      expect(evaluate('CELL(0, -1)', ctx)).toBe('');
    });

    it('COLUMN returns -1 for non-existent header', () => {
      const ctx = mockContext();
      expect(evaluate('COLUMN("NonExistent")', ctx)).toBe(-1);
    });

    it('COLUMN with matching header', () => {
      const headerCell = mockCell({ cellID: 'header-0', rawValue: 'Name' });
      const ctx = mockContext({}, {
        structureStore: {
          ...mockContext().structureStore,
          getRoots: () => ['header-0', 'header-1'],
        } as any,
        cellRegistry: {
          ...mockContext().cellRegistry,
          getCellById: (id: string) => {
            if (id === 'header-0') return headerCell;
            return mockContext().cellRegistry.getCellById(id);
          },
        } as any,
      });
      expect(evaluate('COLUMN("Name")', ctx)).toBe(0);
    });
  });

  // ============ Object Literal Evaluation ============

  describe('object literal deep evaluation', () => {
    it('evaluates object with function call values', () => {
      const ctx = mockContext({ rawValue: 'test text' });
      const result = evaluate('{ height: TEXT_HEIGHT(cell.value, cell.fontSize) }', ctx);
      expect(typeof result.height).toBe('number');
      expect(result.height).toBeGreaterThan(0);
    });

    it('evaluates deeply nested object', () => {
      const ctx = mockContext();
      const result = evaluate('{ a: { b: { c: 42 } } }', ctx);
      expect(result).toEqual({ a: { b: { c: 42 } } });
    });

    it('evaluates object with computed keys from vars', () => {
      const ctx = mockContext({ rawValue: 100 });
      const result = evaluate('{ width: cell.numericValue, doubled: cell.numericValue * 2 }', ctx);
      expect(result).toEqual({ width: 100, doubled: 200 });
    });

    it('evaluates empty object', () => {
      const ctx = mockContext();
      const result = evaluate('{}', ctx);
      expect(result).toEqual({});
    });
  });

  // ============ Boolean Coercion Edge Cases ============

  describe('boolean coercion edge cases', () => {
    const ctx = mockContext();

    it('negative number is truthy', () => {
      expect(evaluate('-1 AND true', ctx)).toBe(true);
    });

    it('array (from range) is truthy', () => {
      // An array is always truthy in toBoolean
      const ast = Compiler.compile('body AND true');
      expect(Evaluator.evaluate(ast, ctx)).toBe(true);
    });

    it('object is truthy', () => {
      expect(evaluate('{} AND true', ctx)).toBe(true);
    });

    it('undefined coerces to false', () => {
      // Simulate undefined by accessing missing var
      // cell.value when cell is undefined returns ''
      const ctx2 = mockContext();
      ctx2.cell = undefined;
      // cell.value returns '' which is falsy
      expect(evaluate('cell.value OR false', ctx2)).toBe(false);
    });
  });

  // ============ Evaluator Error Handling ============

  describe('evaluator error handling', () => {
    it('throws on null node', () => {
      const ctx = mockContext();
      expect(() => Evaluator.evaluate(null as any, ctx)).toThrow('Node is null or undefined');
    });

    it('throws on undefined node', () => {
      const ctx = mockContext();
      expect(() => Evaluator.evaluate(undefined as any, ctx)).toThrow('Node is null or undefined');
    });

    it('throws on unknown node type', () => {
      const ctx = mockContext();
      expect(() => Evaluator.evaluate({ type: 'Unknown' } as any, ctx)).toThrow('Unknown node type');
    });

    it('wraps function errors', () => {
      const ctx = mockContext();
      const ast = Compiler.compile('UNKNOWN_FN(1)');
      expect(() => Evaluator.evaluate(ast, ctx)).toThrow('Error calling UNKNOWN_FN');
    });

    it('division by zero gives clear error', () => {
      const ctx = mockContext();
      expect(() => evaluate('10 / 0', ctx)).toThrow('Division by zero');
    });

    it('modulo by zero gives clear error', () => {
      const ctx = mockContext();
      expect(() => evaluate('10 % 0', ctx)).toThrow('Modulo by zero');
    });
  });

  // ============ Integration: Full Pipeline E2E ============

  describe('full pipeline (string → compile → evaluate)', () => {
    it('condition: cell.overflows AND cell.fontSize > 6', () => {
      const cell = mockCell({
        rawValue: 'This is a very long text that will definitely overflow the cell bounds with a normal size',
        style: { ...defaultCellStyle },
        layout: { row: 0, col: 0, rowSpan: 1, colSpan: 1, x: 0, y: 0, width: 5, height: 5 },
      });
      const ctx = mockContext({}, { cell });
      expect(evaluate('cell.overflows AND cell.fontSize > 6', ctx)).toBe(true);
    });

    it('condition: cell.overflows with non-overflowing cell', () => {
      const cell = mockCell({
        rawValue: 'Hi',
        style: { ...defaultCellStyle },
        layout: { row: 0, col: 0, rowSpan: 1, colSpan: 1, x: 0, y: 0, width: 100, height: 100 },
      });
      const ctx = mockContext({}, { cell });
      expect(evaluate('cell.overflows', ctx)).toBe(false);
    });

    it('result: { style: { color: "red" }, rowHeightMin: 50 }', () => {
      const ctx = mockContext();
      const result = evaluate('{ style: { color: "red" }, rowHeightMin: 50 }', ctx);
      expect(result).toEqual({ style: { color: 'red' }, rowHeightMin: 50 });
    });

    it('conditional format: cell.numericValue > SUM(col:self) / COUNT(col:self)', () => {
      // Cell value 42, column self (col:0) has values 10, 40, 70
      // AVG = 120/3 = 40, so 42 > 40 = true
      const ctx = mockContext({ rawValue: 42 }, { colIndex: 0 });
      expect(evaluate('cell.numericValue > SUM(col:self) / COUNT(col:self)', ctx)).toBe(true);
    });

    it('complex result with TEXT_HEIGHT', () => {
      const ctx = mockContext({ rawValue: 'Hello World' });
      const result = evaluate('{ rowHeightMin: TEXT_HEIGHT(cell.value, cell.fontSize) }', ctx);
      expect(result.rowHeightMin).toBeGreaterThan(0);
    });
  });
});
