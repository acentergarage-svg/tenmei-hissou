export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'APIキー未設定' });

  try {
    const incomingMessages = req.body.messages || [];
    // 修正点：Gemini 1.5 Flash の最新の宛名構成
    const geminiContents = incomingMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: typeof msg.content === 'string' ? msg.content : "画像解析リクエスト" }]
    }));

    // 解決策：URLから /models/ 以降を削り、モデル名をクエリパラメータへ移すのが最も安全な場合があります
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: geminiContents })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'API Error' });

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "鑑定失敗";
    return res.status(200).json({ content: [{ type: 'text', text: aiText }] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
