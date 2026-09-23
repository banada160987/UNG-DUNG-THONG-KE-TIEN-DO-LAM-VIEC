import JSZip from 'jszip';

/**
 * Tiện ích Căn chỉnh, Phân tích, Bắt lỗi Thể thức AI và Xuất File Chuẩn Nghị định 30/2020/NĐ-CP
 * THPT Cao Bá Quát - Đắk Lắk
 */

/**
 * Đọc file Word (.docx) sang Text thuần và HTML có cấu trúc chuẩn 100% trong Browser
 */
export async function readWordFile(file) {
  if (!file) throw new Error("Chưa chọn file");

  const arrayBuffer = await file.arrayBuffer();
  
  try {
    // 1. Thử giải nén file DOCX dạng OpenXML
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXmlFile = zip.file('word/document.xml');
    
    if (docXmlFile) {
      const xmlStr = await docXmlFile.async('text');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');

      const body = xmlDoc.getElementsByTagName('w:body')[0] || xmlDoc.documentElement;
      const childNodes = body.childNodes || [];

      const textParagraphs = [];
      const htmlParts = [];

      for (let i = 0; i < childNodes.length; i++) {
        const node = childNodes[i];
        const nodeName = node.nodeName || node.tagName;

        if (nodeName === 'w:p') {
          const { text, html } = parseWordParagraph(node);
          if (text.trim() || html) {
            textParagraphs.push(text);
            htmlParts.push(html);
          }
        } else if (nodeName === 'w:tbl') {
          const { text, html } = parseWordTable(node);
          if (text.trim()) {
            textParagraphs.push(text);
            htmlParts.push(html);
          }
        }
      }

      const fullText = textParagraphs.join('\n');
      if (fullText.trim()) {
        return {
          rawText: fullText,
          htmlContent: htmlParts.join('\n'),
          fileName: file.name
        };
      }
    }
  } catch (docxErr) {
    console.warn("Không thể giải nén DOCX chuẩn, chuyển sang phương thức trích xuất text nhị phân:", docxErr);
  }

  // 2. Fallback: Thử trích xuất các chuỗi ký tự UTF-8 / Text có nghĩa từ ArrayBuffer (cho file .doc cũ hoặc text)
  try {
    const uint8 = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawDecoded = decoder.decode(uint8);
    
    // Lọc các đoạn văn bản tiếng Việt có nghĩa
    const cleanLines = rawDecoded
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 3 && /[a-zA-Zà-ỹÀ-Ỹ0-9]/.test(l));

    if (cleanLines.length > 2) {
      return {
        rawText: cleanLines.join('\n'),
        htmlContent: cleanLines.map(l => `<p>${l}</p>`).join(''),
        fileName: file.name
      };
    }
  } catch (binErr) {
    console.warn("Lỗi trích xuất nhị phân:", binErr);
  }

  throw new Error("Không thể trích xuất nội dung từ file này. Vui lòng mở file bằng Word và lưu dưới dạng .docx hoặc copy dán vào tab 'Dán Text'!");
}

function extractParagraphText(pNode) {
  if (!pNode) return { text: '', html: '' };
  
  let pText = '';
  let pHtml = '';

  const rNodes = pNode.getElementsByTagName('w:r');
  if (rNodes && rNodes.length > 0) {
    for (let j = 0; j < rNodes.length; j++) {
      const r = rNodes[j];
      
      const isBold = r.getElementsByTagName('w:b').length > 0;
      const isItalic = r.getElementsByTagName('w:i').length > 0;

      const tNodes = r.getElementsByTagName('w:t');
      let runText = '';
      for (let k = 0; k < tNodes.length; k++) {
        runText += tNodes[k].textContent || '';
      }

      if (r.getElementsByTagName('w:tab').length > 0) {
        runText += '    ';
      }

      if (r.getElementsByTagName('w:br').length > 0 || r.getElementsByTagName('w:cr').length > 0) {
        runText += '\n';
      }

      if (runText) {
        pText += runText;
        let formatted = runText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        if (isBold) formatted = `<strong>${formatted}</strong>`;
        if (isItalic) formatted = `<em>${formatted}</em>`;
        pHtml += formatted;
      }
    }
  } else {
    // Nếu không có w:r, tìm trực tiếp w:t (tránh lấy paraId / bookmark ID)
    const tNodes = pNode.getElementsByTagName('w:t');
    for (let k = 0; k < tNodes.length; k++) {
      pText += tNodes[k].textContent || '';
    }
    pHtml = pText;
  }

  return {
    text: pText.trim(),
    html: pHtml ? `<p>${pHtml}</p>` : ''
  };
}

