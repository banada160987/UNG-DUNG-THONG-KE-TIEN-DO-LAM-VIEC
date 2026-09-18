/**
 * VERCEL SERVERLESS BACKEND PROXY CHO GOOGLE GEMINI AI
 * Bảo vệ 100% bí mật API Key (Zero Client Exposure)
 */

export default async function handler(req, res) {
  // Cho phép CORS nếu cần
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Vui lòng dùng POST.' });
  }

  // Đọc API Key an toàn từ biến môi trường máy chủ Vercel
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || req.body?.customApiKey;

  if (!apiKey) {
    return res.status(400).json({
      error: 'Chưa cấu hình GEMINI_API_KEY trong Environment Variables trên Vercel.'
    });
  }

  const { promptText, systemInstruction, temperature = 0.3 } = req.body || {};

  if (!promptText) {
    return res.status(400).json({ error: 'Thiếu promptText trong yêu cầu gửi lên.' });
  }

  const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemInstruction ? systemInstruction + '\n\n' : ''}${promptText}` }]
        }],
        generationConfig: {
          temperature: temperature,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2500
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: `Gemini API Error: ${errText}`
      });
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({
      success: true,
      text: candidateText,
      source: 'vercel_serverless_gemini'
    });
  } catch (err) {
    console.error('Serverless AI Advisor Error:', err);
    return res.status(500).json({
      error: err.message || 'Lỗi xử lý nội bộ trên máy chủ Vercel'
    });
  }
}
