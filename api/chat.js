/**
 * api/chat.js
 * Vercel Serverless Function — Anthropic API プロキシ
 *
 * フロントエンドから /api/chat に POST することで
 * APIキーをクライアントに公開せずに Anthropic API を呼び出します。
 *
 * 環境変数 ANTHROPIC_API_KEY を Vercel ダッシュボードで設定してください。
 */

export default async function handler(req, res) {
  // CORS ヘッダー
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY が設定されていません' });
  }

  try {
    const body = req.body;

    // リクエストボディのサイズ制限チェック（画像込みのため大きめ）
    const bodyStr = JSON.stringify(body);
    if (bodyStr.length > 20 * 1024 * 1024) {
      return res.status(413).json({ error: 'リクエストが大きすぎます' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: bodyStr,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Vercel にボディパーサーの設定を伝える
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};