function parseWordParagraph(pNode) {
  return extractParagraphText(pNode);
}

function parseWordTable(tblNode) {
  const rows = tblNode.getElementsByTagName('w:tr');
  if (!rows || rows.length === 0) return { text: '', html: '' };

  // 1. Kiểm tra xem đây có phải BẢNG ĐẦU TRANG (Header 2 cột: Cơ quan + Quốc hiệu)
  // hoặc BẢNG CHÂN TRANG (Footer 2 cột: Nơi nhận + Chữ ký)
  const allCellParagraphs = [];
  for (let r = 0; r < rows.length; r++) {
    const cells = rows[r].getElementsByTagName('w:tc');
    for (let c = 0; c < cells.length; c++) {
      const pList = cells[c].getElementsByTagName('w:p');
      for (let p = 0; p < pList.length; p++) {
        const { text } = extractParagraphText(pList[p]);
        if (text) allCellParagraphs.push(text);
      }
    }
  }

  const combinedTableText = allCellParagraphs.join(' ').toLowerCase();
  const isHeaderTable = combinedTableText.includes('cộng hòa xã hội') || 
                       combinedTableText.includes('độc lập - tự do') || 
                       combinedTableText.includes('độc lập – tự do') ||
                       (combinedTableText.includes('sở giáo dục') && combinedTableText.includes('ngày'));

  const isFooterTable = combinedTableText.includes('nơi nhận') && 
                       (combinedTableText.includes('hiệu trưởng') || combinedTableText.includes('trưởng ban') || combinedTableText.includes('chủ tịch') || combinedTableText.includes('người lập'));

  // Nếu là Bảng Đầu Trang hoặc Bảng Chân Trang trong Word, rã thành các dòng văn bản độc lập
  if (isHeaderTable || isFooterTable) {
    const lines = [];
    const htmlLines = [];
    for (let r = 0; r < rows.length; r++) {
      const cells = rows[r].getElementsByTagName('w:tc');
      for (let c = 0; c < cells.length; c++) {
        const pList = cells[c].getElementsByTagName('w:p');
        for (let p = 0; p < pList.length; p++) {
          const { text, html } = extractParagraphText(pList[p]);
          if (text) {
            lines.push(text);
            htmlLines.push(html);
          }
        }
      }
    }
    return {
      text: lines.join('\n'),
      html: htmlLines.join('\n')
    };
  }

  // 2. Nếu là BẢNG NỘI DUNG THÔNG THƯỜNG (ví dụ Bảng Bầu ban đại diện cha mẹ học sinh)
  let tblText = '';
  let tblHtml = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 12px 0;">\n';

  for (let r = 0; r < rows.length; r++) {
    tblHtml += '  <tr>\n';
    const cells = rows[r].getElementsByTagName('w:tc');
    const rowTexts = [];
    
    for (let c = 0; c < cells.length; c++) {
      const pList = cells[c].getElementsByTagName('w:p');
      const cellTextParts = [];
      for (let p = 0; p < pList.length; p++) {
        const { text } = extractParagraphText(pList[p]);
        if (text) cellTextParts.push(text);
      }
      const cellCleanText = cellTextParts.join(' ');
      rowTexts.push(cellCleanText);
      tblHtml += `    <td style="padding: 6px 10px; border: 1px solid #000;">${cellCleanText}</td>\n`;
    }
    
    tblText += '| ' + rowTexts.join(' | ') + ' |\n';
    tblHtml += '  </tr>\n';
  }
  tblHtml += '</table>';

  return {
    text: '\n' + tblText + '\n',
    html: tblHtml
  };
}

