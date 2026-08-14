import type { TeletextColor } from './colors';

/**
 * A single cell in the standard 40x24 Teletext display matrix
 */
export interface TeletextCell {
  /** The character to display */
  char: string;
  /** Foreground color */
  fg: TeletextColor;
  /** Background color */
  bg: TeletextColor;
  /** Whether cell is displayed double height */
  doubleHeight?: boolean;
  /** Whether cell is displayed double width */
  doubleWidth?: boolean;
  /** Whether cell is flashing */
  flash?: boolean;
  /** Whether cell is concealed (hidden until revealed) */
  conceal?: boolean;
  /** Whether character represents a Teletext block/mosaic graphic */
  isGraphic?: boolean;
  /** 6-bit sub-pixel mask for 2x3 sextant mosaic (0..63) */
  mosaicMask?: number;
  /** 3-digit page number destination if this cell is an active hyperlink */
  link?: number;
}

/**
 * Helper to create an empty cell
 */
export function createEmptyCell(fg: TeletextColor = 'white', bg: TeletextColor = 'black'): TeletextCell {
  return {
    char: ' ',
    fg,
    bg,
  };
}

/**
 * Helper to create a cell with text
 */
export function createCell(char: string, fg: TeletextColor = 'white', bg: TeletextColor = 'black', link?: number): TeletextCell {
  return {
    char: char || ' ',
    fg,
    bg,
    link,
  };
}

/**
 * Helper to create a graphic cell with 6-bit mosaic mask
 */
export function createGraphicCell(char: string, fg: TeletextColor, bg: TeletextColor, mosaicMask: number, link?: number): TeletextCell {
  return {
    char,
    fg,
    bg,
    isGraphic: true,
    mosaicMask,
    link,
  };
}
