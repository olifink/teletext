/**
 * Teletext Block Graphics / Mosaic (ETS 300 706 G1 Set) Handler
 *
 * Each Teletext character cell contains a 2x3 grid of 6 sub-pixels:
 *   Bit 0 (0x01): Top-Left (1)      Bit 1 (0x02): Top-Right (2)
 *   Bit 2 (0x04): Middle-Left (3)   Bit 3 (0x08): Middle-Right (4)
 *   Bit 4 (0x10): Bottom-Left (5)   Bit 5 (0x20): Bottom-Right (6)
 *
 * In ETS 300 706 Table 35, 7-bit character codes (0x20..0x7F) map as:
 *   b1 (bit 0) -> Bit 0 (Top-Left)
 *   b2 (bit 1) -> Bit 1 (Top-Right)
 *   b3 (bit 2) -> Bit 2 (Mid-Left)
 *   b4 (bit 3) -> Bit 3 (Mid-Right)
 *   b5 (bit 4) -> Bit 4 (Bot-Left)
 *   b7 (bit 6) -> Bit 5 (Bot-Right)
 *
 * Formula: mask = (code & 0x1f) | ((code & 0x40) >> 1);
 */

/**
 * Exact 64-entry mapping table for all 6-bit mosaic bitmaps (0..63)
 * Maps masks to standard Unicode 13.0 Symbols for Legacy Computing (U+1FB00..U+1FB3B),
 * plus standard Block Elements (U+258C, U+2590, U+2588) and Space (U+0020).
 */
export const SEXTANT_UNICODE_MAP: string[] = [
  ' ',         // 00 (bin 000000):   <- SPACE
  '\u{1FB00}', // 01 (bin 000001): 🬀 <- BLOCK SEXTANT-1
  '\u{1FB01}', // 02 (bin 000010): 🬁 <- BLOCK SEXTANT-2
  '\u{1FB02}', // 03 (bin 000011): 🬂 <- BLOCK SEXTANT-12
  '\u{1FB03}', // 04 (bin 000100): 🬃 <- BLOCK SEXTANT-3
  '\u{1FB04}', // 05 (bin 000101): 🬄 <- BLOCK SEXTANT-13
  '\u{1FB05}', // 06 (bin 000110): 🬅 <- BLOCK SEXTANT-23
  '\u{1FB06}', // 07 (bin 000111): 🬆 <- BLOCK SEXTANT-123
  '\u{1FB07}', // 08 (bin 001000): 🬇 <- BLOCK SEXTANT-4
  '\u{1FB08}', // 09 (bin 001001): 🬈 <- BLOCK SEXTANT-14
  '\u{1FB09}', // 10 (bin 001010): 🬉 <- BLOCK SEXTANT-24
  '\u{1FB0A}', // 11 (bin 001011): 🬊 <- BLOCK SEXTANT-124
  '\u{1FB0B}', // 12 (bin 001100): 🬋 <- BLOCK SEXTANT-34
  '\u{1FB0C}', // 13 (bin 001101): 🬌 <- BLOCK SEXTANT-134
  '\u{1FB0D}', // 14 (bin 001110): 🬍 <- BLOCK SEXTANT-234
  '\u{1FB0E}', // 15 (bin 001111): 🬎 <- BLOCK SEXTANT-1234
  '\u{1FB0F}', // 16 (bin 010000): 🬏 <- BLOCK SEXTANT-5
  '\u{1FB10}', // 17 (bin 010001): 🬐 <- BLOCK SEXTANT-15
  '\u{1FB11}', // 18 (bin 010010): 🬑 <- BLOCK SEXTANT-25
  '\u{1FB12}', // 19 (bin 010011): 🬒 <- BLOCK SEXTANT-125
  '\u{1FB13}', // 20 (bin 010100): 🬓 <- BLOCK SEXTANT-35
  '\u{258C}',  // 21 (bin 010101): ▌ <- LEFT HALF BLOCK
  '\u{1FB14}', // 22 (bin 010110): 🬔 <- BLOCK SEXTANT-235
  '\u{1FB15}', // 23 (bin 010111): 🬕 <- BLOCK SEXTANT-1235
  '\u{1FB16}', // 24 (bin 011000): 🬖 <- BLOCK SEXTANT-45
  '\u{1FB17}', // 25 (bin 011001): 🬗 <- BLOCK SEXTANT-145
  '\u{1FB18}', // 26 (bin 011010): 🬘 <- BLOCK SEXTANT-245
  '\u{1FB19}', // 27 (bin 011011): 🬙 <- BLOCK SEXTANT-1245
  '\u{1FB1A}', // 28 (bin 011100): 🬚 <- BLOCK SEXTANT-345
  '\u{1FB1B}', // 29 (bin 011101): 🬛 <- BLOCK SEXTANT-1345
  '\u{1FB1C}', // 30 (bin 011110): 🬜 <- BLOCK SEXTANT-2345
  '\u{1FB1D}', // 31 (bin 011111): 🬝 <- BLOCK SEXTANT-12345
  '\u{1FB1E}', // 32 (bin 100000): 🬞 <- BLOCK SEXTANT-6
  '\u{1FB1F}', // 33 (bin 100001): 🬟 <- BLOCK SEXTANT-16
  '\u{1FB20}', // 34 (bin 100010): 🬠 <- BLOCK SEXTANT-26
  '\u{1FB21}', // 35 (bin 100011): 🬡 <- BLOCK SEXTANT-126
  '\u{1FB22}', // 36 (bin 100100): 🬢 <- BLOCK SEXTANT-36
  '\u{1FB23}', // 37 (bin 100101): 🬣 <- BLOCK SEXTANT-136
  '\u{1FB24}', // 38 (bin 100110): 🬤 <- BLOCK SEXTANT-236
  '\u{1FB25}', // 39 (bin 100111): 🬥 <- BLOCK SEXTANT-1236
  '\u{1FB26}', // 40 (bin 101000): 🬦 <- BLOCK SEXTANT-46
  '\u{1FB27}', // 41 (bin 101001): 🬧 <- BLOCK SEXTANT-146
  '\u{2590}',  // 42 (bin 101010): ▐ <- RIGHT HALF BLOCK
  '\u{1FB28}', // 43 (bin 101011): 🬨 <- BLOCK SEXTANT-1246
  '\u{1FB29}', // 44 (bin 101100): 🬩 <- BLOCK SEXTANT-346
  '\u{1FB2A}', // 45 (bin 101101): 🬪 <- BLOCK SEXTANT-1346
  '\u{1FB2B}', // 46 (bin 101110): 🬫 <- BLOCK SEXTANT-2346
  '\u{1FB2C}', // 47 (bin 101111): 🬬 <- BLOCK SEXTANT-12346
  '\u{1FB2D}', // 48 (bin 110000): 🬭 <- BLOCK SEXTANT-56
  '\u{1FB2E}', // 49 (bin 110001): 🬮 <- BLOCK SEXTANT-156
  '\u{1FB2F}', // 50 (bin 110010): 🬯 <- BLOCK SEXTANT-256
  '\u{1FB30}', // 51 (bin 110011): 🬰 <- BLOCK SEXTANT-1256
  '\u{1FB31}', // 52 (bin 110100): 🬱 <- BLOCK SEXTANT-356
  '\u{1FB32}', // 53 (bin 110101): 🬲 <- BLOCK SEXTANT-1356
  '\u{1FB33}', // 54 (bin 110110): 🬳 <- BLOCK SEXTANT-2356
  '\u{1FB34}', // 55 (bin 110111): 🬴 <- BLOCK SEXTANT-12356
  '\u{1FB35}', // 56 (bin 111000): 🬵 <- BLOCK SEXTANT-456
  '\u{1FB36}', // 57 (bin 111001): 🬶 <- BLOCK SEXTANT-1456
  '\u{1FB37}', // 58 (bin 111010): 🬷 <- BLOCK SEXTANT-2456
  '\u{1FB38}', // 59 (bin 111011): 🬸 <- BLOCK SEXTANT-12456
  '\u{1FB39}', // 60 (bin 111100): 🬹 <- BLOCK SEXTANT-3456
  '\u{1FB3A}', // 61 (bin 111101): 🬺 <- BLOCK SEXTANT-13456
  '\u{1FB3B}', // 62 (bin 111110): 🬻 <- BLOCK SEXTANT-23456
  '\u{2588}',  // 63 (bin 111111): █ <- FULL BLOCK
];

