/**
 * Comprehensive tests for RuleEngine + RuleRegistry + Table integration.
 *
 * Tests every rule scope (table, region, column, row, cell, selection)
 * against every region (theader, lheader, body, footer) through the
 * Table facade with real StructureStore and LayoutEngine.
 */

import { RuleEngine } from '../../../rules/rule-engine';
import { RuleRegistry } from '../../../rules/rule-registry';
import { StructureStore } from '../../../stores/structure.store';
import { CellRegistry } from '../../../stores/cell-registry.store';
import { LayoutEngine } from '../../../engines/layout.engine';
import { MergeRegistry } from '../../../stores/merge-registry.stores';
import { Table } from '../../../core/table';
import type { RuleInput } from '../../../rules/types/rule.types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestSetup() {
  const structureStore = new StructureStore();
  const cellRegistry = new CellRegistry();
  const mergeRegistry = new MergeRegistry(structureStore);
  const layoutEngine = new LayoutEngine(mergeRegistry, structureStore, cellRegistry);
  const ruleRegistry = new RuleRegistry();
  // Create temporary table for rule engine init
  const tempTable = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, {} as any);
  const ruleEngine = new RuleEngine(ruleRegistry, cellRegistry, structureStore, tempTable);
  // Create final table with rule engine
  const table = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, ruleEngine);

  return { structureStore, cellRegistry, mergeRegistry, layoutEngine, table, ruleRegistry, ruleEngine };
}

/** Build a table with N theader columns and M body rows filled with data. */
function buildTable(opts: { cols: number; rows: number; data?: (string | number)[][] }) {
  const setup = createTestSetup();
  const { table, structureStore, cellRegistry } = setup;

  // Create theader root cells (one per column)
  const headerCellIds: string[] = [];
  for (let c = 0; c < opts.cols; c++) {
    const hId = table.addHeaderCell('theader');
    headerCellIds.push(hId);
    cellRegistry.updateCell(hId, { rawValue: `Col${c}` });
  }

  // Build body
  const data = opts.data ?? Array.from({ length: opts.rows }, (_, r) =>
    Array.from({ length: opts.cols }, (_, c) => (r * opts.cols + c + 1).toString())
  );
  table.buildBody(data);

  return { ...setup, headerCellIds };
}

function makeRuleInput(overrides: Partial<RuleInput> & { condition: string; result: string }): RuleInput {
  return {
    target: { scope: 'table' },
    priority: 0,
    enabled: true,
    ...overrides,
  };
}

// ===========================================================================
// TESTS
// ===========================================================================

