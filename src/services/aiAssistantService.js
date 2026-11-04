/**
 * ỨNG DỤNG ĐIỀU HÀNH & TIỆN ÍCH SỐ THPT CAO BÁ QUÁT
 * Bộ Dịch Vụ Trợ Lý AI Sư Phạm & Quản Trị Khóa API Cá Nhân (BYOK - Bring Your Own Key)
 * Hỗ trợ Google Gemini API (1.5 Flash, 2.0 Flash, 1.5 Pro)
 * Cho phép Giáo viên tự gán API Key miễn phí từ Google AI Studio hoặc dùng mặc định của trường
 */

export const AI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Khuyên dùng - Ổn định & Siêu tốc)', desc: 'Phản hồi cực nhanh (<1s), thông minh vượt trội, chuẩn Google AI mới nhất' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (Tức thì)', desc: 'Tốc độ tối ưu cho trắc nghiệm và phản hồi nhanh' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Chuyên sâu)', desc: 'Xử lý ma trận đề thi phức tạp và văn bản hành chính dài' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Thế hệ mới)', desc: 'Mô hình tiên tiến đa phương thức cho tác vụ nâng cao' }
];

const DEFAULT_MODEL = 'gemini-2.5-flash';
const STORAGE_KEY = 'cbq_ai_api_key';
const STORAGE_MODEL_KEY = 'cbq_ai_model';

/**
 * Lấy API Key đang hiệu lực:
 * 1. Ưu tiên khóa cá nhân do Giáo viên tự dán vào máy
 * 2. Fallback sang biến môi trường hệ thống VITE_GEMINI_API_KEY
 */
export function getStoredAiKey() {
  try {
    const customKey = localStorage.getItem(STORAGE_KEY);
    if (customKey && customKey.trim().length > 10) {
      return customKey.trim();
    }
  } catch (e) {
    console.warn('Lỗi đọc localStorage AI key:', e);
  }

  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY.trim();
  }

  return '';
}

/**
 * Lấy nguồn gốc của API Key đang dùng: 'custom' | 'env' | 'none'
 */
export function getAiKeySource() {
  try {
    const customKey = localStorage.getItem(STORAGE_KEY);
    if (customKey && customKey.trim().length > 10) return 'custom';
  } catch (e) {}

  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return 'env';
  }

  return 'none';
}

/**
 * Lấy mô hình AI đang chọn
 */
export function getStoredAiModel() {
  try {
    const saved = localStorage.getItem(STORAGE_MODEL_KEY);
    // Nếu trước đó đang lưu model cũ bị Google khai tử (1.5 hoặc 2.0), tự động chuyển sang gemini-2.5-flash
    if (saved && (saved.includes('1.5') || saved.includes('2.0') || !AI_MODELS.some(m => m.id === saved))) {
      localStorage.setItem(STORAGE_MODEL_KEY, DEFAULT_MODEL);
      return DEFAULT_MODEL;
    }
    if (saved && AI_MODELS.some(m => m.id === saved)) {
      return saved;
    }
  } catch (e) {}
  return DEFAULT_MODEL;
}

/**
 * Lưu khóa API cá nhân của Giáo viên và mô hình lựa chọn
 */
export function saveStoredAiKey(key, model = DEFAULT_MODEL) {
  try {
    const safeModel = (model && (model.includes('1.5') || model.includes('2.0'))) ? DEFAULT_MODEL : (model || DEFAULT_MODEL);
    if (key && key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    if (safeModel) {
      localStorage.setItem(STORAGE_MODEL_KEY, safeModel);
    }
    // Bắn sự kiện để tất cả các component/tab trên màn hình tự cập nhật tức thì
    window.dispatchEvent(new CustomEvent('cbq_ai_key_updated', {
      detail: { hasKey: Boolean(key && key.trim()), model: safeModel }
    }));
  } catch (e) {
    console.error('Lỗi lưu trữ AI key:', e);
  }
}

/**
 * Danh sách cascade các model Google Gemini khả dụng để tự động fallback
 */
export const GEMINI_CASCADE_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-3.8-flash'
];

/**
 * Kiểm tra kết nối API Key trực tiếp với Google Gemini (Tự động thử cascade qua các model khả dụng)
 */
