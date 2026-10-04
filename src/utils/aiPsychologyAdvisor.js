/**
 * CBQ PSYCHOLOGY & ACADEMIC AI ADVISOR SERVICE
 * Hệ thống Cố vấn Tâm lý Học đường, Phương pháp Nghiên cứu Khoa học & Hỗ trợ Học sinh
 * Trường THPT Cao Bá Quát - TP. Buôn Ma Thuột / Phường Tân An - Tỉnh Đắk Lắk
 */

export const PSYCHOLOGY_TOPICS = [
  {
    id: 'psychology',
    name: 'Tâm Lý & Cảm Xúc',
    icon: '🧠',
    color: '#8b5cf6',
    description: 'Giải tỏa áp lực thi cử, lo âu, stress, cân bằng tâm lý học đường'
  },
  {
    id: 'study_methods',
    name: 'Khoa Học Học Tập',
    icon: '📚',
    color: '#0284c7',
    description: 'Active Recall, Spaced Repetition, Kỹ thuật Feynman, Pomodoro'
  },
  {
    id: 'career_guidance',
    name: 'Hướng Nghiệp & Mục Tiêu',
    icon: '🎯',
    color: '#f59e0b',
    description: 'Trắc nghiệm Holland, Ikigai, chọn khối thi, định hướng nghề nghiệp'
  },
  {
    id: 'school_info',
    name: 'Trường Lớp & TKB',
    icon: '🏫',
    color: '#10b981',
    description: 'Tra cứu Thời khóa biểu, lịch học, câu lạc bộ, nội quy nhà trường'
  }
];

export const QUICK_PROMPTS = [
  {
    topic: 'psychology',
    label: '😰 Giải tỏa áp lực thi cử',
    prompt: 'Em đang cảm thấy rất căng thẳng và lo âu trước các bài kiểm tra sắp tới. Thầy/Cô có lời khuyên và bài tập nào giúp em bình tâm lại không?'
  },
  {
    topic: 'psychology',
    label: '⏳ Chữa bệnh trì hoãn',
    prompt: 'Em hay có thói quen nước đến chân mới nhảy, thường xuyên trì hoãn bài tập. Làm sao để vượt qua sự trì hoãn này theo góc nhìn tâm lý học?'
  },
  {
    topic: 'study_methods',
    label: '📖 Phương pháp Feynman',
    prompt: 'Kỹ thuật học tập Feynman là gì và học sinh cấp 3 có thể áp dụng vào các môn Tự nhiên hoặc Xã hội như thế nào?'
  },
  {
    topic: 'study_methods',
    label: '🔄 Active Recall & Lặp ngắt quãng',
    prompt: 'Làm thế nào để áp dụng Active Recall và Spaced Repetition vào việc ôn thi để nhớ lâu mà không bị học vẹt?'
  },
  {
    topic: 'career_guidance',
    label: '🧭 Chọn ngành nghề phù hợp',
    prompt: 'Em đang phân vân chưa biết mình hợp với ngành nghề nào. Em nên bắt đầu tự đánh giá bản thân (như thuyết Holland, Ikigai) từ đâu?'
  },
  {
    topic: 'school_info',
    label: '📅 Tra cứu TKB & Giờ học',
    prompt: 'Hướng dẫn em cách xem Thời khóa biểu của lớp và khung giờ 10 tiết học trên hệ thống nhà trường.'
  }
];

