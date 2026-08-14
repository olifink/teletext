import { BaseProvider } from './base-provider';
import { ZDFProvider } from './zdf-provider';
import type { TeletextPage } from '../models/page';
import type { BroadcasterInfo, ProviderRequestOptions } from '../models/provider';

export class DreisatProvider extends BaseProvider {
  public readonly id = '3sat';
  public readonly info: BroadcasterInfo = {
    id: '3sat',
    name: '3sat Text',
    shortName: '3sat',
    description: '3sat Text – Kultur, Wissenschaft, Nachrichten und Dokumentationen aus D-A-CH',
    primaryColor: '#D90000',
    defaultPage: 100,
    featuredPages: [
      { page: 100, label: 'Startseite / Übersicht', category: 'News' },
      { page: 101, label: 'Inhaltsverzeichnis', category: 'Index' },
      { page: 110, label: 'Kultur-Nachrichten', category: 'Culture' },
      { page: 120, label: 'Wissenschaft & Umwelt', category: 'Science' },
      { page: 130, label: 'Nachrichten & Politik', category: 'News' },
      { page: 170, label: 'Wetter 3sat-Länder (D-A-CH)', category: 'Weather' },
      { page: 300, label: '3sat TV-Programm heute', category: 'TV' },
      { page: 400, label: 'Kulturzeit Magazin', category: 'Culture' },
      { page: 420, label: 'nano Magazin', category: 'Science' },
    ],
    supported: true,
  };

  private zdfHelper = new ZDFProvider();

  protected async fetchAndParse(
    pageNumber: number,
    subPage: number,
    _options: ProviderRequestOptions
  ): Promise<TeletextPage> {
    const pageParam = subPage > 1 ? `${pageNumber}_${subPage}` : `${pageNumber}`;
    const url = `https://teletext.zdf.de/teletext/3sat/seiten/klassisch/${pageParam}.html`;
    const html = await this.fetchHtml(url);

    return this.zdfHelper.parseZdfClassicHtml(html, pageNumber, subPage, this.id, this.info.name);
  }
}
