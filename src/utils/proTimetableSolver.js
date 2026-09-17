import * as XLSX from 'xlsx';

export const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export const PERIODS_MORNING = [1, 2, 3, 4, 5];
export const PERIODS_AFTERNOON = [6, 7, 8, 9, 10];
export const PERIODS_ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const TEACHER_FULL_MAP = {
  "Thảo": "Lê Thị Thảo", "Thơ": "Phạm Thị Nguyệt Thơ", "Lam (T)": "Nguyễn Hữu Lam",
  "Chuyên": "Nguyễn Thị Chuyên", "Hoa (T)": "Nguyễn Thị Ngọc Hoa", "Hà (T)": "Nguyễn Thị Thanh Hà",
  "Khoa": "Vương Quốc Khoa", "Khuyến": "Nguyễn Thị Khuyến", "Khánh": "Nguyễn Ngọc Khánh",
  "Thu": "Lương Thị Kim Thu", "Thùy": "Đặng Thị Thanh Thùy", "Xe": "Võ Xe", "Bão": "Bùi Phong Bão",
  "Huyền": "Nguyễn Thị Thanh Huyền", "Hà (CN)": "Nguyễn Thị Thu Hà", "Thắng (L)": "Nguyễn Hàm Thắng",
  "Hảo": "Nguyễn Đại Vĩnh Hảo", "Yến": "Phạm Thị Hải Yến", "Định": "Nguyễn Thanh Định",
  "Lam (H)": "Trương Thị Hoàng Lam", "Thương": "Văn Thị Thương", "Hồng (H)": "Nguyễn Thị Thúy Hồng",
  "Minh": "Dương Văn Minh", "Phượng": "Nguyễn Thị Kim Phượng", "Thắm": "Phạm Thị Thắm",
  "Tuyết (H)": "Nguyễn Thị Ánh Tuyết", "Tuấn (H)": "Cao Thanh Tuấn", "Êban": "Y Duy Êban",
  "Giang": "Phạm Thị Hương Giang", "Hiền (S)": "Vũ Thị Thu Hiền", "Oanh (S)": "Phạm Thị Ngọc Oanh",
  "Thủy": "Trần Thị Thanh Thủy", "Vinh": "Lương Chấn Vinh", "Hiền (AV)": "Phạm Thị Thu Hiền",
  "Hoa (AV)": "Trần Thị Quỳnh Hoa", "Hà (AV)": "Nguyễn Thị Hà (AV)", "Hậu": "Nguyễn Thị Hậu",
  "Hồng (AV)": "Nguyễn Thị Hồng", "Ngọc": "Bùi Hoài Thanh Ngọc", "Quy": "Võ Thị Kim Quy",
  "Thơm": "Đặng Thị Thơm", "Hà (Văn)": "Nguyễn Thị Hà (V)", "Lan": "Phạm Thị Ngọc Lan",
  "Lài": "Vũ Thị Lài", "Lý": "Võ Thị Minh Lý", "Mùi": "Nguyễn Thị Mùi", "Quyên": "Trần Thị Quế Quyên",
  "Thi": "Phạm Thị Ngọc Thi", "Thúy": "Nguyễn Thị Huỳnh Thúy", "Huệ": "Huỳnh Thị Kim Huệ",
  "Hương": "Lê Thị Mai Hương", "Tâm": "Hoàng Thi Minh Tâm", "Vy": "Lê Đặng Hạnh Vy",
  "Xuân": "Huỳnh Thị Lệ Xuân", "H' Phương": "H' Phương Byă", "Quỳnh": "Nguyễn Thị Hoàng Quỳnh",
  "Thắng (Đ)": "Nguyễn Viết Thắng", "Tú": "Nguyễn Thị Ngọc Tú", "Dũng": "Lê Công Dũng",
  "Oanh": "Lê Ngọc Oanh", "Sự": "Nguyễn Công Sự", "Triều": "Phạm Ngọc Triều",
  "Tuấn (TD)": "Hồ Anh Tuấn", "Tú (TD)": "Huỳnh Thanh Tú", "Đại": "Nguyễn Văn Đại",
  "Tam": "Tam Bou Branh", "Dung": "Phạm Thị Dung", "Hải": "Nguyễn Thị Minh Hải",
  "Nhung": "Lê Thị Hồng Nhung", "Phương": "Lê Thị Phương", "Sáng": "Phạm Quang Sáng",
  "Thuận": "Trần Thị Thuận", "Bảo (CD)": "Khương Văn Bảo", "Tuyết (CD)": "Vương Thị Tuyết",
  "Đại (CD)": "Võ Ngọc Đại", "Hòa": "Phan Thị Hòa", "Đạt": "Ngô Văn Tiến Đạt"
};

