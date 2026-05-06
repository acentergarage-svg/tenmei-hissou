/**
 * api/chat.js
 * Gemini API プロキシ（Direct Fetch 方式）
 * ライブラリの 404 エラーを回避します。
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'APIキーが設定されていません' });

  try {
    const incomingMessages = req.body.messages || [];
    
    // Gemini 向けのデータ形式（contents）に変換
    const geminiContents = incomingMessages.map(msg => {
      const parts = Array.isArray(msg.content) ? msg.content : [{ text: msg.content }];
      const formattedParts = parts.map(part => {
        if (part.type === 'image' || (part.source && part.source.data)) {
          return {
            inline_data: {
              mime_type: part.source?.media_type || "image/png",
              data: part.source?.data || part.data
            }
          };
        }
        return { text: part.text || part || "" };
      });
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: formattedParts
      };
    });

    // ライブラリを使わず直接 API を叩く (v1 安定版を指定)
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: geminiContents })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API Error');
    }

    // AI の返答テキストを取り出す
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "鑑定結果を取得できませんでした。";

    return res.status(200).json({ 
      content: [{ type: 'text', text: aiText }] 
    });

  } catch (error) {
    console.error('API Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } },
};
