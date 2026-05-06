/**
 * api/chat.js
 * Gemini API プロキシ（データ形式変換版）
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // フロントエンドから届いたメッセージ（Anthropic形式）を取り出す
    const incomingMessages = req.body.messages || [];
    
    // Geminiが理解できる形式（contents）に変換する
    const geminiContents = incomingMessages.map(msg => {
      // 画像データが含まれているかチェック
      const parts = Array.isArray(msg.content) ? msg.content : [{ text: msg.content }];
      
      const formattedParts = parts.map(part => {
        if (part.type === 'image' || (part.source && part.source.data)) {
          // 画像データがある場合
          return {
            inlineData: {
              mimeType: part.source.media_type || "image/png",
              data: part.source.data
            }
          };
        }
        return { text: part.text || "" };
      });

      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: formattedParts
      };
    });

    // Gemini API 呼び出し
    const result = await model.generateContent({ contents: geminiContents });
    const response = await result.response;
    const text = response.text();

    // フロントエンドが期待する Anthropic 形式のレスポンスを返す
    return res.status(200).json({ 
      content: [{ type: 'text', text: text }] 
    });

  } catch (error) {
    console.error('Gemini API Error details:', error);
    return res.status(500).json({ error: error.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } },
};
