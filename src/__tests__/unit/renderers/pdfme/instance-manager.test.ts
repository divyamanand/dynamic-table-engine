import { TableInstanceManager } from '../../../../renderers/pdfme/instance-manager'
import { Table } from '../../../../core/table'
import { StructureStore } from '../../../../stores/structure.store'
import { CellRegistry } from '../../../../stores/cell-registry.store'
import { MergeRegistry } from '../../../../stores/merge-registry.stores'
import { LayoutEngine } from '../../../../engines/layout.engine'
import { RuleEngine } from '../../../../rules/rule-engine'
import { RuleRegistry } from '../../../../rules/rule-registry'

function createTestTable(): Table {
    const structureStore = new StructureStore()
    const cellRegistry = new CellRegistry()
    const mergeRegistry = new MergeRegistry(structureStore)
    const layoutEngine = new LayoutEngine(mergeRegistry, structureStore, cellRegistry)
    const ruleRegistry = new RuleRegistry()

    const tempTable = new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, {} as any)
    const ruleEngine = new RuleEngine(ruleRegistry, cellRegistry, structureStore, tempTable)
    return new Table(structureStore, cellRegistry, layoutEngine, mergeRegistry, ruleEngine)
}

function createTestValue(): string {
    const table = createTestTable()
    const h1 = table.addHeaderCell('theader')
    const h2 = table.addHeaderCell('theader')
    table.updateCell(h1, { rawValue: 'Name' })
    table.updateCell(h2, { rawValue: 'Age' })
    table.buildBody([['Alice', '30'], ['Bob', '25']])
    return JSON.stringify(table.exportState())
}

describe('TableInstanceManager', () => {
    let manager: TableInstanceManager

    beforeEach(() => {
        manager = new TableInstanceManager()
    })

    describe('getOrCreate', () => {
        it('should create a new entry on first call', () => {
            const value = createTestValue()
            const result = manager.getOrCreate('test', value)

            expect(result.table).toBeDefined()
            expect(result.renderable).toBeDefined()
            expect(manager.has('test')).toBe(true)
        })

        it('should return cached entry on same value', () => {
            const value = createTestValue()
            const result1 = manager.getOrCreate('test', value)
            const result2 = manager.getOrCreate('test', value)

            expect(result1.table).toBe(result2.table)
            expect(result1.renderable).toBe(result2.renderable)
        })

        it('should reconstruct on different value', () => {
            const value1 = createTestValue()
            const result1 = manager.getOrCreate('test', value1)

            // Create a different table value
            const table2 = createTestTable()
            table2.addHeaderCell('theader')
            table2.buildBody([['X']])
            const value2 = JSON.stringify(table2.exportState())

            const result2 = manager.getOrCreate('test', value2)

            expect(result2.table).not.toBe(result1.table)
            expect(result2.renderable).not.toBe(result1.renderable)
        })

        it('should support multiple keys independently', () => {
            const value = createTestValue()
            const result1 = manager.getOrCreate('table-a', value)
            const result2 = manager.getOrCreate('table-b', value)

            // Different keys get different instances even with same value
            expect(result1.table).not.toBe(result2.table)
            expect(manager.has('table-a')).toBe(true)
            expect(manager.has('table-b')).toBe(true)
        })

        it('should produce correct renderable structure', () => {
            const value = createTestValue()
            const { renderable } = manager.getOrCreate('test', value)

            // Should have theader rows
            const theaderRows = renderable.getRowsInRegion('theader')
            expect(theaderRows.length).toBeGreaterThan(0)

            // Should have body rows
            const bodyRows = renderable.getRowsInRegion('body')
            expect(bodyRows.length).toBe(2)

            // Should have columns
            expect(renderable.columns.length).toBe(2)

            // Width and height should be positive
            expect(renderable.getWidth()).toBeGreaterThan(0)
            expect(renderable.getHeight()).toBeGreaterThan(0)
        })
    })

    describe('update', () => {
        it('should mutate the table and return new serialized value', () => {
            const value = createTestValue()
            manager.getOrCreate('test', value)

            const newValue = manager.update('test', (table) => {
                const exported = table.exportState()
                const cellId = exported.body[0][0].cellId
                table.updateCell(cellId, { rawValue: 'Updated' })
            })

            expect(newValue).not.toBe(value)

            // Verify the new value round-trips
            const parsed = JSON.parse(newValue)
            expect(parsed.body[0][0].rawValue).toBe('Updated')
        })

        it('should update the cache with new renderable', () => {
            const value = createTestValue()
            const result1 = manager.getOrCreate('test', value)

            manager.update('test', (table) => {
                const exported = table.exportState()
                const cellId = exported.body[0][0].cellId
                table.updateCell(cellId, { rawValue: 'Changed' })
            })

            // Getting with old value should NOT match (cache has new value)
            const result2 = manager.getOrCreate('test', value)
            expect(result2.table).not.toBe(result1.table)
        })

        it('should throw for non-existent key', () => {
            expect(() => {
                manager.update('nonexistent', () => {})
            }).toThrow('no cached entry')
        })
    })

    describe('invalidate', () => {
        it('should remove cached entry', () => {
            const value = createTestValue()
            manager.getOrCreate('test', value)
            expect(manager.has('test')).toBe(true)

            manager.invalidate('test')
            expect(manager.has('test')).toBe(false)
        })

        it('should not throw for non-existent key', () => {
            expect(() => manager.invalidate('nonexistent')).not.toThrow()
        })
    })

    describe('dispose', () => {
        it('should remove cached entry', () => {
            const value = createTestValue()
            manager.getOrCreate('test', value)

            manager.dispose('test')
            expect(manager.has('test')).toBe(false)
        })
    })

    describe('clear', () => {
        it('should remove all cached entries', () => {
            const value = createTestValue()
            manager.getOrCreate('a', value)
            manager.getOrCreate('b', value)
            manager.getOrCreate('c', value)

            expect(manager.has('a')).toBe(true)
            expect(manager.has('b')).toBe(true)
            expect(manager.has('c')).toBe(true)

            manager.clear()

            expect(manager.has('a')).toBe(false)
            expect(manager.has('b')).toBe(false)
            expect(manager.has('c')).toBe(false)
        })
    })
})
