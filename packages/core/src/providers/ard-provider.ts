import { BaseProvider } from './base-provider';
import type { TeletextCell } from '../models/cell';
import { createCell, createEmptyCell } from '../models/cell';
import { normalizeTeletextColor } from '../models/colors';
import { TELETEXT_COLUMNS, TELETEXT_ROWS, type TeletextPage } from '../models/page';
import type { BroadcasterInfo, ProviderRequestOptions } from '../models/provider';
import { decodeHtmlEntities, stripHtmlTags } from '../parser/html-sanitizer';
import { ardGraphicToCharAndMask } from '../parser/mosaic';
import { parsePageNumber } from '../parser/link-extractor';

export class ARDProvider extends BaseProvider {
  public readonly id = 'ard';
  public readonly info: BroadcasterInfo = {
    id: 'ard',
    name: 'ARD Text (Das Erste)',
    shortName: 'ARD',
    description: 'Der Teletext im Ersten – Nachrichten der tagesschau, Sport, Programminformationen',
    primaryColor: '#002B5C',
    defaultPage: 100,
    featuredPages: [
      { page: 100, label: 'Startseite / Schlagzeilen', category: 'News' },
      { page: 101, label: 'tagesschau Übersicht I', category: 'News' },
      { page: 102, label: 'tagesschau Übersicht II', category: 'News' },
      { page: 110, label: 'Inland', category: 'News' },
      { page: 120, label: 'Ausland', category: 'News' },
      { page: 135, label: 'Aus aller Welt', category: 'News' },
      { page: 155, label: 'Wirtschaft', category: 'Economy' },
      { page: 170, label: 'Wetter', category: 'Weather' },
      { page: 200, label: 'Sport I (Aktuell)', category: 'Sports' },
      { page: 250, label: 'Fußball Bundesliga', category: 'Sports' },
      { page: 300, label: 'TV-Programm Das Erste', category: 'TV' },
      { page: 400, label: 'Kultur & Medien', category: 'Culture' },
      { page: 870, label: 'Nachrichten leicht', category: 'News' },
    ],
    supported: true,
  };

