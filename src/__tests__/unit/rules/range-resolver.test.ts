import { resolveRangeRef, RangeResolverError } from '../../../rules/expression/range-resolver';
import type { EvalContext } from '../../../rules/types/evaluation.types';
import type { ICell } from '../../../interfaces/core/cell.interface';
import { defaultCellStyle } from '../../../stores/cell-registry.store';

function mockCell(id: string, rawValue: any = ''): ICell {
  return {
    cellID: id,
    inRegion: 'body',
    rawValue,
    style: { ...defaultCellStyle },
    isDynamic: false,
    layout: { row: 0, col: 0, rowSpan: 1, colSpan: 1, x: 0, y: 0, width: 50, height: 20 },
  };
}

function makeContext(overrides: Partial<EvalContext> = {}): EvalContext {
  const body = [
    ['c00', 'c01', 'c02'],
    ['c10', 'c11', 'c12'],
    ['c20', 'c21', 'c22'],
  ];

  const cells: Record<string, ICell> = {};
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const id = body[r][c];
      cells[id] = mockCell(id, r * 10 + c);
    }
  }

  return {
    cell: mockCell('current', 42),
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
    rowIndex: 1,
    colIndex: 1,
    ...overrides,
  };
}

describe('RangeResolver', () => {
  // ============ body notation ============

  describe('body notation', () => {
    it('resolves "body" to all body cells', () => {
      const ctx = makeContext();
      const cells = resolveRangeRef('body', ctx);
      expect(cells).toHaveLength(9);
    });

    it('body cells have correct IDs', () => {
      const ctx = makeContext();
      const cells = resolveRangeRef('body', ctx);
      const ids = cells.map((c) => c.cellID);
      expect(ids).toContain('c00');
      expect(ids).toContain('c22');
    });

    it('body with whitespace is trimmed', () => {
      const ctx = makeContext();
      const cells = resolveRangeRef('  body  ', ctx);
      expect(cells).toHaveLength(9);
    });

    it('body with empty table returns empty', () => {
      const ctx = makeContext();
      (ctx.structureStore as any).getBody = () => [];
      expect(resolveRangeRef('body', ctx)).toEqual([]);
    });

    it('body skips cells not found in registry', () => {
      const ctx = makeContext();
      (ctx.cellRegistry as any).getCellById = () => undefined;
      expect(resolveRangeRef('body', ctx)).toEqual([]);
    });
  });

  // ============ col:N notation ============

  describe('col:N notation', () => {
    it('resolves col:0 to first column', () => {
      const ctx = makeContext();
      const cells = resolveRangeRef('col:0', ctx);
      expect(cells).toHaveLength(3);
      expect(cells.map((c) => c.cellID)).toEqual(['c00', 'c10', 'c20']);
    });

    it('resolves col:2 to last column', () => {
      const ctx = makeContext();
      const cells = resolveRangeRef('col:2', ctx);
      expect(cells.map((c) => c.cellID)).toEqual(['c02', 'c12', 'c22']);
    });

    it('col out of bounds returns empty', () => {
      const ctx = makeContext();
      expect(resolveRangeRef('col:99', ctx)).toEqual([]);
    });

    it('col with negative index returns empty', () => {
      const ctx = makeContext();
      expect(resolveRangeRef('col:-1', ctx)).toEqual([]);
    });

    it('col:NaN throws error', () => {
      const ctx = makeContext();
      expect(() => resolveRangeRef('col:abc', ctx)).toThrow('Invalid column index');
    });
  });

  // ============ col:self notation ============

  describe('col:self notation', () => {
    it('resolves col:self using colIndex from context', () => {
      const ctx = makeContext({ colIndex: 0 });
      const cells = resolveRangeRef('col:self', ctx);
      expect(cells.map((c) => c.cellID)).toEqual(['c00', 'c10', 'c20']);
    });

    it('col:self with colIndex=2', () => {
      const ctx = makeContext({ colIndex: 2 });
      const cells = resolveRangeRef('col:self', ctx);
      expect(cells.map((c) => c.cellID)).toEqual(['c02', 'c12', 'c22']);
    });

    it('col:self without colIndex throws', () => {
      const ctx = makeContext({ colIndex: undefined });
      expect(() => resolveRangeRef('col:self', ctx)).toThrow('requires colIndex');
    });
  });

  // ============ row:N notation ============

  describe('row:N notation', () => {
    it('resolves row:0 to first row', () => {
      const ctx = makeContext();
      const cells = resolveRangeRef('row:0', ctx);
      expect(cells).toHaveLength(3);
      expect(cells.map((c) => c.cellID)).toEqual(['c00', 'c01', 'c02']);
    });

    it('resolves row:2 to last row', () => {
      const ctx = makeContext();
      const cells = resolveRangeRef('row:2', ctx);
      expect(cells.map((c) => c.cellID)).toEqual(['c20', 'c21', 'c22']);
    });

    it('row out of bounds returns empty', () => {
      const ctx = makeContext();
      expect(resolveRangeRef('row:99', ctx)).toEqual([]);
    });

    it('row with negative index returns empty', () => {
      const ctx = makeContext();
      expect(resolveRangeRef('row:-1', ctx)).toEqual([]);
    });

    it('row:NaN throws error', () => {
      const ctx = makeContext();
      expect(() => resolveRangeRef('row:xyz', ctx)).toThrow('Invalid row index');
    });
  });

  // ============ row:self notation ============

  describe('row:self notation', () => {
    it('resolves row:self using rowIndex from context', () => {
      const ctx = makeContext({ rowIndex: 0 });
      const cells = resolveRangeRef('row:self', ctx);
      expect(cells.map((c) => c.cellID)).toEqual(['c00', 'c01', 'c02']);
    });

    it('row:self with rowIndex=2', () => {
      const ctx = makeContext({ rowIndex: 2 });
      const cells = resolveRangeRef('row:self', ctx);
      expect(cells.map((c) => c.cellID)).toEqual(['c20', 'c21', 'c22']);
    });

    it('row:self without rowIndex throws', () => {
      const ctx = makeContext({ rowIndex: undefined });
      expect(() => resolveRangeRef('row:self', ctx)).toThrow('requires rowIndex');
    });
  });

  // ============ self notation ============

  describe('self notation', () => {
    it('resolves "self" using selectionRect', () => {
      const ctx = makeContext({
        selectionRect: { rowStart: 0, colStart: 0, rowEnd: 1, colEnd: 1 },
      });
      const cells = resolveRangeRef('self', ctx);
      expect(cells).toHaveLength(4);
      expect(cells.map((c) => c.cellID)).toEqual(['c00', 'c01', 'c10', 'c11']);
    });

    it('self without selectionRect throws', () => {
      const ctx = makeContext({ selectionRect: undefined });
      expect(() => resolveRangeRef('self', ctx)).toThrow('requires selectionRect');
    });

    it('self with single cell selection', () => {
      const ctx = makeContext({
        selectionRect: { rowStart: 1, colStart: 1, rowEnd: 1, colEnd: 1 },
      });
      const cells = resolveRangeRef('self', ctx);
      expect(cells).toHaveLength(1);
      expect(cells[0].cellID).toBe('c11');
    });
  });

  // ============ rect notation (rNcN:rNcN) ============

  describe('rect notation', () => {
    it('resolves r0c0:r2c2 to all cells', () => {
      const ctx = makeContext();
      const cells = resolveRangeRef('r0c0:r2c2', ctx);
      expect(cells).toHaveLength(9);
    });

    it('resolves r0c0:r0c0 to single cell', () => {
      const ctx = makeContext();
      const cells = resolveRangeRef('r0c0:r0c0', ctx);
      expect(cells).toHaveLength(1);
      expect(cells[0].cellID).toBe('c00');
    });

    it('resolves r1c1:r2c2 to bottom-right quadrant', () => {
      const ctx = makeContext();
      const cells = resolveRangeRef('r1c1:r2c2', ctx);
      expect(cells).toHaveLength(4);
      expect(cells.map((c) => c.cellID)).toEqual(['c11', 'c12', 'c21', 'c22']);
    });

    it('rect exceeding bounds returns what exists', () => {
      const ctx = makeContext();
      const cells = resolveRangeRef('r0c0:r99c99', ctx);
      expect(cells).toHaveLength(9);
    });

    it('rect with large start returns empty', () => {
      const ctx = makeContext();
      const cells = resolveRangeRef('r99c99:r100c100', ctx);
      expect(cells).toEqual([]);
    });

    it('resolves single row rect', () => {
      const ctx = makeContext();
      const cells = resolveRangeRef('r0c0:r0c2', ctx);
      expect(cells).toHaveLength(3);
    });

    it('resolves single column rect', () => {
      const ctx = makeContext();
      const cells = resolveRangeRef('r0c0:r2c0', ctx);
      expect(cells).toHaveLength(3);
    });
  });

  // ============ Unknown notation ============

  describe('unknown notation', () => {
    it('throws on unrecognized notation', () => {
      const ctx = makeContext();
      expect(() => resolveRangeRef('unknown', ctx)).toThrow('Unknown range notation');
    });

    it('throws on empty string', () => {
      const ctx = makeContext();
      expect(() => resolveRangeRef('', ctx)).toThrow('Unknown range notation');
    });

    it('throws on partial rect notation', () => {
      const ctx = makeContext();
      expect(() => resolveRangeRef('r0c0:', ctx)).toThrow('Unknown range notation');
    });

    it('throws on invalid rect format', () => {
      const ctx = makeContext();
      expect(() => resolveRangeRef('r0c0:rXcY', ctx)).toThrow('Unknown range notation');
    });
  });

  // ============ Jagged Body ============

  describe('jagged body array', () => {
    it('handles rows with different column counts', () => {
      const ctx = makeContext();
      (ctx.structureStore as any).getBody = () => [
        ['c00', 'c01'],
        ['c10'],
        ['c20', 'c21', 'c22'],
      ];
      const cells = resolveRangeRef('col:1', ctx);
      // Row 0 has col 1 → c01, Row 1 doesn't have col 1, Row 2 has col 1 → c21
      expect(cells).toHaveLength(2);
    });
  });
});
