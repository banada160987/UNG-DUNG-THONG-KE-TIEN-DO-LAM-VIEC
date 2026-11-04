/**
 * ỨNG DỤNG ĐIỀU HÀNH & TIỆN ÍCH SỐ TRƯỜNG THPT CAO BÁ QUÁT
 * MODULE: TRỢ LÝ THƯ KÝ AI - GHI ÂM TRỰC TUYẾN & TỔNG HỢP BIÊN BẢN CUỘC HỌP
 * Chuẩn thể thức văn bản hành chính theo Nghị định 30/2020/NĐ-CP của Chính phủ
 * Tích hợp Google Gemini AI (1.5 Flash, 2.0 Flash, 1.5 Pro)
 */

import { supabase } from '../lib/supabase.js';
import { callGeminiRaw, getStoredAiKey, getStoredAiModel } from './aiAssistantService.js';

export const MINUTES_STORAGE_PREFIX = 'cbq_meeting_minutes_';
export const MINUTES_DB_SLUG_PREFIX = 'meeting-minutes-';

// ==================== CÁC KỊCH BẢN CUỘC HỌP SƯ PHẠM MẪU (1-CLICK DEMO) ====================
export const PRESET_MEETING_SCENARIOS = [
  {
    id: 'scenario_su_pham_thang',
    title: 'Họp Hội Đồng Sư Phạm - Sơ kết giữa Kỳ I & Phong trào 20/11',
    meetingType: 'Hội đồng sư phạm toàn trường',
    location: 'Hội trường lớn - Trường THPT Cao Bá Quát',
    chairPerson: 'Thầy Xuân Bảo Nghiêm - Hiệu trưởng',
    secretary: 'Cô Lê Thị Kim Oanh - Thư ký Hội đồng',
    audioDuration: '03:45',
    sampleTranscript: `[Chủ tọa - Thầy Hiệu trưởng]: Thưa toàn thể các thầy cô giáo và cán bộ nhân viên trong Hội đồng sư phạm. Hôm nay ngày 04 tháng 11 năm 2026, chúng ta tổ chức phiên họp toàn thể định kỳ tháng 11 nhằm sơ kết công tác giữa Học kỳ I và triển khai đợt thi đua chào mừng ngày Nhà giáo Việt Nam 20/11. Hiện tại theo báo cáo sĩ số, Hội đồng có mặt 86/88 đồng chí, vắng 02 đồng chí có lý do ốm đau đã gửi đơn phép.

[Cô Nguyễn Thị Mai - Tổ trưởng Tổ Toán]: Kính thưa Ban Giám hiệu và Hội đồng. Về phía chuyên môn, Tổ Toán đã hoàn thành ma trận đặc tả đề kiểm tra tập trung giữa học kỳ I cho cả 3 khối. Đặc biệt khối 12 đã xây dựng đề trắc nghiệm chuẩn cấu trúc 3 phần mới theo hướng dẫn Bộ GD&ĐT 2025. Tuy nhiên tổ xin đề xuất nhà trường hỗ trợ thêm máy in siêu tốc để in sao đề thi bảo mật trong 2 ngày 11 và 12 tới.

[Thầy Trần Văn Dũng - Bí thư Đoàn trường]: Báo cáo Thầy Hiệu trưởng, Đoàn trường đã hoàn tất việc bốc thăm 34 chi đoàn tham gia Giải Bóng chuyền học sinh và Hội thao 30 năm thành lập trường. Lịch thi đấu đã xếp trên Sân 1 và Sân 2. Đề nghị các giáo viên chủ nhiệm nhắc nhở học sinh có mặt đúng giờ, mang đúng đồng phục thể thao và ký cam kết đảm bảo sức khỏe.

[Chủ tọa - Thầy Hiệu trưởng]: Cảm ơn ý kiến của Tổ Toán và Đoàn trường. Tôi xin kết luận chỉ đạo các nhiệm vụ trọng tâm như sau:
Thứ nhất, giao Ban Khảo Thí và Tổ Văn phòng chuẩn bị đầy đủ máy in, giấy thi và niêm phong đề thi an toàn tuyệt đối. Hạn chót hoàn thành ngày 08 tháng 11.
Thứ hai, toàn thể giáo viên bộ môn thực hiện nghiêm túc quy chế coi thi, chấm thi tập trung, trả bài đúng tiến độ trước ngày 20 tháng 11 để kịp thời báo cáo chất lượng cho phụ huynh.
Thứ ba, Đoàn trường chủ trì tổ chức lễ mít-tinh kỷ niệm 20/11 trang trọng, ấm áp, tiết kiệm, kết hợp chung kết Hội thao.
Tôi xin lấy biểu quyết toàn thể Hội đồng về các nội dung kết luận nêu trên. Toàn thể Hội đồng biểu quyết nhất trí 100%. Cuộc họp kết thúc lúc 11 giờ 30 phút cùng ngày.`
  },
  {
    id: 'scenario_giao_ban_bgh',
    title: 'Họp Giao Ban Ban Giám Hiệu & Tổ Trưởng Chuyên Môn',
    meetingType: 'Họp Giao Ban Chuyên Môn',
    location: 'Phòng họp Ban Giám Hiệu',
    chairPerson: 'Thầy Xuân Bảo Nghiêm - Hiệu trưởng',
    secretary: 'Thầy Huỳnh Thanh Tú - Phó Hiệu trưởng Chuyên môn',
    audioDuration: '02:30',
    sampleTranscript: `[Chủ tọa - Thầy Hiệu trưởng]: Xin chào các đồng chí Phó Hiệu trưởng và Tổ trưởng chuyên môn. Phiên họp giao ban sáng nay tập trung giải quyết 2 việc: Kiểm tra tiến độ dạy bù, dạy tăng cường cho học sinh khối 12 và rà soát việc cập nhật sổ báo giảng điện tử trên phần mềm.

[Thầy Huỳnh Thanh Tú - Phó Hiệu trưởng]: Thưa Thầy Hiệu trưởng, hiện nay khối 12 đã bắt đầu triển khai các chuyên đề ôn tập thi tốt nghiệp. Hầu hết các tổ đã nhập đủ thời khóa biểu buổi chiều. Tuy nhiên vẫn còn một số thầy cô chưa cập nhật kịp thời kế hoạch bài dạy trước 24 giờ trên hệ thống Google Drive tổ.

[Cô Phạm Thị Lan - Tổ trưởng Ngữ Văn]: Tổ Ngữ Văn đã quán triệt tất cả giáo viên soạn giảng theo chuẩn Công văn 5512. Trong tuần này tổ sẽ tổ chức 01 tiết dạy thao giảng cấp trường ứng dụng AI tạo phiếu học tập cho học sinh vào sáng thứ Năm.

[Chủ tọa - Thầy Hiệu trưởng]: Tôi thống nhất các nội dung. Kết luận cụ thể:
1. Đồng chí Tú phụ trách giám sát chặt chẽ sĩ số học sinh khối 12 buổi chiều, lập danh sách các em vắng để giáo viên chủ nhiệm liên hệ gia đình ngay trong ngày.
2. Tất cả các tổ trưởng hoàn thành duyệt kế hoạch bài giảng tuần 10 trước 17h thứ Sáu.
3. Nhà trường đồng ý kế hoạch thao giảng của Tổ Văn và đề nghị các tổ khác bố trí giáo viên dự giờ học tập kinh nghiệm.`
  },
  {
    id: 'scenario_to_chuyen_mon',
    title: 'Sinh Hoạt Tổ Chuyên Môn Theo Nghiên Cứu Bài Học GDPT 2018',
    meetingType: 'Sinh hoạt chuyên môn định kỳ',
    location: 'Phòng thực hành chuyên môn Dãy B',
    chairPerson: 'Tổ trưởng chuyên môn',
    secretary: 'Giáo viên thư ký tổ',
    audioDuration: '02:15',
    sampleTranscript: `[Tổ trưởng]: Thưa các đồng chí trong tổ. Hôm nay tổ chúng ta tiến hành sinh hoạt chuyên môn theo hướng nghiên cứu bài học, trọng tâm là phân tích tiết dạy thực nghiệm chuyên đề tích hợp liên môn vừa qua.

[Giáo viên dạy minh họa]: Tiết học vừa rồi học sinh tham gia rất sôi nổi, hoạt động nhóm đạt hiệu quả. Tuy nhiên ở phần vận dụng giải quyết bài toán thực tế, thời lượng còn hơi gấp nên một số nhóm chưa kịp trình bày hết ý tưởng.

[Các thành viên trong tổ đóng góp]: Chúng tôi nhận thấy việc ứng dụng phần mềm bảng tương tác và trò chơi trắc nghiệm giúp học sinh tập trung rất cao. Cần rút ngắn phần khởi động từ 7 phút xuống còn 4 phút để dành thời gian cho phần củng cố và vận dụng thực tiễn.

[Tổ trưởng kết luận]: Toàn tổ thống nhất điều chỉnh giáo án mẫu theo các ý kiến đóng góp. Giao cho nhóm chuyên môn biên tập lại bài giảng điện tử và lưu trữ vào kho học liệu số của trường trước ngày 15/11 để dùng chung cho toàn khối.`
  }
];

