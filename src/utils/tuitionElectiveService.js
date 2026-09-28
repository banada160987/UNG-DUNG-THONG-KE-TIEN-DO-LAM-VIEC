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
  const s = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (s.includes('toan')) return 'Toán';
  if (s.includes('van') || s.includes('ngu van')) return 'Ngữ Văn';
  if (s.includes('vat li') || s.includes('vat ly') || s === 'li' || s === 'ly') return 'Vật Lí';
  if (s.includes('hoa') || s.includes('hoa hoc')) return 'Hóa học';
  if (s.includes('sinh') || s.includes('sinh hoc')) return 'Sinh học';
  if (s.includes('lich su') || s.includes('su')) return 'Lịch Sử';
  if (s.includes('dia li') || s.includes('dia ly') || s.includes('dia')) return 'Địa Lí';
  if (s.includes('gdkt') || s.includes('phap luat') || s.includes('kinh te')) return 'GDKTPL';
  if (s.includes('tieng anh') || s.includes('anh') || s.includes('ngoai ngu')) return 'Tiếng Anh';
  if (s.includes('tin hoc') || s.includes('tin')) return 'Tin học';
  if (s.includes('cong nghe')) return 'Công nghệ';

  return raw;
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
 * Mẫu cấu hình Đợt Đăng Ký Học Thêm Khối 12 chuẩn GDPT 2018
 */
export function getTuitionCampaignPreset() {
  return {
    title: 'Đăng ký học thêm các môn năm học 2026 - 2027 (Khối 12)',
    description: 'Học sinh Khối 12 đăng ký học thêm / ôn thi Tốt nghiệp THPT 2027. Môn Toán và Ngữ Văn áp dụng cho toàn bộ học sinh Khối 12; các môn tự chọn chỉ áp dụng đúng 02 môn tự chọn học sinh đã đăng ký trước đó.',
    target_grades: ['Khối 12'],
    prerequisite_mode: 'tuition_electives',
    form_schema: {
      prerequisite_mode: 'tuition_electives',
      is_tuition_registration: true,
      fields: [
        {
          id: 'field_tuition_subjects',
          type: 'checkbox',
          label: 'Các môn đăng ký học thêm (Toán, Văn + 02 môn tự chọn của em)',
          options: ALL_TUITION_SUBJECTS,
          required: true,
          description: 'Môn Toán & Ngữ Văn mở cho toàn bộ khối 12. Học sinh chỉ được tích chọn thêm đúng 2 môn tự chọn đã đăng ký.'
        },
        {
          id: 'field_tuition_target',
          type: 'select',
          label: 'Mục tiêu điểm số và định hướng xét tuyển',
          options: [
            '1. Ôn thi Tốt nghiệp THPT đạt chuẩn & Khá giỏi',
            '2. Luyện thi Đánh giá năng lực (ĐGNL) - Đánh giá tư duy (ĐGTD)',
            '3. Xét tuyển Đại học Top đầu (Khối A00, A01, B00, C00, D01...)',
            '4. Củng cố kiến thức nền tảng & Chống điểm liệt'
          ],
          required: true
        },
        {
          id: 'field_parent_phone',
          type: 'text',
          label: 'Số điện thoại Zalo của Phụ huynh / Học sinh nhận lịch học & thông báo',
          required: true
        },
        {
          id: 'field_tuition_commitment',
          type: 'radio',
          label: 'Cam kết chuyên cần và thực hiện nội quy học thêm',
          options: [
            'Em và gia đình cam kết tham gia học tập nghiêm túc, đúng giờ và chấp hành đầy đủ nội quy',
            'Không đăng ký học thêm bất kỳ môn nào'
          ],
          required: true
        },
        {
          id: 'field_student_note',
          type: 'textarea',
          label: 'Ghi chú / Nguyện vọng đặc biệt gửi Ban Giám Hiệu & Giáo viên bộ môn',
          required: false
        }
      ]
    }
  };
}