  protected async fetchAndParse(
    pageNumber: number,
    subPage: number,
    _options: ProviderRequestOptions
  ): Promise<TeletextPage> {
    const url = `https://www.ard-text.de/index.php?page=${pageNumber}${subPage > 1 ? `&sub=${subPage}` : ''}`;
    const html = await this.fetchHtml(url);

    // 1. Check if page exists in ARD classic container
    const classicMatch = html.match(/<div id=["']ardtext_classic["']>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i);
    if (!classicMatch) {
      return this.parseMobileFallback(html, pageNumber, subPage);
    }

    const classicHtml = classicMatch[1];

    // 2. Parse subpages
    let subPageCount = 1;
    const subCounterMatch = html.match(/class=["']subpageCounter["'][^>]*>(\d+)\/(\d+)<\/div>/i);
    if (subCounterMatch) {
      subPageCount = parseInt(subCounterMatch[2], 10) || 1;
    }

    // 3. Extract rows from #ardtext_classic
    const lineDivs = classicHtml.match(/<div>([\s\S]*?)<\/div>/gi) || [];
    const grid: TeletextCell[][] = [];

    for (let r = 0; r < Math.min(TELETEXT_ROWS, lineDivs.length); r++) {
      const lineHtml = lineDivs[r];
      const row: TeletextCell[] = [];

      // Find all spans in this line
      const spanRegex = /<span class=['"]([^'"]*)['"][^>]*>([\s\S]*?)<\/span>/gi;
      let spanMatch: RegExpExecArray | null;

      while ((spanMatch = spanRegex.exec(lineHtml)) !== null) {
        const classNames = spanMatch[1].split(/\s+/);
        let fgClass = 'white';
        let bgClass = 'black';

        for (const cls of classNames) {
          if (cls.startsWith('fg')) fgClass = cls;
          else if (cls.startsWith('bg')) bgClass = cls;
        }

        const fg = normalizeTeletextColor(fgClass, 'white');
        const bg = normalizeTeletextColor(bgClass, 'black');
        let content = spanMatch[2];

        // Clean <nobr> wrapper if present
        content = content.replace(/<\/?nobr>/gi, '');

        // Process token by token: text, <img>, <a>...</a>
        // Tokenizer regex: matches <img>, <a> tags, </a> tags, or text
        const tokenRegex = /(<img[^>]*src=['"]([^'"]*)['"][^>]*>)|(<a[^>]*>([\s\S]*?)<\/a>)|([^<]+)|(<[^>]+>)/gi;
        let tokenMatch: RegExpExecArray | null;

        while ((tokenMatch = tokenRegex.exec(content)) !== null) {
          if (tokenMatch[1]) {
            // <img src="...">
            const imgSrc = tokenMatch[2];
            const { char: mosaicChar, mask } = ardGraphicToCharAndMask(imgSrc);
            row.push({
              char: mosaicChar,
              fg,
              bg,
              isGraphic: true,
              mosaicMask: mask,
            });
          } else if (tokenMatch[3]) {
            // <a ...>...</a>
            const aTag = tokenMatch[3];
            const innerText = decodeHtmlEntities(stripHtmlTags(tokenMatch[4] || ''));
            const linkPage = parsePageNumber(innerText) || parsePageNumber(aTag.match(/page[=\/](\d{3})/i)?.[1]);

            for (const ch of innerText) {
              row.push(createCell(ch, fg, bg, linkPage || undefined));
            }
          } else if (tokenMatch[5]) {
            // Plain text
            const text = decodeHtmlEntities(tokenMatch[5]);
            for (const ch of text) {
              row.push(createCell(ch, fg, bg));
            }
          }
        }
      }

      // Pad row to 40 columns
      while (row.length < TELETEXT_COLUMNS) {
        row.push(createEmptyCell('white', 'black'));
      }

      grid.push(row.slice(0, TELETEXT_COLUMNS));
    }

    // Pad missing rows to 24
    while (grid.length < TELETEXT_ROWS) {
      const emptyRow: TeletextCell[] = [];
      for (let c = 0; c < TELETEXT_COLUMNS; c++) {
        emptyRow.push(createEmptyCell('white', 'black'));
      }
      grid.push(emptyRow);
    }

    // Page title
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    let title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : `ARD Text Seite ${pageNumber}`;
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

  private parseMobileFallback(html: string, pageNumber: number, subPage: number): TeletextPage {
    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? stripHtmlTags(titleMatch[1]).trim() : `ARD Text Seite ${pageNumber}`;

    const grid: TeletextCell[][] = [];

    // Header row
    const headerRow: TeletextCell[] = [];
    for (let c = 0; c < TELETEXT_COLUMNS; c++) headerRow.push(createEmptyCell('white', 'black'));
    const hText = ` ${pageNumber}   ARD Text   ${new Date().toISOString().substring(11, 19)}`;
    for (let i = 0; i < Math.min(TELETEXT_COLUMNS, hText.length); i++) {
      headerRow[i] = createCell(hText[i], 'yellow', 'black');
    }
    grid.push(headerRow);

    // Title row
    const titleRow: TeletextCell[] = [];
    for (let c = 0; c < TELETEXT_COLUMNS; c++) titleRow.push(createEmptyCell('white', 'black'));
    const tText = ` ${title.substring(0, 38)}`;
    for (let i = 0; i < tText.length; i++) {
      titleRow[i] = createCell(tText[i], 'cyan', 'black');
    }
    grid.push(titleRow);

    // Parse list items
    const items = html.match(/<td class="text">([\s\S]*?)<\/td>\s*<td class="number">([\s\S]*?)<\/td>/gi) || [];
    let curRowIdx = 2;

    for (const item of items) {
      if (curRowIdx >= 23) break;
      const textMatch = item.match(/<td class="text">([\s\S]*?)<\/td>/i);
      const numMatch = item.match(/<td class="number">([\s\S]*?)<\/td>/i);
      const text = textMatch ? stripHtmlTags(textMatch[1]).trim() : '';
      const num = numMatch ? stripHtmlTags(numMatch[1]).trim() : '';

      const row: TeletextCell[] = [];
      for (let c = 0; c < TELETEXT_COLUMNS; c++) row.push(createEmptyCell('white', 'black'));

      const lineStr = ` ${text.substring(0, 32).padEnd(33)} ${num}`;
      for (let i = 0; i < Math.min(TELETEXT_COLUMNS, lineStr.length); i++) {
        row[i] = createCell(lineStr[i], 'white', 'black');
      }
      grid.push(row);
      curRowIdx++;
    }

    while (grid.length < TELETEXT_ROWS) {
      const emptyRow: TeletextCell[] = [];
      for (let c = 0; c < TELETEXT_COLUMNS; c++) emptyRow.push(createEmptyCell('white', 'black'));
      grid.push(emptyRow);
    }

    return {
      channel: this.id,
      channelName: this.info.name,
      pageNumber,
      subPage,
      subPageCount: 1,
      title,
      timestamp: new Date().toISOString(),
      grid,
      rawText: '',
      links: [],
    };
  }
}
