/**
 * pdfme Plugin Types for Dynamic Table Engine
 *
 * These types mirror pdfme's interfaces so the plugin can be developed
 * independently and attached to pdfme later. When integrated into pdfme,
 * these local types will be replaced with imports from @pdfme/common.
 */

// ---- pdfme-compatible base types (mirrors @pdfme/common) ----

/** Base Schema shape from pdfme */
export interface Schema {
  name: string
  type: string
  content?: string
  position: { x: number; y: number }
  width: number
  height: number
  rotate?: number
  opacity?: number
  readOnly?: boolean
  required?: boolean
  [key: string]: unknown
}

/** PDF render props from pdfme */
export interface PDFRenderProps<T extends Schema> {
  value: string
  schema: T
  basePdf: unknown
  pdfLib: unknown
  pdfDoc: unknown
  page: unknown
  options: Record<string, unknown>
  _cache: Map<string | number, unknown>
}

/** UI render props from pdfme */
export interface UIRenderProps<T extends Schema> {
  schema: T
  basePdf: unknown
  mode: 'viewer' | 'form' | 'designer'
  tabIndex?: number
  placeholder?: string
  stopEditing?: () => void
  value: string
  onChange?: (arg: { key: string; value: unknown } | { key: string; value: unknown }[]) => void
  rootElement: any // HTMLDivElement at runtime; typed as any to avoid DOM lib dependency
  options: Record<string, unknown>
  theme: Record<string, unknown>
  i18n: (key: string) => string
  scale: number
  _cache: Map<string | number, unknown>
}

/** PropPanel type from pdfme */
export interface PropPanel<T extends Schema> {
  schema:
    | ((propPanelProps: Record<string, unknown>) => Record<string, unknown>)
    | Record<string, unknown>
  widgets?: Record<string, (props: unknown) => void>
  defaultSchema: T
}

/** Plugin type from pdfme */
export type Plugin<T extends Schema = Schema> = {
  pdf: (arg: PDFRenderProps<T>) => Promise<void> | void
  ui: (arg: UIRenderProps<T>) => Promise<void> | void
  propPanel: PropPanel<T>
  icon?: string
  uninterruptedEditMode?: boolean
}

// ---- Dynamic Table Plugin types ----

export const SCHEMA_TYPE = 'dynamicTable' as const

/**
 * Schema for the dynamic table plugin.
 * Extends pdfme's base Schema with table-specific display options.
 * The actual table data lives in the `value` field (JSON-encoded TableExportData).
 */
export interface DynamicTableSchema extends Schema {
  type: typeof SCHEMA_TYPE
  showGridLines?: boolean
}

/**
 * Maps our CellStyle to pdfme's cell schema shape.
 * Used when delegating rendering to pdfme's cell/text/rectangle/line renderers.
 */
export interface PdfmeCellSchema extends Schema {
  fontName?: string
  bold?: boolean
  italic?: boolean
  alignment: string
  verticalAlignment: string
  fontSize: number
  lineHeight: number
  characterSpacing: number
  fontColor: string
  backgroundColor: string
  borderColor: string
  borderWidth: { top: number; right: number; bottom: number; left: number }
  padding: { top: number; right: number; bottom: number; left: number }
}
