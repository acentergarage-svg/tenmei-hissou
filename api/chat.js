/**
 * api/chat.js
 * Gemini 1.5 Flash 専用プロキシ（究極版）
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 環境変数からキーを取得
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'APIキーが設定されていません' });
  }

  try {
    const incomingMessages = req.body.messages || [];
    
    // Gemini 1.5 Flash が要求する最も標準的なデータ形式に整理
    const geminiContents = incomingMessages.map(msg => {
      let parts = [];
      if (Array.isArray(msg.content)) {
        parts = msg.content.map(part => {
          if (part.type === 'image' || part.source) {
            return {
              inline_data: {
                mime_type: part.source?.media_type || "image/png",
                data: part.source?.data || part.data
              }
            };
          }
          return { text: part.text || "" };
        });
      } else {
        parts = [{ text: msg.content || "" }];
      }
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: parts
      };
    });

    // 通信先URL：gemini-1.5-flash を確実に指定
// apiUrl を v1beta に戻す
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: geminiContents })
    });

    const data = await response.json();

    if (!response.ok) {
      // エラーの詳細をそのまま返す（デバッグ用）
      return res.status(response.status).json({
        error: data.error?.message || 'Gemini API Error',
        details: data
      });
    }

    // AIの回答を抽出
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "鑑定結果が得られませんでした。";

    return res.status(200).json({ 
      content: [{ type: 'text', text: aiText }] 
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } },
};
