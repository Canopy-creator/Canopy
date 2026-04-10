// api/claude.js — Secure Vercel serverless proxy
// Verifies Clerk auth token before calling Anthropic.
// API key and secret key never touch the browser.

import { createClerkClient } from '@clerk/backend';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── 1. Verify Clerk session token ──────────────────────
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not signed in. Please create an account to use Canopy.' });
  }

  const sessionToken = authHeader.split(' ')[1];

  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    await clerk.verifyToken(sessionToken);
  } catch (err) {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }

  // ── 2. Check Anthropic API key is configured ───────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server not configured. Contact support.' });
  }

  // ── 3. Validate request body ───────────────────────────
  const { prompt, max_tokens = 2500 } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.length < 10) {
    return res.status(400).json({ error: 'Invalid request.' });
  }

  // ── 4. Call Anthropic ──────────────────────────────────
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: Math.min(max_tokens, 2500), // hard cap
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'AI service error. Please try again.',
      });
    }

    const text = data.content?.[0]?.text ?? '';
    return res.status(200).json({ text });

  } catch (err) {
    console.error('Anthropic call failed:', err);
    return res.status(500).json({ error: 'Generation failed. Please try again.' });
  }
}