/**
 * Converts a 6-bit mosaic bitmask (0..63) to its Unicode character
 */
export function mosaicBitmapToChar(mask: number): string {
  const normalized = mask & 0x3f;
  return SEXTANT_UNICODE_MAP[normalized] || ' ';
}

/**
 * Converts a standard Teletext 7-bit character code (0x20..0x7F) into 6-bit mosaic mask (0..63)
 */
export function teletextCodeToMask(code: number): number {
  const c = code & 0x7f;
  return (c & 0x1f) | ((c & 0x40) >> 1);
}

/**
 * Converts ARD image filename (e.g. "g1w70.gif", "g1b2c.gif") to mosaic character and 6-bit mask
 */
export function ardGraphicToCharAndMask(imgSrc: string): { char: string; mask: number } {
  const match = imgSrc.match(/g1[a-z]([0-9a-f]{2})/i);
  if (!match) return { char: ' ', mask: 0 };

  const hexVal = parseInt(match[1], 16);
  const mask = teletextCodeToMask(hexVal);
  return {
    char: mosaicBitmapToChar(mask),
    mask,
  };
}

export function ardGraphicToChar(imgSrc: string): string {
  return ardGraphicToCharAndMask(imgSrc).char;
}

/**
 * Converts HR Text class name (e.g. "g1c47c", "g1c47f") to mosaic character and 6-bit mask
 */
export function hrGraphicToCharAndMask(className: string): { char: string; mask: number } {
  const match = className.match(/g1c[0-7]?([0-9a-f]{2})/i) || className.match(/g1c([0-9a-f]{2,4})/i);
  if (!match) return { char: ' ', mask: 0 };

  const hexStr = match[1].slice(-2);
  const hexVal = parseInt(hexStr, 16);
  const mask = teletextCodeToMask(hexVal);
  return {
    char: mosaicBitmapToChar(mask),
    mask,
  };
}

export function hrGraphicToChar(className: string): string {
  return hrGraphicToCharAndMask(className).char;
}

/**
 * Converts ZDF linedraw character to mosaic character and 6-bit mask
 */
export function zdfLineDrawToCharAndMask(char: string): { char: string; mask: number } {
  const code = char.charCodeAt(0);
  const mask = teletextCodeToMask(code);
  return {
    char: mosaicBitmapToChar(mask),
    mask,
  };
}

export function zdfLineDrawToChar(char: string): string {
  return zdfLineDrawToCharAndMask(char).char;
}
