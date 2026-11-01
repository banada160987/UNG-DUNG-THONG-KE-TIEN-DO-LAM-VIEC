import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

/**
 * Đọc nội dung file Word (.docx), Excel (.xlsx, .xls) hoặc file văn bản (.txt) sang chuỗi text
 */
export async function readExamFileAsText(file) {
  if (!file) return '';

  const fileName = file.name.toLowerCase();

  // 1. File Excel (.xlsx, .xls)
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      return parseExcelToExamText(arrayBuffer);
    } catch (err) {
      console.warn("Lỗi đọc Excel, thử chuyển văn bản dự phòng:", err);
    }
  }

  // 2. File văn bản thuần (.txt)
  if (fileName.endsWith('.txt')) {
    return await file.text();
  }

  // 3. File Word (.docx)
  if (fileName.endsWith('.docx')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value || '';
    } catch (err) {
      console.warn("Lỗi đọc bằng mammoth, thử đọc văn bản dự phòng:", err);
      return await file.text();
    }
  }

  // Các file khác (.doc, .pdf): đọc qua FileReader dạng text
  return await file.text();
}

/**
 * Chuyển đổi dữ liệu bảng tính Excel (.xlsx, .xls) thành cấu trúc văn bản chuẩn GDPT 2018
 */
export function parseExcelToExamText(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  let generatedText = '';

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;
    const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!jsonData || jsonData.length === 0) return;

    const sheetLower = sheetName.toLowerCase();
    if (sheetLower.includes('phan 1') || sheetLower.includes('phần 1') || sheetLower.includes('trac nghiem') || sheetLower.includes('mcq')) {
      generatedText += '\n[PHẦN 1]\n';
    } else if (sheetLower.includes('phan 2') || sheetLower.includes('phần 2') || sheetLower.includes('dung sai') || sheetLower.includes('tf')) {
      generatedText += '\n[PHẦN 2]\n';
    } else if (sheetLower.includes('phan 3') || sheetLower.includes('phần 3') || sheetLower.includes('dien so') || sheetLower.includes('tra loi ngan')) {
      generatedText += '\n[PHẦN 3]\n';
    } else if (sheetLower.includes('tu luan') || sheetLower.includes('essay')) {
      generatedText += '\n[TỰ LUẬN]\n';
    }

    jsonData.forEach((row, idx) => {
      const keys = Object.keys(row);
      const getVal = (...names) => {
        for (const name of names) {
          const match = keys.find(k => k.trim().toLowerCase() === name.toLowerCase());
          if (match && row[match] !== undefined && row[match] !== '') return String(row[match]).trim();
        }
        return '';
      };

      const part = getVal('phan', 'phần', 'part', 'dang', 'loai', 'dạng');
      const stt = getVal('cau', 'câu', 'stt', 'id', 'no') || (idx + 1);
      const content = getVal('noidung', 'nội dung', 'cauhoi', 'câu hỏi', 'content', 'question');
      const level = getVal('mucdo', 'mức độ', 'level', 'capdo') || 'TH';
      const optA = getVal('a', 'opt a', 'phương án a', 'option a', 'pa a', 'phuong an a');
      const optB = getVal('b', 'opt b', 'phương án b', 'option b', 'pa b', 'phuong an b');
      const optC = getVal('c', 'opt c', 'phương án c', 'option c', 'pa c', 'phuong an c');
      const optD = getVal('d', 'opt d', 'phương án d', 'option d', 'pa d', 'phuong an d');
      const answer = getVal('dapan', 'đáp án', 'da', 'answer', 'correct');
      const explanation = getVal('loigiai', 'lời giải', 'giaithich', 'giải thích', 'explanation', 'hdg');

      if (!content) return;

      let levelTag = '[TH]';
      const lvlLow = level.toLowerCase();
      if (lvlLow.includes('nb') || lvlLow.includes('nhan biet') || lvlLow.includes('nhận biết')) levelTag = '[NB]';
      else if (lvlLow.includes('vdc') || lvlLow.includes('van dung cao') || lvlLow.includes('vận dụng cao')) levelTag = '[VDC]';
      else if (lvlLow.includes('vd') || lvlLow.includes('van dung') || lvlLow.includes('vận dụng')) levelTag = '[VD]';

      const subA = getVal('y a', 'ý a', 'menh de a', 'mệnh đề a');
      const subB = getVal('y b', 'ý b', 'menh de b', 'mệnh đề b');
      const subAnsA = getVal('da a', 'đáp án a', 'dung sai a');
      const subAnsB = getVal('da b', 'đáp án b', 'dung sai b');
      const shortAns = getVal('dapso', 'đáp số', 'short answer', 'gia tri');

      if (part.toLowerCase().includes('2') || subA) {
        generatedText += `\nCâu ${stt}: ${levelTag} ${content}\n`;
        const subC = getVal('y c', 'ý c', 'menh de c', 'mệnh đề c');
        const subD = getVal('y d', 'ý d', 'menh de d', 'mệnh đề d');
        const subAnsC = getVal('da c', 'đáp án c', 'dung sai c');
        const subAnsD = getVal('da d', 'đáp án d', 'dung sai d');

        const isTrue = (val) => ['d', 'đ', 'đúng', 'dung', 'true', '1'].includes(String(val).trim().toLowerCase());

        generatedText += `a) ${subA || optA} [${isTrue(subAnsA) ? 'Đúng' : 'Sai'}]\n`;
        generatedText += `b) ${subB || optB} [${isTrue(subAnsB) ? 'Đúng' : 'Sai'}]\n`;
        if (subC || optC) generatedText += `c) ${subC || optC} [${isTrue(subAnsC) ? 'Đúng' : 'Sai'}]\n`;
        if (subD || optD) generatedText += `d) ${subD || optD} [${isTrue(subAnsD) ? 'Đúng' : 'Sai'}]\n`;
      } else if (part.toLowerCase().includes('3') || shortAns) {
        generatedText += `\nCâu ${stt}: ${levelTag} ${content}\n`;
        generatedText += `Đáp số: ${shortAns || answer}\n`;
      } else {
        generatedText += `\nCâu ${stt}: ${levelTag} ${content}\n`;
        if (optA) generatedText += `A. ${optA}\n`;
        if (optB) generatedText += `B. ${optB}\n`;
        if (optC) generatedText += `C. ${optC}\n`;
        if (optD) generatedText += `D. ${optD}\n`;
        if (answer) generatedText += `Đáp án: ${answer.toUpperCase()}\n`;
      }

      if (explanation) {
        generatedText += `Lời giải: ${explanation}\n`;
      }
    });
  });

  return generatedText;
}

