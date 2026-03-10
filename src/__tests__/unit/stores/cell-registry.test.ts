import { CellRegistry, defaultCellStyle } from '../../../stores/cell-registry.store'
import { CellStyle } from '../../../types'

describe('CellRegistry', () => {
    let registry: CellRegistry

    beforeEach(() => {
        registry = new CellRegistry()
    })

    describe('createCell', () => {
        it('should create a cell with default values', () => {
            const cellId = registry.createCell('body')

            const cell = registry.getCellById(cellId)
            expect(cell).toBeDefined()
            expect(cell!.inRegion).toBe('body')
            expect(cell!.rawValue).toBe('Cell')
            expect(cell!.isDynamic).toBe(false)
            expect(cell!.computedValue).toBeUndefined()
        })

        it('should create a cell with rawValue', () => {
            const cellId = registry.createCell('body', 'Hello')

            const cell = registry.getCellById(cellId)
            expect(cell!.rawValue).toBe('Hello')
        })

        it('should create a cell with numeric rawValue', () => {
            const cellId = registry.createCell('body', '42')

            const cell = registry.getCellById(cellId)
            expect(cell!.rawValue).toBe('42')
        })

        it('should create a cell with custom style', () => {
            const customStyle: Partial<CellStyle> = {
                bold: true,
                fontSize: 16,
                alignment: 'center',
            }

            const cellId = registry.createCell('body', 'Test', customStyle)

            const cell = registry.getCellById(cellId)
            expect(cell!.styleOverrides.bold).toBe(true)
            expect(cell!.styleOverrides.fontSize).toBe(16)
            expect(cell!.styleOverrides.alignment).toBe('center')
            // Only stores overrides — properties not set remain undefined
            expect(cell!.styleOverrides.italic).toBeUndefined()
        })

        it('should create a cell with isDynamic flag', () => {
            const cellId = registry.createCell('body', '=1+2', undefined, true)

            const cell = registry.getCellById(cellId)
            expect(cell!.isDynamic).toBe(true)
        })

        it('should generate unique cellIds', () => {
            const cellId1 = registry.createCell('body')
            const cellId2 = registry.createCell('body')
            const cellId3 = registry.createCell('body')

            expect(cellId1).not.toBe(cellId2)
            expect(cellId2).not.toBe(cellId3)
            expect(cellId1).not.toBe(cellId3)
        })

        it('should support all region types', () => {
            const regions = ['body', 'theader', 'lheader', 'rheader', 'footer'] as const

            for (const region of regions) {
                const cellId = registry.createCell(region)
                const cell = registry.getCellById(cellId)
                expect(cell!.inRegion).toBe(region)
            }
        })

        it('should store only provided overrides (no default merge)', () => {
            const customStyle: Partial<CellStyle> = { fontSize: 20 }
            const cellId = registry.createCell('body', 'Test', customStyle)

            const cell = registry.getCellById(cellId)
            expect(cell!.styleOverrides.fontSize).toBe(20)
            // Only stores what was explicitly provided
            expect(cell!.styleOverrides.alignment).toBeUndefined()
            expect(cell!.styleOverrides.bold).toBeUndefined()
        })

        it('should handle empty string rawValue', () => {
            const cellId = registry.createCell('body', '')
            const cell = registry.getCellById(cellId)
            expect(cell!.rawValue).toBe('')
        })

        it('should create multiple cells in same registry', () => {
            const id1 = registry.createCell('body', 'Cell1')
            const id2 = registry.createCell('body', 'Cell2')
            const id3 = registry.createCell('theader', 'Header')

            expect(registry.getCellById(id1)!.rawValue).toBe('Cell1')
            expect(registry.getCellById(id2)!.rawValue).toBe('Cell2')
            expect(registry.getCellById(id3)!.rawValue).toBe('Header')
        })
    })

    describe('getCellById', () => {
        it('should return created cell', () => {
            const cellId = registry.createCell('body', 'Test')
            const cell = registry.getCellById(cellId)

            expect(cell).toBeDefined()
            expect(cell!.rawValue).toBe('Test')
        })

        it('should return undefined for non-existent cellId', () => {
            const cell = registry.getCellById('non-existent')
            expect(cell).toBeUndefined()
        })

        it('should return cell after deletion returns undefined', () => {
            const cellId = registry.createCell('body', 'Test')
            registry.deleteCell(cellId)

            const cell = registry.getCellById(cellId)
            expect(cell).toBeUndefined()
        })
    })

    describe('updateCell', () => {
        it('should update rawValue', () => {
            const cellId = registry.createCell('body', 'Original')
            registry.updateCell(cellId, { rawValue: 'Updated' })

            const cell = registry.getCellById(cellId)
            expect(cell!.rawValue).toBe('Updated')
        })

        it('should update computedValue', () => {
            const cellId = registry.createCell('body', 'test')
            registry.updateCell(cellId, { computedValue: 'computed' })

            const cell = registry.getCellById(cellId)
            expect(cell!.computedValue).toBe('computed')
        })

        it('should update inRegion', () => {
            const cellId = registry.createCell('body', 'test')
            registry.updateCell(cellId, { inRegion: 'theader' })

            const cell = registry.getCellById(cellId)
            expect(cell!.inRegion).toBe('theader')
        })

        it('should merge style updates', () => {
            const cellId = registry.createCell('body', 'test', { fontSize: 13 })
            registry.updateCell(cellId, { style: { bold: true, fontSize: 16 } })

            const cell = registry.getCellById(cellId)
            expect(cell!.styleOverrides.bold).toBe(true)
            expect(cell!.styleOverrides.fontSize).toBe(16)
            expect(cell!.styleOverrides.alignment).toBeUndefined() // not set, no default merge
        })

        it('should update multiple properties together', () => {
            const cellId = registry.createCell('body', 'Original')
            registry.updateCell(cellId, {
                rawValue: 'Updated',
                computedValue: 'result',
                inRegion: 'theader',
                style: { bold: true },
            })

            const cell = registry.getCellById(cellId)
            expect(cell!.rawValue).toBe('Updated')
            expect(cell!.computedValue).toBe('result')
            expect(cell!.inRegion).toBe('theader')
            expect(cell!.styleOverrides.bold).toBe(true)
        })

        it('should not affect other cells when updating one', () => {
            const cellId1 = registry.createCell('body', 'Cell1')
            const cellId2 = registry.createCell('body', 'Cell2')

            registry.updateCell(cellId1, { rawValue: 'Updated' })

            expect(registry.getCellById(cellId1)!.rawValue).toBe('Updated')
            expect(registry.getCellById(cellId2)!.rawValue).toBe('Cell2')
        })

        it('should ignore undefined properties in update', () => {
            const cellId = registry.createCell('body', 'Original', { fontSize: 14 })
            registry.updateCell(cellId, { rawValue: undefined })

            const cell = registry.getCellById(cellId)
            expect(cell!.rawValue).toBe('Original')
        })

        it('should handle non-existent cellId gracefully', () => {
            expect(() => {
                registry.updateCell('non-existent', { rawValue: 'test' })
            }).not.toThrow()
        })

        it('should support clearing computedValue', () => {
            const cellId = registry.createCell('body', 'test')
            registry.updateCell(cellId, { computedValue: 'value' })
            registry.updateCell(cellId, { computedValue: undefined })

            const cell = registry.getCellById(cellId)
            expect(cell!.computedValue).toBeUndefined()
        })
    })

    describe('deleteCell', () => {
        it('should delete a cell', () => {
            const cellId = registry.createCell('body', 'Test')
            expect(registry.getCellById(cellId)).toBeDefined()

            registry.deleteCell(cellId)
            expect(registry.getCellById(cellId)).toBeUndefined()
        })

        it('should clear address mapping when deleting', () => {
            const cellId = registry.createCell('body', 'Test')
            registry.setCellAddress(cellId, 0, 0)

            registry.deleteCell(cellId)

            expect(registry.getCellByAddress('0,0')).toBeUndefined()
        })

        it('should not throw when deleting non-existent cell', () => {
            expect(() => {
                registry.deleteCell('non-existent')
            }).not.toThrow()
        })

        it('should allow recreating deleted cellId', () => {
            const cellId = registry.createCell('body', 'Original')
            registry.deleteCell(cellId)

            // Create a new cell (will get a different UUID)
            const newCellId = registry.createCell('body', 'New')
            expect(newCellId).not.toBe(cellId)
            expect(registry.getCellById(newCellId)).toBeDefined()
        })
    })

    describe('setCellAddress and getCellByAddress', () => {
        it('should set and retrieve cell by address', () => {
            const cellId = registry.createCell('body', 'Test')
            registry.setCellAddress(cellId, 0, 0)

            const cell = registry.getCellByAddress('0,0')
            expect(cell).toBeDefined()
            expect(cell!.cellID).toBe(cellId)
        })

        it('should support multiple cells with different addresses', () => {
            const cellId1 = registry.createCell('body', 'Cell1')
            const cellId2 = registry.createCell('body', 'Cell2')
            const cellId3 = registry.createCell('body', 'Cell3')

            registry.setCellAddress(cellId1, 0, 0)
            registry.setCellAddress(cellId2, 0, 1)
            registry.setCellAddress(cellId3, 1, 0)

            expect(registry.getCellByAddress('0,0')!.rawValue).toBe('Cell1')
            expect(registry.getCellByAddress('0,1')!.rawValue).toBe('Cell2')
            expect(registry.getCellByAddress('1,0')!.rawValue).toBe('Cell3')
        })

        it('should update address when setting existing cellId to new address', () => {
            const cellId = registry.createCell('body', 'Test')
            registry.setCellAddress(cellId, 0, 0)
            registry.setCellAddress(cellId, 1, 1)

            expect(registry.getCellByAddress('0,0')).toBeUndefined()
            expect(registry.getCellByAddress('1,1')!.cellID).toBe(cellId)
        })

        it('should not affect address mapping of other cells', () => {
            const cellId1 = registry.createCell('body', 'Cell1')
            const cellId2 = registry.createCell('body', 'Cell2')

            registry.setCellAddress(cellId1, 0, 0)
            registry.setCellAddress(cellId2, 0, 1)
            registry.setCellAddress(cellId1, 1, 0)

            expect(registry.getCellByAddress('0,0')).toBeUndefined()
            expect(registry.getCellByAddress('0,1')!.cellID).toBe(cellId2)
            expect(registry.getCellByAddress('1,0')!.cellID).toBe(cellId1)
        })

        it('should handle non-existent cellId in setCellAddress', () => {
            expect(() => {
                registry.setCellAddress('non-existent', 0, 0)
            }).not.toThrow()

            // Should not set address if cellId doesn't exist
            expect(registry.getCellByAddress('0,0')).toBeUndefined()
        })

        it('should support large row and column indices', () => {
            const cellId = registry.createCell('body', 'Test')
            registry.setCellAddress(cellId, 999, 999)

            const cell = registry.getCellByAddress('999,999')
            expect(cell).toBeDefined()
            expect(cell!.cellID).toBe(cellId)
        })

        it('should support address (0,0)', () => {
            const cellId = registry.createCell('body', 'Test')
            registry.setCellAddress(cellId, 0, 0)

            const cell = registry.getCellByAddress('0,0')
            expect(cell).toBeDefined()
            expect(cell!.cellID).toBe(cellId)
        })
    })

    describe('clearCellAddress', () => {
        it('should clear address mapping', () => {
            const cellId = registry.createCell('body', 'Test')
            registry.setCellAddress(cellId, 0, 0)
            expect(registry.getCellByAddress('0,0')).toBeDefined()

            registry.clearCellAddress(cellId)
            expect(registry.getCellByAddress('0,0')).toBeUndefined()
        })

        it('should handle clearing non-existent address', () => {
            const cellId = registry.createCell('body', 'Test')

            expect(() => {
                registry.clearCellAddress(cellId)
            }).not.toThrow()
        })

        it('should not affect other cells addresses', () => {
            const cellId1 = registry.createCell('body', 'Cell1')
            const cellId2 = registry.createCell('body', 'Cell2')

            registry.setCellAddress(cellId1, 0, 0)
            registry.setCellAddress(cellId2, 0, 1)

            registry.clearCellAddress(cellId1)

            expect(registry.getCellByAddress('0,0')).toBeUndefined()
            expect(registry.getCellByAddress('0,1')!.cellID).toBe(cellId2)
        })
    })

    describe('integration scenarios', () => {
        it('should handle create, update, address, delete workflow', () => {
            const cellId = registry.createCell('body', 'Original')
            registry.setCellAddress(cellId, 0, 0)
            registry.updateCell(cellId, { rawValue: 'Updated' })

            expect(registry.getCellById(cellId)!.rawValue).toBe('Updated')
            expect(registry.getCellByAddress('0,0')!.rawValue).toBe('Updated')

            registry.deleteCell(cellId)

            expect(registry.getCellById(cellId)).toBeUndefined()
            expect(registry.getCellByAddress('0,0')).toBeUndefined()
        })

        it('should handle bulk cell creation', () => {
            const cellIds: string[] = []
            for (let i = 0; i < 100; i++) {
                cellIds.push(registry.createCell('body', `Cell${i}`))
            }

            expect(cellIds.length).toBe(100)
            for (let i = 0; i < 100; i++) {
                const cell = registry.getCellById(cellIds[i])
                expect(cell!.rawValue).toBe(`Cell${i}`)
            }
        })

        it('should handle bulk address setting', () => {
            const cellIds: string[] = []
            for (let i = 0; i < 10; i++) {
                const id = registry.createCell('body', `Cell${i}`)
                cellIds.push(id)
                registry.setCellAddress(id, Math.floor(i / 5), i % 5)
            }

            // Verify first row
            for (let c = 0; c < 5; c++) {
                const cell = registry.getCellByAddress(`0,${c}`)
                expect(cell).toBeDefined()
            }

            // Verify second row
            for (let c = 0; c < 5; c++) {
                const cell = registry.getCellByAddress(`1,${c}`)
                expect(cell).toBeDefined()
            }
        })

        it('should maintain data integrity through multiple operations', () => {
            const cellIds = Array.from({ length: 5 }, () => registry.createCell('body'))

            // Set addresses
            cellIds.forEach((id, i) => registry.setCellAddress(id, 0, i))

            // Update all
            cellIds.forEach((id, i) => registry.updateCell(id, { rawValue: `Updated${i}` }))

            // Verify updates preserved addresses
            cellIds.forEach((id, i) => {
                const cellById = registry.getCellById(id)
                const cellByAddr = registry.getCellByAddress(`0,${i}`)
                expect(cellById!.rawValue).toBe(`Updated${i}`)
                expect(cellByAddr!.rawValue).toBe(`Updated${i}`)
            })
        })

        it('should handle style cascading through updates', () => {
            const cellId = registry.createCell('body', 'test', { fontSize: 14, bold: false })

            registry.updateCell(cellId, { style: { bold: true } })
            registry.updateCell(cellId, { style: { fontSize: 16 } })

            const cell = registry.getCellById(cellId)
            expect(cell!.styleOverrides.fontSize).toBe(16)
            expect(cell!.styleOverrides.bold).toBe(true)
        })
    })

    describe('default style', () => {
        it('should have empty styleOverrides when no style provided', () => {
            const cellId = registry.createCell('body')
            const cell = registry.getCellById(cellId)

            // Cells store only overrides — no defaults merged
            expect(cell!.styleOverrides.alignment).toBeUndefined()
            expect(cell!.styleOverrides.fontSize).toBeUndefined()
            expect(cell!.styleOverrides.bold).toBeUndefined()
        })

        it('should store only provided style properties', () => {
            const customStyle: Partial<CellStyle> = { fontSize: 20 }
            const cellId = registry.createCell('body', 'test', customStyle)
            const cell = registry.getCellById(cellId)

            expect(cell!.styleOverrides.fontSize).toBe(20)
            expect(cell!.styleOverrides.alignment).toBeUndefined()
        })
    })
})
