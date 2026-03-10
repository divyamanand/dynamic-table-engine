/**
 * Dynamic Table pdfme Plugin
 *
 * Exposes the campx dynamic table engine as a pdfme plugin.
 * The table engine makes all decisions (geometry, layout, styles, rules).
 * pdfme's existing renderers (rectangle, line, text) execute the actual drawing.
 *
 * Usage (when attached to pdfme):
 * ```typescript
 * import { dynamicTablePlugin } from 'campx-dynamic-table-engine/renderers/pdfme'
 * import { generate } from '@pdfme/generator'
 *
 * const template = {
 *   schemas: [[{
 *     name: 'myTable',
 *     type: 'dynamicTable',
 *     position: { x: 10, y: 10 },
 *     width: 190,
 *     height: 100,
 *   }]],
 *   basePdf: { ... },
 * }
 *
 * const inputs = [{
 *   myTable: JSON.stringify(tableExportData),
 * }]
 *
 * const pdf = await generate({
 *   template,
 *   inputs,
 *   plugins: { dynamicTable: dynamicTablePlugin },
 * })
 * ```
 */

import type { Plugin, DynamicTableSchema } from './types'
import { pdfRender } from './pdf'
import { uiRender } from './ui'
import { propPanel } from './prop-panel'

const TABLE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>`

export const dynamicTablePlugin: Plugin<DynamicTableSchema> = {
  pdf: pdfRender,
  ui: uiRender,
  propPanel,
  icon: TABLE_ICON,
}

// Re-export types
export { DynamicTableSchema, SCHEMA_TYPE } from './types'
export type { PdfmeCellSchema, PDFRenderProps, UIRenderProps, Plugin, PropPanel } from './types'

// Re-export instance manager
export { TableInstanceManager, instanceManager } from './instance-manager'

// Re-export helpers
export { toPdfmeCellSchema, getCellDisplayValue } from './helpers/cell-schema-mapper'

// Re-export prop panel helper
export { createDefaultTableValue } from './prop-panel'
