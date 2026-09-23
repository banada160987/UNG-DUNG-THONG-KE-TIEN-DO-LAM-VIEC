/**
 * Tiện ích Căn chỉnh, Phân tích và Xuất File Chuẩn Nghị định 30/2020/NĐ-CP
 * THPT Cao Bá Quát - Đắk Lắk
 */

/**
 * Tự động phân tích và chuẩn hóa văn bản thô sang cấu trúc Nghị định 30
 */
export function parseRawTextToDecree30(rawText = '') {
  if (!rawText || !rawText.trim()) {
    return {
      department: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK',
      issuer: 'TRƯỜNG THPT CAO BÁ QUÁT',
      sub_unit: '',
      doc_number: 'Số: .../KH-CBQ',
      location_date: `Tân An, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`,
      type_name: 'KẾ HOẠCH',
      subject: 'Về việc triển khai nhiệm vụ công tác chuyên môn',
      content: '',
      signer_title: 'TM. BAN GIÁM HIỆU\nHIỆU TRƯỞNG',
      signer_name: '',
      recipients: ['- Ban Giám hiệu (để b/c);', '- Các tổ chuyên môn (để t/h);', '- Lưu: VT.']
    };
  }

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  let department = 'SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK';
  let issuer = 'TRƯỜNG THPT CAO BÁ QUÁT';
  let sub_unit = '';
  let doc_number = 'Số: .../KH-CBQ';
  let location_date = `Tân An, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`;
  let type_name = 'VĂN BẢN';
  let subject = '';
  let signer_title = 'HIỆU TRƯỞNG';
  let signer_name = '';
  const recipients = [];
  const contentLines = [];

  let inRecipientsSection = false;
  let inSignerSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // 1. Nhận diện Sở / Phòng giáo dục
    if (lower.includes('sở giáo dục') || lower.includes('bộ giáo dục') || lower.includes('phòng giáo dục')) {
      department = line.toUpperCase();
      continue;
    }

    // 2. Nhận diện Trường / Cơ quan ban hành
    if (lower.includes('trường thpt') || lower.includes('trường thcs') || lower.includes('trường tiểu học') || lower.includes('cao bá quát')) {
      issuer = line.toUpperCase();
      continue;
    }

    // 3. Nhận diện Số văn bản
    if (/^số\s*:\s*/i.test(line) || /^so\s*:\s*/i.test(line)) {
      doc_number = line.replace(/^(số|so)\s*:\s*/i, 'Số: ');
      continue;
    }

    // 4. Nhận diện Địa danh ngày tháng (Tân An, ngày... / Hà Nội, ngày...)
    if (/,\s*ngày\s+\d+\s+tháng\s+\d+\s+năm\s+\d+/i.test(line)) {
      location_date = line;
      continue;
    }

    // 5. Bỏ qua Quốc hiệu & Tiêu ngữ đã gõ thô
    if (lower.includes('cộng hòa xã hội chủ nghĩa việt nam') || lower.includes('độc lập - tự do - hạnh phúc') || lower.includes('độc lập – tự do – hạnh phúc')) {
      continue;
    }

    // 6. Nhận diện Tên loại văn bản (KẾ HOẠCH, BÁO CÁO, TỜ TRÌNH, BIÊN BẢN, QUYẾT ĐỊNH, THÔNG BÁO)
    const docTypeMatch = line.match(/^(KẾ HOẠCH|BÁO CÁO|TỜ TRÌNH|BIÊN BẢN|QUYẾT ĐỊNH|THÔNG BÁO|CÔNG VĂN|HƯỚNG DẪN|QUY ĐỊNH|QUY CHẾ)\b/i);
    if (docTypeMatch && !subject) {
      type_name = docTypeMatch[1].toUpperCase();
      const rest = line.substring(docTypeMatch[0].length).trim();
      if (rest) subject = rest;
      continue;
    }

    // 7. Nhận diện Trích yếu (V/v... / Về việc...)
    if (/^(v\/v|về việc|ve viec)\s*:\s*/i.test(line) || /^về việc\s+/i.test(line)) {
      subject = line;
      continue;
    }

    // 8. Nhận diện Phần Nơi nhận
    if (/^nơi nhận\s*:/i.test(line) || /^noi nhan\s*:/i.test(line)) {
      inRecipientsSection = true;
      inSignerSection = false;
      continue;
    }

    // 9. Nhận diện Phần Chức vụ & Chữ ký
    if (/^(tm\.|kt\.|hiệu trưởng|phó hiệu trưởng|tổ trưởng|trưởng ban|chủ tịch|bí thư|chủ trì|người lập|thư ký)/i.test(line)) {
      inSignerSection = true;
      inRecipientsSection = false;
      signer_title = line.toUpperCase();
      continue;
    }

    if (inRecipientsSection) {
      if (line.startsWith('-') || line.startsWith('+') || line.startsWith('*')) {
        recipients.push(line);
      } else if (line.length < 50) {
        recipients.push(`- ${line};`);
      } else {
        inRecipientsSection = false;
        contentLines.push(line);
      }
      continue;
    }

    if (inSignerSection) {
      if (!signer_name && line.length < 40 && !line.includes(':')) {
        signer_name = line;
      }
      continue;
    }

    contentLines.push(line);
  }

  // Tự động chuẩn hóa nội dung các mục I., II., 1., 2., a., b.
  const formattedContent = contentLines.map(line => {
    // La Mã: I. II. III. -> In hoa đậm
    if (/^(I|II|III|IV|V|VI|VII|VIII|IX|X)\.\s+/i.test(line)) {
      return line.toUpperCase();
    }
    // Mục số: 1. 2. 3.
    if (/^\d+\.\s+/.test(line)) {
      return line;
    }
    // Gạch đầu dòng: -
    if (line.startsWith('-') || line.startsWith('+')) {
      return line.replace(/^[+*]\s*/, '- ');
    }
    return line;
  }).join('\n\n');

  return {
    department: department || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK',
    issuer: issuer || 'TRƯỜNG THPT CAO BÁ QUÁT',
    sub_unit: sub_unit || '',
    doc_number: doc_number || 'Số: .../KH-CBQ',
    location_date: location_date || `Tân An, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`,
    type_name: type_name || 'KẾ HOẠCH',
    subject: subject || 'Về việc triển khai nhiệm vụ công tác chuyên môn',
    content: formattedContent,
    signer_title: signer_title || 'HIỆU TRƯỞNG',
    signer_name: signer_name || '',
    recipients: recipients.length > 0 ? recipients : [
      '- Ban Giám hiệu (để b/c);',
      '- Các Tổ Chuyên môn (để t/h);',
      '- Lưu: VT.'
    ]
  };
}

