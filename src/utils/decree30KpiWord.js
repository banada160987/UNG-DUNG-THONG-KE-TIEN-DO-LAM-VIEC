/**
 * Exporter for Monthly Officer Evaluation & Department Summary (CB-GV-NV)
 * According to Vietnamese Administrative Document Standard (Decree 30/2020/NĐ-CP)
 * THPT Cao Bá Quát - Sở GD&ĐT Đắk Lắk
 */

// Helper to download blob as file
function triggerWordDownload(htmlContent, filename) {
  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 1. Xuất Phiếu Đánh Giá Viên Chức Hàng Tháng (Mẫu Cá Nhân - 2 Trang A4 Chuẩn NĐ 30)
 */
export function exportMonthlyEvaluationToWordDecree30(data = {}) {
  const teacherName = data.teacher_name || 'Phạm Thị Ngọc Thi';
  const teacherTitle = data.teacher_title || 'Giáo viên';
  const monthStr = (data.evaluation_month || 'Tháng 6').replace('Tháng ', '');
  const yearStr = data.eval_year || '2026';
  const schoolYear = data.school_year || '2025-2026';

  const selfCrit1 = data.self_crit_1 || 'Đạt';
  const selfCrit2 = data.self_crit_2 || 'Đạt';
  const selfCrit3 = data.self_crit_3 || 'Đạt';
  const managerCrit1 = data.manager_crit_1 || 'Đạt';
  const managerCrit2 = data.manager_crit_2 || 'Đạt';
  const managerCrit3 = data.manager_crit_3 || 'Đạt';

  const selfBase = data.self_base_score ?? 100;
  const selfMinus = data.self_minus_score ?? 0;
  const selfPlus = data.self_plus_score ?? 0;
  const selfTotal = data.self_total_score ?? 100;

  const managerBase = data.manager_base_score ?? 100;
  const managerMinus = data.manager_minus_score ?? 0;
  const managerPlus = data.manager_plus_score ?? 0;
  const managerTotal = data.manager_total_score ?? 100;

  const selfClass = data.self_classification || 'Hoàn thành tốt nhiệm vụ';
  const managerClass = data.manager_classification || 'Hoàn thành tốt nhiệm vụ';
  const managerComments = data.manager_comments || '';
  const principalConclusion = data.principal_conclusion || managerClass;

  const selfSigner = data.self_signer_name || teacherName;
  const managerSigner = data.manager_signer_name || 'Trần Thị Quế Quyên';

  const selfSigImg = data.self_signature ? `<img src="${data.self_signature}" width="140" height="60" style="object-fit:contain;" />` : '';
  const managerSigImg = data.manager_signature ? `<img src="${data.manager_signature}" width="140" height="60" style="object-fit:contain;" />` : '';

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Phieu_Danh_Gia_Hang_Thang_${teacherName}_T${monthStr}_${yearStr}</title>
      <style>
        @page Section1 {
          size: 210mm 297mm; /* A4 */
          margin: 20mm 15mm 20mm 30mm; /* Chuẩn NĐ 30: Trên 20mm, Dưới 20mm, Trái 30mm, Phải 15mm */
          mso-header-margin: 36pt;
          mso-footer-margin: 36pt;
          mso-paper-source: 0;
        }
        div.Section1 {
          page: Section1;
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
          margin-top: 6px;
          margin-bottom: 8px;
        }
        .header-table td {
          border: none !important;
          padding: 2px 4px;
          vertical-align: top;
        }
        .eval-table {
          width: 100%;
          border: 1pt solid windowtext;
        }
        .eval-table th, .eval-table td {
          border: 1pt solid windowtext;
          padding: 5px 6px;
          font-size: 12pt;
          vertical-align: middle;
        }
        .text-center { text-align: center; }
        .text-bold { font-weight: bold; }
        .text-justify { text-align: justify; }
        p { margin: 3px 0; }
        .page-break { page-break-before: always; mso-break-type: page-break; }
      </style>
    </head>
    <body>
      <div class="Section1">
        
        <!-- HEADER QUỐC HIỆU & ĐƠN VỊ -->
        <table class="header-table" style="width: 100%;">
          <tr>
            <td style="width: 45%; text-align: center;">
              <span style="font-size: 12pt; font-weight: bold;">SỞ GD&ĐT TỈNH ĐẮK LẮK</span><br/>
              <span style="font-size: 12pt; font-weight: bold; text-decoration: underline;">TRƯỜNG THPT CAO BÁ QUÁT</span>
            </td>
            <td style="width: 55%; text-align: center;">
              <span style="font-size: 11.5pt; font-weight: bold;">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br/>
              <span style="font-size: 12pt; font-weight: bold; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</span>
            </td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 15px; margin-bottom: 12px;">
          <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase;">
            PHIẾU ĐÁNH GIÁ, XẾP LOẠI HÀNG THÁNG (CB-GV-NV)
          </div>
          <div style="font-size: 13pt; font-weight: bold; font-style: italic; margin-top: 4px;">
            Tháng: ${monthStr} / ${yearStr}
          </div>
          <div style="font-size: 13pt; margin-top: 6px;">
            - Họ và tên: <b>${teacherName}</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - Chức vụ: ${teacherTitle}
          </div>
        </div>

        <!-- BẢNG ĐÁNH GIÁ TRANG 1 -->
        <table class="eval-table">
          <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center;">
            <th style="width: 35px;" rowspan="2">STT</th>
            <th rowspan="2">Nội dung đánh giá</th>
            <th style="width: 85px;" rowspan="2">Điểm (mức)</th>
            <th style="width: 160px;" colspan="2">Kết quả đánh giá</th>
          </tr>
          <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center;">
            <th style="width: 80px; font-size: 11pt;">Cá nhân tự đánh giá</th>
            <th style="width: 80px; font-size: 11pt;">Cấp trên trực tiếp đánh giá</th>
          </tr>

          <!-- PHẦN I -->
          <tr style="font-weight: bold; background-color: #fafafa;">
            <td class="text-center">I</td>
            <td colspan="4">TIÊU CHÍ CHUNG</td>
          </tr>

          <!-- 1. Chính trị tư tưởng -->
          <tr>
            <td class="text-center text-bold" style="vertical-align: top;">1</td>
            <td class="text-justify">
              <b>Chính trị, tư tưởng:</b><br/>
              - Chấp hành chủ trương, đường lối, quy định của Đảng, chính sách, pháp luật của Nhà nước và các nguyên tắc tổ chức, kỷ luật của Đảng, nhất là nguyên tắc tập trung dân chủ, tự phê bình và phê bình;<br/>
              - Có quan điểm, bản lĩnh chính trị vững vàng; kiên định lập trường; không dao động trước mọi khó khăn, thách thức;<br/>
              - Đặt lợi ích của Đảng, quốc gia - dân tộc, nhân dân, tập thể lên trên lợi ích cá nhân;<br/>
              - Có ý thức nghiên cứu, học tập, vận dụng chủ nghĩa Mác - Lênin, tư tưởng Hồ Chí Minh, nghị quyết, chỉ thị, quyết định và các văn bản của Đảng.
            </td>
            <td class="text-center">
              <b>Đạt</b><br/><span style="font-size: 10pt;">(Chưa đạt)</span>
            </td>
            <td class="text-center text-bold">${selfCrit1}</td>
            <td class="text-center text-bold">${managerCrit1}</td>
          </tr>

          <!-- 2. Đạo đức lối sống -->
          <tr>
            <td class="text-center text-bold" style="vertical-align: top;">2</td>
            <td class="text-justify">
              <b>Đạo đức, lối sống:</b><br/>
              - Không tham ô, tham nhũng, tiêu cực, lãng phí, quan liêu, cơ hội, vụ lợi, hách dịch, cửa quyền; không có biểu hiện suy thoái về đạo đức, lối sống, tự diễn biến, tự chuyển hóa;<br/>
              - Có lối sống trung thực, khiêm tốn, chân thành, trong sáng, giản dị;<br/>
              - Có tinh thần đoàn kết, xây dựng cơ quan, tổ chức, đơn vị trong sạch, vững mạnh;<br/>
              - Không để người thân, người quen lợi dụng chức vụ, quyền hạn của mình để trục lợi.
            </td>
            <td class="text-center">
              <b>Đạt</b><br/><span style="font-size: 10pt;">(Chưa đạt)</span>
            </td>
            <td class="text-center text-bold">${selfCrit2}</td>
            <td class="text-center text-bold">${managerCrit2}</td>
          </tr>

          <!-- 3. Tác phong lề lối -->
          <tr>
            <td class="text-center text-bold" style="vertical-align: top;">3</td>
            <td class="text-justify">
              <b>Tác phong, lề lối làm việc:</b><br/>
              - Có trách nhiệm với công việc; năng động, sáng tạo, dám nghĩ, dám làm, linh hoạt trong thực hiện nhiệm vụ;<br/>
              - Phương pháp làm việc khoa học, dân chủ, đúng nguyên tắc;<br/>
              - Có tinh thần trách nhiệm và phối hợp trong thực hiện nhiệm vụ;<br/>
              - Có thái độ đúng mực và phong cách ứng xử, lề lối làm việc chuẩn mực, đáp ứng yêu cầu của văn hóa công vụ.
            </td>
            <td class="text-center">
              <b>Đạt</b><br/><span style="font-size: 10pt;">(Chưa đạt)</span>
            </td>
            <td class="text-center text-bold">${selfCrit3}</td>
            <td class="text-center text-bold">${managerCrit3}</td>
          </tr>

          <!-- PHẦN II -->
          <tr style="font-weight: bold; background-color: #fafafa;">
            <td class="text-center">II</td>
            <td>KẾT QUẢ THỰC HIỆN NHIỆM VỤ</td>
            <td class="text-center">100</td>
            <td class="text-center text-bold">${selfBase}</td>
            <td class="text-center text-bold">${managerBase}</td>
          </tr>

          <tr>
            <td class="text-center"></td>
            <td>Điểm trừ</td>
            <td class="text-center">0</td>
            <td class="text-center text-bold">${selfMinus}</td>
            <td class="text-center text-bold">${managerMinus}</td>
          </tr>
        </table>

        <div style="text-align: center; font-size: 11pt; margin-top: 10px;">1</div>

        <!-- NGẮT TRANG SANG TRANG 2 -->
        <div class="page-break"></div>

        <table class="eval-table" style="margin-top: 15px;">
          <tr>
            <td class="text-center" style="width: 35px;"></td>
            <td>Điểm cộng</td>
            <td class="text-center" style="width: 85px;">0</td>
            <td class="text-center text-bold" style="width: 80px;">${selfPlus}</td>
            <td class="text-center text-bold" style="width: 80px;">${managerPlus}</td>
          </tr>
          <tr style="font-weight: bold; background-color: #f2f2f2;">
            <td class="text-center"></td>
            <td>Tổng điểm</td>
            <td class="text-center">100</td>
            <td class="text-center" style="font-size: 13pt;">${selfTotal}</td>
            <td class="text-center" style="font-size: 13pt;">${managerTotal}</td>
          </tr>
        </table>

        <!-- MỨC TỰ ĐÁNH GIÁ -->
        <div style="margin-top: 12px; font-size: 12.5pt; line-height: 1.45;">
          <p style="text-indent: 1.27cm;">
            <b>- Mức tự cá nhân đánh giá, xếp loại:</b> <u>${selfClass}</u>, đạt <b>${selfTotal}</b> điểm.
          </p>
          <div style="padding-left: 1.27cm; font-size: 11.5pt;">
            <p><i>+ Hoàn thành xuất sắc nhiệm vụ:</i> Các tiêu chí chung đều đạt và có tổng điểm từ 100 điểm trở lên.</p>
            <p><i>+ Hoàn thành tốt nhiệm vụ:</i> Các tiêu chí chung đều đạt và có tổng điểm từ 90 điểm trở lên.</p>
            <p><i>+ Hoàn thành nhiệm vụ:</i> Các tiêu chí chung đều đạt và có tổng điểm từ 80 điểm trở lên.</p>
            <p><i>+ Không hoàn thành nhiệm vụ:</i> Các trường hợp còn lại.</p>
          </div>
        </div>

        <!-- CHỮ KÝ CÁ NHÂN -->
        <table class="header-table" style="margin-top: 15px; width: 100%;">
          <tr>
            <td style="width: 45%;"></td>
            <td style="width: 55%; text-align: center;">
              <b>Người tự đánh giá</b><br/>
              <i>(Ký và ghi rõ họ tên)</i><br/><br/>
              ${selfSigImg}<br/><br/>
              <b>${selfSigner}</b>
            </td>
          </tr>
        </table>

        <!-- NHẬN XÉT CỦA TTCM -->
        <div style="border-top: 0.75pt dotted #000; margin-top: 15px; padding-top: 8px; font-size: 12.5pt;">
          <p><b>* NHẬN XÉT, ĐÁNH GIÁ CỦA LÃNH ĐẠO TRỰC TIẾP QUẢN LÝ</b></p>
          <p style="text-indent: 1.27cm;">
            Đánh giá, xếp loại: VC <b>${teacherName}</b>: <u>${managerClass}</u>
          </p>
          ${managerComments ? `<p style="text-indent: 1.27cm;">Nhận xét: ${managerComments}</p>` : ''}
        </div>

        <table class="header-table" style="margin-top: 10px; width: 100%;">
          <tr>
            <td style="width: 45%;"></td>
            <td style="width: 55%; text-align: center;">
              <b>Tổ trưởng</b><br/>
              <i>(Ký và ghi rõ họ tên)</i><br/><br/>
              ${managerSigImg}<br/><br/>
              <b>${managerSigner}</b>
            </td>
          </tr>
        </table>

        <!-- NHẬN XÉT CỦA HIỆU TRƯỞNG / BGH -->
        <div style="border-top: 0.75pt dotted #000; margin-top: 15px; padding-top: 8px; font-size: 12.5pt;">
          <p><b>* NHẬN XÉT, ĐÁNH GIÁ CỦA TẬP THỂ LÃNH ĐẠO CƠ QUAN, ĐƠN VỊ</b></p>
          <p style="text-indent: 1.27cm;">
            Kết luận: VC <b>${teacherName}</b>: <u>${principalConclusion}</u>
          </p>
        </div>

        <table class="header-table" style="margin-top: 10px; width: 100%;">
          <tr>
            <td style="width: 45%;"></td>
            <td style="width: 55%; text-align: center;">
              <i>Ngày ..... tháng ..... năm ${yearStr}</i><br/>
              <b>Hiệu trưởng</b><br/>
              <i>(Ký tên, đóng dấu)</i><br/><br/><br/><br/><br/>
            </td>
          </tr>
        </table>

        <div style="text-align: center; font-size: 11pt; margin-top: 15px;">2</div>

      </div>
    </body>
    </html>
  `;

  triggerWordDownload(html, `Phieu_Danh_Gia_Hang_Thang_${teacherName.replace(/\s+/g, '_')}_Thang_${monthStr}_${yearStr}.doc`);
}

/**
 * 2. Xuất Bảng Tổng Hợp Đánh Giá Của Tổ (1 Trang A4 Chuẩn NĐ 30)
 */
export function exportDepartmentSummaryToWordDecree30(summaryData = {}) {
  const departmentName = summaryData.departmentName || 'Tổ Ngữ văn';
  const cleanDeptName = departmentName.replace('Tổ ', '');
  const monthStr = (summaryData.evaluationMonth || 'Tháng 6').replace('Tháng ', '');
  const yearStr = summaryData.evalYear || '2026';
  const reportDate = summaryData.reportDate || `Tân An, ngày 28 tháng ${monthStr} năm ${yearStr}`;
  const managerName = summaryData.managerName || 'Trần Thị Quế Quyên';
  const rows = summaryData.rows || [];
  const stats = summaryData.stats || {
    total: rows.length,
    excellent: 0,
    good: rows.length,
    accomplished: 0,
    failed: 0,
    unranked: 0
  };

  const managerSigImg = summaryData.managerSignature 
    ? `<img src="${summaryData.managerSignature}" width="150" height="65" style="object-fit:contain;" />` 
    : '';

  const tableRowsHtml = rows.map(r => `
    <tr>
      <td style="text-align: center;">${r.stt}</td>
      <td style="font-weight: bold;">${r.name}</td>
      <td style="text-align: center;">${r.title}</td>
      <td style="text-align: center;">${r.targetType || 'Viên chức'}</td>
      <td style="text-align: center;">${r.rank}</td>
      <td style="text-align: center;">${r.notes || ''}</td>
    </tr>
  `).join('');

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Tong_Hop_Danh_Gia_${cleanDeptName}_T${monthStr}_${yearStr}</title>
      <style>
        @page Section1 {
          size: 210mm 297mm; /* A4 Portrait */
          margin: 20mm 15mm 20mm 30mm; /* Chuẩn NĐ 30: Trên 20mm, Dưới 20mm, Trái 30mm, Phải 15mm */
          mso-header-margin: 36pt;
          mso-footer-margin: 36pt;
        }
        div.Section1 { page: Section1; }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 13pt;
          line-height: 1.35;
          color: #000000;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
          margin-bottom: 10px;
        }
        .header-table td {
          border: none !important;
          padding: 2px 4px;
          vertical-align: top;
        }
        .summary-table {
          width: 100%;
          border: 1pt solid windowtext;
        }
        .summary-table th, .summary-table td {
          border: 1pt solid windowtext;
          padding: 6px 6px;
          font-size: 12pt;
          vertical-align: middle;
        }
      </style>
    </head>
    <body>
      <div class="Section1">
        
        <!-- HEADER QUỐC HIỆU & ĐƠN VỊ -->
        <table class="header-table" style="width: 100%;">
          <tr>
            <td style="width: 45%; text-align: center;">
              <span style="font-size: 12pt; font-weight: bold;">SỞ GD&ĐT TỈNH ĐẮK LẮK</span><br/>
              <span style="font-size: 12pt; font-weight: bold; text-decoration: underline;">TRƯỜNG THPT CAO BÁ QUÁT</span>
            </td>
            <td style="width: 55%; text-align: center;">
              <span style="font-size: 11.5pt; font-weight: bold;">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br/>
              <span style="font-size: 12pt; font-weight: bold; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</span>
            </td>
          </tr>
        </table>

        <!-- TIÊU ĐỀ BÁO CÁO -->
        <div style="text-align: center; margin-top: 15px; margin-bottom: 15px;">
          <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase;">
            TỔNG HỢP ĐÁNH GIÁ, XẾP LOẠI HÀNG THÁNG
          </div>
          <div style="font-size: 13pt; font-weight: bold; margin-top: 4px;">
            Tháng ${monthStr}/${yearStr}
          </div>
          <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin-top: 4px;">
            TỔ: ${cleanDeptName.toUpperCase()}
          </div>
        </div>

        <!-- BẢNG TỔNG HỢP DANH SÁCH -->
        <table class="summary-table">
          <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center;">
            <th style="width: 35px;">TT</th>
            <th style="width: 180px;">Họ và tên</th>
            <th style="width: 65px;">Chức vụ</th>
            <th style="width: 130px;">
              Đối tượng<br/>
              <span style="font-size: 10pt; font-weight: normal;">(viên chức, HĐ 68, hợp đồng)</span>
            </th>
            <th style="width: 160px;">
              Mức đánh giá, xếp loại<br/>
              tháng ${monthStr}/${yearStr}
            </th>
            <th style="width: 70px;">Ghi chú</th>
          </tr>
          ${tableRowsHtml}
        </table>

        <!-- PHẦN THỐNG KÊ & CHỮ KÝ TỔ TRƯỞNG -->
        <table class="header-table" style="width: 100%; margin-top: 15px;">
          <tr>
            <!-- Cột Thống kê -->
            <td style="width: 50%; vertical-align: top; font-size: 12pt;">
              <p style="font-style: italic; font-weight: bold; margin-bottom: 6px;">
                Tổng số: ${String(stats.total).padStart(2, '0')} trong đó:
              </p>
              <div style="line-height: 1.55; padding-left: 5px;">
                <div>1. Hoàn thành xuất sắc nhiệm vụ: <b>${String(stats.excellent).padStart(2, '0')}</b></div>
                <div>2. Hoàn thành tốt nhiệm vụ: <b>${String(stats.good).padStart(2, '0')}</b></div>
                <div>3. Hoàn thành nhiệm vụ: <b>${String(stats.accomplished).padStart(2, '0')}</b></div>
                <div>4. Không hoàn thành nhiệm vụ: <b>${String(stats.failed).padStart(2, '0')}</b></div>
                <div>5. Không xếp loại: <b>${String(stats.unranked).padStart(2, '0')}</b></div>
              </div>
            </td>

            <!-- Cột Chữ ký TTCM -->
            <td style="width: 50%; text-align: center; vertical-align: top; font-size: 12pt;">
              <p style="font-style: italic; margin-bottom: 4px;">${reportDate}</p>
              <p style="font-weight: bold; font-size: 13pt; margin: 0;">Tổ trưởng</p>
              <p style="font-style: italic; font-size: 11pt; margin: 0 0 10px 0;">(Ký và ghi rõ họ tên)</p>
              ${managerSigImg}<br/><br/>
              <p style="font-weight: bold; font-size: 13pt; margin-top: 6px;">${managerName}</p>
            </td>
          </tr>
        </table>

      </div>
    </body>
    </html>
  `;

  triggerWordDownload(html, `Tong_Hop_Danh_Gia_${cleanDeptName.replace(/\s+/g, '_')}_Thang_${monthStr}_${yearStr}.doc`);
}
