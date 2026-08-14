/**
 * Standard 8-color Teletext palette (ETS 300 706 Level 1/1.5)
 */
export type TeletextColor =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white';

export const TELETEXT_COLORS: Record<TeletextColor, string> = {
  black: '#000000',
  red: '#FF0000',
  green: '#00FF00',
  yellow: '#FFFF00',
  blue: '#0000FF',
  magenta: '#FF00FF',
  cyan: '#00FFFF',
  white: '#FFFFFF',
};

export const TELETEXT_ANSI_FG: Record<TeletextColor, string> = {
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

export const TELETEXT_ANSI_BG: Record<TeletextColor, string> = {
  black: '\x1b[40m',
  red: '\x1b[41m',
  green: '\x1b[42m',
  yellow: '\x1b[43m',
  blue: '\x1b[44m',
  magenta: '\x1b[45m',
  cyan: '\x1b[46m',
  white: '\x1b[47m',
};

export const ANSI_RESET = '\x1b[0m';

/**
 * Normalizes any CSS color string or class shorthand into a standard TeletextColor.
 */
export function normalizeTeletextColor(color: string | undefined, defaultColor: TeletextColor = 'white'): TeletextColor {
  if (!color) return defaultColor;

  const normalized = color.toLowerCase().trim().replace(/^(c|bc|bg_|fg_|fg|bg|#)/, '');

  switch (normalized) {
    case '000000':
    case '0':
    case 'b':
    case 'black':
    case 'schwarz':
      return 'black';

    case 'ff0000':
    case '1':
    case 'r':
    case 'red':
    case 'rot':
      return 'red';

    case '00ff00':
    case '2':
    case 'g':
    case 'green':
    case 'gruen':
    case 'grün':
      return 'green';

    case 'ffff00':
    case '3':
    case 'y':
    case 'yellow':
    case 'gelb':
      return 'yellow';

    case '0000ff':
    case '4':
    case 'bl':
    case 'blue':
    case 'blau':
      return 'blue';

    case 'ff00ff':
    case '5':
    case 'm':
    case 'magenta':
      return 'magenta';

    case '00ffff':
    case '6':
    case 'c':
    case 'cyan':
    case 'tuerkis':
    case 'türkis':
      return 'cyan';

    case 'ffffff':
    case '7':
    case 'w':
    case 'white':
    case 'weiss':
    case 'weiß':
      return 'white';

    default:
      // Fallback for hex values close to teletext colors
      if (normalized.startsWith('00') && normalized.endsWith('ff')) return 'cyan';
      return defaultColor;
  }
}