/**
 * Tính điểm đánh giá mức độ tuân thủ chuẩn Nghị định 30/2020/NĐ-CP
 */
export function validateDecree30Compliance(data = {}) {
  const checks = [];

  // 1. Quốc hiệu - Tiêu ngữ
  checks.push({
    title: '1. Quốc hiệu & Tiêu ngữ chuẩn NĐ 30',
    valid: true,
    desc: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM (in hoa đứng) & Độc lập - Tự do - Hạnh phúc (đứng đậm kèm gạch chân nét liền).'
  });

  // 2. Cơ quan ban hành
  const hasIssuer = !!(data.issuer && data.issuer.trim());
  checks.push({
    title: '2. Cơ quan ban hành & Đơn vị',
    valid: hasIssuer,
    desc: hasIssuer ? `${data.department} / ${data.issuer}` : 'Chưa nhập tên cơ quan ban hành.'
  });

  // 3. Số và ký hiệu văn bản
  const hasNumber = !!(data.doc_number && data.doc_number.includes('/'));
  checks.push({
    title: '3. Số và Ký hiệu văn bản chuẩn',
    valid: hasNumber,
    desc: hasNumber ? data.doc_number : 'Số văn bản nên có định dạng: Số: .../KH-CBQ hoặc Số: .../BC-CBQ.'
  });

  // 4. Địa danh và ngày tháng
  const hasDate = !!(data.location_date && (data.location_date.includes('ngày') || data.location_date.includes('tháng')));
  checks.push({
    title: '4. Địa danh và Ngày tháng ban hành',
    valid: hasDate,
    desc: hasDate ? data.location_date : 'Cần có địa danh và ngày tháng (VD: Tân An, ngày ... tháng ... năm ...).'
  });

  // 5. Tên loại văn bản & Trích yếu
  const hasTypeAndSubject = !!(data.type_name && data.type_name.trim() && data.subject && data.subject.trim());
  checks.push({
    title: '5. Tên loại văn bản & Trích yếu nội dung',
    valid: hasTypeAndSubject,
    desc: hasTypeAndSubject ? `${data.type_name} - ${data.subject}` : 'Thiếu Tên loại văn bản hoặc Trích yếu nội dung.'
  });

  // 6. Nội dung văn bản
  const hasContent = !!(data.content && data.content.trim().length > 20);
  checks.push({
    title: '6. Nội dung căn lề & Thụt đầu dòng',
    valid: hasContent,
    desc: hasContent ? 'Đã có nội dung chi tiết (Căn đều 2 bên Justified, thụt đầu dòng 1.0cm).' : 'Nội dung văn bản còn quá ngắn hoặc để trống.'
  });

  // 7. Chức vụ & Thẩm quyền ký
  const hasSigner = !!(data.signer_title && data.signer_title.trim());
  checks.push({
    title: '7. Chức vụ & Thẩm quyền ký ban hành',
    valid: hasSigner,
    desc: hasSigner ? data.signer_title.replace(/\n/g, ' - ') : 'Chưa có chức vụ người ký.'
  });

  // 8. Nơi nhận
  const hasRecipients = !!(data.recipients && data.recipients.length > 0);
  checks.push({
    title: '8. Nơi nhận (Kính gửi / Lưu)',
    valid: hasRecipients,
    desc: hasRecipients ? `${data.recipients.length} nơi nhận hợp lệ` : 'Cần bổ sung danh sách nơi nhận.'
  });

  // 9. Căn lề khổ giấy A4
  checks.push({
    title: '9. Khổ giấy A4 & Căn lề chuẩn (30-20-20-15mm)',
    valid: true,
    desc: 'Lề trên 20mm, Dưới 20mm, Trái 30mm (đóng gáy), Phải 15mm; Phông Times New Roman 13pt.'
  });

  const passedCount = checks.filter(c => c.valid).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    score,
    passedCount,
    totalCount: checks.length,
    isFullyCompliant: score === 100,
    checks
  };
}