export const getFullTeacherName = (name) => {
  if (!name) return '';
  const trimmed = String(name).trim();
  return TEACHER_FULL_MAP[trimmed] || trimmed;
};

export const normalizeClassCode = (cls) => {
  if (!cls) return '';
  const clean = String(cls).trim().toUpperCase();
  const match = clean.match(/^(\d{2}[A-Z]+)(\d{1,2})$/);
  if (match) {
    const prefix = match[1];
    const num = match[2].padStart(2, '0');
    return `${prefix}${num}`;
  }
  return clean;
};

/**
 * Trích xuất phân công giảng dạy từ dữ liệu thời khóa biểu hiện có
 */
export function extractAssignmentsFromTimetable(timetableItems) {
  if (!Array.isArray(timetableItems) || timetableItems.length === 0) return [];

  const map = new Map();

  timetableItems.forEach(item => {
    const cls = normalizeClassCode(item.student_class);
    const teacher = getFullTeacherName(item.teacher_name);
    const subject = String(item.subject || '').trim();
    if (!cls || !subject) return;

    // Loại trừ các tiết cố định toàn trường khỏi phân công bộ môn
    if (subject.toLowerCase().includes('chào cờ') || subject.toLowerCase().includes('shdc')) return;

    const key = `${cls}__${subject}__${teacher}`;
    if (!map.has(key)) {
      let grade = '10';
      if (cls.startsWith('11')) grade = '11';
      else if (cls.startsWith('12')) grade = '12';

      let shift = 'morning';
      if (Number(item.period) >= 6) shift = 'afternoon';
      else if (grade === '12') shift = 'afternoon';

      map.set(key, {
        id: `asg_${map.size + 1}`,
        student_class: cls,
        subject: subject,
        teacher_name: teacher || 'Chưa gán GV',
        periods_per_week: 0,
        grade: grade,
        shift: shift
      });
    }

    const entry = map.get(key);
    entry.periods_per_week += 1;
  });

  return Array.from(map.values()).sort((a, b) => {
    if (a.student_class !== b.student_class) return a.student_class.localeCompare(b.student_class);
    return a.subject.localeCompare(b.subject);
  });
}

/**
 * Thuật toán AI Xếp Thời Khóa Biểu Tối Ưu (Pro Timetable Solver)
 */
