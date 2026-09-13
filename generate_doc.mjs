import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  PageBreak
} from 'docx';
import fs from 'fs';
import path from 'path';

// Color palette
const COLOR_PRIMARY = "1E3A8A";    // Deep Navy Blue
const COLOR_SECONDARY = "0284C7";  // Sky Blue
const COLOR_DARK = "1E293B";       // Slate 800
const COLOR_MUTED = "64748B";      // Slate 500
const COLOR_BG_LIGHT = "F1F5F9";   // Slate 100
const COLOR_BORDER = "CBD5E1";     // Slate 300

// Helper to convert multi-line string into separate paragraphs
function createParagraphsFromText(text, options = {}) {
  const lines = text.split('\n');
  return lines.map(line => {
    const trimmed = line.trim();
    return new Paragraph({
      spacing: { before: 60, after: 80, line: 276 },
      alignment: options.alignment || AlignmentType.JUSTIFIED,
      children: [
        new TextRun({
          text: trimmed,
          bold: options.bold || false,
          italics: options.italics || false,
          size: options.size || 24, // 12pt
          color: options.color || COLOR_DARK,
          font: "Times New Roman"
        })
      ]
    });
  });
}

function createTitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 34, // 17pt
        color: COLOR_PRIMARY,
        font: "Times New Roman"
      })
    ]
  });
}

function createSubtitle(line1, line2) {
  const children = [
    new TextRun({
      text: line1,
      italics: true,
      size: 26, // 13pt
      color: COLOR_MUTED,
      font: "Times New Roman"
    })
  ];
  if (line2) {
    children.push(
      new TextRun({
        text: line2,
        break: 1,
        italics: true,
        bold: true,
        size: 26,
        color: COLOR_SECONDARY,
        font: "Times New Roman"
      })
    );
  }
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 240 },
    children
  });
}

function createHeading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 140 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28, // 14pt
        color: COLOR_PRIMARY,
        font: "Times New Roman"
      })
    ]
  });
}

function createHeading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 26, // 13pt
        color: COLOR_SECONDARY,
        font: "Times New Roman"
      })
    ]
  });
}

function createBody(text, options = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 80, line: 276 },
    alignment: options.alignment || AlignmentType.JUSTIFIED,
    children: [
      new TextRun({
        text,
        bold: options.bold || false,
        italics: options.italics || false,
        size: 24, // 12pt
        color: options.color || COLOR_DARK,
        font: "Times New Roman"
      })
    ]
  });
}

function createBullet(text, boldPrefix = "", level = 0) {
  const children = [];
  if (boldPrefix) {
    children.push(
      new TextRun({
        text: boldPrefix + " ",
        bold: true,
        size: 24,
        color: COLOR_DARK,
        font: "Times New Roman"
      })
    );
  }
  children.push(
    new TextRun({
      text,
      size: 24,
      color: COLOR_DARK,
      font: "Times New Roman"
    })
  );

  return new Paragraph({
    bullet: { level },
    spacing: { before: 40, after: 60, line: 260 },
    alignment: AlignmentType.JUSTIFIED,
    children
  });
}

function createQuoteBox(title, content) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: COLOR_BG_LIGHT },
            margins: { top: 140, bottom: 140, left: 200, right: 200 },
            borders: {
              left: { style: BorderStyle.SINGLE, size: 24, color: COLOR_SECONDARY },
              top: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
            },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 60 },
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    size: 24,
                    color: COLOR_SECONDARY,
                    font: "Times New Roman"
                  })
                ]
              }),
              new Paragraph({
                spacing: { before: 0, after: 0, line: 260 },
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: content,
                    italics: true,
                    size: 23,
                    color: COLOR_DARK,
                    font: "Times New Roman"
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function createComparisonTable(headers, rowsData) {
  const headerRow = new TableRow({
    children: headers.map((h) => (
      new TableCell({
        shading: { type: ShadingType.CLEAR, fill: COLOR_PRIMARY },
        margins: { top: 120, bottom: 120, left: 140, right: 140 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_PRIMARY },
          bottom: { style: BorderStyle.SINGLE, size: 12, color: COLOR_PRIMARY },
          left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
          right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: h,
                bold: true,
                size: 22,
                color: "FFFFFF",
                font: "Times New Roman"
              })
            ]
          })
        ]
      })
    ))
  });

  const bodyRows = rowsData.map((row, rIdx) => (
    new TableRow({
      children: row.map((cellText, cIdx) => (
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: rIdx % 2 === 0 ? "FFFFFF" : COLOR_BG_LIGHT },
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
          },
          children: [
            new Paragraph({
              alignment: cIdx === 0 ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
              children: [
                new TextRun({
                  text: cellText,
                  size: 21,
                  color: COLOR_DARK,
                  font: "Times New Roman"
                })
              ]
            })
          ]
        })
      ))
    })
  ));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows]
  });
}