export const CBQ_SYSTEM_INSTRUCTION = `Bạn là "Chuyên gia Tư vấn Tâm lý Học đường & Cố vấn Phương pháp Học tập Khoa học" của Trường THPT Cao Bá Quát (TP. Buôn Ma Thuột, Tỉnh Đắk Lắk).

VAI TRÒ VÀ TÔN CHỈ:
1. ĐỒNG CẢM VÀ LẮNG NGHE SÂU: Luôn xưng hô thân mật, gần gũi (thầy/cô hoặc mình - bạn/em), giữ thái độ ấm áp, tôn trọng, không phán xét.
2. VẬN DỤNG TÂM LÝ HỌC HIỆN ĐẠI:
   - Liệu pháp Nhận thức - Hành vi (CBT): Giúp học sinh nhận diện những suy nghĩ tiêu cực hoặc bẫy tư duy (như khái quát hóa quá mức, cầu toàn độc hại) và tái cấu trúc nhận thức (Cognitive Reframing).
   - Tâm lý học tích cực (Positive Psychology): Xây dựng lòng kiên cường (Resilience), nuôi dưỡng điểm mạnh nội tại.
   - Chánh niệm học đường (Mindfulness): Hướng dẫn các bài tập thở (4-7-8, Box Breathing), kỹ thuật định tâm 5-4-3-2-1 để làm dịu cơn hoảng loạn, lo âu tức thì.
3. KHOA HỌC NÃO BỘ & PHƯƠNG PHÁP HỌC TẬP (Neuroscience of Learning):
   - Kỹ thuật Feynman: Học qua cách giảng giải đơn giản.
   - Active Recall & Spaced Repetition (Hermann Ebbinghaus): Chủ động truy xuất kiến thức, ôn tập ngắt quãng.
   - Pomodoro & Nhịp sinh học Ultradian 90 phút: Quản lý năng lượng thay vì chỉ quản lý thời gian.
   - Ma trận Eisenhower & Quy tắc 2 phút để đánh bại sự trì hoãn.
4. HƯỚNG NGHIỆP: Sử dụng thuyết Mật mã Holland (RIASEC) và mô hình Ikigai để giúp học sinh định hướng ngành nghề dựa trên sự giao thoa giữa đam mê, năng lực và nhu cầu xã hội.
5. AN TOÀN TÂM LÝ: Luôn giữ bảo mật. Nếu học sinh có biểu hiện khủng hoảng nghiêm trọng hoặc có ý định tự hại, hãy nhẹ nhàng khuyên học sinh liên hệ ngay với thầy cô chủ nhiệm, phòng tư vấn tâm lý nhà trường, gia đình hoặc đường dây nóng quốc gia bảo vệ trẻ em 111.

Phong cách trình bày: Rõ ràng, gãy gọn, có cấu trúc (gạch đầu dòng, bài tập thực hành dễ làm ngay), ngôn từ trong sáng, khích lệ tinh thần.`;

/**
 * Lấy API Key từ LocalStorage hoặc Env
 */
export function getStoredAiKey() {
  const local = localStorage.getItem('cbq_ai_api_key');
  if (local && local.trim()) return local.trim();
  if (import.meta.env?.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
  return '';
}

export function saveStoredAiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem('cbq_ai_api_key', key.trim());
  } else {
    localStorage.removeItem('cbq_ai_api_key');
  }
}

/**
 * GỌI TRỰC TIẾP GOOGLE GEMINI API (HỖ TRỢ MULTI-TURN CONVERSATION)
 */
export async function callGeminiChat(messages = [], systemPrompt = CBQ_SYSTEM_INSTRUCTION) {
  const apiKey = getStoredAiKey();
  if (!apiKey) {
    return {
      success: false,
      error: 'NO_API_KEY',
      fallbackText: getOfflinePsychologyAnswer(messages[messages.length - 1]?.text || '')
    };
  }

  // Chuyển đổi định dạng hội thoại sang format chuẩn của Gemini API
  // Gemini expects: [{ role: 'user' | 'model', parts: [{ text: '...' }] }]
  const contents = [];
  
  // Lấy tối đa 10 tin nhắn gần nhất để giữ context mạch lạc mà không tốn token
  const recentMessages = messages.slice(-10);
  
  recentMessages.forEach((msg, idx) => {
    const role = msg.sender === 'user' ? 'user' : 'model';
    // Đảm bảo tin nhắn đầu tiên trong contents luôn là của 'user'
    if (contents.length === 0 && role === 'model') return;
    
    // Nếu 2 tin nhắn liên tiếp cùng role, gộp nội dung lại
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += `\n${msg.text}`;
    } else {
      contents.push({
        role,
        parts: [{ text: msg.text }]
      });
    }
  });

  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: 'Xin chào Trợ lý AI CBQ' }] });
  }

  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return { success: true, text, model };
        }
      }
    } catch (err) {
      console.warn(`Lỗi khi gọi model ${model}:`, err);
    }
  }

  // Fallback nếu gọi mạng thất bại
  return {
    success: false,
    error: 'NETWORK_OR_QUOTA_ERROR',
    fallbackText: getOfflinePsychologyAnswer(messages[messages.length - 1]?.text || '')
  };
}

/**
 * HỆ TRI THỨC TÂM LÝ HỌC ĐƯỜNG & HỌC VỤ OFFLINE (HYBRID EXPERT ENGINE)
 * Phản hồi chi tiết, sâu sắc, có cấu trúc ngay cả khi không có mạng hoặc chưa nhập API Key
 */
