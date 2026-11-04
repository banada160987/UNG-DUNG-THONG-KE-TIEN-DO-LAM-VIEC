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

  const { promptText, parts, systemInstruction, temperature = 0.3 } = req.body || {};

  if (!promptText && (!parts || parts.length === 0)) {
    return res.status(400).json({ error: 'Thiếu promptText hoặc parts trong yêu cầu gửi lên.' });
  }

  const userParts = (parts && parts.length > 0)
    ? parts
    : [{ text: `${systemInstruction ? systemInstruction + '\n\n' : ''}${promptText}` }];

  const candidateModels = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-2.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-2.5-pro'
  ];

  let lastError = null;

  for (const model of candidateModels) {
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: userParts
          }],
          generationConfig: {
            temperature: temperature,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 3000
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return res.status(200).json({
          success: true,
          text: candidateText,
          modelUsed: model,
          source: 'vercel_serverless_gemini'
        });
      } else {
        const errText = await response.text();
        lastError = `Model ${model} Error (${response.status}): ${errText}`;
        console.warn(lastError);
      }
    } catch (err) {
      lastError = err.message;
      console.warn(`Fetch error on ${model}:`, err);
    }
  }

  return res.status(500).json({
    error: lastError || 'Toàn bộ các mô hình Gemini AI đều không thể phản hồi.'
  });
}