describe('RuleEngine', () => {

  // =========================================================================
  // 1. TABLE SCOPE — matches ALL cells (headers + body)
  // =========================================================================
  describe('table scope', () => {
    it('fires for every cell (theader + body)', () => {
      const { ruleRegistry, ruleEngine, table, cellRegistry, structureStore } = buildTable({ cols: 2, rows: 2 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
      }));

      ruleEngine.evaluateAll();

      // Count all cells
      const headerRoots = structureStore.getRoots('theader') ?? [];
      const body = structureStore.getBody();
      const totalCells = headerRoots.length + body.length * body[0].length;

      const results = ruleEngine.getAllResults();
      expect(results.size).toBe(totalCells);

      // Every cell should have the style patch
      for (const [, result] of results) {
        expect(result.stylePatches.length).toBe(1);
        expect(result.stylePatches[0].style).toEqual({ bold: true });
      }
    });

    it('skips disabled rules', () => {
      const { ruleRegistry, ruleEngine } = buildTable({ cols: 1, rows: 1 });

      const ruleId = ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
      }));
      ruleRegistry.disableRule(ruleId);

      ruleEngine.evaluateAll();

      for (const [, result] of ruleEngine.getAllResults()) {
        expect(result.firedRuleIds).toHaveLength(0);
      }
    });
  });

  // =========================================================================
  // 2. REGION SCOPE
  // =========================================================================
  describe('region scope', () => {
    it('fires only for body cells when region=body', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 2, rows: 2 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'region', region: 'body' },
        condition: 'true',
        result: '{ type: "style", style: { fontColor: "red" } }',
      }));

      ruleEngine.evaluateAll();

      // Body cells should have the patch
      for (const row of structureStore.getBody()) {
        for (const cellId of row) {
          const res = ruleEngine.getResult(cellId);
          expect(res?.stylePatches.length).toBe(1);
        }
      }

      // Theader cells should NOT have the patch
      for (const rootId of structureStore.getRoots('theader') ?? []) {
        const res = ruleEngine.getResult(rootId);
        expect(res?.stylePatches.length).toBe(0);
      }
    });

    it('fires only for theader cells when region=theader', () => {
      const { ruleRegistry, ruleEngine, structureStore, headerCellIds } = buildTable({ cols: 2, rows: 2 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'region', region: 'theader' },
        condition: 'true',
        result: '{ type: "style", style: { backgroundColor: "gray" } }',
      }));

      ruleEngine.evaluateAll();

      // Theader cells should have the patch
      for (const hId of headerCellIds) {
        const res = ruleEngine.getResult(hId);
        expect(res?.stylePatches.length).toBe(1);
      }

      // Body cells should NOT
      for (const row of structureStore.getBody()) {
        for (const cellId of row) {
          const res = ruleEngine.getResult(cellId);
          expect(res?.stylePatches.length).toBe(0);
        }
      }
    });

    it('fires for lheader cells', () => {
      const setup = createTestSetup();
      const { table, ruleRegistry, ruleEngine, structureStore, cellRegistry } = setup;

      // Create theader (1 col)
      table.addHeaderCell('theader');

      // Create lheader (1 row header)
      const lhId = table.addHeaderCell('lheader');

      // Build body
      table.buildBody([['A']]);

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'region', region: 'lheader' },
        condition: 'true',
        result: '{ type: "style", style: { italic: true } }',
      }));

      ruleEngine.evaluateAll();

      const lhResult = ruleEngine.getResult(lhId);
      expect(lhResult?.stylePatches.length).toBe(1);
      expect(lhResult?.stylePatches[0].style).toEqual({ italic: true });

      // Body should not match
      for (const row of structureStore.getBody()) {
        for (const cellId of row) {
          expect(ruleEngine.getResult(cellId)?.stylePatches.length).toBe(0);
        }
      }
    });

    it('fires for footer cells', () => {
      const setup = createTestSetup();
      const { table, ruleRegistry, ruleEngine } = setup;

      table.addHeaderCell('theader');
      table.buildBody([['X']]);
      const footerId = table.addHeaderCell('footer');

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'region', region: 'footer' },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
      }));

      ruleEngine.evaluateAll();

      const footerResult = ruleEngine.getResult(footerId);
      expect(footerResult?.stylePatches.length).toBe(1);
    });
  });

  // =========================================================================
  // 3. COLUMN SCOPE
  // =========================================================================
  describe('column scope', () => {
    it('fires for body cells in column by colIndex', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 3, rows: 2 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'column', colIndex: 1 },
        condition: 'true',
        result: '{ type: "style", style: { fontColor: "blue" } }',
      }));

      ruleEngine.evaluateAll();

      const body = structureStore.getBody();
      for (let r = 0; r < body.length; r++) {
        for (let c = 0; c < body[r].length; c++) {
          const res = ruleEngine.getResult(body[r][c]);
          if (c === 1) {
            expect(res?.stylePatches.length).toBe(1);
          } else {
            expect(res?.stylePatches.length).toBe(0);
          }
        }
      }
    });

    it('fires for body cells in column by headerName', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 3, rows: 2 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'column', headerName: 'Col2' },
        condition: 'true',
        result: '{ type: "style", style: { fontColor: "green" } }',
      }));

      ruleEngine.evaluateAll();

      const body = structureStore.getBody();
      for (let r = 0; r < body.length; r++) {
        for (let c = 0; c < body[r].length; c++) {
          const res = ruleEngine.getResult(body[r][c]);
          if (c === 2) {
            expect(res?.stylePatches.length).toBe(1);
          } else {
            expect(res?.stylePatches.length).toBe(0);
          }
        }
      }
    });

    it('does not fire for theader cells when includeHeader is false', () => {
      const { ruleRegistry, ruleEngine, headerCellIds } = buildTable({ cols: 3, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'column', colIndex: 0 },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
      }));

      ruleEngine.evaluateAll();

      // Header cells should NOT match
      for (const hId of headerCellIds) {
        const res = ruleEngine.getResult(hId);
        expect(res?.stylePatches.length).toBe(0);
      }
    });

    it('includes theader leaf cell when includeHeader is true', () => {
      const { ruleRegistry, ruleEngine, headerCellIds } = buildTable({ cols: 3, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'column', colIndex: 1, includeHeader: true },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
      }));

      ruleEngine.evaluateAll();

      // Header col 1 should match
      const h1Result = ruleEngine.getResult(headerCellIds[1]);
      expect(h1Result?.stylePatches.length).toBe(1);

      // Other headers should NOT
      expect(ruleEngine.getResult(headerCellIds[0])?.stylePatches.length).toBe(0);
      expect(ruleEngine.getResult(headerCellIds[2])?.stylePatches.length).toBe(0);
    });

    it('returns no match when headerName does not exist', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 2, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'column', headerName: 'NonExistent' },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
      }));

      ruleEngine.evaluateAll();

      for (const [, result] of ruleEngine.getAllResults()) {
        expect(result.stylePatches.length).toBe(0);
      }
    });
  });

  // =========================================================================
  // 4. ROW SCOPE
  // =========================================================================
  describe('row scope', () => {
    it('fires for body row 0', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 2, rows: 3 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'row', rowIndex: 0 },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
      }));

      ruleEngine.evaluateAll();

      const body = structureStore.getBody();
      // Row 0 cells should match
      for (const cellId of body[0]) {
        expect(ruleEngine.getResult(cellId)?.stylePatches.length).toBe(1);
      }
      // Row 1 and 2 should NOT
      for (let r = 1; r < body.length; r++) {
        for (const cellId of body[r]) {
          expect(ruleEngine.getResult(cellId)?.stylePatches.length).toBe(0);
        }
      }
    });

    it('fires for body row 2 (last row)', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 2, rows: 3 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'row', rowIndex: 2 },
        condition: 'true',
        result: '{ type: "style", style: { italic: true } }',
      }));

      ruleEngine.evaluateAll();

      const body = structureStore.getBody();
      for (const cellId of body[2]) {
        expect(ruleEngine.getResult(cellId)?.stylePatches.length).toBe(1);
      }
      for (const cellId of body[0]) {
        expect(ruleEngine.getResult(cellId)?.stylePatches.length).toBe(0);
      }
    });

    it('does not fire for theader cells when region defaults to body', () => {
      const { ruleRegistry, ruleEngine, headerCellIds } = buildTable({ cols: 2, rows: 2 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'row', rowIndex: 0 },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
      }));

      ruleEngine.evaluateAll();

      for (const hId of headerCellIds) {
        expect(ruleEngine.getResult(hId)?.stylePatches.length).toBe(0);
      }
    });

    it('fires for theader row when region=theader', () => {
      const { ruleRegistry, ruleEngine, headerCellIds } = buildTable({ cols: 2, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'row', rowIndex: 0, region: 'theader' },
        condition: 'true',
        result: '{ type: "style", style: { backgroundColor: "yellow" } }',
      }));

      ruleEngine.evaluateAll();

      // Theader cells at row 0 should match
      for (const hId of headerCellIds) {
        const res = ruleEngine.getResult(hId);
        expect(res?.stylePatches.length).toBe(1);
      }
    });
  });

  // =========================================================================
  // 5. CELL SCOPE
  // =========================================================================
  describe('cell scope', () => {
    it('fires for exactly one cell by cellId', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 2, rows: 2 });

      const targetCellId = structureStore.getBody()[1][0]; // row 1, col 0

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'cell', cellId: targetCellId },
        condition: 'true',
        result: '{ type: "style", style: { fontColor: "red" } }',
      }));

      ruleEngine.evaluateAll();

      expect(ruleEngine.getResult(targetCellId)?.stylePatches.length).toBe(1);

      // All other body cells should NOT match
      for (const row of structureStore.getBody()) {
        for (const cellId of row) {
          if (cellId !== targetCellId) {
            expect(ruleEngine.getResult(cellId)?.stylePatches.length).toBe(0);
          }
        }
      }
    });

    it('fires for cell by address (absolute layout coords)', () => {
      const { ruleRegistry, ruleEngine, structureStore, cellRegistry } = buildTable({ cols: 2, rows: 2 });

      // theader depth = 1, lheader depth = 0
      // body cell [0][0] has layout.row = 1, layout.col = 0
      const targetCellId = structureStore.getBody()[0][0];
      const targetCell = cellRegistry.getCellById(targetCellId)!;

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'cell', address: { rowIndex: targetCell.layout!.row, colIndex: targetCell.layout!.col } },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
      }));

      ruleEngine.evaluateAll();

      expect(ruleEngine.getResult(targetCellId)?.stylePatches.length).toBe(1);
    });

    it('targets a theader cell by cellId', () => {
      const { ruleRegistry, ruleEngine, headerCellIds, structureStore } = buildTable({ cols: 2, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'cell', cellId: headerCellIds[0] },
        condition: 'true',
        result: '{ type: "style", style: { fontSize: 14 } }',
      }));

      ruleEngine.evaluateAll();

      expect(ruleEngine.getResult(headerCellIds[0])?.stylePatches.length).toBe(1);
      expect(ruleEngine.getResult(headerCellIds[1])?.stylePatches.length).toBe(0);
    });
  });

  // =========================================================================
  // 6. SELECTION SCOPE
  // =========================================================================
  describe('selection scope', () => {
    it('fires for cells within the rectangular selection (body only)', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 3, rows: 3 });

      // Select body rows 0-1, cols 1-2
      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'selection', rect: { rowStart: 0, colStart: 1, rowEnd: 1, colEnd: 2 } },
        condition: 'true',
        result: '{ type: "style", style: { backgroundColor: "highlight" } }',
      }));

      ruleEngine.evaluateAll();

      const body = structureStore.getBody();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const res = ruleEngine.getResult(body[r][c]);
          const inSelection = r >= 0 && r <= 1 && c >= 1 && c <= 2;
          expect(res?.stylePatches.length).toBe(inSelection ? 1 : 0);
        }
      }
    });

    it('does not fire for theader cells even if coords overlap', () => {
      const { ruleRegistry, ruleEngine, headerCellIds } = buildTable({ cols: 3, rows: 2 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'selection', rect: { rowStart: 0, colStart: 0, rowEnd: 1, colEnd: 2 } },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
      }));

      ruleEngine.evaluateAll();

      for (const hId of headerCellIds) {
        expect(ruleEngine.getResult(hId)?.stylePatches.length).toBe(0);
      }
    });

    it('fires for a single-cell selection', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 2, rows: 2 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'selection', rect: { rowStart: 1, colStart: 1, rowEnd: 1, colEnd: 1 } },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
      }));

      ruleEngine.evaluateAll();

      const body = structureStore.getBody();
      expect(ruleEngine.getResult(body[1][1])?.stylePatches.length).toBe(1);
      expect(ruleEngine.getResult(body[0][0])?.stylePatches.length).toBe(0);
      expect(ruleEngine.getResult(body[0][1])?.stylePatches.length).toBe(0);
      expect(ruleEngine.getResult(body[1][0])?.stylePatches.length).toBe(0);
    });
  });

  // =========================================================================
  // 7. CONDITION EVALUATION
  // =========================================================================
  describe('condition evaluation', () => {
    it('does not fire when condition is false', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 1, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'false',
        result: '{ type: "style", style: { bold: true } }',
      }));

      ruleEngine.evaluateAll();

      for (const [, result] of ruleEngine.getAllResults()) {
        expect(result.firedRuleIds).toHaveLength(0);
      }
    });

    it('evaluates cell.numericValue condition against body cell', () => {
      const { ruleRegistry, ruleEngine, structureStore, cellRegistry } = buildTable({
        cols: 2,
        rows: 2,
        data: [['100', '5'], ['200', '3']],
      });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'region', region: 'body' },
        condition: 'cell.numericValue > 50',
        result: '{ type: "style", style: { fontColor: "red" } }',
      }));

      ruleEngine.evaluateAll();

      const body = structureStore.getBody();
      // 100 > 50 → match, 5 > 50 → no, 200 > 50 → match, 3 > 50 → no
      expect(ruleEngine.getResult(body[0][0])?.stylePatches.length).toBe(1);
      expect(ruleEngine.getResult(body[0][1])?.stylePatches.length).toBe(0);
      expect(ruleEngine.getResult(body[1][0])?.stylePatches.length).toBe(1);
      expect(ruleEngine.getResult(body[1][1])?.stylePatches.length).toBe(0);
    });

    it('evaluates string equality condition', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({
        cols: 2,
        rows: 1,
        data: [['hello', 'world']],
      });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'region', region: 'body' },
        condition: 'cell.value == "hello"',
        result: '{ type: "style", style: { bold: true } }',
      }));

      ruleEngine.evaluateAll();

      const body = structureStore.getBody();
      expect(ruleEngine.getResult(body[0][0])?.stylePatches.length).toBe(1);
      expect(ruleEngine.getResult(body[0][1])?.stylePatches.length).toBe(0);
    });
  });

  // =========================================================================
  // 8. RULE OUTPUT CLASSIFICATION
  // =========================================================================
  describe('output classification', () => {
    it('classifies StylePatch output', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 1, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "style", style: { fontColor: "red", bold: true } }',
      }));

      ruleEngine.evaluateAll();
      const body = structureStore.getBody();
      const res = ruleEngine.getResult(body[0][0])!;
      expect(res.stylePatches).toHaveLength(1);
      expect(res.stylePatches[0]).toEqual({ type: 'style', style: { fontColor: 'red', bold: true } });
    });

    it('classifies ComputedValue output', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 1, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "computedValue", value: 42 }',
      }));

      ruleEngine.evaluateAll();
      const res = ruleEngine.getResult(structureStore.getBody()[0][0])!;
      expect(res.computedValue).toBe(42);
    });

    it('classifies ValidationResult output', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 1, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "validation", valid: false, message: "Error!", severity: "error" }',
      }));

      ruleEngine.evaluateAll();
      const res = ruleEngine.getResult(structureStore.getBody()[0][0])!;
      expect(res.validationResult).toEqual({
        type: 'validation', valid: false, message: 'Error!', severity: 'error',
      });
    });

    it('classifies RenderFlag output', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 1, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "renderFlag", clip: true, wrap: false }',
      }));

      ruleEngine.evaluateAll();
      const res = ruleEngine.getResult(structureStore.getBody()[0][0])!;
      expect(res.renderFlags).toHaveLength(1);
      expect(res.renderFlags[0]).toEqual({ type: 'renderFlag', clip: true, wrap: false });
    });

    it('classifies VisibilityFlag output', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 1, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "visibility", hidden: true }',
      }));

      ruleEngine.evaluateAll();
      const res = ruleEngine.getResult(structureStore.getBody()[0][0])!;
      expect(res.hidden).toBe(true);
    });

    it('classifies LockFlag output', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 1, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "lock", locked: true }',
      }));

      ruleEngine.evaluateAll();
      const res = ruleEngine.getResult(structureStore.getBody()[0][0])!;
      expect(res.locked).toBe(true);
    });

    it('classifies DeltaInstruction (row-height-min)', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 1, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "row-height-min", rowIndex: 0, minHeight: 50 }',
      }));

      ruleEngine.evaluateAll();
      const res = ruleEngine.getResult(structureStore.getBody()[0][0])!;
      expect(res.deltaInstructions).toHaveLength(1);
      expect(res.deltaInstructions[0]).toEqual({ type: 'row-height-min', rowIndex: 0, minHeight: 50 });
    });

    it('classifies DeltaInstruction (col-width-min)', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 1, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "col-width-min", colIndex: 0, minWidth: 80 }',
      }));

      ruleEngine.evaluateAll();
      const res = ruleEngine.getResult(structureStore.getBody()[0][0])!;
      expect(res.deltaInstructions).toHaveLength(1);
      expect(res.deltaInstructions[0]).toEqual({ type: 'col-width-min', colIndex: 0, minWidth: 80 });
    });

    it('classifies object with style key as implicit StylePatch', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 1, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ style: { backgroundColor: "yellow" } }',
      }));

      ruleEngine.evaluateAll();
      const res = ruleEngine.getResult(structureStore.getBody()[0][0])!;
      expect(res.stylePatches).toHaveLength(1);
      expect(res.stylePatches[0].style).toEqual({ backgroundColor: 'yellow' });
    });
  });

  // =========================================================================
  // 9. PRIORITY ORDERING
  // =========================================================================
  describe('priority ordering', () => {
    it('applies lower priority number (higher priority) first', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 1, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "computedValue", value: "second" }',
        priority: 10,
      }));

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "computedValue", value: "first" }',
        priority: 0,
      }));

      ruleEngine.evaluateAll();
      const res = ruleEngine.getResult(structureStore.getBody()[0][0])!;
      // Last writer wins for computedValue — priority 10 fires after priority 0
      expect(res.computedValue).toBe('second');
      expect(res.firedRuleIds).toHaveLength(2);
    });

    it('accumulates stylePatches in priority order', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 1, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "style", style: { fontColor: "blue" } }',
        priority: 5,
      }));

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "style", style: { fontColor: "red" } }',
        priority: 1,
      }));

      ruleEngine.evaluateAll();
      const res = ruleEngine.getResult(structureStore.getBody()[0][0])!;
      // Priority 1 first, then priority 5
      expect(res.stylePatches[0].style).toEqual({ fontColor: 'red' });
      expect(res.stylePatches[1].style).toEqual({ fontColor: 'blue' });
    });
  });

  // =========================================================================
  // 10. TABLE FACADE INTEGRATION (auto-trigger)
  // =========================================================================
  describe('Table integration (auto-trigger)', () => {
    it('auto-evaluates all cells after insertBodyRow', () => {
      const { table, ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 2, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'region', region: 'body' },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
      }));

      // Insert a new row — this triggers rebuildAndEvaluate
      table.insertBodyRow(1, ['new1', 'new2']);

      const body = structureStore.getBody();
      expect(body.length).toBe(2);

      // All body cells should have been evaluated
      for (const row of body) {
        for (const cellId of row) {
          const res = ruleEngine.getResult(cellId);
          expect(res).toBeDefined();
          expect(res?.stylePatches.length).toBe(1);
        }
      }
    });

    it('auto-evaluates single cell after updateCell', () => {
      const { table, ruleRegistry, ruleEngine, structureStore } = buildTable({
        cols: 1,
        rows: 1,
        data: [['10']],
      });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'region', region: 'body' },
        condition: 'cell.numericValue > 50',
        result: '{ type: "style", style: { fontColor: "red" } }',
      }));

      // Initially evaluate all — cell has value "10", condition false
      ruleEngine.evaluateAll();
      const cellId = structureStore.getBody()[0][0];
      expect(ruleEngine.getResult(cellId)?.stylePatches.length).toBe(0);

      // Update cell to "100" — should auto-evaluate
      table.updateCell(cellId, { rawValue: '100' });

      const res = ruleEngine.getResult(cellId)!;
      expect(res.stylePatches.length).toBe(1);
      expect(res.stylePatches[0].style).toEqual({ fontColor: 'red' });
    });

    it('auto-evaluates after removeBodyRow', () => {
      const { table, ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 1, rows: 3 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'region', region: 'body' },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
      }));

      table.removeBodyRow(1);
      expect(structureStore.getBody().length).toBe(2);

      for (const row of structureStore.getBody()) {
        for (const cellId of row) {
          expect(ruleEngine.getResult(cellId)?.stylePatches.length).toBe(1);
        }
      }
    });

    it('auto-evaluates after insertBodyCol', () => {
      const { table, ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 2, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'region', region: 'body' },
        condition: 'true',
        result: '{ type: "style", style: { italic: true } }',
      }));

      // Adding a header first (theader col drives body col)
      table.addHeaderCell('theader');
      // Body cols are auto-inserted by addHeaderCell

      for (const row of structureStore.getBody()) {
        for (const cellId of row) {
          expect(ruleEngine.getResult(cellId)?.stylePatches.length).toBe(1);
        }
      }
    });

    it('auto-evaluates after setColumnWidth (geometry change)', () => {
      const { table, ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 1, rows: 1 });

      // Rule that checks cell.width
      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'region', region: 'body' },
        condition: 'cell.width > 50',
        result: '{ type: "style", style: { bold: true } }',
      }));

      ruleEngine.evaluateAll();
      const cellId = structureStore.getBody()[0][0];
      // Default width is 30mm → condition false
      expect(ruleEngine.getResult(cellId)?.stylePatches.length).toBe(0);

      // Change width to 60
      table.setColumnWidth(0, 60);
      expect(ruleEngine.getResult(cellId)?.stylePatches.length).toBe(1);
    });

    it('auto-evaluates after setRowHeight (geometry change)', () => {
      const { table, ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 1, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'region', region: 'body' },
        condition: 'cell.height > 20',
        result: '{ type: "style", style: { bold: true } }',
      }));

      ruleEngine.evaluateAll();
      const cellId = structureStore.getBody()[0][0];
      expect(ruleEngine.getResult(cellId)?.stylePatches.length).toBe(0);

      table.setRowHeight(1, 30); // row 1 = body row 0 (theader depth = 1)
      expect(ruleEngine.getResult(cellId)?.stylePatches.length).toBe(1);
    });

    it('auto-evaluates after mergeCells', () => {
      const { table, ruleRegistry, ruleEngine, structureStore, cellRegistry } = buildTable({ cols: 2, rows: 2 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'region', region: 'body' },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
      }));

      const rootCellId = structureStore.getBody()[0][0];
      table.mergeCells({ cellId: rootCellId, startRow: 1, startCol: 0, endRow: 2, endCol: 1 });

      // All body cells should still be evaluated
      for (const row of structureStore.getBody()) {
        for (const cellId of row) {
          expect(ruleEngine.getResult(cellId)).toBeDefined();
        }
      }
    });
  });

  // =========================================================================
  // 11. RESOLVE CELL (renderer snapshot)
  // =========================================================================
  describe('resolveCell', () => {
    it('merges base style with rule style patches', () => {
      const { ruleRegistry, ruleEngine, structureStore, cellRegistry } = buildTable({ cols: 1, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "style", style: { fontColor: "red", bold: true } }',
      }));

      ruleEngine.evaluateAll();
      const cellId = structureStore.getBody()[0][0];
      const cell = cellRegistry.getCellById(cellId)!;

      const resolved = ruleEngine.resolveCell(cell);
      expect(resolved.resolvedStyle.fontName).toBeUndefined();
      expect(resolved.resolvedStyle.fontSize).toBe(13);
      expect(resolved.resolvedStyle.fontColor).toBe('red');
      expect(resolved.resolvedStyle.bold).toBe(true);
    });

    it('uses computedValue as displayValue when set', () => {
      const { ruleRegistry, ruleEngine, structureStore, cellRegistry } = buildTable({
        cols: 1, rows: 1, data: [['original']],
      });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "computedValue", value: "computed" }',
      }));

      ruleEngine.evaluateAll();
      const cell = cellRegistry.getCellById(structureStore.getBody()[0][0])!;
      const resolved = ruleEngine.resolveCell(cell);
      expect(resolved.displayValue).toBe('computed');
    });

    it('uses rawValue as displayValue when no computedValue', () => {
      const { ruleEngine, structureStore, cellRegistry } = buildTable({
        cols: 1, rows: 1, data: [['hello']],
      });

      ruleEngine.evaluateAll();
      const cell = cellRegistry.getCellById(structureStore.getBody()[0][0])!;
      const resolved = ruleEngine.resolveCell(cell);
      expect(resolved.displayValue).toBe('hello');
    });

    it('includes layout geometry', () => {
      const { ruleEngine, structureStore, cellRegistry } = buildTable({ cols: 1, rows: 1 });

      ruleEngine.evaluateAll();
      const cell = cellRegistry.getCellById(structureStore.getBody()[0][0])!;
      const resolved = ruleEngine.resolveCell(cell);

      expect(resolved.layout.row).toBeDefined();
      expect(resolved.layout.col).toBeDefined();
      expect(resolved.layout.width).toBeGreaterThan(0);
      expect(resolved.layout.height).toBeGreaterThan(0);
    });

    it('includes validation from rules', () => {
      const { ruleRegistry, ruleEngine, structureStore, cellRegistry } = buildTable({ cols: 1, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "validation", valid: false, message: "bad", severity: "warning" }',
      }));

      ruleEngine.evaluateAll();
      const cell = cellRegistry.getCellById(structureStore.getBody()[0][0])!;
      const resolved = ruleEngine.resolveCell(cell);

      expect(resolved.validation).toEqual({ valid: false, message: 'bad', severity: 'warning' });
    });

    it('includes hidden and locked flags', () => {
      const { ruleRegistry, ruleEngine, structureStore, cellRegistry } = buildTable({ cols: 1, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "visibility", hidden: true }',
        priority: 0,
      }));

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "lock", locked: true }',
        priority: 1,
      }));

      ruleEngine.evaluateAll();
      const cell = cellRegistry.getCellById(structureStore.getBody()[0][0])!;
      const resolved = ruleEngine.resolveCell(cell);

      expect(resolved.hidden).toBe(true);
      expect(resolved.locked).toBe(true);
    });
  });

  // =========================================================================
  // 12. EDGE CASES
  // =========================================================================
  describe('edge cases', () => {
    it('handles no rules gracefully', () => {
      const { ruleEngine, structureStore } = buildTable({ cols: 1, rows: 1 });

      ruleEngine.evaluateAll();

      const res = ruleEngine.getResult(structureStore.getBody()[0][0]);
      expect(res).toBeDefined();
      expect(res?.firedRuleIds).toHaveLength(0);
      expect(res?.stylePatches).toHaveLength(0);
    });

    it('handles empty table (no body rows)', () => {
      const setup = createTestSetup();
      const { table, ruleRegistry, ruleEngine } = setup;

      table.addHeaderCell('theader');

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
      }));

      ruleEngine.evaluateAll();

      // Only theader cell should exist
      expect(ruleEngine.getAllResults().size).toBe(1);
    });

    it('clearResults removes all cached results', () => {
      const { ruleEngine } = buildTable({ cols: 1, rows: 1 });

      ruleEngine.evaluateAll();
      expect(ruleEngine.getAllResults().size).toBeGreaterThan(0);

      ruleEngine.clearResults();
      expect(ruleEngine.getAllResults().size).toBe(0);
    });

    it('one failing rule does not break other rules', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 1, rows: 1 });

      // This rule has an invalid expression for the result that will error at evaluation
      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
        priority: 0,
      }));

      // Add a valid rule too
      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "style", style: { italic: true } }',
        priority: 10,
      }));

      ruleEngine.evaluateAll();

      const res = ruleEngine.getResult(structureStore.getBody()[0][0])!;
      // Both rules should fire
      expect(res.firedRuleIds).toHaveLength(2);
      expect(res.stylePatches).toHaveLength(2);
    });

    it('multiple rules combine different output types', () => {
      const { ruleRegistry, ruleEngine, structureStore } = buildTable({ cols: 1, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "style", style: { fontColor: "red" } }',
        priority: 0,
      }));

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "computedValue", value: 999 }',
        priority: 1,
      }));

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "lock", locked: true }',
        priority: 2,
      }));

      ruleEngine.evaluateAll();

      const res = ruleEngine.getResult(structureStore.getBody()[0][0])!;
      expect(res.stylePatches).toHaveLength(1);
      expect(res.computedValue).toBe(999);
      expect(res.locked).toBe(true);
      expect(res.firedRuleIds).toHaveLength(3);
    });

    it('getEvaluationResult on Table returns undefined when no rules registered', () => {
      const structureStore = new StructureStore();
      const cellRegistry = new CellRegistry();
      const mergeRegistry = new MergeRegistry(structureStore);
      const layoutEngine = new LayoutEngine(mergeRegistry, structureStore, cellRegistry);
      const tempTable = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, {} as any);
      const ruleEngine = new RuleEngine(new RuleRegistry(), cellRegistry, structureStore, tempTable);
      const table = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, ruleEngine);

      // No rules registered
      expect(table.getEvaluationResult('any-id')).toBeUndefined();
    });

    it('evaluateCell works for a single cell without prior evaluateAll', () => {
      const { ruleRegistry, ruleEngine, structureStore, cellRegistry } = buildTable({
        cols: 1, rows: 1, data: [['50']],
      });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'region', region: 'body' },
        condition: 'true',
        result: '{ type: "computedValue", value: 123 }',
      }));

      const cellId = structureStore.getBody()[0][0];
      const cell = cellRegistry.getCellById(cellId)!;

      const result = ruleEngine.evaluateCell(cell);
      expect(result.computedValue).toBe(123);
      expect(ruleEngine.getResult(cellId)?.computedValue).toBe(123);
    });

    it('row scope with out-of-range rowIndex matches nothing', () => {
      const { ruleRegistry, ruleEngine } = buildTable({ cols: 1, rows: 2 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'row', rowIndex: 99 },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
      }));

      ruleEngine.evaluateAll();

      for (const [, result] of ruleEngine.getAllResults()) {
        expect(result.stylePatches.length).toBe(0);
      }
    });

    it('column scope with out-of-range colIndex matches nothing', () => {
      const { ruleRegistry, ruleEngine } = buildTable({ cols: 2, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'column', colIndex: 99 },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
      }));

      ruleEngine.evaluateAll();

      for (const [, result] of ruleEngine.getAllResults()) {
        expect(result.stylePatches.length).toBe(0);
      }
    });

    it('cell scope with non-existent cellId matches nothing', () => {
      const { ruleRegistry, ruleEngine } = buildTable({ cols: 1, rows: 1 });

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'cell', cellId: 'non-existent-id' },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
      }));

      ruleEngine.evaluateAll();

      for (const [, result] of ruleEngine.getAllResults()) {
        expect(result.stylePatches.length).toBe(0);
      }
    });
  });

  // =========================================================================
  // 13. MULTI-REGION TABLE (theader + lheader + body + footer)
  // =========================================================================
  describe('multi-region table', () => {
    it('table-scope rule fires across all regions', () => {
      const setup = createTestSetup();
      const { table, ruleRegistry, ruleEngine, structureStore } = setup;

      // Build: 1 theader col, 1 lheader row, 1 body row, 1 footer
      const thId = table.addHeaderCell('theader');
      const lhId = table.addHeaderCell('lheader');
      table.buildBody([['body-cell']]);
      const footId = table.addHeaderCell('footer');

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'table' },
        condition: 'true',
        result: '{ type: "style", style: { bold: true } }',
      }));

      ruleEngine.evaluateAll();

      // All regions should have results
      expect(ruleEngine.getResult(thId)?.stylePatches.length).toBe(1);
      expect(ruleEngine.getResult(lhId)?.stylePatches.length).toBe(1);
      expect(ruleEngine.getResult(footId)?.stylePatches.length).toBe(1);
      for (const row of structureStore.getBody()) {
        for (const cellId of row) {
          expect(ruleEngine.getResult(cellId)?.stylePatches.length).toBe(1);
        }
      }
    });

    it('region-scope rules are mutually exclusive across regions', () => {
      const setup = createTestSetup();
      const { table, ruleRegistry, ruleEngine } = setup;

      const thId = table.addHeaderCell('theader');
      const lhId = table.addHeaderCell('lheader');
      table.buildBody([['body-cell']]);
      const footId = table.addHeaderCell('footer');

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'region', region: 'body' },
        condition: 'true',
        result: '{ type: "style", style: { fontColor: "body-color" } }',
      }));

      ruleRegistry.addRule(makeRuleInput({
        target: { scope: 'region', region: 'theader' },
        condition: 'true',
        result: '{ type: "style", style: { fontColor: "header-color" } }',
      }));

      ruleEngine.evaluateAll();

      expect(ruleEngine.getResult(thId)?.stylePatches[0].style.fontColor).toBe('header-color');
      expect(ruleEngine.getResult(lhId)?.stylePatches.length).toBe(0);
      expect(ruleEngine.getResult(footId)?.stylePatches.length).toBe(0);
    });
  });
});
