import { Lexer, Token } from '../../../rules/expression/lexer';

describe('Lexer', () => {
  function tokenize(input: string): Token[] {
    return new Lexer(input).tokenize();
  }

  function tokenTypes(input: string): string[] {
    return tokenize(input).map(t => t.type);
  }

  function tokenValues(input: string): (string | number | boolean)[] {
    return tokenize(input).map(t => t.value);
  }

  // ============ Numbers ============

  describe('numbers', () => {
    it('tokenizes integers', () => {
      const tokens = tokenize('42');
      expect(tokens[0]).toMatchObject({ type: 'Number', value: 42 });
    });

    it('tokenizes floats', () => {
      const tokens = tokenize('3.14');
      expect(tokens[0]).toMatchObject({ type: 'Number', value: 3.14 });
    });

    it('tokenizes zero', () => {
      const tokens = tokenize('0');
      expect(tokens[0]).toMatchObject({ type: 'Number', value: 0 });
    });

    it('tokenizes large numbers', () => {
      const tokens = tokenize('999999');
      expect(tokens[0]).toMatchObject({ type: 'Number', value: 999999 });
    });

    it('tokenizes decimal starting with 0', () => {
      const tokens = tokenize('0.5');
      expect(tokens[0]).toMatchObject({ type: 'Number', value: 0.5 });
    });
  });

  // ============ Strings ============

  describe('strings', () => {
    it('tokenizes double-quoted strings', () => {
      const tokens = tokenize('"hello"');
      expect(tokens[0]).toMatchObject({ type: 'String', value: 'hello' });
    });

    it('tokenizes single-quoted strings', () => {
      const tokens = tokenize("'world'");
      expect(tokens[0]).toMatchObject({ type: 'String', value: 'world' });
    });

    it('tokenizes empty strings', () => {
      const tokens = tokenize('""');
      expect(tokens[0]).toMatchObject({ type: 'String', value: '' });
    });

    it('tokenizes strings with spaces', () => {
      const tokens = tokenize('"hello world"');
      expect(tokens[0]).toMatchObject({ type: 'String', value: 'hello world' });
    });

    it('handles escape sequences', () => {
      const tokens = tokenize('"line1\\nline2"');
      expect(tokens[0]).toMatchObject({ type: 'String', value: 'line1\nline2' });
    });

    it('handles escaped quotes', () => {
      const tokens = tokenize('"say \\"hello\\""');
      expect(tokens[0]).toMatchObject({ type: 'String', value: 'say "hello"' });
    });

    it('handles escaped backslash', () => {
      const tokens = tokenize('"a\\\\b"');
      expect(tokens[0]).toMatchObject({ type: 'String', value: 'a\\b' });
    });

    it('throws on unterminated string', () => {
      expect(() => tokenize('"unterminated')).toThrow('Unterminated string');
    });
  });

  // ============ Identifiers ============

  describe('identifiers', () => {
    it('tokenizes simple identifiers', () => {
      const tokens = tokenize('cell');
      expect(tokens[0]).toMatchObject({ type: 'Identifier', value: 'cell' });
    });

    it('tokenizes identifiers with underscores', () => {
      const tokens = tokenize('my_var');
      expect(tokens[0]).toMatchObject({ type: 'Identifier', value: 'my_var' });
    });

    it('tokenizes identifiers starting with underscore', () => {
      const tokens = tokenize('_private');
      expect(tokens[0]).toMatchObject({ type: 'Identifier', value: '_private' });
    });

    it('tokenizes identifiers with digits', () => {
      const tokens = tokenize('var2');
      expect(tokens[0]).toMatchObject({ type: 'Identifier', value: 'var2' });
    });

    it('tokenizes identifiers starting with $', () => {
      const tokens = tokenize('$var');
      expect(tokens[0]).toMatchObject({ type: 'Identifier', value: '$var' });
    });

    it('tokenizes uppercase identifiers', () => {
      const tokens = tokenize('SUM');
      expect(tokens[0]).toMatchObject({ type: 'Identifier', value: 'SUM' });
    });
  });

  // ============ Keywords ============

  describe('keywords', () => {
    it('tokenizes true', () => {
      const tokens = tokenize('true');
      expect(tokens[0]).toMatchObject({ type: 'Keyword', value: 'true' });
    });

    it('tokenizes false', () => {
      const tokens = tokenize('false');
      expect(tokens[0]).toMatchObject({ type: 'Keyword', value: 'false' });
    });

    it('tokenizes null', () => {
      const tokens = tokenize('null');
      expect(tokens[0]).toMatchObject({ type: 'Keyword', value: 'null' });
    });

    it('tokenizes AND', () => {
      const tokens = tokenize('AND');
      expect(tokens[0]).toMatchObject({ type: 'Keyword', value: 'AND' });
    });

    it('tokenizes OR', () => {
      const tokens = tokenize('OR');
      expect(tokens[0]).toMatchObject({ type: 'Keyword', value: 'OR' });
    });

    it('tokenizes NOT', () => {
      const tokens = tokenize('NOT');
      expect(tokens[0]).toMatchObject({ type: 'Keyword', value: 'NOT' });
    });

    it('tokenizes always', () => {
      const tokens = tokenize('always');
      expect(tokens[0]).toMatchObject({ type: 'Keyword', value: 'always' });
    });
  });

  // ============ Operators ============

  describe('operators', () => {
    it('tokenizes comparison operators', () => {
      expect(tokenize('>')[0]).toMatchObject({ type: 'Operator', value: '>' });
      expect(tokenize('<')[0]).toMatchObject({ type: 'Operator', value: '<' });
      expect(tokenize('>=')[0]).toMatchObject({ type: 'Operator', value: '>=' });
      expect(tokenize('<=')[0]).toMatchObject({ type: 'Operator', value: '<=' });
      expect(tokenize('==')[0]).toMatchObject({ type: 'Operator', value: '==' });
      expect(tokenize('!=')[0]).toMatchObject({ type: 'Operator', value: '!=' });
    });

    it('tokenizes strict equality operators', () => {
      expect(tokenize('===')[0]).toMatchObject({ type: 'Operator', value: '===' });
      expect(tokenize('!==')[0]).toMatchObject({ type: 'Operator', value: '!==' });
    });

    it('tokenizes arithmetic operators', () => {
      expect(tokenize('+')[0]).toMatchObject({ type: 'Operator', value: '+' });
      expect(tokenize('-')[0]).toMatchObject({ type: 'Operator', value: '-' });
      expect(tokenize('*')[0]).toMatchObject({ type: 'Operator', value: '*' });
      expect(tokenize('/')[0]).toMatchObject({ type: 'Operator', value: '/' });
      expect(tokenize('%')[0]).toMatchObject({ type: 'Operator', value: '%' });
    });

    it('tokenizes logical operators', () => {
      expect(tokenize('&&')[0]).toMatchObject({ type: 'Operator', value: '&&' });
      expect(tokenize('||')[0]).toMatchObject({ type: 'Operator', value: '||' });
    });

    it('tokenizes power operator', () => {
      expect(tokenize('**')[0]).toMatchObject({ type: 'Operator', value: '**' });
    });
  });

  // ============ Punctuation ============

  describe('punctuation', () => {
    it('tokenizes dot', () => {
      expect(tokenize('.')[0]).toMatchObject({ type: 'Dot', value: '.' });
    });

    it('tokenizes parens', () => {
      expect(tokenize('(')[0]).toMatchObject({ type: 'LParen', value: '(' });
      expect(tokenize(')')[0]).toMatchObject({ type: 'RParen', value: ')' });
    });

    it('tokenizes braces', () => {
      expect(tokenize('{')[0]).toMatchObject({ type: 'LBrace', value: '{' });
      expect(tokenize('}')[0]).toMatchObject({ type: 'RBrace', value: '}' });
    });

    it('tokenizes brackets', () => {
      expect(tokenize('[')[0]).toMatchObject({ type: 'LBracket', value: '[' });
      expect(tokenize(']')[0]).toMatchObject({ type: 'RBracket', value: ']' });
    });

    it('tokenizes colon', () => {
      expect(tokenize(':')[0]).toMatchObject({ type: 'Colon', value: ':' });
    });

    it('tokenizes comma', () => {
      expect(tokenize(',')[0]).toMatchObject({ type: 'Comma', value: ',' });
    });
  });

  // ============ Whitespace ============

  describe('whitespace', () => {
    it('skips spaces', () => {
      const tokens = tokenize('  42  ');
      expect(tokens[0]).toMatchObject({ type: 'Number', value: 42 });
    });

    it('skips tabs', () => {
      const tokens = tokenize('\t42\t');
      expect(tokens[0]).toMatchObject({ type: 'Number', value: 42 });
    });

    it('skips newlines', () => {
      const tokens = tokenize('\n42\n');
      expect(tokens[0]).toMatchObject({ type: 'Number', value: 42 });
    });
  });

  // ============ Complex Expressions ============

  describe('complex expressions', () => {
    it('tokenizes cell.value > 100', () => {
      const types = tokenTypes('cell.value > 100');
      expect(types).toEqual(['Identifier', 'Dot', 'Identifier', 'Operator', 'Number', 'EOF']);
    });

    it('tokenizes SUM(col:0) == 10', () => {
      const types = tokenTypes('SUM(col:0) == 10');
      expect(types).toEqual([
        'Identifier', 'LParen', 'Identifier', 'Colon', 'Number', 'RParen',
        'Operator', 'Number', 'EOF',
      ]);
    });

    it('tokenizes cell.numericValue > AVG(col:self)', () => {
      const types = tokenTypes('cell.numericValue > AVG(col:self)');
      expect(types).toEqual([
        'Identifier', 'Dot', 'Identifier', 'Operator',
        'Identifier', 'LParen', 'Identifier', 'Colon', 'Identifier', 'RParen',
        'EOF',
      ]);
    });

    it('tokenizes compound condition with AND', () => {
      const types = tokenTypes('cell.value > 0 AND cell.value < 100');
      expect(types).toEqual([
        'Identifier', 'Dot', 'Identifier', 'Operator', 'Number',
        'Keyword',
        'Identifier', 'Dot', 'Identifier', 'Operator', 'Number',
        'EOF',
      ]);
    });

    it('tokenizes object literal', () => {
      const types = tokenTypes('{ style: { backgroundColor: "red" } }');
      expect(types).toEqual([
        'LBrace', 'Identifier', 'Colon',
        'LBrace', 'Identifier', 'Colon', 'String', 'RBrace',
        'RBrace', 'EOF',
      ]);
    });

    it('tokenizes function with multiple args', () => {
      const types = tokenTypes('TEXT_HEIGHT(cell.value, cell.fontSize)');
      expect(types).toEqual([
        'Identifier', 'LParen',
        'Identifier', 'Dot', 'Identifier', 'Comma',
        'Identifier', 'Dot', 'Identifier',
        'RParen', 'EOF',
      ]);
    });

    it('tokenizes always keyword', () => {
      const types = tokenTypes('always');
      expect(types).toEqual(['Keyword', 'EOF']);
    });

    it('tokenizes nested function calls', () => {
      const types = tokenTypes('SUM(CELL(0, 1), CELL(0, 2))');
      expect(types).toEqual([
        'Identifier', 'LParen',
        'Identifier', 'LParen', 'Number', 'Comma', 'Number', 'RParen', 'Comma',
        'Identifier', 'LParen', 'Number', 'Comma', 'Number', 'RParen',
        'RParen', 'EOF',
      ]);
    });
  });

  // ============ EOF ============

  describe('EOF', () => {
    it('always ends with EOF', () => {
      const tokens = tokenize('42');
      expect(tokens[tokens.length - 1].type).toBe('EOF');
    });

    it('empty string produces only EOF', () => {
      const tokens = tokenize('');
      expect(tokens).toEqual([{ type: 'EOF', value: '', position: 0 }]);
    });

    it('whitespace-only produces only EOF', () => {
      const tokens = tokenize('   ');
      expect(tokens).toEqual([{ type: 'EOF', value: '', position: 0 }]);
    });
  });

  // ============ Position Tracking ============

  describe('position tracking', () => {
    it('tracks token positions', () => {
      const tokens = tokenize('a + b');
      expect(tokens[0].position).toBe(0); // 'a'
      expect(tokens[1].position).toBe(2); // '+'
      expect(tokens[2].position).toBe(4); // 'b'
    });
  });

  // ============ Error Cases ============

  describe('errors', () => {
    it('throws on unexpected character', () => {
      expect(() => tokenize('~')).toThrow('Unexpected character');
    });

    it('throws on unterminated string', () => {
      expect(() => tokenize("'abc")).toThrow('Unterminated string');
    });
  });
});
