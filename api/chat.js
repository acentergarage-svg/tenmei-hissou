/**
 * api/chat.js
 * Vercel Serverless Function — Gemini API プロキシ（修正版）
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // CORS ヘッダーの設定
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

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'APIキーが設定されていません' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // フロントエンドからの入力を柔軟に解析
    // もし contents が無い場合は、body そのものを contents として試みる
    const contents = req.body.contents || req.body;

    // Gemini API 呼び出し
    // contents が配列であることを確認して渡す
    const result = await model.generateContent({ 
      contents: Array.isArray(contents) ? contents : [contents] 
    });
    
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ 
      content: [{ text: text }] 
    });

  } catch (error) {
    console.error('Gemini API Error details:', error);
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
