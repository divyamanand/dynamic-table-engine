/**
 * UI Renderer for the Dynamic Table pdfme plugin.
 *
 * Renders the table into the rootElement provided by pdfme.
 * Each cell is positioned absolutely based on layout data from our engine.
 * Cell content rendering delegates to pdfme's existing cell/text UI renderer.
 *
 * Modes:
 * - viewer: Read-only display
 * - designer: Read-only display (pdfme handles resize handles externally)
 * - form: Body cells are editable; changes propagate via onChange
 */

import type { Region } from '../../types'
import type { DynamicTableSchema, UIRenderProps } from './types'
import { instanceManager } from './instance-manager'
import { toPdfmeCellSchema, getCellDisplayValue } from './helpers/cell-schema-mapper'

/** Region iteration order */
const REGION_ORDER: Region[] = ['theader', 'lheader', 'rheader', 'body', 'footer']

/**
 * Stub for pdfme's cell plugin ui renderer.
 * Will be replaced with actual import when attached to pdfme:
 *   import cell from '../tables/cell.js'
 *   const cellUiRender = cell.ui
 */
async function cellUiRender(arg: UIRenderProps<any>): Promise<void> {
  // Stub — renders cell background, borders, and text into rootElement
  // For now, provide a basic fallback rendering
  const { schema, value, rootElement } = arg

  // Background
  rootElement.style.backgroundColor = schema.backgroundColor || 'transparent'

  // Border
  if (schema.borderWidth && schema.borderColor) {
    const bw = schema.borderWidth
    rootElement.style.borderTop = `${bw.top}mm solid ${schema.borderColor}`
    rootElement.style.borderRight = `${bw.right}mm solid ${schema.borderColor}`
    rootElement.style.borderBottom = `${bw.bottom}mm solid ${schema.borderColor}`
    rootElement.style.borderLeft = `${bw.left}mm solid ${schema.borderColor}`
  }

  // Text content
  const textDiv = document.createElement('div')
  textDiv.style.width = '100%'
  textDiv.style.height = '100%'
  textDiv.style.display = 'flex'
  textDiv.style.alignItems = mapVerticalAlign(schema.verticalAlignment)
  textDiv.style.justifyContent = mapHorizontalAlign(schema.alignment)
  textDiv.style.fontFamily = schema.fontName || 'Arial, sans-serif'
  textDiv.style.fontSize = `${schema.fontSize}pt`
  textDiv.style.fontWeight = schema.bold ? 'bold' : 'normal'
  textDiv.style.fontStyle = schema.italic ? 'italic' : 'normal'
  textDiv.style.color = schema.fontColor || '#000000'
  textDiv.style.lineHeight = `${schema.lineHeight}em`
  textDiv.style.letterSpacing = `${schema.characterSpacing}pt`
  textDiv.style.overflow = 'hidden'
  textDiv.style.whiteSpace = 'pre-wrap'
  textDiv.style.boxSizing = 'border-box'

  if (schema.padding) {
    const pd = schema.padding
    textDiv.style.padding = `${pd.top}mm ${pd.right}mm ${pd.bottom}mm ${pd.left}mm`
  }

  textDiv.textContent = value
  rootElement.appendChild(textDiv)
}

function mapVerticalAlign(va?: string): string {
  switch (va) {
    case 'top': return 'flex-start'
    case 'bottom': return 'flex-end'
    case 'middle':
    default: return 'center'
  }
}

function mapHorizontalAlign(ha?: string): string {
  switch (ha) {
    case 'center': return 'center'
    case 'right': return 'flex-end'
    case 'justify': return 'space-between'
    case 'left':
    default: return 'flex-start'
  }
}

/**
 * pdfme ui() function for the dynamic table plugin.
 *
 * Flow:
 * 1. Parse value → Table → RenderableTableInstance (via InstanceManager)
 * 2. Clear rootElement
 * 3. Create absolutely-positioned cell divs based on layout data
 * 4. Delegate each cell's rendering to cellUiRender
 * 5. In form mode: attach edit handlers for body cells
 */
export async function uiRender(arg: UIRenderProps<DynamicTableSchema>): Promise<void> {
  const { schema, value, rootElement, mode, onChange } = arg
  const { renderable } = instanceManager.getOrCreate(schema.name, value)

  // Clear previous render
  rootElement.innerHTML = ''

  // Container setup
  rootElement.style.position = 'relative'
  rootElement.style.width = '100%'
  rootElement.style.height = '100%'
  rootElement.style.overflow = 'hidden'

  const { settings, tableStyle } = renderable

  // Table outer border
  if (tableStyle.borderColor) {
    const bw = tableStyle.borderWidth?.top ?? 0.1
    rootElement.style.border = `${bw}mm solid ${tableStyle.borderColor}`
  }

  // Render cells region by region
  for (const region of REGION_ORDER) {
    // Skip hidden headers
    if (region === 'theader' && settings.headerVisibility?.theader === false) continue
    if (region === 'lheader' && settings.headerVisibility?.lheader === false) continue
    if (region === 'rheader' && settings.headerVisibility?.rheader === false) continue

    const rows = renderable.getRowsInRegion(region)
    for (const row of rows) {
      for (const [_colIdx, cell] of row.cells) {
        // Create cell container
        const cellDiv = document.createElement('div')
        cellDiv.style.position = 'absolute'
        cellDiv.style.left = `${cell.layout.x}mm`
        cellDiv.style.top = `${cell.layout.y}mm`
        cellDiv.style.width = `${cell.layout.width}mm`
        cellDiv.style.height = `${cell.layout.height}mm`
        cellDiv.style.boxSizing = 'border-box'
        cellDiv.dataset.cellId = cell.cellID
        cellDiv.dataset.region = region

        // Map to pdfme cell schema and render
        const cellSchema = toPdfmeCellSchema(cell, 0, 0)
        const displayValue = getCellDisplayValue(cell)

        await cellUiRender({
          ...arg,
          schema: cellSchema as any,
          value: displayValue,
          rootElement: cellDiv,
        })

        // Form mode: make body cells editable
        if (mode === 'form' && region === 'body' && onChange && !schema.readOnly) {
          attachEditHandler(cellDiv, cell.cellID, schema.name, onChange)
        }

        rootElement.appendChild(cellDiv)
      }
    }
  }
}

/**
 * Attach a blur-based edit handler to a cell div for form mode.
 */
function attachEditHandler(
  cellDiv: HTMLDivElement,
  cellId: string,
  schemaName: string,
  onChange: (arg: { key: string; value: unknown } | { key: string; value: unknown }[]) => void,
): void {
  // Find the text div inside the cell
  const textDiv = cellDiv.querySelector('div') as HTMLDivElement | null
  if (!textDiv) return

  textDiv.contentEditable = 'true'
  textDiv.style.cursor = 'text'
  textDiv.style.outline = 'none'

  const originalValue = textDiv.textContent || ''

  textDiv.addEventListener('blur', () => {
    const newValue = textDiv.textContent || ''
    if (newValue === originalValue) return

    // Update the table instance and push new value to pdfme
    const newSerializedValue = instanceManager.update(schemaName, (table) => {
      table.updateCell(cellId, { rawValue: newValue })
    })

    onChange({ key: 'content', value: newSerializedValue })
  })
}
