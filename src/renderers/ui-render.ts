import { ITable } from '../interfaces/table/table.inteface'
import { RenderableTable } from './renderable-table'
import { RenderableTableInstance, RenderableRow, RenderableCell, RenderableColumn } from './types/renderable-types'
import { Region, CellStyle, Rect } from '../types'

export type UIMode = 'view' | 'edit'

export interface UIRenderOptions {
  mode: UIMode
  onChange?: (cellID: string, newValue: string | number) => void
  onCellClick?: (cellID: string, rowIndex: number, colIndex: number) => void
  onMerge?: (rect: Rect) => void
  onUnmerge?: (cellID: string) => void
  scale?: number  // Zoom/scale factor
}

/**
 * Renders a Table to interactive HTML
 *
 * Flow:
 * 1. Convert Table to RenderableTableInstance
 * 2. Create HTML structure with all regions
 * 3. Bind event handlers (onClick, onChange)
 * 4. Return HTMLElement
 * 5. When user makes changes → onChange fires → updateCell() called on Table
 * 6. Table triggers re-render → RenderableTable.create() called again → UI updates
 */
export async function uiRender(
  table: ITable,
  options: UIRenderOptions = { mode: 'view' }
): Promise<HTMLElement> {
  // Step 1: Convert table to renderable instance
  const renderableTable = RenderableTable.create(table)

  // Step 2: Create main container
  const container = document.createElement('div')
  container.className = 'dynamic-table-container'
  container.style.width = `${renderableTable.getWidth()}mm`
  container.style.height = `${renderableTable.getHeight()}mm`
  container.style.position = 'relative'
  container.style.overflow = 'auto'
  container.style.border = `${renderableTable.tableStyles.borderWidth || 0.1}mm solid ${renderableTable.tableStyles.borderColor || '#000'}`
  container.style.fontFamily = 'Arial, sans-serif'
  container.style.fontSize = '12px'

  const { regions, columns, settings } = renderableTable

  // Step 3: Render each region
  if (settings.headerVisibility?.theader !== false && regions.theader.length > 0) {
    const headerDiv = renderRegion(
      regions.theader,
      'theader',
      columns,
      renderableTable,
      options,
      table
    )
    container.appendChild(headerDiv)
  }

  if (settings.headerVisibility?.lheader !== false && regions.lheader.length > 0) {
    const lheaderDiv = renderRegion(
      regions.lheader,
      'lheader',
      columns,
      renderableTable,
      options,
      table
    )
    container.appendChild(lheaderDiv)
  }

  if (settings.headerVisibility?.rheader !== false && regions.rheader.length > 0) {
    const rheaderDiv = renderRegion(
      regions.rheader,
      'rheader',
      columns,
      renderableTable,
      options,
      table
    )
    container.appendChild(rheaderDiv)
  }

  if (regions.body.length > 0) {
    const bodyDiv = renderRegion(
      regions.body,
      'body',
      columns,
      renderableTable,
      options,
      table
    )
    container.appendChild(bodyDiv)
  }

  const footerMode = settings.footer?.mode || 'last-page'
  if (footerMode === 'every-page' || footerMode === 'last-page') {
    if (regions.footer.length > 0) {
      const footerDiv = renderRegion(
        regions.footer,
        'footer',
        columns,
        renderableTable,
        options,
        table
      )
      container.appendChild(footerDiv)
    }
  }

  return container
}

/**
 * Render a region (header, body, footer, etc.)
 */
function renderRegion(
  rows: RenderableRow[],
  region: Region,
  columns: RenderableColumn[],
  renderableTable: RenderableTableInstance,
  options: UIRenderOptions,
  table: ITable
): HTMLElement {
  const regionDiv = document.createElement('div')
  regionDiv.className = `table-region table-region-${region}`
  regionDiv.style.display = 'flex'
  regionDiv.style.flexDirection = 'column'
  regionDiv.style.width = '100%'

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx]
    const rowDiv = document.createElement('div')
    rowDiv.className = `table-row table-row-${region}-${rowIdx}`
    rowDiv.style.display = 'flex'
    rowDiv.style.flexDirection = 'row'
    rowDiv.style.width = '100%'
    rowDiv.style.height = `${row.height}mm`

    for (let colIdx = 0; colIdx < columns.length; colIdx++) {
      const column = columns[colIdx]
      const cell = row.cells.get(colIdx)

      if (cell) {
        const cellDiv = renderCell(
          cell,
          column,
          rowIdx,
          colIdx,
          row.height,
          options,
          renderableTable
        )
        rowDiv.appendChild(cellDiv)
      } else {
        // Empty cell placeholder
        const emptyCell = document.createElement('div')
        emptyCell.style.flex = `0 0 ${column.width}mm`
        emptyCell.style.height = `${row.height}mm`
        emptyCell.style.borderRight = `1px solid #ddd`
        emptyCell.style.borderBottom = `1px solid #ddd`
        rowDiv.appendChild(emptyCell)
      }
    }

    regionDiv.appendChild(rowDiv)
  }

  return regionDiv
}

/**
 * Render a single cell
 */