/**
 * Xuất file Word (.doc) chuẩn Nghị định 30/2020/NĐ-CP
 */
export function exportDecree30ToWord(docData, elementId = 'decree30-preview-container') {
  const container = document.getElementById(elementId);
  if (!container) return alert("Không tìm thấy nội dung xem trước!");

  const docTitle = docData?.type_name ? `${docData.type_name}_${docData?.subject || 'Van_ban'}` : 'Van_ban_Nghi_dinh_30';
  const cleanFileName = docTitle.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_').trim().slice(0, 60);

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${docData?.type_name || 'Văn bản'} - Nghị định 30/2020/NĐ-CP</title>
      <style>
        @page Section1 {
          size: 21.0cm 29.7cm; /* Khổ A4 đứng */
          margin: 2.0cm 1.5cm 2.0cm 3.0cm; /* Lề chuẩn NĐ 30: Trên 2cm, Dưới 2cm, Trái 3cm, Phải 1.5cm */
          mso-header-margin: 35.4pt;
          mso-footer-margin: 35.4pt;
          mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 13pt;
          line-height: 1.35;
          color: #000000;
          text-align: justify;
        }
        h1, h2, h3, h4 {
          font-family: 'Times New Roman', serif;
          margin-top: 8pt;
          margin-bottom: 6pt;
          color: #000000;
        }
        p {
          margin-top: 0;
          margin-bottom: 6pt;
          text-indent: 1.0cm;
          line-height: 1.35;
          text-align: justify;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6pt;
          margin-bottom: 6pt;
        }
        .header-table td {
          border: none !important;
          padding: 0;
          vertical-align: top;
          text-align: center;
        }
        .footer-table td {
          border: none !important;
          padding: 0;
          vertical-align: top;
        }
        .data-table th, .data-table td {
          border: 1pt solid windowtext;
          padding: 5pt 7pt;
          font-size: 12pt;
        }
        .data-table th {
          background-color: #f2f2f2;
          text-align: center;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="Section1">
        ${container.innerHTML}
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanFileName}_ND30.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
