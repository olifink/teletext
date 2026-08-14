import { BaseProvider } from './base-provider';
import type { TeletextCell } from '../models/cell';
import { createCell, createEmptyCell } from '../models/cell';
import { normalizeTeletextColor } from '../models/colors';
import { TELETEXT_COLUMNS, TELETEXT_ROWS, type TeletextPage } from '../models/page';
import type { BroadcasterInfo, ProviderRequestOptions } from '../models/provider';
import { decodeHtmlEntities, stripHtmlTags } from '../parser/html-sanitizer';
import { hrGraphicToChar } from '../parser/mosaic';

export class HRProvider extends BaseProvider {
  public readonly id = 'hr';
  public readonly info: BroadcasterInfo = {
    id: 'hr',
    name: 'HR Text (Hessischer Rundfunk)',
    shortName: 'HR',
    description: 'hr-text – Das Videotext-Angebot des Hessischen Rundfunks: Hessen-News, Wetter, Sport',
    primaryColor: '#005599',
    defaultPage: 100,
    featuredPages: [
      { page: 100, label: 'Startseite / Übersicht', category: 'News' },
      { page: 101, label: 'Hessen-Nachrichten aktuell', category: 'News' },
      { page: 102, label: 'Hessen kompakt', category: 'News' },
      { page: 170, label: 'Das Wetter in Hessen', category: 'Weather' },
      { page: 175, label: 'Biowetter / Pollenflug', category: 'Weather' },
      { page: 200, label: 'Sport aus Hessen', category: 'Sports' },
      { page: 250, label: 'Eintracht Frankfurt / SVWW', category: 'Sports' },
      { page: 300, label: 'hr-fernsehen Programm', category: 'TV' },
    ],
    supported: true,
  };

  protected async fetchAndParse(
    pageNumber: number,
    subPage: number,
    _options: ProviderRequestOptions
  ): Promise<TeletextPage> {
    const url = `https://www.hr-text.de/index.php?page=${pageNumber}${subPage > 1 ? `&sub=${subPage}` : ''}`;
    const html = await this.fetchHtml(url);

    // 1. Parse metadata from HR <pre> tags
    const numSubpagesMatch = html.match(/<pre id=["']ttxNumSubpages["'][^>]*>(\d+)<\/pre>/i);
    const subPageCount = numSubpagesMatch ? parseInt(numSubpagesMatch[1], 10) || 1 : 1;

    const prevMatch = html.match(/<pre id=["']ttxPrevPageNum["'][^>]*>(\d+)<\/pre>/i);
    const prevPage = prevMatch ? parseInt(prevMatch[1], 10) : undefined;

    const nextMatch = html.match(/<pre id=["']ttxNextPageNum["'][^>]*>(\d+)<\/pre>/i);
    const nextPage = nextMatch ? parseInt(nextMatch[1], 10) : undefined;

    const timeMatch = html.match(/<pre id=["']ttxFileTimestamp["'][^>]*>([^<]*)<\/pre>/i);
    const timestamp = timeMatch ? timeMatch[1].trim() : new Date().toISOString();

    // 2. Parse rows #row0 through #row23
    const grid: TeletextCell[][] = [];

    for (let r = 0; r < TELETEXT_ROWS; r++) {
      const rowMatch = html.match(new RegExp(`<pre class=["']ttxRow["'] id=["']row${r}["'][^>]*>([\\s\\S]*?)<\\/pre>`, 'i'));
      if (rowMatch) {
        grid.push(this.parseHrRow(rowMatch[1]));
      } else {
        const emptyRow: TeletextCell[] = [];
        for (let c = 0; c < TELETEXT_COLUMNS; c++) emptyRow.push(createEmptyCell('white', 'black'));
        grid.push(emptyRow);
      }
    }

    // 3. Extract title
    const titleMatch = html.match(/<pre id=["']ttxPageTitle["'][^>]*>([^<]*)<\/pre>/i) || html.match(/<title>([^<]*)<\/title>/i);
    let title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : `HR Text Seite ${pageNumber}`;
    title = title.replace(/%page%/g, String(pageNumber)).replace(/%sub%/g, String(subPage)).replace(/\s+/g, ' ');

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
      timestamp,
      grid,
      rawText: '',
      links: [],
      prevPage,
      nextPage,
    };
  }

  private parseHrRow(rowHtml: string): TeletextCell[] {
    const row: TeletextCell[] = [];
    const spanRegex = /<span class=["']([^"']*)["'][^>]*>([\s\S]*?)<\/span>/gi;
    let match: RegExpExecArray | null;

    // Default row state
    let curFg = normalizeTeletextColor('7', 'white');
    let curBg = normalizeTeletextColor('0', 'black');

    while ((match = spanRegex.exec(rowHtml)) !== null) {
      const classes = match[1].split(/\s+/);
      const innerHtml = match[2];

      for (const cls of classes) {
        if (/^fg[0-7]$/i.test(cls)) {
          curFg = normalizeTeletextColor(cls.substring(2), 'white');
        } else if (/^bg[0-7]$/i.test(cls)) {
          curBg = normalizeTeletextColor(cls.substring(2), 'black');
        }
      }

      // Check if this span is a mosaic block graphics class
      const graphicClass = classes.find(c => /^g1c/i.test(c));
      if (graphicClass) {
        const mosaic = hrGraphicToChar(graphicClass);
        row.push({
          char: mosaic,
          fg: curFg,
          bg: curBg,
          isGraphic: true,
        });
      } else {
        // Text characters
        const text = decodeHtmlEntities(innerHtml.replace(/<[^>]*>/g, ''));
        for (const ch of text) {
          row.push(createCell(ch, curFg, curBg));
        }
      }
    }

    // Fallback if no spans were matched (e.g. raw text)
    if (row.length === 0) {
      const rawText = decodeHtmlEntities(stripHtmlTags(rowHtml));
      for (const ch of rawText) {
        row.push(createCell(ch, 'white', 'black'));
      }
    }

    while (row.length < TELETEXT_COLUMNS) {
      row.push(createEmptyCell('white', 'black'));
    }

    return row.slice(0, TELETEXT_COLUMNS);
  }
}
