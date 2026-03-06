# Table Rendering System - Usage Example

Complete example showing how to use the three-layer rendering architecture with PropPanel.

## Complete Application Flow

```typescript
import { Table } from '../core/table'
import {
  uiRender,
  pdfRender,
  PropPanel,
  createTableRendererPlugin
} from './index'

// Step 1: Create and configure table
const table = new Table()
table.buildBody([
  ['John', '25', 'NYC'],
  ['Jane', '28', 'LA'],
  ['Bob', '32', 'SF'],
])

// Add header
const headerId = table.addHeaderCell('theader')
table.updateCell(headerId, { rawValue: 'Name' })

// Step 2: Configure settings
table.updateSettings({
  tableStyles: {
    borderColor: '#000',
    borderWidth: 0.5,
  },
  headerVisibility: {
    theader: true,
    lheader: false,
    rheader: false,
  },
  defaultStyle: {
    fontName: 'Arial',
    fontSize: 12,
    fontColor: '#333',
    backgroundColor: '#fff',
    bold: false,
    italic: false,
    alignment: 'left',
    verticalAlignment: 'middle',
    lineHeight: 1.5,
    characterSpacing: 0,
    borderColor: '#ddd',
    borderWidth: { top: 0.1, right: 0.1, bottom: 0.1, left: 0.1 },
    padding: { top: 2, right: 2, bottom: 2, left: 2 },
  },
  footer: { mode: 'last-page' },
  pagination: {
    pageSize: 10,
    repeatHeaders: true,
  },
})

// Step 3: Create container
const appContainer = document.getElementById('app')

// Create layout
const layout = document.createElement('div')
layout.style.display = 'grid'
layout.style.gridTemplateColumns = '1fr 300px'
layout.style.gap = '20px'
layout.style.padding = '20px'
appContainer.appendChild(layout)

// Left side: Table viewer/editor
const viewerContainer = document.createElement('div')
viewerContainer.id = 'viewer'
layout.appendChild(viewerContainer)

// Right side: Property panel
const propPanelContainer = document.createElement('div')
propPanelContainer.id = 'prop-panel'
layout.appendChild(propPanelContainer)

// Step 4: Render interactive table (edit mode)
async function renderTable() {
  const html = await uiRender(table, {
    mode: 'edit',
    onChange: (cellID, newValue) => {
      // User edited a cell
      console.log(`Cell ${cellID} changed to ${newValue}`)

      // Update table
      table.updateCell(cellID, { rawValue: newValue })

      // Re-render table and prop panel
      renderTable()
      renderPropPanel()
    },
    onCellClick: (cellID, rowIndex, colIndex) => {
      console.log(`Clicked cell ${cellID} at row ${rowIndex}, col ${colIndex}`)
    },
  })

  viewerContainer.replaceWith(html)
  viewerContainer = html
}

// Step 5: Render property panel
function renderPropPanel() {
  const propPanel = new PropPanel(table, {
    container: propPanelContainer,
    onChange: (settings) => {
      console.log('Table settings updated:', settings)
      // Re-render table when settings change
      renderTable()
    },
  })
  propPanel.render()
}

// Step 6: Add action buttons
const actionsDiv = document.createElement('div')
actionsDiv.style.padding = '20px'
actionsDiv.style.display = 'flex'
actionsDiv.style.gap = '10px'
appContainer.appendChild(actionsDiv)

// Export to PDF button
const exportPdfBtn = document.createElement('button')
exportPdfBtn.textContent = 'Export to PDF'
exportPdfBtn.addEventListener('click', async () => {
  const pdfBytes = await pdfRender(table, {
    pageWidth: 210,    // A4 width in mm
    pageHeight: 297,   // A4 height in mm
    pageMargin: { top: 20, right: 20, bottom: 20, left: 20 },
  })

  // Download PDF
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'table.pdf'
  a.click()
  URL.revokeObjectURL(url)
})
actionsDiv.appendChild(exportPdfBtn)

// Switch to view mode button
const viewModeBtn = document.createElement('button')
viewModeBtn.textContent = 'Switch to View Mode'
viewModeBtn.addEventListener('click', async () => {
  const html = await uiRender(table, {
    mode: 'view',
  })
  viewerContainer.replaceWith(html)
  viewerContainer = html
})
actionsDiv.appendChild(viewModeBtn)

// Add row button
const addRowBtn = document.createElement('button')
addRowBtn.textContent = 'Add Row'
addRowBtn.addEventListener('click', () => {
  table.insertBodyRow(table.getRowHeights().length)
  renderTable()
})
actionsDiv.appendChild(addRowBtn)

// Add column button
const addColBtn = document.createElement('button')
addColBtn.textContent = 'Add Column'
addColBtn.addEventListener('click', () => {
  table.insertBodyCol(table.getColumnWidths().length)
  renderTable()
})
actionsDiv.appendChild(addColBtn)

// Step 7: Initial render
renderTable()
renderPropPanel()
```

## Using the Plugin Interface

```typescript
import { createTableRendererPlugin } from './renderers'

// Create plugin
const plugin = createTableRendererPlugin()

// Use it
const pdfBytes = await plugin.pdf(table)
const htmlElement = await plugin.ui(table, { mode: 'edit' })
```

## Property Panel Features

### Table Styles Tab
- Border color
- Border width

### Headers Tab
- Show/hide top header
- Show/hide left header
- Show/hide right header

### Styles Tab
- Font name
- Font size
- Font color
- Background color
- Bold/Italic
- Text alignment
- Vertical alignment
- Padding (all sides)

### Footer Tab
- Footer placement (every-page, last-page)

### Pagination Tab
- Page size (rows per page)
- Repeat headers on new pages

## PropPanel API

```typescript
// Create instance
const propPanel = new PropPanel(table, {
  container: document.getElementById('panel'),
  onChange: (settings) => {
    console.log('Settings changed:', settings)
  },
  onStyleChange: (styles) => {
    console.log('Default style changed:', styles)
  },
})

// Render
propPanel.render()

// Update table and re-render
table.updateSettings({ /* ... */ })
propPanel.render()

// Cleanup
propPanel.destroy()
```

## Complete Workflow

1. **Create Table** - Initialize with data
2. **Configure Settings** - Use PropPanel UI or direct API
3. **Render UI** - Interactive HTML for editing
4. **Handle Changes** - onChange callback updates table
5. **Export** - PDF or print

## HTML Structure Generated

```
<div class="prop-panel">
  <div class="prop-panel-tabs">
    <button class="prop-panel-tab active" data-tab="table">Table</button>
    <button class="prop-panel-tab" data-tab="headers">Headers</button>
    <!-- ... -->
  </div>

  <div class="prop-panel-sections">
    <div class="prop-panel-section active" data-section="table">
      <!-- Form controls -->
    </div>
    <!-- ... other sections -->
  </div>
</div>
```

## CSS Classes for Customization

- `.prop-panel` - Main container
- `.prop-panel-tabs` - Tab navigation
- `.prop-panel-tab` - Individual tab button
- `.prop-panel-tab.active` - Active tab
- `.prop-panel-sections` - Content container
- `.prop-panel-section` - Section content
- `.prop-panel-section.active` - Active section
- `.form-group` - Form field container
- `.form-group.checkbox` - Checkbox variant

All form controls are styled with CSS you can override in your application.

## State Management

PropPanel automatically:
- Reads current settings from table via `table.getSettings()`
- Updates table via `table.updateSettings()`
- Fires onChange callback on any change
- Maintains UI state for active tabs/sections

No external state management needed!
