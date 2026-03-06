# Merge and Unmerge Feature Guide

Complete documentation of how merge and unmerge work in campx-dynamic-table-engine.

## Architecture Overview

The merge/unmerge feature is built on three independent systems that work together:

```
┌─────────────────────┐
│   Table (Facade)    │
├─────────────────────┤
│ mergeCells()        │
│ unmergeCells()      │
└──────────┬──────────┘
           │
    ┌──────┴──────────────────┐
    │                         │
    ▼                         ▼
┌──────────────────┐  ┌──────────────────┐
│ MergeRegistry    │  │ LayoutEngine     │
├──────────────────┤  ├──────────────────┤
│ createMerge()    │  │ applyBodyLayout()│
│ deleteMerge()    │  │ rebuildLayout()  │
│ getMergeSet()    │  │ rebuildGeometry()│
└──────────────────┘  └──────────────────┘
```

### Key Design Principle

**MergeRegistry is completely independent of Cell data.**

- MergeRegistry stores: cellId → Rect (rectangle dimensions)
- LayoutEngine uses: mergeRegistry.getMergeSet() to apply row/col spans
- When unmerge happens: deleteMerge() removes the Rect, layout rebuilds
- Cell data is never modified - only layout properties change

## How Merge Works

### Step 1: Create Merge

```typescript
const grid = table.getCompleteGrid()
const rootCellId = grid[0][0]  // Top-left cell

const mergeRect = {
  cellId: rootCellId,           // Root cell ID (key in registry)
  startRow: 0,
  startCol: 0,
  endRow: 1,                    // Merge spans 2 rows (0-1)
  endCol: 1,                    // Merge spans 2 cols (0-1)
  primaryRegion: 'body'
}

table.mergeCells(mergeRect)
```

### Step 2: MergeRegistry Stores It

```
mergeRegistry = {
  'cell-A1': {
    cellId: 'cell-A1',
    startRow: 0,
    startCol: 0,
    endRow: 1,
    endCol: 1,
    primaryRegion: 'body'
  }
}
```

### Step 3: LayoutEngine Applies Layout

When `rebuildLayout()` is called:

```typescript
// applyBodyLayout() is called
const merges = this.mergeRegistry.getMergeSet()

if (merges.has(cellId)) {
  const { startRow, startCol, endRow, endCol } = merges.get(cellId)!
  rowSpan = endRow - startRow + 1    // 2
  colSpan = endCol - startCol + 1    // 2

  // Mark covered cells as skipped
  for (let mr = r; mr < r + rowSpan; mr++) {
    for (let mc = c; mc < c + colSpan; mc++) {
      if (mr !== r || mc !== c) {
        skips.add(`${mr}:${mc}`)  // Cell B1, A2, B2 are skipped
      }
    }
  }
}

// Cell layout is updated
cell._setLayout({ row, col, rowSpan: 2, colSpan: 2, ... })
```

### Result

```
┌──────────────────┐
│                  │
│   Cell A1 (2x2)  │ (covers A1, B1, A2, B2)
│                  │
├────────┬─────────┤
│ Cell B2│ Cell C2 │
│ (skip) │         │
├────────┼─────────┤
│ Cell A3│ Cell B3 │ Cell C3
└────────┴─────────┴─────────┘
```

- Cell A1: rowSpan=2, colSpan=2, rendered as large cell
- Cells B1, A2, B2: rendered in skip list (invisible, covered by A1)
- Other cells: rowSpan=1, colSpan=1, rendered normally

## How Unmerge Works

### Step 1: Call Unmerge

```typescript
table.unmergeCells(rootCellId)
```

### Step 2: MergeRegistry Deletes Merge

```typescript
// In MergeRegistry.deleteMerge()
this.mergeRegistry.delete(cellId)

// Now registry is empty
mergeRegistry = {}
```

### Step 3: Table Rebuilds Layout

```typescript
// In Table.unmergeCells()
this.mergeRegistry.deleteMerge(cellId)
this.rebuildAndEvaluate()  // Calls layoutEngine.rebuildLayout()
```

### Step 4: LayoutEngine Rebuilds

```typescript
// In LayoutEngine.applyBodyLayout()
const merges = this.mergeRegistry.getMergeSet()  // Empty!

if (merges.has(cellId)) {  // FALSE - merge was deleted
  // ... skip this branch
}

// Normal 1x1 layout applied
rowSpan = 1
colSpan = 1
cell._setLayout({ row, col, rowSpan: 1, colSpan: 1, ... })
```

### Result

```
┌────────┬────────┬────────┐
│Cell A1 │Cell B1 │Cell C1 │
├────────┼────────┼────────┤
│Cell A2 │Cell B2 │Cell C2 │
├────────┼────────┼────────┤
│Cell A3 │Cell B3 │Cell C3 │
└────────┴────────┴────────┘
```

- All cells: rowSpan=1, colSpan=1, rendered normally
- No skip list, no covered cells

## Complete Workflow

### Initial State
- 3x3 grid of cells
- No merges
- All cells: 1x1 layout

### After Merge
1. User calls: `table.mergeCells(rect)`
2. Table calls: `this.mergeRegistry.createMerge(rect)`
3. MergeRegistry stores rect by cellId
4. Table calls: `this.rebuildAndEvaluate()`
5. LayoutEngine gets merges, applies row/col spans
6. Renderers pick up new spans and display merged cells

