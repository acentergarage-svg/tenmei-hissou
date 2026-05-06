/**
 * api/chat.js
 * Vercel Serverless Function — Gemini API プロキシ
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

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

  // Geminiのキーを取得 (VercelのSettingsで設定したもの)
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY が設定されていません' });
  }

  try {
    const { contents } = req.body;

    const genAI = new GoogleGenerativeAI(apiKey);
    // モデルを指定 (最新の gemini-1.5-flash)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Gemini API 呼び出し
    const result = await model.generateContent({ contents });
    const response = await result.response;
    const text = response.text();

    // フロントエンドが期待する形式に変換して返す
    return res.status(200).json({ 
      content: [{ text: text }] 
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};
