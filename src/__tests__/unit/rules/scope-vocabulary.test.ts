import { SCOPE_VOCABULARY, type RuleScope, type PaletteItem } from '../../../rules/expression/scope-vocabulary';
import { Compiler } from '../../../rules/expression/compiler';

describe('ScopeVocabulary', () => {
  const allScopes: RuleScope[] = ['table', 'region', 'column', 'row', 'cell', 'selection'];

  // ============ Structure ============

  describe('structure', () => {
    it('has all 6 scopes', () => {
      expect(Object.keys(SCOPE_VOCABULARY)).toHaveLength(6);
      for (const scope of allScopes) {
        expect(SCOPE_VOCABULARY[scope]).toBeDefined();
      }
    });

    it('each scope has at least 1 palette item', () => {
      for (const scope of allScopes) {
        expect(SCOPE_VOCABULARY[scope].length).toBeGreaterThan(0);
      }
    });

    it('all palette items have label, exprTemplate, returnType', () => {
      for (const scope of allScopes) {
        for (const item of SCOPE_VOCABULARY[scope]) {
          expect(item.label).toBeTruthy();
          expect(item.exprTemplate).toBeTruthy();
          expect(['string', 'number', 'boolean']).toContain(item.returnType);
        }
      }
    });

    it('all palette items have non-empty description', () => {
      for (const scope of allScopes) {
        for (const item of SCOPE_VOCABULARY[scope]) {
          expect(item.description).toBeTruthy();
        }
      }
    });
  });

  // ============ Expression Templates Validity ============

  describe('expression templates are valid syntax', () => {
    for (const scope of allScopes) {
      describe(`scope: ${scope}`, () => {
        const items = SCOPE_VOCABULARY[scope];
        for (const item of items) {
          it(`"${item.exprTemplate}" compiles without error`, () => {
            expect(Compiler.isSyntaxValid(item.exprTemplate)).toBe(true);
          });
        }
      });
    }
  });

  // ============ Scope-Specific Content ============

  describe('table scope', () => {
    const items = SCOPE_VOCABULARY.table;

    it('includes table.rowCount', () => {
      expect(items.some((i) => i.exprTemplate === 'table.rowCount')).toBe(true);
    });

    it('includes table.colCount', () => {
      expect(items.some((i) => i.exprTemplate === 'table.colCount')).toBe(true);
    });

    it('includes SUM(body)', () => {
      expect(items.some((i) => i.exprTemplate === 'SUM(body)')).toBe(true);
    });

    it('includes COUNT(body)', () => {
      expect(items.some((i) => i.exprTemplate === 'COUNT(body)')).toBe(true);
    });

    it('has requiresParams for column-specific items', () => {
      const sumCol = items.find((i) => i.exprTemplate === 'SUM(col:0)');
      expect(sumCol?.requiresParams).toBe(true);
    });
  });

  describe('region scope', () => {
    const items = SCOPE_VOCABULARY.region;

    it('includes cell.value', () => {
      expect(items.some((i) => i.exprTemplate === 'cell.value')).toBe(true);
    });

    it('includes cell.overflows', () => {
      expect(items.some((i) => i.exprTemplate === 'cell.overflows')).toBe(true);
    });

    it('includes cell.fontSize', () => {
      expect(items.some((i) => i.exprTemplate === 'cell.fontSize')).toBe(true);
    });
  });

  describe('column scope', () => {
    const items = SCOPE_VOCABULARY.column;

    it('includes SUM(col:self)', () => {
      expect(items.some((i) => i.exprTemplate === 'SUM(col:self)')).toBe(true);
    });

    it('includes AVG(col:self)', () => {
      expect(items.some((i) => i.exprTemplate === 'AVG(col:self)')).toBe(true);
    });

    it('includes MAX(col:self)', () => {
      expect(items.some((i) => i.exprTemplate === 'MAX(col:self)')).toBe(true);
    });

    it('includes COUNT(col:self)', () => {
      expect(items.some((i) => i.exprTemplate === 'COUNT(col:self)')).toBe(true);
    });
  });

  describe('row scope', () => {
    const items = SCOPE_VOCABULARY.row;

    it('includes SUM(row:self)', () => {
      expect(items.some((i) => i.exprTemplate === 'SUM(row:self)')).toBe(true);
    });

    it('includes AVG(row:self)', () => {
      expect(items.some((i) => i.exprTemplate === 'AVG(row:self)')).toBe(true);
    });

    it('includes COUNT(row:self)', () => {
      expect(items.some((i) => i.exprTemplate === 'COUNT(row:self)')).toBe(true);
    });
  });

  describe('cell scope', () => {
    const items = SCOPE_VOCABULARY.cell;

    it('has the most items', () => {
      // Cell scope should have width, height, fontSize, overflows, plus general ones
      expect(items.length).toBeGreaterThanOrEqual(8);
    });

    it('includes cell.width', () => {
      expect(items.some((i) => i.exprTemplate === 'cell.width')).toBe(true);
    });

    it('includes cell.height', () => {
      expect(items.some((i) => i.exprTemplate === 'cell.height')).toBe(true);
    });

    it('includes TEXT_HEIGHT function', () => {
      expect(items.some((i) => i.exprTemplate.includes('TEXT_HEIGHT'))).toBe(true);
    });

    it('includes CELL function with requiresParams', () => {
      const cellFn = items.find((i) => i.exprTemplate.includes('CELL('));
      expect(cellFn).toBeDefined();
      expect(cellFn?.requiresParams).toBe(true);
    });
  });

  describe('selection scope', () => {
    const items = SCOPE_VOCABULARY.selection;

    it('includes SUM(self)', () => {
      expect(items.some((i) => i.exprTemplate === 'SUM(self)')).toBe(true);
    });

    it('includes COUNT(self)', () => {
      expect(items.some((i) => i.exprTemplate === 'COUNT(self)')).toBe(true);
    });

    it('includes AVG(self)', () => {
      expect(items.some((i) => i.exprTemplate === 'AVG(self)')).toBe(true);
    });
  });

  // ============ Return Type Consistency ============

  describe('return type consistency', () => {
    it('cell.value is string type', () => {
      for (const scope of allScopes) {
        const cellVal = SCOPE_VOCABULARY[scope].find((i) => i.exprTemplate === 'cell.value');
        if (cellVal) expect(cellVal.returnType).toBe('string');
      }
    });

    it('cell.numericValue is number type', () => {
      for (const scope of allScopes) {
        const numVal = SCOPE_VOCABULARY[scope].find((i) => i.exprTemplate === 'cell.numericValue');
        if (numVal) expect(numVal.returnType).toBe('number');
      }
    });

    it('cell.overflows is boolean type', () => {
      for (const scope of allScopes) {
        const overflow = SCOPE_VOCABULARY[scope].find((i) => i.exprTemplate === 'cell.overflows');
        if (overflow) expect(overflow.returnType).toBe('boolean');
      }
    });

    it('all SUM/AVG/MAX/MIN/COUNT are number type', () => {
      for (const scope of allScopes) {
        for (const item of SCOPE_VOCABULARY[scope]) {
          if (['SUM', 'AVG', 'MAX', 'MIN', 'COUNT'].some((fn) => item.exprTemplate.startsWith(fn))) {
            expect(item.returnType).toBe('number');
          }
        }
      }
    });
  });

  // ============ No Duplicates ============

  describe('no duplicate labels per scope', () => {
    for (const scope of allScopes) {
      it(`scope: ${scope} has unique labels`, () => {
        const labels = SCOPE_VOCABULARY[scope].map((i) => i.label);
        expect(new Set(labels).size).toBe(labels.length);
      });
    }
  });
});
