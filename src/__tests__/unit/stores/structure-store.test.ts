import { StructureStore } from '../../../stores/structure.store'

describe('StructureStore', () => {
    let store: StructureStore

    beforeEach(() => {
        store = new StructureStore()
    })

    describe('header hierarchy - addRootCell and getRoots', () => {
        it('should add root cell to region', () => {
            store.addRootCell('cell1', 'theader')

            const roots = store.getRoots('theader')
            expect(roots).toBeDefined()
            expect(roots).toContain('cell1')
        })

        it('should add multiple root cells', () => {
            store.addRootCell('cell1', 'theader')
            store.addRootCell('cell2', 'theader')
            store.addRootCell('cell3', 'theader')

            const roots = store.getRoots('theader')
            expect(roots).toHaveLength(3)
            expect(roots).toContain('cell1')
            expect(roots).toContain('cell2')
            expect(roots).toContain('cell3')
        })

        it('should support different regions independently', () => {
            store.addRootCell('theader1', 'theader')
            store.addRootCell('lheader1', 'lheader')
            store.addRootCell('rheader1', 'rheader')
            store.addRootCell('footer1', 'footer')

            expect(store.getRoots('theader')).toContain('theader1')
            expect(store.getRoots('lheader')).toContain('lheader1')
            expect(store.getRoots('rheader')).toContain('rheader1')
            expect(store.getRoots('footer')).toContain('footer1')
        })

        it('should return undefined for region without roots', () => {
            const roots = store.getRoots('theader')
            expect(roots).toBeUndefined()
        })
    })

    describe('leaf cell detection', () => {
        it('should identify cell as leaf when it has no children', () => {
            store.addRootCell('cell1', 'theader')
            expect(store.isLeafCell('cell1')).toBe(true)
        })

        it('should identify cell as non-leaf when it has children', () => {
            store.addRootCell('parent', 'theader')
            store.addChildCell('parent', 'theader', 'child1')

            expect(store.isLeafCell('parent')).toBe(false)
            expect(store.isLeafCell('child1')).toBe(true)
        })

        it('should identify non-existent cell as leaf', () => {
            expect(store.isLeafCell('non-existent')).toBe(true)
        })
    })

    describe('child cell management', () => {
        it('should add child cell to parent', () => {
            store.addRootCell('parent', 'theader')
            store.addChildCell('parent', 'theader', 'child', 0)

            const children = store.getChildren('parent')
            expect(children).toContain('child')
        })

        it('should add multiple children to parent', () => {
            store.addRootCell('parent', 'theader')
            store.addChildCell('parent', 'theader', 'child1', 0)
            store.addChildCell('parent', 'theader', 'child2', 1)
            store.addChildCell('parent', 'theader', 'child3', 2)

            const children = store.getChildren('parent')
            expect(children).toHaveLength(3)
            expect(children).toEqual(['child1', 'child2', 'child3'])
        })

        it('should insert child at specific index', () => {
            store.addRootCell('parent', 'theader')
            store.addChildCell('parent', 'theader', 'child1', 0)
            store.addChildCell('parent', 'theader', 'child3', 1)
            store.addChildCell('parent', 'theader', 'child2', 1) // Insert in middle

            const children = store.getChildren('parent')
            expect(children).toEqual(['child1', 'child2', 'child3'])
        })

        it('should append child when index is undefined', () => {
            store.addRootCell('parent', 'theader')
            store.addChildCell('parent', 'theader', 'child1')
            store.addChildCell('parent', 'theader', 'child2')

            const children = store.getChildren('parent')
            expect(children![children!.length - 1]).toBe('child2')
        })

        it('should return undefined for parent with no children', () => {
            store.addRootCell('cell', 'theader')
            const children = store.getChildren('cell')
            expect(children).toBeUndefined()
        })
    })

    describe('leaf cells traversal', () => {
        it('should return single cell as leaf for leaf cell', () => {
            store.addRootCell('leaf', 'theader')
            const leaves = store.getLeafCells('leaf')
            expect(leaves).toEqual(['leaf'])
        })

        it('should return children as leaves for flat parent', () => {
            store.addRootCell('parent', 'theader')
            store.addChildCell('parent', 'theader', 'child1')
            store.addChildCell('parent', 'theader', 'child2')

            const leaves = store.getLeafCells('parent')
            expect(leaves).toEqual(['child1', 'child2'])
        })

        it('should recursively collect leaves from nested hierarchy', () => {
            store.addRootCell('root', 'theader')
            store.addChildCell('root', 'theader', 'parent1')
            store.addChildCell('root', 'theader', 'parent2')
            store.addChildCell('parent1', 'theader', 'leaf1')
            store.addChildCell('parent1', 'theader', 'leaf2')
            store.addChildCell('parent2', 'theader', 'leaf3')

            const leaves = store.getLeafCells('root')
            expect(leaves).toEqual(['leaf1', 'leaf2', 'leaf3'])
        })

        it('should handle deeply nested hierarchy', () => {
            store.addRootCell('l0', 'theader')
            store.addChildCell('l0', 'theader', 'l1')
            store.addChildCell('l1', 'theader', 'l2')
            store.addChildCell('l2', 'theader', 'l3')
            store.addChildCell('l3', 'theader', 'leaf')

            const leaves = store.getLeafCells('l0')
            expect(leaves).toEqual(['leaf'])
        })
    })

    describe('cell height calculation', () => {
        it('should return height 1 for leaf cell', () => {
            store.addRootCell('leaf', 'theader')
            expect(store.getHeightOfCell('leaf')).toBe(1)
        })

        it('should return height 2 for parent of leaf cells', () => {
            store.addRootCell('parent', 'theader')
            store.addChildCell('parent', 'theader', 'child1')
            store.addChildCell('parent', 'theader', 'child2')

            expect(store.getHeightOfCell('parent')).toBe(2)
        })

        it('should calculate max height for multi-level hierarchy', () => {
            store.addRootCell('root', 'theader')
            store.addChildCell('root', 'theader', 'parent1')
            store.addChildCell('root', 'theader', 'parent2')
            store.addChildCell('parent1', 'theader', 'child1')

            // root -> parent1 -> child1 = height 3
            // root -> parent2 = height 2
            expect(store.getHeightOfCell('root')).toBe(3)
        })

        it('should handle non-existent cell', () => {
            const height = store.getHeightOfCell('non-existent')
            expect(height).toBe(1) // Treated as leaf
        })
    })

    describe('body operations', () => {
        it('should insert body row', () => {
            store.insertBodyRow(0, ['cell1', 'cell2', 'cell3'])

            const body = store.getBody()
            expect(body).toHaveLength(1)
            expect(body[0]).toEqual(['cell1', 'cell2', 'cell3'])
        })

        it('should insert multiple body rows', () => {
            store.insertBodyRow(0, ['r1c1', 'r1c2'])
            store.insertBodyRow(1, ['r2c1', 'r2c2'])
            store.insertBodyRow(2, ['r3c1', 'r3c2'])

            const body = store.getBody()
            expect(body).toHaveLength(3)
            expect(body[0]).toEqual(['r1c1', 'r1c2'])
            expect(body[1]).toEqual(['r2c1', 'r2c2'])
            expect(body[2]).toEqual(['r3c1', 'r3c2'])
        })

        it('should insert body row at correct index', () => {
            store.insertBodyRow(0, ['r1c1', 'r1c2'])
            store.insertBodyRow(1, ['r3c1', 'r3c2'])
            store.insertBodyRow(1, ['r2c1', 'r2c2']) // Insert in middle

            const body = store.getBody()
            expect(body[0]).toEqual(['r1c1', 'r1c2'])
            expect(body[1]).toEqual(['r2c1', 'r2c2'])
            expect(body[2]).toEqual(['r3c1', 'r3c2'])
        })

        it('should remove body row and return removed cells', () => {
            store.insertBodyRow(0, ['r1c1', 'r1c2'])
            store.insertBodyRow(1, ['r2c1', 'r2c2'])

            const removed = store.removeBodyRow(0)

            expect(removed).toEqual(['r1c1', 'r1c2'])
            expect(store.getBody()).toHaveLength(1)
            expect(store.getBody()[0]).toEqual(['r2c1', 'r2c2'])
        })

        it('should return empty array when removing invalid row index', () => {
            const removed = store.removeBodyRow(0)
            expect(removed).toEqual([])
        })

        it('should return empty array when removing out of bounds row', () => {
            store.insertBodyRow(0, ['c1', 'c2'])
            const removed = store.removeBodyRow(10)
            expect(removed).toEqual([])
        })
    })

    describe('body column operations', () => {
        it('should insert body column', () => {
            store.insertBodyRow(0, ['r1c1', 'r1c2'])
            store.insertBodyRow(1, ['r2c1', 'r2c2'])

            store.insertBodyCol(1, ['newc1', 'newc2'])

            const body = store.getBody()
            expect(body[0]).toEqual(['r1c1', 'newc1', 'r1c2'])
            expect(body[1]).toEqual(['r2c1', 'newc2', 'r2c2'])
        })

        it('should insert column at beginning', () => {
            store.insertBodyRow(0, ['r1c1', 'r1c2'])
            store.insertBodyCol(0, ['newc1'])

            const body = store.getBody()
            expect(body[0]).toEqual(['newc1', 'r1c1', 'r1c2'])
        })

        it('should insert column at end', () => {
            store.insertBodyRow(0, ['r1c1', 'r1c2'])
            store.insertBodyCol(2, ['newc1'])

            const body = store.getBody()
            expect(body[0]).toEqual(['r1c1', 'r1c2', 'newc1'])
        })

        it('should remove body column and return removed cells', () => {
            store.insertBodyRow(0, ['r1c1', 'r1c2', 'r1c3'])
            store.insertBodyRow(1, ['r2c1', 'r2c2', 'r2c3'])

            const removed = store.removeBodyCol(1)

            expect(removed).toEqual(['r1c2', 'r2c2'])
            expect(store.getBody()[0]).toEqual(['r1c1', 'r1c3'])
            expect(store.getBody()[1]).toEqual(['r2c1', 'r2c3'])
        })

        it('should remove first column', () => {
            store.insertBodyRow(0, ['r1c1', 'r1c2', 'r1c3'])

            const removed = store.removeBodyCol(0)

            expect(removed).toEqual(['r1c1'])
            expect(store.getBody()[0]).toEqual(['r1c2', 'r1c3'])
        })

        it('should remove last column', () => {
            store.insertBodyRow(0, ['r1c1', 'r1c2', 'r1c3'])

            const removed = store.removeBodyCol(2)

            expect(removed).toEqual(['r1c3'])
            expect(store.getBody()[0]).toEqual(['r1c1', 'r1c2'])
        })
    })

    describe('getBodyCell', () => {
        it('should retrieve body cell by row and column', () => {
            store.insertBodyRow(0, ['r0c0', 'r0c1', 'r0c2'])
            store.insertBodyRow(1, ['r1c0', 'r1c1', 'r1c2'])

            expect(store.getBodyCell(0, 0)).toBe('r0c0')
            expect(store.getBodyCell(0, 1)).toBe('r0c1')
            expect(store.getBodyCell(1, 0)).toBe('r1c0')
            expect(store.getBodyCell(1, 2)).toBe('r1c2')
        })

        it('should return undefined for invalid row', () => {
            store.insertBodyRow(0, ['c1', 'c2'])

            expect(store.getBodyCell(1, 0)).toBeUndefined()
            expect(store.getBodyCell(10, 0)).toBeUndefined()
        })

        it('should return undefined for invalid column', () => {
            store.insertBodyRow(0, ['c1', 'c2'])

            expect(store.getBodyCell(0, 5)).toBeUndefined()
        })
    })

    describe('body index for header leaf cells', () => {
        it('should return index for single header leaf', () => {
            store.addRootCell('col1', 'theader')

            const index = store.getBodyIndexForHeaderLeafCell('theader', 'col1')
            expect(index).toBe(0)
        })

        it('should return correct index for multiple header leaves', () => {
            store.addRootCell('col1', 'theader')
            store.addRootCell('col2', 'theader')
            store.addRootCell('col3', 'theader')

            expect(store.getBodyIndexForHeaderLeafCell('theader', 'col1')).toBe(0)
            expect(store.getBodyIndexForHeaderLeafCell('theader', 'col2')).toBe(1)
            expect(store.getBodyIndexForHeaderLeafCell('theader', 'col3')).toBe(2)
        })

        it('should calculate index for nested header leaves', () => {
            store.addRootCell('parent1', 'theader')
            store.addChildCell('parent1', 'theader', 'leaf1')
            store.addChildCell('parent1', 'theader', 'leaf2')

            expect(store.getBodyIndexForHeaderLeafCell('theader', 'leaf1')).toBe(0)
            expect(store.getBodyIndexForHeaderLeafCell('theader', 'leaf2')).toBe(1)
        })

        it('should calculate index for mixed nested headers', () => {
            store.addRootCell('parent1', 'theader')
            store.addRootCell('parent2', 'theader')
            store.addChildCell('parent1', 'theader', 'leaf1')
            store.addChildCell('parent1', 'theader', 'leaf2')
            store.addChildCell('parent2', 'theader', 'leaf3')

            expect(store.getBodyIndexForHeaderLeafCell('theader', 'leaf1')).toBe(0)
            expect(store.getBodyIndexForHeaderLeafCell('theader', 'leaf2')).toBe(1)
            expect(store.getBodyIndexForHeaderLeafCell('theader', 'leaf3')).toBe(2)
        })

        it('should return -1 for non-existent leaf cell', () => {
            store.addRootCell('col1', 'theader')

            const index = store.getBodyIndexForHeaderLeafCell('theader', 'non-existent')
            expect(index).toBe(-1)
        })

        it('should handle empty header region', () => {
            const index = store.getBodyIndexForHeaderLeafCell('theader', 'cell')
            expect(index).toBe(-1)
        })
    })

    describe('leaf count', () => {
        it('should return 0 for empty region', () => {
            expect(store.getLeafCount('theader')).toBe(0)
        })

        it('should return count of root cells', () => {
            store.addRootCell('col1', 'theader')
            store.addRootCell('col2', 'theader')
            store.addRootCell('col3', 'theader')

            expect(store.getLeafCount('theader')).toBe(3)
        })

        it('should count leaves for nested headers', () => {
            store.addRootCell('parent', 'theader')
            store.addChildCell('parent', 'theader', 'leaf1')
            store.addChildCell('parent', 'theader', 'leaf2')

            expect(store.getLeafCount('theader')).toBe(2)
        })

        it('should count leaves for mixed nested headers', () => {
            store.addRootCell('parent1', 'theader')
            store.addRootCell('parent2', 'theader')
            store.addChildCell('parent1', 'theader', 'leaf1')
            store.addChildCell('parent1', 'theader', 'leaf2')
            store.addChildCell('parent2', 'theader', 'leaf3')

            expect(store.getLeafCount('theader')).toBe(3)
        })

        it('should count leaves independently per region', () => {
            store.addRootCell('theader1', 'theader')
            store.addRootCell('theader2', 'theader')
            store.addRootCell('lheader1', 'lheader')

            expect(store.getLeafCount('theader')).toBe(2)
            expect(store.getLeafCount('lheader')).toBe(1)
        })
    })

    describe('total row and column counting', () => {
        it('should count total columns from theader leaves', () => {
            store.addRootCell('col1', 'theader')
            store.addRootCell('col2', 'theader')
            store.addRootCell('col3', 'theader')

            expect(store.countTotalCols()).toBe(3)
        })

        it('should count 0 columns for empty theader', () => {
            expect(store.countTotalCols()).toBe(0)
        })

        it('should count total rows including body', () => {
            store.addRootCell('col1', 'theader')
            store.insertBodyRow(0, ['c1'])
            store.insertBodyRow(1, ['c2'])
            store.insertBodyRow(2, ['c3'])

            // 1 row from theader + 3 body rows
            expect(store.countTotalRows()).toBe(4)
        })

        it('should count rows with multi-level theader', () => {
            store.addRootCell('parent', 'theader')
            store.addChildCell('parent', 'theader', 'child1')
            store.addChildCell('parent', 'theader', 'child2')
            store.insertBodyRow(0, ['c1', 'c2'])

            // 2 rows from theader (parent + children) + 1 body row
            expect(store.countTotalRows()).toBe(3)
        })

        it('should count 0 total rows with empty structure', () => {
            expect(store.countTotalRows()).toBe(0)
        })
    })

    describe('removeRootCell', () => {
        it('should remove root cell', () => {
            store.addRootCell('cell1', 'theader')
            store.addRootCell('cell2', 'theader')

            store.removeRootCell('cell1', 'theader')

            const roots = store.getRoots('theader')
            expect(roots).not.toContain('cell1')
            expect(roots).toContain('cell2')
        })

        it('should promote children when removing parent', () => {
            store.addRootCell('parent', 'theader')
            store.addChildCell('parent', 'theader', 'child1')
            store.addChildCell('parent', 'theader', 'child2')

            store.removeRootCell('parent', 'theader')

            const roots = store.getRoots('theader')
            expect(roots).toContain('child1')
            expect(roots).toContain('child2')
        })

        it('should clear parent-child mappings', () => {
            store.addRootCell('parent', 'theader')
            store.addChildCell('parent', 'theader', 'child')

            store.removeRootCell('parent', 'theader')

            expect(store.getChildren('parent')).toBeUndefined()
            // Child no longer has parent
            expect(store.isLeafCell('child')).toBe(true)
        })
    })

    describe('removeChildCell', () => {
        it('should remove child cell', () => {
            store.addRootCell('parent', 'theader')
            store.addChildCell('parent', 'theader', 'child1')
            store.addChildCell('parent', 'theader', 'child2')

            store.removeChildCell('parent', 'child1', 'theader')

            const children = store.getChildren('parent')
            expect(children).not.toContain('child1')
            expect(children).toContain('child2')
        })

        it('should promote grandchildren when removing intermediate parent', () => {
            store.addRootCell('root', 'theader')
            store.addChildCell('root', 'theader', 'parent')
            store.addChildCell('parent', 'theader', 'child1')
            store.addChildCell('parent', 'theader', 'child2')

            store.removeChildCell('root', 'parent', 'theader')

            const children = store.getChildren('root')
            expect(children).toContain('child1')
            expect(children).toContain('child2')
        })

        it('should update parent mapping of promoted children', () => {
            store.addRootCell('root', 'theader')
            store.addChildCell('root', 'theader', 'parent')
            store.addChildCell('parent', 'theader', 'child')

            store.removeChildCell('root', 'parent', 'theader')

            // Verify child now belongs to root
            const newChildren = store.getChildren('root')
            expect(newChildren).toContain('child')
        })
    })

    describe('edge cases and integration', () => {
        it('should handle deeply nested hierarchy', () => {
            store.addRootCell('l0', 'theader')
            for (let i = 0; i < 10; i++) {
                const parentId = `l${i}`
                const childId = `l${i + 1}`
                store.addChildCell(parentId, 'theader', childId)
            }

            const leaves = store.getLeafCells('l0')
            expect(leaves).toEqual(['l10'])
            expect(store.getHeightOfCell('l0')).toBe(11)
        })

        it('should handle wide hierarchy', () => {
            store.addRootCell('parent', 'theader')
            for (let i = 0; i < 100; i++) {
                store.addChildCell('parent', 'theader', `child${i}`)
            }

            const leaves = store.getLeafCells('parent')
            expect(leaves).toHaveLength(100)
        })

        it('should handle simultaneous operations', () => {
            // Build header
            store.addRootCell('col1', 'theader')
            store.addRootCell('col2', 'theader')

            // Build body
            store.insertBodyRow(0, ['c1', 'c2'])
            store.insertBodyRow(1, ['c3', 'c4'])

            // Verify both independent
            expect(store.countTotalCols()).toBe(2)
            expect(store.countTotalRows()).toBe(3) // 1 header + 2 body
            expect(store.getBodyCell(0, 0)).toBe('c1')
        })

        it('should maintain data after multiple mutations', () => {
            // Initial setup
            store.addRootCell('col1', 'theader')
            store.insertBodyRow(0, ['c1', 'c2', 'c3'])

            // Mutations
            store.insertBodyCol(1, ['new'])
            store.insertBodyRow(1, ['r2c1', 'r2c2', 'r2c3', 'r2c4'])

            // Verify consistency
            expect(store.getBodyCell(0, 0)).toBe('c1')
            expect(store.getBodyCell(0, 1)).toBe('new')
            expect(store.getBodyCell(1, 0)).toBe('r2c1')
        })
    })
})