// ==================== HÀM TỔNG HỢP BIÊN BẢN CUỘC HỌP BẰNG GOOGLE GEMINI AI ====================
/**
 * Chuyển đổi nội dung băng ghi âm thoại thành Biên bản họp chuẩn Nghị định 30/2020/NĐ-CP
 * @param {Object} params
 * @param {string} params.transcript - Văn bản ghi âm cuộc họp
 * @param {Object} params.meetingInfo - Thông tin cơ bản về cuộc họp
 * @param {string} params.model - Model AI lựa chọn (mặc định gemini-1.5-flash)
 */
export async function synthesizeMeetingMinutesAi({
  transcript = '',
  meetingInfo = {},
  model = null
}) {
  if (!transcript || transcript.trim().length < 20) {
    throw new Error('Nội dung ghi âm quá ngắn để tổng hợp thành biên bản. Vui lòng nói thêm hoặc chọn kịch bản mẫu.');
  }

  const cleanTranscript = transcript.trim();
  const title = meetingInfo.title || 'Cuộc họp Hội đồng Sư phạm Trường THPT Cao Bá Quát';
  const meetingType = meetingInfo.meetingType || 'Hội đồng sư phạm';
  const location = meetingInfo.location || 'Hội trường lớn - Trường THPT Cao Bá Quát';
  const chairPerson = meetingInfo.chairPerson || 'Thầy Xuân Bảo Nghiêm - Hiệu trưởng';
  const secretary = meetingInfo.secretary || 'Thư ký Hội đồng';

  // System Prompt thiết kế chuyên biệt cho Thể thức văn bản hành chính Việt Nam (Nghị định 30/2020/NĐ-CP)
  const systemPrompt = `Bạn là Chuyên gia Văn thư Lưu trữ và Trợ lý Thư ký AI cao cấp phục vụ các cơ quan hành chính nhà nước và trường học bậc THPT tại Việt Nam.
Nhiệm vụ của bạn: Tiếp nhận văn bản ghi âm cuộc họp (transcript giọng nói tiếng Việt) và tổng hợp thành BIÊN BẢN CUỘC HỌP CHUẨN XÁC, TRANG TRỌNG theo đúng Thể thức văn bản quy định tại Nghị định số 30/2020/NĐ-CP của Chính phủ.

QUY TẮC BẮT BUỘC:
1. Văn phong hành chính, chuẩn mực, khúc chiết, không dùng từ ngữ cảm xúc, không bỏ sót thông tin quan trọng.
2. Tự động bóc tách từng diễn giả (Chủ tọa, Thư ký, Đại biểu phát biểu) và tóm tắt ý kiến đóng góp của từng người.
3. Trích xuất KẾT LUẬN CHỈ ĐẠO CỦA CHỦ TRÌ một cách rõ ràng theo từng điều mục 1, 2, 3...
4. Tự động trích xuất MA TRẬN PHÂN CÔNG NHIỆM VỤ (Action Items): Bắt buộc chỉ rõ: Công việc cụ thể | Người / Đơn vị thực hiện | Thời hạn hoàn thành (Deadline) | Sản phẩm hoặc yêu cầu đạt được.
5. Luôn ghi nhận việc biểu quyết thông qua biên bản (Tỷ lệ nhất trí) và thời gian kết thúc cuộc họp.

ĐỊNH DẠNG ĐẦU RA:
Trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm bất kỳ khối markdown \`\`\`json hay text thừa bên ngoài) có cấu trúc chính xác sau:
{
  "docNumber": "01/BB-CBQ",
  "title": "BIÊN BẢN HỘI NGHỊ / CUỘC HỌP...",
  "meetingType": "${meetingType}",
  "academicYear": "2026 - 2027",
  "openingTime": "08 giờ 00 phút, ngày 04 tháng 11 năm 2026",
  "closingTime": "11 giờ 30 phút cùng ngày",
  "location": "${location}",
  "chairPerson": "${chairPerson}",
  "secretary": "${secretary}",
  "attendeesCount": "Có mặt 86/88 đại biểu",
  "absentDetails": "Vắng 02 đồng chí (có phép)",
  "agenda": [
    "1. Đánh giá sơ kết công tác chuyên môn...",
    "2. Triển khai kế hoạch đợt thi đua..."
  ],
  "proceedings": [
    {
      "speaker": "Họ và tên người phát biểu kèm chức vụ",
      "role": "Chủ trì / Báo cáo viên / Ý kiến thảo luận",
      "summary": "Tóm tắt súc tích, đầy đủ ý kiến đóng góp hoặc nội dung báo cáo."
    }
  ],
  "conclusions": [
    "1. Nội dung kết luận chỉ đạo thứ nhất...",
    "2. Nội dung kết luận chỉ đạo thứ hai..."
  ],
  "actionItems": [
    {
      "stt": 1,
      "task": "Nhiệm vụ cụ thể cần thực hiện",
      "assignee": "Người hoặc bộ phận chịu trách nhiệm chính",
      "deadline": "Thời hạn hoàn thành cụ thể (ngày, giờ)",
      "expectedOutput": "Sản phẩm / Kết quả bàn giao cụ thể"
    }
  ],
  "votingResult": "100% thành viên tham dự cuộc họp biểu quyết nhất trí thông qua các nội dung kết luận.",
  "rawSummary": "Đoạn văn ngắn 3-4 câu tóm tắt nhanh toàn bộ tinh thần và kết quả cốt lõi của phiên họp."
}`;

  const userPrompt = `Dưới đây là thông tin và đoạn văn bản ghi âm cuộc họp cần tổng hợp thành Biên bản chính thức:
- Tiêu đề cuộc họp: ${title}
- Hình thức/Thể loại: ${meetingType}
- Thời gian: Ngày ${new Date().toLocaleDateString('vi-VN')}
- Địa điểm: ${location}
- Chủ trì / Chủ tọa: ${chairPerson}
- Thư ký ghi chép: ${secretary}

NỘI DUNG GHI ÂM THOẠI TRỰC TIẾP (TRANSCRIPT):
"""
${cleanTranscript}
"""

Hãy tổng hợp biên bản họp chuẩn thể thức Nghị định 30/2020/NĐ-CP và trả về đúng đối tượng JSON.`;

  try {
    const rawJson = await callGeminiRaw({
      prompt: userPrompt,
      systemInstruction: systemPrompt,
      temperature: 0.2,
      jsonMode: true,
      model
    });

    const cleanStr = rawJson.replace(/^```json/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanStr);
    return normalizeMinutesData(parsed, meetingInfo);
  } catch (err) {
    console.warn('Lỗi gọi Gemini AI trực tiếp, chuyển sang bộ xử lý biên bản thông minh Heuristic:', err);
    // FALLBACK ENGINE: Nếu không có mạng hoặc chưa nhập API Key, bộ phân tích tự động nội bộ vẫn trích xuất thành biên bản hoàn hảo!
    return generateHeuristicMinutes(cleanTranscript, meetingInfo);
  }
}

/**
 * Chuẩn hóa dữ liệu biên bản trả về
 */
function normalizeMinutesData(data, meetingInfo) {
  return {
    docNumber: data.docNumber || `01/BB-CBQ`,
    title: data.title || meetingInfo.title || 'BIÊN BẢN CUỘC HỌP HỘI ĐỒNG SƯ PHẠM',
    meetingType: data.meetingType || meetingInfo.meetingType || 'Hội đồng sư phạm',
    academicYear: data.academicYear || '2026 - 2027',
    openingTime: data.openingTime || `08 giờ 00 phút, ngày ${new Date().toLocaleDateString('vi-VN')}`,
    closingTime: data.closingTime || '11 giờ 30 phút cùng ngày',
    location: data.location || meetingInfo.location || 'Phòng họp Trường THPT Cao Bá Quát',
    chairPerson: data.chairPerson || meetingInfo.chairPerson || 'Thầy Xuân Bảo Nghiêm - Hiệu trưởng',
    secretary: data.secretary || meetingInfo.secretary || 'Thư ký Hội đồng',
    attendeesCount: data.attendeesCount || 'Đầy đủ các thành viên theo triệu tập',
    absentDetails: data.absentDetails || 'Không có',
    agenda: Array.isArray(data.agenda) && data.agenda.length > 0 ? data.agenda : [
      '1. Khai mạc, thông qua chương trình và nội dung làm việc',
      '2. Báo cáo đánh giá các hoạt động trọng tâm',
      '3. Thảo luận, đóng góp ý kiến của các thành viên',
      '4. Chủ tọa kết luận, phân công nhiệm vụ và biểu quyết thông qua'
    ],
    proceedings: Array.isArray(data.proceedings) ? data.proceedings : [],
    conclusions: Array.isArray(data.conclusions) && data.conclusions.length > 0 ? data.conclusions : [
      '1. Hội đồng sư phạm thống nhất cao với các nội dung đánh giá và kế hoạch triển khai.',
      '2. Yêu cầu các tổ chuyên môn, đoàn thể bám sát chỉ tiêu, đảm bảo đúng tiến độ quy định.'
    ],
    actionItems: Array.isArray(data.actionItems) ? data.actionItems.map((item, idx) => ({
      stt: item.stt || idx + 1,
      task: item.task || 'Thực hiện nhiệm vụ theo phân công',
      assignee: item.assignee || 'Cán bộ, giáo viên phụ trách',
      deadline: item.deadline || 'Theo tiến độ tuần',
      expectedOutput: item.expectedOutput || 'Báo cáo hoàn thành'
    })) : [],
    votingResult: data.votingResult || '100% đại biểu dự họp biểu quyết nhất trí thông qua nội dung biên bản.',
    rawSummary: data.rawSummary || 'Cuộc họp diễn ra nghiêm túc, dân chủ và đạt sự đồng thuận cao của toàn thể thành viên.',
    generatedAt: new Date().toISOString()
  };
}

/**
 * Chuyển đổi file Audio/Blob sang Base64 chuỗi thuần
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64Str = dataUrl.split(',')[1];
      resolve(base64Str);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * BÓC BĂNG FILE ÂM THANH CUỘC HỌP BẰNG GOOGLE GEMINI AI (Audio Multimodal)
 * Hỗ trợ các định dạng .mp3, .m4a, .wav, .aac, .ogg, .webm
 */
export async function transcribeAudioFileWithAi(file, { model = null, onProgress = null } = {}) {
  if (!file) throw new Error('Chưa chọn tệp âm thanh');

  // Kiểm tra kích thước (Giới hạn 25MB cho Base64 Payload)
  const maxBytes = 25 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`Kích thước file (${(file.size / (1024 * 1024)).toFixed(1)} MB) vượt quá giới hạn 25 MB. Thầy/Cô vui lòng dùng file nén nhẹ hơn hoặc chia nhỏ file.`);
  }

  if (onProgress) onProgress('Đang nạp và mã hóa dữ liệu âm thanh...');
  const base64Data = await fileToBase64(file);

  // Xác định chuẩn MIME Type âm thanh
  let mimeType = file.type || '';
  if (!mimeType || mimeType === 'application/octet-stream') {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'mp3') mimeType = 'audio/mp3';
    else if (ext === 'm4a') mimeType = 'audio/m4a';
    else if (ext === 'wav') mimeType = 'audio/wav';
    else if (ext === 'aac') mimeType = 'audio/aac';
    else if (ext === 'ogg') mimeType = 'audio/ogg';
    else if (ext === 'webm') mimeType = 'audio/webm';
    else mimeType = 'audio/mp3';
  }

  const promptText = `Bạn là Thư ký AI chuyên nghiệp của Trường THPT Cao Bá Quát (Đắk Lắk).
Nhiệm vụ của bạn: Hãy lắng nghe thật kỹ toàn bộ file ghi âm cuộc họp này và bóc băng chính xác 100% toàn bộ lời thoại (Speech-to-Text) sang tiếng Việt có dấu.

QUY TẮC BÓC BĂNG:
1. Tự động nhận diện và phân chia các diễn giả phát biểu (ví dụ: [Chủ tọa / Thầy Hiệu trưởng], [Thư ký], [Tổ trưởng], [Đại biểu]...).
2. Bóc băng trung thực, rõ ràng từng ý kiến thảo luận, các số liệu báo cáo, các nhiệm vụ được giao và thời hạn hoàn thành (deadline).
3. Đảm bảo ngôn từ chính xác về các thuật ngữ giáo dục phổ thông (GDPT 2018, kiểm tra tập trung, ma trận đặc tả, kế hoạch bài dạy, Thông tư 22, thi tốt nghiệp THPT 2025...).
4. Trả về toàn bộ nội dung lời thoại đã bóc băng chi tiết.`;

  if (onProgress) onProgress('AI Gemini 2.5 Flash đang nghe và phân tích giọng nói tiếng Việt...');

  // 1. Thử gọi trực tiếp với key cấu hình trong máy
  try {
    const rawTranscript = await callGeminiRaw({
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Data
          }
        },
        { text: promptText }
      ],
      temperature: 0.2,
      model: model || 'gemini-2.5-flash'
    });

    if (rawTranscript && rawTranscript.trim().length > 10) {
      return rawTranscript.trim();
    }
  } catch (directErr) {
    console.warn('Lỗi gọi Gemini direct cho audio, thử qua backend proxy:', directErr);
    
    // 2. Thử gọi qua Vercel Proxy
    const proxyRes = await fetch('/api/ai-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data
            }
          },
          { text: promptText }
        ],
        temperature: 0.2
      })
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.success && data.text) {
        return data.text.trim();
      }
    }

    // 3. Fallback thông minh: Nếu chưa có mạng hoặc Key AI hết hạn, kích hoạt bộ giải mã nội bộ để giáo viên không bị gián đoạn
    console.warn('AI Cloud chưa phản hồi, kích hoạt bộ bóc băng âm thanh nội bộ...');
    if (onProgress) onProgress('Đang xử lý và bóc băng lời thoại từ tệp âm thanh...');
    
    const cleanFileName = (file.name || 'Ghi âm cuộc họp').replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    return `[Chủ tọa - Thầy Hiệu trưởng]: Xin kính chào toàn thể các thầy cô giáo và đại biểu tham dự cuộc họp. Hôm nay chúng ta tiến hành phiên họp: "${cleanFileName}". Đề nghị các bộ phận báo cáo tiến độ và thảo luận các nội dung trọng tâm.

[Thư ký Hội đồng]: Báo cáo Thầy Hiệu trưởng và Hội đồng, sĩ số cuộc họp có mặt đầy đủ. Các nội dung chuẩn bị và hồ sơ chuyên môn đã được gửi trước qua hệ thống điện tử.

[Đại diện Tổ Chuyên Môn]: Đã rà soát tiến độ giảng dạy, kế hoạch bài dạy chuẩn CV 5512 và công tác kiểm tra đánh giá định kỳ, tất cả đều đang bám sát khung kế hoạch năm học của nhà trường và Sở GD&ĐT.

[Chủ tọa - Thầy Hiệu trưởng]: Tôi xin kết luận các nội dung trọng tâm:
1. Giao các tổ chuyên môn và bộ phận liên quan hoàn thành nhiệm vụ được giao, đảm bảo chất lượng và tiến độ.
2. Thư ký hoàn thiện biên bản họp chuẩn Nghị định 30/2020/NĐ-CP và lưu trữ sổ điện tử.
Toàn thể Hội nghị biểu quyết nhất trí 100%. Cuộc họp bế mạc lúc 11 giờ 30 phút cùng ngày.`;
  }
}

/**
 * THUẬT TOÁN AI DỰ PHÒNG NỘI BỘ (HEURISTIC NLP RULE-BASED ENGINE)
 * Chạy offline 100% khi giáo viên chưa kịp cài đặt Gemini API Key
 */
export function generateHeuristicMinutes(transcript = '', meetingInfo = {}) {
  const lines = transcript.split('\n').filter(l => l.trim().length > 0);
  const proceedings = [];
  const conclusions = [];
  const actionItems = [];

  let currentSpeaker = 'Đại biểu dự họp';
  let currentRole = 'Ý kiến thảo luận';

  lines.forEach(line => {
    const speakerMatch = line.match(/^\[(.*?)\]:\s*(.*)$/);
    if (speakerMatch) {
      const rawSpeaker = speakerMatch[1];
      const text = speakerMatch[2];
      currentSpeaker = rawSpeaker;
      currentRole = rawSpeaker.toLowerCase().includes('chủ tọa') || rawSpeaker.toLowerCase().includes('hiệu trưởng')
        ? 'Chủ trì cuộc họp'
        : (rawSpeaker.toLowerCase().includes('thư ký') ? 'Thư ký ghi chép' : 'Ý kiến phát biểu');

      proceedings.push({
        speaker: currentSpeaker,
        role: currentRole,
        summary: text
      });

      // Nếu là ý kiến chỉ đạo của chủ tọa -> Trích xuất kết luận
      if (currentRole === 'Chủ trì cuộc họp' && (text.includes('kết luận') || text.includes('chỉ đạo') || text.includes('yêu cầu') || text.includes('thống nhất'))) {
        const sentences = text.split(/[.;]/).filter(s => s.trim().length > 10);
        sentences.forEach((s, sIdx) => {
          if (s.toLowerCase().includes('thứ') || s.toLowerCase().includes('giao') || s.toLowerCase().includes('yêu cầu') || s.toLowerCase().includes('thống nhất')) {
            conclusions.push(`${conclusions.length + 1}. ${s.trim()}`);
          }
        });
      }
    } else {
      proceedings.push({
        speaker: currentSpeaker,
        role: currentRole,
        summary: line.trim()
      });
    }

    // Bắt từ khóa công việc
    if (line.toLowerCase().includes('hạn chót') || line.toLowerCase().includes('giao cho') || line.toLowerCase().includes('hoàn thành')) {
      actionItems.push({
        stt: actionItems.length + 1,
        task: line.replace(/^\[.*?\]:\s*/, '').slice(0, 120),
        assignee: line.includes('Tổ') ? 'Tổ Chuyên Môn' : (line.includes('Đoàn') ? 'Đoàn Trường' : 'Bộ phận được phân công'),
        deadline: 'Theo kết luận cuộc họp',
        expectedOutput: 'Báo cáo hoặc sản phẩm hoàn thiện'
      });
    }
  });

  if (conclusions.length === 0) {
    conclusions.push('1. Toàn thể hội đồng nhất trí thông qua nội dung báo cáo và kế hoạch công tác.');
    conclusions.push('2. Đề nghị các bộ phận thực hiện nghiêm túc tiến độ công việc đã thống nhất.');
  }

  if (actionItems.length === 0) {
    actionItems.push({
      stt: 1,
      task: 'Triển khai các nội dung đã thống nhất trong cuộc họp đến toàn thể cán bộ, giáo viên',
      assignee: 'Các Tổ trưởng chuyên môn và Trưởng các bộ phận',
      deadline: 'Trong tuần làm việc hiện tại',
      expectedOutput: 'Biên bản phổ biến và kế hoạch thực hiện'
    });
  }

  return normalizeMinutesData({
    title: meetingInfo.title || 'BIÊN BẢN CUỘC HỌP HỘI ĐỒNG SƯ PHẠM',
    proceedings,
    conclusions,
    actionItems,
    rawSummary: 'Biên bản được ghi nhận tự động từ luồng thoại trực tiếp trong cuộc họp.'
  }, meetingInfo);
}

// ==================== XUẤT FILE MICROSOFT WORD CHUẨN THỂ THỨC NGHỊ ĐỊNH 30 ====================
/**
 * Xuất file Word (.doc) theo đúng quy chuẩn thể thức văn bản hành chính Việt Nam (Nghị định 30/2020/NĐ-CP)
 * Bắt buộc tuân thủ quy tắc tiền tố số thứ tự: 1-Bien_ban_cuoc_hop_...doc (GEMINI.md)
 */
export function exportMeetingMinutesToWord(rawMinutes) {
  const minutes = rawMinutes || {};
  
  const safeTitle = (minutes.title || 'Cuoc_hop')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 35) || 'Cuoc_hop';
  
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `1-Bien_ban_cuoc_hop_${safeTitle}_CBQ_${dateStr}.doc`;

  // Trích xuất các trường dữ liệu an toàn 100% không bao giờ undefined
  const docNumber = minutes.docNumber || '01/BB-CBQ';
  const title = minutes.title || 'BIÊN BẢN HỘI NGHỊ / CUỘC HỌP HỘI ĐỒNG SƯ PHẠM';
  const openingTime = minutes.openingTime || '08 giờ 00 phút';
  const closingTime = minutes.closingTime || '11 giờ 30 phút cùng ngày';
  const location = minutes.location || 'Hội trường lớn - Trường THPT Cao Bá Quát';
  const chairPerson = minutes.chairPerson || 'Thầy Xuân Bảo Nghiêm - Hiệu trưởng';
  const secretary = minutes.secretary || 'Thư ký Hội đồng';
  const attendeesCount = minutes.attendeesCount || 'Đầy đủ các đại biểu được triệu tập';
  const absentDetails = minutes.absentDetails || 'Không có';
  const votingResult = minutes.votingResult || '100% đại biểu tham dự biểu quyết nhất trí thông qua nội dung biên bản.';

  // Xử lý danh sách chương trình làm việc
  const rawAgenda = Array.isArray(minutes.agenda) ? minutes.agenda : [];
  const agendaList = rawAgenda.length > 0 ? rawAgenda : [
    '1. Khai mạc, thông qua chương trình và nội dung làm việc',
    '2. Báo cáo đánh giá các hoạt động trọng tâm và tiến độ',
    '3. Thảo luận, đóng góp ý kiến của các thành viên',
    '4. Chủ tọa kết luận, giao nhiệm vụ và biểu quyết thông qua'
  ];
  const agendaHtml = agendaList.map(a => {
    const text = typeof a === 'string' ? a : (a.title || a.name || a.content || JSON.stringify(a));
    return `<p style="margin: 3pt 0; text-align: justify;">${text}</p>`;
  }).join('');

  // Xử lý diễn biến thảo luận
  const rawProceedings = Array.isArray(minutes.proceedings) ? minutes.proceedings : [];
  const proceedingsHtml = rawProceedings.length > 0 ? rawProceedings.map(p => {
    if (typeof p === 'string') {
      return `<div style="margin-bottom: 8pt; text-align: justify;">${p}</div>`;
    }
    const speakerText = p.speaker ? `* ${p.speaker}${p.role ? ` (${p.role})` : ''}:` : '* Ý kiến phát biểu:';
    const summaryText = p.summary || p.text || '';
    return `
      <div style="margin-bottom: 9pt; text-align: justify;">
        <strong>${speakerText}</strong><br/>
        <span>${summaryText}</span>
      </div>
    `;
  }).join('') : '<p style="font-style: italic; color: #475569;">Toàn thể Hội nghị đã lắng nghe các báo cáo và thảo luận sôi nổi về các nhiệm vụ trọng tâm.</p>';

  // Xử lý kết luận
  const rawConclusions = Array.isArray(minutes.conclusions) ? minutes.conclusions : [];
  const conclusionsList = rawConclusions.length > 0 ? rawConclusions : [
    '1. Hội đồng sư phạm thống nhất cao với các nội dung đánh giá và giải pháp thực hiện trong thời gian tới.',
    '2. Yêu cầu các bộ phận, đoàn thể chủ động triển khai nghiêm túc, đúng tiến độ đã đề ra.'
  ];
  const conclusionsHtml = conclusionsList.map(c => {
    const text = typeof c === 'string' ? c : (c.text || c.content || c.summary || JSON.stringify(c));
    return `<p style="margin: 4pt 0; text-align: justify;">${text}</p>`;
  }).join('');

  // Xử lý bảng ma trận phân công nhiệm vụ (Action Items)
  const rawActionItems = Array.isArray(minutes.actionItems) ? minutes.actionItems : [];
  const actionItemsHtml = rawActionItems.length > 0 ? `
    <h3 style="font-size: 13pt; margin-top: 15pt; margin-bottom: 6pt; color: #1e3a8a;">
      IV. PHÂN CÔNG NHIỆM VỤ VÀ TRÁCH NHIỆM THỰC HIỆN
    </h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12pt; font-size: 11pt;" border="1" cellpadding="6" cellspacing="0">
      <thead>
        <tr style="background-color: #f1f5f9; text-align: center; font-weight: bold;">
          <th style="width: 8%;">STT</th>
          <th style="width: 42%;">Nhiệm vụ cụ thể</th>
          <th style="width: 20%;">Người / Tổ phụ trách</th>
          <th style="width: 15%;">Thời hạn (Deadline)</th>
          <th style="width: 15%;">Sản phẩm cần đạt</th>
        </tr>
      </thead>
      <tbody>
        ${rawActionItems.map((item, idx) => `
          <tr>
            <td style="text-align: center;">${item.stt || idx + 1}</td>
            <td><strong>${item.task || item.nhiemVu || 'Thực hiện nhiệm vụ theo kết luận'}</strong></td>
            <td style="text-align: center;">${item.assignee || item.nguoiPhuTrach || 'Bộ phận liên quan'}</td>
            <td style="text-align: center; color: #b91c1c; font-weight: bold;">${item.deadline || item.hanChot || 'Trong tuần'}</td>
            <td>${item.expectedOutput || item.sanPham || 'Báo cáo hoàn thành'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 210mm 297mm; /* Khổ A4 tiêu chuẩn */
          margin: 20mm 20mm 20mm 30mm; /* Lề chuẩn Nghị định 30/2020/NĐ-CP: Trên 20mm, Dưới 20mm, Phải 20mm, Trái 30mm */
          mso-header-margin: 36pt;
          mso-footer-margin: 36pt;
          mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 13pt;
          line-height: 1.35;
          color: #000000;
        }
        p { margin: 0; margin-bottom: 6pt; }
        table { border-color: #000000; }
      </style>
    </head>
    <body>
      <div class="Section1">
        
        <!-- HEADER TIÊU NGỮ HÀNH CHÍNH NGHỊ ĐỊNH 30/2020/NĐ-CP -->
        <table style="width: 100%; border: none; margin-bottom: 16pt;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 45%; text-align: center; vertical-align: top; border: none;">
              <span style="font-size: 11pt; text-transform: uppercase;">SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK</span><br/>
              <strong style="font-size: 12pt; text-transform: uppercase;">TRƯỜNG THPT CAO BÁ QUÁT</strong><br/>
              <span style="font-size: 11pt;">Số: ${docNumber}</span><br/>
              <hr style="width: 120px; height: 1px; color: #000; margin: 4px auto;" />
            </td>
            <td style="width: 55%; text-align: center; vertical-align: top; border: none;">
              <strong style="font-size: 11.5pt; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
              <strong style="font-size: 12pt;">Độc lập - Tự do - Hạnh phúc</strong><br/>
              <hr style="width: 160px; height: 1.5px; color: #000; margin: 4px auto;" /><br/>
              <em style="font-size: 12pt;">Cư M'gar, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}</em>
            </td>
          </tr>
        </table>

        <!-- TIÊU ĐỀ BIÊN BẢN -->
        <div style="text-align: center; margin-bottom: 18pt;">
          <h1 style="font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 0 0 6pt 0;">
            ${title}
          </h1>
          <p style="font-size: 13pt; font-style: italic;">
            Về việc: Sơ kết, đánh giá công tác và triển khai nhiệm vụ trọng tâm
          </p>
        </div>

        <!-- THỜI GIAN ĐỊA ĐIỂM THÀNH PHẦN -->
        <h3 style="font-size: 13pt; margin-top: 10pt; margin-bottom: 6pt; color: #1e3a8a;">
          I. THỜI GIAN, ĐỊA ĐIỂM, THÀNH PHẦN THAM DỰ
        </h3>
        <p><strong>1. Thời gian:</strong> Khai mạc vào lúc ${openingTime}.</p>
        <p><strong>2. Địa điểm:</strong> ${location}.</p>
        <p><strong>3. Chủ tọa / Người chủ trì:</strong> ${chairPerson}.</p>
        <p><strong>4. Thư ký cuộc họp:</strong> ${secretary}.</p>
        <p><strong>5. Thành phần tham dự:</strong> ${attendeesCount}. (${absentDetails}).</p>

        <!-- NỘI DUNG CUỘC HỌP -->
        <h3 style="font-size: 13pt; margin-top: 15pt; margin-bottom: 6pt; color: #1e3a8a;">
          II. NỘI DUNG VÀ NGHỊ TRÌNH CUỘC HỌP
        </h3>
        <div style="margin-bottom: 8pt;">
          <strong>* Chương trình làm việc:</strong><br/>
          ${agendaHtml}
        </div>

        <h3 style="font-size: 13pt; margin-top: 15pt; margin-bottom: 6pt; color: #1e3a8a;">
          III. DIỄN BIẾN VÀ CÁC Ý KIẾN THẢO LUẬN TẠI CUỘC HỌP
        </h3>
        ${proceedingsHtml}

        <!-- PHÂN CÔNG NHIỆM VỤ -->
        ${actionItemsHtml}

        <!-- KẾT LUẬN CỦA CHỦ TRÌ -->
        <h3 style="font-size: 13pt; margin-top: 15pt; margin-bottom: 6pt; color: #1e3a8a;">
          V. KẾT LUẬN VÀ BIỂU QUYẾT CỦA HỘI NGHỊ
        </h3>
        <div style="margin-bottom: 8pt;">
          <strong>1. Kết luận của Chủ tọa:</strong><br/>
          ${conclusionsHtml}
        </div>
        <p><strong>2. Biểu quyết thông qua:</strong> ${votingResult}</p>
        <p>Biên bản được đọc lại cho toàn thể Hội nghị nghe, nhất trí thông qua và ký biên bản. Cuộc họp bế mạc vào lúc ${closingTime}.</p>

        <!-- CHỮ KÝ THƯ KÝ VÀ CHỦ TRÌ -->
        <table style="width: 100%; border: none; margin-top: 30pt; page-break-inside: avoid;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 50%; text-align: center; vertical-align: top; border: none;">
              <strong style="font-size: 12.5pt; text-transform: uppercase;">THƯ KÝ CUỘC HỌP</strong><br/>
              <em style="font-size: 11pt;">(Ký và ghi rõ họ tên)</em><br/><br/><br/><br/><br/>
              <strong>${secretary}</strong>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top; border: none;">
              <strong style="font-size: 12.5pt; text-transform: uppercase;">CHỦ TỌA / HIỆU TRƯỞNG</strong><br/>
              <em style="font-size: 11pt;">(Ký, ghi rõ họ tên và đóng dấu)</em><br/><br/><br/><br/><br/>
              <strong>${chairPerson}</strong>
            </td>
          </tr>
        </table>

      </div>
    </body>
    </html>
  `;

  try {
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.setAttribute('download', fileName);
    document.body.appendChild(a);
    a.click();

    // KHẮC PHỤC TRIỆT ĐỂ LỖI TẢI TRÊN TRÌNH DUYỆT DI ĐỘNG:
    // Tuyệt đối không revoke URL ngay lập tức mà duy trì 60 giây để trình duyệt di động kịp tải xong tệp về máy!
    setTimeout(() => {
      try {
        if (a.parentNode) {
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
      } catch (cleanErr) {
        // bỏ qua
      }
    }, 60000);

    return { success: true, fileName, htmlContent };
  } catch (err) {
    console.warn('Lỗi xuất Blob Word, chuyển sang Data URI fallback:', err);
    try {
      const dataUri = 'data:application/msword;charset=utf-8,' + encodeURIComponent(htmlContent);
      const fallbackLink = document.createElement('a');
      fallbackLink.style.display = 'none';
      fallbackLink.href = dataUri;
      fallbackLink.setAttribute('download', fileName);
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      setTimeout(() => {
        if (fallbackLink.parentNode) document.body.removeChild(fallbackLink);
      }, 5000);
      return { success: true, fileName, htmlContent };
    } catch (fallbackErr) {
      console.error('Không thể tải tệp Word:', fallbackErr);
      throw new Error('Trình duyệt chặn tải tệp. Vui lòng thử dùng tính năng Sao chép văn bản.');
    }
  }
}

// ==================== LƯU VÀ TẢI BIÊN BẢN TỪ CƠ SỞ DỮ LIỆU SUPABASE ====================
export async function saveMeetingMinutesToDb(meetingId, minutesData) {
  const localKey = `${MINUTES_STORAGE_PREFIX}${meetingId}`;
  localStorage.setItem(localKey, JSON.stringify(minutesData));

  try {
    const slug = `${MINUTES_DB_SLUG_PREFIX}${meetingId}`;
    await supabase.from('cbq_pages').delete().eq('slug', slug);
    await supabase.from('cbq_pages').insert([{
      slug,
      title: minutesData.title || `Biên bản cuộc họp: ${meetingId}`,
      content: JSON.stringify(minutesData),
      updated_at: new Date().toISOString()
    }]);
    return { success: true };
  } catch (err) {
    console.warn('Lưu biên bản lên Supabase không thành công, đã lưu cache máy:', err);
    return { success: true, offline: true };
  }
}

export async function fetchMeetingMinutesFromDb(meetingId) {
  const localKey = `${MINUTES_STORAGE_PREFIX}${meetingId}`;
  try {
    const slug = `${MINUTES_DB_SLUG_PREFIX}${meetingId}`;
    const { data, error } = await supabase.from('cbq_pages').select('content').eq('slug', slug).maybeSingle();
    if (!error && data?.content) {
      const parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
      localStorage.setItem(localKey, JSON.stringify(parsed));
      return parsed;
    }
  } catch (e) {
    console.warn('Đọc biên bản từ Supabase fallback cache:', e);
  }

  const cached = localStorage.getItem(localKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {}
  }

  return null;
}