export async function testGeminiConnection(customKey = null, customModel = null) {
  const apiKey = (customKey !== null ? customKey : getStoredAiKey())?.trim();
  let requestedModel = customModel || getStoredAiModel();
  if (requestedModel.includes('1.5') || requestedModel.includes('2.0')) {
    requestedModel = DEFAULT_MODEL;
  }

  if (!apiKey) {
    return {
      success: false,
      error: 'Vui lòng nhập API Key để kiểm tra.'
    };
  }

  const testModels = [requestedModel, ...GEMINI_CASCADE_MODELS.filter(m => m !== requestedModel)];
  let lastErrorMsg = '';
  let fastestLatency = 0;

  for (const modelToTry of testModels) {
    const startTime = Date.now();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'Chào bạn, hãy phản hồi đúng 5 từ: "Trợ lý AI THPT Cao Bá Quát sẵn sàng."' }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 60
          }
        })
      });

      fastestLatency = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Tự động lưu mô hình hoạt động tốt nhất vào bộ nhớ
        saveStoredAiKey(apiKey, modelToTry);

        return {
          success: true,
          latencyMs: fastestLatency,
          model: modelToTry,
          replyText: replyText.trim(),
          message: `Kết nối thành công với ${modelToTry}! Độ trễ phản hồi: ${fastestLatency}ms.`
        };
      } else {
        const errData = await response.json().catch(() => ({}));
        lastErrorMsg = errData.error?.message || `Mã lỗi HTTP ${response.status}`;
        console.warn(`[Gemini Connection Test] Model ${modelToTry} thất bại: ${lastErrorMsg}, đang thử model tiếp theo...`);
      }
    } catch (netErr) {
      lastErrorMsg = netErr.message || 'Lỗi mạng';
    }
  }

  return {
    success: false,
    latencyMs: fastestLatency,
    error: `Kết nối không thành công (${lastErrorMsg}). Vui lòng kiểm tra lại Key từ Google AI Studio.`
  };
}

/**
 * GỌI TRỰC TIẾP GOOGLE GEMINI AI VỚI NỘI DUNG TÙY BIẾN (TỰ ĐỘNG CASCADE FALLBACK AN TOÀN)
 */
export async function callGeminiRaw({ prompt, systemInstruction = '', temperature = 0.4, jsonMode = false, model = null }) {
  const apiKey = getStoredAiKey();
  let targetModel = model || getStoredAiModel();
  if (targetModel.includes('1.5') || targetModel.includes('2.0')) {
    targetModel = DEFAULT_MODEL;
  }

  if (!apiKey) {
    throw new Error('Chưa cấu hình API Key. Thầy/Cô vui lòng bấm biểu tượng Trợ lý AI để gán Key miễn phí từ Google AI Studio.');
  }

  const bodyPayload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature
    }
  };

  if (systemInstruction) {
    bodyPayload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  if (jsonMode) {
    bodyPayload.generationConfig.responseMimeType = 'application/json';
  }

  const modelsToTry = [targetModel, ...GEMINI_CASCADE_MODELS.filter(m => m !== targetModel)];
  let lastError = null;

  for (const curModel of modelsToTry) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${curModel}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return text.trim();
      }

      const errData = await response.json().catch(() => ({}));
      lastError = new Error(errData.error?.message || `Lỗi gọi Gemini API (HTTP ${response.status})`);
      console.warn(`[callGeminiRaw] Model ${curModel} không phản hồi (${lastError.message}), chuyển sang fallback...`);
    } catch (fetchErr) {
      lastError = fetchErr;
    }
  }

  throw lastError || new Error('Không thể kết nối đến máy chủ Google Gemini.');
}

/**
 * TRỢ GIẢNG AI: TỰ ĐỘNG TẠO CÂU HỎI TRẮC NGHIỆM CHO TRÒ CHƠI & ĐỀ THI
 * Sinh chuẩn JSON có 4 phương án A, B, C, D, chỉ số đáp án đúng và lời giải thích
 */
