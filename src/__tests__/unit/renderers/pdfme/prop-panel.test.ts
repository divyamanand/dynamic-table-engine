import { createDefaultTableValue } from '../../../../renderers/pdfme/prop-panel'
import { propPanel } from '../../../../renderers/pdfme/prop-panel'
import { Table } from '../../../../core/table'
import { SCHEMA_TYPE } from '../../../../renderers/pdfme/types'
import type { TableExportData } from '../../../../renderers/types/serialization.types'

describe('createDefaultTableValue', () => {
    it('should return valid JSON string', () => {
        const value = createDefaultTableValue()
        expect(() => JSON.parse(value)).not.toThrow()
    })

    it('should produce valid TableExportData', () => {
        const value = createDefaultTableValue()
        const data: TableExportData = JSON.parse(value)

        expect(data.headerTrees).toBeDefined()
        expect(data.body).toBeDefined()
        expect(data.settings).toBeDefined()
        expect(data.tableStyle).toBeDefined()
        expect(data.regionStyles).toBeDefined()
        expect(data.columnWidths).toBeDefined()
        expect(data.rowHeights).toBeDefined()
    })

    it('should create 3 header columns', () => {
        const value = createDefaultTableValue()
        const data: TableExportData = JSON.parse(value)

        expect(data.headerTrees.theader).toHaveLength(3)
        expect(data.headerTrees.theader[0].rawValue).toBe('Column 1')
        expect(data.headerTrees.theader[1].rawValue).toBe('Column 2')
        expect(data.headerTrees.theader[2].rawValue).toBe('Column 3')
    })

    it('should create 3 body rows with 3 columns each', () => {
        const value = createDefaultTableValue()
        const data: TableExportData = JSON.parse(value)

        expect(data.body).toHaveLength(3)
        expect(data.body[0]).toHaveLength(3)
        expect(data.body[1]).toHaveLength(3)
        expect(data.body[2]).toHaveLength(3)
    })

    it('should round-trip through Table.fromExportData', () => {
        const value = createDefaultTableValue()
        const data: TableExportData = JSON.parse(value)

        const table = Table.fromExportData(data)
        const reExported = table.exportState()

        expect(reExported.headerTrees.theader).toHaveLength(3)
        expect(reExported.body).toHaveLength(3)
        expect(reExported.body[0]).toHaveLength(3)
    })

    it('should have positive dimensions', () => {
        const value = createDefaultTableValue()
        const data: TableExportData = JSON.parse(value)

        expect(data.columnWidths.length).toBe(3)
        data.columnWidths.forEach(w => expect(w).toBeGreaterThan(0))
        data.rowHeights.forEach(h => expect(h).toBeGreaterThan(0))
    })
})

describe('propPanel', () => {
    it('should have correct default schema type', () => {
        expect(propPanel.defaultSchema.type).toBe(SCHEMA_TYPE)
    })

    it('should have position, width, height in default schema', () => {
        expect(propPanel.defaultSchema.position).toEqual({ x: 0, y: 0 })
        expect(propPanel.defaultSchema.width).toBeGreaterThan(0)
        expect(propPanel.defaultSchema.height).toBeGreaterThan(0)
    })

    it('should have content in default schema', () => {
        expect(propPanel.defaultSchema.content).toBeDefined()
        expect(typeof propPanel.defaultSchema.content).toBe('string')
    })

    it('should have showGridLines schema property', () => {
        const schema = propPanel.schema as Record<string, any>
        expect(schema.showGridLines).toBeDefined()
        expect(schema.showGridLines.type).toBe('boolean')
    })
})
