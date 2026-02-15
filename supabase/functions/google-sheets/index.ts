import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function base64url(data: string | Uint8Array): string {
  const input = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return encodeBase64(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlFromBuffer(buf: ArrayBuffer): string {
  return encodeBase64(new Uint8Array(buf)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(): Promise<string> {
  const clientEmail = Deno.env.get('GOOGLE_CLIENT_EMAIL')!;
  let privateKeyPem = Deno.env.get('GOOGLE_PRIVATE_KEY')!;
  privateKeyPem = privateKeyPem.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signInput = `${headerB64}.${payloadB64}`;

  let pemBody = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/[\r\n\s]/g, '')
    .replace(/[^A-Za-z0-9+/=]/g, '');

  const lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const base64 = pemBody.replace(/=/g, '');
  const len = base64.length;
  const bufLen = Math.floor(len * 3 / 4);
  const binaryKey = new Uint8Array(bufLen);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const a = lookup.indexOf(base64[i]);
    const b = lookup.indexOf(base64[i + 1] || 'A');
    const c = lookup.indexOf(base64[i + 2] || 'A');
    const d = lookup.indexOf(base64[i + 3] || 'A');
    binaryKey[p++] = (a << 2) | (b >> 4);
    if (i + 2 < len) binaryKey[p++] = ((b & 15) << 4) | (c >> 2);
    if (i + 3 < len) binaryKey[p++] = ((c & 3) << 6) | d;
  }

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', cryptoKey,
    new TextEncoder().encode(signInput)
  );

  const jwt = `${signInput}.${base64urlFromBuffer(signature)}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Token error: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

async function fetchSheet(accessToken: string, spreadsheetId: string, sheetName: string): Promise<any[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (data.error) {
    console.error(`Sheets API error for ${sheetName}:`, JSON.stringify(data.error));
    return [];
  }
  return data.values || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const spreadsheetId = Deno.env.get('SPREADSHEET_ID')!;
    const accessToken = await getAccessToken();

    const url = new URL(req.url);
    const sheet = url.searchParams.get('sheet');

    if (sheet) {
      const data = await fetchSheet(accessToken, spreadsheetId, sheet);
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sheetNames = [
      'BASE_UNICA',
      'VISAO_MENSAL',
      'ESTEIRA_MENSAL',
      'base_dados',
      'PROGRAMAÇÃO_SEMANAL',
      'DATAS COMEMORATIVASS_CIDADES',
      'ACOMP_CONDOMINIOS',
    ];

    const results = await Promise.all(
      sheetNames.map(name => fetchSheet(accessToken, spreadsheetId, name))
    );

    const response: Record<string, any[][]> = {};
    sheetNames.forEach((name, i) => {
      response[name] = results[i];
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
