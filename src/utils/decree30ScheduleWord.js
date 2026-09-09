/**
 * Decree 30 / 2020 / NĐ-CP Official Schedule Word Exporter & 35-Week Generator
 * School Year 2026 - 2027 (MOET Standard Timeframe)
 * High School: THPT Cao Bá Quát - Đắk Lắk
 */

export const ROMAN_NUMERALS = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
  'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX',
  'XXXI', 'XXXII', 'XXXIII', 'XXXIV', 'XXXV'
];

/**
 * Generates all 35 academic weeks for School Year 2026 - 2027
 * Starting Monday, September 7, 2026
 */
export function getSchoolWeeks2026() {
  const weeks = [];
  const startMonday = new Date(2026, 8, 7); // Sept 7, 2026 (Month index 8 = September)

  for (let i = 0; i < 35; i++) {
    const monday = new Date(startMonday);
    monday.setDate(startMonday.getDate() + i * 7);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const prevSunday = new Date(monday);
    prevSunday.setDate(monday.getDate() - 1);

    const pad = (n) => String(n).padStart(2, '0');
    
    const mondayStr = `${pad(monday.getDate())}/${pad(monday.getMonth() + 1)}`;
    const sundayStr = `${pad(sunday.getDate())}/${pad(sunday.getMonth() + 1)}/${sunday.getFullYear()}`;
    const releaseStr = `Tân An ngày ${pad(prevSunday.getDate())} tháng ${pad(prevSunday.getMonth() + 1)} năm ${prevSunday.getFullYear()}`;

    const weekRoman = ROMAN_NUMERALS[i] || (i + 1);

    weeks.push({
      week_number: i + 1,
      roman: weekRoman,
      title: `LỊCH CÔNG TÁC TUẦN ${weekRoman} - NĂM HỌC 2026-2027`,
      subtitle: `(Từ ngày ${mondayStr} đến ngày ${sundayStr})`,
      date_range_str: `Từ ngày ${mondayStr} đến ngày ${sundayStr}`,
      release_date_str: releaseStr,
      start_date: monday.toISOString().split('T')[0],
      end_date: sunday.toISOString().split('T')[0],
      monday: monday,
      sunday: sunday
    });
  }
  return weeks;
}

/**
 * Returns initial default day-by-day structured schedule items for a week
 */
export function getDefaultScheduleDays(weekObj) {
  if (!weekObj || !weekObj.monday) {
    const all = getSchoolWeeks2026();
    weekObj = all[0];
  }

  const pad = (n) => String(n).padStart(2, '0');
  const monday = new Date(weekObj.monday);

  const getDayDateStr = (offset) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + offset);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  };

  const dayNames = [
    { key: 't2', name: 'Thứ 2', dateStr: getDayDateStr(0) },
    { key: 't3', name: 'Thứ Ba', dateStr: getDayDateStr(1) },
    { key: 't4', name: 'Thứ Tư', dateStr: getDayDateStr(2) },
    { key: 't5', name: 'Thứ Năm', dateStr: getDayDateStr(3) },
    { key: 't6', name: 'Thứ Sáu', dateStr: getDayDateStr(4) },
    { key: 't7', name: 'Thứ Bảy', dateStr: getDayDateStr(5) },
    { key: 'cn', name: 'Chủ Nhật', dateStr: getDayDateStr(6) }
  ];

  return dayNames.flatMap((d, idx) => {
    if (idx === 0) { // Thứ 2
      return [
        {
          day_name: d.name,
          date_str: d.dateStr,
          session: 'Sáng',
          content: "- 6h45': HĐTN-HN (sinh hoạt lớp);\n- 7h30': Giao ban chủ nhiệm;\n- Dạy và học theo TKB (buổi 1);\n- 09'00: Họp Ban Thường vụ Đảng ủy;\n- 09'00: Họp lãnh đạo trường",
          location: "- Tại các lớp học\n- Phòng Hội đồng\n- Lớp học\n- Phòng Hiệu trưởng",
          participants: "- GVCN thực hiện.\n- P.HT Phạm Thị Nguyệt Thơ (Chủ trì) + ĐTN + GVCN tất cả các lớp.\n- Học sinh toàn trường; Giáo viên có tiết dạy theo TKB.\n- Ban Thường vụ Đảng ủy.\n- HT, các Phó HT+Thư ký"
        },
        {
          day_name: d.name,
          date_str: d.dateStr,
          session: 'Chiều',
          content: "- Dạy và học theo TKB (buổi 1);\n- 15h30': Họp Đảng ủy mở rộng",
          location: "- Lớp học\n- Phòng Truyền thống",
          participants: "- Học sinh toàn trường; Giáo viên có tiết dạy.\n- BCHĐU+ BT, PBT Các chi bộ + Các Tổ trưởng, tổ phó."
        }
      ];
    } else if (idx === 1) { // Thứ 3
      return [
        {
          day_name: d.name,
          date_str: d.dateStr,
          session: 'Sáng',
          content: "Dạy và học theo TKB (buổi 1)",
          location: "- Lớp học",
          participants: "- Học sinh toàn trường; Giáo viên có tiết dạy."
        },
        {
          day_name: d.name,
          date_str: d.dateStr,
          session: 'Chiều',
          content: "Dạy và học theo TKB (buổi 1)\n- 15h30': Sinh hoạt chuyên môn định kỳ (Tuần " + (weekObj.week_number || 1) + ")",
          location: "- Lớp học\n- Phòng Tổ chuyên môn",
          participants: "- Học sinh toàn trường; Giáo viên có tiết dạy.\n- Giáo viên của các tổ chuyên môn."
        }
      ];
    } else if (idx >= 2 && idx <= 4) { // Thứ 4, 5, 6
      return [
        {
          day_name: d.name,
          date_str: d.dateStr,
          session: 'Sáng',
          content: "Dạy và học theo TKB (buổi 1)",
          location: "- Lớp học",
          participants: "- Học sinh toàn trường; Giáo viên có tiết dạy."
        },
        {
          day_name: d.name,
          date_str: d.dateStr,
          session: 'Chiều',
          content: "Dạy và học theo TKB (buổi 2)",
          location: "- Phòng CLB",
          participants: "- GV phụ trách và học sinh đăng ký."
        }
      ];
    } else { // Thứ 7 & Chủ Nhật
      return [
        {
          day_name: d.name,
          date_str: d.dateStr,
          session: 'Sáng',
          content: "Nghi",
          location: "",
          participants: ""
        },
        {
          day_name: d.name,
          date_str: d.dateStr,
          session: 'Chiều',
          content: "Nghi",
          location: "",
          participants: ""
        }
      ];
    }
  });
}

