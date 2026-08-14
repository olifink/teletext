import { describe, expect, it } from 'bun:test';
import { normalizeTeletextColor, TELETEXT_COLORS } from '../src/models/colors';
import { decodeHtmlEntities, stripHtmlTags } from '../src/parser/html-sanitizer';
import {
  ardGraphicToChar,
  ardGraphicToCharAndMask,
  hrGraphicToChar,
  hrGraphicToCharAndMask,
  mosaicBitmapToChar,
  teletextCodeToMask,
  zdfLineDrawToCharAndMask,
} from '../src/parser/mosaic';
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

describe('Teletext Mosaic / Block Graphics (ETS 300 706)', () => {
  it('maps mosaic bitmaps to standard block characters and sextants', () => {
    expect(mosaicBitmapToChar(0)).toBe(' ');
    expect(mosaicBitmapToChar(15)).toBe('\u{1FB0E}'); // 🬎 BLOCK SEXTANT-1234
    expect(mosaicBitmapToChar(48)).toBe('\u{1FB2D}'); // 🬭 BLOCK SEXTANT-56
    expect(mosaicBitmapToChar(21)).toBe('▌'); // LEFT HALF BLOCK
    expect(mosaicBitmapToChar(42)).toBe('▐'); // RIGHT HALF BLOCK
    expect(mosaicBitmapToChar(63)).toBe('█'); // FULL BLOCK
    expect(mosaicBitmapToChar(1)).toBe('\u{1FB00}');
    expect(mosaicBitmapToChar(12)).toBe('\u{1FB0B}');
  });

  it('converts 7-bit Teletext character codes to 6-bit mosaic masks', () => {
    expect(teletextCodeToMask(0x20)).toBe(0);
    expect(teletextCodeToMask(0x70)).toBe(48); // Bottom-left + Bottom-right
    expect(teletextCodeToMask(0x2c)).toBe(12); // Mid-left + Mid-right
    expect(teletextCodeToMask(0x7f)).toBe(63); // Full block
  });

  it('decodes ARD image graphic names and masks', () => {
    const res70 = ardGraphicToCharAndMask('img/g1w70.gif');
    expect(res70.mask).toBe(48);
    expect(res70.char).toBe('\u{1FB2D}'); // 🬭

    const res2c = ardGraphicToCharAndMask('img/g1w2c.gif');
    expect(res2c.mask).toBe(12);
    expect(res2c.char).toBe('\u{1FB0B}');
  });

  it('decodes ZDF linedraw characters to masks', () => {
    const res = zdfLineDrawToCharAndMask('/');
    expect(res.mask).toBe(15);
    expect(res.char).toBe('\u{1FB0E}'); // 🬎
  });

  it('decodes HR graphic class names', () => {
    const res = hrGraphicToCharAndMask('g1c47c');
    expect(res.mask).toBe(60); // 0x7c -> (0x1c) | (0x20) = 0x3c = 60
    expect(typeof res.char).toBe('string');
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
