/**
 * PDF Renderer for the Dynamic Table pdfme plugin.
 *
 * Iterates through the RenderableTableInstance and delegates each cell's
 * rendering to pdfme's existing cell plugin (which uses rectangle, line,
 * and text renderers internally).
 *
 * When integrated into pdfme, cellPdfRender and rectanglePdfRender will be
 * imported from the actual pdfme schemas package. For now they are stubbed.
 */

import type { Region } from '../../types'
import type { DynamicTableSchema, PDFRenderProps } from './types'
import { instanceManager } from './instance-manager'
import { toPdfmeCellSchema, getCellDisplayValue } from './helpers/cell-schema-mapper'

/** Region iteration order */
const REGION_ORDER: Region[] = ['theader', 'lheader', 'rheader', 'body', 'footer']

/**
 * Stub for pdfme's cell plugin pdf renderer.
 * Will be replaced with actual import when attached to pdfme:
 *   import cell from '../tables/cell.js'
 *   const cellPdfRender = cell.pdf
 */
async function cellPdfRender(arg: PDFRenderProps<any>): Promise<void> {
  // Stub — delegates to rectangle.pdf (background) + line.pdf (borders) + text.pdf (content)
  // Implementation provided by pdfme's cell plugin at integration time
}

/**
 * Stub for pdfme's rectangle plugin pdf renderer.
 * Will be replaced with actual import when attached to pdfme:
 *   import { rectangle } from '../shapes/rectAndEllipse.js'
 *   const rectanglePdfRender = rectangle.pdf
 */
async function rectanglePdfRender(arg: PDFRenderProps<any>): Promise<void> {
  // Stub — draws a rectangle (used for table outer border)
  // Implementation provided by pdfme's rectangle plugin at integration time
}

/**
 * pdfme pdf() function for the dynamic table plugin.
 *
 * Flow:
 * 1. Parse value → Table → RenderableTableInstance (via InstanceManager)
 * 2. Iterate all regions → rows → cells
 * 3. For each cell: map to PdfmeCellSchema, delegate to cellPdfRender
 * 4. Draw table outer border via rectanglePdfRender
 */
export async function pdfRender(arg: PDFRenderProps<DynamicTableSchema>): Promise<void> {
  const { value, schema } = arg
  const { renderable } = instanceManager.getOrCreate(schema.name, value)

  const offsetX = schema.position.x
  const offsetY = schema.position.y
  const { settings } = renderable

  // Draw cells region by region
  for (const region of REGION_ORDER) {
    // Skip hidden headers
    if (region === 'theader' && settings.headerVisibility?.theader === false) continue
    if (region === 'lheader' && settings.headerVisibility?.lheader === false) continue
    if (region === 'rheader' && settings.headerVisibility?.rheader === false) continue

    const rows = renderable.getRowsInRegion(region)
    for (const row of rows) {
      for (const [_colIdx, cell] of row.cells) {
        const cellSchema = toPdfmeCellSchema(cell, offsetX, offsetY)
        const displayValue = getCellDisplayValue(cell)

        await cellPdfRender({
          ...arg,
          value: displayValue,
          schema: cellSchema,
        })
      }
    }
  }

  // Draw table outer border
  const { tableStyle } = renderable
  if (tableStyle.borderWidth) {
    const borderWidth = tableStyle.borderWidth.top ?? 0.1
    const borderColor = tableStyle.borderColor ?? '#000000'

    await rectanglePdfRender({
      ...arg,
      schema: {
        name: '',
        type: 'rectangle',
        position: { x: offsetX, y: offsetY },
        width: renderable.getWidth(),
        height: renderable.getHeight(),
        borderWidth,
        borderColor,
        color: '',
        readOnly: true,
      } as any,
    })
  }
}