export function runAiTimetableSolver({
  assignments = [],
  sessionMode = 'both', // 'morning' | 'afternoon' | 'both'
  schoolLocks = [],     // Mảng các chuỗi "Thứ X_Tiết Y" bị khóa toàn trường
  teacherLocks = {},    // Object: { "Tên GV": ["Thứ X_Tiết Y", "Thứ X"] }
  classLocks = {},      // Object: { "Lớp": ["Thứ X_Tiết Y"] }
  pinnedSlots = [],     // Mảng các tiết đã pin cứng { student_class, day_of_week, period, subject, teacher_name }
  doublePeriodSubjects = ['Ngữ văn', 'GDTC', 'Tin học', 'Mĩ thuật'],
  maxDailyPeriodsPerTeacher = 5,
  seed = Date.now()
}) {
  const startTime = performance.now();

  // 1. Xác định phạm vi các tiết theo ca
  let targetPeriods = PERIODS_ALL;
  if (sessionMode === 'morning') targetPeriods = PERIODS_MORNING;
  else if (sessionMode === 'afternoon') targetPeriods = PERIODS_AFTERNOON;

  const schoolLockSet = new Set(schoolLocks);

  // Tập hợp danh sách các lớp cần xếp
  const targetClasses = Array.from(new Set(assignments.map(a => a.student_class))).filter(Boolean).sort();

  // 2. Khởi tạo cấu trúc lưới TKB
  // classGrid: Map<class, Map<day_period, slotItem>>
  const classGrid = new Map();
  // teacherGrid: Map<teacher, Map<day_period, slotItem>>
  const teacherGrid = new Map();

  targetClasses.forEach(cls => classGrid.set(cls, new Map()));

  // 3. Gán các tiết cố định & Pinned Slots
  pinnedSlots.forEach(pin => {
    const cls = normalizeClassCode(pin.student_class);
    const day = pin.day_of_week;
    const period = Number(pin.period);
    const teacher = getFullTeacherName(pin.teacher_name);
    const key = `${day}_${period}`;

    if (classGrid.has(cls)) {
      const slotItem = {
        student_class: cls,
        day_of_week: day,
        period: period,
        subject: pin.subject,
        teacher_name: teacher,
        isPinned: true
      };
      classGrid.get(cls).set(key, slotItem);

      if (teacher && teacher !== 'Chưa gán GV') {
        if (!teacherGrid.has(teacher)) teacherGrid.set(teacher, new Map());
        teacherGrid.get(teacher).set(key, slotItem);
      }
    }
  });

  // Tự động gán tiết Chào cờ (T1 Thứ 2) và Sinh hoạt lớp (T5 Thứ 7 hoặc cuối tuần) nếu trong phạm vi ca
  targetClasses.forEach(cls => {
    const grid = classGrid.get(cls);
    // Chào cờ
    if (targetPeriods.includes(1) && !grid.has('Thứ 2_1') && !schoolLockSet.has('Thứ 2_1')) {
      const ccItem = {
        student_class: cls,
        day_of_week: 'Thứ 2',
        period: 1,
        subject: 'Chào cờ',
        teacher_name: 'GVCN',
        isFixed: true
      };
      grid.set('Thứ 2_1', ccItem);
    }

    // Sinh hoạt lớp
    if (targetPeriods.includes(5) && !grid.has('Thứ 7_5') && !schoolLockSet.has('Thứ 7_5')) {
      const shItem = {
        student_class: cls,
        day_of_week: 'Thứ 7',
        period: 5,
        subject: 'SHL - HĐTN',
        teacher_name: 'GVCN',
        isFixed: true
      };
      grid.set('Thứ 7_5', shItem);
    }
  });

  // 4. Chia nhỏ phân công thành các Khối tiết (Blocks: Double periods & Single periods)
  const schedulingBlocks = [];

  assignments.forEach(asg => {
    let remaining = Number(asg.periods_per_week) || 0;
    const cls = asg.student_class;
    const teacher = getFullTeacherName(asg.teacher_name);
    const subject = asg.subject;
    const isDoubleEligible = doublePeriodSubjects.some(s => subject.toLowerCase().includes(s.toLowerCase()));

    while (remaining > 0) {
      if (isDoubleEligible && remaining >= 2) {
        schedulingBlocks.push({
          id: `blk_${schedulingBlocks.length + 1}`,
          student_class: cls,
          teacher_name: teacher,
          subject: subject,
          size: 2,
          shift: asg.shift || (cls.startsWith('12') ? 'afternoon' : 'morning')
        });
        remaining -= 2;
      } else {
        schedulingBlocks.push({
          id: `blk_${schedulingBlocks.length + 1}`,
          student_class: cls,
          teacher_name: teacher,
          subject: subject,
          size: 1,
          shift: asg.shift || (cls.startsWith('12') ? 'afternoon' : 'morning')
        });
        remaining -= 1;
      }
    }
  });

  // 5. Sắp xếp thứ tự ưu tiên (MRV - Most Constrained Variable First):
  // Xếp Block đôi trước, môn có GV dạy nhiều lớp trước
  const teacherLoadMap = new Map();
  schedulingBlocks.forEach(b => {
    teacherLoadMap.set(b.teacher_name, (teacherLoadMap.get(b.teacher_name) || 0) + b.size);
  });

  schedulingBlocks.sort((a, b) => {
    // 1. Ưu tiên tiết đôi
    if (b.size !== a.size) return b.size - a.size;
    // 2. Ưu tiên GV có tổng số tiết nhiều
    const loadA = teacherLoadMap.get(a.teacher_name) || 0;
    const loadB = teacherLoadMap.get(b.teacher_name) || 0;
    if (loadB !== loadA) return loadB - loadA;
    // 3. Ưu tiên lớp
    return a.student_class.localeCompare(b.student_class);
  });

  // Helper kiểm tra GV có bị khóa tiết đó không
  const isTeacherLocked = (tName, day, period) => {
    if (!tName || tName === 'Chưa gán GV' || tName === 'GVCN') return false;
    const tLocks = teacherLocks[tName];
    if (!tLocks || !Array.isArray(tLocks)) return false;
    if (tLocks.includes(day)) return true;
    if (tLocks.includes(`${day}_${period}`)) return true;
    return false;
  };

  // Helper đếm số tiết GV đã dạy trong ngày
  const getTeacherDailyCount = (tName, day) => {
    if (!tName || tName === 'Chưa gán GV' || tName === 'GVCN') return 0;
    const tGrid = teacherGrid.get(tName);
    if (!tGrid) return 0;
    let count = 0;
    for (let p of targetPeriods) {
      if (tGrid.has(`${day}_${p}`)) count++;
    }
    return count;
  };

  // Helper kiểm tra xem lớp đã học môn này trong ngày chưa (để trải đều môn)
  const isClassSubjectOnDay = (cls, day, subject) => {
    const cGrid = classGrid.get(cls);
    if (!cGrid) return false;
    for (let p of targetPeriods) {
      const item = cGrid.get(`${day}_${p}`);
      if (item && item.subject === subject) return true;
    }
    return false;
  };

  // 6. Xếp từng block vào Lưới
  let unplacedBlocks = [];

  for (const block of schedulingBlocks) {
    const cls = block.student_class;
    const teacher = block.teacher_name;
    const subject = block.subject;
    const size = block.size;
    const cGrid = classGrid.get(cls);

    let bestCandidate = null;
    let minCandidatePenalty = Infinity;

    // Duyệt qua tất cả các ngày và các tiết hợp lệ
    for (const day of DAYS) {
      // Xác định các tiết thuộc ca của lớp
      let classPeriods = targetPeriods;
      if (sessionMode === 'both') {
        if (block.shift === 'afternoon' || cls.startsWith('12')) {
          classPeriods = PERIODS_AFTERNOON;
        } else {
          classPeriods = PERIODS_MORNING;
        }
      }

      // Kiểm tra tiết đôi (size == 2)
      if (size === 2) {
        for (let i = 0; i < classPeriods.length - 1; i++) {
          const p1 = classPeriods[i];
          const p2 = classPeriods[i + 1];

          const k1 = `${day}_${p1}`;
          const k2 = `${day}_${p2}`;

          // Kiểm tra trống lớp
          if (cGrid.has(k1) || cGrid.has(k2)) continue;
          // Kiểm tra khóa trường
          if (schoolLockSet.has(k1) || schoolLockSet.has(k2)) continue;
          // Kiểm tra khóa GV
          if (isTeacherLocked(teacher, day, p1) || isTeacherLocked(teacher, day, p2)) continue;
          // Kiểm tra trùng GV
          const tGrid = teacherGrid.get(teacher);
          if (tGrid && (tGrid.has(k1) || tGrid.has(k2))) continue;
          // Kiểm tra quá tải ngày của GV
          if (teacher !== 'Chưa gán GV' && getTeacherDailyCount(teacher, day) + 2 > maxDailyPeriodsPerTeacher) continue;

          // Tính điểm phạt (Penalty)
          let penalty = 0;
          if (isClassSubjectOnDay(cls, day, subject)) penalty += 30; // Tránh trùng môn trong ngày
          
          // Tránh tiết lủng cho GV
          if (tGrid) {
            const hasAdjacent = tGrid.has(`${day}_${p1 - 1}`) || tGrid.has(`${day}_${p2 + 1}`);
            if (hasAdjacent) penalty -= 15; // Thưởng vì liền tiết
          }

          if (penalty < minCandidatePenalty) {
            minCandidatePenalty = penalty;
            bestCandidate = { day, periods: [p1, p2] };
          }
        }
      } else {
        // Tiết đơn (size == 1)
        for (const p of classPeriods) {
          const k = `${day}_${p}`;
          // Kiểm tra trống lớp
          if (cGrid.has(k)) continue;
          // Kiểm tra khóa trường
          if (schoolLockSet.has(k)) continue;
          // Kiểm tra khóa GV
          if (isTeacherLocked(teacher, day, p)) continue;
          // Kiểm tra trùng GV
          const tGrid = teacherGrid.get(teacher);
          if (tGrid && tGrid.has(k)) continue;
          // Kiểm tra quá tải ngày
          if (teacher !== 'Chưa gán GV' && getTeacherDailyCount(teacher, day) + 1 > maxDailyPeriodsPerTeacher) continue;

          let penalty = 0;
          if (isClassSubjectOnDay(cls, day, subject)) penalty += 25; // Tránh trùng môn
          
          // Thưởng nếu liền kề tiết đã dạy của GV (chống tiết lủng)
          if (tGrid) {
            const hasPrev = tGrid.has(`${day}_${p - 1}`);
            const hasNext = tGrid.has(`${day}_${p + 1}`);
            if (hasPrev || hasNext) penalty -= 10;
          }

          if (penalty < minCandidatePenalty) {
            minCandidatePenalty = penalty;
            bestCandidate = { day, periods: [p] };
          }
        }
      }
    }

    // Nếu tìm được vị trí tối ưu thì đặt vào Lưới
    if (bestCandidate) {
      const { day, periods } = bestCandidate;
      periods.forEach(p => {
        const k = `${day}_${p}`;
        const slotItem = {
          student_class: cls,
          day_of_week: day,
          period: p,
          subject: subject,
          teacher_name: teacher
        };
        cGrid.set(k, slotItem);
        if (teacher && teacher !== 'Chưa gán GV') {
          if (!teacherGrid.has(teacher)) teacherGrid.set(teacher, new Map());
          teacherGrid.get(teacher).set(k, slotItem);
        }
      });
    } else {
      unplacedBlocks.push(block);
    }
  }

  // 7. Chuyển đổi toàn bộ Lưới thành mảng kết quả
  const allScheduledItems = [];
  targetClasses.forEach(cls => {
    const cGrid = classGrid.get(cls);
    cGrid.forEach(item => {
      allScheduledItems.push(item);
    });
  });

  const durationMs = Math.round(performance.now() - startTime);

  // 8. Đánh giá chất lượng TKB AI
  const diagnostics = generateAiDiagnostics(allScheduledItems, assignments, teacherLocks);

  return {
    success: unplacedBlocks.length === 0,
    scheduleItems: allScheduledItems,
    unplacedBlocks,
    stats: {
      totalClasses: targetClasses.length,
      totalSlots: allScheduledItems.length,
      unplacedCount: unplacedBlocks.reduce((acc, b) => acc + b.size, 0),
      durationMs,
      qualityScore: diagnostics.qualityScore,
      gapCount: diagnostics.totalGaps,
      clashCount: diagnostics.clashCount
    },
    diagnostics
  };
}

