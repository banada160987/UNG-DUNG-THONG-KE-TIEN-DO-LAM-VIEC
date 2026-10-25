/**
 * ỨNG DỤNG ĐIỀU HÀNH & TIỆN ÍCH SỐ THPT CAO BÁ QUÁT
 * Bộ Dịch Vụ Trợ Lý AI Sư Phạm & Quản Trị Khóa API Cá Nhân (BYOK - Bring Your Own Key)
 * Hỗ trợ Google Gemini API (1.5 Flash, 2.0 Flash, 1.5 Pro)
 * Cho phép Giáo viên tự gán API Key miễn phí từ Google AI Studio hoặc dùng mặc định của trường
 */

export const AI_MODELS = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Khuyên dùng)', desc: 'Siêu tốc, ổn định, miễn phí 100%, phản hồi < 1 giây' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Thế hệ mới)', desc: 'Mới nhất 2026, suy luận logic sư phạm vượt trội' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Chuyên sâu)', desc: 'Xử lý tài liệu dài, bài toán khó và ma trận đề thi phức tạp' }
];

const DEFAULT_MODEL = 'gemini-1.5-flash';
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
    if (key && key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    if (model) {
      localStorage.setItem(STORAGE_MODEL_KEY, model);
    }
    // Bắn sự kiện để tất cả các component/tab trên màn hình tự cập nhật tức thì
    window.dispatchEvent(new CustomEvent('cbq_ai_key_updated', {
      detail: { hasKey: Boolean(key && key.trim()), model }
    }));
  } catch (e) {
    console.error('Lỗi lưu trữ AI key:', e);
  }
}

/**
 * Kiểm tra kết nối API Key trực tiếp với Google Gemini
 */
export async function testGeminiConnection(customKey = null, customModel = null) {
  const apiKey = (customKey !== null ? customKey : getStoredAiKey())?.trim();
  const model = customModel || getStoredAiModel();

  if (!apiKey) {
    return {
      success: false,
      error: 'Vui lòng nhập API Key để kiểm tra.'
    };
  }

  const startTime = Date.now();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || `Mã lỗi HTTP ${response.status}`;
      return {
        success: false,
        latencyMs,
        error: `Kết nối không thành công (${errMsg}). Vui lòng kiểm tra lại Key từ Google AI Studio.`
      };
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      success: true,
      latencyMs,
      model,
      replyText: replyText.trim(),
      message: `Kết nối thành công! Độ trễ phản hồi: ${latencyMs}ms.`
    };
  } catch (err) {
    return {
      success: false,
      error: 'Không thể kết nối đến máy chủ Google Gemini. Vui lòng kiểm tra kết nối Internet.'
    };
  }
}

/**
 * GỌI TRỰC TIẾP GOOGLE GEMINI AI VỚI NỘI DUNG TÙY BIẾN
 */
export async function callGeminiRaw({ prompt, systemInstruction = '', temperature = 0.4, jsonMode = false, model = null }) {
  const apiKey = getStoredAiKey();
  const targetModel = model || getStoredAiModel();

  if (!apiKey) {
    throw new Error('Chưa cấu hình API Key. Thầy/Cô vui lòng bấm biểu tượng Trợ lý AI để gán Key miễn phí từ Google AI Studio.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

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

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyPayload)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Lỗi gọi Gemini API (HTTP ${response.status})`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.trim();
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

  const rawJson = await callGeminiRaw({
    prompt: userPrompt,
    systemInstruction: systemPrompt,
    temperature: 0.3,
    jsonMode: true
  });

  try {
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
    console.error('Lỗi parse JSON câu hỏi AI:', err, rawJson);
    throw new Error('AI sinh câu hỏi chưa khớp định dạng chuẩn. Thầy/Cô vui lòng thử lại.');
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
}