export function getOfflinePsychologyAnswer(query = '') {
  const lower = query.toLowerCase().trim();

  // 1. Áp lực thi cử / Stress / Căng thẳng / Lo âu
  if (lower.includes('áp lực') || lower.includes('stress') || lower.includes('lo lắng') || lower.includes('căng thẳng') || lower.includes('lo âu') || lower.includes('sợ thi') || lower.includes('mệt mỏi')) {
    return `### 🌿 Cân Bằng Cảm Xúc & Giải Tỏa Áp Lực Thi Cử

Thầy/Cô rất thấu hiểu cảm giác này của em. Áp lực thi cử là phản ứng tự nhiên khi em thực sự quan tâm đến kết quả, nhưng đừng để nó chi phối tâm trí em nhé! Dưới đây là 3 giải pháp tâm lý học em có thể áp dụng ngay:

1. **Bài tập thở 4-7-8 (Làm dịu hệ thần kinh trong 60 giây):**
   - Hít vào chậm bằng mũi trong **4 giây**.
   - Giữ hơi thở lại trong **7 giây**.
   - Thở ra từ từ bằng miệng trong **8 giây**.
   *(Lặp lại 4 lần: Não bộ sẽ nhận tín hiệu an toàn và giảm hormone Cortisol gây căng thẳng).*

2. **Kỹ thuật "Tái cấu trúc nhận thức" (CBT):**
   - Thay vì nghĩ: *"Nếu mình không làm tốt bài này, mọi thứ sẽ sụp đổ"* ➔ Hãy đổi thành: *"Bài thi này là cơ hội để mình xem kiến thức mình đã tích lũy đến đâu, sai ở đâu mình sửa ở đó, nó không định nghĩa toàn bộ giá trị con người mình"*.

3. **Ngủ đủ giấc trước ngày thi:**
   - Khi ngủ sâu, não bộ (vùng hồi hải mã) mới tiến hành sắp xếp và củng cố các liên kết nơ-ron để ghi nhớ lâu. Thức đêm sát ngày thi sẽ làm giảm 40% khả năng nhớ lại kiến thức!

*Em hãy uống một ngụm nước ấm, hít một hơi thật sâu và tự nhủ: "Mình đang làm rất tốt từng ngày rồi!" nhé.*`;
  }

  // 2. Trì hoãn / Lười / Thiếu động lực / Nước đến chân mới nhảy
  if (lower.includes('trì hoãn') || lower.includes('lười') || lower.includes('mất động lực') || lower.includes('nước đến chân') || lower.includes('không muốn học') || lower.includes('chán nản')) {
    return `### ⚡ Chiến Thuật Tâm Lý Vượt Qua Sự Trì Hoãn

Theo tâm lý học hành vi, **trì hoãn không phải vì em lười**, mà là do não bộ đang né tránh cảm giác sợ thất bại, sợ bài tập quá khó hoặc quá nhiều. Để "đánh lừa" bộ não, em hãy dùng các vũ khí sau:

1. **Quy tắc 2 phút (The 2-Minute Rule):**
   - Đừng nghĩ đến việc phải học trọn 3 tiếng. Hãy tự nhủ: *"Mình chỉ mở sách ra và ngồi vào bàn học đúng 2 phút thôi"*.
   - Sau khi vượt qua được sức ỳ ban đầu, 80% trường hợp não bộ sẽ tiếp tục làm việc mà không còn cảm giác nặng nề.

2. **Kỹ thuật Pomodoro khoa học:**
   - Đặt đồng hồ đúng **25 phút**: Cất điện thoại ra xa, chỉ làm 1 việc duy nhất.
   - Hết 25 phút: Nghỉ ngơi trọn vẹn **5 phút** (đứng dậy vươn vai, uống nước).
   - Lặp lại 4 chu kỳ rồi nghỉ dài 15-20 phút.

3. **Chia nhỏ bài toán (Chunking):**
   - Thay vì ghi vào sổ: *"Ôn thi môn Hóa"*, hãy ghi cụ thể: *"Làm 5 câu trắc nghiệm este"*. Mục tiêu càng nhỏ và rõ ràng, não bộ càng ít phản kháng.

*Hành động sinh ra động lực, chứ không phải đợi có động lực rồi mới hành động. Thử ngay 5 phút bây giờ em nhé!*`;
  }

  // 3. Phương pháp Feynman
  if (lower.includes('feynman') || lower.includes('kỹ thuật feynman')) {
    return `### 🧠 Kỹ Thuật Feynman: Phương Pháp Học Siêu Đẳng Của Nhà Bác Học

Kỹ thuật Feynman dựa trên nguyên lý: **"Nếu bạn không thể giải thích điều gì đó cho một đứa trẻ 10 tuổi hiểu, thì bản thân bạn vẫn chưa thực sự hiểu nó."**

Gồm 4 bước thực hành:
1. **Bước 1 - Chọn chủ đề:** Viết tên bài học/khái niệm lên đầu trang giấy trắng.
2. **Bước 2 - Giảng lại như một giáo viên:**
   - Tự diễn giải lại khái niệm đó bằng ngôn ngữ của chính mình.
   - **Quy tắc vàng:** Tuyệt đối không dùng thuật ngữ cao siêu hay sao chép nguyên văn SGK.
3. **Bước 3 - Nhận diện lỗ hổng kiến thức:**
   - Chỗ nào em bị ngắc ngứ, không giải thích trôi chảy được ➔ Đó chính là lỗ hổng kiến thức!
   - Mở sách/tài liệu xem lại đúng chỗ đó cho đến khi thông suốt.
4. **Bước 4 - Đơn giản hóa và dùng ví dụ tương đồng:**
   - Dùng ví dụ đời thường (ví dụ: dòng điện như dòng nước chảy qua ống nước có van cản trở).

*Áp dụng cách này khi học Toán, Lý, Hóa, Sinh hoặc các bài Luận Văn sẽ giúp em nhớ sâu nhiều năm mà không sợ quên!*`;
  }

  // 4. Active Recall & Spaced Repetition (Ôn tập chủ động & Lặp ngắt quãng)
  if (lower.includes('active recall') || lower.includes('spaced repetition') || lower.includes('nhớ lâu') || lower.includes('lặp ngắt quãng') || lower.includes('học vẹt') || lower.includes('quên')) {
    return `### 📈 Bí Quyết Nhớ Lâu: Active Recall & Spaced Repetition

Khoa học não bộ đã chứng minh: **Đọc đi đọc lại (Passive Reading)** chỉ tạo cảm giác ảo rằng mình đã hiểu, nhưng vào phòng thi thì quên sạch. Hai phương pháp số 1 thế giới để khắc phục là:

1. **Active Recall (Chủ động truy xuất thông tin):**
   - Đọc xong 1 trang sách ➔ **Gập sách lại ngay** và tự hỏi: *"Trang vừa rồi nói về những ý chính nào?"*.
   - Viết ra nháp hoặc tự nhẩm lại. Não bộ càng phải "vận nội công" để lôi kiến thức ra, đường mòn nơ-ron thần kinh càng được khắc sâu bấy nhiêu.
   - Tự tạo Flashcard câu hỏi - câu trả lời thay vì đọc bài giải sẵn.

2. **Spaced Repetition (Lặp lại ngắt quãng theo đường cong quên lãng Ebbinghaus):**
   - Não người quên 70% kiến thức chỉ sau 24-48 giờ nếu không ôn tập.
   - **Lịch ôn tập vàng:**
     - Lần 1: Ôn lại sau **1 ngày** (mất 5 phút).
     - Lần 2: Ôn lại sau **3 ngày** (mất 3 phút).
     - Lần 3: Ôn lại sau **7 ngày**.
     - Lần 4: Ôn lại sau **30 ngày**.
   - Mỗi lần chỉ cần nhìn câu hỏi và nhớ lại (Active Recall), em sẽ chuyển kiến thức từ trí nhớ ngắn hạn sang trí nhớ vĩnh viễn!`;
  }

  // 5. Hướng nghiệp / Chọn ngành / Khối thi / Holland / Ikigai
  if (lower.includes('hướng nghiệp') || lower.includes('chọn ngành') || lower.includes('chọn nghề') || lower.includes('chọn khối') || lower.includes('holland') || lower.includes('ikigai') || lower.includes('tương lai')) {
    return `### 🧭 Định Hướng Nghề Nghiệp: Thuyết Holland & Mô Hình Ikigai

Để chọn được ngành nghề bền vững và hạnh phúc, em hãy đối chiếu qua 2 mô hình khoa học sau:

#### 1. Mật mã Holland (RIASEC) - Em thuộc nhóm nào?
* **R (Realistic - Thực tế/Kỹ thuật):** Thích máy móc, công nghệ, công cụ, vận động ngoài trời (Công nghệ, Kỹ thuật, Cơ khí...).
* **I (Investigative - Nghiên cứu/Khám phá):** Thích quan sát, phân tích số liệu, khoa học, tư duy logic (Y dược, Khoa học dữ liệu, Lập trình...).
* **A (Artistic - Nghệ thuật/Sáng tạo):** Thích tự do, ý tưởng mới, thiết kế, viết lách, hội họa, âm nhạc.
* **S (Social - Xã hội/Giúp đỡ):** Thích giao tiếp, giảng dạy, tư vấn, chăm sóc người khác (Sư phạm, Tâm lý, Y tế, Xã hội...).
* **E (Enterprising - Quản lý/Lãnh đạo):** Thích kinh doanh, thuyết phục, quản trị, khởi nghiệp.
* **C (Conventional - Nghiệp vụ/Chi tiết):** Cẩn thận, thích số liệu, quy trình rõ ràng (Tài chính, Kế toán, Ngân hàng, Hành chính).

#### 2. Thước đo Ikigai (Lý do thức dậy mỗi sớm mai):
Ngành nghề lý tưởng nằm ở giao điểm của 4 vòng tròn:
1. Thứ em **ĐAM MÊ** (yêu thích làm).
2. Thứ em **CÓ THẾ MẠNH** (làm giỏi hơn người khác).
3. Thứ **XÃ HỘI ĐANG CẦN**.
4. Thứ **TẠO RA THU NHẬP** để nuôi sống bản thân.

*Em có thể tự chấm điểm từ 1-10 cho các nhóm trên để tìm ra hướng đi rõ ràng nhất nhé!*`;
  }

  // 6. Thời khóa biểu / Lịch học / Giờ học / Trường Cao Bá Quát
  if (lower.includes('thời khóa biểu') || lower.includes('tkb') || lower.includes('giờ học') || lower.includes('tiết học') || lower.includes('lịch học') || lower.includes('cao bá quát')) {
    return `### 🏫 Hướng Dẫn Tra Cứu Thời Khóa Biểu & Khung Giờ Học CBQ

Hệ thống điều hành Trường THPT Cao Bá Quát hỗ trợ tra cứu trực tuyến toàn diện:

1. **Xem TKB Lớp của em:**
   - Chọn tab **"🎓 TKB Lớp"** trên thanh điều hướng.
   - Chọn đúng mã lớp (ví dụ: 10A01, 11A02, 12A05...).
   - Bảng thời khóa biểu sẽ hiển thị đầy đủ môn học, giáo viên bộ môn và phòng học.

2. **Khung Giờ 10 Tiết Học Chuẩn (LIVE Thời Gian Thực):**
   - **☀️ Ca Sáng (Tiết 1 – 5):** 07:00 – 11:05 (Ra chơi 15 phút giữa tiết 2 và 3).
   - **🌤️ Ca Chiều (Tiết 6 – 10):** 13:30 – 17:45 (Ra chơi 15 phút giữa tiết 7 và 8).
   - Ô môn học đang diễn ra trong ngày sẽ tự động sáng đèn nhấp nháy **\`● LIVE\`** và đếm ngược số phút còn lại theo thời gian thực!

3. **Xem Bảng Khung Giờ:** Bấm nút **\`⏰ Khung Giờ Học\`** trên đầu trang để mở bảng tra cứu chi tiết giờ vào lớp - giờ tan học.`;
  }

  // 7. Mặc định / Lời chào hỏi hoặc câu hỏi khác
  return `Chào bạn! Mình là **Trợ lý AI & Cố vấn Học đường** của Trường THPT Cao Bá Quát.

Mình có thể đồng hành và hỗ trợ bạn trong các lĩnh vực:
* 🧠 **Tâm lý & Cảm xúc:** Lắng nghe, giải tỏa áp lực thi cử, lo âu, cân bằng cuộc sống tuổi học trò.
* 📚 **Khoa học học tập:** Hướng dẫn kỹ thuật Feynman, Active Recall, Spaced Repetition, trị bệnh trì hoãn.
* 🎯 **Hướng nghiệp & Mục tiêu:** Khám phá năng lực theo trắc nghiệm Holland, Ikigai, chọn khối & ngành.
* 🏫 **Thông tin nhà trường:** Hướng dẫn tra cứu Thời khóa biểu, lịch công tác, quy chế học tập.

*Bạn đang gặp khó khăn hay cần mình chia sẻ về điều gì cứ tự nhiên tâm sự nhé!*`;
}
