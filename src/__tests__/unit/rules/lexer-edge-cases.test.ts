import { Lexer, Token } from '../../../rules/expression/lexer';

describe('Lexer — Edge Cases', () => {
  function tokenize(input: string): Token[] {
    return new Lexer(input).tokenize();
  }

  function tokenTypes(input: string): string[] {
    return tokenize(input).map((t) => t.type);
  }

  function tokenValues(input: string): (string | number | boolean)[] {
    return tokenize(input).map((t) => t.value);
  }

  // ============ Number Edge Cases ============

  describe('number edge cases', () => {
    it('parses number with multiple dots — scanNumber consumes all digits and dots', () => {
      // "1.2.3" → scanNumber greedily reads "1.2.3" → parseFloat("1.2.3") = 1.2
      // The ".3" is consumed as part of the number string but parseFloat stops at second dot
      const tokens = tokenize('1.2.3');
      // scanNumber reads "1.2.3" as one token, parseFloat("1.2.3") = 1.2
      expect(tokens[0]).toMatchObject({ type: 'Number', value: 1.2 });
      // Since scanNumber consumed all chars "1.2.3", only EOF remains
      expect(tokens[1]).toMatchObject({ type: 'EOF' });
    });

    it('parses very small float', () => {
      expect(tokenize('0.001')[0]).toMatchObject({ type: 'Number', value: 0.001 });
    });

    it('parses very large number', () => {
      expect(tokenize('99999999')[0]).toMatchObject({ type: 'Number', value: 99999999 });
    });

    it('number immediately followed by identifier', () => {
      // "42abc" → Number 42, then Identifier "abc"
      const tokens = tokenize('42abc');
      expect(tokens[0]).toMatchObject({ type: 'Number', value: 42 });
      expect(tokens[1]).toMatchObject({ type: 'Identifier', value: 'abc' });
    });

    it('number followed by paren', () => {
      const tokens = tokenize('42(');
      expect(tokens[0]).toMatchObject({ type: 'Number', value: 42 });
      expect(tokens[1]).toMatchObject({ type: 'LParen', value: '(' });
    });

    it('negative-looking number tokenized as operator + number', () => {
      const tokens = tokenize('-42');
      expect(tokens[0]).toMatchObject({ type: 'Operator', value: '-' });
      expect(tokens[1]).toMatchObject({ type: 'Number', value: 42 });
    });

    it('handles leading dot as Dot token not a number', () => {
      const tokens = tokenize('.5');
      expect(tokens[0]).toMatchObject({ type: 'Dot', value: '.' });
      expect(tokens[1]).toMatchObject({ type: 'Number', value: 5 });
    });
  });

  // ============ String Edge Cases ============

  describe('string edge cases', () => {
    it('handles tab escape in string', () => {
      const tokens = tokenize('"a\\tb"');
      expect(tokens[0]).toMatchObject({ type: 'String', value: 'a\tb' });
    });

    it('handles carriage return escape', () => {
      const tokens = tokenize('"a\\rb"');
      expect(tokens[0]).toMatchObject({ type: 'String', value: 'a\rb' });
    });

    it('handles unknown escape as literal char', () => {
      // \x is not a recognized escape → should just be 'x'
      const tokens = tokenize('"\\x"');
      expect(tokens[0]).toMatchObject({ type: 'String', value: 'x' });
    });

    it('handles single-quoted string with escaped single quote', () => {
      const tokens = tokenize("'it\\'s'");
      expect(tokens[0]).toMatchObject({ type: 'String', value: "it's" });
    });

    it('handles string with unicode content', () => {
      const tokens = tokenize('"héllo"');
      expect(tokens[0]).toMatchObject({ type: 'String', value: 'héllo' });
    });

    it('handles string with numbers inside', () => {
      const tokens = tokenize('"abc123"');
      expect(tokens[0]).toMatchObject({ type: 'String', value: 'abc123' });
    });

    it('handles string with operators inside', () => {
      const tokens = tokenize('"a > b"');
      expect(tokens[0]).toMatchObject({ type: 'String', value: 'a > b' });
    });

    it('handles string with curly braces inside', () => {
      const tokens = tokenize('"{ x: 1 }"');
      expect(tokens[0]).toMatchObject({ type: 'String', value: '{ x: 1 }' });
    });

    it('handles consecutive strings', () => {
      const tokens = tokenize('"a" "b"');
      expect(tokens[0]).toMatchObject({ type: 'String', value: 'a' });
      expect(tokens[1]).toMatchObject({ type: 'String', value: 'b' });
    });

    it('throws on unterminated single-quoted string at EOF', () => {
      expect(() => tokenize("'incomplete")).toThrow('Unterminated string');
    });

    it('handles empty single-quoted string', () => {
      const tokens = tokenize("''");
      expect(tokens[0]).toMatchObject({ type: 'String', value: '' });
    });

    it('handles string with only escaped characters', () => {
      const tokens = tokenize('"\\n\\t\\r"');
      expect(tokens[0]).toMatchObject({ type: 'String', value: '\n\t\r' });
    });
  });

  // ============ Identifier Edge Cases ============

  describe('identifier edge cases', () => {
    it('identifier with $ in middle', () => {
      expect(tokenize('a$b')[0]).toMatchObject({ type: 'Identifier', value: 'a$b' });
    });

    it('all-caps identifier not a keyword', () => {
      // CELLS is not a keyword (AND, OR, NOT are)
      expect(tokenize('CELLS')[0]).toMatchObject({ type: 'Identifier', value: 'CELLS' });
    });

    it('keyword-like prefixes are identifiers', () => {
      // "truthy" starts with "true" but is not the keyword
      expect(tokenize('truthy')[0]).toMatchObject({ type: 'Identifier', value: 'truthy' });
    });

    it('"falsey" is an identifier not a keyword', () => {
      expect(tokenize('falsey')[0]).toMatchObject({ type: 'Identifier', value: 'falsey' });
    });

    it('"nullable" is an identifier not a keyword', () => {
      expect(tokenize('nullable')[0]).toMatchObject({ type: 'Identifier', value: 'nullable' });
    });

    it('"ANDROID" is an identifier not a keyword', () => {
      expect(tokenize('ANDROID')[0]).toMatchObject({ type: 'Identifier', value: 'ANDROID' });
    });

    it('"ORACLE" is an identifier not a keyword', () => {
      expect(tokenize('ORACLE')[0]).toMatchObject({ type: 'Identifier', value: 'ORACLE' });
    });

    it('single char identifier', () => {
      expect(tokenize('x')[0]).toMatchObject({ type: 'Identifier', value: 'x' });
    });

    it('very long identifier', () => {
      const long = 'a'.repeat(200);
      expect(tokenize(long)[0]).toMatchObject({ type: 'Identifier', value: long });
    });
  });

  // ============ Operator Disambiguation ============

  describe('operator disambiguation', () => {
    it('"==" is not two "=" tokens', () => {
      const tokens = tokenize('==');
      expect(tokens).toHaveLength(2); // == + EOF
      expect(tokens[0]).toMatchObject({ type: 'Operator', value: '==' });
    });

    it('"===" is not "==" + "="', () => {
      const tokens = tokenize('===');
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toMatchObject({ type: 'Operator', value: '===' });
    });

    it('"!=" is one token', () => {
      const tokens = tokenize('!=');
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toMatchObject({ type: 'Operator', value: '!=' });
    });

    it('"!==" is one token', () => {
      const tokens = tokenize('!==');
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toMatchObject({ type: 'Operator', value: '!==' });
    });

    it('"!" standalone is an operator', () => {
      const tokens = tokenize('!');
      expect(tokens[0]).toMatchObject({ type: 'Operator', value: '!' });
    });

    it('"=" standalone is an operator', () => {
      const tokens = tokenize('=');
      expect(tokens[0]).toMatchObject({ type: 'Operator', value: '=' });
    });

    it('">>" is two ">" tokens', () => {
      const tokens = tokenize('>>');
      expect(tokens[0]).toMatchObject({ type: 'Operator', value: '>' });
      expect(tokens[1]).toMatchObject({ type: 'Operator', value: '>' });
    });

    it('"<<" is two "<" tokens', () => {
      const tokens = tokenize('<<');
      expect(tokens[0]).toMatchObject({ type: 'Operator', value: '<' });
      expect(tokens[1]).toMatchObject({ type: 'Operator', value: '<' });
    });

    it('"**" is a single power operator', () => {
      const tokens = tokenize('**');
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toMatchObject({ type: 'Operator', value: '**' });
    });

    it('">=" scans as one token, not ">" + "="', () => {
      const tokens = tokenize('>=');
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toMatchObject({ type: 'Operator', value: '>=' });
    });

    it('"<=" scans as one token', () => {
      const tokens = tokenize('<=');
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toMatchObject({ type: 'Operator', value: '<=' });
    });
  });

  // ============ Position Tracking Edge Cases ============

  describe('position tracking edge cases', () => {
    it('tracks positions across multi-char operators', () => {
      // "a >= b" → a(0), >=(2), b(5)
      const tokens = tokenize('a >= b');
      expect(tokens[0].position).toBe(0);
      expect(tokens[1].position).toBe(2);
      expect(tokens[2].position).toBe(5);
    });

    it('tracks positions with strings', () => {
      const tokens = tokenize('"hi" + 5');
      expect(tokens[0].position).toBe(0);
      expect(tokens[1].position).toBe(5);
      expect(tokens[2].position).toBe(7);
    });

    it('EOF position is at end of input', () => {
      const tokens = tokenize('abc');
      const eof = tokens[tokens.length - 1];
      expect(eof.type).toBe('EOF');
      expect(eof.position).toBe(3);
    });

    it('tracks position with triple-char operator', () => {
      // "a === b" → a(0), ===(2), b(6)
      const tokens = tokenize('a === b');
      expect(tokens[0].position).toBe(0);
      expect(tokens[1].position).toBe(2);
      expect(tokens[2].position).toBe(6);
    });
  });

  // ============ Whitespace Edge Cases ============

  describe('whitespace edge cases', () => {
    it('handles mixed whitespace', () => {
      const tokens = tokenize(' \t\n 42 \t\n ');
      expect(tokens[0]).toMatchObject({ type: 'Number', value: 42 });
    });

    it('handles carriage return + newline', () => {
      const tokens = tokenize('a\r\nb');
      expect(tokens[0]).toMatchObject({ type: 'Identifier', value: 'a' });
      expect(tokens[1]).toMatchObject({ type: 'Identifier', value: 'b' });
    });

    it('trims leading/trailing whitespace from input', () => {
      const tokens = tokenize('   true   ');
      expect(tokens[0]).toMatchObject({ type: 'Keyword', value: 'true' });
      expect(tokens).toHaveLength(2); // true + EOF
    });
  });

  // ============ Complex Tokenization Edge Cases ============

  describe('complex tokenization', () => {
    it('tokenizes chained comparisons', () => {
      const types = tokenTypes('a > b > c');
      expect(types).toEqual(['Identifier', 'Operator', 'Identifier', 'Operator', 'Identifier', 'EOF']);
    });

    it('tokenizes nested parens and braces', () => {
      const types = tokenTypes('(({[]}))');
      expect(types).toEqual(['LParen', 'LParen', 'LBrace', 'LBracket', 'RBracket', 'RBrace', 'RParen', 'RParen', 'EOF']);
    });

    it('tokenizes expression with all token types', () => {
      const input = 'SUM(col:0) >= 100 AND true != { x: "hello" }';
      const types = tokenTypes(input);
      expect(types).toContain('Identifier');
      expect(types).toContain('LParen');
      expect(types).toContain('Colon');
      expect(types).toContain('Number');
      expect(types).toContain('RParen');
      expect(types).toContain('Operator');
      expect(types).toContain('Keyword');
      expect(types).toContain('LBrace');
      expect(types).toContain('String');
      expect(types).toContain('RBrace');
    });

    it('handles no space between operator and operand', () => {
      const tokens = tokenize('5+3');
      expect(tokens[0]).toMatchObject({ type: 'Number', value: 5 });
      expect(tokens[1]).toMatchObject({ type: 'Operator', value: '+' });
      expect(tokens[2]).toMatchObject({ type: 'Number', value: 3 });
    });

    it('handles no space around comparison', () => {
      const tokens = tokenize('x>5');
      expect(tokens[0]).toMatchObject({ type: 'Identifier', value: 'x' });
      expect(tokens[1]).toMatchObject({ type: 'Operator', value: '>' });
      expect(tokens[2]).toMatchObject({ type: 'Number', value: 5 });
    });

    it('tokenizes r0c0:r2c3 range notation', () => {
      const types = tokenTypes('r0c0:r2c3');
      // r0c0 is one identifier, : is Colon, r2c3 is another identifier
      expect(types).toEqual(['Identifier', 'Colon', 'Identifier', 'EOF']);
    });

    it('tokenizes negative number in expression', () => {
      const types = tokenTypes('x > -5');
      expect(types).toEqual(['Identifier', 'Operator', 'Operator', 'Number', 'EOF']);
    });
  });

  // ============ Error Edge Cases ============

  describe('error edge cases', () => {
    it('throws on @ character', () => {
      expect(() => tokenize('@')).toThrow('Unexpected character');
    });

    it('throws on # character', () => {
      expect(() => tokenize('#')).toThrow('Unexpected character');
    });

    it('throws on ^ character', () => {
      expect(() => tokenize('^')).toThrow('Unexpected character');
    });

    it('throws on backtick', () => {
      expect(() => tokenize('`template`')).toThrow('Unexpected character');
    });

    it('error includes position info', () => {
      try {
        tokenize('abc ~');
        fail('Should have thrown');
      } catch (err: any) {
        expect(err.message).toContain('position');
      }
    });
  });
});
