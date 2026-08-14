import { BaseProvider } from './base-provider';
import type { TeletextCell } from '../models/cell';
import { createCell, createEmptyCell } from '../models/cell';
import { normalizeTeletextColor } from '../models/colors';
import { TELETEXT_COLUMNS, TELETEXT_ROWS, type TeletextPage } from '../models/page';
import type { BroadcasterInfo, ProviderRequestOptions } from '../models/provider';
import { decodeHtmlEntities, stripHtmlTags } from '../parser/html-sanitizer';
import { zdfLineDrawToChar } from '../parser/mosaic';
import { parsePageNumber } from '../parser/link-extractor';

export class ZDFProvider extends BaseProvider {
  public readonly id = 'zdf';
  public readonly info: BroadcasterInfo = {
    id: 'zdf',
    name: 'ZDF Text',
    shortName: 'ZDF',
    description: 'ZDFtext – schnell und umfassend informiert: Nachrichten, heute, Sport, Programminfos',
    primaryColor: '#FA7D00',
    defaultPage: 100,
    featuredPages: [
      { page: 100, label: 'Startseite / Übersicht', category: 'News' },
      { page: 101, label: 'Inhaltsverzeichnis (A–Z)', category: 'Index' },
      { page: 111, label: 'Nachrichten-Schlagzeilen', category: 'News' },
      { page: 112, label: 'Nachrichten Übersicht I', category: 'News' },
      { page: 120, label: 'heute – Top-Meldung', category: 'News' },
      { page: 131, label: 'Wetter heute / Aussichten', category: 'Weather' },
      { page: 200, label: 'Sport Übersicht', category: 'Sports' },
      { page: 201, label: 'Sport aktuell', category: 'Sports' },
      { page: 250, label: 'Fußball-Bundesliga', category: 'Sports' },
      { page: 300, label: 'ZDF TV-Programm heute', category: 'TV' },
      { page: 555, label: 'Lotto & Gewinnzahlen', category: 'Service' },
      { page: 710, label: 'ZDFinfo Programmvorschau', category: 'TV' },
      { page: 715, label: 'ZDFneo Programmvorschau', category: 'TV' },
    ],
    supported: true,
  };

  protected async fetchAndParse(
    pageNumber: number,
    subPage: number,
    _options: ProviderRequestOptions
  ): Promise<TeletextPage> {
    const pageParam = subPage > 1 ? `${pageNumber}_${subPage}` : `${pageNumber}`;
    const url = `https://teletext.zdf.de/teletext/zdf/seiten/klassisch/${pageParam}.html`;
    const html = await this.fetchHtml(url);

    return this.parseZdfClassicHtml(html, pageNumber, subPage, this.id, this.info.name);
  }

  public parseZdfClassicHtml(
    html: string,
    pageNumber: number,
    subPage: number,
    channelId: string,
    channelName: string
  ): TeletextPage {
    // 1. Metadata from body attributes
    let subPageCount = 1;
    let prevPage: number | undefined;
    let nextPage: number | undefined;

    const bodyMatch = html.match(/<body([^>]*)>/i);
    if (bodyMatch) {
      const attrs = bodyMatch[1];
      const subMatch = attrs.match(/subpages=["'](\d+)["']/i);
      if (subMatch) subPageCount = parseInt(subMatch[1], 10) || 1;

      const prevMatch = attrs.match(/prevpg=["'](\d+)["']/i);
      if (prevMatch) prevPage = parseInt(prevMatch[1], 10);

      const nextMatch = attrs.match(/nextpg=["'](\d+)["']/i);
      if (nextMatch) nextPage = parseInt(nextMatch[1], 10);
    }

    // 2. Extract rows
    const grid: TeletextCell[][] = [];

    // Row 0: headline
    const headlineMatch = html.match(/<div id=["']headline["'][^>]*>([\s\S]*?)<\/div>/i);
    if (headlineMatch) {
      grid.push(this.parseZdfRowSpans(headlineMatch[1]));
    }

    // Rows 1..23: row_0 through row_22
    for (let r = 0; r < 23; r++) {
      const rowMatch = html.match(new RegExp(`<div id=["']row_${r}["'][^>]*>([\\s\\S]*?)<\\/div>`, 'i'));
      if (rowMatch) {
        grid.push(this.parseZdfRowSpans(rowMatch[1]));
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
    let title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : `${channelName} Seite ${pageNumber}`;
    title = title.replace(/\s+/g, ' ');

    if (grid[1]) {
      const row1Text = grid[1].map(c => c.char).join('').trim();
      if (row1Text.length > 2 && !row1Text.startsWith('---')) {
        title = row1Text;
      }
    }

    return {
      channel: channelId,
      channelName: channelName,
      pageNumber,
      subPage,
      subPageCount,
      title,
      timestamp: new Date().toISOString(),
      grid,
      rawText: '',
      links: [],
      prevPage,
      nextPage,
    };
  }

  private parseZdfRowSpans(rowHtml: string): TeletextCell[] {
    const row: TeletextCell[] = [];
    const spanRegex = /<span([^>]*)>([\s\S]*?)<\/span>/gi;
    let match: RegExpExecArray | null;

    while ((match = spanRegex.exec(rowHtml)) !== null) {
      const attrStr = match[1];
      const rawContent = match[2];

      const fgMatch = attrStr.match(/c([0-9a-fA-F]{6})/i);
      const bgMatch = attrStr.match(/bc([0-9a-fA-F]{6})/i);
      const isLineDraw = /teletextlinedraw/i.test(attrStr);

      const fg = normalizeTeletextColor(fgMatch ? fgMatch[1] : 'FFFFFF', 'white');
      const bg = normalizeTeletextColor(bgMatch ? bgMatch[1] : '000000', 'black');

      // Tokenize <a> tags vs text
      const tokenRegex = /(<a[^>]*>([\s\S]*?)<\/a>)|([^<]+)|(<[^>]+>)/gi;
      let tokenMatch: RegExpExecArray | null;

      while ((tokenMatch = tokenRegex.exec(rawContent)) !== null) {
        if (tokenMatch[1]) {
          // <a ...>...</a>
          const aTag = tokenMatch[1];
          const innerText = decodeHtmlEntities(stripHtmlTags(tokenMatch[2] || ''));
          const linkPage = parsePageNumber(innerText) || parsePageNumber(aTag.match(/(\d{3})\.html/i)?.[1]);

          for (const ch of innerText) {
            if (isLineDraw) {
              row.push({
                char: zdfLineDrawToChar(ch),
                fg,
                bg,
                isGraphic: true,
                link: linkPage || undefined,
              });
            } else {
              row.push(createCell(ch, fg, bg, linkPage || undefined));
            }
          }
        } else if (tokenMatch[3]) {
          // Plain text
          const text = decodeHtmlEntities(tokenMatch[3].replace(/<br\s*\/?>/gi, ''));
          for (const ch of text) {
            if (isLineDraw) {
              row.push({
                char: zdfLineDrawToChar(ch),
                fg,
                bg,
                isGraphic: true,
              });
            } else {
              row.push(createCell(ch, fg, bg));
            }
          }
        }
      }
    }

    // Pad or trim to 40 columns
    while (row.length < TELETEXT_COLUMNS) {
      row.push(createEmptyCell('white', 'black'));
    }

    return row.slice(0, TELETEXT_COLUMNS);
  }
}
