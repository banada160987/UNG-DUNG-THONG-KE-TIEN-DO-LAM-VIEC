// src/utils/tuitionElectiveService.js
// Dịch vụ quản lý và đối soát điều kiện đăng ký học thêm theo Môn Tự Chọn GDPT 2018 (Khối 12)

import { supabase, supabase2, DualSupabaseService } from '../lib/supabase';

// Danh mục chuẩn các môn thi & môn học thêm GDPT 2018
export const CORE_SUBJECTS = ['Toán', 'Ngữ Văn'];

export const ELECTIVE_SUBJECTS = [
  'Vật Lí',
  'Hóa học',
  'Sinh học',
  'Lịch Sử',
  'Địa Lí',
  'GDKTPL',
  'Tiếng Anh',
  'Tin học',
  'Công nghệ'
];

export const ALL_TUITION_SUBJECTS = [...CORE_SUBJECTS, ...ELECTIVE_SUBJECTS];

// Màu sắc & Icon nhận diện từng môn học
export const SUBJECT_METADATA = {
  'Toán': { icon: '📐', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', isCore: true },
  'Ngữ Văn': { icon: '📖', color: '#be123c', bg: '#fff1f2', border: '#fecdd3', isCore: true },
  'Vật Lí': { icon: '⚡', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', isCore: false },
  'Hóa học': { icon: '🧪', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', isCore: false },
  'Sinh học': { icon: '🧬', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', isCore: false },
  'Lịch Sử': { icon: '🏛️', color: '#b45309', bg: '#fffbeb', border: '#fde68a', isCore: false },
  'Địa Lí': { icon: '🌏', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', isCore: false },
  'GDKTPL': { icon: '⚖️', color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe', isCore: false },
  'Tiếng Anh': { icon: '🌐', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', isCore: false },
  'Tin học': { icon: '💻', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', isCore: false },
  'Công nghệ': { icon: '⚙️', color: '#475569', bg: '#f8fafc', border: '#e2e8f0', isCore: false }
};

/**
 * Chuẩn hóa tên môn học tiếng Việt (bỏ dấu, chuyển về tên chuẩn)
 */
export function normalizeSubjectName(subj) {
  if (!subj) return '';
  const raw = String(subj).trim();
  if (raw.length === 0) return '';

  // Một tên môn học thông thường không bao giờ vượt quá 35 ký tự hoặc quá 6 từ
  if (raw.length > 35 || raw.split(/\s+/).length > 6) return raw;

  // Lọc nhanh các văn bản hành chính / cam kết / thông tin cá nhân / trường học
  const lowerRaw = raw.toLowerCase();
  if (
    lowerRaw.includes('cam kết') ||
    lowerRaw.includes('kính đề nghị') ||
    lowerRaw.includes('nguyện vọng') ||
    lowerRaw.includes('chấp hành') ||
    lowerRaw.includes('học sinh') ||
    lowerRaw.includes('nhà trường') ||
    lowerRaw.includes('nội quy') ||
    lowerRaw.includes('người giám hộ') ||
    lowerRaw.includes('cha mẹ') ||
    lowerRaw.includes('điện thoại') ||
    lowerRaw.includes('thông tư') ||
    lowerRaw.includes('học lực')
  ) {
    return raw;
  }

  const s = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();

  // Khớp chính xác hoặc theo ranh giới từ (tránh nuốt từ như "chấp hành", "học sinh", "thông tin", "khóa học")
  if (!s.includes('thanh toan') && !s.includes('toan bo') && /(^|\b)(toan|toan hoc|mon toan)(\b|$)/i.test(s)) return 'Toán';
  if (!s.includes('van ban') && !s.includes('tu van') && !s.includes('van de') && /(^|\b)(ngu van|van hoc|mon van|^van$|^van\s*\d+)/i.test(s)) return 'Ngữ Văn';
  if (/(^|\b)(vat li|vat ly|mon li|mon ly|^li$|^ly$|^vat li\s*\d+|^vat ly\s*\d+)/i.test(s)) return 'Vật Lí';
  if (!s.includes('khoa') && !s.includes('hoa binh') && !s.includes('hoa don') && /(^|\b)(hoa hoc|mon hoa|^hoa$|^hoa\s*\d+)/i.test(s)) return 'Hóa học';
  if (!s.includes('hoc sinh') && !s.includes('giang sinh') && !s.includes('ve sinh') && !s.includes('phat sinh') && /(^|\b)(sinh hoc|mon sinh|^sinh$|^sinh\s*\d+)/i.test(s)) return 'Sinh học';
  if (!s.includes('giao su') && !s.includes('su viec') && /(^|\b)(lich su|mon su|^su$|^su\s*\d+)/i.test(s)) return 'Lịch Sử';
  if (!s.includes('dia diem') && !s.includes('dia chi') && /(^|\b)(dia li|dia ly|mon dia|^dia$|^dia\s*\d+)/i.test(s)) return 'Địa Lí';
  if (/(^|\b)(gdkt|gdktpl|gdkt&pl|ktpl|phap luat|kinh te)/i.test(s)) return 'GDKTPL';
  if (!s.includes('chap hanh') && !s.includes('hoan thanh') && !s.includes('thanh tich') && !s.includes('hinh anh') && /(^|\b)(tieng anh|ngoai ngu|english|mon anh|^anh$|^anh\s*\d+)/i.test(s)) return 'Tiếng Anh';
  if (!s.includes('thong tin') && !s.includes('tu tin') && !s.includes('tin tuong') && /(^|\b)(tin hoc|mon tin|^tin$|^tin\s*\d+)/i.test(s)) return 'Tin học';
  if (/(^|\b)(cong nghe|mon cong nghe|^cong nghe\s*\d+)/i.test(s)) return 'Công nghệ';

  return raw;
}

/**
 * Kiểm tra xem một trường trong form có phải là trường chọn Môn Học Thêm hay không
 */
export function isTuitionSubjectField(field) {
  if (!field) return false;
  if (field.id === 'field_tuition_subjects') return true;
  
  const label = (field.label || '').toLowerCase();
  // Loại trừ các trường cam kết, đối tượng, giáo viên, người giám hộ, lý do...
  if (
    label.includes('cam kết') || 
    label.includes('đối tượng') || 
    label.includes('giáo viên') || 
    label.includes('nguyện vọng') || 
    label.includes('lý do') || 
    label.includes('nộp đơn') || 
    label.includes('cha mẹ') || 
    label.includes('điện thoại')
  ) {
    return false;
  }
  
  // Nếu nhãn có chữ "môn" hoặc "môn học"
  if (label.includes('môn')) return true;
  
  // Hoặc nếu options chứa ít nhất 2 môn học trong danh mục ALL_TUITION_SUBJECTS
  if (Array.isArray(field.options)) {
    const subjectCount = field.options.filter(opt => {
      const norm = normalizeSubjectName(opt);
      return ALL_TUITION_SUBJECTS.includes(norm);
    }).length;
    if (subjectCount >= 2) return true;
  }
  
  return false;
}

/**
 * Kiểm tra môn học có phải là môn BẮT BUỘC toàn khối 12 (Toán & Ngữ Văn) không
 */
export function isCoreSubject(subj) {
  const norm = normalizeSubjectName(subj);
  return CORE_SUBJECTS.includes(norm);
}

/**
 * Kiểm tra xem một môn học có được phép đăng ký học thêm cho học sinh hay không
 * @param {string} subj Tên môn muốn học thêm
 * @param {string[]} studentElectives Danh sách 2 môn tự chọn học sinh đã đăng ký
 * @returns {boolean}
 */
export function isSubjectAllowedForStudent(subj, studentElectives = []) {
  if (isCoreSubject(subj)) return true; // Toán và Văn mở cho toàn bộ khối 12
  
  const norm = normalizeSubjectName(subj);
  const normElectives = (studentElectives || []).map(normalizeSubjectName);
  return normElectives.includes(norm);
}

/**
 * Kiểm tra chiến dịch có phải là Đợt Đăng Ký Học Thêm (có áp dụng điều kiện môn tự chọn) hay không
 */
export function isTuitionCampaign(cam) {
  if (!cam) return false;
  
  // 1. Kiểm tra cấu hình trong form_schema hoặc trường prerequisite_mode
  const schema = cam.form_schema;
  if (cam.prerequisite_mode === 'tuition_electives') return true;
  if (schema && typeof schema === 'object' && !Array.isArray(schema)) {
    if (schema.prerequisite_mode === 'tuition_electives') return true;
    if (schema.is_tuition_registration === true) return true;
  }
  
  // 2. Nhận diện thông minh qua tiêu đề và khối áp dụng
  const title = (cam.title || '').toLowerCase();
  const isTuitionTitle = title.includes('học thêm') || title.includes('on tap') || title.includes('ôn tập') || title.includes('bồi dưỡng') || title.includes('tăng tiết');
  const isGrade12 = Array.isArray(cam.target_grades) && cam.target_grades.includes('Khối 12');

  return isTuitionTitle && (isGrade12 || cam.target_grades?.length === 1);
}

/**
 * Tra cứu danh sách môn tự chọn đã đăng ký của học sinh
 * Ưu tiên 1: Tra cứu từ bảng cbq_student_registrations (đợt đăng ký môn tự chọn trước đó)
 * Ưu tiên 2: Tra cứu từ bảng cbq_students (cột exam_electives)
 */
export async function fetchStudentElectives({ studentCode, studentName, studentClass, targetCampaign }) {
  if (!studentCode && !studentName) {
    return { electives: [], source: 'none', rawData: null };
  }

  const client = (targetCampaign?._source === 'sb1' && supabase) ? supabase : (supabase2 || supabase);

  try {
    // 1. Tra cứu trong bảng cbq_student_registrations
    let query = client.from('cbq_student_registrations').select('*');
    if (studentCode) {
      query = query.eq('student_code', studentCode);
    } else {
      query = query.eq('student_name', studentName).eq('student_class', studentClass);
    }

    const { data: regList, error: regErr } = await query;
    if (!regErr && regList && regList.length > 0) {
      for (const reg of regList) {
        if (!reg.responses) continue;
        for (const [key, val] of Object.entries(reg.responses)) {
          if (Array.isArray(val)) {
            const detected = [];
            val.forEach(item => {
              const norm = normalizeSubjectName(item);
              if (ELECTIVE_SUBJECTS.includes(norm) && !detected.includes(norm)) {
                detected.push(norm);
              }
            });
            if (detected.length >= 2) {
              return {
                electives: detected,
                source: 'cbq_student_registrations (Đợt môn tự chọn)',
                rawData: reg
              };
            }
          }
        }
      }
    }

    // 2. Tra cứu trong bảng cbq_students (cột exam_electives)
    let stuQuery = client.from('cbq_students').select('student_code, student_name, student_class, exam_electives');
    if (studentCode) {
      stuQuery = stuQuery.eq('student_code', studentCode);
    } else {
      stuQuery = stuQuery.eq('student_name', studentName).eq('student_class', studentClass);
    }

    const { data: stuData } = await stuQuery.maybeSingle();
    if (stuData?.exam_electives && Array.isArray(stuData.exam_electives) && stuData.exam_electives.length > 0) {
      const detected = stuData.exam_electives.map(normalizeSubjectName).filter(s => ELECTIVE_SUBJECTS.includes(s));
      return {
        electives: detected,
        source: 'cbq_students.exam_electives',
        rawData: stuData
      };
    }

    // 3. Fallback cache localStorage nếu có
    try {
      const cached = localStorage.getItem('cbq_students_data');
      if (cached) {
        const students = JSON.parse(cached);
        const match = students.find(s => s.student_code === studentCode || (s.student_name === studentName && s.student_class === studentClass));
        if (match?.exam_electives && Array.isArray(match.exam_electives)) {
          const detected = match.exam_electives.map(normalizeSubjectName).filter(s => ELECTIVE_SUBJECTS.includes(s));
          return {
            electives: detected,
            source: 'localStorage.cbq_students_data',
            rawData: match
          };
        }
      }
    } catch (e) {
      console.warn("Lỗi đọc cache học sinh:", e);
    }

    return { electives: [], source: 'not_found', rawData: null };
  } catch (err) {
    console.error("Lỗi khi tra cứu môn tự chọn học sinh:", err);
    return { electives: [], source: 'error', rawData: null };
  }
}

/**
 * Mẫu cấu hình Đợt Đăng Ký Học Thêm Khối 12 chuẩn GDPT 2018 theo Thông tư Bộ GD&ĐT
 */
export function getTuitionCampaignPreset() {
  return {
    title: 'Đăng ký học thêm các môn năm học 2026 - 2027 (Khối 12)',
    description: 'Học sinh Khối 12 đăng ký học thêm / ôn thi Tốt nghiệp THPT 2027 theo quy định của Bộ GD&ĐT. Môn Toán và Ngữ Văn áp dụng cho toàn bộ học sinh Khối 12; các môn tự chọn chỉ áp dụng đúng 02 môn tự chọn học sinh đã đăng ký trước đó. Yêu cầu tải mẫu đơn, xin chữ ký của Cha Mẹ học sinh và nộp file lên hệ thống / Drive để hoàn tất.',
    target_grades: ['Khối 12'],
    prerequisite_mode: 'tuition_electives',
    school_drive_url: '',
    google_drive_script_url: '',
    google_drive_folder_id: '',
    requires_signed_document: true,
    form_schema: {
      prerequisite_mode: 'tuition_electives',
      is_tuition_registration: true,
      requires_signed_document: true,
      school_drive_url: '',
      google_drive_script_url: '',
      google_drive_folder_id: '',
      school_name: 'Trường THPT Cao Bá Quát',
      school_year: '2026 - 2027',
      fields: [
        {
          id: 'field_tuition_subjects',
          type: 'checkbox',
          label: '1. Môn học đăng kí học thêm (Toán, Văn + 02 môn tự chọn của em)',
          options: ALL_TUITION_SUBJECTS,
          required: true,
          description: 'Môn Toán & Ngữ Văn mở cho toàn bộ khối 12. Học sinh chỉ được tích chọn thêm đúng 2 môn tự chọn đã đăng ký.'
        },
        {
          id: 'field_tuition_category',
          type: 'select',
          label: '2. Đối tượng đăng kí học thêm (Quy định tại khoản 1 Điều 5)',
          options: [
            '1. Học sinh có nguyện vọng học thêm để củng cố, nâng cao kiến thức, rèn luyện kỹ năng',
            '2. Học sinh có nguyện vọng học thêm để ôn thi tuyển sinh, ôn thi tốt nghiệp THPT',
            '3. Học sinh có học lực chưa đạt chuẩn, cần được bồi dưỡng, phụ đạo để đạt chuẩn kiến thức'
          ],
          required: true,
          description: 'Chọn đúng 1 trong 3 đối tượng quy định tại khoản 1 Điều 5 Thông tư quy định về dạy thêm, học thêm.'
        },
        {
          id: 'field_preferred_teacher',
          type: 'text',
          label: '3. Nguyện vọng đăng kí giáo viên (nếu có)',
          required: false,
          description: 'Ghi rõ họ và tên giáo viên dạy thêm môn mong muốn (hoặc để trống nếu kính nhờ nhà trường phân công).'
        },
        {
          id: 'field_parent_name',
          type: 'text',
          label: 'Họ và tên Cha / Mẹ / Người giám hộ ký đơn',
          required: true,
          description: 'Ghi rõ họ tên người sẽ ký vào mục Ý kiến của cha mẹ học sinh.'
        },
        {
          id: 'field_parent_phone',
          type: 'text',
          label: 'Số điện thoại Zalo của Cha Mẹ / Học sinh',
          required: true,
          description: 'Số điện thoại để nhà trường gửi thông báo xếp lớp, thời khóa biểu và liên lạc.'
        },
        {
          id: 'field_tuition_commitment',
          type: 'checkbox',
          label: 'Cam kết của học sinh và gia đình',
          options: [
            'Em và gia đình kính đề nghị nhà trường cho phép tham gia học thêm và cam kết chấp hành nghiêm túc nội quy'
          ],
          required: true,
          description: 'Học sinh tích chọn để xác nhận sự đồng thuận và cam kết tự nguyện học thêm của em và gia đình.'
        }
      ]
    }
  };
}

/**
 * Tạo nội dung file Word (.doc) theo đúng chuẩn mẫu "ĐƠN ĐĂNG KÍ HỌC THÊM"
 * của Thông tư dạy thêm học thêm - Bộ Giáo dục và Đào tạo
 */
export function generateTuitionApplicationDoc({
  studentName = '',
  studentClass = '',
  schoolYear = '2026 - 2027',
  schoolName = 'Trường THPT Cao Bá Quát',
  subjects = [],
  category = '',
  preferredTeacher = '',
  parentName = '',
  date = new Date()
}) {
  const d = date instanceof Date ? date : new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  const subjectsText = Array.isArray(subjects) && subjects.length > 0 
    ? subjects.join(', ') 
    : (typeof subjects === 'string' && subjects ? subjects : '...........................................................................');

  const gradeMatch = (studentClass || '').match(/^(10|11|12)/);
  const gradeText = gradeMatch ? `Khối ${gradeMatch[1]}` : 'Khối 12';

  const categoryText = category || 'Học sinh có nguyện vọng học thêm để củng cố, nâng cao kiến thức, rèn luyện kỹ năng và ôn thi tốt nghiệp THPT.';
  const preferredTeacherText = preferredTeacher || 'Kính nhờ Nhà trường và Ban Giám hiệu phân công giáo viên giảng dạy theo kế hoạch của trường.';

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>ĐƠN ĐĂNG KÍ HỌC THÊM</title>
      <style>
        @page Section1 {
          size: 21.0cm 29.7cm;
          margin: 2.0cm 2.0cm 2.0cm 2.5cm;
          mso-header-margin: 35.4pt;
          mso-footer-margin: 35.4pt;
          mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 13pt;
          line-height: 1.45;
          color: #000000;
        }
        .header-table { width: 100%; border: none; margin-bottom: 20px; }
        .header-table td { border: none; vertical-align: top; text-align: center; }
        .title { text-align: center; font-size: 15pt; font-weight: bold; margin-top: 15px; margin-bottom: 20px; text-transform: uppercase; }
        .recipient { margin-left: 50px; margin-bottom: 18px; font-weight: bold; }
        .content-p { text-indent: 1cm; text-align: justify; margin-top: 7px; margin-bottom: 7px; line-height: 1.5; }
        .item-p { margin-left: 0.5cm; text-align: justify; margin-top: 8px; margin-bottom: 8px; line-height: 1.5; }
        .footer-table { width: 100%; border: none; margin-top: 25px; }
        .footer-table td { border: none; vertical-align: top; text-align: center; }
        .footnotes { margin-top: 35px; border-top: 1pt solid #000000; padding-top: 6px; font-size: 10pt; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="Section1">
        <table class="header-table" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 100%; text-align: center;">
              <p style="margin: 0; font-weight: bold; font-size: 13pt; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p style="margin: 4px 0 0 0; font-weight: bold; font-size: 14pt;">Độc lập - Tự do - Hạnh phúc</p>
              <p style="margin: 5px 0 0 0; letter-spacing: 2px;">-------***-------</p>
            </td>
          </tr>
        </table>

        <div class="title">ĐƠN ĐĂNG KÍ HỌC THÊM</div>

        <div class="recipient">
          <p style="margin: 0;">Kính gửi:</p>
          <p style="margin: 4px 0 0 20px;">- Hiệu trưởng ${schoolName};</p>
          <p style="margin: 4px 0 0 20px;">- Giáo viên chủ nhiệm Lớp ${studentClass || '........'}.</p>
        </div>

        <p class="content-p">
          Tên em là: <strong>${(studentName || '').toUpperCase()}</strong>
        </p>
        <p class="content-p">
          Học sinh lớp: <strong>${studentClass || '...........'}</strong> (tên lớp đang học chính khóa tại nhà trường).
        </p>
        <p class="content-p">
          Em viết đơn này kính mong nhà trường cho phép em được đăng kí học thêm trong năm học <strong>${schoolYear}</strong><sup>1</sup>, cụ thể như sau:
        </p>

        <p class="item-p">
          <strong>1. Môn học đăng kí học thêm:</strong> <span style="color: #000080; font-weight: bold;">${subjectsText}</span> (ghi tên môn học theo chương trình giáo dục), lớp <strong>${gradeText}</strong> (ghi khối lớp đăng kí học thêm).
        </p>

        <p class="item-p">
          <strong>2. Đối tượng đăng kí học thêm<sup>2</sup>:</strong> ${categoryText}
        </p>

        <p class="item-p">
          <strong>3. Nguyện vọng đăng kí giáo viên (nếu có):</strong> ${preferredTeacherText}
        </p>

        <p class="content-p">
          Em xin trân trọng cảm ơn!
        </p>

        <table class="footer-table" style="width: 100%; border-collapse: collapse; margin-top: 25px;">
          <tr>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <p style="margin: 0; font-weight: bold; text-transform: uppercase;">Ý KIẾN CỦA CHA MẸ HỌC SINH</p>
              <p style="margin: 3px 0 0 0; font-style: italic; font-size: 11pt;">(Đối với người chưa thành niên)</p>
              <p style="margin: 3px 0 0 0; font-style: italic; font-size: 10.5pt;">(Kí và ghi rõ họ tên)</p>
              <div style="height: 70px;"></div>
              <p style="margin: 0; font-weight: bold;">${parentName || ''}</p>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <p style="margin: 0; font-style: italic;">Đắk Lắk, ngày ${day} tháng ${month} năm ${year}</p>
              <p style="margin: 3px 0 0 0; font-weight: bold; text-transform: uppercase;">NGƯỜI LÀM ĐƠN</p>
              <p style="margin: 3px 0 0 0; font-style: italic; font-size: 10.5pt;">(Kí và ghi rõ họ tên)</p>
              <div style="height: 70px;"></div>
              <p style="margin: 0; font-weight: bold;">${studentName || ''}</p>
            </td>
          </tr>
        </table>

        <div class="footnotes">
          <p style="margin: 2px 0;"><sup>1</sup> Ghi năm học học sinh có nguyện vọng đăng kí học thêm</p>
          <p style="margin: 2px 0;"><sup>2</sup> Ghi rõ 1 trong 3 đối tượng quy định tại khoản 1 Điều 5 Thông tư này</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Tải file Word (.doc) đơn đăng ký học thêm đã điền thông tin học sinh
 */
export function downloadTuitionApplicationDoc(params) {
  const htmlContent = generateTuitionApplicationDoc(params);
  const cleanName = (params.studentName || 'HocSinh').replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
  const cleanClass = (params.studentClass || '12').replace(/[^a-zA-Z0-9]/g, '');
  const fileName = `Don_Dang_Ki_Hoc_Them_${cleanClass}_${cleanName}.doc`;
  
  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Mở cửa sổ in trực tiếp hoặc lưu PDF đơn đăng ký học thêm
 */
export function printTuitionApplicationDoc(params) {
  const htmlContent = generateTuitionApplicationDoc(params);
  const printWindow = window.open('', '_blank', 'width=850,height=950');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 450);
  }
}

/**
 * Kiểm tra xem một đợt đăng ký có bị Quản trị viên ẩn khỏi Cổng học sinh hay không
 */
export function isCampaignHidden(cam) {
  if (!cam) return false;
  if (cam.is_hidden === true) return true;
  if (cam.form_schema && typeof cam.form_schema === 'object' && !Array.isArray(cam.form_schema)) {
    if (cam.form_schema.is_hidden === true) return true;
  }
  return false;
}

/**
 * Trích xuất Google Drive Folder ID từ URL hoặc chuỗi ID
 */
export function extractDriveFolderId(urlOrId) {
  if (!urlOrId) return '';
  const str = String(urlOrId).trim();
  const match = str.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  const idMatch = str.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];
  return str;
}

/**
 * Mã nguồn Google Apps Script (GAS) tự động tiếp nhận file từ học sinh,
 * tự động tạo thư mục theo LỚP và lưu file ngay ngắn trên Google Drive của Thầy/Cô.
 */
export const GOOGLE_APPS_SCRIPT_TUITION_CODE = `/**
 * GOOGLE APPS SCRIPT: TỰ ĐỘNG TIẾP NHẬN ĐƠN ĐĂNG KÝ HỌC THÊM & GOM NHÓM THEO LỚP
 * ---------------------------------------------------------------------------------
 * HƯỚNG DẪN CÀI ĐẶT 30 GIÂY:
 * 1. Truy cập https://script.google.com bằng tài khoản Google của Trường / Thầy Cô.
 * 2. Bấm "Dự án mới" (New project), xóa hết mã cũ và dán toàn bộ đoạn mã này vào.
 * 3. Bấm biểu tượng 💾 (Lưu).
 * 4. Bấm "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment).
 *    - Chọn loại: "Ứng dụng web" (Web app).
 *    - Mô tả: "Tiếp nhận đơn học thêm theo lớp".
 *    - Thực thi với tư cách: "Tôi" (Me - your email).
 *    - Ai có quyền truy cập: "Bất kỳ ai" (Anyone) -> RẤT QUAN TRỌNG để học sinh nộp được.
 * 5. Bấm "Triển khai" -> Chọn "Xem lại quyền truy cập" -> Chọn tài khoản -> Bấm "Nâng cao" (Advanced) -> "Đi tới [Tên dự án] (không an toàn)" -> Bấm "Cho phép" (Allow).
 * 6. Sao chép "URL ứng dụng web" (có đuôi /exec) và dán vào phần Cài đặt Đợt đăng ký trên hệ thống.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Đợi tối đa 30 giây để xử lý tuần tự, chống xung đột ghi đè
  if (!lock.tryLock(30000)) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Hệ thống Google Drive đang bận xử lý nhiều tệp cùng lúc. Vui lòng bấm thử lại sau giây lát!"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Không tìm thấy dữ liệu tệp được gửi đến."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var base64Data = data.base64Data;
    var rawFileName = data.fileName || "Don_dang_ky.pdf";
    var mimeType = data.mimeType || "application/pdf";
    var studentClass = String(data.studentClass || "Chung").trim();
    var studentName = String(data.studentName || "HocSinh").trim();
    var studentCode = String(data.studentCode || "").trim();
    var campaignTitle = String(data.campaignTitle || "Hồ Sơ Đăng Ký Học Thêm").trim();
    var parentFolderId = data.parentFolderId ? String(data.parentFolderId).trim() : "";

    // 1. Xác định Thư mục Gốc của Đợt
    var parentFolder;
    if (parentFolderId) {
      try {
        parentFolder = DriveApp.getFolderById(parentFolderId);
      } catch (err) {
        parentFolder = null;
      }
    }

    if (!parentFolder) {
      var rootFolders = DriveApp.getRootFolder().getFoldersByName(campaignTitle);
      if (rootFolders.hasNext()) {
        parentFolder = rootFolders.next();
      } else {
        parentFolder = DriveApp.getRootFolder().createFolder(campaignTitle);
        try {
          parentFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (e) {}
      }
    }

    // 2. Tìm hoặc Tạo Thư mục Con gom nhóm theo từng LỚP (Ví dụ: "Lớp 12A1")
    var cleanClassName = studentClass.replace(/^Lớp\\s*/i, '').trim() || "Chung";
    var folderName = "Lớp " + cleanClassName;
    var classFolders = parentFolder.getFoldersByName(folderName);
    var classFolder;
    if (classFolders.hasNext()) {
      classFolder = classFolders.next();
    } else {
      classFolder = parentFolder.createFolder(folderName);
      try {
        classFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (e) {}
    }

    // 3. Đặt tên file chuẩn mực: [12A1] - Nguyễn Văn A (HS1201) - Don_Hoc_Them.pdf
    var fileExt = rawFileName.split('.').pop() || "pdf";
    var standardizedFileName = "[" + cleanClassName + "] " + studentName + (studentCode ? " (" + studentCode + ")" : "") + " - Don_Dang_Ky." + fileExt;

    // 4. Giải mã Base64 và Lưu tệp vào Thư mục Lớp
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, standardizedFileName);
    var newFile = classFolder.createFile(blob);
    newFile.setDescription("Đơn đăng ký học thêm của học sinh: " + studentName + " - Lớp: " + cleanClassName + " - Mã HS: " + studentCode);
    try {
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {}

    var result = {
      status: "success",
      fileUrl: newFile.getUrl(),
      fileId: newFile.getId(),
      downloadUrl: "https://drive.google.com/uc?export=download&id=" + newFile.getId(),
      previewUrl: "https://drive.google.com/file/d/" + newFile.getId() + "/view",
      classFolderUrl: classFolder.getUrl(),
      classFolderId: classFolder.getId(),
      className: cleanClassName,
      fileName: standardizedFileName,
      studentName: studentName
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Lỗi lưu file trên Google Drive: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ready",
    message: "Google Apps Script Web App sẵn sàng tiếp nhận đơn đăng ký học thêm theo lớp!"
  })).setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Gửi tải file trực tiếp lên Google Apps Script Web App để lưu vào Google Drive theo từng Lớp
 */
export async function uploadFileToGoogleDrive({
  scriptUrl,
  file,
  studentClass,
  studentName,
  studentCode,
  campaignTitle,
  parentFolderId
}) {
  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    throw new Error("URL Web App Google Apps Script chưa được cấu hình hoặc không hợp lệ.");
  }

  // Đọc file thành chuỗi base64
  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = typeof result === 'string' && result.includes(',') 
        ? result.split(',')[1] 
        : result;
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  const payload = {
    base64Data,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    studentClass: studentClass || '',
    studentName: studentName || '',
    studentCode: studentCode || '',
    campaignTitle: campaignTitle || 'Đăng ký học thêm',
    parentFolderId: parentFolderId ? extractDriveFolderId(parentFolderId) : ''
  };

  const response = await fetch(scriptUrl, {
    method: 'POST',
    // Dùng text/plain để tránh CORS preflight OPTIONS request
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Google Apps Script phản hồi HTTP ${response.status}. Vui lòng kiểm tra lại quyền triển khai (Ai có quyền truy cập: Bất kỳ ai).`);
  }

  const json = await response.json();
  if (json.status !== 'success') {
    throw new Error(json.message || 'Lỗi không xác định khi lưu file vào Google Drive.');
  }

  return json;
}