/**
 * Định dạng Địa danh - Ngày tháng đúng chuẩn Nghị định 30/2020/NĐ-CP
 * Quy tắc: Ngày < 10 và Tháng 1, Tháng 2 bắt buộc ghi thêm số 0 ở trước (ví dụ: ngày 05 tháng 02 năm 2026).
 * Tháng 3 đến 12 không ghi số 0 ở trước (ví dụ: ngày 23 tháng 9 năm 2026).
 */
export function formatDecree30Date(dateStrOrObj = null, location = 'Tân An') {
  if (!dateStrOrObj) {
    const now = new Date();
    const d = now.getDate();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    const dStr = d < 10 ? `0${d}` : `${d}`;
    const mStr = (m === 1 || m === 2) ? `0${m}` : `${m}`;
    return `${location}, ngày ${dStr} tháng ${mStr} năm ${y}`;
  }

  const str = String(dateStrOrObj).trim();
  const match = str.match(/ngày\s+(\d+)\s+tháng\s+(\d+)\s+năm\s+(\d+)/i);
  if (match) {
    const d = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const y = parseInt(match[3], 10);
    const dStr = d < 10 ? `0${d}` : `${d}`;
    const mStr = (m === 1 || m === 2) ? `0${m}` : `${m}`;
    const locMatch = str.match(/^([^,]+),/);
    const loc = locMatch ? locMatch[1].replace(/Đắk Lắk/i, location).trim() : location;
    return `${loc}, ngày ${dStr} tháng ${mStr} năm ${y}`;
  }

  return str.replace(/Đắk Lắk\s*,/i, `${location},`);
}

/**
 * Tự động phân tích và chuẩn hóa văn bản thô sang cấu trúc Nghị định 30
 */