/**
 * Tạo file Excel mẫu chuẩn nhập câu hỏi trắc nghiệm GDPT 2018 (Phần 1, 2, 3)
 * Tuân thủ quy tắc tên file GEMINI.md
 */
export function downloadExcelQuestionTemplate() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Phần 1 - Nhiều lựa chọn
  const dataP1 = [
    {
      "STT": 1,
      "Mức độ": "NB",
      "Nội dung câu hỏi": "Cho cấp số cộng (u_n) có u_1 = 3 và công sai d = 2. Giá trị của u_2 bằng:",
      "Phương án A": "5",
      "Phương án B": "6",
      "Phương án C": "1",
      "Phương án D": "-1",
      "Đáp án đúng": "A",
      "Lời giải": "Áp dụng công thức u_2 = u_1 + d = 3 + 2 = 5."
    },
    {
      "STT": 2,
      "Mức độ": "TH",
      "Nội dung câu hỏi": "Nghiệm của phương trình log_2(x - 1) = 3 là:",
      "Phương án A": "x = 9",
      "Phương án B": "x = 7",
      "Phương án C": "x = 8",
      "Phương án D": "x = 10",
      "Đáp án đúng": "A",
      "Lời giải": "Điều kiện x > 1. Ta có x - 1 = 2^3 = 8 => x = 9 (nhận)."
    }
  ];
  const ws1 = XLSX.utils.json_to_sheet(dataP1);
  XLSX.utils.book_append_sheet(wb, ws1, "Phần 1 - Trắc nghiệm 4 PA");

  // Sheet 2: Phần 2 - Đúng / Sai
  const dataP2 = [
    {
      "STT": 1,
      "Mức độ": "VD",
      "Nội dung câu hỏi": "Cho hàm số f(x) = x^3 - 3x + 2. Xét tính đúng sai của các khẳng định sau:",
      "Ý a": "Hàm số đồng biến trên khoảng (1; +vô cùng)",
      "Đáp án a (Đ/S)": "Đ",
      "Ý b": "Điểm cực đại của đồ thị hàm số là (1; 0)",
      "Đáp án b (Đ/S)": "S",
      "Ý c": "Giá trị nhỏ nhất của hàm số trên đoạn [0; 2] bằng 0",
      "Đáp án c (Đ/S)": "Đ",
      "Ý d": "Phương trình f(x) = m có 3 nghiệm phân biệt khi 0 < m < 4",
      "Đáp án d (Đ/S)": "Đ",
      "Lời giải": "f'(x) = 3x^2 - 3. Nghiệm x = 1, x = -1."
    }
  ];
  const ws2 = XLSX.utils.json_to_sheet(dataP2);
  XLSX.utils.book_append_sheet(wb, ws2, "Phần 2 - Đúng Sai");

  // Sheet 3: Phần 3 - Trả lời ngắn / Điền số
  const dataP3 = [
    {
      "STT": 1,
      "Mức độ": "VD",
      "Nội dung câu hỏi": "Một xưởng sản xuất cần làm những chiếc thùng hình trụ có nắp bằng tôn có dung tích V = 54pi (m^3). Bán kính đáy của thùng (đơn vị: mét) để tiết kiệm vật liệu nhất bằng bao nhiêu?",
      "Đáp số": "3",
      "Lời giải": "Thể tích V = pi*r^2*h => h = 54/r^2. Diện tích toàn phần S = 2pi*r^2 + 2pi*r*h = 2pi*(r^2 + 54/r). Đạo hàm giải r = 3."
    }
  ];
  const ws3 = XLSX.utils.json_to_sheet(dataP3);
  XLSX.utils.book_append_sheet(wb, ws3, "Phần 3 - Trả lời ngắn");

  // Tên file tuân thủ quy tắc số thứ tự GEMINI.md
  const fileName = '1-Mau_nhap_cau_hoi_trac_nghiem_GDPT2018_CBQ.xlsx';
  XLSX.writeFile(wb, fileName);
}

