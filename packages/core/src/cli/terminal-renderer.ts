import {
  ANSI_RESET,
  TELETEXT_ANSI_BG,
  TELETEXT_ANSI_FG,
} from '../models/colors';
import type { TeletextPage } from '../models/page';

/**
 * Renders a TeletextPage into colored ANSI terminal output
 */
export function renderToAnsi(page: TeletextPage): string {
  const lines: string[] = [];

  // Top Frame Header
  const titleBar = ` 📺 ${page.channelName} | Seite ${page.pageNumber}${page.subPageCount > 1 ? ` (${page.subPage}/${page.subPageCount})` : ''} | ${page.title} `;
  const border = '═'.repeat(42);
  lines.push(`\x1b[90m╔${border}╗\x1b[0m`);
  lines.push(`\x1b[90m║\x1b[1;37;44m ${titleBar.padEnd(40).substring(0, 40)} \x1b[0m\x1b[90m║\x1b[0m`);
  lines.push(`\x1b[90m╠${border}╣\x1b[0m`);

  // Render 24 rows
  for (let r = 0; r < page.grid.length; r++) {
    const row = page.grid[r];
    let rowAnsi = '\x1b[90m║\x1b[0m';

    let lastFg = '';
    let lastBg = '';

    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      const fgAnsi = TELETEXT_ANSI_FG[cell.fg] || TELETEXT_ANSI_FG.white;
      const bgAnsi = TELETEXT_ANSI_BG[cell.bg] || TELETEXT_ANSI_BG.black;

      if (fgAnsi !== lastFg || bgAnsi !== lastBg) {
        rowAnsi += `${bgAnsi}${fgAnsi}`;
        lastFg = fgAnsi;
        lastBg = bgAnsi;
      }

      rowAnsi += cell.char || ' ';
    }

    rowAnsi += `${ANSI_RESET}\x1b[90m║\x1b[0m`;
    lines.push(rowAnsi);
  }

  // Fast-Text Footer if present
  lines.push(`\x1b[90m╠${border}╣\x1b[0m`);
  let footer = '';
  if (page.fastText) {
    const ft = page.fastText;
    const r = ft.red ? `\x1b[41;37m ${ft.red} \x1b[0m` : '     ';
    const g = ft.green ? `\x1b[42;30m ${ft.green} \x1b[0m` : '     ';
    const y = ft.yellow ? `\x1b[43;30m ${ft.yellow} \x1b[0m` : '     ';
    const b = ft.blue ? `\x1b[44;37m ${ft.blue} \x1b[0m` : '     ';
    footer = ` ${r}  ${g}  ${y}  ${b} `;
  } else {
    footer = ` Links: ${page.links.slice(0, 8).join(', ')} `;
  }
  lines.push(`\x1b[90m║\x1b[0m${footer.padEnd(42, ' ')}\x1b[90m║\x1b[0m`);
  lines.push(`\x1b[90m╚${border}╝\x1b[0m`);

  return lines.join('\n');
}
