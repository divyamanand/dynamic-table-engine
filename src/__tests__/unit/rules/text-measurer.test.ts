import { TextMeasurer } from '../../../rules/expression/text-measurer';
import type { ICell } from '../../../interfaces/core/cell.interface';

describe('TextMeasurer', () => {
  // ============ measureText ============

  describe('measureText()', () => {
    it('returns positive width and height for non-empty text', () => {
      const result = TextMeasurer.measureText('hello', { fontSize: 12 });
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    it('returns zero width for empty text', () => {
      const result = TextMeasurer.measureText('', { fontSize: 12 });
      expect(result.width).toBe(0);
      // Height is 0 because split('') produces [''] but that line has length 0
    });

    it('height scales with font size', () => {
      const small = TextMeasurer.measureText('X', { fontSize: 10 });
      const large = TextMeasurer.measureText('X', { fontSize: 20 });
      expect(large.height).toBeGreaterThan(small.height);
      // Should be approximately 2x
      expect(large.height / small.height).toBeCloseTo(2, 1);
    });

    it('width scales with text length', () => {
      const short = TextMeasurer.measureText('ab', { fontSize: 12 });
      const long = TextMeasurer.measureText('abcd', { fontSize: 12 });
      expect(long.width).toBeGreaterThan(short.width);
      expect(long.width / short.width).toBeCloseTo(2, 1);
    });

    it('handles multiline text', () => {
      const single = TextMeasurer.measureText('hello', { fontSize: 12 });
      const multi = TextMeasurer.measureText('hello\nworld', { fontSize: 12 });
      expect(multi.height).toBeGreaterThan(single.height);
      // Two lines should be approximately 2x height
      expect(multi.height / single.height).toBeCloseTo(2, 1);
    });

    it('width is max of all lines in multiline', () => {
      const result = TextMeasurer.measureText('hi\nhello world', { fontSize: 12 });
      const longerLine = TextMeasurer.measureText('hello world', { fontSize: 12 });
      // Width should match the longer line
      expect(result.width).toBeCloseTo(longerLine.width, 5);
    });

    it('defaults to fontSize 12 when fontSize is 0 (falsy)', () => {
      const result = TextMeasurer.measureText('test', { fontSize: 0 });
      // fontSize 0 is falsy → defaults to 12 via || operator
      const expected = TextMeasurer.measureText('test', { fontSize: 12 });
      expect(result.width).toBeCloseTo(expected.width, 5);
      expect(result.height).toBeCloseTo(expected.height, 5);
    });

    it('uses font metric formula: charHeight = fontSize * 0.353', () => {
      const result = TextMeasurer.measureText('X', { fontSize: 10 });
      // Single char, single line
      // charHeight = 10 * 0.353 = 3.53
      // charWidth = 3.53 * 0.6 = 2.118
      expect(result.height).toBeCloseTo(3.53, 2);
      expect(result.width).toBeCloseTo(2.118, 2);
    });
  });

  // ============ cellOverflows ============

  describe('cellOverflows()', () => {
    function makeCell(text: string, width: number, height: number, fontSize: number = 12): ICell {
      return {
        cellID: 'test',
        inRegion: 'body',
        rawValue: text,
        style: { font: 'Arial', fontSize },
        isDynamic: false,
        layout: {
          row: 0,
          col: 0,
          rowSpan: 1,
          colSpan: 1,
          x: 0,
          y: 0,
          width,
          height,
        },
      };
    }

    it('returns false for text that fits', () => {
      // 'Hi' with fontSize 12: width ≈ 2*2.54 = 5.08, height ≈ 4.24
      const cell = makeCell('Hi', 50, 20);
      expect(TextMeasurer.cellOverflows(cell)).toBe(false);
    });

    it('returns true for text wider than cell', () => {
      // Very long text in a narrow cell
      const cell = makeCell('This is a very long text that should overflow', 5, 20);
      expect(TextMeasurer.cellOverflows(cell)).toBe(true);
    });

    it('returns true for text taller than cell', () => {
      // Multiline text in short cell
      const cell = makeCell('Line1\nLine2\nLine3\nLine4\nLine5', 100, 2);
      expect(TextMeasurer.cellOverflows(cell)).toBe(true);
    });

    it('returns false when cell has no layout', () => {
      const cell: ICell = {
        cellID: 'test',
        inRegion: 'body',
        rawValue: 'text',
        style: { font: 'Arial', fontSize: 12 },
        isDynamic: false,
      };
      expect(TextMeasurer.cellOverflows(cell)).toBe(false);
    });

    it('returns false for empty text', () => {
      const cell = makeCell('', 50, 20);
      expect(TextMeasurer.cellOverflows(cell)).toBe(false);
    });

    it('handles numeric rawValue', () => {
      const cell = makeCell('', 50, 20);
      (cell as any).rawValue = 12345;
      expect(TextMeasurer.cellOverflows(cell)).toBe(false); // '12345' in 50mm wide cell
    });
  });

  // ============ findFittingFontSize ============

  describe('findFittingFontSize()', () => {
    it('returns current size if text already fits', () => {
      const result = TextMeasurer.findFittingFontSize('Hi', { fontSize: 12 }, 100, 50);
      expect(result).toBe(12);
    });

    it('returns smaller size for overflowing text', () => {
      const result = TextMeasurer.findFittingFontSize(
        'Very long text that overflows',
        { fontSize: 20 },
        10, // very narrow
        50,
      );
      expect(result).toBeLessThan(20);
    });

    it('returns minFontSize if nothing fits', () => {
      const result = TextMeasurer.findFittingFontSize(
        'This will never fit',
        { fontSize: 20 },
        1, // impossibly narrow
        1, // impossibly short
        6,
      );
      expect(result).toBe(6);
    });

    it('uses default minFontSize of 6', () => {
      const result = TextMeasurer.findFittingFontSize(
        'Very long text',
        { fontSize: 20 },
        1,
        1,
      );
      expect(result).toBe(6);
    });

    it('respects custom minFontSize', () => {
      const result = TextMeasurer.findFittingFontSize(
        'Very long text',
        { fontSize: 20 },
        1,
        1,
        8,
      );
      expect(result).toBe(8);
    });

    it('decreases in 0.5pt steps', () => {
      // For text that barely overflows, result should be close to original
      const result = TextMeasurer.findFittingFontSize('Hello', { fontSize: 12 }, 10, 10);
      // The result should be a multiple of 0.5 from 12 (12, 11.5, 11, ...)
      const diff = 12 - result;
      expect(diff % 0.5).toBeCloseTo(0, 10);
    });
  });

  // ============ wrapText ============

  describe('wrapText()', () => {
    it('does not wrap text that fits in one line', () => {
      const result = TextMeasurer.wrapText('Hi', 100, 12);
      expect(result.text).toBe('Hi');
    });

    it('wraps text into multiple lines', () => {
      // With fontSize 12, charWidth ≈ 2.54mm
      // Width = 15mm → ~5 chars per line
      const result = TextMeasurer.wrapText('hello world foo', 15, 12);
      expect(result.text.split('\n').length).toBeGreaterThan(1);
    });

    it('height increases with more wrapped lines', () => {
      const narrow = TextMeasurer.wrapText('a b c d e f g', 5, 12);
      const wide = TextMeasurer.wrapText('a b c d e f g', 100, 12);
      expect(narrow.height).toBeGreaterThan(wide.height);
    });

    it('handles zero width gracefully', () => {
      const result = TextMeasurer.wrapText('hello', 0, 12);
      // Should return original text
      expect(result.text).toBe('hello');
    });

    it('handles single word that exceeds width', () => {
      const result = TextMeasurer.wrapText('superlongword', 5, 12);
      // Single word can't be split, should be on its own line
      expect(result.text).toBe('superlongword');
    });

    it('preserves word boundaries', () => {
      const result = TextMeasurer.wrapText('hello world', 100, 12);
      // Should not break in the middle of a word
      expect(result.text).not.toContain('hel\nlo');
    });
  });
});
