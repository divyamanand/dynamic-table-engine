/**
 * TableInstanceManager — caches Table + RenderableTableInstance to avoid
 * reconstructing from JSON on every pdfme render call.
 *
 * pdfme may call pdf() or ui() many times in rapid succession (e.g., during
 * drag/resize in the designer). This cache ensures we only reconstruct when
 * the value actually changes.
 */

import { Table } from '../../core/table'
import { RenderableTable } from '../renderable-table'
import type { RenderableTableInstance } from '../types/renderable-types'
import type { TableExportData } from '../types/serialization.types'

interface CacheEntry {
  table: Table
  renderable: RenderableTableInstance
  value: string
}

export class TableInstanceManager {
  private cache = new Map<string, CacheEntry>()

  /**
   * Get or create a Table + RenderableTableInstance from a serialized value.
   * Returns cached instance if the value string hasn't changed.
   */
  getOrCreate(key: string, value: string): { table: Table; renderable: RenderableTableInstance } {
    const existing = this.cache.get(key)

    if (existing && existing.value === value) {
      return { table: existing.table, renderable: existing.renderable }
    }

    const exportData: TableExportData = JSON.parse(value)
    const table = Table.fromExportData(exportData)
    const renderable = RenderableTable.create(table)

    this.cache.set(key, { table, renderable, value })

    return { table, renderable }
  }

  /**
   * Mutate the cached Table and return a new serialized value.
   * Used in form mode when the user edits a cell.
   */
  update(key: string, mutator: (table: Table) => void): string {
    const existing = this.cache.get(key)
    if (!existing) {
      throw new Error(`TableInstanceManager: no cached entry for key "${key}"`)
    }

    mutator(existing.table)

    const exportData = existing.table.exportState()
    const newValue = JSON.stringify(exportData)
    const renderable = RenderableTable.create(existing.table)

    this.cache.set(key, { table: existing.table, renderable, value: newValue })

    return newValue
  }

  /**
   * Invalidate a cached entry, forcing reconstruction on next getOrCreate.
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Remove a cached entry entirely.
   */
  dispose(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cached entries.
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Check if a key exists in the cache.
   */
  has(key: string): boolean {
    return this.cache.has(key)
  }
}

/** Singleton instance for use across the plugin */
export const instanceManager = new TableInstanceManager()
