#!/usr/bin/env bun
import { getTeletextPage, listSupportedChannels } from '../providers/provider-registry';
import { renderToAnsi } from './terminal-renderer';

function printHelp(): void {
  console.log(`
\x1b[1;36mTeletext CLI Tool\x1b[0m - Fetch & Inspect German Videotext Services

\x1b[1mUsage:\x1b[0m
  bun cli <channel> <page> [options]

\x1b[1mChannels:\x1b[0m
  ard       ARD Text (Das Erste)
  zdf       ZDF Text
  3sat      3sat Text
  wdr       WDR Text
  hr        HR Text (Hessischer Rundfunk)

\x1b[1mOptions:\x1b[0m
  --sub <num>       Fetch specific subpage index (default: 1)
  --json            Output pure JSON schema
  --raw             Output plain text without ANSI colors
  --refresh         Bypass cache and force refresh from network
  --channels        List all available channels and featured pages
  --help, -h        Show this help screen

\x1b[1mExamples:\x1b[0m
  bun cli ard 100
  bun cli zdf 112
  bun cli wdr 100 --json
  bun cli hr 100
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('--channels')) {
    const channels = listSupportedChannels();
    console.log('\n\x1b[1;32mSupported Broadcaster Channels:\x1b[0m\n');
    for (const ch of channels) {
      console.log(`  \x1b[1m${ch.id.padEnd(8)}\x1b[0m ${ch.name} (${ch.description})`);
      console.log(`    Featured: ${ch.featuredPages.map(p => `${p.page}: ${p.label}`).join(', ')}\n`);
    }
    process.exit(0);
  }

  const channel = args[0];
  const pageArg = args[1] || '100';
  const pageNum = parseInt(pageArg, 10);

  if (isNaN(pageNum) || pageNum < 100 || pageNum > 899) {
    console.error(`\x1b[31mError:\x1b[0m Invalid page number: "${pageArg}". Must be between 100 and 899.`);
    process.exit(1);
  }

  let subPage = 1;
  const subIdx = args.indexOf('--sub');
  if (subIdx !== -1 && args[subIdx + 1]) {
    subPage = parseInt(args[subIdx + 1], 10) || 1;
  }

  const isJson = args.includes('--json');
  const isRaw = args.includes('--raw');
  const forceRefresh = args.includes('--refresh');

  try {
    const page = await getTeletextPage(channel, pageNum, { subPage, forceRefresh });

    if (isJson) {
      console.log(JSON.stringify(page, null, 2));
    } else if (isRaw) {
      console.log(page.rawText);
    } else {
      console.log(renderToAnsi(page));
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n\x1b[31mTeletext Error:\x1b[0m ${msg}\n`);
    process.exit(1);
  }
}

main();
