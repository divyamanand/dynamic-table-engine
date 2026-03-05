import { Lexer } from '../../../rules/expression/lexer';
import { Parser, ParseError } from '../../../rules/expression/parser';
import type { ExprNode } from '../../../rules/expression/ast.types';

describe('Parser — Edge Cases', () => {
  function parse(input: string): ExprNode {
    const tokens = new Lexer(input).tokenize();
    return new Parser(tokens).parse();
  }

  // ============ Null Literal ============

  describe('null literal', () => {
    it('parses null keyword', () => {
      const ast = parse('null');
      expect(ast).toEqual({ type: 'Literal', value: null });
    });

    it('null in comparison', () => {
      const ast = parse('cell.value == null');
      expect(ast.type).toBe('BinaryOp');
      expect((ast as any).right).toEqual({ type: 'Literal', value: null });
    });

    it('null in object literal value', () => {
      const ast = parse('{ x: null }');
      expect(ast.type).toBe('ObjectLiteral');
      const props = (ast as any).properties as Map<string, ExprNode>;
      expect(props.get('x')).toEqual({ type: 'Literal', value: null });
    });
  });

  // ============ NOT Operator Edge Cases ============

  describe('NOT operator', () => {
    it('NOT with variable', () => {
      const ast = parse('NOT cell.overflows');
      expect(ast.type).toBe('UnaryOp');
      expect((ast as any).op).toBe('NOT');
      expect((ast as any).operand).toEqual({ type: 'Var', path: 'cell.overflows' });
    });

    it('NOT with parenthesized expression', () => {
      const ast = parse('NOT (a AND b)');
      expect(ast.type).toBe('UnaryOp');
      expect((ast as any).op).toBe('NOT');
      expect((ast as any).operand.type).toBe('BinaryOp');
      expect((ast as any).operand.op).toBe('AND');
    });

    it('double NOT', () => {
      const ast = parse('NOT NOT true');
      expect(ast.type).toBe('UnaryOp');
      expect((ast as any).op).toBe('NOT');
      expect((ast as any).operand.type).toBe('UnaryOp');
      expect((ast as any).operand.op).toBe('NOT');
    });

    it('NOT in compound expression', () => {
      const ast = parse('NOT a OR b');
      // NOT binds tighter than OR → (NOT a) OR b
      expect(ast.type).toBe('BinaryOp');
      expect((ast as any).op).toBe('OR');
      expect((ast as any).left.type).toBe('UnaryOp');
      expect((ast as any).left.op).toBe('NOT');
    });

    it('NOT combined with AND', () => {
      const ast = parse('NOT a AND NOT b');
      // (NOT a) AND (NOT b)
      expect((ast as any).op).toBe('AND');
      expect((ast as any).left.type).toBe('UnaryOp');
      expect((ast as any).right.type).toBe('UnaryOp');
    });

    it('NOT with comparison', () => {
      const ast = parse('NOT x > 5');
      // NOT binds tighter than > in unary precedence
      // NOT x > 5 → (NOT x) > 5
      expect(ast.type).toBe('BinaryOp');
      expect((ast as any).op).toBe('>');
      expect((ast as any).left.type).toBe('UnaryOp');
    });

    it('NOT with function call', () => {
      const ast = parse('NOT SUM(col:0) > 100');
      // (NOT SUM(col:0)) > 100
      expect(ast.type).toBe('BinaryOp');
    });
  });

  // ============ Unary Minus Edge Cases ============

  describe('unary minus edge cases', () => {
    it('double unary minus', () => {
      const ast = parse('--5');
      expect(ast.type).toBe('UnaryOp');
      expect((ast as any).op).toBe('-');
      expect((ast as any).operand.type).toBe('UnaryOp');
      expect((ast as any).operand.op).toBe('-');
    });

    it('unary minus on function result', () => {
      const ast = parse('-SUM(col:0)');
      expect(ast.type).toBe('UnaryOp');
      expect((ast as any).op).toBe('-');
      expect((ast as any).operand.type).toBe('FnCall');
    });

    it('unary minus in binary expression', () => {
      const ast = parse('5 + -3');
      expect(ast.type).toBe('BinaryOp');
      expect((ast as any).op).toBe('+');
      expect((ast as any).right.type).toBe('UnaryOp');
      expect((ast as any).right.op).toBe('-');
    });

    it('unary minus in comparison', () => {
      const ast = parse('x > -10');
      expect((ast as any).right.type).toBe('UnaryOp');
      expect((ast as any).right.operand).toEqual({ type: 'Literal', value: 10 });
    });
  });

  // ============ Range Ref Edge Cases ============

  describe('range ref edge cases', () => {
    it('parses body as RangeRef', () => {
      const ast = parse('body');
      expect(ast).toEqual({ type: 'RangeRef', notation: 'body' });
    });

    it('parses self as RangeRef', () => {
      const ast = parse('self');
      expect(ast).toEqual({ type: 'RangeRef', notation: 'self' });
    });

    it('parses col:0 as RangeRef', () => {
      const ast = parse('col:0');
      expect(ast).toEqual({ type: 'RangeRef', notation: 'col:0' });
    });

    it('parses col:self as RangeRef', () => {
      const ast = parse('col:self');
      expect(ast).toEqual({ type: 'RangeRef', notation: 'col:self' });
    });

    it('parses row:3 as RangeRef', () => {
      const ast = parse('row:3');
      expect(ast).toEqual({ type: 'RangeRef', notation: 'row:3' });
    });

    it('parses row:self as RangeRef', () => {
      const ast = parse('row:self');
      expect(ast).toEqual({ type: 'RangeRef', notation: 'row:self' });
    });

    it('range ref inside function call', () => {
      const ast = parse('SUM(col:0)');
      expect(ast.type).toBe('FnCall');
      expect((ast as any).args[0]).toEqual({ type: 'RangeRef', notation: 'col:0' });
    });

    it('body range inside function', () => {
      const ast = parse('COUNT(body)');
      expect(ast.type).toBe('FnCall');
      expect((ast as any).args[0]).toEqual({ type: 'RangeRef', notation: 'body' });
    });

    it('self range inside function', () => {
      const ast = parse('SUM(self)');
      expect(ast.type).toBe('FnCall');
      expect((ast as any).args[0]).toEqual({ type: 'RangeRef', notation: 'self' });
    });

    it('multiple range refs in function args', () => {
      // Not typical but should parse
      const ast = parse('FN(col:0, row:1)');
      expect((ast as any).args[0]).toEqual({ type: 'RangeRef', notation: 'col:0' });
      expect((ast as any).args[1]).toEqual({ type: 'RangeRef', notation: 'row:1' });
    });
  });

  // ============ Dot Notation Edge Cases ============

  describe('dot notation edge cases', () => {
    it('single level dot path', () => {
      expect(parse('a.b')).toEqual({ type: 'Var', path: 'a.b' });
    });

    it('three levels deep', () => {
      expect(parse('a.b.c')).toEqual({ type: 'Var', path: 'a.b.c' });
    });

    it('four levels deep', () => {
      expect(parse('a.b.c.d')).toEqual({ type: 'Var', path: 'a.b.c.d' });
    });

    it('dot notation in binary expression', () => {
      const ast = parse('cell.value == table.colCount');
      expect((ast as any).left).toEqual({ type: 'Var', path: 'cell.value' });
      expect((ast as any).right).toEqual({ type: 'Var', path: 'table.colCount' });
    });

    it('throws on dot followed by number', () => {
      expect(() => parse('cell.0')).toThrow();
    });

    it('throws on trailing dot', () => {
      expect(() => parse('cell.')).toThrow();
    });
  });

  // ============ Object Literal Edge Cases ============

  describe('object literal edge cases', () => {
    it('empty object', () => {
      const ast = parse('{}');
      expect(ast.type).toBe('ObjectLiteral');
      expect((ast as any).properties.size).toBe(0);
    });

    it('object with string key', () => {
      const ast = parse('{ "key": 42 }');
      const props = (ast as any).properties as Map<string, ExprNode>;
      expect(props.get('key')).toEqual({ type: 'Literal', value: 42 });
    });

    it('nested objects three deep', () => {
      const ast = parse('{ a: { b: { c: 1 } } }');
      const props = (ast as any).properties as Map<string, ExprNode>;
      const nested1 = props.get('a')!;
      expect(nested1.type).toBe('ObjectLiteral');
      const nested2 = (nested1 as any).properties.get('b')!;
      expect(nested2.type).toBe('ObjectLiteral');
      expect((nested2 as any).properties.get('c')).toEqual({ type: 'Literal', value: 1 });
    });

    it('object with boolean values', () => {
      const ast = parse('{ bold: true, italic: false }');
      const props = (ast as any).properties as Map<string, ExprNode>;
      expect(props.get('bold')).toEqual({ type: 'Literal', value: true });
      expect(props.get('italic')).toEqual({ type: 'Literal', value: false });
    });

    it('object with expression value using binary op', () => {
      const ast = parse('{ x: 2 + 3 }');
      const props = (ast as any).properties as Map<string, ExprNode>;
      const val = props.get('x')!;
      expect(val.type).toBe('BinaryOp');
      expect((val as any).op).toBe('+');
    });

    it('object with function call value', () => {
      const ast = parse('{ height: TEXT_HEIGHT("hello", 12) }');
      const props = (ast as any).properties as Map<string, ExprNode>;
      expect(props.get('height')!.type).toBe('FnCall');
    });

    it('object with multiple trailing comma', () => {
      // Only one trailing comma is supported before }
      const ast = parse('{ a: 1, b: 2, }');
      const props = (ast as any).properties as Map<string, ExprNode>;
      expect(props.size).toBe(2);
    });

    it('object with variable value', () => {
      const ast = parse('{ val: cell.value }');
      const props = (ast as any).properties as Map<string, ExprNode>;
      expect(props.get('val')).toEqual({ type: 'Var', path: 'cell.value' });
    });
  });

  // ============ Function Call Edge Cases ============

  describe('function call edge cases', () => {
    it('function with expression argument', () => {
      const ast = parse('FN(1 + 2)');
      expect(ast.type).toBe('FnCall');
      expect((ast as any).args[0].type).toBe('BinaryOp');
    });

    it('function with comparison argument', () => {
      const ast = parse('FN(x > 5)');
      expect(ast.type).toBe('FnCall');
      expect((ast as any).args[0].type).toBe('BinaryOp');
      expect((ast as any).args[0].op).toBe('>');
    });

    it('function with many args', () => {
      const ast = parse('FN(1, 2, 3, 4, 5)');
      expect((ast as any).args).toHaveLength(5);
    });

    it('function call as argument to function', () => {
      const ast = parse('MAX(SUM(col:0), SUM(col:1))');
      expect(ast.type).toBe('FnCall');
      expect((ast as any).name).toBe('MAX');
      expect((ast as any).args[0].type).toBe('FnCall');
      expect((ast as any).args[1].type).toBe('FnCall');
    });

    it('function in arithmetic expression', () => {
      const ast = parse('SUM(col:0) + SUM(col:1)');
      expect(ast.type).toBe('BinaryOp');
      expect((ast as any).op).toBe('+');
      expect((ast as any).left.type).toBe('FnCall');
      expect((ast as any).right.type).toBe('FnCall');
    });

    it('function with negative argument', () => {
      const ast = parse('FN(-5)');
      expect((ast as any).args[0].type).toBe('UnaryOp');
    });

    it('function with string argument', () => {
      const ast = parse('COLUMN("Name")');
      expect((ast as any).args[0]).toEqual({ type: 'Literal', value: 'Name' });
    });
  });

  // ============ Operator Associativity ============

  describe('operator associativity', () => {
    it('subtraction is left-associative: a - b - c = (a - b) - c', () => {
      const ast = parse('10 - 3 - 2');
      // Should be ((10 - 3) - 2)
      expect((ast as any).op).toBe('-');
      expect((ast as any).left.op).toBe('-');
      expect((ast as any).left.left).toEqual({ type: 'Literal', value: 10 });
      expect((ast as any).left.right).toEqual({ type: 'Literal', value: 3 });
      expect((ast as any).right).toEqual({ type: 'Literal', value: 2 });
    });

    it('division is left-associative: a / b / c = (a / b) / c', () => {
      const ast = parse('24 / 4 / 2');
      expect((ast as any).op).toBe('/');
      expect((ast as any).left.op).toBe('/');
    });

    it('OR is left-associative', () => {
      const ast = parse('a OR b OR c');
      expect((ast as any).op).toBe('OR');
      expect((ast as any).left.op).toBe('OR');
    });

    it('mixed precedence with all levels', () => {
      // NOT a OR b AND c > d + e * f
      // Precedence: NOT > * > + > > > AND > OR
      // = (NOT a) OR ((b) AND ((c) > ((d) + ((e) * (f)))))
      const ast = parse('NOT a OR b AND c > d + e * f');
      expect((ast as any).op).toBe('OR');
    });
  });

  // ============ Error Cases Edge Cases ============

  describe('error edge cases', () => {
    it('throws on standalone operator', () => {
      expect(() => parse('>')).toThrow();
    });

    it('throws on double + operators (+ is not unary)', () => {
      // parseUnary only handles NOT and -, so + at unary position fails
      expect(() => parse('5 + + 5')).toThrow();
    });

    it('throws on operator at end', () => {
      expect(() => parse('5 +')).toThrow();
    });

    it('throws on missing expression in parens', () => {
      expect(() => parse('()')).toThrow();
    });

    it('throws on unmatched closing paren', () => {
      expect(() => parse(')')).toThrow();
    });

    it('throws on unmatched closing brace', () => {
      expect(() => parse('}')).toThrow();
    });

    it('throws with position info', () => {
      try {
        parse('(42');
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ParseError);
        expect((err as ParseError).position).toBeDefined();
      }
    });

    it('throws on object with missing value', () => {
      expect(() => parse('{ x: }')).toThrow();
    });

    it('throws on object with numeric key', () => {
      expect(() => parse('{ 42: "val" }')).toThrow();
    });

    it('throws on consecutive identifiers without operator', () => {
      expect(() => parse('a b')).toThrow();
    });

    it('throws on consecutive numbers', () => {
      expect(() => parse('42 42')).toThrow();
    });
  });

  // ============ Real-World Complex Expressions ============

  describe('real-world complex expressions', () => {
    it('parses: SUM(col:self) > AVG(col:self) * 2', () => {
      const ast = parse('SUM(col:self) > AVG(col:self) * 2');
      expect(ast.type).toBe('BinaryOp');
      expect((ast as any).op).toBe('>');
      expect((ast as any).left.type).toBe('FnCall');
      expect((ast as any).right.op).toBe('*');
    });

    it('parses: NOT cell.overflows AND cell.numericValue > 0', () => {
      const ast = parse('NOT cell.overflows AND cell.numericValue > 0');
      // NOT has higher precedence than AND
      // (NOT cell.overflows) AND (cell.numericValue > 0)
      expect((ast as any).op).toBe('AND');
    });

    it('parses: cell.value == "Total" OR cell.value == "Sum" OR cell.value == "Average"', () => {
      const ast = parse('cell.value == "Total" OR cell.value == "Sum" OR cell.value == "Average"');
      // Left-associative OR
      expect((ast as any).op).toBe('OR');
      expect((ast as any).left.op).toBe('OR');
    });

    it('parses: { style: { backgroundColor: "red", bold: true }, rowHeightMin: TEXT_HEIGHT(cell.value, cell.fontSize) }', () => {
      const ast = parse(
        '{ style: { backgroundColor: "red", bold: true }, rowHeightMin: TEXT_HEIGHT(cell.value, cell.fontSize) }',
      );
      expect(ast.type).toBe('ObjectLiteral');
      const props = (ast as any).properties as Map<string, ExprNode>;
      expect(props.size).toBe(2);
      expect(props.get('style')!.type).toBe('ObjectLiteral');
      expect(props.get('rowHeightMin')!.type).toBe('FnCall');
    });

    it('parses: (cell.numericValue - AVG(col:self)) / (MAX(col:self) - MIN(col:self))', () => {
      const ast = parse('(cell.numericValue - AVG(col:self)) / (MAX(col:self) - MIN(col:self))');
      expect(ast.type).toBe('BinaryOp');
      expect((ast as any).op).toBe('/');
    });
  });
});
