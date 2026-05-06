import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'APIキーが設定されていません' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const { messages } = req.body;

    const prompt = messages
      .map(m =>
        typeof m.content === "string"
          ? m.content
          : m.content.map(c => c.text).join("\n")
      )
      .join("\n");

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return res.status(200).json({
      content: [{ type: "text", text: response.text() }]
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
