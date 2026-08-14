import { join } from 'node:path';
import { existsSync, statSync } from 'node:fs';
import { getTeletextPage, listSupportedChannels } from '../providers/provider-registry';
import { TeletextError } from '../models/provider';

const PORT = parseInt(process.env.PORT || '3000', 10);

// Find static directory
const candidateDirs = [
  process.env.STATIC_DIR,
  join(process.cwd(), 'packages/viewer/dist/viewer/browser'),
  join(process.cwd(), 'dist/viewer/browser'),
  join(__dirname, '../../../packages/viewer/dist/viewer/browser'),
  join(__dirname, '../../viewer/dist/viewer/browser'),
  '/app/dist/viewer/browser',
].filter(Boolean) as string[];

const STATIC_DIR = candidateDirs.find(d => existsSync(d)) || null;

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, If-None-Match',
};

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/api/health' || url.pathname === '/health') {
      return Response.json(
        { status: 'ok', time: new Date().toISOString(), version: '1.0.0' },
        { headers: { ...corsHeaders, 'Cache-Control': 'no-cache' } }
      );
    }

    // List channels
    if (url.pathname === '/api/channels') {
      const channels = listSupportedChannels();
      return Response.json(
        { channels },
        {
          headers: {
            ...corsHeaders,
            'Cache-Control': 'public, max-age=3600',
          },
        }
      );
    }

    // Page endpoint: /api/page/:channel/:pageNumber
    const pageMatch = url.pathname.match(/^\/api\/page\/([a-zA-Z0-9_-]+)\/(\d+)$/);
    if (pageMatch) {
      const channel = pageMatch[1];
      const pageNumber = parseInt(pageMatch[2], 10);
      const subPage = parseInt(url.searchParams.get('sub') || '1', 10);
      const forceRefresh = url.searchParams.get('refresh') === 'true' || url.searchParams.get('refresh') === '1';

      try {
        const page = await getTeletextPage(channel, pageNumber, { subPage, forceRefresh });

        return Response.json(page, {
          headers: {
            ...corsHeaders,
            'Cache-Control': 'public, max-age=20',
          },
        });
      } catch (err: unknown) {
        if (err instanceof TeletextError) {
          const status = err.code === 'NOT_FOUND' ? 404 : err.code === 'INVALID_PAGE' ? 400 : 502;
          return Response.json(
            { error: err.message, code: err.code, channel: err.channel, page: err.pageNumber },
            { status, headers: corsHeaders }
          );
        }

        const message = err instanceof Error ? err.message : String(err);
        return Response.json(
          { error: message, code: 'INTERNAL_ERROR' },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Static Web Viewer File Serving & SPA Fallback
    if (STATIC_DIR) {
      let relativePath = url.pathname;
      if (relativePath === '/') relativePath = '/index.html';

      const filePath = join(STATIC_DIR, relativePath);
      if (existsSync(filePath) && !statSync(filePath).isDirectory()) {
        const file = Bun.file(filePath);
        const headers: Record<string, string> = { ...corsHeaders };

        // Cache immutable hashed assets
        if (/\.(js|css|woff2?|png|ico|svg)$/.test(relativePath)) {
          headers['Cache-Control'] = 'public, max-age=31536000, immutable';
        } else {
          headers['Cache-Control'] = 'no-cache';
        }
        return new Response(file, { headers });
      }

      // SPA Fallback to index.html for non-API routes
      const indexPath = join(STATIC_DIR, 'index.html');
      if (existsSync(indexPath)) {
        return new Response(Bun.file(indexPath), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache',
          },
        });
      }
    }

    return Response.json({ error: 'Not Found' }, { status: 404, headers: corsHeaders });
  },
});

console.log(`📡 Teletext Server running at http://localhost:${PORT}`);
if (STATIC_DIR) {
  console.log(`🌐 Serving Web Viewer from ${STATIC_DIR}`);
}
export default server;
