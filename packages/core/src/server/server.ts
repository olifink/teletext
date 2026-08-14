import { getTeletextPage, listSupportedChannels } from '../providers/provider-registry';
import { TeletextError } from '../models/provider';

const PORT = parseInt(process.env.PORT || '3000', 10);

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

    return Response.json({ error: 'Not Found' }, { status: 404, headers: corsHeaders });
  },
});

console.log(`📡 Teletext API Server running at http://localhost:${PORT}`);
export default server;
