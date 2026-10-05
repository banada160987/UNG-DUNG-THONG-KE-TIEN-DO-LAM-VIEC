/**
 * Smart Parser for Weekly School Schedules (Lịch Công Tác Tuần)
 * Supports parsing pasted text from PDF scans, Word documents, or Excel tables.
 * High School: THPT Cao Bá Quát - Đắk Lắk
 */

export const SAMPLE_WEEK_5_TEXT = `KẾ HOẠCH LỊCH CÔNG TÁC TUẦN 05 (NĂM HỌC 2026 - 2027)
(Từ ngày 05/10/2026 đến ngày 11/10/2026)
Cư Kuin, ngày 04 tháng 10 năm 2026

Thứ Hai (05/10/2026):
- Sáng:
  + 6h45: Chào cờ; Hoạt động tuyên truyền học tập suốt đời; | Sân trường | Toàn trường
  + 7h30: Tham dự Hội nghị phòng, chống tội phạm và tệ nạn xã hội tại cơ quan, trường học | Hội trường Thành phố Buôn Ma Thuột | Đ/c Lam
  + 8h00: Tham dự Hội nghị Tổng kết năm học 2025 - 2026 khối các trường THPT thuộc Cụm thi đua số 2 | Trường THPT Buôn Ma Thuột | Đ/c Thảo
  + Dạy và học theo TKB | Lớp học | GV, HS
- Chiều:
  + 14h00: Tham dự Hội nghị GDPT năm học 2026 - 2027 | Trực tuyến | Đ/c Lam
  + 14h30: Bồi dưỡng HSG | Phòng học | GV, HS
  + Dạy và học theo TKB | Lớp học | GV, HS

Thứ Ba (06/10/2026):
- Sáng:
  + 7h30: Tham dự Hội nghị Báo cáo viên Tỉnh ủy tháng 10 năm 2026 | Hội trường Ban Thường vụ Tỉnh ủy | Đ/c Lam
  + Dạy và học theo TKB | Lớp học | GV, HS
- Chiều:
  + 14h00: Tham dự Hội nghị sơ kết công tác Đảng bộ Khối CCQ&DN tỉnh 9 tháng đầu năm 2026 | Hội trường Trung tâm Văn hóa Tỉnh | Đ/c Thảo
  + 14h30: Bồi dưỡng HSG | Phòng học | GV, HS
  + 15h30: Sinh hoạt chuyên môn theo nghiên cứu bài học (Tổ Sử - GDCD, Địa lí) | Phòng học | GV trong tổ

Thứ Tư (07/10/2026):
- Sáng:
  Dạy và học theo TKB | Lớp học | GV, HS
- Chiều:
  + 14h00: Họp kiểm điểm viên chức theo Công văn 1789/SGDĐT-TCCB ngày 28/9/2026 của Sở GD&ĐT | Phòng Hội đồng | BGH, BCH CĐ, TTCM, Tổ trưởng Văn phòng
  + 15h30: Sinh hoạt CLB | Phòng học, sân trường | GV, HS
  + Dạy và học theo TKB | Lớp học | GV, HS

Thứ Năm (08/10/2026):
- Sáng: Dạy và học theo TKB | Lớp học | GV, HS
- Chiều: Dạy và học theo TKB; Sinh hoạt CLB | Phòng học, sân trường | GV, HS

Thứ Sáu (09/10/2026):
- Sáng: Dạy và học theo TKB | Lớp học | GV, HS
- Chiều: Dạy và học theo TKB; Sinh hoạt CLB | Phòng học, sân trường | GV, HS

Thứ Bảy (10/10/2026):
- Sáng: Nghỉ | - | -
- Chiều: Nghỉ | - | -

Chủ Nhật (11/10/2026):
- Sáng: Nghỉ | - | -
- Chiều: Nghỉ | - | -

*Lưu ý:
- Đoàn trường phối hợp với Thư viện tổ chức hoạt động tuyên truyền Tuần lễ hưởng ứng học tập suốt đời năm 2026 trong giờ Chào cờ;
- Văn phòng chuẩn bị phòng họp, thiết bị âm thanh, nước uống các cuộc họp;
- Các tổ, bộ phận, cá nhân có liên quan chủ động chuẩn bị các nội dung, báo cáo Lãnh đạo trường để thực hiện./.

Nơi nhận:
- GV, NV (để t/h);
- Các Tổ CM thuộc trường;
- HT, các PHT;
- Đăng Web, Zalo;
- Lưu: VT, TK.

HIỆU TRƯỜNG
Lê Thị Thảo`;

