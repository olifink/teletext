import type { TeletextCell } from '../models/cell';
import type { FastTextLinks } from '../models/page';

/**
 * Valid Teletext page number range: 100 to 899
 */
export function isValidPageNumber(pageNum: number): boolean {
  return Number.isInteger(pageNum) && pageNum >= 100 && pageNum <= 899;
}

/**
 * Parses a string to extract a valid page number, or null
 */
export function parsePageNumber(str: string | number | undefined | null): number | null {
  if (str === undefined || str === null) return null;
  const num = typeof str === 'number' ? str : parseInt(String(str).trim(), 10);
  return isValidPageNumber(num) ? num : null;
}

/**
 * Finds all 3-digit page numbers (100–899) in plain text or HTML
 */
export function extractPageLinks(text: string): number[] {
  if (!text) return [];

  const found = new Set<number>();
  // Match 3-digit numbers with word boundary or non-digit boundary
  const regex = /(?:^|\D)([1-8]\d{2})(?:\D|$)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const page = parseInt(match[1], 10);
    if (isValidPageNumber(page)) {
      found.add(page);
    }
  }

  return Array.from(found).sort((a, b) => a - b);
}

/**
 * Annotates grid cells with clickable 3-digit page links
 */
export function annotateGridWithLinks(grid: TeletextCell[][]): void {
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    if (!row) continue;

    // Join characters to find 3-digit numbers
    const lineText = row.map(c => c.char || ' ').join('');
    const regex = /(?:^|\D)([1-8]\d{2})(?:\D|$)/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(lineText)) !== null) {
      const pageStr = match[1];
      const pageNum = parseInt(pageStr, 10);
      const fullMatchIndex = match.index;
      // Offset if leading non-digit character was matched
      const startIdx = lineText.substring(fullMatchIndex).startsWith(pageStr)
        ? fullMatchIndex
        : fullMatchIndex + (match[0].length - pageStr.length - (match[0].endsWith(pageStr) ? 0 : 1));

      if (isValidPageNumber(pageNum) && startIdx >= 0 && startIdx + 3 <= row.length) {
        for (let c = 0; c < 3; c++) {
          if (row[startIdx + c]) {
            row[startIdx + c].link = pageNum;
          }
        }
      }
    }
  }
}

/**
 * Extracts Fast-Text bottom navigation buttons (Red, Green, Yellow, Blue)
 * Often found on row 23 or in special broadcaster HTML markup.
 */
export function extractFastTextFromGrid(grid: TeletextCell[][]): FastTextLinks | undefined {
  if (!grid || grid.length < 24) return undefined;

  const lastRow = grid[23];
  if (!lastRow) return undefined;

  const fastText: FastTextLinks = {};

  // Look for cells with red, green, yellow, blue foreground/background on row 23
  let currentColor: string | null = null;
  let currentDigits = '';

  for (let c = 0; c < lastRow.length; c++) {
    const cell = lastRow[c];
    const color = cell.fg !== 'white' && cell.fg !== 'black' ? cell.fg : cell.bg;

    if (/\d/.test(cell.char)) {
      currentDigits += cell.char;
      if (currentDigits.length === 3) {
        const page = parseInt(currentDigits, 10);
        if (isValidPageNumber(page)) {
          if (color === 'red' && !fastText.red) fastText.red = page;
          else if (color === 'green' && !fastText.green) fastText.green = page;
          else if (color === 'yellow' && !fastText.yellow) fastText.yellow = page;
          else if (color === 'blue' && !fastText.blue) fastText.blue = page;
          else if (currentColor === 'red' && !fastText.red) fastText.red = page;
          else if (currentColor === 'green' && !fastText.green) fastText.green = page;
          else if (currentColor === 'yellow' && !fastText.yellow) fastText.yellow = page;
          else if (currentColor === 'blue' && !fastText.blue) fastText.blue = page;
        }
        currentDigits = '';
      }
    } else {
      if (color && ['red', 'green', 'yellow', 'blue'].includes(color)) {
        currentColor = color;
      }
      currentDigits = '';
    }
  }

  return Object.keys(fastText).length > 0 ? fastText : undefined;
}
