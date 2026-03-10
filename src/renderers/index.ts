/**
 * Table Renderer Plugin
 *
 * Provides PDF and HTML rendering for tables using the three-layer architecture:
 * 1. Table (Facade) - data model & operations
 * 2. RenderableTable (Wrapper) - extract & organize for rendering
 * 3. Renderers (PDF/HTML) - visual output
 */

export { RenderableTable } from './renderable-table'
export type {
  RenderableCell,
  RenderableRow,
  RenderableColumn,
  RenderableMerge,
  RenderableTableInstance,
} from './types/renderable-types'

export { pdfRender } from './pdf-render'
export type { PDFRenderOptions, PDFContext } from './pdf-render'

export { uiRender } from './ui-render'
export type { UIRenderOptions, UIMode } from './ui-render'

import { ITable } from '../interfaces/table/table.inteface'
import { pdfRender, PDFRenderOptions } from './pdf-render'
import { uiRender, UIRenderOptions } from './ui-render'

/**
 * Plugin interface for table rendering
 */
export interface TableRendererPlugin {
  /**
   * Render table to PDF
   */
  pdf(table: ITable, options?: PDFRenderOptions): Promise<Uint8Array>

  /**
   * Render table to interactive HTML
   */
  ui(table: ITable, options?: UIRenderOptions): Promise<HTMLElement>
}

/**
 * Create a table renderer plugin instance
 *
 * Usage:
 * ```typescript
 * const plugin = createTableRendererPlugin()
 *
 * // Render to PDF
 * const pdfBytes = await plugin.pdf(table, { pageWidth: 210 })
 *
 * // Render to HTML
 * const htmlElement = await plugin.ui(table, {
 *   mode: 'edit',
 *   onChange: (cellID, value) => table.updateCell(cellID, { rawValue: value })
 * })
 * ```
 */
export function createTableRendererPlugin(): TableRendererPlugin {
  return {
    pdf: async (table: ITable, options?: PDFRenderOptions) => {
      return pdfRender(table, options)
    },
    ui: async (table: ITable, options?: UIRenderOptions) => {
      return uiRender(table, options)
    },
  }
}

/**
 * Export default plugin instance
 */
export const tableRendererPlugin = createTableRendererPlugin()
