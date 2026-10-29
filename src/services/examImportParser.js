import mammoth from 'mammoth';

/**
 * Đọc nội dung file Word (.docx) hoặc file văn bản (.txt) sang chuỗi text
 */
export async function readExamFileAsText(file) {
  if (!file) return '';

  const fileName = file.name.toLowerCase();

  // File văn bản thuần
  if (fileName.endsWith('.txt')) {
    return await file.text();
  }

  // File Word .docx
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
