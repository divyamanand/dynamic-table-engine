/**
 * COMPREHENSIVE INTEGRATION TEST
 * Tests the complete CampX table engine workflow with actual classes (no mocks)
 *
 * Scenario: Build and manipulate a theader with multiple levels, styles, geometry,
 * and overflow handling to verify the entire system works end-to-end.
 */

import { Table } from '../../core/table';
import { CellRegistry, defaultCellStyle } from '../../stores/cell-registry.store';
import { StructureStore } from '../../stores/structure.store';
import { MergeRegistry } from '../../stores/merge-registry.stores';
import { LayoutEngine } from '../../engines/layout.engine';
import { RuleEngine } from '../../rules/rule-engine';
import { RuleRegistry } from '../../rules/rule-registry';
import type { ICell } from '../../interfaces/core/cell.interface';
import type { CellStyle } from '../../types';

describe('Complete Workflow Integration Test', () => {
  let table: Table;
  let cellRegistry: CellRegistry;
  let structureStore: StructureStore;
  let mergeRegistry: MergeRegistry;
  let layoutEngine: LayoutEngine;
  let ruleRegistry: RuleRegistry;
  let ruleEngine: RuleEngine;

  beforeEach(() => {
    // Initialize all services with actual classes
    cellRegistry = new CellRegistry();
    structureStore = new StructureStore();
    mergeRegistry = new MergeRegistry(structureStore);
    layoutEngine = new LayoutEngine(mergeRegistry, structureStore, cellRegistry);
    ruleRegistry = new RuleRegistry();
    ruleEngine = new RuleEngine(ruleRegistry, cellRegistry, structureStore, {} as any);

    // Create table with all real services
    table = new Table(
      structureStore,
      cellRegistry,
      layoutEngine,
      mergeRegistry
    );

    // Set rule engine after table creation
    table.setRuleEngine(ruleEngine);
  });

  describe('Step 1-3: Create theader roots with styles and geometry', () => {
    it('should create first theader root with default styles and geometry', () => {
      const rootId1 = table.addHeaderCell('theader');

      expect(rootId1).toBeTruthy();
      const cell1 = cellRegistry.getCellById(rootId1);

      // Verify default style
      expect(cell1?.style).toEqual(defaultCellStyle);

      // Verify default geometry
      expect(cell1?.layout).toBeDefined();
      expect(cell1?.layout?.width).toBe(30); // default column width
      expect(cell1?.layout?.height).toBe(10); // default row height
      expect(cell1?.layout?.x).toBe(0);
      expect(cell1?.layout?.y).toBe(0);
      expect(cell1?.layout?.rowSpan).toBe(1);
      expect(cell1?.layout?.colSpan).toBe(1);
    });

    it('should change styles for the first root cell', () => {
      const rootId1 = table.addHeaderCell('theader');

      const newStyle: Partial<CellStyle> = {
        fontColor: '#FF0000',
        fontSize: 16,
        bold: true,
      };

      table.updateCell(rootId1, { style: newStyle });
      const cell1 = cellRegistry.getCellById(rootId1);

      expect(cell1?.style.fontColor).toBe('#FF0000');
      expect(cell1?.style.fontSize).toBe(16);
      expect(cell1?.style.bold).toBe(true);
    });

    it('should change geometry for the first root cell', () => {
      const rootId1 = table.addHeaderCell('theader');

      table.setColumnWidth(0, 50);
      table.setRowHeight(0, 20);

      const cell1 = cellRegistry.getCellById(rootId1);
      expect(cell1?.layout?.width).toBe(50);
      expect(cell1?.layout?.height).toBe(20);
    });

    it('should create a second theader root', () => {
      const rootId1 = table.addHeaderCell('theader');

      // Set custom geometry for first root
      table.setColumnWidth(0, 50);
      table.setRowHeight(0, 20);

      // Add second root
      const rootId2 = table.addHeaderCell('theader');

      expect(rootId2).toBeTruthy();
      expect(rootId1).not.toBe(rootId2);

      const cell2 = cellRegistry.getCellById(rootId2);

      // Second root should be at column 1
      expect(cell2?.layout?.col).toBe(1);
      // Second root should inherit row height (1 is shared)
      expect(cell2?.layout?.height).toBe(20);
      // Second root should have default column width
      expect(cell2?.layout?.width).toBe(30);
    });
  });

  describe('Step 4-5: Add child cells and apply different styles', () => {
    it('should add a child cell to first root', () => {
      const rootId1 = table.addHeaderCell('theader');

      const childId = table.addHeaderCell('theader', rootId1);

      expect(childId).toBeTruthy();
      expect(childId).not.toBe(rootId1);

      // Verify parent-child relationship
      const children = structureStore.getChildren(rootId1);
      expect(children).toContain(childId);
    });

    it('should apply different styles to child vs root', () => {
      const rootId1 = table.addHeaderCell('theader');
      const childId = table.addHeaderCell('theader', rootId1);

      // Root style
      table.updateCell(rootId1, {
        style: { fontColor: '#FF0000', bold: true },
      });

      // Child style (different)
      table.updateCell(childId, {
        style: { fontColor: '#0000FF', italic: true },
      });

      const root = cellRegistry.getCellById(rootId1);
      const child = cellRegistry.getCellById(childId);

      expect(root?.style.fontColor).toBe('#FF0000');
      expect(root?.style.bold).toBe(true);
      expect(root?.style.italic).toBe(false);

      expect(child?.style.fontColor).toBe('#0000FF');
      expect(child?.style.italic).toBe(true);
      expect(child?.style.bold).toBe(false);
    });
  });

  describe('Step 6: Region-wide style application', () => {
    it('should apply style to entire theader region', () => {
      const rootId1 = table.addHeaderCell('theader');
      const childId = table.addHeaderCell('theader', rootId1);
      const rootId2 = table.addHeaderCell('theader');

      const regionStyle: Partial<CellStyle> = {
        fontColor: '#00AA00',
        fontSize: 14,
        backgroundColor: '#FFFFCC',
      };

      // Apply style to all cells in region by setting rule
      const roots = structureStore.getRoots('theader') || [];
      roots.forEach(rid => {
        table.updateCell(rid, { style: regionStyle });
      });

      roots.forEach(rid => {
        const children = structureStore.getChildren(rid) || [];
        children.forEach(cid => {
          table.updateCell(cid, { style: regionStyle });
        });
      });

      // Verify all cells in region have same style
      const root1 = cellRegistry.getCellById(rootId1);
      const child = cellRegistry.getCellById(childId);
      const root2 = cellRegistry.getCellById(rootId2);

      [root1, child, root2].forEach(cell => {
        expect(cell?.style.fontColor).toBe('#00AA00');
        expect(cell?.style.fontSize).toBe(14);
        expect(cell?.style.backgroundColor).toBe('#FFFFCC');
      });
    });
  });

  describe('Step 7: New root inherits region style but gets default geometry', () => {
    it('should add another root with region style and default geometry', () => {
      const regionStyle: Partial<CellStyle> = {
        fontColor: '#00AA00',
        fontSize: 14,
        backgroundColor: '#FFFFCC',
      };

      // Create initial roots with region style
      const rootId1 = table.addHeaderCell('theader');
      table.updateCell(rootId1, { style: regionStyle });

      const rootId2 = table.addHeaderCell('theader');
      table.updateCell(rootId2, { style: regionStyle });

      // Set custom geometry
      table.setColumnWidth(0, 50);
      table.setRowHeight(0, 20);

      // Add new root
      const rootId3 = table.addHeaderCell('theader');

      // Apply region style to new root
      table.updateCell(rootId3, { style: regionStyle });

      const root3 = cellRegistry.getCellById(rootId3);

      // Should have region style
      expect(root3?.style.fontColor).toBe('#00AA00');

      // Should have default column width
      expect(root3?.layout?.width).toBe(30);

      // Should have inherited row height
      expect(root3?.layout?.height).toBe(20);
    });
  });

  describe('Step 8: Verify leaf node count', () => {
    it('should have 3 leaf nodes in theader', () => {
      const rootId1 = table.addHeaderCell('theader');
      const childId1 = table.addHeaderCell('theader', rootId1);
      const rootId2 = table.addHeaderCell('theader');

      // rootId1 has child, so rootId1 is not a leaf
      // childId1 is a leaf
      // rootId2 has no children, so it's a leaf
      // Total leaves: childId1, rootId2 = 2 (not 3 yet)

      const leafCount = structureStore.getLeafCount('theader');
      expect(leafCount).toBe(2);

      // Add third leaf by adding another root
      const rootId3 = table.addHeaderCell('theader');
      const newLeafCount = structureStore.getLeafCount('theader');
      expect(newLeafCount).toBe(3);
    });
  });

  describe('Step 9: Increase height of one root - affects entire row', () => {
    it('should increase row height and affect all cells in that row', () => {
      const rootId1 = table.addHeaderCell('theader');
      const rootId2 = table.addHeaderCell('theader');
      const rootId3 = table.addHeaderCell('theader');

      // Initial height
      expect(cellRegistry.getCellById(rootId1)?.layout?.height).toBe(10);
      expect(cellRegistry.getCellById(rootId2)?.layout?.height).toBe(10);
      expect(cellRegistry.getCellById(rootId3)?.layout?.height).toBe(10);

      // Increase height of row 0 (all theader roots are in row 0)
      table.setRowHeight(0, 25);

      // All cells in row 0 should have new height
      expect(cellRegistry.getCellById(rootId1)?.layout?.height).toBe(25);
      expect(cellRegistry.getCellById(rootId2)?.layout?.height).toBe(25);
      expect(cellRegistry.getCellById(rootId3)?.layout?.height).toBe(25);
    });
  });

  describe('Step 10: Add new root - inherits height, gets default width', () => {
    it('should new root inherit row height but have default column width', () => {
      const rootId1 = table.addHeaderCell('theader');
      const rootId2 = table.addHeaderCell('theader');

      // Set row height
      table.setRowHeight(0, 25);

      // Add new root
      const rootId3 = table.addHeaderCell('theader');

      const cell3 = cellRegistry.getCellById(rootId3);

      // Should inherit row height
      expect(cell3?.layout?.height).toBe(25);

      // Should have default column width
      expect(cell3?.layout?.width).toBe(30);
    });
  });

  describe('Step 11: Overflow handling - with rule engine integration', () => {
    it('should detect overflow and apply backgroundColor via rule engine', () => {
      const cellId = table.addHeaderCell('theader');

      // Add rule that detects overflow and changes backgroundColor to red
      ruleRegistry.addRule({
        target: { scope: 'region', region: 'theader' },
        condition: 'cell.overflows',
        result: '{ type: "style", style: { backgroundColor: "#FF0000" } }',
        priority: 0,
        enabled: true,
        label: 'Highlight overflow cells'
      });

      const overflowText = 'This is a very very very long text that will definitely overflow the cell';
      table.updateCell(cellId, { rawValue: overflowText });

      // Set small dimensions to force overflow
      table.setColumnWidth(0, 10);
      table.setRowHeight(0, 5);

      const cell = cellRegistry.getCellById(cellId);
      expect(cell?.rawValue).toBe(overflowText);
      expect(cell?.layout?.width).toBe(10);
      expect(cell?.layout?.height).toBe(5);

      // Resolve cell to get merged style from rule engine
      const resolvedCell = ruleEngine.resolveCell(cell!);

      // Verify the rule was applied - backgroundColor should be red
      expect(resolvedCell.resolvedStyle.backgroundColor).toBe('#FF0000');
    });

    it('should handle WRAP mode - decrease fontSize when text overflows', () => {
      const cellId = table.addHeaderCell('theader');

      // Add rule that detects overflow and decreases font size for wrapping
      ruleRegistry.addRule({
        target: { scope: 'region', region: 'theader' },
        condition: 'cell.overflows',
        result: '{ type: "style", style: { fontSize: 11 } }',
        priority: 0,
        enabled: true,
        label: 'Reduce font size on overflow'
      });

      const overflowText = 'This is a very long text that will overflow in the default cell width';
      table.updateCell(cellId, { rawValue: overflowText });

      // Default width: 30mm, fontSize: 13
      const cell = cellRegistry.getCellById(cellId);
      expect(cell?.rawValue).toBe(overflowText);
      expect(cell?.layout?.width).toBe(30);
      expect(cell?.style.fontSize).toBe(13);

      // Resolve cell to get merged style
      const resolvedCell = ruleEngine.resolveCell(cell!);

      // Font size should be decreased to fit wrapped text
      expect(resolvedCell.resolvedStyle.fontSize).toBe(11);
    });

    it('should handle CLIP mode - set clip render flag when overflow detected', () => {
      const cellId = table.addHeaderCell('theader');

      // Add rule that sets clip flag for overflow
      ruleRegistry.addRule({
        target: { scope: 'region', region: 'theader' },
        condition: 'cell.overflows',
        result: '{ type: "renderFlag", clip: true }',
        priority: 0,
        enabled: true,
        label: 'Clip overflowing text'
      });

      const text = 'Long text that gets clipped in rendering';
      table.updateCell(cellId, { rawValue: text });
      table.setColumnWidth(0, 15);

      const cell = cellRegistry.getCellById(cellId);
      expect(cell?.rawValue).toBe(text);
      expect(cell?.layout?.width).toBe(15);

      // Resolve cell to check render flags
      const resolvedCell = ruleEngine.resolveCell(cell!);

      // Clip flag should be set when overflow detected
      expect(resolvedCell.renderFlags.clip).toBe(true);
    });

    it('should handle CLIP mode - set computedValue to clipped text', () => {
      const cellId = table.addHeaderCell('theader');

      ruleRegistry.addRule({
        target: { scope: 'region', region: 'theader' },
        condition: 'cell.overflows',
        result: '{ type: "computedValue", value: "Long text tha..." }',
        priority: 0,
        enabled: true,
        label: 'Clip text to fit'
      });

      const text = 'Long text that gets clipped in rendering';
      table.updateCell(cellId, { rawValue: text });
      table.setColumnWidth(0, 15);

      const cell = cellRegistry.getCellById(cellId);

      // Rule engine auto-applies computedValue back to the cell (complete workflow)
      expect(cell?.computedValue).toBe('Long text tha...');

      // displayValue in resolved cell should also be the clipped text
      const resolvedCell = ruleEngine.resolveCell(cell!);
      expect(resolvedCell.displayValue).toBe('Long text tha...');
    });

    it('should handle INCREASE-HEIGHT mode via deltaInstruction (auto-applied)', () => {
      const cellId1 = table.addHeaderCell('theader');
      const cellId2 = table.addHeaderCell('theader');

      // Rule emits a row-height-min delta instruction when text overflows
      ruleRegistry.addRule({
        target: { scope: 'region', region: 'theader' },
        condition: 'cell.overflows',
        result: '{ type: "row-height-min", rowIndex: 0, minHeight: 30 }',
        priority: 0,
        enabled: true,
        label: 'Auto-expand row height for overflow'
      });

      const longText = 'Line1\nLine2\nLine3\nThis text spans multiple lines and needs more space';
      table.updateCell(cellId1, { rawValue: longText });

      // Delta instruction should have been auto-applied by applyDeltaInstructions()
      // No manual setRowHeight needed — the table facade handles it
      const cell1 = cellRegistry.getCellById(cellId1);
      const cell2 = cellRegistry.getCellById(cellId2);
      expect(cell1?.layout?.height).toBe(30);
      expect(cell2?.layout?.height).toBe(30);
    });

    it('should handle INCREASE-WIDTH mode via deltaInstruction (auto-applied)', () => {
      const rootId = table.addHeaderCell('theader');
      const childId = table.addHeaderCell('theader', rootId);

      // Rule emits a col-width-min delta instruction when text overflows
      ruleRegistry.addRule({
        target: { scope: 'region', region: 'theader' },
        condition: 'cell.overflows',
        result: '{ type: "col-width-min", colIndex: 0, minWidth: 60 }',
        priority: 0,
        enabled: true,
        label: 'Auto-expand column width for overflow'
      });

      const longText = 'VeryLongHeaderTextThatExceedsDefaultWidth';
      table.updateCell(rootId, { rawValue: longText });

      // Delta instruction should have been auto-applied — no manual setColumnWidth
      const root = cellRegistry.getCellById(rootId);
      const child = cellRegistry.getCellById(childId);
      expect(root?.layout?.width).toBe(60);
      expect(child?.layout?.width).toBe(60);
    });

    // ---- Manual geometry tests (no rule engine, verifying propagation) ----

    it('should propagate manual height increase to all cells in row', () => {
      const cellId1 = table.addHeaderCell('theader');
      const cellId2 = table.addHeaderCell('theader');

      const initialHeight = cellRegistry.getCellById(cellId1)?.layout?.height;
      table.setRowHeight(0, (initialHeight || 10) + 20);

      const cell1 = cellRegistry.getCellById(cellId1);
      const cell2 = cellRegistry.getCellById(cellId2);
      expect(cell1?.layout?.height).toBe((initialHeight || 10) + 20);
      expect(cell2?.layout?.height).toBe((initialHeight || 10) + 20);
    });

    it('should propagate manual width increase to all cells in column', () => {
      const rootId = table.addHeaderCell('theader');
      const childId = table.addHeaderCell('theader', rootId);

      const initialWidth = cellRegistry.getCellById(rootId)?.layout?.width;
      table.setColumnWidth(0, (initialWidth || 30) + 30);

      const root = cellRegistry.getCellById(rootId);
      const child = cellRegistry.getCellById(childId);
      expect(root?.layout?.width).toBe((initialWidth || 30) + 30);
      expect(child?.layout?.width).toBe((initialWidth || 30) + 30);
    });
  });

  describe('Step 12: Verify rectangular geometry and coordinates', () => {
    it('should maintain rectangular grid with proper coordinates', () => {
      // Create simple flat structure (no hierarchy) for clarity
      const root1 = table.addHeaderCell('theader'); // col 0
      const root2 = table.addHeaderCell('theader'); // col 1
      const root3 = table.addHeaderCell('theader'); // col 2

      // Set custom geometry
      table.setColumnWidth(0, 40);
      table.setColumnWidth(1, 50);
      table.setColumnWidth(2, 60);
      table.setRowHeight(0, 15);

      const cells = {
        root1: cellRegistry.getCellById(root1),
        root2: cellRegistry.getCellById(root2),
        root3: cellRegistry.getCellById(root3),
      };

      // Verify rectangular properties - all roots in row 0
      expect(cells.root1?.layout?.col).toBe(0);
      expect(cells.root1?.layout?.x).toBe(0);
      expect(cells.root1?.layout?.width).toBe(40);
      expect(cells.root1?.layout?.row).toBe(0);
      expect(cells.root1?.layout?.y).toBe(0);
      expect(cells.root1?.layout?.height).toBe(15);

      expect(cells.root2?.layout?.col).toBe(1);
      expect(cells.root2?.layout?.x).toBe(40); // 0 + 40
      expect(cells.root2?.layout?.width).toBe(50);
      expect(cells.root2?.layout?.row).toBe(0);
      expect(cells.root2?.layout?.y).toBe(0);
      expect(cells.root2?.layout?.height).toBe(15);

      expect(cells.root3?.layout?.col).toBe(2);
      expect(cells.root3?.layout?.x).toBe(90); // 40 + 50
      expect(cells.root3?.layout?.width).toBe(60);
      expect(cells.root3?.layout?.row).toBe(0);
      expect(cells.root3?.layout?.y).toBe(0);
      expect(cells.root3?.layout?.height).toBe(15);
    });

    it('should handle hierarchical geometry correctly', () => {
      // Separate test for parent-child geometry
      const parent = table.addHeaderCell('theader');
      const child = table.addHeaderCell('theader', parent);

      table.setColumnWidth(0, 40);
      table.setRowHeight(0, 15);
      table.setRowHeight(1, 20);

      const parentCell = cellRegistry.getCellById(parent);
      const childCell = cellRegistry.getCellById(child);

      // Parent spans multiple children vertically (col span = 1)
      expect(parentCell?.layout?.col).toBe(0);
      expect(parentCell?.layout?.row).toBe(0);
      expect(parentCell?.layout?.width).toBe(40);

      // Child is in row 1, same column
      expect(childCell?.layout?.col).toBe(0);
      expect(childCell?.layout?.row).toBe(1);
      expect(childCell?.layout?.y).toBe(15); // y = parent row height
      expect(childCell?.layout?.height).toBe(20);
    });

    it('should verify total grid dimensions', () => {
      // Create 3-column, 2-row grid
      const root1 = table.addHeaderCell('theader');
      const child1 = table.addHeaderCell('theader', root1);
      const root2 = table.addHeaderCell('theader');
      const root3 = table.addHeaderCell('theader');

      table.setColumnWidth(0, 40);
      table.setColumnWidth(1, 50);
      table.setColumnWidth(2, 60);
      table.setRowHeight(0, 15);
      table.setRowHeight(1, 20);

      const columnWidths = table.getColumnWidths();
      const rowHeights = table.getRowHeights();

      // Should have 3 columns
      expect(columnWidths.length).toBeGreaterThanOrEqual(3);
      expect(columnWidths[0]).toBe(40);
      expect(columnWidths[1]).toBe(50);
      expect(columnWidths[2]).toBe(60);

      // Should have 2 rows
      expect(rowHeights.length).toBeGreaterThanOrEqual(2);
      expect(rowHeights[0]).toBe(15);
      expect(rowHeights[1]).toBe(20);

      // Verify all cell coordinates are within bounds
      const cells = [root1, child1, root2, root3];
      cells.forEach(cellId => {
        const cell = cellRegistry.getCellById(cellId);
        expect(cell?.layout?.col).toBeLessThan(columnWidths.length);
        expect(cell?.layout?.row).toBeLessThan(rowHeights.length);
        expect(cell?.layout?.x).toBeGreaterThanOrEqual(0);
        expect(cell?.layout?.y).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have no gaps or overlaps in coordinate system', () => {
      const root1 = table.addHeaderCell('theader');
      const root2 = table.addHeaderCell('theader');
      const root3 = table.addHeaderCell('theader');

      table.setColumnWidth(0, 40);
      table.setColumnWidth(1, 50);
      table.setColumnWidth(2, 60);

      const cells = [root1, root2, root3].map(id => cellRegistry.getCellById(id)!);

      // Sort by column
      cells.sort((a, b) => (a.layout?.col || 0) - (b.layout?.col || 0));

      // Verify no gaps: each cell's x + width should equal next cell's x
      for (let i = 0; i < cells.length - 1; i++) {
        const current = cells[i];
        const next = cells[i + 1];

        const currentEnd = (current.layout?.x || 0) + (current.layout?.width || 0);
        const nextStart = next.layout?.x || 0;

        expect(currentEnd).toBe(nextStart);
      }
    });
  });

  describe('Complete integration verification', () => {
    it('should complete full workflow without errors', () => {
      // Step 1: Create first theader root
      const rootId1 = table.addHeaderCell('theader');
      expect(rootId1).toBeTruthy();

      // Step 2: Change styles
      table.updateCell(rootId1, {
        style: { fontColor: '#FF0000', fontSize: 16 },
      });

      // Step 3: Change geometry
      table.setColumnWidth(0, 50);
      table.setRowHeight(0, 20);

      // Step 4: Create second root
      const rootId2 = table.addHeaderCell('theader');
      expect(rootId2).toBeTruthy();

      // Step 5: Add child
      const childId = table.addHeaderCell('theader', rootId1);
      expect(childId).toBeTruthy();

      // Step 6: Change child style
      table.updateCell(childId, { style: { bold: true } });

      // Step 7: Apply region style
      const regionStyle = { fontColor: '#00AA00' };
      [rootId1, rootId2, childId].forEach(id => {
        table.updateCell(id, { style: regionStyle });
      });

      // Step 8: Add third root
      const rootId3 = table.addHeaderCell('theader');
      table.updateCell(rootId3, { style: regionStyle });

      // Step 9: Add overflow text
      table.updateCell(rootId1, { rawValue: 'Header with long text that might overflow' });

      // Step 10: Increase dimensions
      table.setRowHeight(0, 30);
      table.setColumnWidth(1, 60);

      // Verify final state
      const finalLeafCount = structureStore.getLeafCount('theader');
      const widths = table.getColumnWidths();
      const heights = table.getRowHeights();

      expect(finalLeafCount).toBeGreaterThan(0);
      expect(widths.length).toBeGreaterThan(0);
      expect(heights.length).toBeGreaterThan(0);

      // All cells should exist
      [rootId1, rootId2, rootId3, childId].forEach(id => {
        const cell = cellRegistry.getCellById(id);
        expect(cell).toBeDefined();
        expect(cell?.layout).toBeDefined();
        expect(cell?.style).toBeDefined();
      });
    });
  });
});
