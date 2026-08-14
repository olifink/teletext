import { describe, expect, it } from 'bun:test';
import { normalizeTeletextColor, TELETEXT_COLORS } from '../src/models/colors';
import { decodeHtmlEntities, stripHtmlTags } from '../src/parser/html-sanitizer';
import { ardGraphicToChar, hrGraphicToChar, mosaicBitmapToChar } from '../src/parser/mosaic';
import { annotateGridWithLinks, extractFastTextFromGrid, extractPageLinks, isValidPageNumber } from '../src/parser/link-extractor';
import { createEmptyGrid, writeTextToGridRow } from '../src/parser/grid';

describe('Teletext Colors & Sanitizer', () => {
  it('normalizes various color representations', () => {
    expect(normalizeTeletextColor('cFFFFFF')).toBe('white');
    expect(normalizeTeletextColor('bc000000')).toBe('black');
    expect(normalizeTeletextColor('fgw')).toBe('white');
    expect(normalizeTeletextColor('bgbl')).toBe('blue');
    expect(normalizeTeletextColor('fgy')).toBe('yellow');
    expect(normalizeTeletextColor('fgg')).toBe('green');
    expect(normalizeTeletextColor('fgr')).toBe('red');
    expect(normalizeTeletextColor('fgc')).toBe('cyan');
    expect(normalizeTeletextColor('fgm')).toBe('magenta');
    expect(normalizeTeletextColor('0')).toBe('black');
    expect(normalizeTeletextColor('7')).toBe('white');
  });

  it('decodes German HTML entities', () => {
    const input = '&Auml;rzte f&uuml;r sch&ouml;ne Fu&szlig;ball-Tore &amp; Mehr &euro;';
    const decoded = decodeHtmlEntities(input);
    expect(decoded).toBe('Ärzte für schöne Fußball-Tore & Mehr €');
  });

  it('strips HTML tags cleanly', () => {
    const html = '<div class="news"><span class="title">Tagesschau</span> <b>101</b></div>';
    expect(stripHtmlTags(html)).toBe('Tagesschau 101');
  });
});

describe('Teletext Mosaic / Block Graphics', () => {
  it('maps mosaic bitmaps to block characters', () => {
    expect(mosaicBitmapToChar(0)).toBe(' ');
    expect(mosaicBitmapToChar(63)).toBe('█');
    const char1 = mosaicBitmapToChar(1);
    expect(char1.length).toBeGreaterThan(0);
  });

  it('decodes ARD image graphic names', () => {
    const char = ardGraphicToChar('img/g1w70.gif');
    expect(typeof char).toBe('string');
  });

  it('decodes HR graphic class names', () => {
    const char = hrGraphicToChar('g1c47c');
    expect(typeof char).toBe('string');
  });
});

describe('Teletext Link Extraction', () => {
  it('validates 3-digit page numbers (100–899)', () => {
    expect(isValidPageNumber(100)).toBe(true);
    expect(isValidPageNumber(899)).toBe(true);
    expect(isValidPageNumber(99)).toBe(false);
    expect(isValidPageNumber(900)).toBe(false);
    expect(isValidPageNumber(100.5)).toBe(false);
  });

  it('extracts embedded page numbers from text', () => {
    const text = 'Nachrichten auf Seite 101 und 102. Sport ab 200, Wetter 170. Keine 999 oder 050.';
    const links = extractPageLinks(text);
    expect(links).toEqual([101, 102, 170, 200]);
  });

  it('annotates grid cells with clickable link targets', () => {
    const grid = createEmptyGrid();
    writeTextToGridRow(grid[5], 2, 'Siehe Seite 105 fuer mehr Details');
    annotateGridWithLinks(grid);

    // "105" is at columns 14, 15, 16
    expect(grid[5][14].link).toBe(105);
    expect(grid[5][15].link).toBe(105);
    expect(grid[5][16].link).toBe(105);
    expect(grid[5][13].link).toBeUndefined();
    expect(grid[5][17].link).toBeUndefined();
  });

  it('extracts FastText bottom buttons', () => {
    const grid = createEmptyGrid();
    writeTextToGridRow(grid[23], 0, ' 101 ', 'white', 'red');
    writeTextToGridRow(grid[23], 10, ' 200 ', 'black', 'green');
    writeTextToGridRow(grid[23], 20, ' 300 ', 'black', 'yellow');
    writeTextToGridRow(grid[23], 30, ' 170 ', 'white', 'blue');

    const fastText = extractFastTextFromGrid(grid);
    expect(fastText).toBeDefined();
    expect(fastText?.red).toBe(101);
    expect(fastText?.green).toBe(200);
    expect(fastText?.yellow).toBe(300);
    expect(fastText?.blue).toBe(170);
  });
});
