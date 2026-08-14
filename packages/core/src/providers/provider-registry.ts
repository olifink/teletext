import { ARDProvider } from './ard-provider';
import { DreisatProvider } from './dreisat-provider';
import { HRProvider } from './hr-provider';
import { WDRProvider } from './wdr-provider';
import { ZDFProvider } from './zdf-provider';
import type { TeletextPage } from '../models/page';
import {
  type BroadcasterInfo,
  type ITeletextProvider,
  type ProviderRequestOptions,
  TeletextError,
} from '../models/provider';

export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers = new Map<string, ITeletextProvider>();

  private constructor() {
    this.register(new ARDProvider());
    this.register(new ZDFProvider());
    this.register(new DreisatProvider());
    this.register(new WDRProvider());
    this.register(new HRProvider());
  }

  public static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  public register(provider: ITeletextProvider): void {
    this.providers.set(provider.id.toLowerCase(), provider);
  }

  public getProvider(channelId: string): ITeletextProvider {
    const provider = this.providers.get(channelId.toLowerCase());
    if (!provider) {
      const supported = Array.from(this.providers.keys()).join(', ');
      throw new TeletextError(
        `Unknown Teletext provider: '${channelId}'. Supported providers are: ${supported}`,
        'INVALID_PAGE',
        channelId,
        0
      );
    }
    return provider;
  }

  public hasProvider(channelId: string): boolean {
    return this.providers.has(channelId.toLowerCase());
  }

  public listProviders(): BroadcasterInfo[] {
    return Array.from(this.providers.values()).map(p => p.info);
  }

  public async getPage(
    channelId: string,
    pageNumber: number,
    options?: ProviderRequestOptions
  ): Promise<TeletextPage> {
    const provider = this.getProvider(channelId);
    return provider.getPage(pageNumber, options);
  }
}

/**
 * Top-level convenience function
 */
export async function getTeletextPage(
  channel: string,
  pageNumber: number,
  options?: ProviderRequestOptions
): Promise<TeletextPage> {
  return ProviderRegistry.getInstance().getPage(channel, pageNumber, options);
}

export function listSupportedChannels(): BroadcasterInfo[] {
  return ProviderRegistry.getInstance().listProviders();
}
