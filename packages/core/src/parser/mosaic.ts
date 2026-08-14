/**
 * Teletext Block Graphics / Mosaic (ETS 300 706 G1 Set) Handler
 *
 * Each Teletext character cell contains a 2x3 grid of 6 sub-pixels:
 *   Bit 0 (0x01): Top-Left     Bit 1 (0x02): Top-Right
 *   Bit 2 (0x04): Middle-Left  Bit 3 (0x08): Middle-Right
 *   Bit 4 (0x10): Bottom-Left  Bit 5 (0x20): Bottom-Right
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
 * 64-entry mapping table for all 6-bit mosaic bitmaps (0..63)
 * Maps masks to standard Unicode 13.0 Symbols for Legacy Computing (U+1FB00..U+1FB3B),
 * plus standard Block Elements (U+2580, U+2584, U+2588) and Space (U+0020).
 */
export const SEXTANT_UNICODE_MAP: string[] = [
  ' ',         // 000000 (0):  Space
  '\u{1FB00}', // 000001 (1):  🬀
  '\u{1FB01}', // 000010 (2):  🬁
  '\u{1FB02}', // 000011 (3):  🬂
  '\u{1FB03}', // 000100 (4):  🬃
  '\u{1FB04}', // 000101 (5):  🬄
  '\u{1FB05}', // 000110 (6):  🬅
  '\u{1FB06}', // 000111 (7):  🬆
  '\u{1FB07}', // 001000 (8):  🬇
  '\u{1FB08}', // 001001 (9):  🬈
  '\u{1FB09}', // 001010 (10): 🬉
  '\u{1FB0A}', // 001011 (11): 🬊
  '\u{1FB0B}', // 001100 (12): 🬋
  '\u{1FB0C}', // 001101 (13): 🬌
  '\u{1FB0D}', // 001110 (14): 🬍
  '\u{2580}',  // 001111 (15): ▀ (Upper Half Block)
  '\u{1FB0E}', // 010000 (16): 🬎
  '\u{1FB0F}', // 010001 (17): 🬏
  '\u{1FB10}', // 010010 (18): 🬐
  '\u{1FB11}', // 010011 (19): 🬑
  '\u{1FB12}', // 010100 (20): 🬒
  '\u{1FB13}', // 010101 (21): 🬓
  '\u{1FB14}', // 010110 (22): 🬔
  '\u{1FB15}', // 010111 (23): 🬕
  '\u{1FB16}', // 011000 (24): 🬖
  '\u{1FB17}', // 011001 (25): 🬗
  '\u{1FB18}', // 011010 (26): 🬘
  '\u{1FB19}', // 011011 (27): 🬙
  '\u{1FB1A}', // 011100 (28): 🬚
  '\u{1FB1B}', // 011101 (29): 🬛
  '\u{1FB1C}', // 011110 (30): 🬜
  '\u{1FB1D}', // 011111 (31): 🬝
  '\u{1FB1E}', // 100000 (32): 🬞
  '\u{1FB1F}', // 100001 (33): 🬟
  '\u{1FB20}', // 100010 (34): 🬠
  '\u{1FB21}', // 100011 (35): 🬡
  '\u{1FB22}', // 100100 (36): 🬢
  '\u{1FB23}', // 100101 (37): 🬣
  '\u{1FB24}', // 100110 (38): 🬤
  '\u{1FB25}', // 100111 (39): 🬥
  '\u{1FB26}', // 101000 (40): 🬦
  '\u{1FB27}', // 101001 (41): 🬧
  '\u{1FB28}', // 101010 (42): 🬨
  '\u{1FB29}', // 101011 (43): 🬩
  '\u{1FB2A}', // 101100 (44): 🬪
  '\u{1FB2B}', // 101101 (45): 🬫
  '\u{1FB2C}', // 101110 (46): 🬬
  '\u{1FB2D}', // 101111 (47): 🬭
  '\u{2584}',  // 110000 (48): ▄ (Lower Half Block)
  '\u{1FB2E}', // 110001 (49): 🬮
  '\u{1FB2F}', // 110010 (50): 🬯
  '\u{1FB30}', // 110011 (51): 🬰
  '\u{1FB31}', // 110100 (52): 🬱
  '\u{1FB32}', // 110101 (53): 🬲
  '\u{1FB33}', // 110110 (54): 🬳
  '\u{1FB34}', // 110111 (55): 🬴
  '\u{1FB35}', // 111000 (56): 🬵
  '\u{1FB36}', // 111001 (57): 🬶
  '\u{1FB37}', // 111010 (58): 🬷
  '\u{1FB38}', // 111011 (59): 🬸
  '\u{1FB39}', // 111100 (60): 🬹
  '\u{1FB3A}', // 111101 (61): 🬺
  '\u{1FB3B}', // 111110 (62): 🬻
  '\u{2588}',  // 111111 (63): █ (Full Block)
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