async function generateDoc() {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch = 2.54 cm
              bottom: 1440,
              left: 1700,   // ~3.0 cm
              right: 1440   // ~2.54 cm
            }
          }
        },
        children: [
          createTitle("HỒ SƠ BẢO VỆ VÀ THUYẾT MINH KỸ THUẬT ĐỀ ÁN"),
          createSubtitle(
            "Hệ thống quản lý học tập, kiểm tra, khảo sát linh hoạt ứng dụng AI phục vụ trường phổ thông",
            "(Cổng thông tin Giáo dục caobaquat.xyz - Cao Bá Quát AI Team)"
          ),
          
          createQuoteBox(
            "Mục đích tài liệu:",
            "Tài liệu này tổng hợp toàn diện các phân tích phản biện chuyên sâu, bộ câu hỏi bảo vệ trước Hội đồng Ban Giám khảo, kịch bản thuyết trình mẫu chuẩn quốc gia, và cẩm nang kỹ thuật lắp đặt máy chủ (Server/PC) cho các trường học triển khai hệ thống."
          ),

          new Paragraph({ spacing: { before: 180, after: 180 } }),

          // PHẦN I
          createHeading1("PHẦN I: BẢN PHẢN BIỆN CHUYÊN SÂU & RỦI RO KỸ THUẬT"),
          createBody("Dưới góc nhìn của Hội đồng Giám khảo chuyên môn (gồm các chuyên gia CNTT, Trí tuệ Nhân tạo, An ninh mạng, Quản lý Giáo dục và Pháp lý), đề án caobaquat.xyz có những điểm sáng tạo rất lớn nhưng đồng thời cũng tồn tại các điểm mâu thuẫn logic và rủi ro kỹ thuật cần chuẩn bị đối thoại:"),

          createHeading2("1. Mâu thuẫn giữa Khái niệm 'Offline 100%' và 'Giải pháp Trọng tâm AI'"),
          createBullet("Đề án khẳng định hệ thống vận hành ngoại tuyến 100% trong mạng LAN khi mất cáp quang ngoài. Tuy nhiên, 5 Trợ lý AI (Gemini Flash, Azure GPT-4o Vision) đều là Cloud API phụ thuộc đường truyền Internet. Nếu mất mạng, hệ thống mất đi 'trái tim AI' và trở về một Web LMS truyền thống.", "Điểm mâu thuẫn:"),
          createBullet("Nhóm tác giả cần làm rõ khái niệm 'Kiến trúc Phân tầng Độc lập (Fault-Tolerant Layering)' thay vì nói chung chung là Offline 100% AI.", "Giải pháp chuẩn hóa:"),

          createHeading2("2. Vấn đề Ảo giác AI (Hallucination) và Tính pháp lý khi chấm Tự luận"),
          createBullet("Chữ viết tay Tiếng Việt của học sinh THPT rất đa dạng, hay viết tắt. OCR và LLM có thể nhận diện sai ngữ nghĩa hoặc sinh điểm lệch chuẩn.", "Rủi ro:"),
          createBullet("Phải định vị rõ AI là 'Trợ lý gợi ý (Assistant)' chứ không phải 'Người ra quyết định (Decision Maker)'. Mọi điểm số và nhận xét bắt buộc phải qua khâu duyệt 1-click của Giáo viên (Human-in-the-Loop).", "Nguyên tắc bảo vệ:"),

          createHeading2("3. Tuân thủ Quyền riêng tư & Pháp lý (Nghị định 13/2023/NĐ-CP)"),
          createBullet("Bài làm, hình ảnh, họ tên của 1.200 học sinh gửi lên API quốc tế (Google/Microsoft) cần có lớp Vô danh hóa (Anonymization Layer) để băm (hash) hoặc ẩn thông tin định danh cá nhân trước khi truyền đi.", "Lỗ hổng cần che chắn:"),

          createHeading2("4. Nợ kỹ thuật trong Hạ tầng Máy chủ tự chế"),
          createBullet("Việc dùng PowerShell script quét ARP để tìm IP máy ảo DMOJ và sửa file web.config của IIS là một giải pháp tình thế (hack) rất dễ gãy hỏng trong môi trường thực tế.", "Điểm yếu cốt lõi:"),
          createBullet("Cần chuẩn hóa sang Docker Containerization hoặc cấu hình Static Subnet để đảm bảo tính sẵn sàng 99.99%.", "Khắc phục:"),

          new PageBreak(),

          // PHẦN II
          createHeading1("PHẦN II: BỘ CÂU HỎI BAN GIÁM KHẢO VÀ KỊCH BẢN TRẢ LỜI ĂN ĐIỂM"),

          createHeading2("Nhóm 1: Câu hỏi về Hạ tầng & Công nghệ"),
          createBullet("Nếu cúp điện đột ngột hoặc hỏng ổ cứng tại phòng kỹ thuật, dữ liệu thi học kỳ của 1.200 học sinh xử lý thế nào?", "Câu hỏi 1.1:"),
          createQuoteBox(
            "Gợi ý trả lời xuất sắc:",
            "Kính thưa BGK, hệ thống áp dụng cơ chế Bảo toàn Dữ liệu Kép (Dual Data Resilience): (1) Phía Client lưu vết tức thời từng câu trả lời vào LocalStorage/IndexedDB; (2) Phía Server thực hiện sao lưu CSDL tự động (Automated Backup) mỗi 30 phút sang ổ cứng dự phòng và đồng bộ đám mây mã hóa. Nếu mất điện, khi có điện trở lại, máy học sinh tự động gửi gói đồng bộ ngầm Async Queue lên server mà không mất một bài nào."
          ),

          createBullet("Tại sao không thuê Cloud VPS (AWS/Google Cloud) mà lại đặt Server tại trường?", "Câu hỏi 1.2:"),
          createQuoteBox(
            "Gợi ý trả lời xuất sắc:",
            "Việc đặt Máy chủ On-Premise tại trường giải quyết 2 bài toán cốt tử của giáo dục vùng khó: (1) Chi phí 0 đồng hàng tháng; (2) Đảm bảo độ trễ = 0 và thông lượng mạng LAN Gigabit không phụ thuộc vào tình trạng đứt cáp quang biển hay nghẽn mạng Internet ngoại vi khi 1.000 học sinh đồng loạt nộp bài."
          ),

          createHeading2("Nhóm 2: Câu hỏi về Trí tuệ Nhân tạo (AI Engine)"),
          createBullet("Làm sao đảm bảo AI không chấm thiên vị hoặc ảo giác đối với bài thi Tự luận?", "Câu hỏi 2.1:"),
          createQuoteBox(
            "Gợi ý trả lời xuất sắc:",
            "Hệ thống áp dụng kỹ thuật 'Structured Few-Shot Prompting' kết hợp Bare-bone Rubric: Giáo viên nạp ma trận đáp án và tiêu chí chấm chi tiết. AI chỉ đóng vai trò Trợ lý đọc hiểu và đề xuất khung điểm kèm bằng chứng trích dẫn từ bài làm. Giáo viên là người giữ quyền phê duyệt cuối cùng (Human-in-the-Loop), giúp giảm 80% thời gian gõ nhận xét nhưng giữ nguyên 100% trách nhiệm sư phạm."
          ),

          createHeading2("Nhóm 3: Câu hỏi về An toàn Thông tin & Quyền riêng tư"),
          createBullet("Hệ thống bảo vệ dữ liệu học sinh theo Nghị định 13/2023/NĐ-CP như thế nào khi gọi AI API ngoài?", "Câu hỏi 3.1:"),
          createQuoteBox(
            "Gợi ý trả lời xuất sắc:",
            "Trước khi payload được gửi tới Google Gemini hay Azure OpenAI, hệ thống chạy qua Middleware Vô danh hóa (Anonymization Filter): Toàn bộ Họ tên, Mã định danh, Lớp học đều được thay thế bằng chuỗi Token ngẫu nhiên (VD: Candidate_A102). Dữ liệu gửi đi chỉ là văn bản bài làm thuần túy. Đồng thời, nhà trường sử dụng API Enterprise với cam kết 'Zero Data Retention' (không lưu giữ và không dùng dữ liệu để train lại model)."
          ),

          new PageBreak(),

          // PHẦN III
          createHeading1("PHẦN III: BÀI DIỄN VĂN THUYẾT TRÌNH MẪU TRƯỚC HỘI ĐỒNG (7-10 PHÚT)"),
          createBody("Dưới đây là kịch bản thuyết trình chuẩn được thiết kế súc tích, tự tin và giàu tính thuyết phục dành cho Đại diện Nhóm tác giả trình bày trước Hội đồng Giám khảo:"),

          createHeading2("1. Mở đầu: Đặt vấn đề & Nỗi đau thực tế (2 phút)"),
          ...createParagraphsFromText(
            "“Kính thưa Ban Giám khảo, thưa toàn thể Hội đồng thi!\n\n" +
            "Tôi là [Họ tên], đại diện cho Cao Bá Quát AI Team – Trường THPT Cao Bá Quát, tỉnh Đắk Lắk.\n\n" +
            "Năm học 2025 - 2026 đánh dấu cột mốc 30 năm thành lập trường, cũng là thời điểm Chương trình GDPT 2018 bước vào giai đoạn then chốt với cấu trúc đề thi Tốt nghiệp THPT mới. Tuy nhiên, tại các trường phổ thông – đặc biệt là khu vực Tây Nguyên – thầy cô và nhà trường đang đối mặt với 3 nghịch lý rất lớn:\n\n" +
            "Thứ nhất: Áp lực đổi mới kiểm tra đánh giá rất cao (câu hỏi Đúng/Sai lũy tiến, lập trình thực tế, tích hợp Năng lực số 5512), nhưng phần mềm thương mại trên thị trường lại có chi phí bản quyền đắt đỏ và phụ thuộc 100% vào mạng Internet ngoài.\n\n" +
            "Thứ hai: Giáo viên quá tải vì hàng trăm giờ chấm bài tự luận thủ công và xử lý thủ tục hành chính, không còn thời gian tương tác 1-1 với học sinh.\n\n" +
            "Thứ ba: Học sinh thiếu môi trường rèn luyện kỹ năng nghe nói tiếng Anh chuẩn bản xứ.\n\n" +
            "Xuất phát từ nỗi đau thực tiễn đó, chúng tôi đã nghiên cứu và phát triển Cổng thông tin Giáo dục & Khảo thí thông minh caobaquat.xyz – một giải pháp Hybrid AI tự chủ 100% về công nghệ với chi phí gần như bằng 0 đồng!”"
          ),

          createHeading2("2. Thân bài: Điểm đột phá của Giải pháp & 5 Trợ lý AI (4 phút)"),
          ...createParagraphsFromText(
            "“Kính thưa Hội đồng, giải pháp của chúng tôi nổi bật với 3 giá trị cốt lõi:\n\n" +
            "1. Mô hình Kiến trúc Phân tầng Hybrid độc đáo: Toàn bộ phân hệ thi cử trắc nghiệm OMR, chấm code DMOJ, điểm danh và kho học liệu được xử lý 100% trong mạng LAN nội bộ. Khi mất cáp quang ngoài, trường vẫn tổ chức thi bình thường với độ trễ bằng 0. Khi có Internet, hệ thống tự động kích hoạt tầng Trí tuệ nhân tạo đám mây.\n\n" +
            "2. Hệ sinh thái 05 Trợ lý AI chuyên sâu cho giáo dục phổ thông:\n" +
            "- Gemini AI Grader: Đọc hiểu bài tự luận viết tay, gợi ý điểm chi tiết từng ý theo Rubric chỉ trong 3 giây.\n" +
            "- CBQ English Coach: Luyện đàm thoại 4 kỹ năng STT/TTS theo khung chuẩn Châu Âu CEFR.\n" +
            "- Digital & AI Planner: Tự động lồng ghép Năng lực số và Năng lực AI vào giáo án 5512, xuất thẳng ra file Word chuẩn Bộ GD&ĐT.\n" +
            "- AI Question Bank: Bóc tách đề thi PDF/ảnh quét thành câu hỏi có cấu trúc.\n" +
            "- AI Administrative Assistant: Quét ảnh lịch tuần để tự động phân tích và giao việc trên văn phòng số iDoc.\n\n" +
            "3. An toàn, bảo mật và công bằng tuyệt đối: Áp dụng cơ chế rọc phách kép (Double-Blind) cho chấm thi OMR; điểm danh bằng mã PIN biến đổi 30s kết hợp IP LAN chống gian lận 100%.”"
          ),

          createHeading2("3. Kết bài: Hiệu quả thực tiễn & Khả năng nhân rộng (2 phút)"),
          ...createParagraphsFromText(
            "“Kính thưa quý vị, giải pháp caobaquat.xyz không phải là một mô hình lý thuyết trên giấy. Hệ thống đã được đóng gói và vận hành thực tế phục vụ hơn 1.200 học sinh và gần 80 cán bộ giáo viên tại trường THPT Cao Bá Quát.\n\n" +
            "Kết quả thực tế chứng minh: Hệ thống đã giúp giải phóng tới 80% thời gian chấm thi và hành chính cho giáo viên, tiết kiệm cho nhà trường 30 - 50 triệu đồng mỗi năm chi phí mua bản quyền phần mềm. Quan trọng hơn cả, giải pháp đã chứng minh: Một trường học vùng khó khăn hoàn toàn có thể tự chủ công nghệ cao và đưa AI tiên tiến nhất vào phục vụ học sinh nghèo.\n\n" +
            "Chúng tôi xin trân trọng cảm ơn Ban Giám khảo và kính mời quý thầy cô cùng theo dõi phần Demo trực tiếp hệ thống!”"
          ),

          new PageBreak(),

          // PHẦN IV
          createHeading1("PHẦN IV: CẨM NANG KỸ THUẬT LẮP ĐẶT VÀ VẬN HÀNH MÁY CHỦ TRƯỜNG HỌC"),

          createHeading2("1. Lựa chọn Phần cứng: Server chuyên dụng vs PC phòng Tin học"),
          createComparisonTable(
            ["Tiêu chí so sánh", "Phương án 1: PC Phòng Tin học (Tận dụng)", "Phương án 2: Server Chuyên dụng (Rack/Tower)"],
            [
              ["Chi phí đầu tư", "0 đồng (Tận dụng máy tính để bàn sẵn có)", "15 - 35 triệu đồng (Mua mới máy chủ chuyên dụng)"],
              ["Cấu hình tối thiểu", "Core i5 / Ryzen 5, 16GB RAM, SSD 256GB NVMe", "Intel Xeon / Core i7, 32GB RAM ECC, 2x 512GB SSD RAID-1"],
              ["Khả năng chịu tải", "Chịu tải 300 - 500 học sinh thi đồng thời trong LAN", "Chịu tải 1.500 - 3.000 học sinh toàn trường đồng thời"],
              ["Độ bền vận hành", "Nên tắt máy ngoài giờ học, dùng quạt thường", "Hoạt động liên tục 24/7/365, tản nhiệt công nghiệp, nguồn đôi"],
              ["Môi trường lắp đặt", "Bàn giáo viên / Bàn kỹ thuật phòng Tin học", "Tủ Rack phòng Server, phòng có máy lạnh 24/24 và UPS"]
            ]
          ),

          createHeading2("2. Sơ đồ Đấu nối Mạng Nội bộ (Network Topology)"),
          createBody("Để đảm bảo tốc độ 1Gbps không bị nghẽn mạng khi học sinh toàn trường cùng truy cập, sơ đồ đấu nối vật lý được thiết kế như sau:"),
          createBullet("Đường truyền cáp quang (FTTH) có IP Tĩnh (hoặc Dynamic DNS) đấu nối trực tiếp vào Router chính (DrayTek / MikroTik / Ruijie).", "1. Router Trung tâm:"),
          createBullet("Từ Router kéo dây mạng CAT6 Gigabit vào Switch Core trung tâm phòng máy. Các Switch tầng phân phối sóng Wi-Fi (Access Points) phủ khắp các dãy phòng học.", "2. Hạ tầng Switch & Wi-Fi:"),
          createBullet("Máy chủ/PC cài đặt hệ thống được cắm trực tiếp vào cổng Gigabit số 1 trên Switch Core và được gán IP Tĩnh nội bộ cố định: 192.168.1.100.", "3. Vị trí Máy chủ:"),
          createBullet("Bắt buộc trang bị Bộ lưu điện (UPS) 1000VA - 2000VA có khả năng duy trì điện 20-30 phút khi cúp điện đột ngột để bảo vệ ổ cứng SSD.", "4. Bộ lưu điện dự phòng (UPS):"),

          createHeading2("3. Hướng dẫn Cài đặt Hệ thống Tự động (Docker Engine)"),
          createBody("Thay vì cài đặt thủ công dễ phát sinh lỗi môi trường, toàn bộ hệ thống được triển khai bằng Docker Compose qua 4 bước:"),
          
          createBullet("Tải và cài đặt Docker Desktop (trên Windows 10/11 Pro) hoặc Docker Engine (trên Ubuntu Server 22.04/24.04 LTS).", "Bước 1: Cài đặt Docker Engine:"),
          createBullet("Tạo thư mục C:\\SchoolServer\\ và khởi tạo file docker-compose.yml chứa cấu hình Nginx, Supabase/PostgreSQL 15, Redis và DMOJ Judge.", "Bước 2: Cấu hình docker-compose.yml:"),
          createBullet("Mở Terminal / PowerShell tại thư mục và gõ lệnh: docker compose up -d. Sau 3 phút, toàn bộ CSDL và Web Server tự động khởi chạy ngầm.", "Bước 3: Khởi chạy 1-Click:"),
          createBullet("Trên Router trường, thực hiện Port Forwarding (Mở cổng NAT) Port 80 và Port 443 trỏ về địa chỉ IP 192.168.1.100 để người dùng từ ngoài trường có thể truy cập qua tên miền caobaquat.xyz.", "Bước 4: Cấu hình NAT Port & Tên miền:"),

          createHeading2("4. Quy trình Sao lưu Dự phòng Tự động (Automated Backup Script)"),
          createBody("Tạo một tác vụ định kỳ (Windows Task Scheduler hoặc Linux CronJob) chạy mỗi ngày vào lúc 23:00 để tự động kết xuất dữ liệu CSDL PostgreSQL ra file .sql.gz, lưu trữ đồng thời trên ổ cứng ngoài và đẩy lên Google Drive bảo mật của nhà trường."),

          new Paragraph({ spacing: { before: 240, after: 120 } }),
          createQuoteBox(
            "Cam kết kỹ thuật & Chuyển giao:",
            "Hệ thống được đóng gói hoàn chỉnh thành Bộ cài đặt tiêu chuẩn (Installer Package) kèm đầy đủ Tài liệu Hướng dẫn Vận hành (SOP). Nhà trường sẵn sàng chuyển giao công nghệ và hỗ trợ kỹ thuật cho các trường THPT, THCS trên địa bàn toàn tỉnh Đắk Lắk và khu vực Tây Nguyên."
          )
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.resolve('Tai_Lieu_Phan_Bien_Va_Huong_Dan_Server_caobaquat.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('SUCCESS: Document generated at ' + outputPath);
}

generateDoc().catch(console.error);