/**
 * Trình phân tích văn bản đề thi thông minh chuẩn GDPT 2018 (Phần I, II, III và Tự luận)
 * Nhận diện thẻ mức độ: [NB], [TH], [VD], [VDC]
 * Nhận diện đáp án đúng: *A. hoặc Đáp án: A
 * Nhận diện Đúng/Sai: a) [Đúng] b) [Sai]
 * Nhận diện Trả lời ngắn: Đáp số: ...
 * Nhận diện Tự luận: Thang điểm, Hướng dẫn chấm, Bareme
 */
export function parseExamText(rawText, defaultLevel = 'Thông hiểu') {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const parsedQuestions = [];
  let currentPart = 'part1';
  let currentQ = null;

  lines.forEach((line) => {
    const lower = line.toLowerCase();

    // 1. Nhận diện chuyển phần thi (Section Headers)
    if (lower.includes('phần i') || lower.includes('phan i') || lower.includes('[phần 1]') || lower.includes('[p1]')) {
      if (currentQ) { parsedQuestions.push(finalizeQuestion(currentQ)); currentQ = null; }
      currentPart = 'part1';
      return;
    }
    if (lower.includes('phần ii') || lower.includes('phan ii') || lower.includes('[phần 2]') || lower.includes('[p2]') || lower.includes('đúng / sai') || lower.includes('đúng/sai')) {
      if (currentQ) { parsedQuestions.push(finalizeQuestion(currentQ)); currentQ = null; }
      currentPart = 'part2';
      return;
    }
    if (lower.includes('phần iii') || lower.includes('phan iii') || lower.includes('[phần 3]') || lower.includes('[p3]') || lower.includes('trả lời ngắn')) {
      if (currentQ) { parsedQuestions.push(finalizeQuestion(currentQ)); currentQ = null; }
      currentPart = 'part3';
      return;
    }
    if (lower.includes('tự luận') || lower.includes('tu luan') || lower.includes('phần iv') || lower.includes('phan iv') || lower.includes('[tự luận]') || lower.includes('[tl]')) {
      if (currentQ) { parsedQuestions.push(finalizeQuestion(currentQ)); currentQ = null; }
      currentPart = 'essay';
      return;
    }

    // 2. Nhận diện bắt đầu một câu hỏi mới: "Câu 1:", "Bài 1.", "Câu 1 (NB):"
    const questionMatch = line.match(/^(câu|cau|bài|bai|question)\s*(\d+)[\:\.]?\s*(.*)/i);
    if (questionMatch) {
      if (currentQ) {
        parsedQuestions.push(finalizeQuestion(currentQ));
      }

      let rawContent = questionMatch[3] || '';
      let detectedLevel = defaultLevel;
      let detectedPart = currentPart;
      let detectedMaxScore = currentPart === 'essay' ? 2.0 : undefined;

      // Quét thẻ mức độ nhận thức: [NB], [TH], [VD], [VDC] hoặc <NB>, (NB)...
      if (/\[NB\]|\<NB\>|\(NB\)/i.test(line)) {
        detectedLevel = 'Nhận biết';
        rawContent = rawContent.replace(/\[NB\]|\<NB\>|\(NB\)/gi, '').trim();
      } else if (/\[TH\]|\<TH\>|\(TH\)/i.test(line)) {
        detectedLevel = 'Thông hiểu';
        rawContent = rawContent.replace(/\[TH\]|\<TH\>|\(TH\)/gi, '').trim();
      } else if (/\[VDC\]|\<VDC\>|\(VDC\)/i.test(line)) {
        detectedLevel = 'Vận dụng cao';
        rawContent = rawContent.replace(/\[VDC\]|\<VDC\>|\(VDC\)/gi, '').trim();
      } else if (/\[VD\]|\<VD\>|\(VD\)/i.test(line)) {
        detectedLevel = 'Vận dụng';
        rawContent = rawContent.replace(/\[VD\]|\<VD\>|\(VD\)/gi, '').trim();
      }

      // Quét thẻ phần thi nếu có: [TL], [P1], [P2], [P3]
      if (/\[TL\]|\[TỰ LUẬN\]|\(TỰ LUẬN\)/i.test(line)) {
        detectedPart = 'essay';
        rawContent = rawContent.replace(/\[TL\]|\[TỰ LUẬN\]|\(TỰ LUẬN\)/gi, '').trim();
      } else if (/\[P1\]/i.test(line)) {
        detectedPart = 'part1';
      } else if (/\[P2\]/i.test(line)) {
        detectedPart = 'part2';
      } else if (/\[P3\]/i.test(line)) {
        detectedPart = 'part3';
      }

      // Quét điểm số cho câu tự luận: ví dụ "(2.0 điểm)" hoặc "(1.5đ)"
      const scoreMatch = line.match(/\(?(\d+(?:[\.,]\d+)?)\s*(?:đ|điểm|diem)\)?/i);
      if (scoreMatch && detectedPart === 'essay') {
        detectedMaxScore = parseFloat(scoreMatch[1].replace(',', '.')) || 2.0;
      }

      currentQ = {
        id: `imported_${Date.now()}_${parsedQuestions.length}`,
        part: detectedPart,
        level: detectedLevel,
        title: `Câu ${parsedQuestions.length + 1} (${detectedPart === 'part1' ? 'Phần I' : detectedPart === 'part2' ? 'Phần II' : detectedPart === 'part3' ? 'Phần III' : `Tự Luận - ${detectedMaxScore || 2.0}đ`})`,
        content: rawContent || line,
        options: [],
        correctAnswerIndex: 0,
        subItems: [],
        shortAnswer: '',
        maxScore: detectedMaxScore,
        rubric: detectedPart === 'essay' ? [] : undefined,
        explanation: '',
        status: 'approved'
      };
      return;
    }

    if (!currentQ) return;

    // 3. Xử lý Phương án Phần I (A, B, C, D)
    if (currentQ.part === 'part1') {
      const optionMatch = line.match(/^(\*?)([A-D])[\.\:\)]\s*(.*)/i);
      if (optionMatch) {
        const hasStar = optionMatch[1] === '*';
        const optText = optionMatch[3];
        const isCorrect = hasStar || line.includes('✅') || line.toLowerCase().includes('(đáp án đúng)') || line.toLowerCase().includes('[đúng]');
        const cleanText = optText.replace(/\*|✅|\(đáp án đúng\)|\(dung\)|\[đúng\]/gi, '').trim();

        currentQ.options.push(cleanText);
        if (isCorrect) {
          currentQ.correctAnswerIndex = currentQ.options.length - 1;
        }
        return;
      }

      const keyMatch = line.match(/^(đáp án|dap an|key)\s*[\:\=]\s*([A-D])/i);
      if (keyMatch) {
        const letter = keyMatch[2].toUpperCase();
        currentQ.correctAnswerIndex = ['A', 'B', 'C', 'D'].indexOf(letter);
        return;
      }
    }

    // 4. Xử lý Mệnh đề Phần II (a, b, c, d Đúng/Sai)
    if (currentQ.part === 'part2') {
      const subMatch = line.match(/^([a-d])[\.\:\)]\s*(.*)/i);
      if (subMatch) {
        const subKey = subMatch[1].toLowerCase();
        let subText = subMatch[2];
        let isTrue = true;

        if (subText.toLowerCase().includes('[sai]') || subText.toLowerCase().includes('(sai)') || subText.toLowerCase().includes('[s]') || subText.toLowerCase().includes('(s)')) {
          isTrue = false;
        } else if (subText.toLowerCase().includes('[đúng]') || subText.toLowerCase().includes('(đúng)') || subText.toLowerCase().includes('[đ]') || subText.toLowerCase().includes('(đ)')) {
          isTrue = true;
        }

        subText = subText.replace(/\[đúng\]|\[sai\]|\(đúng\)|\(sai\)|\[đ\]|\[s\]|\(đ\)|\(s\)/gi, '').trim();
        currentQ.subItems.push({ key: subKey, text: subText, isTrue });
        return;
      }
    }

    // 5. Xử lý Đáp số Phần III (Trả lời ngắn)
    if (currentQ.part === 'part3') {
      const shortMatch = line.match(/^(đáp số|dap so|đáp án|dap an|kết quả|ket qua)\s*[\:\=]\s*(.*)/i);
      if (shortMatch) {
        currentQ.shortAnswer = shortMatch[2].trim();
        return;
      }
    }

    // 6. Xử lý Bareme / Tiêu chí của Phần Tự luận
    if (currentQ.part === 'essay') {
      // Dạng: "- Ý 1 (Nêu định nghĩa): 0.5đ" hoặc "+ 0.5đ: Nêu định nghĩa"
      const rubricMatch1 = line.match(/^[-\*•]\s*(.+?)\s*[\:\-]\s*(\d+(?:[\.,]\d+)?)\s*(?:đ|điểm)/i);
      const rubricMatch2 = line.match(/^[-\*•]?\s*\+?\s*(\d+(?:[\.,]\d+)?)\s*(?:đ|điểm)\s*[\:\-]\s*(.+)/i);

      if (rubricMatch1) {
        currentQ.rubric.push({
          criteria: rubricMatch1[1].trim(),
          score: parseFloat(rubricMatch1[2].replace(',', '.')) || 0.5
        });
        return;
      } else if (rubricMatch2) {
        currentQ.rubric.push({
          criteria: rubricMatch2[2].trim(),
          score: parseFloat(rubricMatch2[1].replace(',', '.')) || 0.5
        });
        return;
      }
    }

    // 7. Xử lý Lời giải chi tiết
    if (line.toLowerCase().startsWith('lời giải:') || line.toLowerCase().startsWith('hướng dẫn giải:') || line.toLowerCase().startsWith('hdg:') || line.toLowerCase().startsWith('hướng dẫn chấm:')) {
      currentQ.explanation = line.replace(/^(lời giải|hướng dẫn giải|hdg|hướng dẫn chấm)[\:\.]\s*/i, '').trim();
      return;
    }

    // Ghép nối nội dung nhiều dòng
    if (currentQ.options.length === 0 && currentQ.subItems.length === 0 && !currentQ.shortAnswer && (!currentQ.rubric || currentQ.rubric.length === 0)) {
      currentQ.content += ' ' + line;
    } else if (currentQ.explanation) {
      currentQ.explanation += ' ' + line;
    }
  });

  if (currentQ) {
    parsedQuestions.push(finalizeQuestion(currentQ));
  }

  return parsedQuestions;
}

