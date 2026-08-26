/**
 * GitHub OAuth token exchange — Cloudflare Worker
 *
 * Exchanges an OAuth authorization code for a user access token.
 * The client_secret is stored as a Cloudflare secret, never exposed to the browser.
 *
 * Deploy:
 *   wrangler deploy
 *   wrangler secret put GITHUB_CLIENT_SECRET
 *
 * Usage:
 *   POST https://github-auth.reposell.dev/exchange
 *   { "code": "abc123" }
 *   → { "access_token": "gho_...", "login": "enzovezzaro" }
 */

const CLIENT_ID = 'Iv23lidhennqrdpdFUAT';
const ALLOWED_ORIGINS = [
  'https://reposell.dev',
  'https://listing.reposell.dev',
  'https://community.reposell.dev',
  'http://localhost:5173',
  'http://localhost:4173',
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    try {
      const { code } = await request.json();

      if (!code || typeof code !== 'string') {
        return new Response(JSON.stringify({ error: 'Missing code' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
      }

      // Exchange code for access token with GitHub
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const data = await tokenRes.json();

      if (data.error) {
        return new Response(JSON.stringify({ error: data.error_description || data.error }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
      }

      // Fetch user info to return login
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          Accept: 'application/vnd.github+json',
        },
      });
      const user = await userRes.json();

      return new Response(
        JSON.stringify({
          access_token: data.access_token,
          login: user.login || '',
          id: user.id || 0,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        },
      );
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
  },
};
