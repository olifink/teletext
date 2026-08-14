import { describe, expect, it } from 'bun:test';
import { ProviderRegistry, getTeletextPage, listSupportedChannels } from '../src/providers/provider-registry';
import { ARDProvider } from '../src/providers/ard-provider';
import { ZDFProvider } from '../src/providers/zdf-provider';
import { DreisatProvider } from '../src/providers/dreisat-provider';
import { WDRProvider } from '../src/providers/wdr-provider';
import { HRProvider } from '../src/providers/hr-provider';
import { TELETEXT_COLUMNS, TELETEXT_ROWS } from '../src/models/page';

describe('Provider Registry', () => {
  it('registers and lists all 5 core broadcasters', () => {
    const channels = listSupportedChannels();
    const ids = channels.map(c => c.id);
    expect(ids).toContain('ard');
    expect(ids).toContain('zdf');
    expect(ids).toContain('3sat');
    expect(ids).toContain('wdr');
    expect(ids).toContain('hr');
  });

  it('retrieves individual providers correctly', () => {
    const registry = ProviderRegistry.getInstance();
    expect(registry.getProvider('ard')).toBeInstanceOf(ARDProvider);
    expect(registry.getProvider('zdf')).toBeInstanceOf(ZDFProvider);
    expect(registry.getProvider('3sat')).toBeInstanceOf(DreisatProvider);
    expect(registry.getProvider('wdr')).toBeInstanceOf(WDRProvider);
    expect(registry.getProvider('hr')).toBeInstanceOf(HRProvider);
  });

  it('throws for unknown providers', () => {
    const registry = ProviderRegistry.getInstance();
    expect(() => registry.getProvider('invalid_channel')).toThrow();
  });
});

describe('Live Broadcaster Scrapers', () => {
  it('fetches and normalizes ARD Text Page 100', async () => {
    const page = await getTeletextPage('ard', 100);
    expect(page.channel).toBe('ard');
    expect(page.pageNumber).toBe(100);
    expect(page.grid.length).toBe(TELETEXT_ROWS);
    expect(page.grid[0].length).toBe(TELETEXT_COLUMNS);
    expect(page.title.length).toBeGreaterThan(0);
  }, 10000);

  it('fetches and normalizes ZDF Text Page 100', async () => {
    const page = await getTeletextPage('zdf', 100);
    expect(page.channel).toBe('zdf');
    expect(page.pageNumber).toBe(100);
    expect(page.grid.length).toBe(TELETEXT_ROWS);
    expect(page.grid[0].length).toBe(TELETEXT_COLUMNS);
    expect(page.title.length).toBeGreaterThan(0);
  }, 10000);

  it('fetches and normalizes WDR Text Page 100', async () => {
    const page = await getTeletextPage('wdr', 100);
    expect(page.channel).toBe('wdr');
    expect(page.pageNumber).toBe(100);
    expect(page.grid.length).toBe(TELETEXT_ROWS);
    expect(page.grid[0].length).toBe(TELETEXT_COLUMNS);
  }, 10000);

  it('fetches and normalizes HR Text Page 100', async () => {
    const page = await getTeletextPage('hr', 100);
    expect(page.channel).toBe('hr');
    expect(page.pageNumber).toBe(100);
    expect(page.grid.length).toBe(TELETEXT_ROWS);
    expect(page.grid[0].length).toBe(TELETEXT_COLUMNS);
  }, 10000);
});
