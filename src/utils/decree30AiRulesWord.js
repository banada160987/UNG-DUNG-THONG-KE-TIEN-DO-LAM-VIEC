/**
 * Exporter for "QUY TẮC SỬ DỤNG TRÍ TUỆ NHÂN TẠO (AI) TRONG NHÀ TRƯỜNG"
 * THPT Cao Bá Quát - Đắk Lắk
 * Standard Decree 30/2020/NĐ-CP Format
 */

export function exportAiRulesToWordDecree30(customData = {}) {
  const schoolName = customData.schoolName || "TRƯỜNG THPT CAO BÁ QUÁT";
  const departmentName = customData.departmentName || "SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK";
  const releaseDateStr = customData.releaseDateStr || "Tân An, ngày 10 tháng 09 năm 2026";
  const docNumber = customData.docNumber || "158/QĐ-THPTCBQ";
  const signerName = customData.signerName || "Lê Thị Thảo";
  const signerTitle = customData.signerTitle || "HIỆU TRƯỜNG";

  const htmlDocument = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Quy tắc sử dụng AI trong nhà trường - THPT Cao Bá Quát</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 2.0cm 1.5cm 2.0cm 3.0cm; /* Lề chuẩn NĐ 30: Trên 2cm, Dưới 2cm, Trái 3cm, Phải 1.5cm */
        }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 13pt;
          line-height: 1.35;
          color: #000000;
          text-align: justify;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 5px;
          margin-bottom: 10px;
        }
        .header-table td, .footer-table td {
          border: none !important;
          padding: 0;
          font-size: 12pt;
        }
        h1, h2, h3 {
          font-family: 'Times New Roman', serif;
          color: #000000;
        }
        .doc-title {
          font-size: 14pt;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          margin-top: 15px;
          margin-bottom: 5px;
        }
        .doc-subtitle {
          font-size: 13pt;
          font-weight: bold;
          text-align: center;
          margin-bottom: 15px;
        }
        .chapter-title {
          font-size: 13pt;
          font-weight: bold;
          text-transform: uppercase;
          margin-top: 14px;
          margin-bottom: 4px;
        }
        .article-title {
          font-size: 13pt;
          font-weight: bold;
          margin-top: 8px;
          margin-bottom: 4px;
        }
        p {
          margin-top: 4px;
          margin-bottom: 4px;
          text-indent: 1.27cm;
        }
        ul, ol {
          margin-top: 4px;
          margin-bottom: 4px;
          padding-left: 1.27cm;
        }
        li {
          margin-bottom: 3px;
        }
        .no-indent {
          text-indent: 0 !important;
        }
      </style>
    </head>
    <body>
      <!-- QUỐC HIỆU & TIÊU NGỮ HÀNH CHÍNH CHUẨN NĐ 30 -->
      <table class="header-table" style="width: 100%; border: none;">
        <tr>
          <td style="width: 45%; text-align: center; vertical-align: top;">
            <div style="font-size: 12pt;">${departmentName}</div>
            <div style="font-size: 12pt; font-weight: bold;">${schoolName}</div>
            <div style="font-size: 11pt; margin-top: 2px;">Số: ${docNumber}</div>
            <div style="border-bottom: 1px solid #000; width: 120px; margin: 4px auto 0 auto;"></div>
          </td>
          <td style="width: 55%; text-align: center; vertical-align: top;">
            <div style="font-size: 12pt; font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style="font-size: 12.5pt; font-weight: bold;">Độc lập - Tự do - Hạnh phúc</div>
            <div style="border-bottom: 1px solid #000; width: 160px; margin: 4px auto 0 auto;"></div>
            <div style="font-size: 12pt; font-style: italic; margin-top: 6px;">${releaseDateStr}</div>
          </td>
        </tr>
      </table>

      <!-- TRÍCH YẾU VĂN BẢN -->
      <div class="doc-title" style="margin-top: 25px;">QUYẾT ĐỊNH</div>
      <div class="doc-subtitle">Về việc ban hành Quy tắc sử dụng Trí tuệ Nhân tạo (AI)<br/>trong nhà trường năm học 2026 - 2027</div>

      <div class="doc-title" style="margin-top: 15px; font-size: 13pt;">HIỆU TRƯỜNG TRƯỜNG THPT CAO BÁ QUÁT</div>

      <p style="font-style: italic;">Căn cứ Luật Giáo dục ngày 14 tháng 6 năm 2019;</p>
      <p style="font-style: italic;">Căn cứ Điều lệ trường trung học cơ sở, trường trung học phổ thông và trường phổ thông có nhiều cấp học ban hành kèm theo Thông tư số 32/2020/TT-BGDĐT ngày 15/9/2020 của Bộ trưởng Bộ Giáo dục và Đào tạo;</p>
      <p style="font-style: italic;">Căn cứ Nghị định số 13/2023/NĐ-CP ngày 17 tháng 4 năm 2023 của Chính phủ về bảo vệ dữ liệu cá nhân;</p>
      <p style="font-style: italic;">Căn cứ Hướng dẫn của Bộ Giáo dục và Đào tạo về việc thực hiện giáo dục Trí tuệ Nhân tạo (AI) trong cơ sở giáo dục phổ thông (đảm bảo thực hiện tối thiểu 12 tiết/lớp/năm học đối với nội dung cốt lõi);</p>
      <p style="font-style: italic;">Xét đề nghị của Hội đồng Chuyên môn và Tổ trưởng Tổ Tin học - Công nghệ.</p>

      <div class="doc-title" style="margin-top: 10px; margin-bottom: 10px;">QUYẾT ĐỊNH:</div>

      <p class="no-indent"><b>Điều 1.</b> Ban hành kèm theo Quyết định này <b>"Quy tắc sử dụng Trí tuệ Nhân tạo (AI) trong nhà trường"</b> áp dụng đối với toàn thể cán bộ quản lý, giáo viên, nhân viên và học sinh Trường THPT Cao Bá Quát năm học 2026 - 2027.</p>
      <p class="no-indent"><b>Điều 2.</b> Quyết định này có hiệu lực thi hành kể từ ngày ký.</p>
      <p class="no-indent"><b>Điều 3.</b> Các ông (bà) Trưởng các bộ phận, Tổ trưởng chuyên môn, Giáo viên Tin học, Giáo viên chủ nhiệm, các tổ chức đoàn thể và toàn thể học sinh Trường THPT Cao Bá Quát chịu trách nhiệm thi hành Quyết định này./.</p>

      <br clear="all" style="page-break-before: always; mso-break-type: section-break;" />

      <!-- PHỤ LỤC QUY TẮC SỬ DỤNG AI KÈM THEO QUYẾT ĐỊNH -->
      <table class="header-table" style="width: 100%; border: none;">
        <tr>
          <td style="width: 50%; text-align: left; vertical-align: top;">
            <div style="font-size: 11pt; font-weight: bold;">TRƯỜNG THPT CAO BÁ QUÁT</div>
          </td>
          <td style="width: 50%; text-align: right; vertical-align: top;">
            <div style="font-size: 11pt; font-style: italic;">Ban hành kèm theo Quyết định số ${docNumber}</div>
            <div style="font-size: 11pt; font-style: italic;">ngày 10 tháng 09 năm 2026 của Hiệu trưởng</div>
          </td>
        </tr>
      </table>

      <div class="doc-title" style="margin-top: 20px;">QUY TẮC SỬ DỤNG TRÍ TUỆ NHÂN TẠO (AI) TRONG NHÀ TRƯỜNG</div>
      <div class="doc-subtitle">NĂM HỌC 2026 - 2027</div>

      <!-- CHƯƠNG I -->
      <div class="chapter-title">Chương I. QUY ĐỊNH CHUNG</div>

      <div class="article-title">Điều 1. Phạm vi điều chỉnh và đối tượng áp dụng</div>
      <p>1. Quy tắc này quy định về mục tiêu, nguyên tắc, thời lượng giáo dục, phân công trách nhiệm, ứng xử văn hóa, an toàn dữ liệu cá nhân và trung thực học thuật khi ứng dụng các công cụ Trí tuệ Nhân tạo (AI) trong các hoạt động dạy học, giáo dục, quản lý và vận hành tại Trường THPT Cao Bá Quát.</p>
      <p>2. Quy tắc này áp dụng đối với cán bộ quản lý, giáo viên, nhân viên, học sinh và sự phối hợp của Cha mẹ học sinh trong toàn trường.</p>

      <div class="article-title">Điều 2. Mục tiêu ứng dụng AI trong nhà trường</div>
      <p>1. Thúc đẩy đổi mới sáng tạo, nâng cao chất lượng giảng dạy và học tập, phát triển năng lực số, tư duy phản biện và kỹ năng công nghệ cho học sinh chuẩn bị cho kỷ nguyên số.</p>
      <p>2. Khai thác công cụ AI như một phương tiện hỗ trợ giảng dạy, học tập và nghiên cứu; tuyệt đối không thay thế vai trò tư duy độc lập, sáng tạo cá nhân và đạo đức học đường.</p>

      <div class="article-title">Điều 3. Nguyên tắc cốt lõi khi sử dụng AI</div>
      <p>1. <b>Trung thực học thuật:</b> Đề cao tính chính trực, tôn trọng bản quyền tác giả. Sản phẩm từ AI chỉ mang tính chất tham khảo, gợi ý.</p>
      <p>2. <b>An toàn và Bảo mật dữ liệu:</b> Tuân thủ nghiêm ngặt quy định bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP. Không đưa hình ảnh, danh tính, thông tin nhạy cảm của học sinh và nhà trường lên các nền tảng AI công cộng.</p>
      <p>3. <b>Trách nhiệm giải trình và Kiểm chứng:</b> Giáo viên và học sinh phải chịu trách nhiệm về tính chính xác của thông tin do AI tạo ra; luôn kiểm chứng thông tin trước khi sử dụng.</p>

      <!-- CHƯƠNG II -->
      <div class="chapter-title">Chương II. KHUNG THỜI LƯỢNG VÀ PHÂN CÔNG TRÁCH NHIỆM</div>

      <div class="article-title">Điều 4. Khung thời lượng giáo dục AI cốt lõi</div>
      <p>1. Bảo đảm thực hiện <b>tối thiểu 12 tiết/lớp/năm học</b> đối với nội dung cốt lõi về giáo dục Trí tuệ Nhân tạo (AI) trong chương trình giáo dục của nhà trường theo hướng dẫn của Bộ Giáo dục và Đào tạo.</p>
      <p>2. Nhà trường chủ động bổ sung, củng cố những kiến thức, kỹ năng tiền đề cần thiết; chủ động lựa chọn nội dung mở rộng, hình thức tổ chức, thời lượng và công cụ AI phù hợp với điều kiện cơ sở vật chất và năng lực thực tế của học sinh.</p>

      <div class="article-title">Điều 5. Phân công trách nhiệm tổ chức thực hiện</div>
      <p>1. <b>Ban Giám hiệu:</b> Cụ thể hóa kế hoạch giáo dục AI; phê duyệt danh mục công cụ AI được phép sử dụng; tổ chức kiểm tra, giám sát, đánh giá việc thực hiện quy tắc trong toàn trường.</p>
      <p>2. <b>Tổ / Nhóm chuyên môn:</b> Phân công trách nhiệm rõ ràng cho giáo viên; tổ chức sinh hoạt chuyên môn định kỳ để phối hợp thiết kế, thử nghiệm, quan sát và điều chỉnh các bài giảng, dự án học tập có ứng dụng AI.</p>
      <p>3. <b>Giáo viên Tin học & Đầu mối hỗ trợ kỹ thuật:</b></p>
      <ul>
        <li>Chủ trì giảng dạy 12 tiết cốt lõi AI theo kế hoạch giáo dục;</li>
        <li>Rà soát công cụ, tài khoản, hạ tầng kỹ thuật và an toàn dữ liệu trước khi đưa vào ứng dụng;</li>
        <li>Hỗ trợ kỹ thuật, hướng dẫn giáo viên các bộ môn tích hợp AI an toàn, hiệu quả.</li>
      </ul>
      <p>4. <b>Giáo viên Bộ môn:</b> Định hướng công cụ AI phù hợp với đặc thù môn học; hướng dẫn học sinh khai thác AI hỗ trợ tự học; kiểm soát chặt chẽ tính trung thực học thuật trong các bài tập, dự án của học sinh.</p>
      <p>5. <b>Giáo viên Chủ nhiệm:</b> Tuyên truyền quy tắc đến học sinh và Cha mẹ học sinh; theo dõi, nắm bắt tâm lý, hành vi sử dụng công nghệ của học sinh lớp chủ nhiệm.</p>

      <!-- CHƯƠNG III -->
      <div class="chapter-title">Chương III. QUY TẮC SỬ DỤNG AI ĐỐI VỚI GIÁO VIÊN VÀ HỌC SINH</div>

      <div class="article-title">Điều 6. Quy tắc dành cho Giáo viên và Cán bộ quản lý</div>
      <p>1. Được phép sử dụng AI để hỗ trợ soạn kế hoạch bài dạy, thiết kế hình ảnh, tư liệu minh họa, ngân hàng câu hỏi tham khảo và tối ưu hóa công tác quản lý chuyên môn.</p>
      <p>2. Phải thẩm định kỹ độ chính xác, tính chuẩn mực sư phạm và giá trị giáo dục của mọi nội dung do AI gợi ý trước khi áp dụng vào giảng dạy và kiểm tra đánh giá.</p>
      <p>3. Nghiêm cấm đưa đề thi bảo mật, đáp án kiểm tra chưa công bố, hoặc hồ sơ cá nhân của học sinh/đồng nghiệp vào các ứng dụng AI trực tuyến công cộng.</p>

      <div class="article-title">Điều 7. Quy tắc dành cho Học sinh</div>
      <p>1. Được khuyến khích sử dụng AI như một "trợ lý học tập" để giải đáp thắc mắc, gợi ý ý tưởng, luyện tập ngoại ngữ, kiểm tra mã nguồn hoặc mở rộng tri thức.</p>
      <p>2. <b>Nghiêm cấm các hành vi gian lận học thuật:</b> Sao chép 100% nội dung do AI tạo ra để nộp làm bài tập, bài luận, bài kiểm tra hoặc sản phẩm dự án cá nhân/nhóm.</p>
      <p>3. Khi có sử dụng AI tham khảo trong bài làm, học sinh phải có phần trích dẫn công khai (ghi rõ tên công cụ AI và mục đích sử dụng).</p>

      <!-- CHƯƠNG IV -->
      <div class="chapter-title">Chương IV. PHỐI HỢP VỚI CHA MẸ HỌC SINH VÀ XỬ LÝ SỰ CỐ</div>

      <div class="article-title">Điều 8. Phối hợp với Cha mẹ học sinh</div>
      <p>1. Thông tin công khai, minh bạch đến Cha mẹ học sinh về mục tiêu giáo dục AI, danh mục công cụ, dữ liệu được sử dụng, quyền lựa chọn và kênh phản ánh của phụ huynh.</p>
      <p>2. Khuyên cha mẹ học sinh đồng hành cùng nhà trường trong việc định hướng con em sử dụng máy tính, điện thoại thông minh và các ứng dụng AI an toàn, văn minh tại gia đình.</p>

      <div class="article-title">Điều 9. Tiếp nhận và xử lý sự cố vi phạm</div>
      <p>1. Nhà trường thiết lập kênh tiếp nhận phản ánh (qua hộp thư góp ý, giáo viên chủ nhiệm, website trường) để xử lý kịp thời các nguy cơ sai lệch thông tin, vi phạm bản quyền hoặc hành vi xấu trên không gian mạng.</p>
      <p>2. Học sinh hoặc giáo viên cố tình vi phạm quy tắc trung thực học thuật, phát tán thông tin sai lệch hoặc vi phạm an toàn dữ liệu cá nhân sẽ bị xử lý kỷ luật theo quy định của nhà trường và pháp luật.</p>

      <div class="article-title">Điều 10. Đánh giá, theo dõi và Báo cáo</div>
      <p>1. Nhà trường tổ chức theo dõi, đánh giá việc triển khai giáo dục AI dựa trên minh chứng từ quá trình học tập, sản phẩm thực hành và phản hồi thực tế của học sinh, giáo viên.</p>
      <p>2. Định kỳ tổng hợp, báo cáo kết quả triển khai, những khó khăn, vướng mắc và sự cố (nếu có) về Sở Giáo dục và Đào tạo Đắk Lắk theo yêu cầu./.</p>

      <!-- KÝ TÊN VÀ NƠI NHẬN CHUẨN NGHỊ ĐỊNH 30 -->
      <br/>
      <table class="footer-table" style="width: 100%; border: none; margin-top: 20px;">
        <tr>
          <td style="width: 50%; text-align: left; vertical-align: top; padding: 0;">
            <div style="font-size: 11pt; font-weight: bold; font-style: italic;">Nơi nhận:</div>
            <div style="font-size: 11pt; line-height: 1.4;">
              - Sở GD&ĐT Đắk Lắk (để b/c);<br/>
              - BGH, các Tổ Chuyên môn (để t/h);<br/>
              - GV, NV & Học sinh toàn trường;<br/>
              - Ban ĐD CMHS trường;<br/>
              - Đăng Web, Zalo trường;<br/>
              - Lưu: VT, TK.
            </div>
          </td>
          <td style="width: 50%; text-align: center; vertical-align: top; padding: 0;">
            <div style="font-size: 12pt; font-weight: bold; text-transform: uppercase;">${signerTitle}</div>
            <div style="height: 70px;"></div>
            <div style="font-size: 12pt; font-weight: bold;">${signerName}</div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlDocument], {
    type: 'application/msword;charset=utf-8'
  });

  const fileName = `Quy_Tac_Su_Dung_AI_Trong_Nha_Truong_THPT_CaoBaQuat.doc`;

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
