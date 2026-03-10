import { Compiler } from '../../../rules/expression/compiler';
import { Evaluator, EvaluationError } from '../../../rules/expression/evaluator';
import type { EvalContext } from '../../../rules/types/evaluation.types';
import type { ICell } from '../../../interfaces/core/cell.interface';
import type { ExprNode } from '../../../rules/expression/ast.types';
import { defaultCellStyle } from '../../../stores/cell-registry.store';

/**
 * Helper: create a mock cell
 */
function mockCell(overrides: Partial<ICell> = {}): ICell {
  return {
    cellID: 'cell-001',
    inRegion: 'body',
    rawValue: '',
    styleOverrides: { ...defaultCellStyle },
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

/**
 * Helper: create a minimal EvalContext with a cell
 */
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
      createCellWithId: () => '',
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

/**
 * Helper: compile and evaluate an expression
 */
function evaluate(expr: string, ctx: EvalContext): any {
  const ast = Compiler.compile(expr);
  return Evaluator.evaluate(ast, ctx);
}

describe('Evaluator', () => {
  // ============ Literal Evaluation ============

  describe('literals', () => {
    const ctx = mockContext();

    it('evaluates number literal', () => {
      expect(evaluate('42', ctx)).toBe(42);
    });

    it('evaluates float literal', () => {
      expect(evaluate('3.14', ctx)).toBe(3.14);
    });

    it('evaluates string literal', () => {
      expect(evaluate('"hello"', ctx)).toBe('hello');
    });

    it('evaluates true', () => {
      expect(evaluate('true', ctx)).toBe(true);
    });

    it('evaluates false', () => {
      expect(evaluate('false', ctx)).toBe(false);
    });

    it('evaluates always as true', () => {
      expect(evaluate('always', ctx)).toBe(true);
    });
  });

  // ============ Variable Resolution ============

  describe('variable resolution', () => {
    it('resolves cell.value', () => {
      const ctx = mockContext({ rawValue: 'hello' });
      expect(evaluate('cell.value', ctx)).toBe('hello');
    });

    it('resolves cell.numericValue for number', () => {
      const ctx = mockContext({ rawValue: 42 });
      expect(evaluate('cell.numericValue', ctx)).toBe(42);
    });

    it('resolves cell.numericValue for string-number', () => {
      const ctx = mockContext({ rawValue: '99.5' });
      expect(evaluate('cell.numericValue', ctx)).toBe(99.5);
    });

    it('resolves cell.numericValue for non-number as 0', () => {
      const ctx = mockContext({ rawValue: 'hello' });
      expect(evaluate('cell.numericValue', ctx)).toBe(0);
    });

    it('resolves cell.fontSize', () => {
      const ctx = mockContext({ styleOverrides: { ...defaultCellStyle, fontSize: 16 } });
      expect(evaluate('cell.fontSize', ctx)).toBe(16);
    });

    it('resolves cell.width', () => {
      const ctx = mockContext({
        layout: { row: 0, col: 0, rowSpan: 1, colSpan: 1, x: 0, y: 0, width: 100, height: 30 },
      });
      expect(evaluate('cell.width', ctx)).toBe(100);
    });

    it('resolves cell.height', () => {
      const ctx = mockContext({
        layout: { row: 0, col: 0, rowSpan: 1, colSpan: 1, x: 0, y: 0, width: 100, height: 30 },
      });
      expect(evaluate('cell.height', ctx)).toBe(30);
    });

    it('resolves table.rowCount', () => {
      const ctx = mockContext();
      expect(evaluate('table.rowCount', ctx)).toBe(3);
    });

    it('resolves table.colCount', () => {
      const ctx = mockContext();
      expect(evaluate('table.colCount', ctx)).toBe(3);
    });

    it('throws on unknown variable', () => {
      const ctx = mockContext();
      expect(() => evaluate('unknown.path', ctx)).toThrow('Unknown variable');
    });
  });

  // ============ Binary Operations ============

  describe('binary operations', () => {
    const ctx = mockContext();

    // Arithmetic
    it('evaluates addition', () => {
      expect(evaluate('10 + 5', ctx)).toBe(15);
    });

    it('evaluates subtraction', () => {
      expect(evaluate('10 - 5', ctx)).toBe(5);
    });

    it('evaluates multiplication', () => {
      expect(evaluate('10 * 5', ctx)).toBe(50);
    });

    it('evaluates division', () => {
      expect(evaluate('10 / 5', ctx)).toBe(2);
    });

    it('evaluates modulo', () => {
      expect(evaluate('10 % 3', ctx)).toBe(1);
    });

    it('throws on division by zero', () => {
      expect(() => evaluate('10 / 0', ctx)).toThrow('Division by zero');
    });

    it('throws on modulo by zero', () => {
      expect(() => evaluate('10 % 0', ctx)).toThrow('Modulo by zero');
    });

    // Comparison
    it('evaluates > (true)', () => {
      expect(evaluate('10 > 5', ctx)).toBe(true);
    });

    it('evaluates > (false)', () => {
      expect(evaluate('5 > 10', ctx)).toBe(false);
    });

    it('evaluates < (true)', () => {
      expect(evaluate('5 < 10', ctx)).toBe(true);
    });

    it('evaluates >= (equal)', () => {
      expect(evaluate('5 >= 5', ctx)).toBe(true);
    });

    it('evaluates <= (less)', () => {
      expect(evaluate('4 <= 5', ctx)).toBe(true);
    });

    it('evaluates == (true)', () => {
      expect(evaluate('5 == 5', ctx)).toBe(true);
    });

    it('evaluates == (false)', () => {
      expect(evaluate('5 == 6', ctx)).toBe(false);
    });

    it('evaluates != (true)', () => {
      expect(evaluate('5 != 6', ctx)).toBe(true);
    });

    it('evaluates != (false)', () => {
      expect(evaluate('5 != 5', ctx)).toBe(false);
    });

    // String comparison
    it('evaluates string equality', () => {
      expect(evaluate('"hello" == "hello"', ctx)).toBe(true);
    });

    it('evaluates string inequality', () => {
      expect(evaluate('"hello" != "world"', ctx)).toBe(true);
    });

    // String concatenation
    it('evaluates string + string', () => {
      expect(evaluate('"hello" + " world"', ctx)).toBe('hello world');
    });

    // Logical
    it('evaluates AND (both true)', () => {
      expect(evaluate('true AND true', ctx)).toBe(true);
    });

    it('evaluates AND (one false)', () => {
      expect(evaluate('true AND false', ctx)).toBe(false);
    });

    it('evaluates OR (one true)', () => {
      expect(evaluate('false OR true', ctx)).toBe(true);
    });

    it('evaluates OR (both false)', () => {
      expect(evaluate('false OR false', ctx)).toBe(false);
    });
  });

  // ============ Unary Operations ============

  describe('unary operations', () => {
    const ctx = mockContext();

    it('evaluates unary minus', () => {
      expect(evaluate('-5', ctx)).toBe(-5);
    });

    it('evaluates unary minus on expression', () => {
      expect(evaluate('-(3 + 2)', ctx)).toBe(-5);
    });
  });

  // ============ Complex Expressions ============

  describe('complex expressions', () => {
    it('evaluates cell.value > 100 (false)', () => {
      const ctx = mockContext({ rawValue: 42 });
      expect(evaluate('cell.numericValue > 100', ctx)).toBe(false);
    });

    it('evaluates cell.value > 100 (true)', () => {
      const ctx = mockContext({ rawValue: 200 });
      expect(evaluate('cell.numericValue > 100', ctx)).toBe(true);
    });

    it('evaluates compound condition', () => {
      const ctx = mockContext({ rawValue: 50 });
      expect(evaluate('cell.numericValue > 0 AND cell.numericValue < 100', ctx)).toBe(true);
    });

    it('evaluates out-of-range compound condition', () => {
      const ctx = mockContext({ rawValue: 150 });
      expect(evaluate('cell.numericValue > 0 AND cell.numericValue < 100', ctx)).toBe(false);
    });

    it('evaluates arithmetic with vars', () => {
      const ctx = mockContext({ rawValue: 10 });
      // cell.numericValue * 2 + 5 == 25
      expect(evaluate('cell.numericValue * 2 + 5', ctx)).toBe(25);
    });

    it('evaluates nested parentheses', () => {
      const ctx = mockContext();
      expect(evaluate('(2 + 3) * (4 - 1)', ctx)).toBe(15);
    });

    it('evaluates chained comparison with AND', () => {
      const ctx = mockContext({ rawValue: 50 });
      expect(
        evaluate('cell.numericValue >= 0 AND cell.numericValue <= 100 AND cell.numericValue != 0', ctx),
      ).toBe(true);
    });
  });

  // ============ Function Calls ============

  describe('function calls', () => {
    it('evaluates CELL(row, col)', () => {
      const ctx = mockContext();
      // CELL(0, 0) should return rawValue of cell-001 = 10
      expect(evaluate('CELL(0, 0)', ctx)).toBe(10);
    });

    it('evaluates CELL(1, 2)', () => {
      const ctx = mockContext();
      // body[1][2] = cell-006 with rawValue 60
      expect(evaluate('CELL(1, 2)', ctx)).toBe(60);
    });

    it('evaluates CELL out of bounds returns empty', () => {
      const ctx = mockContext();
      expect(evaluate('CELL(99, 99)', ctx)).toBe('');
    });

    it('evaluates TEXT_HEIGHT', () => {
      const ctx = mockContext();
      const result = evaluate('TEXT_HEIGHT("hello", 12)', ctx);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('evaluates TEXT_WIDTH', () => {
      const ctx = mockContext();
      const result = evaluate('TEXT_WIDTH("hello", 12)', ctx);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('evaluates function in comparison', () => {
      const ctx = mockContext();
      // CELL(0, 0) = 10; 10 > 5 = true
      expect(evaluate('CELL(0, 0) > 5', ctx)).toBe(true);
    });

    it('evaluates function with var args', () => {
      const ctx = mockContext({ rawValue: 'test text' });
      const result = evaluate('TEXT_HEIGHT(cell.value, cell.fontSize)', ctx);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });
  });

  // ============ Range Resolution ============

  describe('range resolution', () => {
    it('resolves col:0 range in SUM', () => {
      const ctx = mockContext();
      // Column 0 = cells with rawValue 10, 40, 70 => sum = 120
      const ast = Compiler.compile('SUM(col:0)');
      const result = Evaluator.evaluate(ast, ctx);
      expect(result).toBe(120);
    });

    it('resolves col:1 range in AVG', () => {
      const ctx = mockContext();
      // Column 1 = cells with rawValue 20, 50, 80 => avg = 50
      const ast = Compiler.compile('AVG(col:1)');
      const result = Evaluator.evaluate(ast, ctx);
      expect(result).toBe(50);
    });

    it('resolves row:0 range in SUM', () => {
      const ctx = mockContext();
      // Row 0 = cells with rawValue 10, 20, 30 => sum = 60
      const ast = Compiler.compile('SUM(row:0)');
      const result = Evaluator.evaluate(ast, ctx);
      expect(result).toBe(60);
    });

    it('resolves col:self with context', () => {
      const ctx = mockContext({}, { colIndex: 2 });
      // Column 2 = cells with rawValue 30, 60, 90 => sum = 180
      const ast = Compiler.compile('SUM(col:self)');
      const result = Evaluator.evaluate(ast, ctx);
      expect(result).toBe(180);
    });

    it('resolves row:self with context', () => {
      const ctx = mockContext({}, { rowIndex: 1 });
      // Row 1 = cells with rawValue 40, 50, 60 => sum = 150
      const ast = Compiler.compile('SUM(row:self)');
      const result = Evaluator.evaluate(ast, ctx);
      expect(result).toBe(150);
    });

    it('resolves body range in COUNT', () => {
      const ctx = mockContext();
      // 9 cells total
      const ast = Compiler.compile('COUNT(body)');
      const result = Evaluator.evaluate(ast, ctx);
      expect(result).toBe(9);
    });

    it('resolves body range in SUM', () => {
      const ctx = mockContext();
      // 10+20+30+40+50+60+70+80+90 = 450
      const ast = Compiler.compile('SUM(body)');
      const result = Evaluator.evaluate(ast, ctx);
      expect(result).toBe(450);
    });

    it('resolves MAX on column', () => {
      const ctx = mockContext();
      // Column 0 = 10, 40, 70 => max = 70
      const ast = Compiler.compile('MAX(col:0)');
      const result = Evaluator.evaluate(ast, ctx);
      expect(result).toBe(70);
    });

    it('resolves MIN on row', () => {
      const ctx = mockContext();
      // Row 2 = 70, 80, 90 => min = 70
      const ast = Compiler.compile('MIN(row:2)');
      const result = Evaluator.evaluate(ast, ctx);
      expect(result).toBe(70);
    });

    it('range in comparison: SUM(col:0) > 100', () => {
      const ctx = mockContext();
      // SUM(col:0) = 120 > 100 = true
      const ast = Compiler.compile('SUM(col:0) > 100');
      const result = Evaluator.evaluate(ast, ctx);
      expect(result).toBe(true);
    });

    it('range in comparison: AVG(body) == 50', () => {
      const ctx = mockContext();
      // AVG(body) = 450/9 = 50
      const ast = Compiler.compile('AVG(body) == 50');
      const result = Evaluator.evaluate(ast, ctx);
      expect(result).toBe(true);
    });
  });

  // ============ Object Literals ============

  describe('object literals', () => {
    const ctx = mockContext();

    it('evaluates simple object', () => {
      const result = evaluate('{ x: 42 }', ctx);
      expect(result).toEqual({ x: 42 });
    });

    it('evaluates multi-key object', () => {
      const result = evaluate('{ a: 1, b: "hello" }', ctx);
      expect(result).toEqual({ a: 1, b: 'hello' });
    });

    it('evaluates nested object', () => {
      const result = evaluate('{ style: { color: "red" } }', ctx);
      expect(result).toEqual({ style: { color: 'red' } });
    });

    it('evaluates object with expression values', () => {
      const result = evaluate('{ sum: 2 + 3, flag: true }', ctx);
      expect(result).toEqual({ sum: 5, flag: true });
    });

    it('evaluates result-style object', () => {
      const result = evaluate('{ style: { backgroundColor: "red" }, rowHeightMin: 50 }', ctx);
      expect(result).toEqual({
        style: { backgroundColor: 'red' },
        rowHeightMin: 50,
      });
    });
  });

  // ============ Boolean Coercion ============

  describe('boolean coercion', () => {
    const ctx = mockContext();

    it('coerces 0 to false in AND', () => {
      expect(evaluate('0 AND true', ctx)).toBe(false);
    });

    it('coerces non-zero to true in AND', () => {
      expect(evaluate('1 AND true', ctx)).toBe(true);
    });

    it('coerces empty string to false', () => {
      expect(evaluate('"" OR false', ctx)).toBe(false);
    });

    it('coerces non-empty string to true', () => {
      expect(evaluate('"hello" AND true', ctx)).toBe(true);
    });
  });

  // ============ Edge Cases ============

  describe('edge cases', () => {
    it('handles cell with no layout', () => {
      const ctx = mockContext({});
      // Remove layout from the cell
      (ctx.cell as any).layout = undefined;
      expect(evaluate('cell.width', ctx)).toBe(0);
      expect(evaluate('cell.height', ctx)).toBe(0);
    });

    it('handles cell.overflows with no layout', () => {
      const ctx = mockContext({});
      (ctx.cell as any).layout = undefined;
      expect(evaluate('cell.overflows', ctx)).toBe(false);
    });

    it('handles missing cell in context', () => {
      const ctx = mockContext();
      ctx.cell = undefined;
      expect(evaluate('cell.value', ctx)).toBe('');
    });

    it('handles float arithmetic precision', () => {
      const ctx = mockContext();
      const result = evaluate('0.1 + 0.2', ctx);
      expect(result).toBeCloseTo(0.3);
    });

    it('handles deeply nested expression', () => {
      const ctx = mockContext();
      expect(evaluate('((((1 + 2))))', ctx)).toBe(3);
    });

    it('evaluates empty range SUM to 0', () => {
      const ctx = mockContext();
      // Column 99 doesn't exist, returns empty array
      const ast = Compiler.compile('SUM(col:99)');
      expect(Evaluator.evaluate(ast, ctx)).toBe(0);
    });

    it('evaluates empty range COUNT to 0', () => {
      const ctx = mockContext();
      const ast = Compiler.compile('COUNT(col:99)');
      expect(Evaluator.evaluate(ast, ctx)).toBe(0);
    });

    it('evaluates empty range AVG to 0', () => {
      const ctx = mockContext();
      const ast = Compiler.compile('AVG(col:99)');
      expect(Evaluator.evaluate(ast, ctx)).toBe(0);
    });

    it('MAX of empty range returns 0', () => {
      const ctx = mockContext();
      const ast = Compiler.compile('MAX(col:99)');
      expect(Evaluator.evaluate(ast, ctx)).toBe(0);
    });

    it('MIN of empty range returns 0', () => {
      const ctx = mockContext();
      const ast = Compiler.compile('MIN(col:99)');
      expect(Evaluator.evaluate(ast, ctx)).toBe(0);
    });
  });
});