### After Unmerge
1. User calls: `table.unmergeCells(cellId)`
2. Table calls: `this.mergeRegistry.deleteMerge(cellId)`
3. MergeRegistry deletes the rect
4. Table calls: `this.rebuildAndEvaluate()`
5. LayoutEngine gets empty merges, applies 1x1 spans
6. Renderers update, merged cell splits back into 4 cells

## MergeRegistry API

### createMerge(rect: Rect)
```typescript
const rect = {
  cellId: 'cell-A1',
  startRow: 0,
  startCol: 0,
  endRow: 1,
  endCol: 1,
  primaryRegion: 'body'
}
mergeRegistry.createMerge(rect)
```

Validates and stores the merge. MergeRegistry checks bounds using StructureStore.

### deleteMerge(cellId: string)
```typescript
mergeRegistry.deleteMerge('cell-A1')
```

Removes the merge. This is the core of unmerge operation.

### getMergeByRootId(cellId: string): Rect | undefined
```typescript
const merge = mergeRegistry.getMergeByRootId('cell-A1')
```

Returns the merge rectangle if cell is a merge root.

### getMergeSet(): Map<string, Rect>
```typescript
const merges = mergeRegistry.getMergeSet()
```

Returns all top-level merges (filters nested merges). Used by LayoutEngine.

### isMergeRoot(cellId: string): boolean
```typescript
if (mergeRegistry.isMergeRoot('cell-A1')) {
  // Cell A1 is a merge root
}
```

Checks if a cell ID is a merge root.

### getMergeRoots(): string[]
```typescript
const rootIds = mergeRegistry.getMergeRoots()
// ['cell-A1', 'cell-C3', ...]
```

Returns all merge root cell IDs.

### findMergeByContainedCell(cellId: string)
```typescript
const result = mergeRegistry.findMergeByContainedCell('cell-B1')
if (result) {
  console.log(`Cell is part of merge rooted at ${result.rootCellId}`)
}
```

Finds if a cell is within any merge (currently supports root lookup only).

## Integration with Renderers

### In uiRender (Edit Mode)

```typescript
async function uiRender(table, options) {
  const renderableTable = RenderableTable.create(table)

  // RenderableCell has the layout with correct rowSpan/colSpan
  // Merged cells:
  //   - Single cell renders as large (spanned)
  //   - Display content for single merged cell only
  // Unmerged cells:
  //   - Each renders individually (1x1)

  // In edit mode with onChange
  table.updateCell(cellId, { rawValue: newValue })
  table.mergeCells(rect)   // Can still merge
  table.unmergeCells(id)   // Can unmerge

  // Trigger re-render
  renderTable()
}
```

### In pdfRender

```typescript
async function pdfRender(table, options) {
  const renderableTable = RenderableTable.create(table)

  // drawCell() respects rowSpan/colSpan
  // Merged cells drawn as large rectangles
  // Unmerged cells drawn individually
}
```

### In propPanel

Users can:
- Add merge buttons with merge rect input
- Remove merge buttons showing current merges
- PropPanel doesn't directly handle merges, but triggers table methods

## Important Notes

### Cell Data Never Changes
- Merge/unmerge only changes layout (row, col, rowSpan, colSpan, x, y, width, height)
- rawValue, computedValue, style all remain unchanged
- Cell data in cellRegistry is untouched

### Layout Rebuilds on Unmerge
- When unmerge is called, entire layout is rebuilt
- This recalculates geometry (x, y, width, height)
- This respects all other layout settings (table position, custom widths/heights)

### Validation
- isValidMerge() checks bounds against StructureStore
- Invalid merges are silently ignored
- After table changes (add/remove rows/cols), merges are validated

### Performance
- getMergeSet() filters to top-level merges only
- This avoids rendering overlapping merged cells
- MergeRegistry uses simple Map for O(1) lookup

## Example: Complete Merge/Unmerge Flow

```typescript
// Create table
const table = new Table()
table.buildBody([
  ['A1', 'B1', 'C1'],
  ['A2', 'B2', 'C2'],
  ['A3', 'B3', 'C3'],
])

// Render initially (3x3 grid)
const html1 = await uiRender(table, { mode: 'edit' })
container.appendChild(html1)

// User clicks "Merge" button
const cellId = 'cell-0-0'
table.mergeCells({
  cellId,
  startRow: 0, startCol: 0,
  endRow: 1, endCol: 1,
  primaryRegion: 'body'
})

// Auto re-render (2x2 merged cell visible)
const html2 = await uiRender(table, { mode: 'edit' })
container.replaceChild(html2, html1)

// User clicks "Unmerge" button
table.unmergeCells(cellId)

// Auto re-render (4 separate cells visible)
const html3 = await uiRender(table, { mode: 'edit' })
container.replaceChild(html3, html2)

// All 9 cells now individually editable
```

## Testing

See `merge-unmerge.test.ts` for comprehensive test coverage:
- Creating merges
- Unmerging cells
- Layout rebuilding
- Geometry recalculation
- Edge cases (1x1, full row, full column)
- Invalid merges

## Summary

Merge/unmerge is a clean, independent feature:

1. **MergeRegistry**: Stores cellId → Rect mappings
2. **LayoutEngine**: Applies layouts based on merges
3. **Table**: Orchestrates merge/unmerge and rebuilds
4. **Renderers**: Display based on final layouts
5. **Cell data**: Never changes

Unmerge simply deletes the Rect from registry and rebuilds layout. No complex cell manipulation needed!
