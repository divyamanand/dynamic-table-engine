import { toPdfmeCellSchema, getCellDisplayValue } from '../../../../renderers/pdfme/helpers/cell-schema-mapper'
import type { RenderableCell } from '../../../../renderers/types/renderable-types'
import type { CellLayout, CellStyle } from '../../../../types'

function createMockCell(overrides?: Partial<RenderableCell>): RenderableCell {
    const defaultLayout: CellLayout = {
        row: 0,
        col: 0,
        rowSpan: 1,
        colSpan: 1,
        x: 10,
        y: 20,
        width: 40,
        height: 15,
    }

    const defaultStyle: CellStyle = {
        fontName: 'Arial',
        bold: false,
        italic: false,
        alignment: 'left',
        verticalAlignment: 'middle',
        fontSize: 13,
        lineHeight: 1,
        characterSpacing: 0,
        fontColor: '#000000',
        backgroundColor: '#FFFFFF',
        borderColor: '#888888',
        borderWidth: { top: 0.1, right: 0.1, bottom: 0.1, left: 0.1 },
        padding: { top: 5, right: 5, bottom: 5, left: 5 },
    }

    return {
        cellID: 'cell-1',
        rawValue: 'Hello',
        layout: defaultLayout,
        style: defaultStyle,
        inRegion: 'body',
        isDynamic: false,
        ...overrides,
    }
}

describe('toPdfmeCellSchema', () => {
    it('should map basic cell properties', () => {
        const cell = createMockCell()
        const schema = toPdfmeCellSchema(cell, 0, 0)

        expect(schema.name).toBe('')
        expect(schema.type).toBe('cell')
        expect(schema.width).toBe(40)
        expect(schema.height).toBe(15)
    })

    it('should apply table offset to position', () => {
        const cell = createMockCell()
        const schema = toPdfmeCellSchema(cell, 50, 30)

        // cell.layout.x = 10, cell.layout.y = 20
        expect(schema.position.x).toBe(60) // 50 + 10
        expect(schema.position.y).toBe(50) // 30 + 20
    })

    it('should map position without offset', () => {
        const cell = createMockCell()
        const schema = toPdfmeCellSchema(cell, 0, 0)

        expect(schema.position.x).toBe(10)
        expect(schema.position.y).toBe(20)
    })

    it('should map all font properties', () => {
        const cell = createMockCell({
            style: {
                ...createMockCell().style,
                fontName: 'Helvetica',
                bold: true,
                italic: true,
                fontSize: 16,
                lineHeight: 1.5,
                characterSpacing: 0.5,
            },
        })
        const schema = toPdfmeCellSchema(cell, 0, 0)

        expect(schema.fontName).toBe('Helvetica')
        expect(schema.bold).toBe(true)
        expect(schema.italic).toBe(true)
        expect(schema.fontSize).toBe(16)
        expect(schema.lineHeight).toBe(1.5)
        expect(schema.characterSpacing).toBe(0.5)
    })

    it('should map alignment properties', () => {
        const cell = createMockCell({
            style: {
                ...createMockCell().style,
                alignment: 'center',
                verticalAlignment: 'top',
            },
        })
        const schema = toPdfmeCellSchema(cell, 0, 0)

        expect(schema.alignment).toBe('center')
        expect(schema.verticalAlignment).toBe('top')
    })

    it('should map color properties', () => {
        const cell = createMockCell({
            style: {
                ...createMockCell().style,
                fontColor: '#FF0000',
                backgroundColor: '#00FF00',
                borderColor: '#0000FF',
            },
        })
        const schema = toPdfmeCellSchema(cell, 0, 0)

        expect(schema.fontColor).toBe('#FF0000')
        expect(schema.backgroundColor).toBe('#00FF00')
        expect(schema.borderColor).toBe('#0000FF')
    })

    it('should map border and padding as copies', () => {
        const cell = createMockCell()
        const schema = toPdfmeCellSchema(cell, 0, 0)

        // Should be equal values
        expect(schema.borderWidth).toEqual({ top: 0.1, right: 0.1, bottom: 0.1, left: 0.1 })
        expect(schema.padding).toEqual({ top: 5, right: 5, bottom: 5, left: 5 })

        // Should be copies, not references
        expect(schema.borderWidth).not.toBe(cell.style.borderWidth)
        expect(schema.padding).not.toBe(cell.style.padding)
    })

    it('should handle cell at origin with no offset', () => {
        const cell = createMockCell({
            layout: {
                row: 0, col: 0, rowSpan: 1, colSpan: 1,
                x: 0, y: 0, width: 30, height: 10,
            },
        })
        const schema = toPdfmeCellSchema(cell, 0, 0)

        expect(schema.position.x).toBe(0)
        expect(schema.position.y).toBe(0)
    })
})

describe('getCellDisplayValue', () => {
    it('should return rawValue for non-dynamic cells', () => {
        const cell = createMockCell({ rawValue: 'Hello', isDynamic: false })
        expect(getCellDisplayValue(cell)).toBe('Hello')
    })

    it('should return computedValue for dynamic cells', () => {
        const cell = createMockCell({
            rawValue: '=1+2',
            computedValue: '3',
            isDynamic: true,
        })
        expect(getCellDisplayValue(cell)).toBe('3')
    })

    it('should fallback to rawValue when dynamic cell has no computedValue', () => {
        const cell = createMockCell({
            rawValue: '=1+2',
            computedValue: undefined,
            isDynamic: true,
        })
        expect(getCellDisplayValue(cell)).toBe('=1+2')
    })

    it('should convert numeric values to string', () => {
        const cell = createMockCell({ rawValue: 42, isDynamic: false })
        expect(getCellDisplayValue(cell)).toBe('42')
    })

    it('should handle empty string', () => {
        const cell = createMockCell({ rawValue: '', isDynamic: false })
        expect(getCellDisplayValue(cell)).toBe('')
    })
})
