/**
 * Teletext Block Graphics / Mosaic (ETS 300 706 G1 Set) handler
 * Maps 6-bit mosaic bitmaps (2x3 sub-pixels) to Unicode mosaic symbols and block characters.
 */

// Bitmask values for 2x3 sub-pixels:
// Bit 0 (1):  Top-Left
// Bit 1 (2):  Top-Right
// Bit 2 (4):  Middle-Left
// Bit 3 (8):  Middle-Right
// Bit 4 (16): Bottom-Left
// Bit 5 (32): Bottom-Right

/**
 * Maps 6-bit mosaic value (0..63) to Unicode legacy computing block character or block element fallback.
 */
export function mosaicBitmapToChar(bitmask: number): string {
  const mask = bitmask & 0x3f;
  if (mask === 0) return ' ';
  if (mask === 0x3f) return '█';

  // Unicode 13.0 Symbols for Legacy Computing (U+1FB00 .. U+1FB3B)
  // Mapping table for 64 mosaic states:
  // Bit 0..4 map sequentially to U+1FB00..U+1FB1F, bit 5 (32) starts secondary range U+1FB20..U+1FB3B
  // (Excluding 0 and 63)
  if (mask >= 1 && mask <= 0x1f) {
    return String.fromCodePoint(0x1fb00 + mask - 1);
  } else if (mask >= 0x20 && mask <= 0x3e) {
    return String.fromCodePoint(0x1fb20 + (mask - 0x20));
  }

  return '█';
}

/**
 * Converts ARD image filename (e.g. "g1w70.gif", "g1b2c.gif") to mosaic character.
 * Format: "g1" + [color_letter] + [hex_code] + ".gif"
 */
export function ardGraphicToChar(imgSrcOrClass: string): string {
  const match = imgSrcOrClass.match(/g1[a-z]([0-9a-f]{2})/i);
  if (!match) return ' ';

  const hexVal = parseInt(match[1], 16);
  // ARD hex encodes the ASCII code in G1 set (offset 0x20..0x7F)
  // To get bitmask: bit 0..4 = b0..b4 of char, bit 5 = b6 of char
  const charCode = hexVal;
  const bit0 = (charCode & 0x01);
  const bit1 = (charCode & 0x02) >> 1;
  const bit2 = (charCode & 0x04) >> 2;
  const bit3 = (charCode & 0x08) >> 3;
  const bit4 = (charCode & 0x10) >> 4;
  const bit5 = (charCode & 0x40) >> 6;

  const bitmask = bit0 | (bit1 << 1) | (bit2 << 2) | (bit3 << 3) | (bit4 << 4) | (bit5 << 5);
  return mosaicBitmapToChar(bitmask);
}

/**
 * Converts HR Text class name (e.g. "g1c47c", "g1c47f") to mosaic character.
 */
export function hrGraphicToChar(className: string): string {
  const match = className.match(/g1c([0-9a-f]{2,4})/i);
  if (!match) return ' ';

  const hexVal = parseInt(match[1], 16);
  // Last 2 hex digits correspond to ASCII code
  const charCode = hexVal & 0x7f;
  const bit0 = (charCode & 0x01);
  const bit1 = (charCode & 0x02) >> 1;
  const bit2 = (charCode & 0x04) >> 2;
  const bit3 = (charCode & 0x08) >> 3;
  const bit4 = (charCode & 0x10) >> 4;
  const bit5 = (charCode & 0x40) >> 6;

  const bitmask = bit0 | (bit1 << 1) | (bit2 << 2) | (bit3 << 3) | (bit4 << 4) | (bit5 << 5);
  return mosaicBitmapToChar(bitmask);
}

/**
 * Maps ZDF teletextlinedraw character (which uses ASCII chars mapped to mosaic font)
 */
export function zdfLineDrawToChar(char: string): string {
  const code = char.charCodeAt(0);
  if (code >= 0x20 && code <= 0x7f) {
    const bit0 = (code & 0x01);
    const bit1 = (code & 0x02) >> 1;
    const bit2 = (code & 0x04) >> 2;
    const bit3 = (code & 0x08) >> 3;
    const bit4 = (code & 0x10) >> 4;
    const bit5 = (code & 0x40) >> 6;
    const bitmask = bit0 | (bit1 << 1) | (bit2 << 2) | (bit3 << 3) | (bit4 << 4) | (bit5 << 5);
    return mosaicBitmapToChar(bitmask);
  }
  return char;
}
