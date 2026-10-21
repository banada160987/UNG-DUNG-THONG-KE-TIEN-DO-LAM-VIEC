import { supabase } from '../lib/supabase';

/**
 * Service đồng bộ dữ liệu chuẩn 100% từ Database Supabase
 * Phục vụ BGH, Thư ký, Tổ chuyên môn, Giáo viên và Học sinh
 */

// Hàm trích xuất thông tin chuyên môn, số tiết và lớp dạy từ thông tin giáo viên
export function parseTeacherBio(teacher) {
  if (!teacher) return null;
  const bio = teacher.bio || '';

  // 1. Môn chuyên môn
  let subject = teacher.subject_specialty || '';
  if (!subject) {
    const subMatch = bio.match(/Giáo viên\s+([^.]+)/i);
    if (subMatch) {
      subject = subMatch[1].trim();
    } else if (teacher.title?.includes('Toán')) {
      subject = 'Toán';
    } else if (teacher.title?.includes('Văn')) {
      subject = 'Ngữ văn';
    } else if (teacher.title?.includes('Anh')) {
      subject = 'Tiếng Anh';
    } else {
      subject = 'Chuyên môn';
    }
  }

  // 2. Định mức tiết dạy / tuần
  let periods = 17;
  const pMatch = bio.match(/Dạy\s+(\d+)\s+tiết/i);
  if (pMatch) {
    periods = parseInt(pMatch[1], 10);
  } else if (teacher.title?.includes('Hiệu trưởng') && !teacher.title?.includes('Phó')) {
    periods = 2;
  } else if (teacher.title?.includes('Phó Hiệu trưởng')) {
    periods = 4;
  } else if (teacher.title?.includes('Tổ trưởng')) {
    periods = 14;
  } else if (teacher.title?.includes('Tổ Phó')) {
    periods = 16;
  }

  // 3. Danh sách các lớp giảng dạy
  let classes = [];
  const cMatch = bio.match(/các lớp:\s*([^.]+)/i);
  if (cMatch) {
    classes = cMatch[1]
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);
  }

  // 4. Lớp chủ nhiệm
  let homeroom = teacher.homeroom_class || null;
  if (!homeroom) {
    const hrMatch = bio.match(/chủ nhiệm\s*(?:lớp)?\s*([0-9]{2}[A-Za-z0-9]+)/i);
    if (hrMatch) homeroom = hrMatch[1];
  }

  return {
    ...teacher,
    parsedSubject: subject,
    parsedPeriods: periods,
    parsedClasses: classes,
    parsedHomeroom: homeroom
  };
}

/**
 * Tải toàn bộ danh sách học sinh từ Database Supabase (phân trang để vượt giới hạn 1000 dòng)
 */
export async function fetchAllSyncedStudents() {
  try {
    const [chunk1, chunk2] = await Promise.all([
      supabase.from('cbq_students').select('id, student_code, student_name, student_class, grade_level, is_active, gender, birth_date, phone, email').range(0, 999),
      supabase.from('cbq_students').select('id, student_code, student_name, student_class, grade_level, is_active, gender, birth_date, phone, email').range(1000, 1999)
    ]);

    const allStudents = [...(chunk1.data || []), ...(chunk2.data || [])];
    return allStudents;
  } catch (err) {
    console.error('Lỗi tải danh sách học sinh từ database:', err);
    return [];
  }
}

/**
 * Tải danh mục Tổ chuyên môn từ database
 */
export async function fetchSyncedDepartments() {
  try {
    const { data, error } = await supabase
      .from('cbq_departments')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Lỗi tải tổ chuyên môn từ database:', err);
    return [];
  }
}

/**
 * Tải toàn bộ danh sách Cán bộ Giáo viên từ database cbq_staff
 */
export async function fetchSyncedStaff() {
  try {
    const { data, error } = await supabase
      .from('cbq_staff')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []).map(parseTeacherBio);
  } catch (err) {
    console.warn('Lỗi tải danh sách giáo viên từ database:', err);
    return [];
  }
}

/**
 * Gom nhóm danh sách lớp học và sĩ số chuẩn từ danh sách học sinh
 */
export function aggregateClassesFromStudents(studentsList = []) {
  const classMap = {};

  studentsList.forEach(st => {
    const className = (st.student_class || 'Chưa xếp lớp').trim();
    if (!classMap[className]) {
      const grade = className.startsWith('10')
        ? 'Khối 10'
        : className.startsWith('11')
        ? 'Khối 11'
        : className.startsWith('12')
        ? 'Khối 12'
        : 'Khác';

      classMap[className] = {
        name: className,
        gradeLevel: grade,
        gradeNum: className.slice(0, 2),
        totalStudents: 0,
        maleStudents: 0,
        femaleStudents: 0,
        students: []
      };
    }

    classMap[className].totalStudents += 1;
    if (st.gender === 'Nam') classMap[className].maleStudents += 1;
    if (st.gender === 'Nữ') classMap[className].femaleStudents += 1;
    classMap[className].students.push(st);
  });

  return classMap;
}

/**
 * Lấy toàn bộ dữ liệu hợp nhất (Học sinh + Giáo viên + Tổ chuyên môn + Thống kê xe máy / buýt)
 */
export async function fetchComprehensiveSchoolSyncData() {
  const [departments, staff, allStudents, parkingRes, busRes, topicsRes, categoriesRes] = await Promise.all([
    fetchSyncedDepartments(),
    fetchSyncedStaff(),
    fetchAllSyncedStudents(),
    supabase.from('cbq_parking_registrations').select('id, student_class', { count: 'exact' }),
    supabase.from('cbq_bus_registrations').select('id, student_class', { count: 'exact' }),
    supabase.from('cbq_feedback_topics').select('id', { count: 'exact' }),
    supabase.from('cbq_dossier_categories').select('*').order('created_at', { ascending: true })
  ]);

  const classMap = aggregateClassesFromStudents(allStudents);
  const sortedClasses = Object.keys(classMap).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  // Gán giáo viên chủ nhiệm vào từng lớp nếu có
  const homeroomMap = {};
  staff.forEach(t => {
    if (t.parsedHomeroom) {
      homeroomMap[t.parsedHomeroom] = t.name;
    }
  });

  return {
    departments,
    staff,
    totalStaffCount: staff.length,
    allStudents,
    totalStudentCount: allStudents.length,
    classMap,
    sortedClasses,
    totalClassCount: sortedClasses.length,
    homeroomMap,
    parkingCount: parkingRes.count || 0,
    busCount: busRes.count || 0,
    feedbackCount: topicsRes.count || 0,
    dossierCategories: categoriesRes.data || []
  };
}