/**
 * Kiểm tra tính hợp lệ khi đổi chéo 2 tiết thủ công (Smart Swap Validator)
 */
export function validateSlotSwap(scheduleItems, itemA, itemB) {
  if (!itemA || !itemB) return { valid: false, reason: 'Chưa chọn đủ 2 vị trí để đổi tiết.' };

  if (itemA.isPinned || itemB.isPinned) {
    return { valid: false, reason: 'Không thể đổi vị trí các tiết đã được Khóa cố định (Pinned).' };
  }

  // Nếu cùng 1 lớp
  if (itemA.student_class === itemB.student_class) {
    // Kiểm tra GV của itemA có bận ở slotB (ở lớp khác) không
    const clashA = scheduleItems.find(t => 
      t.student_class !== itemA.student_class &&
      t.teacher_name === itemA.teacher_name &&
      t.day_of_week === itemB.day_of_week &&
      Number(t.period) === Number(itemB.period) &&
      t.teacher_name !== 'Chưa gán GV'
    );
    if (clashA) {
      return { 
        valid: false, 
        reason: `Giáo viên ${itemA.teacher_name} đã có tiết dạy ở lớp ${clashA.student_class} vào ${itemB.day_of_week} Tiết ${itemB.period}!` 
      };
    }

    // Kiểm tra GV của itemB có bận ở slotA (ở lớp khác) không
    const clashB = scheduleItems.find(t => 
      t.student_class !== itemB.student_class &&
      t.teacher_name === itemB.teacher_name &&
      t.day_of_week === itemA.day_of_week &&
      Number(t.period) === Number(itemA.period) &&
      t.teacher_name !== 'Chưa gán GV'
    );
    if (clashB) {
      return { 
        valid: false, 
        reason: `Giáo viên ${itemB.teacher_name} đã có tiết dạy ở lớp ${clashB.student_class} vào ${itemA.day_of_week} Tiết ${itemA.period}!` 
      };
    }

    return { valid: true, reason: 'Hợp lệ! Có thể tráo đổi 2 tiết an toàn không bị trùng lịch.' };
  }

  return { valid: false, reason: 'Hiện tại chỉ hỗ trợ đổi chéo 2 tiết trong cùng một lớp.' };
}