/**
 * Chuẩn hóa một câu hỏi trước khi trả về
 */
function finalizeQuestion(q) {
  // Đảm bảo Part 1 có 4 phương án
  if (q.part === 'part1' && q.options.length < 4) {
    while (q.options.length < 4) {
      q.options.push(`Phương án ${['A', 'B', 'C', 'D'][q.options.length]}`);
    }
  }

  // Đảm bảo Part 2 có 4 ý a, b, c, d
  if (q.part === 'part2' && q.subItems.length < 4) {
    const existingKeys = q.subItems.map(s => s.key);
    ['a', 'b', 'c', 'd'].forEach(k => {
      if (!existingKeys.includes(k)) {
        q.subItems.push({ key: k, text: `Mệnh đề ${k}`, isTrue: true });
      }
    });
  }

  // Đảm bảo Essay có rubric mặc định nếu trống
  if (q.part === 'essay') {
    if (!q.rubric || q.rubric.length === 0) {
      const half = ((q.maxScore || 2.0) / 2).toFixed(2);
      q.rubric = [
        { criteria: 'Ý 1: Nêu đúng bản chất, định lý hoặc căn cứ thực tiễn', score: parseFloat(half) },
        { criteria: 'Ý 2: Trình bày lập luận logic và kết luận chính xác', score: parseFloat(half) }
      ];
    }
  }

  return q;
}
