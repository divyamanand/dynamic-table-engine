import { MergeRegistry } from '../../../stores/merge-registry.stores'
import { StructureStore } from '../../../stores/structure.store'
import { Rect } from '../../../types/common'

describe('MergeRegistry', () => {
    let registry: MergeRegistry
    let structureStore: StructureStore

    beforeEach(() => {
        structureStore = new StructureStore()
        registry = new MergeRegistry(structureStore)
        // Setup basic grid structure
        structureStore.addRootCell('col1', 'theader')
        structureStore.addRootCell('col2', 'theader')
        structureStore.addRootCell('col3', 'theader')
        for (let i = 0; i < 3; i++) {
            structureStore.insertBodyRow(i, ['c1', 'c2', 'c3'])
        }
    })

    describe('createMerge', () => {
        it('should create a simple merge', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 0,
                endCol: 0,
            }

            registry.createMerge(rect)
            const retrieved = registry.getMergeByRootId('cell1')
            expect(retrieved).toEqual(rect)
        })

        it('should create a 2x2 merge', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 1,
                endCol: 1,
            }

            registry.createMerge(rect)
            const retrieved = registry.getMergeByRootId('cell1')
            expect(retrieved).toEqual(rect)
            expect(retrieved!.endRow).toBe(1)
            expect(retrieved!.endCol).toBe(1)
        })

        it('should create a horizontal span merge', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 0,
                endCol: 2,
            }

            registry.createMerge(rect)
            const retrieved = registry.getMergeByRootId('cell1')
            expect(retrieved!.endCol).toBe(2)
            expect(retrieved!.endRow).toBe(0)
        })

        it('should create a vertical span merge', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 2,
                endCol: 0,
            }

            registry.createMerge(rect)
            const retrieved = registry.getMergeByRootId('cell1')
            expect(retrieved!.endRow).toBe(2)
            expect(retrieved!.endCol).toBe(0)
        })

        it('should create a large merge', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 2,
                endCol: 2,
            }

            registry.createMerge(rect)
            const retrieved = registry.getMergeByRootId('cell1')
            expect(retrieved).toEqual(rect)
        })

        it('should not create invalid merge (negative row)', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: -1,
                startCol: 0,
                endRow: 0,
                endCol: 0,
            }

            registry.createMerge(rect)
            const retrieved = registry.getMergeByRootId('cell1')
            expect(retrieved).toBeUndefined()
        })

        it('should not create invalid merge (out of bounds col)', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 0,
                endCol: 100,
            }

            registry.createMerge(rect)
            const retrieved = registry.getMergeByRootId('cell1')
            expect(retrieved).toBeUndefined()
        })

        it('should not create invalid merge (out of bounds row)', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 100,
                endCol: 0,
            }

            registry.createMerge(rect)
            const retrieved = registry.getMergeByRootId('cell1')
            expect(retrieved).toBeUndefined()
        })

        it('should not create invalid merge (negative col)', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: -1,
                endRow: 0,
                endCol: 0,
            }

            registry.createMerge(rect)
            const retrieved = registry.getMergeByRootId('cell1')
            expect(retrieved).toBeUndefined()
        })
    })

    describe('deleteMerge', () => {
        it('should delete a merge', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 1,
                endCol: 1,
            }

            registry.createMerge(rect)
            expect(registry.getMergeByRootId('cell1')).toBeDefined()

            registry.deleteMerge('cell1')
            expect(registry.getMergeByRootId('cell1')).toBeUndefined()
        })

        it('should not throw when deleting non-existent merge', () => {
            expect(() => {
                registry.deleteMerge('non-existent')
            }).not.toThrow()
        })

        it('should not affect other merges', () => {
            const rect1: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 1,
                endCol: 1,
            }
            const rect2: Rect = {
                cellId: 'cell2',
                startRow: 2,
                startCol: 2,
                endRow: 2,
                endCol: 2,
            }

            registry.createMerge(rect1)
            registry.createMerge(rect2)

            registry.deleteMerge('cell1')

            expect(registry.getMergeByRootId('cell1')).toBeUndefined()
            expect(registry.getMergeByRootId('cell2')).toBeDefined()
        })
    })

    describe('getMergeByRootId', () => {
        it('should retrieve created merge', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 1,
                endCol: 1,
            }

            registry.createMerge(rect)
            const retrieved = registry.getMergeByRootId('cell1')

            expect(retrieved).toEqual(rect)
        })

        it('should return undefined for non-existent merge', () => {
            const retrieved = registry.getMergeByRootId('non-existent')
            expect(retrieved).toBeUndefined()
        })

        it('should return undefined after deletion', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 1,
                endCol: 1,
            }

            registry.createMerge(rect)
            registry.deleteMerge('cell1')

            expect(registry.getMergeByRootId('cell1')).toBeUndefined()
        })
    })

    describe('isValidMerge', () => {
        it('should validate merge at (0,0)', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 0,
                endCol: 0,
            }

            expect(registry.isValidMerge(rect)).toBe(true)
        })

        it('should validate merge spanning within bounds', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 2,
                endCol: 2,
            }

            expect(registry.isValidMerge(rect)).toBe(true)
        })

        it('should reject merge with negative startRow', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: -1,
                startCol: 0,
                endRow: 0,
                endCol: 0,
            }

            expect(registry.isValidMerge(rect)).toBe(false)
        })

        it('should reject merge with negative startCol', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: -1,
                endRow: 0,
                endCol: 0,
            }

            expect(registry.isValidMerge(rect)).toBe(false)
        })

        it('should reject merge with endRow > maxPossibleRowsIndex', () => {
            // 3 body rows + 1 header row = 4 total, so max index is 3
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 10,
                endCol: 0,
            }

            expect(registry.isValidMerge(rect)).toBe(false)
        })

        it('should reject merge with endCol > maxPossibleColsIndex', () => {
            // 3 columns, so max index is 2
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 0,
                endCol: 10,
            }

            expect(registry.isValidMerge(rect)).toBe(false)
        })

        it('should validate merge at maximum bounds', () => {
            // Max row is 3 (0-indexed), max col is 2 (0-indexed)
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 3,
                startCol: 2,
                endRow: 3,
                endCol: 2,
            }

            expect(registry.isValidMerge(rect)).toBe(true)
        })

        it('should reject merge beyond maximum bounds', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 3,
                startCol: 2,
                endRow: 4,
                endCol: 3,
            }

            expect(registry.isValidMerge(rect)).toBe(false)
        })
    })

    describe('getMergeSet', () => {
        it('should return empty set when no merges', () => {
            const set = registry.getMergeSet()
            expect(set.size).toBe(0)
        })

        it('should return single merge in set', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 1,
                endCol: 1,
            }

            registry.createMerge(rect)
            const set = registry.getMergeSet()

            expect(set.size).toBe(1)
            expect(set.has('cell1')).toBe(true)
        })

        it('should return multiple non-nested merges', () => {
            const rect1: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 0,
                endCol: 0,
            }
            const rect2: Rect = {
                cellId: 'cell2',
                startRow: 1,
                startCol: 1,
                endRow: 1,
                endCol: 1,
            }

            registry.createMerge(rect1)
            registry.createMerge(rect2)

            const set = registry.getMergeSet()
            expect(set.size).toBe(2)
            expect(set.has('cell1')).toBe(true)
            expect(set.has('cell2')).toBe(true)
        })

        it('should filter out nested merges keeping only top-level', () => {
            const parent: Rect = {
                cellId: 'parent',
                startRow: 0,
                startCol: 0,
                endRow: 2,
                endCol: 2,
            }
            const nested: Rect = {
                cellId: 'nested',
                startRow: 1,
                startCol: 1,
                endRow: 1,
                endCol: 1,
            }

            registry.createMerge(parent)
            registry.createMerge(nested)

            const set = registry.getMergeSet()
            expect(set.size).toBe(1)
            expect(set.has('parent')).toBe(true)
            expect(set.has('nested')).toBe(false)
        })

        it('should handle multiple non-overlapping merges', () => {
            const rects: Rect[] = [
                { cellId: 'a', startRow: 0, startCol: 0, endRow: 0, endCol: 0 },
                { cellId: 'b', startRow: 0, startCol: 1, endRow: 0, endCol: 1 },
                { cellId: 'c', startRow: 1, startCol: 0, endRow: 1, endCol: 0 },
                { cellId: 'd', startRow: 1, startCol: 1, endRow: 1, endCol: 1 },
            ]

            for (const rect of rects) {
                registry.createMerge(rect)
            }

            const set = registry.getMergeSet()
            expect(set.size).toBe(4)
        })

        it('should handle deeply nested merges', () => {
            const l0: Rect = {
                cellId: 'l0',
                startRow: 0,
                startCol: 0,
                endRow: 2,
                endCol: 2,
            }
            const l1: Rect = {
                cellId: 'l1',
                startRow: 1,
                startCol: 1,
                endRow: 1,
                endCol: 1,
            }

            registry.createMerge(l0)
            registry.createMerge(l1)

            const set = registry.getMergeSet()
            expect(set.size).toBe(1)
            expect(set.has('l0')).toBe(true)
        })

        it('should sort merges correctly before filtering', () => {
            // Create in reverse order to test sorting
            const rects: Rect[] = [
                { cellId: 'c', startRow: 2, startCol: 2, endRow: 2, endCol: 2 },
                { cellId: 'b', startRow: 1, startCol: 1, endRow: 1, endCol: 1 },
                { cellId: 'a', startRow: 0, startCol: 0, endRow: 0, endCol: 0 },
            ]

            for (const rect of rects) {
                registry.createMerge(rect)
            }

            const set = registry.getMergeSet()
            expect(Array.from(set.keys())).toEqual(['a', 'b', 'c'])
        })

        it('should handle merges with same startRow different startCol', () => {
            const rect1: Rect = {
                cellId: 'a',
                startRow: 0,
                startCol: 0,
                endRow: 1,
                endCol: 1,
            }
            const rect2: Rect = {
                cellId: 'b',
                startRow: 0,
                startCol: 2,
                endRow: 1,
                endCol: 2,
            }

            registry.createMerge(rect1)
            registry.createMerge(rect2)

            const set = registry.getMergeSet()
            expect(set.size).toBe(2)
        })

        it('should handle merges with same startRow,startCol different endRow', () => {
            const rect1: Rect = {
                cellId: 'a',
                startRow: 0,
                startCol: 0,
                endRow: 1,
                endCol: 1,
            }
            const rect2: Rect = {
                cellId: 'b',
                startRow: 0,
                startCol: 0,
                endRow: 2,
                endCol: 1,
            }

            registry.createMerge(rect1)
            registry.createMerge(rect2)

            const set = registry.getMergeSet()
            // rect1 is nested in rect2, so only rect2 should be returned
            expect(set.size).toBe(1)
            expect(set.has('b')).toBe(true)
        })
    })

    describe('complex scenarios', () => {
        it('should handle overlapping merges', () => {
            const rect1: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 1,
                endCol: 1,
            }
            const rect2: Rect = {
                cellId: 'cell2',
                startRow: 1,
                startCol: 1,
                endRow: 2,
                endCol: 2,
            }

            registry.createMerge(rect1)
            registry.createMerge(rect2)

            const set = registry.getMergeSet()
            // Both are top-level (overlapping but neither contains the other)
            expect(set.size).toBe(2)
        })

        it('should handle partial overlap merges', () => {
            const rect1: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 1,
                endCol: 2,
            }
            const rect2: Rect = {
                cellId: 'cell2',
                startRow: 1,
                startCol: 1,
                endRow: 2,
                endCol: 2,
            }

            registry.createMerge(rect1)
            registry.createMerge(rect2)

            const set = registry.getMergeSet()
            // Both are top-level (partially overlapping)
            expect(set.size).toBe(2)
        })

        it('should handle create, delete, create workflow', () => {
            const rect: Rect = {
                cellId: 'cell1',
                startRow: 0,
                startCol: 0,
                endRow: 1,
                endCol: 1,
            }

            registry.createMerge(rect)
            expect(registry.getMergeByRootId('cell1')).toBeDefined()

            registry.deleteMerge('cell1')
            expect(registry.getMergeByRootId('cell1')).toBeUndefined()

            registry.createMerge(rect)
            expect(registry.getMergeByRootId('cell1')).toBeDefined()
        })

        it('should handle multiple operations on merge set', () => {
            const rects: Rect[] = [
                { cellId: 'a', startRow: 0, startCol: 0, endRow: 0, endCol: 0 },
                { cellId: 'b', startRow: 1, startCol: 1, endRow: 2, endCol: 2 },
                { cellId: 'c', startRow: 1, startCol: 1, endRow: 1, endCol: 1 },
            ]

            for (const rect of rects) {
                registry.createMerge(rect)
            }

            let set = registry.getMergeSet()
            expect(set.size).toBe(2) // c is nested in b

            registry.deleteMerge('b')
            set = registry.getMergeSet()
            expect(set.size).toBe(2) // Now both a and c

            registry.deleteMerge('a')
            set = registry.getMergeSet()
            expect(set.size).toBe(1)
        })

        it('should maintain merge set consistency after deletions', () => {
            const rects: Rect[] = [
                { cellId: 'a', startRow: 0, startCol: 0, endRow: 2, endCol: 2 },
                { cellId: 'b', startRow: 1, startCol: 1, endRow: 1, endCol: 1 },
                { cellId: 'c', startRow: 2, startCol: 2, endRow: 2, endCol: 2 },
            ]

            for (const rect of rects) {
                registry.createMerge(rect)
            }

            registry.deleteMerge('a')

            const set = registry.getMergeSet()
            expect(set.size).toBe(2)
            expect(set.has('b')).toBe(true)
            expect(set.has('c')).toBe(true)
        })
    })
})
