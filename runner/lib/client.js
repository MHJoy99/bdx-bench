'use strict';
/* BDX Bench model client — zero npm dependencies (node built-ins + global fetch only).
 * live: POST {model, temperature:0, messages:[{role:'user',content:prompt}]}
 *       to $BDX_BASE_URL (default https://gpt.bdx.market/v1)/chat/completions
 *       with Bearer $BDX_AI_API_KEY.
 * mock: returns canned patch text, performs NO network I/O.
 * The API key is never logged, printed, or embedded in returned data. */

const DEFAULT_BASE_URL = 'https://gpt.bdx.market/v1';
const LIVE_TIMEOUT_MS = 180000;

function baseUrl() {
  return (process.env.BDX_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

// Canned mock output. Single fenced block, info string "solution" (no path),
// body is the MOCK_PATCH_OK marker the runner/.sample smoke task asserts on.
// Deliberately generic: exercises the extract -> write -> check pipeline.
function mockCompletion(model) {
  const fence = '```';
  return [
    `Mock solution by ${model} (mock mode - no network used).`,
    '',
    'Apply the following patch to the workspace:',
    '',
    `${fence}solution`,
    'MOCK_PATCH_OK',
    `${fence}`,
    '',
    'No other changes.',
  ].join('\n');
}

async function liveCompletion(model, prompt) {
  const key = process.env.BDX_AI_API_KEY;
  if (!key) {
    throw new Error('live mode requires the $BDX_AI_API_KEY environment variable');
  }
  const url = `${baseUrl()}/chat/completions`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LIVE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + key,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const body = await res.text().then((t) => t.slice(0, 500)).catch(() => '');
      throw new Error(`model API HTTP ${res.status}${body ? `: ${body}` : ''}`);
    }
    const data = await res.json();
    const text = data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : undefined;
    if (typeof text !== 'string' || text.length === 0) {
      throw new Error('model API returned no message content');
    }
    return text;
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new Error(`model API request timed out after ${LIVE_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function complete({ model, prompt, mode }) {
  if (mode === 'mock') return mockCompletion(model);
  if (mode === 'live') return liveCompletion(model, prompt);
  throw new Error(`unknown mode: ${mode}`);
}

module.exports = { complete, mockCompletion, DEFAULT_BASE_URL };
