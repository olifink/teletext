import { BaseProvider } from './base-provider';
import type { TeletextCell } from '../models/cell';
import { createCell, createEmptyCell } from '../models/cell';
import { normalizeTeletextColor } from '../models/colors';
import { TELETEXT_COLUMNS, TELETEXT_ROWS, type TeletextPage } from '../models/page';
import type { BroadcasterInfo, ProviderRequestOptions } from '../models/provider';
import { decodeHtmlEntities, stripHtmlTags } from '../parser/html-sanitizer';

export class WDRProvider extends BaseProvider {
  public readonly id = 'wdr';
  public readonly info: BroadcasterInfo = {
    id: 'wdr',
    name: 'WDR Text',
    shortName: 'WDR',
    description: 'WDR Text – Aktuelle Nachrichten für NRW, Sport, Wetter und WDR-Fernsehen',
    primaryColor: '#003366',
    defaultPage: 100,
    featuredPages: [
      { page: 100, label: 'Startseite / Schlagzeilen', category: 'News' },
      { page: 101, label: 'Nachrichten Übersicht', category: 'News' },
      { page: 110, label: 'NRW Kompakt', category: 'News' },
      { page: 160, label: 'Wirtschaft NRW', category: 'Economy' },
      { page: 170, label: 'Wetter in NRW', category: 'Weather' },
      { page: 180, label: 'Verkehrslage NRW / Stau', category: 'Service' },
      { page: 200, label: 'Sport aktuell', category: 'Sports' },
      { page: 250, label: '1. Bundesliga', category: 'Sports' },
      { page: 300, label: 'WDR Fernsehen heute', category: 'TV' },
      { page: 500, label: 'Service & Ratgeber', category: 'Service' },
    ],
    supported: true,
  };

  protected async fetchAndParse(
    pageNumber: number,
    subPage: number,
    _options: ProviderRequestOptions
  ): Promise<TeletextPage> {
    const url = `https://mobiltext.wdr.de/${pageNumber}.html`;
    const html = await this.fetchHtml(url);

    // 1. Subpage count from script or metadata
    let subPageCount = 1;
    const countMatch = html.match(/var\s+page_count\s*=\s*(\d+)/i);
    if (countMatch) {
      subPageCount = parseInt(countMatch[1], 10) || 1;
    }

    // 2. Extract rows
    const grid: TeletextCell[][] = [];

    // Header info row: #vt_row_info
    const headerMatch = html.match(/<div class="vt_row[^"]*" id="vt_row_info">([\s\S]*?)<\/div>(?=\s*<!--googleon|\s*<div)/i);
    if (headerMatch) {
      grid.push(this.parseWdrColumns(headerMatch[1]));
    }

    // Content rows: #vt_row_1 through #vt_row_23
    for (let r = 1; r <= 23; r++) {
      const rowMatch = html.match(new RegExp(`<div class="vt_row[^"]*" id="vt_row_${r}">([\\s\\S]*?)<\\/div>(?=\\s*<div class="vt_row"|\\s*<\\/div>\\s*<\\/div>|\\s*<div class="vt_footer")`, 'i'));
      if (rowMatch) {
        grid.push(this.parseWdrColumns(rowMatch[1]));
      } else {
        const emptyRow: TeletextCell[] = [];
        for (let c = 0; c < TELETEXT_COLUMNS; c++) emptyRow.push(createEmptyCell('white', 'black'));
        grid.push(emptyRow);
      }
    }

    // Ensure 24 rows
    while (grid.length < TELETEXT_ROWS) {
      const emptyRow: TeletextCell[] = [];
      for (let c = 0; c < TELETEXT_COLUMNS; c++) emptyRow.push(createEmptyCell('white', 'black'));
      grid.push(emptyRow);
    }

    // 3. Extract title
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    let title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : `WDR Text Seite ${pageNumber}`;
    title = title.replace(/\s+/g, ' ');

    if (grid[1]) {
      const row1Text = grid[1].map(c => c.char).join('').trim();
      if (row1Text.length > 3 && !row1Text.startsWith('---')) {
        title = row1Text;
      }
    }

    return {
      channel: this.id,
      channelName: this.info.name,
      pageNumber,
      subPage,
      subPageCount,
      title,
      timestamp: new Date().toISOString(),
      grid,
      rawText: '',
      links: [],
      prevPage: pageNumber > 100 ? pageNumber - 1 : 899,
      nextPage: pageNumber < 899 ? pageNumber + 1 : 100,
    };
  }

  private parseWdrColumns(rowHtml: string): TeletextCell[] {
    const row: TeletextCell[] = [];
    const colRegex = /<div class="([^"]*vt_col[^"]*)"[^>]*>([\s\S]*?)<\/div>/gi;
    let match: RegExpExecArray | null;

    while ((match = colRegex.exec(rowHtml)) !== null) {
      const classAttr = match[1];
      const colContent = match[2];

      // Extract width from colN (e.g. col2, col4, col10)
      const widthMatch = classAttr.match(/\bcol(\d+)\b/i);
      const expectedWidth = widthMatch ? parseInt(widthMatch[1], 10) : 1;

      // Extract background and foreground
      const bgMatch = classAttr.match(/\bbg_([a-zA-Z]+)\b/i);
      const fgClasses = classAttr.split(/\s+/).filter(c => !c.startsWith('bg_') && !c.startsWith('col') && c !== 'vt_col');
      const fgName = fgClasses[0] || 'white';

      const bg = normalizeTeletextColor(bgMatch ? bgMatch[1] : 'black', 'black');
      const fg = normalizeTeletextColor(fgName, 'white');

      // Strip inner span and decode text
      let text = stripHtmlTags(colContent);
      text = text.replace(/[\r\n\t]+/g, ' ');

      // Pad or format to column width
      if (text.length < expectedWidth) {
        text = text.padEnd(expectedWidth, ' ');
      } else if (text.length > expectedWidth) {
        text = text.substring(0, expectedWidth);
      }

      for (const ch of text) {
        row.push(createCell(ch, fg, bg));
      }
    }

    // Pad or trim to 40 columns
    while (row.length < TELETEXT_COLUMNS) {
      row.push(createEmptyCell('white', 'black'));
    }

    return row.slice(0, TELETEXT_COLUMNS);
  }
}
