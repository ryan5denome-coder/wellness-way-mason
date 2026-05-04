/**
 * Decap CMS GitHub OAuth proxy — Cloudflare Worker
 *
 * Decap CMS in production needs a GitHub OAuth handshake. This Worker:
 *   1. /auth     -> redirects browser to GitHub's authorize page
 *   2. /callback -> receives the code, exchanges it for an access token,
 *                   and posts the token back to the Decap UI in the opener tab.
 *
 * HITS lesson 8 (load-bearing):
 *   The token exchange MUST send body as `application/x-www-form-urlencoded`,
 *   NOT JSON. Sending JSON intermittently produces HTTP 522 errors. Surfacing
 *   upstream errors (instead of swallowing them as a 5xx) makes any future
 *   issues debuggable.
 *
 * Deployment (one-time, see Phase 9 README):
 *   1. cd worker
 *   2. npx wrangler deploy decap-oauth.js --name decap-oauth-tww
 *   3. npx wrangler secret put GITHUB_CLIENT_ID
 *   4. npx wrangler secret put GITHUB_CLIENT_SECRET
 *   5. Note the *.workers.dev URL — paste into public/admin/config.yml backend.base_url
 *   6. In your GitHub OAuth App, set the callback URL to: <worker-url>/callback
 */

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Step 1: kick off OAuth — redirect to GitHub
    if (url.pathname === '/auth' || url.pathname === '/auth/') {
      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        scope: 'repo,user',
        redirect_uri: `${url.origin}/callback`,
      });
      return Response.redirect(`${GITHUB_AUTHORIZE_URL}?${params.toString()}`, 302);
    }

    // Step 2: callback — exchange code for token, return to Decap via postMessage
    if (url.pathname === '/callback' || url.pathname === '/callback/') {
      const code = url.searchParams.get('code');
      if (!code) {
        return errorResponse('Missing `code` query parameter', 400);
      }

      // CRITICAL: form-urlencoded body, NOT JSON (HITS lesson 8)
      let tokenRes;
      try {
        tokenRes = await fetch(GITHUB_TOKEN_URL, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'tww-mason-decap-oauth/1.0',
          },
          body: new URLSearchParams({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
          }).toString(),
        });
      } catch (err) {
        return errorResponse(`Network error contacting GitHub: ${err.message}`, 502);
      }

      if (!tokenRes.ok) {
        const errBody = await safeText(tokenRes);
        return errorResponse(
          `GitHub token exchange failed (HTTP ${tokenRes.status}): ${errBody}`,
          502,
        );
      }

      let data;
      try {
        data = await tokenRes.json();
      } catch (err) {
        return errorResponse(`GitHub returned non-JSON response: ${err.message}`, 502);
      }

      if (data.error || !data.access_token) {
        const desc = data.error_description || JSON.stringify(data);
        return errorResponse(`GitHub OAuth error: ${desc}`, 502);
      }

      // Successful token — postMessage back to Decap UI in opener
      const message = JSON.stringify({
        token: data.access_token,
        provider: 'github',
      });

      const html = `<!doctype html><html><body><script>
(function() {
  function receive(e) {
    window.opener && window.opener.postMessage(
      'authorization:github:success:' + ${JSON.stringify(message)},
      e.origin
    );
  }
  window.addEventListener('message', receive, false);
  window.opener && window.opener.postMessage('authorizing:github', '*');
})();
</script></body></html>`;

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...corsHeaders,
        },
      });
    }

    // Health check
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response('decap-oauth-tww OK', {
        headers: { 'Content-Type': 'text/plain', ...corsHeaders },
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};

function errorResponse(message, status) {
  // Plain text body — easy for the developer to read in DevTools.
  return new Response(`Decap OAuth error: ${message}`, {
    status,
    headers: { 'Content-Type': 'text/plain', ...corsHeaders },
  });
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return '<unreadable response body>';
  }
}