export async function generateClassroomQuestionsAi({ subject = 'Toán học', grade = '10', topic = 'Khởi động', count = 5, difficulty = 'Vừa sức', rawContext = '' }) {
  const systemPrompt = `Bạn là Chuyên gia Khảo thí và Giáo viên Giỏi bậc THPT của Trường THPT Cao Bá Quát (Đắk Lắk).
Nhiệm vụ của bạn là biên soạn bộ câu hỏi trắc nghiệm chất lượng cao, chuẩn kiến thức kỹ năng Chương trình Giáo dục Phổ thông 2018 của Bộ Giáo dục và Đào tạo.

YÊU CẦU ĐỊNH DẠNG:
- Trả về DUY NHẤT một mảng JSON hợp lệ chứa các object câu hỏi. Không kèm markdown block \`\`\`json.
- Mỗi object có cấu trúc chuẩn xác như sau:
  {
    "id": "ai_q_1",
    "title": "Câu 1",
    "content": "Nội dung câu hỏi rõ ràng, sư phạm, không sai sót kiến thức.",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "correctAnswerIndex": 0, // 0 cho A, 1 cho B, 2 cho C, 3 cho D
    "explanation": "Lời giải thích ngắn gọn, súc tích, dễ hiểu giúp học sinh nắm vững bản chất."
  }
`;

  const userPrompt = `Hãy biên soạn ${count} câu hỏi trắc nghiệm 4 lựa chọn (A, B, C, D) cho môn học sau:
- Môn học: ${subject}
- Khối lớp: ${grade}
- Chủ đề bài học: "${topic}"
- Mức độ nhận thức: ${difficulty}
${rawContext ? `- Dựa trên đoạn tài liệu/nội dung sau:\n"""\n${rawContext}\n"""` : ''}

Lưu ý:
- 4 phương án trả lời phải có tính nhiễu hợp lý, không quá lộ liễu.
- Đáp án đúng phân bố đều ngẫu nhiên (không tập trung vào một chữ cái).
- Công thức toán/lý/hóa (nếu có) trình bày chuẩn xác.`;

  try {
    const rawJson = await callGeminiRaw({
      prompt: userPrompt,
      systemInstruction: systemPrompt,
      temperature: 0.3,
      jsonMode: true
    });

    const cleanStr = rawJson.replace(/^```json/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((q, idx) => ({
        id: q.id || `ai_gen_${Date.now()}_${idx}`,
        title: q.title || `Câu ${idx + 1}`,
        content: q.content || q.question || '',
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A', 'B', 'C', 'D'],
        correctAnswerIndex: typeof q.correctAnswerIndex === 'number' && q.correctAnswerIndex >= 0 && q.correctAnswerIndex <= 3 ? q.correctAnswerIndex : 0,
        explanation: q.explanation || 'Đáp án chính xác theo chuẩn chương trình học.'
      }));
    }
    throw new Error('Dữ liệu JSON sinh ra không đúng cấu trúc mảng.');
  } catch (err) {
    console.warn('Lỗi gọi Gemini AI trực tiếp, chuyển sang bộ sinh câu hỏi sư phạm Heuristic GDPT 2018:', err);
    return generateHeuristicClassroomQuestions({ subject, grade, topic, count, difficulty, rawContext });
  }
}

/**
 * TRỢ LÝ AI: TRÍCH XUẤT CÂU HỎI TỪ VĂN BẢN TỰ DO / ĐỀ THI COPY-PASTE
 */
export async function parseRawExamQuestionsAi(rawText = '', subject = 'Tất cả môn', grade = '10') {
  if (!rawText || rawText.trim().length < 10) {
    throw new Error('Nội dung văn bản quá ngắn để trích xuất.');
  }

  const systemPrompt = `Bạn là Trợ lý OCR và Xử lý Ngôn ngữ Tự nhiên chuyên số hóa đề thi THPT tại Việt Nam.
Nhiệm vụ: Phân tích đoạn văn bản thô do giáo viên dán vào (chứa các câu hỏi trắc nghiệm, các lựa chọn A, B, C, D) và chuyển đổi thành mảng JSON chuẩn.
Cấu trúc mỗi phần tử:
{
  "id": "q_parsed_1",
  "title": "Câu 1",
  "content": "Nội dung câu hỏi",
  "options": ["Nội dung A", "Nội dung B", "Nội dung C", "Nội dung D"],
  "correctAnswerIndex": 0,
  "explanation": "Giải thích (nếu có trong đề, hoặc tóm tắt ngắn)"
}`;

  const userPrompt = `Đoạn văn bản đề thi thô cần trích xuất (Môn: ${subject}, Khối: ${grade}):\n"""\n${rawText}\n"""\n\nHãy chuẩn hóa và trả về duy nhất mảng JSON.`;

  const rawJson = await callGeminiRaw({
    prompt: userPrompt,
    systemInstruction: systemPrompt,
    temperature: 0.1,
    jsonMode: true
  });

  const cleanStr = rawJson.replace(/^```json/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(cleanStr);
  return Array.isArray(parsed) ? parsed : [];
}

/**
 * TRỢ GIẢNG AI: GIẢI THÍCH CHI TIẾT CÂU HỎI TRONG TIẾT DẠY
 */
export async function explainQuestionAi({ questionText, options = [], correctIndex = 0, subject = 'Chung' }) {
  const prompt = `Câu hỏi trắc nghiệm môn ${subject}:
Nội dung: ${questionText}
Các phương án:
A. ${options[0] || ''}
B. ${options[1] || ''}
C. ${options[2] || ''}
D. ${options[3] || ''}
Đáp án đúng là: ${['A', 'B', 'C', 'D'][correctIndex]}

Hãy đóng vai là Thầy/Cô giáo giỏi tại THPT Cao Bá Quát, giải thích cho học sinh:
1. Vì sao phương án trên là chính xác (ngắn gọn, trực quan, trọng tâm).
2. Lỗi sai phổ biến mà các bạn học sinh thường mắc phải dẫn đến chọn nhầm các phương án còn lại.
3. Một mẹo ghi nhớ nhanh để lần sau không bị nhầm lẫn.`;

  return await callGeminiRaw({
    prompt,
    temperature: 0.3
  });
}

/**
 * TRỢ LÝ AI KHẢO THÍ: BIÊN SOẠN CÂU HỎI THEO ĐÚNG CẤU TRÚC ĐỀ THI TỐT NGHIỆP THPT MỚI 2025
 * Hỗ trợ 3 định dạng:
 * - part1: Trắc nghiệm 4 lựa chọn (A, B, C, D)
 * - part2: Trắc nghiệm Đúng / Sai (1 câu có 4 ý a, b, c, d độc lập)
 * - part3: Trắc nghiệm Trả lời ngắn (kết quả số hoặc biểu thức rút gọn)
 */
export async function generate2025ExamQuestionsAi({
  subject = 'Toán',
  grade = '12',
  topic = 'Hàm số và ứng dụng đạo hàm',
  part = 'part1', // 'part1' | 'part2' | 'part3' | 'mixed'
  count = 4,
  level = 'Thông hiểu', // 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao'
  rawContext = ''
}) {
  const systemPrompt = `Bạn là Chuyên gia Khảo thí và Đo lường Đánh giá Giáo dục bậc THPT, am hiểu sâu sắc Cấu trúc định dạng đề thi tốt nghiệp THPT từ năm 2025 của Bộ Giáo dục và Đào tạo (Chương trình GDPT 2018).

Nhiệm vụ của bạn là biên soạn các câu hỏi thi chất lượng cao cho môn ${subject}, khối ${grade}, chuyên đề "${topic}".
Toàn bộ công thức toán, lý, hóa PHẢI viết bằng cú pháp LaTeX kẹp giữa dấu $ ... $ (Ví dụ: $f(x) = x^3 - 3x + 2$, $\\int_0^1 x dx$, $\\vec{u} = (1; 2; -3)$).

CẤU TRÚC JSON PHẢI TRẢ VỀ:
Trả về DUY NHẤT một mảng JSON các câu hỏi. Tuyệt đối không bọc trong markdown \`\`\`json.
Các câu hỏi tùy theo part có cấu trúc như sau:

1. Định dạng part1 (Trắc nghiệm 4 phương án):
{
  "part": "part1",
  "title": "Câu X (Phần I - Trắc nghiệm 4 phương án)",
  "level": "${level}",
  "content": "Nội dung câu hỏi với LaTeX $...$",
  "options": ["Nội dung A", "Nội dung B", "Nội dung C", "Nội dung D"],
  "correctAnswerIndex": 0, // 0 cho A, 1 cho B, 2 cho C, 3 cho D
  "explanation": "Lời giải chi tiết từng bước"
}

2. Định dạng part2 (Trắc nghiệm Đúng / Sai - 4 ý a, b, c, d):
{
  "part": "part2",
  "title": "Câu X (Phần II - Trắc nghiệm Đúng/Sai)",
  "level": "${level}",
  "content": "Lời dẫn chung cho câu hỏi kèm điều kiện bài toán $...$",
  "subItems": [
    { "key": "a", "text": "Mệnh đề phát biểu ý a với LaTeX $...$", "isTrue": true },
    { "key": "b", "text": "Mệnh đề phát biểu ý b với LaTeX $...$", "isTrue": false },
    { "key": "c", "text": "Mệnh đề phát biểu ý c với LaTeX $...$", "isTrue": true },
    { "key": "d", "text": "Mệnh đề phát biểu ý d với LaTeX $...$", "isTrue": false }
  ],
  "explanation": "Lời giải thích cặn kẽ vì sao từng mệnh đề a, b, c, d là Đúng hoặc Sai"
}

3. Định dạng part3 (Trắc nghiệm Trả lời ngắn):
{
  "part": "part3",
  "title": "Câu X (Phần III - Trắc nghiệm Trả lời ngắn)",
  "level": "${level}",
  "content": "Nội dung câu hỏi tính toán thực tế hoặc vận dụng $...$",
  "shortAnswer": "50", // Kết quả số thực, số nguyên hoặc phân số tối giản (VD: 50, -2, 3.5, 7/4)
  "explanation": "Các bước biến đổi đưa đến kết quả cuối cùng"
}`;

  let partPromptDesc = '';
  if (part === 'part1') {
    partPromptDesc = `Biên soạn đúng ${count} câu hỏi thuộc PHẦN I: Trắc nghiệm 4 phương án lựa chọn (A, B, C, D).`;
  } else if (part === 'part2') {
    partPromptDesc = `Biên soạn đúng ${count} câu hỏi thuộc PHẦN II: Trắc nghiệm Đúng/Sai. Mỗi câu bắt buộc phải có đủ 4 ý phụ độc lập a), b), c), d) và xác định rõ isTrue là true hoặc false.`;
  } else if (part === 'part3') {
    partPromptDesc = `Biên soạn đúng ${count} câu hỏi thuộc PHẦN III: Trắc nghiệm Trả lời ngắn. Học sinh tự điền đáp số vào ô trống, kết quả là một số cụ thể hoặc phân số.`;
  } else {
    partPromptDesc = `Biên soạn bộ đề hỗn hợp gồm các câu hỏi thuộc cả 3 phần I, II, III theo cấu trúc đề thi 2025. Tổng số câu là ${count}.`;
  }

  const userPrompt = `${partPromptDesc}
- Môn học: ${subject}
- Khối: Lớp ${grade}
- Chủ đề / Chuyên đề: "${topic}"
- Mức độ nhận thức: ${level}
${rawContext ? `- Tài liệu / Đề cương kèm theo:\n"""\n${rawContext}\n"""` : ''}

Yêu cầu khảo thí:
1. Đảm bảo tính chính xác khoa học tuyệt đối, không có sai sót toán học hoặc kiến thức chuyên môn.
2. Công thức và ký hiệu toán học sử dụng LaTeX chuẩn ($...$).
3. Bám sát ma trận và dạng bài thi THPT 2025 của Bộ GD&ĐT.
4. Trả về đúng mảng JSON hợp lệ.`;

  try {
    const rawJson = await callGeminiRaw({
      prompt: userPrompt,
      systemInstruction: systemPrompt,
      temperature: 0.25,
      jsonMode: true
    });

    const cleanStr = rawJson.replace(/^```json/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanStr);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Dữ liệu câu hỏi do AI tạo ra không hợp lệ.');
    }

    const timestamp = Date.now();
    return parsed.map((q, idx) => {
      const qPart = q.part || (part === 'mixed' ? 'part1' : part);
      const baseId = `ai_exam_${timestamp}_${idx}`;
      if (qPart === 'part2') {
        return {
          id: baseId,
          part: 'part2',
          title: q.title || `Câu ${idx + 1} (Phần II - Trắc nghiệm Đúng/Sai)`,
          level: q.level || level,
          content: q.content || '',
          subItems: Array.isArray(q.subItems) && q.subItems.length === 4 ? q.subItems.map(item => ({
            key: item.key || 'a',
            text: item.text || '',
            isTrue: Boolean(item.isTrue)
          })) : [
            { key: 'a', text: 'Mệnh đề a', isTrue: true },
            { key: 'b', text: 'Mệnh đề b', isTrue: false },
            { key: 'c', text: 'Mệnh đề c', isTrue: true },
            { key: 'd', text: 'Mệnh đề d', isTrue: false }
          ],
          explanation: q.explanation || ''
        };
      } else if (qPart === 'part3') {
        return {
          id: baseId,
          part: 'part3',
          title: q.title || `Câu ${idx + 1} (Phần III - Trả lời ngắn)`,
          level: q.level || level,
          content: q.content || '',
          shortAnswer: String(q.shortAnswer || q.answer || '0'),
          explanation: q.explanation || ''
        };
      } else {
        return {
          id: baseId,
          part: 'part1',
          title: q.title || `Câu ${idx + 1} (Phần I - Trắc nghiệm 4 phương án)`,
          level: q.level || level,
          content: q.content || '',
          options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
          correctAnswerIndex: typeof q.correctAnswerIndex === 'number' && q.correctAnswerIndex >= 0 && q.correctAnswerIndex <= 3 ? q.correctAnswerIndex : 0,
          explanation: q.explanation || ''
        };
      }
    });
  } catch (err) {
    console.warn('Lỗi gọi Gemini AI tạo đề 2025 trực tiếp, chuyển sang bộ sinh đề sư phạm Heuristic 2025:', err);
    return generateHeuristic2025ExamQuestions({ subject, grade, topic, part, count, level, rawContext });
  }
}

// ==================== BỘ SINH CÂU HỎI SƯ PHẠM HEURISTIC GDPT 2018 (OFFLINE ENGINE) ====================
/**
 * Tự động tạo câu hỏi trắc nghiệm trò chơi lớp học khi chưa có API Key hoặc mất mạng
 */
export function generateHeuristicClassroomQuestions({
  subject = 'Toán học',
  grade = '10',
  topic = 'Khởi động bài học',
  count = 5,
  difficulty = 'Vừa sức',
  rawContext = ''
}) {
  const cleanTopic = topic || 'Kiến thức trọng tâm';
  const templates = [
    {
      content: `Trong chương trình ${subject} Lớp ${grade}, nội dung về "${cleanTopic}" nhằm phát triển năng lực cốt lõi nào sau đây của học sinh?`,
      options: [
        'Năng lực tư duy logic và giải quyết vấn đề sáng tạo',
        'Năng lực ghi nhớ máy móc các định lý lý thuyết',
        'Năng lực tính toán thụ động không liên hệ thực tiễn',
        'Năng lực tái hiện kiến thức cũ không cần vận dụng'
      ],
      correctAnswerIndex: 0,
      explanation: `Theo định hướng Chương trình GDPT 2018, môn ${subject} chú trọng phát triển năng lực tư duy, giải quyết vấn đề và vận dụng kiến thức vào thực tế cuộc sống.`
    },
    {
      content: `Khi tìm hiểu chuyên đề "${cleanTopic}" (Môn ${subject} - Khối ${grade}), khẳng định nào sau đây là ĐÚNG đắn nhất?`,
      options: [
        `Các nguyên lý cơ bản của "${cleanTopic}" có mối liên hệ mật thiết với các ứng dụng thực tế`,
        `Nội dung này hoàn toàn độc lập và không áp dụng được vào các bài toán thực tiễn`,
        `Chỉ cần nắm vững công thức mà không cần hiểu bản chất hiện tượng / định lý`,
        `Đây là nội dung giảm tải không cần đánh giá trong các kỳ thi`
      ],
      correctAnswerIndex: 0,
      explanation: `Kiến thức về ${cleanTopic} giúp học sinh xây dựng mô hình hóa toán học và khoa học thực nghiệm, là nền tảng đánh giá năng lực trong kỳ thi.`
    },
    {
      content: `Đâu là phương pháp tiếp cận hiệu quả nhất khi thực hiện nhiệm vụ học tập về "${cleanTopic}"?`,
      options: [
        'Chủ động phân tích dữ liệu, thảo luận nhóm và đối chiếu kết quả thực nghiệm',
        'Sao chép lời giải có sẵn mà không qua kiểm chứng logic',
        'Chỉ tập trung học vẹt định nghĩa trước giờ kiểm tra',
        'Bỏ qua các bước suy luận trung gian để chọn đáp án ngẫu nhiên'
      ],
      correctAnswerIndex: 0,
      explanation: 'Học tập tích cực, phân tích dữ liệu và hợp tác nhóm là phương pháp cốt lõi theo tinh thần dạy học tích cực tại THPT Cao Bá Quát.'
    },
    {
      content: `Một học sinh áp dụng kiến thức "${cleanTopic}" để giải quyết một bài toán thực tế đạt mức độ nhận thức "${difficulty}". Bước đầu tiên em cần làm là gì?`,
      options: [
        'Xác định rõ giả thiết, mục tiêu cần tìm và chuyển đổi bài toán về mô hình toán/khoa học phù hợp',
        'Bấm máy tính ngay lập tức mà không cần đọc kỹ yêu cầu đề bài',
        'Lựa chọn ngay một công thức bất kỳ rồi thay số vào tính',
        'Đợi giáo viên sửa bài mẫu rồi ghi nhớ đáp số'
      ],
      correctAnswerIndex: 0,
      explanation: 'Xác định mô hình hóa và phân tích giả thiết luôn là bước tiên quyết để giải quyết triệt để bất kỳ vấn đề thực tiễn nào.'
    },
    {
      content: `Ý nghĩa thực tiễn quan trọng nhất của việc nắm vững "${cleanTopic}" trong cuộc sống và định hướng nghề nghiệp là gì?`,
      options: [
        'Trang bị tư duy phản biện, khả năng ra quyết định dựa trên dữ liệu và thích ứng với thời đại số',
        'Chỉ để đạt điểm số trong kỳ thi trên lớp mà không có ứng dụng sau này',
        'Giúp học sinh làm bài tập nhanh hơn mà không cần hiểu nguyên lý',
        'Không có tác động đáng kể đến định hướng nghề nghiệp tương lai'
      ],
      correctAnswerIndex: 0,
      explanation: 'Chương trình GDPT 2018 định hướng phát triển phẩm chất, năng lực và kỹ năng giải quyết tình huống thực tế cho học sinh sẵn sàng bước vào đại học và thị trường lao động.'
    }
  ];

  const now = Date.now();
  const result = [];
  const targetCount = Math.max(1, Math.min(count, 15));

  for (let i = 0; i < targetCount; i++) {
    const tpl = templates[i % templates.length];
    result.push({
      id: `ai_heuristic_q_${now}_${i + 1}`,
      title: `Câu ${i + 1}`,
      content: tpl.content,
      options: tpl.options,
      correctAnswerIndex: tpl.correctAnswerIndex,
      explanation: tpl.explanation
    });
  }

  return result;
}

/**
 * Tự động tạo câu hỏi đề thi chuẩn cấu trúc Bộ GD&ĐT 2025 khi chưa có API Key hoặc mất mạng
 */
export function generateHeuristic2025ExamQuestions({
  subject = 'Toán',
  grade = '12',
  topic = 'Hàm số và ứng dụng đạo hàm',
  part = 'part1',
  count = 4,
  level = 'Thông hiểu',
  rawContext = ''
}) {
  const timestamp = Date.now();
  const cleanTopic = topic || 'Khảo sát và vẽ đồ thị hàm số';
  const targetCount = Math.max(1, Math.min(count, 12));
  const result = [];

  for (let i = 0; i < targetCount; i++) {
    const currentPart = part === 'mixed' 
      ? (i % 3 === 0 ? 'part1' : (i % 3 === 1 ? 'part2' : 'part3'))
      : part;

    const baseId = `ai_heuristic_exam_${timestamp}_${i + 1}`;

    if (currentPart === 'part2') {
      // Phần II: Đúng/Sai (4 ý a, b, c, d)
      result.push({
        id: baseId,
        part: 'part2',
        title: `Câu ${i + 1} (Phần II - Trắc nghiệm Đúng/Sai)`,
        level,
        content: `Cho hàm số $y = f(x) = x^3 - 3x^2 + 2$ liên tục trên $\\mathbb{R}$ liên quan đến chuyên đề "${cleanTopic}". Xét tính Đúng hoặc Sai của các mệnh đề sau:`,
        subItems: [
          { key: 'a', text: 'Hàm số đã cho đồng biến trên các khoảng $(-\\infty; 0)$ và $(2; +\\infty)$.', isTrue: true },
          { key: 'b', text: 'Điểm cực đại của đồ thị hàm số là tọa độ $(0; 2)$.', isTrue: true },
          { key: 'c', text: 'Giá trị cực tiểu của hàm số bằng $-3$.', isTrue: false },
          { key: 'd', text: 'Đồ thị hàm số cắt trục hoành tại đúng $3$ điểm phân biệt.', isTrue: true }
        ],
        explanation: 'Ta có $f\'(x) = 3x^2 - 6x = 3x(x - 2)$. $f\'(x) = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$. Do đó hàm số đồng biến trên $(-\\infty; 0)$ và $(2; +\\infty)$, cực đại tại $(0; 2)$, cực tiểu tại $(2; -2)$ (nên ý c sai vì giá trị cực tiểu là $-2$). Đồ thị cắt $Ox$ tại 3 nghiệm phân biệt.'
      });
    } else if (currentPart === 'part3') {
      // Phần III: Trả lời ngắn
      const answerVal = 2 + (i % 5);
      result.push({
        id: baseId,
        part: 'part3',
        title: `Câu ${i + 1} (Phần III - Trả lời ngắn)`,
        level,
        content: `Một doanh nghiệp sản xuất một loại sản phẩm với hàm chi phí $C(x) = x^2 + 40x + 100$ và hàm doanh thu $R(x) = 120x - x^2$ (triệu đồng), trong đó $x$ là số lượng sản phẩm ($x > 0$). Hãy tìm số sản phẩm $x$ để lợi nhuận đạt giá trị lớn nhất.`,
        shortAnswer: '20',
        explanation: 'Hàm lợi nhuận là $P(x) = R(x) - C(x) = (120x - x^2) - (x^2 + 40x + 100) = -2x^2 + 80x - 100$. Đây là tam thức bậc hai có đỉnh tại $x = -\\frac{b}{2a} = -\\frac{80}{2(-2)} = 20$. Vậy doanh nghiệp đạt lợi nhuận cực đại khi sản xuất $20$ sản phẩm.'
      });
    } else {
      // Phần I: 4 phương án lựa chọn
      result.push({
        id: baseId,
        part: 'part1',
        title: `Câu ${i + 1} (Phần I - Trắc nghiệm 4 phương án)`,
        level,
        content: `Cho hàm số $y = f(x)$ có bảng biến thiên trên đoạn $[-2; 3]$ với giá trị lớn nhất bằng $5$ tại $x = 1$ và giá trị nhỏ nhất bằng $-3$ tại $x = -2$. Giá trị của biểu thức $M + m$ bằng bao nhiêu?`,
        options: [
          '$M + m = 2$',
          '$M + m = 8$',
          '$M + m = -2$',
          '$M + m = 5$'
        ],
        correctAnswerIndex: 0,
        explanation: 'Theo giả thiết, giá trị lớn nhất $M = \\max_{[-2; 3]} f(x) = 5$ và giá trị nhỏ nhất $m = \\min_{[-2; 3]} f(x) = -3$. Suy ra $M + m = 5 + (-3) = 2$.'
      });
    }
  }

  return result;
}