function renderCell(
  cell: RenderableCell,
  column: RenderableColumn,
  rowIdx: number,
  colIdx: number,
  rowHeight: number,
  options: UIRenderOptions,
  renderableTable: RenderableTableInstance
): HTMLElement {
  const cellDiv = document.createElement('div')
  cellDiv.id = `cell-${cell.cellID}`
  cellDiv.className = 'table-cell'
  cellDiv.style.flex = `0 0 ${column.width}mm`
  cellDiv.style.height = `${rowHeight}mm`
  cellDiv.style.padding = `${cell.style.padding.top}mm ${cell.style.padding.right}mm ${cell.style.padding.bottom}mm ${cell.style.padding.left}mm`
  cellDiv.style.boxSizing = 'border-box'
  cellDiv.style.overflow = 'hidden'
  cellDiv.style.wordWrap = 'break-word'

  // Apply styles
  applyCellStyles(cellDiv, cell.style, column)

  // Set content (computed value if dynamic, otherwise raw value)
  const value = cell.isDynamic ? (cell.computedValue || cell.rawValue) : cell.rawValue
  const textContent = String(value)

  if (options.mode === 'edit') {
    // Make cell editable
    cellDiv.contentEditable = 'true'
    cellDiv.style.cursor = 'text'
    cellDiv.style.outline = 'none'

    cellDiv.innerText = textContent

    // Save original value for change detection
    let originalValue = textContent

    // Handle blur event (when user finishes editing)
    cellDiv.addEventListener('blur', (e) => {
      const newValue = (e.target as HTMLElement).innerText

      if (newValue !== originalValue && options.onChange) {
        originalValue = newValue
        options.onChange(cell.cellID, newValue)
        // This will:
        // 1. Call table.updateCell(cellID, { rawValue: newValue })
        // 2. Table updates the cell
        // 3. Trigger re-render
        // 4. RenderableTable.create() called again
        // 5. UI updates with new values
      }
    })

    // Handle focus event
    cellDiv.addEventListener('focus', () => {
      cellDiv.style.backgroundColor = '#fffacd'  // Light yellow highlight
    })

    cellDiv.addEventListener('blur', () => {
      cellDiv.style.backgroundColor = cell.style.backgroundColor
    })

    // Prevent default browser formatting
    cellDiv.addEventListener('paste', (e) => {
      e.preventDefault()
      const text = e.clipboardData?.getData('text/plain') || ''
      document.execCommand('insertText', false, text)
    })
  } else {
    // View mode - not editable
    cellDiv.innerText = textContent
    cellDiv.style.cursor = 'default'
  }

  // Add click handler if provided
  if (options.onCellClick) {
    cellDiv.addEventListener('click', () => {
      options.onCellClick?.(cell.cellID, rowIdx, colIdx)
    })
  }

  return cellDiv
}

/**
 * Apply cell styles to HTML element
 */
function applyCellStyles(
  element: HTMLElement,
  style: CellStyle,
  column: RenderableColumn
): void {
  // Font properties
  element.style.fontFamily = style.fontName || 'Arial'
  element.style.fontSize = `${style.fontSize}pt`
  element.style.fontWeight = style.bold ? 'bold' : 'normal'
  element.style.fontStyle = style.italic ? 'italic' : 'normal'

  // Colors
  element.style.color = style.fontColor || '#000000'
  element.style.backgroundColor = style.backgroundColor || 'transparent'

  // Text alignment
  element.style.textAlign = (style.alignment || column.alignment || 'left') as any

  // Vertical alignment (using flexbox)
  element.style.display = 'flex'
  element.style.alignItems = getVerticalAlignValue(style.verticalAlignment)
  element.style.justifyContent = getHorizontalAlignValue(style.alignment || column.alignment)

  // Borders
  if (style.borderWidth) {
    element.style.borderTop = `${style.borderWidth.top}mm solid ${style.borderColor}`
    element.style.borderRight = `${style.borderWidth.right}mm solid ${style.borderColor}`
    element.style.borderBottom = `${style.borderWidth.bottom}mm solid ${style.borderColor}`
    element.style.borderLeft = `${style.borderWidth.left}mm solid ${style.borderColor}`
  } else {
    // Default borders
    element.style.borderRight = '1px solid #ddd'
    element.style.borderBottom = '1px solid #ddd'
  }

  // Line height
  element.style.lineHeight = `${style.lineHeight}em`

  // Character spacing
  element.style.letterSpacing = `${style.characterSpacing}pt`

  // Text decoration
  const decorations: string[] = []
  if ((style as any).strikethrough) {
    decorations.push('line-through')
  }
  if ((style as any).underline) {
    decorations.push('underline')
  }
  if (decorations.length > 0) {
    element.style.textDecoration = decorations.join(' ')
  }

  // Flex to allow text to wrap
  element.style.whiteSpace = 'pre-wrap'
  element.style.textWrap = 'wrap'
}

/**
 * Convert vertical alignment to CSS value
 */
function getVerticalAlignValue(alignment?: string): string {
  switch (alignment) {
    case 'top':
      return 'flex-start'
    case 'bottom':
      return 'flex-end'
    case 'middle':
    default:
      return 'center'
  }
}

/**
 * Convert horizontal alignment to CSS justify-content value
 */
function getHorizontalAlignValue(alignment?: string): string {
  switch (alignment) {
    case 'center':
      return 'center'
    case 'right':
      return 'flex-end'
    case 'justify':
      return 'space-between'
    case 'left':
    default:
      return 'flex-start'
  }
}