/**
 * Export Schedule Data to Word (.doc) matching Decree 30/2020/NĐ-CP formatting
 */
export function exportScheduleToWordDecree30(scheduleData) {
  const weekNumber = scheduleData?.week_number || 1;
  const roman = ROMAN_NUMERALS[weekNumber - 1] || weekNumber;
  const titleText = scheduleData?.title || `LỊCH CÔNG TÁC TUẦN ${roman} - NĂM HỌC 2026-2027`;
  const subtitleText = scheduleData?.subtitle || (scheduleData?.date_range_str ? `(${scheduleData.date_range_str})` : '(Từ ngày 07/9 đến ngày 13/9/2026)');
  const releaseDateText = scheduleData?.release_date_str || 'Tân An ngày 06 tháng 9 năm 2026';

  const noteText = scheduleData?.note || '*Lưu ý: - Văn phòng chuẩn bị phòng họp, thiết bị âm thanh, nước uống các cuộc họp;\n- Các tổ, các bộ phận, cá nhân có liên quan chủ động chuẩn bị các nội dung, báo cáo lãnh đạo trường để thực hiện./.';
  const recipientText = scheduleData?.recipients || 'Nơi nhận:\n- GV, NV (để t/h);\n- Các Tổ chuyên môn thuộc trường;\n- HT, các PHT;\n- Đăng Web, Zalo;\n- Lưu: VT, TK.';
  const signerText = scheduleData?.signer_name || 'Lê Thị Thảo';
  const signerTitle = scheduleData?.signer_title || 'HIỆU TRƯỜNG';

  const dayRows = scheduleData?.day_items || [];

  // Format multi-line strings for HTML table cells
  const formatCellText = (text) => {
    if (!text) return '';
    return String(text)
      .trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');
  };

  // Group items by day_name & date_str
  const groupedDays = [];
  const map = new Map();

  dayRows.forEach(item => {
    const key = `${item.day_name}_${item.date_str}`;
    if (!map.has(key)) {
      const dayObj = {
        day_name: item.day_name,
        date_str: item.date_str,
        sessions: []
      };
      map.set(key, dayObj);
      groupedDays.push(dayObj);
    }
    map.get(key).sessions.push(item);
  });

  // Generate table rows HTML
  let tableRowsHtml = '';

  groupedDays.forEach(day => {
    const rowSpan = day.sessions.length || 1;
    day.sessions.forEach((s, idx) => {
      tableRowsHtml += '<tr>';
      
      // If first session of the day, print the day name & date (rowspan)
      if (idx === 0) {
        tableRowsHtml += `
          <td rowspan="${rowSpan}" style="border: 1px solid #000; padding: 6px 8px; text-align: center; vertical-align: middle; font-weight: bold; width: 14%;">
            ${formatCellText(day.day_name)}<br/>
            <span style="font-weight: bold;">${formatCellText(day.date_str)}</span>
          </td>
        `;
      }

      tableRowsHtml += `
        <td style="border: 1px solid #000; padding: 6px 8px; text-align: center; vertical-align: top; width: 8%;">
          ${formatCellText(s.session)}
        </td>
        <td style="border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; width: 44%;">
          ${formatCellText(s.content)}
        </td>
        <td style="border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; width: 17%;">
          ${formatCellText(s.location)}
        </td>
        <td style="border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: top; width: 17%;">
          ${formatCellText(s.participants)}
        </td>
      </tr>
      `;
    });
  });

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${titleText}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 1.5cm 1.5cm 1.5cm 2.0cm;
        }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 13pt;
          line-height: 1.35;
          color: #000000;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 10px;
        }
        th, td {
          font-family: 'Times New Roman', serif;
          font-size: 11.5pt;
          line-height: 1.25;
        }
        th {
          font-weight: bold;
          text-align: center;
          background-color: #ffffff;
        }
        .header-table td {
          border: none !important;
          padding: 0;
          font-size: 12pt;
        }
        .footer-table td {
          border: none !important;
          padding: 0;
          font-size: 12pt;
        }
      </style>
    </head>
    <body>
      
      <!-- HEADER TABLE -->
      <table class="header-table" style="width: 100%; border: none;">
        <tr>
          <td style="width: 45%; text-align: center; vertical-align: top;">
            <div style="font-size: 12pt;">SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK</div>
            <div style="font-size: 12pt; font-weight: bold;">TRƯỜNG THPT CAO BÁ QUÁT</div>
            <div style="border-bottom: 1px solid #000; width: 130px; margin: 3px auto 0 auto;"></div>
          </td>
          <td style="width: 55%; text-align: center; vertical-align: top;">
            <div style="font-size: 12pt; font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style="font-size: 12.5pt; font-weight: bold;">Độc lập - Tự do - Hạnh phúc</div>
            <div style="border-bottom: 1px solid #000; width: 160px; margin: 3px auto 0 auto;"></div>
            <div style="font-size: 12pt; font-style: italic; margin-top: 8px;">${releaseDateText}</div>
          </td>
        </tr>
      </table>

      <!-- DOCUMENT TITLE -->
      <div style="text-align: center; margin-top: 20px; margin-bottom: 15px;">
        <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase;">${titleText}</div>
        <div style="font-size: 13pt; font-style: italic; font-weight: bold;">${subtitleText}</div>
      </div>

      <!-- MAIN SCHEDULE TABLE -->
      <table style="width: 100%; border: 1px solid #000;">
        <thead>
          <tr>
            <th style="border: 1px solid #000; padding: 8px; width: 22%;" colspan="2">Thời gian</th>
            <th style="border: 1px solid #000; padding: 8px; width: 44%;">Nội dung</th>
            <th style="border: 1px solid #000; padding: 8px; width: 17%;">Địa điểm</th>
            <th style="border: 1px solid #000; padding: 8px; width: 17%;">Thành phần</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <!-- NOTES BLOCK -->
      <div style="font-size: 12pt; margin-top: 10px; margin-bottom: 20px;">
        <strong>*<u>Lưu ý</u>:</strong> ${formatCellText(noteText.replace(/^\*Lưu ý:\s*/i, ''))}
      </div>

      <!-- SIGNATURE BLOCK -->
      <table class="footer-table" style="width: 100%; border: none;">
        <tr>
          <td style="width: 45%; text-align: left; vertical-align: top; padding: 0;">
            <div style="font-size: 11pt; font-weight: bold; font-style: italic;">Nơi nhận:</div>
            <div style="font-size: 11pt; line-height: 1.4;">
              ${formatCellText(recipientText.replace(/^Nơi nhận:\s*/i, ''))}
            </div>
          </td>
          <td style="width: 55%; text-align: center; vertical-align: top; padding: 0;">
            <div style="font-size: 12pt; font-weight: bold; text-transform: uppercase;">${signerTitle}</div>
            <div style="height: 70px;"></div>
            <div style="font-size: 12pt; font-weight: bold;">${signerText}</div>
          </td>
        </tr>
      </table>

    </body>
    </html>
  `;

  // Create Blob & Download .doc File
  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8'
  });
  
  const fileName = `Lich_Cong_Tac_Tuan_${weekNumber}_THPT_CaoBaQuat.doc`;
  
  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(blob, fileName);
  } else {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}