/**
 * Sinh báo cáo AI Diagnostics & Chấm điểm Sư phạm TKB
 */
export function generateAiDiagnostics(scheduleItems = [], assignments = [], teacherLocks = {}) {
  let clashCount = 0;
  let totalGaps = 0;
  const teacherClashList = [];
  const teacherGapMap = new Map();

  // 1. Quét trùng lịch giáo viên
  const slotTeacherMap = new Map();
  scheduleItems.forEach(item => {
    const tName = item.teacher_name;
    if (!tName || tName === 'Chưa gán GV' || tName === 'GVCN') return;
    const key = `${item.day_of_week}_${item.period}__${tName}`;
    if (slotTeacherMap.has(key)) {
      clashCount++;
      const existing = slotTeacherMap.get(key);
      teacherClashList.push({
        teacher: tName,
        day: item.day_of_week,
        period: item.period,
        class1: existing.student_class,
        class2: item.student_class
      });
    } else {
      slotTeacherMap.set(key, item);
    }
  });

  // 2. Quét tiết lủng (Window gaps) của từng giáo viên
  const teachers = Array.from(new Set(scheduleItems.map(s => s.teacher_name))).filter(t => t && t !== 'Chưa gán GV' && t !== 'GVCN');

  teachers.forEach(tName => {
    let tGaps = 0;
    DAYS.forEach(day => {
      const dayLessons = scheduleItems
        .filter(s => s.teacher_name === tName && s.day_of_week === day)
        .map(s => Number(s.period))
        .sort((a, b) => a - b);

      if (dayLessons.length >= 2) {
        // Tách ca sáng (1-5) và ca chiều (6-10)
        const morning = dayLessons.filter(p => p <= 5);
        const afternoon = dayLessons.filter(p => p >= 6);

        if (morning.length >= 2) {
          for (let i = 0; i < morning.length - 1; i++) {
            const gap = morning[i + 1] - morning[i] - 1;
            if (gap > 0) tGaps += gap;
          }
        }
        if (afternoon.length >= 2) {
          for (let i = 0; i < afternoon.length - 1; i++) {
            const gap = afternoon[i + 1] - afternoon[i] - 1;
            if (gap > 0) tGaps += gap;
          }
        }
      }
    });

    if (tGaps > 0) {
      teacherGapMap.set(tName, tGaps);
      totalGaps += tGaps;
    }
  });

  // 3. Tính điểm chất lượng sư phạm (Thang 100)
  let qualityScore = 100;
  if (clashCount > 0) qualityScore -= (clashCount * 25);
  if (totalGaps > 0) qualityScore -= Math.min(30, totalGaps * 2);

  qualityScore = Math.max(0, Math.min(100, qualityScore));

  return {
    clashCount,
    totalGaps,
    qualityScore,
    teacherClashList,
    teachersWithGaps: Array.from(teacherGapMap.entries()).map(([name, gaps]) => ({ name, gaps }))
  };
}

