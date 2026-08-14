import { describe, expect, it } from 'bun:test';
import { createEmptyGrid, formatHeaderRow, gridToRawText, normalizeGrid, writeTextToGridRow } from '../src/parser/grid';
import { TELETEXT_COLUMNS, TELETEXT_ROWS } from '../src/models/page';
import { createCell } from '../src/models/cell';

describe('Teletext Grid Operations', () => {
  it('creates an empty grid with exactly 24 rows and 40 columns', () => {
    const grid = createEmptyGrid('white', 'black');
    expect(grid.length).toBe(TELETEXT_ROWS);
    for (const row of grid) {
      expect(row.length).toBe(TELETEXT_COLUMNS);
      for (const cell of row) {
        expect(cell.char).toBe(' ');
        expect(cell.fg).toBe('white');
        expect(cell.bg).toBe('black');
      }
    }
  });

  it('normalizes undersized and oversized rows strictly to 24x40', () => {
    const shortRows = [
      [createCell('A', 'red', 'black'), createCell('B', 'green', 'black')],
    ];

    const normalized = normalizeGrid(shortRows);
    expect(normalized.length).toBe(24);
    expect(normalized[0].length).toBe(40);
    expect(normalized[0][0].char).toBe('A');
    expect(normalized[0][0].fg).toBe('red');
    expect(normalized[0][1].char).toBe('B');
    expect(normalized[0][2].char).toBe(' ');
    expect(normalized[23].length).toBe(40);
  });

  it('formats header row with page number, channel name and timestamp', () => {
    const header = formatHeaderRow('ARD Text', 100, 1, 1, '12:00:00');
    expect(header.length).toBe(40);
    const text = header.map(c => c.char).join('');
    expect(text).toContain('100');
    expect(text).toContain('ARD Text');
    expect(text).toContain('12:00:00');
  });

  it('writes text to a grid row at specific offset', () => {
    const grid = createEmptyGrid();
    writeTextToGridRow(grid[1], 5, 'TAGESSCHAU', 'yellow', 'blue', 101);

    expect(grid[1][4].char).toBe(' ');
    expect(grid[1][5].char).toBe('T');
    expect(grid[1][5].fg).toBe('yellow');
    expect(grid[1][5].bg).toBe('blue');
    expect(grid[1][5].link).toBe(101);
    expect(grid[1][14].char).toBe('U');
    expect(grid[1][15].char).toBe(' ');
  });

  it('converts grid to 24-line raw text string', () => {
    const grid = createEmptyGrid();
    writeTextToGridRow(grid[0], 0, 'HELLO TELETEXT');
    const raw = gridToRawText(grid);
    const lines = raw.split('\n');
    expect(lines.length).toBe(24);
    expect(lines[0].startsWith('HELLO TELETEXT')).toBe(true);
  });
});