export function parseRawTextToDecree30(rawText = '') {
  const defaultDate = formatDecree30Date(new Date(), 'Tân An');

  if (!rawText || !rawText.trim()) {
    return {
      department: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK',
      issuer: 'TRƯỜNG THPT CAO BÁ QUÁT',
      sub_unit: '',
      doc_number: 'Số: .../KH-CBQ',
      location_date: defaultDate,
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
  let location_date = defaultDate;
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

    // 4. Nhận diện Địa danh ngày tháng (Tân An, ngày... / Đắk Lắk, ngày...)
    if (/,\s*ngày\s+\d+\s+tháng\s+\d+\s+năm\s+\d+/i.test(line)) {
      location_date = formatDecree30Date(line, 'Tân An');
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
      const rest = line.substring(docTypeMatch[0].length).replace(/^[\s\-–:]+/, '').trim();
      if (rest) {
        subject = rest;
      } else if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        // Nếu dòng tiếp theo là trích yếu (không phải mở đầu cuộc họp hay mục I)
        if (!/^(I|II|III|IV|V|1|2|3|\*|\-|\+)\./i.test(nextLine) && 
            !/^(hôm nay|thời gian|địa điểm|thành phần|căn cứ)\b/i.test(nextLine) &&
            !nextLine.startsWith('|') && nextLine.length < 150) {
          subject = nextLine;
          i++; // Bỏ qua dòng trích yếu vừa lấy
        }
      }
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
 * AI AUDITOR: Bộ quét bắt lỗi thể thức theo chuẩn Nghị định 30/2020/NĐ-CP
 */
export function auditDecree30Document(rawText = '', parsedData = {}) {
  const issues = [];
  const lowerRaw = (rawText || '').toLowerCase();

  // 1. Kiểm tra Tiêu ngữ viết hoa sai
  if (rawText.includes('ĐỘC LẬP - TỰ DO - HẠNH PHÚC') || rawText.includes('ĐỘC LẬP – TỰ DO – HẠNH PHÚC')) {
    issues.push({
      id: 'motto_case',
      severity: 'critical', // 'critical' | 'warning' | 'info'
      category: 'Quốc hiệu & Tiêu ngữ',
      title: 'Tiêu ngữ viết in hoa toàn bộ',
      description: 'Phát hiện "ĐỘC LẬP - TỰ DO - HẠNH PHÚC". Chuẩn NĐ 30 quy định chỉ viết hoa chữ cái đầu: "Độc lập - Tự do - Hạnh phúc".',
      solution: 'Tự động chuyển về: "Độc lập - Tự do - Hạnh phúc" (13-14pt, đứng đậm, có đường kẻ liền bên dưới).'
    });
  }

  // 2. Kiểm tra Số và Ký hiệu văn bản
  if (parsedData.doc_number) {
    const num = parsedData.doc_number;
    if (!num.includes('/')) {
      issues.push({
        id: 'doc_num_format',
        severity: 'critical',
        category: 'Số & Ký hiệu',
        title: 'Số văn bản thiếu ký hiệu loại và cơ quan',
        description: `Phát hiện "${num}". Số văn bản hành chính bắt buộc phải có tên loại và tên cơ quan viết tắt.`,
        solution: `Chuẩn hóa thành: "Số: .../${parsedData.type_name === 'KẾ HOẠCH' ? 'KH' : parsedData.type_name === 'BÁO CÁO' ? 'BC' : parsedData.type_name === 'TỜ TRÌNH' ? 'TTr' : 'CBQ'}-CBQ"`
      });
    }
    if (/^số\s+:/i.test(num) || /số\s{2,}:/i.test(num)) {
      issues.push({
        id: 'doc_num_space',
        severity: 'warning',
        category: 'Số & Ký hiệu',
        title: 'Lỗi khoảng trắng trước dấu hai chấm ở Số văn bản',
        description: 'Phát hiện có dấu cách trước dấu hai chấm trong "Số :".',
        solution: 'Sửa thành "Số: " (không có khoảng trắng trước dấu hai chấm).'
      });
    }
  }

  // 3. Kiểm tra Địa danh - Ngày tháng
  if (parsedData.location_date) {
    const dateStr = parsedData.location_date;
    if (dateStr.includes('Đắk Lắk,') || dateStr.includes('Đắk Lắk ,')) {
      issues.push({
        id: 'location_scope',
        severity: 'warning',
        category: 'Địa danh & Ngày tháng',
        title: 'Ghi tên địa danh cấp tỉnh thay vì cấp xã/phường',
        description: `Trường THPT Cao Bá Quát đặt tại xã Tân An (hoặc địa danh nơi đóng trụ sở). Nên ghi "Tân An, ngày..." thay vì "Đắk Lắk, ngày...".`,
        solution: 'Chuyển địa danh về "Tân An, ngày ... tháng ... năm ...".'
      });
    }
    if (/[A-ZÀ-Ỹ]\s*,\s*Ngày/i.test(dateStr) || dateStr.includes('Tháng') || dateStr.includes('Năm')) {
      issues.push({
        id: 'date_case',
        severity: 'warning',
        category: 'Địa danh & Ngày tháng',
        title: 'Viết hoa sai chữ "ngày", "tháng", "năm"',
        description: 'Chữ "ngày", "tháng", "năm" trong ngày tháng ban hành văn bản bắt buộc phải viết chữ thường và in nghiêng.',
        solution: 'Chuyển thành chữ thường: "... ngày ... tháng ... năm ...".'
      });
    }
    // Kiểm tra quy định số 0 ở ngày < 10 và tháng 1, 2
    if (/ngày\s+[1-9]\s+tháng/i.test(dateStr) || /tháng\s+[1-2]\s+năm/i.test(dateStr) || /tháng\s+0[3-9]\s+năm/i.test(dateStr)) {
      issues.push({
        id: 'date_zero_rule',
        severity: 'warning',
        category: 'Địa danh & Ngày tháng',
        title: 'Quy tắc số 0 ở Ngày và Tháng chưa chuẩn NĐ 30',
        description: 'NĐ 30 quy định: Ngày < 10 và Tháng 1, 2 phải có số 0 ở trước (ngày 05, tháng 02); Tháng 3-12 không ghi số 0 ở trước (tháng 3, tháng 9, tháng 10).',
        solution: 'Tự động định dạng lại ngày tháng đúng chuẩn kỹ thuật NĐ 30.'
      });
    }
  }

  // 4. Kiểm tra Tên loại văn bản
  if (parsedData.type_name) {
    if (parsedData.type_name !== parsedData.type_name.toUpperCase()) {
      issues.push({
        id: 'type_name_case',
        severity: 'critical',
        category: 'Tên loại văn bản',
        title: 'Tên loại văn bản chưa viết hoa toàn bộ',
        description: `Tên loại văn bản "${parsedData.type_name}" phải được in hoa, in đậm và căn giữa trang.`,
        solution: `Chuyển thành: "${parsedData.type_name.toUpperCase()}".`
      });
    }
  }

  // 5. Kiểm tra Trích yếu nội dung
  if (parsedData.subject) {
    const subj = parsedData.subject;
    if (!subj.toLowerCase().startsWith('v/v') && !subj.toLowerCase().startsWith('về việc')) {
      issues.push({
        id: 'subject_prefix',
        severity: 'warning',
        category: 'Trích yếu nội dung',
        title: 'Trích yếu nội dung chưa có tiền tố "Về việc"',
        description: 'Trích yếu văn bản thường bắt đầu bằng cụm từ "Về việc..." để nêu rõ mục đích ban hành.',
        solution: `Bổ sung tiền tố: "Về việc ${subj.replace(/^về\s+/i, '')}".`
      });
    }
  }

  // 6. Kiểm tra Căn lề & Thụt đầu dòng trong nội dung
  if (parsedData.content) {
    const paragraphs = parsedData.content.split('\n\n').filter(p => p.trim());
    let hasSpaceBeforeComma = false;
    let hasDoubleSpaces = false;
    
    paragraphs.forEach(p => {
      if (/\s+[,.;:]/.test(p)) hasSpaceBeforeComma = true;
      if (/  +/.test(p)) hasDoubleSpaces = true;
    });

    if (hasSpaceBeforeComma) {
      issues.push({
        id: 'spacing_punctuation',
        severity: 'warning',
        category: 'Chính tả & Dấu câu',
        title: 'Lỗi khoảng trắng trước dấu câu (, . ; :)',
        description: 'Phát hiện có khoảng cách thừa trước các dấu phẩy, dấu chấm trong văn bản.',
        solution: 'Tự động dọn dẹp khoảng trắng trước dấu câu và cách 1 khoảng trắng sau dấu câu.'
      });
    }

    if (hasDoubleSpaces) {
      issues.push({
        id: 'double_spaces',
        severity: 'info',
        category: 'Chính tả & Khoảng trắng',
        title: 'Khoảng trắng kép thừa trong văn bản',
        description: 'Có nhiều vị trí chứa 2 hoặc nhiều dấu cách liên tiếp.',
        solution: 'Tự động rút gọn về 1 khoảng cách đơn duy nhất.'
      });
    }
  }

  // 7. Kiểm tra Chức vụ & Thẩm quyền ký
  if (parsedData.signer_title) {
    if (parsedData.signer_title !== parsedData.signer_title.toUpperCase()) {
      issues.push({
        id: 'signer_title_case',
        severity: 'critical',
        category: 'Thẩm quyền ký',
        title: 'Chức vụ người ký chưa in hoa',
        description: `Chức vụ "${parsedData.signer_title}" bắt buộc phải in hoa đậm (13-14pt) theo chuẩn NĐ 30.`,
        solution: `Chuyển thành: "${parsedData.signer_title.toUpperCase()}".`
      });
    }
  }

  // 8. Kiểm tra Nơi nhận
  if (!parsedData.recipients || parsedData.recipients.length === 0) {
    issues.push({
      id: 'recipients_missing',
      severity: 'warning',
      category: 'Nơi nhận',
      title: 'Thiếu danh sách nơi nhận',
      description: 'Văn bản hành chính cần có mục "Nơi nhận:" góc dưới bên trái để xác định đối tượng nhận và nơi lưu trữ.',
      solution: 'Bổ sung: Ban Giám hiệu, Các tổ chuyên môn, Lưu: VT.'
    });
  }

  const initialScore = Math.max(20, 100 - (issues.length * 12));

  return {
    issuesCount: issues.length,
    initialScore,
    issues,
    summary: issues.length === 0 
      ? '🎉 Văn bản hoàn toàn đạt chuẩn thể thức Nghị định 30/2020/NĐ-CP!' 
      : `⚠️ Phát hiện ${issues.length} lỗi thể thức cần được AI căn chỉnh tự động.`
  };
}

/**
 * AI AUTO-FIX: Tự động sửa toàn bộ lỗi thể thức đã phát hiện
 */
export function autoFixDecree30Document(parsedData = {}) {
  let {
    department = 'SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK',
    issuer = 'TRƯỜNG THPT CAO BÁ QUÁT',
    sub_unit = '',
    doc_number = 'Số: .../KH-CBQ',
    location_date = `Tân An, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`,
    type_name = 'KẾ HOẠCH',
    subject = 'Về việc triển khai nhiệm vụ công tác chuyên môn',
    content = '',
    signer_title = 'TM. BAN GIÁM HIỆU\nHIỆU TRƯỞNG',
    signer_name = '',
    recipients = []
  } = parsedData;

  // 1. Sửa cơ quan
  department = (department || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK').toUpperCase().trim();
  issuer = (issuer || 'TRƯỜNG THPT CAO BÁ QUÁT').toUpperCase().trim();

  // 2. Sửa số ký hiệu
  if (!doc_number || doc_number.trim() === 'Số:' || !doc_number.includes('/')) {
    const typeCode = type_name === 'KẾ HOẠCH' ? 'KH' : type_name === 'BÁO CÁO' ? 'BC' : type_name === 'TỜ TRÌNH' ? 'TTr' : type_name === 'BIÊN BẢN' ? 'BB' : 'CBQ';
    doc_number = `Số: .../${typeCode}-CBQ`;
  } else {
    doc_number = doc_number.replace(/^số\s*:\s*/i, 'Số: ').trim();
  }

  // 3. Sửa địa danh ngày tháng
  location_date = formatDecree30Date(location_date, 'Tân An');

  // 4. Sửa Tên loại văn bản
  type_name = (type_name || 'KẾ HOẠCH').toUpperCase().trim();

  // 5. Sửa Trích yếu
  if (subject && !subject.toLowerCase().startsWith('về việc') && !subject.toLowerCase().startsWith('v/v')) {
    subject = `Về việc ${subject.charAt(0).toLowerCase() + subject.slice(1)}`;
  }

  // 6. Sửa Chức vụ
  signer_title = (signer_title || 'HIỆU TRƯỞNG').toUpperCase().trim();

  // 7. Sửa Nơi nhận
  if (!recipients || recipients.length === 0) {
    recipients = ['- Ban Giám hiệu (để b/c);', '- Các Tổ Chuyên môn (để t/h);', '- Lưu: VT.'];
  } else {
    recipients = recipients.map(r => r.startsWith('-') ? r : `- ${r}`).map(r => r.endsWith(';') || r.endsWith('.') ? r : `${r};`);
  }

  // 8. Dọn dẹp nội dung: Khoảng trắng kép, dấu câu, căn lề
  let cleanContent = content
    .replace(/[ \t]+/g, ' ') // Xóa khoảng trắng thừa
    .replace(/\s+([,.;:])/g, '$1') // Xóa cách trước dấu câu
    .replace(/([,.;:])(?=[^\s\d])/g, '$1 ') // Đảm bảo có cách sau dấu câu
    .trim();

  return {
    department,
    issuer,
    sub_unit,
    doc_number,
    location_date,
    type_name,
    subject,
    content: cleanContent,
    signer_title,
    signer_name,
    recipients
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

/**
 * GỌI GEMINI AI QUA VERCEL API HOẶC DIRECT KEY ĐỂ BIÊN TẬP VĂN PHONG CHUYÊN SÂU
 */
export async function deepAiPolishDecree30(rawText = '', currentDocData = {}) {
  const customApiKey = localStorage.getItem('cbq_ai_api_key') || (import.meta.env?.VITE_GEMINI_API_KEY ? import.meta.env.VITE_GEMINI_API_KEY : '');
  
  const systemInstruction = `Bạn là Chuyên gia Cao cấp về Thể thức Văn bản Hành chính Nhà nước và Quản lý Giáo dục tại Việt Nam (theo Nghị định 30/2020/NĐ-CP của Chính phủ).
Nhiệm vụ của bạn là tiếp nhận văn bản thô/bản nháp của giáo viên, phân tích ngữ nghĩa, tự động biên tập câu từ thành văn phong chuẩn mực công vụ, phân cấp rõ ràng các đề mục (I, II, 1, 2, a, b, -, +), bổ sung các căn cứ pháp lý cần thiết và trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown code fence backticks).

Cấu trúc JSON bắt buộc:
{
  "department": "SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK",
  "issuer": "TRƯỜNG THPT CAO BÁ QUÁT",
  "sub_unit": "",
  "doc_number": "Số: .../KH-CBQ",
  "location_date": "Tân An, ngày ... tháng ... năm ...",
  "type_name": "KẾ HOẠCH",
  "subject": "Về việc triển khai...",
  "content": "Nội dung đã được biên tập trang trọng, phân mục I, II, 1, 2, giãn dòng...",
  "signer_title": "TM. BAN GIÁM HIỆU\\nHIỆU TRƯỞNG",
  "signer_name": "",
  "recipients": ["- Ban Giám hiệu (để b/c);", "- Các Tổ Chuyên môn (để t/h);", "- Lưu: VT."],
  "critique": ["Các điểm AI đã cải thiện và lời khuyên sư phạm..."]
}`;

  const promptText = `Hãy biên tập, nâng cấp văn phong hành chính và chuẩn hóa thể thức Nghị định 30/2020/NĐ-CP cho văn bản sau:

${rawText || JSON.stringify(currentDocData, null, 2)}

Yêu cầu:
1. Đảm bảo ngôn từ trang trọng, chính xác, không dùng từ ngữ cảm tính hoặc văn nói.
2. Cấu trúc các mục I, II, III (La Mã in hoa), 1, 2, 3 (số Ả Rập) chuẩn mực.
3. Trả về đúng định dạng JSON như đã quy định.`;

  // 1. Thử gọi qua Vercel Proxy Serverless (/api/ai-advisor)
  try {
    const proxyRes = await fetch('/api/ai-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        promptText,
        systemInstruction,
        customApiKey: customApiKey || undefined,
        temperature: 0.2
      })
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.success && data.text) {
        let cleanJsonStr = data.text.trim();
        if (cleanJsonStr.startsWith('```json')) cleanJsonStr = cleanJsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        else if (cleanJsonStr.startsWith('```')) cleanJsonStr = cleanJsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
        
        try {
          const parsedJson = JSON.parse(cleanJsonStr);
          return { success: true, docData: parsedJson, source: 'gemini_ai_vercel' };
        } catch (jsonErr) {
          console.warn("JSON parse error:", jsonErr, cleanJsonStr);
        }
      }
    }
  } catch (e) {
    console.warn("Vercel proxy fetch failed, trying direct endpoint...", e);
  }

  // 2. Thử gọi trực tiếp bằng key nếu có
  if (customApiKey) {
    try {
      const directRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${customApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemInstruction}\n\n${promptText}` }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 3000 }
        })
      });

      if (directRes.ok) {
        const directData = await directRes.json();
        const candText = directData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candText) {
          let cleanJsonStr = candText.trim();
          if (cleanJsonStr.startsWith('```json')) cleanJsonStr = cleanJsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          else if (cleanJsonStr.startsWith('```')) cleanJsonStr = cleanJsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
          
          try {
            const parsedJson = JSON.parse(cleanJsonStr);
            return { success: true, docData: parsedJson, source: 'gemini_ai_direct' };
          } catch (jsonErr) {
            console.warn("JSON parse error direct:", jsonErr);
          }
        }
      }
    } catch (directErr) {
      console.warn("Direct Gemini fetch failed:", directErr);
    }
  }

  // 3. Fallback về autoFix cục bộ
  const localFixed = autoFixDecree30Document(currentDocData);
  return {
    success: false,
    docData: localFixed,
    source: 'local_rule_based',
    notice: 'Đã áp dụng bộ lọc Rule-based cục bộ do chưa kết nối được API Gemini trực tiếp.'
  };
}
