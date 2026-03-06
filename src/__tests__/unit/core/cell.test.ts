import { Cell } from '../../../core/cell'
import { CellStyle } from '../../../types'

describe('Cell', () => {
    let style: CellStyle

    beforeEach(() => {
        style = {
            fontName: 'Arial',
            bold: false,
            italic: false,
            alignment: 'left',
            verticalAlignment: 'middle',
            fontSize: 13,
            lineHeight: 1,
            characterSpacing: 0,
            fontColor: '#000000',
            backgroundColor: '',
            borderColor: '#888888',
            borderWidth: { top: 0.1, right: 0.1, bottom: 0.1, left: 0.1 },
            padding: { top: 5, right: 5, bottom: 5, left: 5 },
        }
    })

    describe('constructor', () => {
        it('should initialize with all required parameters', () => {
            const cellID = 'cell-1'
            const cell = new Cell(cellID, 'body', 'Hello', false, style)

            expect(cell.cellID).toBe(cellID)
            expect(cell.inRegion).toBe('body')
            expect(cell.rawValue).toBe('Hello')
            expect(cell.isDynamic).toBe(false)
            expect(cell.style).toEqual(style)
            expect(cell.computedValue).toBeUndefined()
        })

        it('should initialize with isDynamic as optional parameter', () => {
            const cell = new Cell('cell-1', 'body', 'test', true, style)
            expect(cell.isDynamic).toBe(true)
        })

        it('should initialize with computedValue', () => {
            const cell = new Cell('cell-1', 'body', '=1+2', true, style, 3)
            expect(cell.computedValue).toBe(3)
        })

        it('should support numeric raw values', () => {
            const cell = new Cell('cell-1', 'body', 42, false, style)
            expect(cell.rawValue).toBe(42)
        })

        it('should support string raw values', () => {
            const cell = new Cell('cell-1', 'body', 'text', false, style)
            expect(cell.rawValue).toBe('text')
        })

        it('should support numeric computed values', () => {
            const cell = new Cell('cell-1', 'body', 'formula', true, style, 100)
            expect(cell.computedValue).toBe(100)
        })

        it('should support string computed values', () => {
            const cell = new Cell('cell-1', 'body', 'formula', true, style, 'result')
            expect(cell.computedValue).toBe('result')
        })

        it('should initialize layout as undefined', () => {
            const cell = new Cell('cell-1', 'body', 'test', false, style)
            expect(cell.layout).toBeUndefined()
        })

        it('should support different regions', () => {
            const regions: Array<'body' | 'theader' | 'lheader' | 'rheader' | 'footer'> = ['body', 'theader', 'lheader', 'rheader', 'footer']

            for (const region of regions) {
                const cell = new Cell(`cell-${region}`, region, 'test', false, style)
                expect(cell.inRegion).toBe(region)
            }
        })

        it('should have immutable cellID', () => {
            const cellID = 'cell-1'
            const cell = new Cell(cellID, 'body', 'test', false, style)

            const originalId = cell.cellID
            expect(() => {
                ;(cell as any).cellID = 'new-id'
            }).toThrow() // cellID is read-only and cannot be assigned
        })

        it('should initialize with empty string rawValue', () => {
            const cell = new Cell('cell-1', 'body', '', false, style)
            expect(cell.rawValue).toBe('')
        })

        it('should initialize with zero rawValue', () => {
            const cell = new Cell('cell-1', 'body', 0, false, style)
            expect(cell.rawValue).toBe(0)
        })
    })

    describe('layout operations', () => {
        it('should return undefined layout initially', () => {
            const cell = new Cell('cell-1', 'body', 'test', false, style)
            expect(cell.layout).toBeUndefined()
        })

        it('should set layout via _setLayout', () => {
            const cell = new Cell('cell-1', 'body', 'test', false, style)
            const layout = { row: 0, col: 0, rowSpan: 1, colSpan: 1, x: 0, y: 0, width: 30, height: 10 }

            cell._setLayout(layout)

            expect(cell.layout).toEqual(layout)
        })

        it('should update layout on subsequent _setLayout calls', () => {
            const cell = new Cell('cell-1', 'body', 'test', false, style)
            const layout1 = { row: 0, col: 0, rowSpan: 1, colSpan: 1, x: 0, y: 0, width: 30, height: 10 }
            const layout2 = { row: 1, col: 1, rowSpan: 2, colSpan: 2, x: 30, y: 10, width: 60, height: 20 }

            cell._setLayout(layout1)
            expect(cell.layout).toEqual(layout1)

            cell._setLayout(layout2)
            expect(cell.layout).toEqual(layout2)
        })

        it('should clear layout via clearLayout', () => {
            const cell = new Cell('cell-1', 'body', 'test', false, style)
            const layout = { row: 0, col: 0, rowSpan: 1, colSpan: 1, x: 0, y: 0, width: 30, height: 10 }

            cell._setLayout(layout)
            expect(cell.layout).toBeDefined()

            cell.clearLayout()
            expect(cell.layout).toBeUndefined()
        })

        it('should support complex layout with large spans', () => {
            const cell = new Cell('cell-1', 'body', 'test', false, style)
            const layout = { row: 5, col: 10, rowSpan: 10, colSpan: 5, x: 100, y: 50, width: 150, height: 100 }

            cell._setLayout(layout)
            expect(cell.layout).toEqual(layout)
        })

        it('should support layout with zero dimensions', () => {
            const cell = new Cell('cell-1', 'body', 'test', false, style)
            const layout = { row: 0, col: 0, rowSpan: 0, colSpan: 0, x: 0, y: 0, width: 0, height: 0 }

            cell._setLayout(layout)
            expect(cell.layout).toEqual(layout)
        })
    })

    describe('style property', () => {
        it('should maintain style reference', () => {
            const cell = new Cell('cell-1', 'body', 'test', false, style)
            expect(cell.style).toBe(style)
        })

        it('should support partial style', () => {
            const partialStyle: CellStyle = {
                bold: true,
                fontSize: 16,
                alignment: 'center',
                italic: true,
                fontColor: '#FF0000',
                backgroundColor: '#FFFF00',
                borderColor: '#000000',
                borderWidth: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
                padding: { top: 10, right: 10, bottom: 10, left: 10 },
                lineHeight: 1.5,
                characterSpacing: 2,
                verticalAlignment: 'top',
                fontName: 'Courier',
            }

            const cell = new Cell('cell-1', 'body', 'test', false, partialStyle)
            expect(cell.style.bold).toBe(true)
            expect(cell.style.fontSize).toBe(16)
        })
    })

    describe('dynamic cell properties', () => {
        it('should distinguish between dynamic and static cells', () => {
            const staticCell = new Cell('static', 'body', 'text', false, style)
            const dynamicCell = new Cell('dynamic', 'body', '=formula', true, style)

            expect(staticCell.isDynamic).toBe(false)
            expect(dynamicCell.isDynamic).toBe(true)
        })

        it('should support undefined computedValue for static cells', () => {
            const cell = new Cell('cell-1', 'body', 'text', false, style)
            expect(cell.computedValue).toBeUndefined()
        })

        it('should support undefined computedValue for dynamic cells without evaluation', () => {
            const cell = new Cell('cell-1', 'body', '=formula', true, style)
            expect(cell.computedValue).toBeUndefined()
        })

        it('should support computedValue for dynamic cells', () => {
            const cell = new Cell('cell-1', 'body', '=1+2', true, style, 3)
            expect(cell.isDynamic).toBe(true)
            expect(cell.computedValue).toBe(3)
        })
    })

    describe('region property', () => {
        it('should maintain mutable inRegion property', () => {
            const cell = new Cell('cell-1', 'body', 'test', false, style)
            expect(cell.inRegion).toBe('body')

            cell.inRegion = 'theader'
            expect(cell.inRegion).toBe('theader')
        })

        it('should support all region types', () => {
            const regions = ['body', 'theader', 'lheader', 'rheader', 'footer'] as const

            for (const region of regions) {
                const cell = new Cell('cell-1', region, 'test', false, style)
                expect(cell.inRegion).toBe(region)

                cell.inRegion = 'body'
                expect(cell.inRegion).toBe('body')
            }
        })
    })

    describe('value properties', () => {
        it('should support mutable rawValue for string', () => {
            const cell = new Cell('cell-1', 'body', 'initial', false, style)
            expect(cell.rawValue).toBe('initial')

            cell.rawValue = 'updated'
            expect(cell.rawValue).toBe('updated')
        })

        it('should support mutable rawValue for number', () => {
            const cell = new Cell('cell-1', 'body', 42, false, style)
            expect(cell.rawValue).toBe(42)

            cell.rawValue = 100
            expect(cell.rawValue).toBe(100)
        })

        it('should support mutable computedValue', () => {
            const cell = new Cell('cell-1', 'body', 'formula', true, style, 10)
            expect(cell.computedValue).toBe(10)

            cell.computedValue = 20
            expect(cell.computedValue).toBe(20)
        })

        it('should support clearing computedValue', () => {
            const cell = new Cell('cell-1', 'body', 'formula', true, style, 10)

            cell.computedValue = undefined
            expect(cell.computedValue).toBeUndefined()
        })
    })

    describe('edge cases', () => {
        it('should handle cell with very long rawValue', () => {
            const longValue = 'x'.repeat(10000)
            const cell = new Cell('cell-1', 'body', longValue, false, style)
            expect(cell.rawValue).toBe(longValue)
        })

        it('should handle cell with special characters', () => {
            const specialValue = '!@#$%^&*()_+-={}[]|:;"\'<>?,./'
            const cell = new Cell('cell-1', 'body', specialValue, false, style)
            expect(cell.rawValue).toBe(specialValue)
        })

        it('should handle cell with newlines in rawValue', () => {
            const multilineValue = 'line1\nline2\nline3'
            const cell = new Cell('cell-1', 'body', multilineValue, false, style)
            expect(cell.rawValue).toBe(multilineValue)
        })

        it('should handle consecutive clear and set layout', () => {
            const cell = new Cell('cell-1', 'body', 'test', false, style)
            const layout = { row: 0, col: 0, rowSpan: 1, colSpan: 1, x: 0, y: 0, width: 30, height: 10 }

            cell._setLayout(layout)
            cell.clearLayout()
            cell._setLayout(layout)

            expect(cell.layout).toEqual(layout)
        })

        it('should handle negative coordinates in layout', () => {
            const cell = new Cell('cell-1', 'body', 'test', false, style)
            const layout = { row: -1, col: -1, rowSpan: 1, colSpan: 1, x: -10, y: -10, width: 30, height: 10 }

            cell._setLayout(layout)
            expect(cell.layout).toEqual(layout)
        })

        it('should handle large numeric values', () => {
            const largeValue = 9999999999999
            const cell = new Cell('cell-1', 'body', largeValue, false, style)
            expect(cell.rawValue).toBe(largeValue)

            cell.computedValue = largeValue
            expect(cell.computedValue).toBe(largeValue)
        })

        it('should handle decimal values', () => {
            const decimalValue = 3.14159265359
            const cell = new Cell('cell-1', 'body', decimalValue, false, style)
            expect(cell.rawValue).toBe(decimalValue)

            cell.computedValue = decimalValue * 2
            expect(cell.computedValue).toBeCloseTo(decimalValue * 2)
        })
    })
})
