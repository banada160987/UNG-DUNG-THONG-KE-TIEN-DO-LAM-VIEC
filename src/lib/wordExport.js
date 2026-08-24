import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";

export const generateWordReport = async (stats, quizConfig, submissions, studentUsers = []) => {
  const ALL_CLASSES = [
    'Lớp 12A01', 'Lớp 12A02', 'Lớp 12A03', 'Lớp 12A04', 'Lớp 12A05', 'Lớp 12A06', 'Lớp 12A07', 'Lớp 12A08', 'Lớp 12A09', 'Lớp 12A10',
    'Lớp 11A01', 'Lớp 11A02', 'Lớp 11A03', 'Lớp 11A04', 'Lớp 11A05', 'Lớp 11A06', 'Lớp 11A07', 'Lớp 11A08', 'Lớp 11A09',
    'Lớp 10A01', 'Lớp 10A02', 'Lớp 10A03', 'Lớp 10A04', 'Lớp 10A05', 'Lớp 10A06', 'Lớp 10A07', 'Lớp 10A08', 'Lớp 10A09', 'Lớp 10A10', 'Lớp 10A11', 'Lớp 10A12', 'Lớp 10A13', 'Lớp 10A14', 'Lớp 10A15'
  ];

  // Tính toán sĩ số thực tế từ bảng học sinh
  const getGradeFromClass = (className) => {
    const match = className.match(/(10|11|12)/);
    return match ? match[0] : null;
  };

  const grades = {
    '10': { count: 0, avg: 0, sum: 0, totalStudents: 0 },
    '11': { count: 0, avg: 0, sum: 0, totalStudents: 0 },
    '12': { count: 0, avg: 0, sum: 0, totalStudents: 0 }
  };

  // Tính toán sĩ số thực tế từ bảng học sinh
  const dbClassSizes = {};
  let totalSchoolStudents = 0;

  if (studentUsers && studentUsers.length > 0) {
    studentUsers.forEach(u => {
      if (u.student_class) {
        const clsName = u.student_class.startsWith('Lớp') ? u.student_class : 'Lớp ' + u.student_class;
        dbClassSizes[clsName] = (dbClassSizes[clsName] || 0) + 1;
        totalSchoolStudents++;

        const grade = getGradeFromClass(u.student_class);
        if (grade && grades[grade]) {
          grades[grade].totalStudents++;
        }
      }
    });
  } else {
    totalSchoolStudents = ALL_CLASSES.length * 40;
    ALL_CLASSES.forEach(cls => {
      const grade = getGradeFromClass(cls);
      if (grade && grades[grade]) {
        grades[grade].totalStudents += 40;
      }
    });
  }

  // Lấy sĩ số lớp từ DB, nếu không có hoặc DB rỗng thì mặc định là 40 để tránh lỗi chia cho 0
  const getClassSize = (clsName) => dbClassSizes[clsName] || 40;


  // Data extraction
  const totalStudents = submissions.length;
  let maxScore = -1, minScore = 99999, totalScoreSum = 0;
  let maxTime = -1, minTime = 99999, totalTimeSum = 0;
  let timeGroups = { under5: 0, from5to10: 0, from10to15: 0, over15: 0 };
  let perfectScores = 0;

  const validSubs = submissions.map(s => {
    const sScore = s.total_score || s.score || 0;
    const sTime = s.time_taken_seconds || 0;

    if (sScore > maxScore) maxScore = sScore;
    if (sScore < minScore) minScore = sScore;
    if (sScore >= 300) perfectScores++;
    totalScoreSum += sScore;

    if (sTime > maxTime) maxTime = sTime;
    if (sTime < minTime) minTime = sTime;

    if (sTime < 300) timeGroups.under5++;
    else if (sTime <= 600) timeGroups.from5to10++;
    else if (sTime <= 900) timeGroups.from10to15++;
    else timeGroups.over15++;

    return { ...s, finalScore: sScore, finalTime: sTime };
  }).sort((a, b) => b.finalScore - a.finalScore || a.finalTime - b.finalTime);

  if (minScore === 99999) minScore = 0;
  if (minTime === 99999) minTime = 0;
  if (maxScore === -1) maxScore = 0;
  if (maxTime === -1) maxTime = 0;

  const avgScore = totalStudents > 0 ? (totalScoreSum / totalStudents).toFixed(1) : 0;
  const top10Individuals = validSubs.slice(0, 10);

  // Grades
  validSubs.forEach(s => {
    const g = s.student_group || '';
    const grade = getGradeFromClass(g);
    if (grade && grades[grade]) {
      grades[grade].count++;
      grades[grade].sum += s.finalScore;
    }
  });

  ['10', '11', '12'].forEach(g => {
    if (grades[g].totalStudents === 0) grades[g].totalStudents = 1; // avoid division by zero
    grades[g].avg = grades[g].count > 0 ? (grades[g].sum / grades[g].count).toFixed(1) : 0;
    grades[g].rate = ((grades[g].count / grades[g].totalStudents) * 100).toFixed(1);
  });

  // Classes
  const participatedClassNames = stats.classData.map(c => c.name.startsWith('Lớp') ? c.name : 'Lớp ' + c.name);
  const unparticipatedClasses = ALL_CLASSES.filter(c => !participatedClassNames.includes(c));
  const classParticipation = stats.classData.map(c => {
    const normalizedName = c.name.startsWith('Lớp') ? c.name : 'Lớp ' + c.name;
    const cSize = getClassSize(normalizedName);
    return {
      name: normalizedName,
      count: c.count,
      avgScore: c.avgScore,
      rate: ((c.count / cSize) * 100).toFixed(1)
    }
  }).sort((a, b) => b.rate - a.rate);

  // Distributions
  const excellentCount = stats.scoreDistribution.find(d => d.name.includes('Giỏi'))?.value || 0;
  const goodCount = stats.scoreDistribution.find(d => d.name.includes('Khá'))?.value || 0;
  const weakCount = stats.scoreDistribution.find(d => d.name.includes('Yếu'))?.value || 0;

  const goodRate = totalStudents > 0 ? ((excellentCount + goodCount) / totalStudents * 100).toFixed(1) : 0;
  const weakRate = totalStudents > 0 ? (weakCount / totalStudents * 100).toFixed(1) : 0;

  const formatTime = (secs) => `${Math.floor(secs / 60)} phút ${secs % 60} giây`;

  const createParagraph = (text, opts = {}) => {
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 100, after: 100, line: 360 }, // 1.5 lines spacing
      indent: { firstLine: 720 }, // 1.27 cm
      children: [
        new TextRun({ text: text, font: "Times New Roman", size: 28, ...opts })
      ]
    });
  };

  const createHeading = (text) => {
    return new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({ text: text, font: "Times New Roman", size: 28, bold: true }),
      ],
    });
  };

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 850, bottom: 1134, left: 1701 },
          },
        },
        children: [
          // Header Table
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
                        children: [new TextRun({ text: "TRƯỜNG THPT CAO BÁ QUÁT", font: "Times New Roman", size: 26 })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "BAN TỔ CHỨC CUỘC THI", font: "Times New Roman", size: 26, bold: true })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "Số: ..... /BC-BTC", font: "Times New Roman", size: 26 })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "-------------", font: "Times New Roman", size: 26 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 60, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", font: "Times New Roman", size: 26, bold: true })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", font: "Times New Roman", size: 28, bold: true, underline: {} })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: " ", font: "Times New Roman", size: 28 })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: `Đắk Lắk, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`, font: "Times New Roman", size: 28, italics: true })],
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
            children: [new TextRun({ text: "BÁO CÁO", font: "Times New Roman", size: 28, bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new TextRun({ text: `Tổng kết kết quả tổ chức "${quizConfig.title || 'Cuộc Thi'}"`, font: "Times New Roman", size: 28, bold: true })],
          }),

          // Content
          createParagraph("Căn cứ Kế hoạch tổ chức các hoạt động kỷ niệm 30 năm ngày thành lập Trường THPT Cao Bá Quát;"),
          createParagraph(`Thay mặt ban tổ chức, báo cáo kết quả tổ chức "${quizConfig.title || 'Cuộc Thi'}" với những số liệu cụ thể như sau:`),

          createHeading("1. Tổng quan kết quả cuộc thi"),
          createParagraph(`- Tổng số học sinh tham gia dự thi: ${totalStudents} học sinh.`),
          createParagraph(`- Tổng số lớp có học sinh tham gia: ${stats.totalClasses}/${ALL_CLASSES.length} lớp.`),
          createParagraph(`- Tỷ lệ học sinh tham gia toàn trường: Đạt ${((totalStudents / totalSchoolStudents) * 100).toFixed(1)}%.`),

          createHeading("2. Thống kê mức độ tham gia"),
          createParagraph("2.1. Theo khối:"),
          createParagraph(`- Khối 10: Có ${grades['10'].count}/${grades['10'].totalStudents} học sinh tham gia (Tỷ lệ: ${grades['10'].rate}%).`),
          createParagraph(`- Khối 11: Có ${grades['11'].count}/${grades['11'].totalStudents} học sinh tham gia (Tỷ lệ: ${grades['11'].rate}%).`),
          createParagraph(`- Khối 12: Có ${grades['12'].count}/${grades['12'].totalStudents} học sinh tham gia (Tỷ lệ: ${grades['12'].rate}%).`),

          createParagraph("2.2. Xếp hạng theo tỷ lệ tham gia của lớp:"),
          ...classParticipation.slice(0, 3).map((cls, idx) => createParagraph(`- Top ${idx + 1} tỷ lệ tham gia cao: ${cls.name} (Có ${cls.count} học sinh, đạt tỷ lệ ${cls.rate}%).`)),
          createParagraph(`- Có ${unparticipatedClasses.length} lớp chưa có học sinh nào tham gia dự thi.`),
          ...(unparticipatedClasses.length > 0 ? [createParagraph(`Danh sách: ${unparticipatedClasses.join(', ')}.`)] : []),

          createHeading("3. Phân bố chất lượng và phổ điểm"),
          createParagraph(`- Điểm cao nhất toàn cuộc thi: ${maxScore} điểm.`),
          createParagraph(`- Điểm thấp nhất toàn cuộc thi: ${minScore} điểm.`),
          createParagraph(`- Điểm trung bình chung toàn cuộc thi: ${avgScore} điểm.`),
          createParagraph("Phân bố số lượng theo các mức điểm:"),
          ...stats.scoreDistribution.map(item => createParagraph(`+ Mức ${item.name}: ${item.value} học sinh (chiếm ${((item.value / stats.totalStudents) * 100).toFixed(1)}%).`)),

          createHeading("4. Thành tích nổi bật"),
          createParagraph(`4.1. Cá nhân xuất sắc (Top 10):`),
          ...top10Individuals.map((t, idx) => createParagraph(`- Top ${idx + 1}: Thí sinh ${t.student_name} (${t.student_group}) đạt ${t.finalScore} điểm (Thời gian nộp: ${formatTime(t.finalTime)}).`)),
          createParagraph(`4.2. Tập thể xuất sắc (Top 3 lớp có điểm trung bình cao nhất):`),
          ...stats.classData.slice(0, 3).map((cls, idx) => createParagraph(`- Tập thể Top ${idx + 1}: ${cls.name.startsWith('Lớp') ? cls.name : 'Lớp ' + cls.name} đạt điểm trung bình ${cls.avgScore} điểm.`)),

          createHeading("5. Thống kê thời gian làm bài"),
          createParagraph(`- Thời gian làm bài nhanh nhất: ${formatTime(minTime)}.`),
          createParagraph(`- Thời gian làm bài lâu nhất: ${formatTime(maxTime)}.`),
          createParagraph(`- Thời gian làm bài trung bình: ${Math.floor(stats.avgTime / 60)} phút ${stats.avgTime % 60} giây.`),
          createParagraph(`Phân khúc thời gian hoàn thành bài thi của học sinh:`),
          createParagraph(`+ Dưới 5 phút: ${timeGroups.under5} học sinh.`),
          createParagraph(`+ Từ 5 - 10 phút: ${timeGroups.from5to10} học sinh.`),
          createParagraph(`+ Từ 10 - 15 phút: ${timeGroups.from10to15} học sinh.`),
          createParagraph(`+ Trên 15 phút: ${timeGroups.over15} học sinh.`),

          createHeading("6. Đánh giá công tác tổ chức"),
          createParagraph("Trong quá trình tổ chức, hệ thống thi trực tuyến hoạt động ổn định, minh bạch và chính xác. Không ghi nhận các sự cố kỹ thuật nghiêm trọng gây gián đoạn ảnh hưởng đến quá trình thi của thí sinh. Hệ thống máy chủ có khả năng đáp ứng đồng thời số lượng lớn thí sinh tham gia cùng lúc."),

          createHeading("7. Những kết quả đạt được"),
          createParagraph("Cuộc thi đã tạo được phong trào thi đua sôi nổi hướng tới kỷ niệm 30 năm thành lập trường. " + (goodRate > 50 ? `Đa số học sinh đã có sự đầu tư nghiên cứu tài liệu kỹ lưỡng, thể hiện qua tỷ lệ học sinh đạt điểm Khá, Giỏi chiếm tỷ lệ cao (${goodRate}%).` : "Các em học sinh đã bám sát được các nội dung cốt lõi về lịch sử phát triển nhà trường.")),

          createHeading("8. Tồn tại, hạn chế và nguyên nhân"),
          createParagraph("- Về số lượng: " + (unparticipatedClasses.length > 0 ? `Vẫn còn ${unparticipatedClasses.length} lớp chưa có học sinh tham gia. Mức độ tham gia ở một số đơn vị lớp chưa đồng đều.` : "Mức độ hưởng ứng của các khối lớp khá đồng đều, tuy nhiên một số cá nhân vẫn chưa chủ động trong công tác dự thi.")),
          createParagraph("- Về chất lượng: " + (weakRate > 20 ? `Tỷ lệ học sinh đạt điểm dưới trung bình còn khá cao (${weakRate}%). Điều này phản ánh việc nghiên cứu nội dung của một số bộ phận học sinh chưa sâu.` : "Vẫn còn một số ít học sinh thi với tâm lý đối phó nên kết quả chưa cao.")),
          createParagraph("- Nguyên nhân: Công tác đôn đốc, phát động ở một số giáo viên chủ nhiệm có lúc chưa được thường xuyên. Nhiều học sinh chưa tiếp cận sâu với tài liệu tuyên truyền truyền thống của nhà trường trước khi làm bài."),

          createHeading("9. Bài học kinh nghiệm"),
          createParagraph("Cần tăng cường hơn nữa công tác truyền thông trước và trong thời gian thi qua các kênh trực tuyến (Fanpage, Zalo lớp). Phát huy mạnh mẽ vai trò trực tiếp của Đoàn thanh niên và Giáo viên chủ nhiệm trong việc lan tỏa ý nghĩa cuộc thi."),

          createHeading("10. Kiến nghị, đề xuất"),
          createParagraph("- Đề nghị nhà trường biểu dương, khen thưởng kịp thời các tập thể và cá nhân đạt thành tích cao trong cuộc thi (theo danh sách đính kèm)."),
          createParagraph("- Đề nghị các GVCN tiếp tục nhắc nhở học sinh ở những lớp có kết quả chưa cao để rút kinh nghiệm cho các hoạt động ngoại khóa tiếp theo."),
          createParagraph("- Sử dụng kết quả cuộc thi làm căn cứ đánh giá mức độ hưởng ứng phong trào thi đua đợt chào mừng kỷ niệm 30 năm thành lập trường của các tập thể lớp."),

          createHeading("11. Đánh giá chung"),
          createParagraph("Cuộc thi cơ bản đã đạt được mục tiêu đề ra về công tác giáo dục chính trị tư tưởng, khơi dậy niềm tự hào truyền thống nhà trường trong mỗi học sinh. Qua đó, tiếp tục củng cố, lan tỏa những giá trị tốt đẹp trong chặng đường 30 năm hình thành và phát triển của Trường THPT Cao Bá Quát. Kính báo cáo Lãnh đạo trường xem xét, chỉ đạo./."),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // Signatures
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Nơi nhận:", font: "Times New Roman", size: 24, bold: true, italics: true })] }),
                      new Paragraph({ children: [new TextRun({ text: "- Lãnh đạo Trường (để b/c);", font: "Times New Roman", size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: "- Các tổ chuyên môn, GVCN (để t/h);", font: "Times New Roman", size: 22 })] }),
                      new Paragraph({ children: [new TextRun({ text: "- Lưu: VT.", font: "Times New Roman", size: 22 })] }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TM. BAN TỔ CHỨC", font: "Times New Roman", size: 26, bold: true })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TRƯỞNG BAN", font: "Times New Roman", size: 26, bold: true })] }),
                      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(Ký, ghi rõ họ tên)", font: "Times New Roman", size: 24, italics: true })] }),
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
  link.download = `Bao_Cao_Tong_Ket_Chi_Tiet_${Date.now()}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