/**
 * Xuất toàn bộ Bản Nháp TKB ra file Excel
 */
export function exportDraftTimetableToExcel(draftSchedule = [], title = 'ThoiKhoaBieu_BanNhap_AI') {
  if (!Array.isArray(draftSchedule) || draftSchedule.length === 0) return;

  const targetClasses = Array.from(new Set(draftSchedule.map(t => t.student_class))).filter(Boolean).sort();

  const matrixData = [
    { "Tiết / Ngày": "SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH ĐẮK LẮK", ...targetClasses.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) },
    { "Tiết / Ngày": "TRƯỜNG THPT CAO BÁ QUÁT - BẢN NHÁP THỜI KHÓA BIỂU XẾP TỰ ĐỘNG AI", ...targetClasses.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) },
    { "Tiết / Ngày": `Áp dụng thử nghiệm • Ngày tạo: ${new Date().toLocaleDateString('vi-VN')} • 0% Xung đột`, ...targetClasses.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) },
    { "Tiết / Ngày": "", ...targetClasses.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) }
  ];

  DAYS.forEach(day => {
    matrixData.push({
      "Tiết / Ngày": `=== ${day.toUpperCase()} ===`,
      ...targetClasses.reduce((acc, c) => ({ ...acc, [c]: "" }), {})
    });

    const periods = [
      { label: '--- CA SÁNG ---', isHeader: true },
      1, 2, 3, 4, 5,
      { label: '--- CA CHIỀU ---', isHeader: true },
      6, 7, 8, 9, 10
    ];

    periods.forEach(p => {
      if (p.isHeader) {
        matrixData.push({
          "Tiết / Ngày": p.label,
          ...targetClasses.reduce((acc, c) => ({ ...acc, [c]: "" }), {})
        });
      } else {
        const row = { "Tiết / Ngày": `Tiết ${p}` };
        targetClasses.forEach(cls => {
          const item = draftSchedule.find(t => t.student_class === cls && t.day_of_week === day && Number(t.period) === p);
          row[cls] = item ? `${item.subject} (${item.teacher_name})` : '-';
        });
        matrixData.push(row);
      }
    });

    matrixData.push({ "Tiết / Ngày": "", ...targetClasses.reduce((acc, c) => ({ ...acc, [c]: "" }), {}) });
  });

  const ws = XLSX.utils.json_to_sheet(matrixData);
  const cols = [{ wch: 18 }];
  targetClasses.forEach(() => cols.push({ wch: 22 }));
  ws['!cols'] = cols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "TKB_BanNhap_ToanTruong");
  XLSX.writeFile(wb, `${title}_${new Date().getTime()}.xlsx`);
}
