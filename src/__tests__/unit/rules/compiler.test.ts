import { Compiler, tryCompile } from '../../../rules/expression/compiler';

describe('Compiler', () => {
  // ============ compile() ============

  describe('compile()', () => {
    it('compiles a simple expression', () => {
      const ast = Compiler.compile('42');
      expect(ast).toEqual({ type: 'Literal', value: 42 });
    });

    it('compiles a complex expression', () => {
      const ast = Compiler.compile('cell.value > 100');
      expect(ast.type).toBe('BinaryOp');
    });

    it('throws on invalid syntax', () => {
      expect(() => Compiler.compile('>')).toThrow();
    });

    it('throws on empty string', () => {
      expect(() => Compiler.compile('')).toThrow('Expression must be a non-empty string');
    });

    it('throws on null/undefined input', () => {
      expect(() => Compiler.compile(null as any)).toThrow('Expression must be a non-empty string');
      expect(() => Compiler.compile(undefined as any)).toThrow('Expression must be a non-empty string');
    });

    it('throws on non-string input', () => {
      expect(() => Compiler.compile(123 as any)).toThrow('Expression must be a non-empty string');
    });
  });

  // ============ validate() ============

  describe('validate()', () => {
    it('validates a correct expression', () => {
      const result = Compiler.validate('42 > 10');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates a complex correct expression', () => {
      const result = Compiler.validate('cell.value > 0 AND SUM(x) == 10');
      expect(result.valid).toBe(true);
    });

    it('reports error for invalid expression', () => {
      const result = Compiler.validate('>');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('reports error for unclosed paren', () => {
      const result = Compiler.validate('(42');
      expect(result.valid).toBe(false);
    });

    it('reports error for empty string', () => {
      const result = Compiler.validate('');
      expect(result.valid).toBe(false);
    });

    it('validates object literals', () => {
      const result = Compiler.validate('{ style: { color: "red" } }');
      expect(result.valid).toBe(true);
    });

    it('validates function calls', () => {
      const result = Compiler.validate('SUM(col:0)');
      expect(result.valid).toBe(true);
    });

    it('validates always keyword', () => {
      const result = Compiler.validate('always');
      expect(result.valid).toBe(true);
    });
  });

  // ============ isSyntaxValid() ============

  describe('isSyntaxValid()', () => {
    it('returns true for valid expressions', () => {
      expect(Compiler.isSyntaxValid('42')).toBe(true);
      expect(Compiler.isSyntaxValid('cell.value > 100')).toBe(true);
      expect(Compiler.isSyntaxValid('SUM(x) == 10')).toBe(true);
      expect(Compiler.isSyntaxValid('always')).toBe(true);
      expect(Compiler.isSyntaxValid('true AND false')).toBe(true);
    });

    it('returns false for invalid expressions', () => {
      expect(Compiler.isSyntaxValid('')).toBe(false);
      expect(Compiler.isSyntaxValid('>')).toBe(false);
      expect(Compiler.isSyntaxValid('(42')).toBe(false);
      expect(Compiler.isSyntaxValid('{ x:')).toBe(false);
    });
  });

  // ============ tryCompile() ============

  describe('tryCompile()', () => {
    it('returns AST for valid expression', () => {
      const ast = tryCompile('42');
      expect(ast).not.toBeNull();
      expect(ast).toEqual({ type: 'Literal', value: 42 });
    });

    it('returns null for invalid expression', () => {
      expect(tryCompile('>')).toBeNull();
      expect(tryCompile('')).toBeNull();
      expect(tryCompile('((')).toBeNull();
    });
  });

  // ============ compileMultiple() ============

  describe('compileMultiple()', () => {
    it('compiles multiple valid expressions', () => {
      const result = Compiler.compileMultiple(['42', 'true', 'x > 5']);
      expect(result.asts).toHaveLength(3);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('reports errors by index', () => {
      const result = Compiler.compileMultiple(['42', '>', 'x > 5', '((']);
      expect(result.asts).toHaveLength(2); // only valid ones
      expect(result.errors[1]).toBeDefined();
      expect(result.errors[3]).toBeDefined();
    });

    it('handles empty array', () => {
      const result = Compiler.compileMultiple([]);
      expect(result.asts).toHaveLength(0);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });

  // ============ Real-world Condition Expressions ============

  describe('real-world conditions', () => {
    const validConditions = [
      'always',
      'true',
      'cell.value > 100',
      'cell.numericValue == 0',
      'cell.overflows',
      'cell.value != ""',
      'cell.numericValue > 0 AND cell.numericValue < 100',
      'SUM(col:0) == 10',
      'AVG(col:self) > 50',
      'COUNT(body) > 0',
      'cell.fontSize > 8',
      'cell.width < 20',
      'CELL(0, 0) == "header"',
      'table.rowCount > 5',
      'table.colCount >= 3',
      'cell.value == "Total" OR cell.value == "Sum"',
    ];

    validConditions.forEach((expr) => {
      it(`compiles: ${expr}`, () => {
        expect(() => Compiler.compile(expr)).not.toThrow();
      });
    });
  });

  // ============ Real-world Result Expressions ============

  describe('real-world results', () => {
    const validResults = [
      '{ style: { backgroundColor: "red" } }',
      '{ style: { color: "#ff0000", bold: true } }',
      '{ rowHeightMin: 50 }',
      '{ style: { fontSize: 8 } }',
      '{ style: { textAlign: "center" } }',
      '{ rowHeightMin: TEXT_HEIGHT(cell.value, cell.fontSize) }',
    ];

    validResults.forEach((expr) => {
      it(`compiles: ${expr}`, () => {
        expect(() => Compiler.compile(expr)).not.toThrow();
      });
    });
  });
});
