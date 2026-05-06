/**
 * api/chat.js
 * Gemini API プロキシ（モデル名指定修正版）
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // モデル名の指定から "gemini-1.5-flash" の前のパスを自動補完させるため、
    // シンプルに名前だけに修正します。
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const incomingMessages = req.body.messages || [];
    
    const geminiContents = incomingMessages.map(msg => {
      const parts = Array.isArray(msg.content) ? msg.content : [{ text: msg.content }];
      
      const formattedParts = parts.map(part => {
        // 画像データがある場合（ソースデータの有無で判定）
        if (part.type === 'image' || (part.source && part.source.data)) {
          return {
            inlineData: {
              mimeType: part.source?.media_type || "image/png",
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

    const result = await model.generateContent({ contents: geminiContents });
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ 
      content: [{ type: 'text', text: text }] 
    });

  } catch (error) {
    console.error('Gemini API Error details:', error);
    // ログに出力された詳細をフロントにも返す
    return res.status(500).json({ error: error.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } },
};
