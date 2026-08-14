import type { TeletextCell } from '../models/cell';
import { createEmptyCell } from '../models/cell';
import type { TeletextColor } from '../models/colors';
import { TELETEXT_COLUMNS, TELETEXT_ROWS } from '../models/page';

/**
 * Creates an empty 40x24 Teletext cell grid
 */
export function createEmptyGrid(fg: TeletextColor = 'white', bg: TeletextColor = 'black'): TeletextCell[][] {
  const grid: TeletextCell[][] = [];
  for (let r = 0; r < TELETEXT_ROWS; r++) {
    const row: TeletextCell[] = [];
    for (let c = 0; c < TELETEXT_COLUMNS; c++) {
      row.push(createEmptyCell(fg, bg));
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Normalizes a grid to ensure it strictly conforms to 24 rows x 40 columns
 */
export function normalizeGrid(rows: TeletextCell[][], defaultFg: TeletextColor = 'white', defaultBg: TeletextColor = 'black'): TeletextCell[][] {
  const normalized: TeletextCell[][] = [];

  for (let r = 0; r < TELETEXT_ROWS; r++) {
    const sourceRow = rows[r] || [];
    const row: TeletextCell[] = [];

    for (let c = 0; c < TELETEXT_COLUMNS; c++) {
      if (c < sourceRow.length && sourceRow[c]) {
        const cell = sourceRow[c];
        row.push({
          char: cell.char !== undefined && cell.char !== null ? cell.char : ' ',
          fg: cell.fg || defaultFg,
          bg: cell.bg || defaultBg,
          doubleHeight: cell.doubleHeight,
          doubleWidth: cell.doubleWidth,
          flash: cell.flash,
          conceal: cell.conceal,
          isGraphic: cell.isGraphic,
          link: cell.link,
        });
      } else {
        row.push(createEmptyCell(defaultFg, defaultBg));
      }
    }
    normalized.push(row);
  }

  return normalized;
}

/**
 * Converts a 40x24 cell grid to plain text lines
 */
export function gridToRawText(grid: TeletextCell[][]): string {
  return grid.map(row => row.map(cell => cell.char || ' ').join('')).join('\n');
}

/**
 * Populates a grid row with a text string at specified offset and colors
 */
export function writeTextToGridRow(
  row: TeletextCell[],
  col: number,
  text: string,
  fg: TeletextColor = 'white',
  bg: TeletextColor = 'black',
  link?: number
): void {
  for (let i = 0; i < text.length; i++) {
    const targetCol = col + i;
    if (targetCol >= TELETEXT_COLUMNS) break;

    row[targetCol] = {
      char: text[i],
      fg,
      bg,
      link,
    };
  }
}

/**
 * Formats standard Teletext Row 0 (Page Number, Channel, Date, Time)
 */
export function formatHeaderRow(
  channelName: string,
  pageNumber: number,
  subPage: number = 1,
  subPageCount: number = 1,
  dateStr?: string
): TeletextCell[] {
  const row: TeletextCell[] = [];
  for (let c = 0; c < TELETEXT_COLUMNS; c++) {
    row.push(createEmptyCell('white', 'black'));
  }

  const pageStr = `${pageNumber}${subPageCount > 1 ? `/${subPage}` : ''}`;
  const now = dateStr || new Date().toISOString().substring(11, 19);

  // Left: Page number (white on black)
  writeTextToGridRow(row, 0, ` ${pageStr.padEnd(7)}`, 'white', 'black');
  // Middle: Channel name (yellow on black)
  const channelDisplay = channelName.substring(0, 14);
  writeTextToGridRow(row, 10, channelDisplay, 'yellow', 'black');
  // Right: Timestamp (yellow/cyan on black)
  writeTextToGridRow(row, 30, now.padStart(9), 'yellow', 'black');

  return row;
}
