import * as XLSX from 'xlsx';
import masterTimetableData from '../data/master_timetable.json';

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

export const getFullTeacherName = (name, subject = '') => {
  if (!name) return '';
  const trimmed = String(name).trim();
  let full = TEACHER_FULL_MAP[trimmed] || trimmed;
  if (full === 'Nguyễn Thị Hà' && subject) {
    const s = String(subject).toLowerCase();
    if (s.includes('anh') || s.includes('nn') || s.includes('tiếng anh')) {
      return 'Nguyễn Thị Hà (AV)';
    }
    if (s.includes('văn') || s.includes('ngữ văn') || s.includes('địa phương') || s.includes('gdđp')) {
      return 'Nguyễn Thị Hà (V)';
    }
  }
  return full;
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
    const subject = String(item.subject || '').trim();
    const teacher = getFullTeacherName(item.teacher_name, subject);
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
 * Lấy 442 phân công giảng dạy chuẩn từ master_timetable.json
 */
export function getDefaultTeachingAssignments() {
  return extractAssignmentsFromTimetable(masterTimetableData);
}

/**
 * Thuật toán AI Xếp Thời Khóa Biểu Tối Ưu Đa Tầng (Multi-Pass Pro Timetable Solver)
 */
export function runAiTimetableSolver({
  assignments = [],
  sessionMode = 'both', // 'morning' | 'afternoon' | 'both'
  schoolLocks = [],     // Mảng các chuỗi "Thứ X_Tiết Y" bị khóa toàn trường
  teacherLocks = {},    // Object: { "Tên GV": ["Thứ X_Tiết Y", "Thứ X"] }
  pinnedSlots = [],     // Mảng các tiết đã pin cứng { student_class, day_of_week, period, subject, teacher_name }
  doublePeriodSubjects = ['Ngữ văn', 'GDTC', 'Tin học', 'Mĩ thuật'],
  maxDailyPeriodsPerTeacher = 5,
  maxAfternoonDaysPerTeacher = 5,
  seed = Date.now()
}) {
  const startTime = performance.now();

  let activeAssignments = assignments;
  if (!activeAssignments || activeAssignments.length === 0) {
    activeAssignments = getDefaultTeachingAssignments();
  }

  // 1. Xác định phạm vi các tiết theo ca
  let targetPeriods = PERIODS_ALL;
  if (sessionMode === 'morning') targetPeriods = PERIODS_MORNING;
  else if (sessionMode === 'afternoon') targetPeriods = PERIODS_AFTERNOON;

  const schoolLockSet = new Set(schoolLocks || []);

  // Lọc assignments theo sessionMode nếu chỉ xếp 1 ca
  let filteredAssignments = activeAssignments;
  if (sessionMode === 'morning') {
    filteredAssignments = activeAssignments.filter(a => a.shift === 'morning' || !a.student_class.startsWith('12'));
  } else if (sessionMode === 'afternoon') {
    filteredAssignments = activeAssignments.filter(a => a.shift === 'afternoon' || a.student_class.startsWith('12'));
  }

  // Tập hợp danh sách các lớp cần xếp
  const targetClasses = Array.from(new Set(filteredAssignments.map(a => a.student_class))).filter(Boolean).sort();

  // 2. Khởi tạo cấu trúc lưới TKB
  const classGrid = new Map();
  const teacherGrid = new Map();

  targetClasses.forEach(cls => classGrid.set(cls, new Map()));

  // 3. Gán các tiết cố định & Pinned Slots
  (pinnedSlots || []).forEach(pin => {
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

      if (teacher && teacher !== 'Chưa gán GV' && teacher !== 'GVCN') {
        if (!teacherGrid.has(teacher)) teacherGrid.set(teacher, new Map());
        teacherGrid.get(teacher).set(key, slotItem);
      }
    }
  });

  // Tự động gán tiết Chào cờ (T1 Thứ 2) và Sinh hoạt lớp (T5 Thứ 7) nếu trong ca sáng
  targetClasses.forEach(cls => {
    const grid = classGrid.get(cls);
    const isMorningClass = !cls.startsWith('12');

    if (isMorningClass || sessionMode === 'morning' || sessionMode === 'both') {
      if (targetPeriods.includes(1) && !grid.has('Thứ 2_1') && !schoolLockSet.has('Thứ 2_1')) {
        grid.set('Thứ 2_1', {
          student_class: cls,
          day_of_week: 'Thứ 2',
          period: 1,
          subject: 'Chào cờ',
          teacher_name: 'GVCN',
          isFixed: true
        });
      }

      if (targetPeriods.includes(5) && !grid.has('Thứ 7_5') && !schoolLockSet.has('Thứ 7_5')) {
        grid.set('Thứ 7_5', {
          student_class: cls,
          day_of_week: 'Thứ 7',
          period: 5,
          subject: 'SHL - HĐTN',
          teacher_name: 'GVCN',
          isFixed: true
        });
      }
    } else {
      if (targetPeriods.includes(6) && !grid.has('Thứ 2_6') && !schoolLockSet.has('Thứ 2_6')) {
        grid.set('Thứ 2_6', {
          student_class: cls,
          day_of_week: 'Thứ 2',
          period: 6,
          subject: 'Chào cờ',
          teacher_name: 'GVCN',
          isFixed: true
        });
      }

      if (targetPeriods.includes(10) && !grid.has('Thứ 7_10') && !schoolLockSet.has('Thứ 7_10')) {
        grid.set('Thứ 7_10', {
          student_class: cls,
          day_of_week: 'Thứ 7',
          period: 10,
          subject: 'SHL - HĐTN',
          teacher_name: 'GVCN',
          isFixed: true
        });
      }
    }
  });

  // 4. Chia nhỏ phân công thành các Khối tiết (Blocks)
  const schedulingBlocks = [];

  filteredAssignments.forEach(asg => {
    let remaining = Number(asg.periods_per_week) || 0;
    const cls = asg.student_class;
    const teacher = getFullTeacherName(asg.teacher_name);
    const subject = asg.subject;
    const isDoubleEligible = (doublePeriodSubjects || []).some(s => subject.toLowerCase().includes(s.toLowerCase()));
    const shift = asg.shift || (cls.startsWith('12') ? 'afternoon' : 'morning');

    while (remaining > 0) {
      if (isDoubleEligible && remaining >= 2) {
        schedulingBlocks.push({
          id: `blk_${schedulingBlocks.length + 1}`,
          student_class: cls,
          teacher_name: teacher,
          subject: subject,
          size: 2,
          shift: shift
        });
        remaining -= 2;
      } else {
        schedulingBlocks.push({
          id: `blk_${schedulingBlocks.length + 1}`,
          student_class: cls,
          teacher_name: teacher,
          subject: subject,
          size: 1,
          shift: shift
        });
        remaining -= 1;
      }
    }
  });

  // 5. Tính toán tải GV để xếp theo MRV
  const teacherLoadMap = new Map();
  schedulingBlocks.forEach(b => {
    teacherLoadMap.set(b.teacher_name, (teacherLoadMap.get(b.teacher_name) || 0) + b.size);
  });

  schedulingBlocks.sort((a, b) => {
    if (b.size !== a.size) return b.size - a.size;
    const loadA = teacherLoadMap.get(a.teacher_name) || 0;
    const loadB = teacherLoadMap.get(b.teacher_name) || 0;
    if (loadB !== loadA) return loadB - loadA;
    return a.student_class.localeCompare(b.student_class);
  });

  // Helper kiểm tra GV khóa tiết
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
    for (let p of PERIODS_ALL) {
      if (tGrid.has(`${day}_${p}`)) count++;
    }
    return count;
  };

  // Helper đếm số buổi chiều GV đã dạy
  const getTeacherAfternoonDaysCount = (tName) => {
    if (!tName || tName === 'Chưa gán GV' || tName === 'GVCN') return 0;
    const tGrid = teacherGrid.get(tName);
    if (!tGrid) return 0;
    const daysSet = new Set();
    for (const key of tGrid.keys()) {
      const [d, pStr] = key.split('_');
      if (Number(pStr) >= 6) daysSet.add(d);
    }
    return daysSet.size;
  };

  const isTeacherAfternoonDay = (tName, day) => {
    if (!tName || tName === 'Chưa gán GV' || tName === 'GVCN') return false;
    const tGrid = teacherGrid.get(tName);
    if (!tGrid) return false;
    for (let p of PERIODS_AFTERNOON) {
      if (tGrid.has(`${day}_${p}`)) return true;
    }
    return false;
  };

  const isClassSubjectOnDay = (cls, day, subject) => {
    const cGrid = classGrid.get(cls);
    if (!cGrid) return false;
    for (let p of PERIODS_ALL) {
      const item = cGrid.get(`${day}_${p}`);
      if (item && item.subject === subject) return true;
    }
    return false;
  };

  const getClassPeriods = (cls, shift) => {
    if (sessionMode === 'morning') return PERIODS_MORNING;
    if (sessionMode === 'afternoon') return PERIODS_AFTERNOON;
    if (shift === 'afternoon' || cls.startsWith('12')) return PERIODS_AFTERNOON;
    return PERIODS_MORNING;
  };

  // 6. THỰC THI THUẬT TOÁN ĐA TẦNG (MULTI-PASS CSP)
  const placeBlock = (block, allowRelaxed = false) => {
    const cls = block.student_class;
    const teacher = block.teacher_name;
    const subject = block.subject;
    const size = block.size;
    const cGrid = classGrid.get(cls);
    if (!cGrid) return false;

    const classPeriods = getClassPeriods(cls, block.shift);
    let bestCandidate = null;
    let minPenalty = Infinity;

    for (const day of DAYS) {
      if (size === 2) {
        for (let i = 0; i < classPeriods.length - 1; i++) {
          const p1 = classPeriods[i];
          const p2 = classPeriods[i + 1];
          const k1 = `${day}_${p1}`;
          const k2 = `${day}_${p2}`;

          if (cGrid.has(k1) || cGrid.has(k2)) continue;
          if (schoolLockSet.has(k1) || schoolLockSet.has(k2)) continue;
          if (isTeacherLocked(teacher, day, p1) || isTeacherLocked(teacher, day, p2)) continue;

          const tGrid = teacherGrid.get(teacher);
          if (tGrid && (tGrid.has(k1) || tGrid.has(k2))) continue;

          const maxAllowedPeriods = allowRelaxed ? (maxDailyPeriodsPerTeacher + 1) : maxDailyPeriodsPerTeacher;
          if (teacher !== 'Chưa gán GV' && getTeacherDailyCount(teacher, day) + 2 > maxAllowedPeriods) continue;

          if (p1 >= 6 && teacher !== 'Chưa gán GV' && !isTeacherAfternoonDay(teacher, day)) {
            const maxAfternoons = allowRelaxed ? (maxAfternoonDaysPerTeacher + 1) : maxAfternoonDaysPerTeacher;
            if (getTeacherAfternoonDaysCount(teacher) >= maxAfternoons) continue;
          }

          let penalty = 0;
          if (isClassSubjectOnDay(cls, day, subject)) penalty += 30;
          if (tGrid) {
            const hasAdjacent = tGrid.has(`${day}_${p1 - 1}`) || tGrid.has(`${day}_${p2 + 1}`);
            if (hasAdjacent) penalty -= 20;
          }

          if (penalty < minPenalty) {
            minPenalty = penalty;
            bestCandidate = { day, periods: [p1, p2] };
          }
        }
      } else {
        // Size 1
        for (const p of classPeriods) {
          const k = `${day}_${p}`;
          if (cGrid.has(k)) continue;
          if (schoolLockSet.has(k)) continue;
          if (isTeacherLocked(teacher, day, p)) continue;

          const tGrid = teacherGrid.get(teacher);
          if (tGrid && tGrid.has(k)) continue;

          const maxAllowedPeriods = allowRelaxed ? (maxDailyPeriodsPerTeacher + 1) : maxDailyPeriodsPerTeacher;
          if (teacher !== 'Chưa gán GV' && getTeacherDailyCount(teacher, day) + 1 > maxAllowedPeriods) continue;

          if (p >= 6 && teacher !== 'Chưa gán GV' && !isTeacherAfternoonDay(teacher, day)) {
            const maxAfternoons = allowRelaxed ? (maxAfternoonDaysPerTeacher + 1) : maxAfternoonDaysPerTeacher;
            if (getTeacherAfternoonDaysCount(teacher) >= maxAfternoons) continue;
          }

          let penalty = 0;
          if (isClassSubjectOnDay(cls, day, subject)) penalty += 25;
          if (tGrid) {
            const hasPrev = tGrid.has(`${day}_${p - 1}`);
            const hasNext = tGrid.has(`${day}_${p + 1}`);
            if (hasPrev || hasNext) penalty -= 15;
          }

          if (penalty < minPenalty) {
            minPenalty = penalty;
            bestCandidate = { day, periods: [p] };
          }
        }
      }
    }

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
        if (teacher && teacher !== 'Chưa gán GV' && teacher !== 'GVCN') {
          if (!teacherGrid.has(teacher)) teacherGrid.set(teacher, new Map());
          teacherGrid.get(teacher).set(k, slotItem);
        }
      });
      return true;
    }

    return false;
  };

  // PASS 1 & 2: Xếp chặt chẽ
  const unplacedBlocks = [];
  for (const block of schedulingBlocks) {
    const success = placeBlock(block, false);
    if (!success) {
      unplacedBlocks.push(block);
    }
  }

  // PASS 3: Tách khối đôi không xếp được thành khối đơn
  const stillUnplaced = [];
  while (unplacedBlocks.length > 0) {
    const block = unplacedBlocks.shift();
    if (block.size === 2) {
      const b1 = { ...block, size: 1, id: `${block.id}_part1` };
      const b2 = { ...block, size: 1, id: `${block.id}_part2` };
      const s1 = placeBlock(b1, false) || placeBlock(b1, true);
      if (!s1) stillUnplaced.push(b1);
      const s2 = placeBlock(b2, false) || placeBlock(b2, true);
      if (!s2) stillUnplaced.push(b2);
    } else {
      const s = placeBlock(block, true);
      if (!s) stillUnplaced.push(block);
    }
  }

  // PASS 4: Fallback nếu sessionMode === 'both'
  if (stillUnplaced.length > 0 && sessionMode === 'both') {
    const finalUnplaced = [];
    stillUnplaced.forEach(block => {
      const altShift = block.shift === 'morning' ? 'afternoon' : 'morning';
      const altBlock = { ...block, shift: altShift };
      const placed = placeBlock(altBlock, true);
      if (!placed) finalUnplaced.push(block);
    });
    stillUnplaced.length = 0;
    stillUnplaced.push(...finalUnplaced);
  }

  // 7. SIMULATED ANNEALING & LOCAL SEARCH
  targetClasses.forEach(cls => {
    const cGrid = classGrid.get(cls);
    const classSlots = Array.from(cGrid.entries()).filter(([_, item]) => !item.isPinned && !item.isFixed);

    for (let round = 0; round < 60; round++) {
      if (classSlots.length < 2) break;
      const idxA = Math.floor(Math.random() * classSlots.length);
      const idxB = Math.floor(Math.random() * classSlots.length);
      if (idxA === idxB) continue;

      const [k1, itemA] = classSlots[idxA];
      const [k2, itemB] = classSlots[idxB];

      const [d1, p1Str] = k1.split('_');
      const [d2, p2Str] = k2.split('_');
      const p1 = Number(p1Str);
      const p2 = Number(p2Str);

      const sameShift = (p1 <= 5 && p2 <= 5) || (p1 >= 6 && p2 >= 6);
      if (!sameShift) continue;

      const tA = itemA.teacher_name;
      const tB = itemB.teacher_name;
      const tGridA = teacherGrid.get(tA);
      const tGridB = teacherGrid.get(tB);

      if (tA && tA !== 'Chưa gán GV' && tA !== 'GVCN' && tGridA && tGridA.has(k2) && tGridA.get(k2).student_class !== cls) continue;
      if (tB && tB !== 'Chưa gán GV' && tB !== 'GVCN' && tGridB && tGridB.has(k1) && tGridB.get(k1).student_class !== cls) continue;

      if (isTeacherLocked(tA, d2, p2) || isTeacherLocked(tB, d1, p1)) continue;

      cGrid.set(k1, { ...itemB, day_of_week: d1, period: p1 });
      cGrid.set(k2, { ...itemA, day_of_week: d2, period: p2 });

      if (tGridA) {
        tGridA.delete(k1);
        tGridA.set(k2, { ...itemA, day_of_week: d2, period: p2 });
      }
      if (tGridB) {
        tGridB.delete(k2);
        tGridB.set(k1, { ...itemB, day_of_week: d1, period: p1 });
      }
    }
  });

  // 8. Chuyển đổi toàn bộ Lưới thành mảng kết quả
  const allScheduledItems = [];
  targetClasses.forEach(cls => {
    const cGrid = classGrid.get(cls);
    cGrid.forEach(item => {
      allScheduledItems.push(item);
    });
  });

  const durationMs = Math.round(performance.now() - startTime);
  const diagnostics = generateAiDiagnostics(allScheduledItems, filteredAssignments, teacherLocks);

  return {
    success: stillUnplaced.length === 0,
    schedule: allScheduledItems,
    scheduleItems: allScheduledItems,
    qualityScore: diagnostics.qualityScore,
    clashCount: diagnostics.clashCount,
    totalGaps: diagnostics.totalGaps,
    teachersWithGaps: diagnostics.teachersWithGaps,
    teacherClashList: diagnostics.teacherClashList,
    unplacedCount: stillUnplaced.length,
    unplacedBlocks: stillUnplaced,
    stats: {
      totalClasses: targetClasses.length,
      totalSlots: allScheduledItems.length,
      totalRequired: schedulingBlocks.reduce((acc, b) => acc + b.size, 0),
      totalPlaced: allScheduledItems.length,
      unplacedCount: stillUnplaced.length,
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
    let tName = item.teacher_name;
    if (!tName || tName === 'Chưa gán GV' || tName === 'GVCN' || tName.includes('GVCN') || tName.includes('BGH')) return;
    if (tName === 'Nguyễn Thị Hà' && item.subject) {
      tName = getFullTeacherName(tName, item.subject);
    }
    const key = `${item.day_of_week}_${item.period}__${tName}`;
    if (slotTeacherMap.has(key)) {
      clashCount++;
      const existing = slotTeacherMap.get(key);
      teacherClashList.push({
        teacher: tName,
        day: item.day_of_week,
        period: item.period,
        class1: existing.student_class,
        subject1: existing.subject,
        class2: item.student_class,
        subject2: item.subject
      });
    } else {
      slotTeacherMap.set(key, { ...item, teacher_name: tName });
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

/**
 * Tự động phân chia giáo viên thành 2 nhóm xoay vòng 50/50 cân đối theo bộ môn
 */
export function generateRotationGroups(teachers = [], assignments = []) {
  if (!Array.isArray(teachers) || teachers.length === 0) {
    return { groupA: [], groupB: [] };
  }

  // Phân loại GV theo môn học chính
  const teacherSubjectMap = new Map();
  assignments.forEach(asg => {
    if (asg.teacher_name && asg.teacher_name !== 'Chưa gán GV' && asg.teacher_name !== 'GVCN') {
      if (!teacherSubjectMap.has(asg.teacher_name)) {
        teacherSubjectMap.set(asg.teacher_name, asg.subject);
      }
    }
  });

  const subjectGroups = new Map();
  teachers.forEach(t => {
    if (t === 'Chưa gán GV' || t === 'GVCN') return;
    const sub = teacherSubjectMap.get(t) || 'Khác';
    if (!subjectGroups.has(sub)) subjectGroups.set(sub, []);
    subjectGroups.get(sub).push(t);
  });

  const groupA = [];
  const groupB = [];

  subjectGroups.forEach((tList) => {
    tList.forEach((t, idx) => {
      if (idx % 2 === 0) groupA.push(t);
      else groupB.push(t);
    });
  });

  return { groupA, groupB };
}

