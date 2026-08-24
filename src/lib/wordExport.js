import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";

export const generateWordReport = async (stats, quizConfig) => {
  const ALL_CLASSES = [
    'Lớp 12A01', 'Lớp 12A02', 'Lớp 12A03', 'Lớp 12A04', 'Lớp 12A05', 'Lớp 12A06', 'Lớp 12A07', 'Lớp 12A08', 'Lớp 12A09', 'Lớp 12A10', 'Lớp 12A11',
    'Lớp 11A01', 'Lớp 11A02', 'Lớp 11A03', 'Lớp 11A04', 'Lớp 11A05', 'Lớp 11A06', 'Lớp 11A07', 'Lớp 11A08', 'Lớp 11A09', 'Lớp 11A10',
    'Lớp 10A01', 'Lớp 10A02', 'Lớp 10A03', 'Lớp 10A04', 'Lớp 10A05', 'Lớp 10A06', 'Lớp 10A07', 'Lớp 10A08', 'Lớp 10A09', 'Lớp 10A10', 'Lớp 10A11', 'Lớp 10A12', 'Lớp 10A13', 'Lớp 10A14', 'Lớp 10A15'
  ];

  const participatedClassNames = stats.classData.map(c => c.name.startsWith('Lớp') ? c.name : 'Lớp ' + c.name);
  const unparticipatedClasses = ALL_CLASSES.filter(c => !participatedClassNames.includes(c));

  // Get score stats for evaluation
  const excellentCount = stats.scoreDistribution.find(d => d.name.includes('Giỏi'))?.value || 0;
  const goodCount = stats.scoreDistribution.find(d => d.name.includes('Khá'))?.value || 0;
  const weakCount = stats.scoreDistribution.find(d => d.name.includes('Yếu'))?.value || 0;
  const goodRate = stats.totalStudents > 0 ? ((excellentCount + goodCount) / stats.totalStudents * 100).toFixed(1) : 0;
  const weakRate = stats.totalStudents > 0 ? (weakCount / stats.totalStudents * 100).toFixed(1) : 0;

  const createParagraph = (text) => {
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 100, after: 100, line: 360 }, // 1.5 lines spacing
      indent: { firstLine: 720 }, // 1.27 cm
      children: [
        new TextRun({ text: text, font: "Times New Roman", size: 28 }) // size 14pt (28 half-points)
      ]
    });
  };

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // 2 cm
              right: 850, // 1.5 cm
              bottom: 1134, // 2 cm
              left: 1701, // 3 cm
            },
          },
        },
        children: [
          // Header Table (Cơ quan ban hành - Quốc hiệu Tiêu ngữ)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: "TRƯỜNG THPT CAO BÁ QUÁT", font: "Times New Roman", size: 26 }), 
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: "BAN TỔ CHỨC CUỘC THI", font: "Times New Roman", size: 26, bold: true }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: "Số: ..... /BC-BTC", font: "Times New Roman", size: 26 }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: "-------------", font: "Times New Roman", size: 26 }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 60, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", font: "Times New Roman", size: 26, bold: true }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", font: "Times New Roman", size: 28, bold: true, underline: {} }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: " ", font: "Times New Roman", size: 28 }), 
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: `Đắk Lắk, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`, font: "Times New Roman", size: 28, italics: true }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "BÁO CÁO", font: "Times New Roman", size: 28, bold: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({ text: `Về việc kết quả tổ chức "${quizConfig.title || 'Cuộc Thi'}"`, font: "Times New Roman", size: 28, bold: true }),
            ],
          }),

          // Content
          createParagraph("Căn cứ Kế hoạch tổ chức các hoạt động kỷ niệm 30 năm ngày thành lập Trường THPT Cao Bá Quát;"),
          createParagraph(`Trường THPT Cao Bá Quát báo cáo kết quả tổ chức "${quizConfig.title || 'Cuộc Thi'}" với những số liệu cụ thể như sau:`),
          
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({ text: "1. Tổng quan số liệu", font: "Times New Roman", size: 28, bold: true }),
            ],
          }),
          createParagraph(`- Tổng số học sinh tham gia dự thi: ${stats.totalStudents} học sinh.`),
          createParagraph(`- Tổng số lớp có học sinh tham gia: ${stats.totalClasses} lớp.`),
          createParagraph(`- Thời gian làm bài trung bình: ${Math.floor(stats.avgTime / 60)} phút ${stats.avgTime % 60} giây.`),

          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({ text: "2. Phân bố chất lượng (Phổ điểm)", font: "Times New Roman", size: 28, bold: true }),
            ],
          }),
          ...stats.scoreDistribution.map(item => createParagraph(`- Điểm ${item.name}: ${item.value} học sinh (chiếm tỷ lệ ${((item.value / stats.totalStudents) * 100).toFixed(1)}%).`)),

          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({ text: "3. Thống kê theo lớp (Top 5 lớp tham gia tích cực nhất)", font: "Times New Roman", size: 28, bold: true }),
            ],
          }),
          ...stats.classData.slice(0, 5).map((cls, idx) => createParagraph(`- Top ${idx + 1}: ${cls.name.startsWith('Lớp') ? cls.name : 'Lớp ' + cls.name} có ${cls.count} học sinh tham gia, với điểm trung bình đạt ${cls.avgScore} điểm.`)),

          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({ text: "4. Thống kê các lớp chưa tham gia", font: "Times New Roman", size: 28, bold: true }),
            ],
          }),
          createParagraph(`Tính đến thời điểm xuất báo cáo, có ${unparticipatedClasses.length} lớp chưa có học sinh nào tham gia dự thi.`),
          ...(unparticipatedClasses.length > 0 
              ? [createParagraph(`- Chi tiết các lớp chưa tham gia: ${unparticipatedClasses.join(', ')}.`)] 
              : [createParagraph(`- Tất cả 100% các lớp trong toàn trường đã có học sinh tham gia.`)]),

          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({ text: "5. Đánh giá chất lượng các lớp tham gia", font: "Times New Roman", size: 28, bold: true }),
            ],
          }),
          createParagraph("- Ưu điểm: " + (goodRate > 50 
            ? `Chất lượng làm bài của học sinh rất tốt. Tỷ lệ học sinh đạt điểm Khá, Giỏi chiếm ${goodRate}%. Điều này cho thấy các lớp đã có sự tìm hiểu, ôn tập kỹ lưỡng về truyền thống nhà trường.`
            : `Đa số học sinh đã có tinh thần tham gia nhiệt tình, bám sát các nội dung tìm hiểu về truyền thống 30 năm nhà trường.`)),
          createParagraph("- Nhược điểm: " + (weakRate > 20 
            ? `Vẫn còn một bộ phận học sinh (chiếm ${weakRate}%) đạt điểm dưới trung bình (Yếu). Các giáo viên chủ nhiệm cần nhắc nhở và đôn đốc học sinh nghiên cứu kỹ hơn các tài liệu trước khi thi.`
            : `Tuy nhiên, một vài lớp chưa có tỷ lệ học sinh đạt điểm tối đa cao, cần đẩy mạnh hơn nữa phong trào thi đua chiều sâu.`)),

          new Paragraph({
            spacing: { before: 200, after: 400 },
            children: [
              new TextRun({ text: "6. Đánh giá chung", font: "Times New Roman", size: 28, bold: true }),
            ],
          }),
          createParagraph("Cuộc thi đã diễn ra nghiêm túc, an toàn và thu hút được đông đảo học sinh tham gia, tạo phong trào thi đua sôi nổi hướng tới kỷ niệm 30 năm thành lập trường. Hệ thống ghi nhận kết quả chính xác, minh bạch, phản ánh đúng năng lực và tinh thần tìm hiểu truyền thống nhà trường của các em học sinh."),
          createParagraph("Trên đây là Báo cáo kết quả tổ chức cuộc thi. Kính báo cáo./."),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // Signatures
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Nơi nhận:", font: "Times New Roman", size: 24, bold: true, italics: true }),
                        ],
                      }),
                      new Paragraph({ children: [new TextRun({ text: "- Lãnh đạo Trường (để b/c);", font: "Times New Roman", size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: "- Các tổ chuyên môn, GVCN (để t/h);", font: "Times New Roman", size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: "- Lưu: VT.", font: "Times New Roman", size: 22 })] }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: "TM. BAN TỔ CHỨC", font: "Times New Roman", size: 26, bold: true }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: "TRƯỞNG BAN", font: "Times New Roman", size: 26, bold: true }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: "(Ký, ghi rõ họ tên)", font: "Times New Roman", size: 24, italics: true }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Bao_Cao_Nghi_Dinh_30_${Date.now()}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