/**
 * Normalizes day name string to canonical day key
 */
function normalizeDayHeader(line) {
  const lower = line.toLowerCase();
  if (lower.includes('thứ hai') || lower.includes('thứ 2') || lower.includes('thu hai') || lower.includes('thu 2')) return 0;
  if (lower.includes('thứ ba') || lower.includes('thứ 3') || lower.includes('thu ba') || lower.includes('thu 3')) return 1;
  if (lower.includes('thứ tư') || lower.includes('thứ 4') || lower.includes('thu tu') || lower.includes('thu 4')) return 2;
  if (lower.includes('thứ năm') || lower.includes('thứ 5') || lower.includes('thu nam') || lower.includes('thu 5')) return 3;
  if (lower.includes('thứ sáu') || lower.includes('thứ 6') || lower.includes('thu sau') || lower.includes('thu 6')) return 4;
  if (lower.includes('thứ bảy') || lower.includes('thứ 7') || lower.includes('thu bay') || lower.includes('thu 7')) return 5;
  if (lower.includes('chủ nhật') || lower.includes('chu nhat') || lower.includes('cn')) return 6;
  return -1;
}

/**
 * Intelligently parse raw text into 14 day session items and metadata
 */
export function parseWeeklyScheduleText(rawText, targetWeek = null) {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return null;
  }

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const dayDefinitions = [
    { name: 'Thứ 2', defaultDateStr: '05/10' },
    { name: 'Thứ Ba', defaultDateStr: '06/10' },
    { name: 'Thứ Tư', defaultDateStr: '07/10' },
    { name: 'Thứ Năm', defaultDateStr: '08/10' },
    { name: 'Thứ Sáu', defaultDateStr: '09/10' },
    { name: 'Thứ Bảy', defaultDateStr: '10/10' },
    { name: 'Chủ Nhật', defaultDateStr: '11/10' }
  ];

  // Set real date strings based on targetWeek if available
  if (targetWeek && targetWeek.monday) {
    const monday = new Date(targetWeek.monday);
    const pad = (n) => String(n).padStart(2, '0');
    dayDefinitions.forEach((d, idx) => {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + idx);
      d.defaultDateStr = `${pad(cur.getDate())}/${pad(cur.getMonth() + 1)}`;
    });
  }

  const resultDays = [];
  dayDefinitions.forEach((d) => {
    resultDays.push({
      day_name: d.name,
      date_str: d.defaultDateStr,
      session: 'Sáng',
      content: '',
      location: '',
      participants: ''
    });
    resultDays.push({
      day_name: d.name,
      date_str: d.defaultDateStr,
      session: 'Chiều',
      content: '',
      location: '',
      participants: ''
    });
  });

  let currentDayIndex = -1; // 0..6
  let currentSession = 'Sáng'; // 'Sáng' | 'Chiều'

  let parsedTitle = '';
  let parsedDateRange = '';
  let parsedReleaseDate = '';
  let parsedNote = '';
  let parsedRecipients = '';
  let parsedSigner = 'Lê Thị Thảo';
  let isReadingNote = false;
  let isReadingRecipients = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for Note section
    if (line.toLowerCase().startsWith('*lưu ý') || line.toLowerCase().startsWith('lưu ý:')) {
      isReadingNote = true;
      isReadingRecipients = false;
      parsedNote += line + '\n';
      continue;
    }

    // Check for Recipients section
    if (line.toLowerCase().startsWith('nơi nhận:')) {
      isReadingRecipients = true;
      isReadingNote = false;
      parsedRecipients += line + '\n';
      continue;
    }

    if (isReadingNote) {
      if (line.toLowerCase().startsWith('nơi nhận:') || line.toUpperCase().includes('HIỆU TRƯỞNG')) {
        isReadingNote = false;
      } else {
        parsedNote += line + '\n';
        continue;
      }
    }

    if (isReadingRecipients) {
      if (line.toUpperCase().includes('HIỆU TRƯỞNG')) {
        isReadingRecipients = false;
      } else {
        parsedRecipients += line + '\n';
        continue;
      }
    }

    // Check for Signer Name
    if (line.includes('Lê Thị Thảo') || (i > 0 && lines[i - 1].toUpperCase().includes('HIỆU TRƯỞNG'))) {
      if (!line.toUpperCase().includes('HIỆU TRƯỞNG')) {
        parsedSigner = line.trim();
        continue;
      }
    }

    // Check for Header info
    if (line.toUpperCase().includes('LỊCH CÔNG TÁC TUẦN') || line.toUpperCase().includes('KẾ HOẠCH')) {
      if (!parsedTitle && line.length > 15) {
        parsedTitle = line;
      }
      continue;
    }

    if (line.toLowerCase().includes('từ ngày') && line.toLowerCase().includes('đến ngày')) {
      parsedDateRange = line.replace(/^\(|\)$/g, '').trim();
      continue;
    }

    if (line.toLowerCase().includes('ngày') && line.toLowerCase().includes('tháng') && line.toLowerCase().includes('năm 202')) {
      if (!parsedReleaseDate) {
        parsedReleaseDate = line;
        continue;
      }
    }

    // Check for Day header
    const detectedDay = normalizeDayHeader(line);
    if (detectedDay !== -1) {
      currentDayIndex = detectedDay;
      currentSession = 'Sáng'; // Default to morning when entering new day

      // Try extract date from line e.g. "Thứ Hai (05/10/2026):"
      const dateMatch = line.match(/(\d{1,2}\/\d{1,2})/);
      if (dateMatch) {
        resultDays[currentDayIndex * 2].date_str = dateMatch[1];
        resultDays[currentDayIndex * 2 + 1].date_str = dateMatch[1];
      }
      continue;
    }

    // If inside a day, check for Session switch
    const lower = line.toLowerCase();
    if (lower.startsWith('- sáng:') || lower.startsWith('sáng:') || lower === 'sáng' || lower.startsWith('+ sáng:')) {
      currentSession = 'Sáng';
      continue;
    }

    if (lower.startsWith('- chiều:') || lower.startsWith('chiều:') || lower === 'chiều' || lower.startsWith('+ chiều:')) {
      currentSession = 'Chiều';
      continue;
    }

    // If we have an active day and session, process the line content
    if (currentDayIndex >= 0 && currentDayIndex <= 6) {
      const targetSessionIdx = currentDayIndex * 2 + (currentSession === 'Chiều' ? 1 : 0);
      const targetItem = resultDays[targetSessionIdx];

      // Clean line prefixes like "- ", "+ ", "* "
      let cleanLine = line;
      if (cleanLine.startsWith('- Sáng:') || cleanLine.startsWith('- Chiều:')) {
        // Line like "- Sáng: Dạy và học theo TKB | Lớp học | GV, HS"
        if (cleanLine.startsWith('- Sáng:')) {
          currentSession = 'Sáng';
          cleanLine = cleanLine.substring(7).trim();
        } else {
          currentSession = 'Chiều';
          cleanLine = cleanLine.substring(8).trim();
        }
      }

      // Check if line contains pipe '|' or tab '\t' separators (Nội dung | Địa điểm | Thành phần)
      if (cleanLine.includes('|') || cleanLine.includes('\t')) {
        const parts = cleanLine.split(/[|\t]/).map(p => p.trim()).filter(Boolean);
        const lineContent = parts[0] || '';
        const lineLoc = parts[1] || '';
        const linePart = parts[2] || '';

        if (lineContent) {
          targetItem.content = targetItem.content ? `${targetItem.content}\n${lineContent}` : lineContent;
        }
        if (lineLoc) {
          targetItem.location = targetItem.location ? `${targetItem.location}\n${lineLoc}` : lineLoc;
        }
        if (linePart) {
          targetItem.participants = targetItem.participants ? `${targetItem.participants}\n${linePart}` : linePart;
        }
      } else {
        // Plain text line
        targetItem.content = targetItem.content ? `${targetItem.content}\n${cleanLine}` : cleanLine;
        if (!targetItem.location && cleanLine.toLowerCase().includes('tkb')) {
          targetItem.location = 'Lớp học';
        }
        if (!targetItem.participants && cleanLine.toLowerCase().includes('tkb')) {
          targetItem.participants = 'GV, HS';
        }
      }
    }
  }

  // Fallback defaults for empty sessions
  resultDays.forEach(item => {
    if (!item.content.trim()) {
      if (item.day_name === 'Thứ Bảy' || item.day_name === 'Chủ Nhật') {
        item.content = 'Nghỉ';
        item.location = '-';
        item.participants = '-';
      } else {
        item.content = 'Dạy và học theo TKB';
        item.location = 'Lớp học';
        item.participants = 'GV, HS';
      }
    }
  });

  return {
    day_items: resultDays,
    title: parsedTitle || undefined,
    date_range_str: parsedDateRange || undefined,
    release_date_str: parsedReleaseDate || undefined,
    note: parsedNote.trim() || undefined,
    recipients: parsedRecipients.trim() || undefined,
    signer_name: parsedSigner || 'Lê Thị Thảo'
  };
}
