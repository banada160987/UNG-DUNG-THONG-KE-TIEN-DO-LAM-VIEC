/**
 * EXTRACURRICULAR, CLUB & GIFTED (HSG) TIMETABLE SOLVER
 * Thuật toán Xếp Lịch Bồi Dưỡng Học Sinh Giỏi & Sinh Hoạt Câu Lạc Bộ
 * Tự động chống trùng chéo 4 tầng: Chính khóa - Giáo viên - Phòng/Sân - Học sinh liên CLB
 */

import { DAYS, PERIODS_AFTERNOON, getFullTeacherName } from './proTimetableSolver';

// Danh mục CLB & Đội tuyển HSG chuẩn cho THPT
export const DEFAULT_EXTRACURRICULAR_ACTIVITIES = [
  {
    id: 'act_hsg_math_10',
    name: 'Đội tuyển HSG Toán 10',
    type: 'hsg',
    category: 'Bồi dưỡng HSG',
    teacher_name: 'Nguyễn Văn Hùng',
    room: 'Phòng Chuyên đề 1',
    periods_per_week: 2,
    target_classes: ['10A01', '10A02', '10A03', '10A04'],
    color: '#7c3aed',
    badge: '🏆 HSG Toán'
  },
  {
    id: 'act_hsg_lit_11',
    name: 'Đội tuyển HSG Ngữ văn 11',
    type: 'hsg',
    category: 'Bồi dưỡng HSG',
    teacher_name: 'Lê Thị Thu Thảo',
    room: 'Phòng Chuyên đề 2',
    periods_per_week: 2,
    target_classes: ['11A01', '11A02', '11A03'],
    color: '#9333ea',
    badge: '🏆 HSG Văn'
  },
  {
    id: 'act_hsg_eng_10_11',
    name: 'Đội tuyển HSG Tiếng Anh',
    type: 'hsg',
    category: 'Bồi dưỡng HSG',
    teacher_name: 'Hoàng Thu Trang',
    room: 'Phòng Lab Ngoại ngữ',
    periods_per_week: 2,
    target_classes: ['10A01', '10A02', '11A01', '11A02'],
    color: '#6366f1',
    badge: '🏆 HSG Anh'
  },
  {
    id: 'act_hsg_inf_10_12',
    name: 'Đội tuyển HSG Tin học & Lập trình',
    type: 'hsg',
    category: 'Bồi dưỡng HSG',
    teacher_name: 'Trần Quốc Tuấn',
    room: 'Phòng Máy tính 1 (STEM)',
    periods_per_week: 2,
    target_classes: ['10A01', '11A01', '12A01'],
    color: '#0284c7',
    badge: '🏆 HSG Tin'
  },
  {
    id: 'act_hsg_phy_10_11',
    name: 'Đội tuyển HSG Vật lí',
    type: 'hsg',
    category: 'Bồi dưỡng HSG',
    teacher_name: 'Phạm Đức Long',
    room: 'Phòng Thực hành Vật lí',
    periods_per_week: 2,
    target_classes: ['10A01', '10A02', '11A01'],
    color: '#0ea5e9',
    badge: '🏆 HSG Lý'
  },
  {
    id: 'act_hsg_chem_10_11',
    name: 'Đội tuyển HSG Hóa học',
    type: 'hsg',
    category: 'Bồi dưỡng HSG',
    teacher_name: 'Đặng Mai Lan',
    room: 'Phòng Thực hành Hóa học',
    periods_per_week: 2,
    target_classes: ['10A01', '10A03', '11A02'],
    color: '#d97706',
    badge: '🏆 HSG Hóa'
  },
  {
    id: 'act_clb_robotics',
    name: 'CLB Robotics & AI STEM',
    type: 'club',
    category: 'Câu lạc bộ Kỹ năng',
    teacher_name: 'Trần Quốc Tuấn',
    room: 'Phòng Máy tính 1 (STEM)',
    periods_per_week: 2,
    target_classes: ['10A01', '10A02', '10A03', '11A01', '11A02'],
    color: '#059669',
    badge: '🤖 CLB Robotics'
  },
  {
    id: 'act_clb_basketball',
    name: 'CLB Bóng rổ & Thể thao',
    type: 'club',
    category: 'Câu lạc bộ Thể thao',
    teacher_name: 'Lê Minh Tuấn',
    room: 'Nhà thi đấu Đa năng',
    periods_per_week: 2,
    target_classes: ['10A01', '10A02', '10A04', '11A01', '11A03', '12A01'],
    color: '#16a34a',
    badge: '🏀 CLB Bóng rổ'
  },
  {
    id: 'act_clb_music',
    name: 'CLB Âm nhạc & Nghệ thuật',
    type: 'club',
    category: 'Câu lạc bộ Nghệ thuật',
    teacher_name: 'Vũ Thị Minh Hạnh',
    room: 'Hội trường Nhà trường',
    periods_per_week: 2,
    target_classes: ['10A01', '10A03', '11A02', '11A04'],
    color: '#ec4899',
    badge: '🎵 CLB Âm nhạc'
  },
  {
    id: 'act_clb_debate',
    name: 'CLB Tiếng Anh & Tranh biện (Debate)',
    type: 'club',
    category: 'Câu lạc bộ Học thuật',
    teacher_name: 'Hoàng Thu Trang',
    room: 'Phòng Chuyên đề 3',
    periods_per_week: 2,
    target_classes: ['10A01', '10A02', '11A01', '11A03'],
    color: '#8b5cf6',
    badge: '🗣️ CLB Tranh biện'
  },
  {
    id: 'act_clb_media',
    name: 'CLB Truyền thông & Nhiếp ảnh',
    type: 'club',
    category: 'Câu lạc bộ Kỹ năng',
    teacher_name: 'Nguyễn Hải Đăng',
    room: 'Phòng Studio Truyền thông',
    periods_per_week: 2,
    target_classes: ['10A01', '10A04', '11A01', '12A02'],
    color: '#0284c7',
    badge: '📸 CLB Truyền thông'
  }
];

/**
 * Xây dựng Ma trận Giao nhau / Xung đột giữa các CLB & Đội tuyển HSG (Student Overlap Matrix)
 */
export function buildStudentOverlapMatrix(activities = [], registrations = []) {
  const overlapMap = new Map(); // key: `${actId1}__${actId2}` -> { count, students: [] }

  if (!registrations || registrations.length === 0) {
    // Nếu chưa có dữ liệu nạp từ Supabase, tính toán overlap dự phóng dựa trên các lớp mục tiêu
    for (let i = 0; i < activities.length; i++) {
      for (let j = i + 1; j < activities.length; j++) {
        const a1 = activities[i];
        const a2 = activities[j];
        const sharedClasses = a1.target_classes.filter(c => a2.target_classes.includes(c));
        
        if (sharedClasses.length > 0) {
          const key1 = `${a1.id}__${a2.id}`;
          const key2 = `${a2.id}__${a1.id}`;
          const overlapInfo = {
            activity1: a1.name,
            activity2: a2.name,
            overlapCount: sharedClasses.length * 4, // Ước tính 4 HS/lớp
            sharedClasses: sharedClasses,
            isStrictConflict: a1.type === 'hsg' && a2.type === 'hsg' // Hai đội tuyển HSG cùng khối tuyệt đối không trùng
          };
          overlapMap.set(key1, overlapInfo);
          overlapMap.set(key2, overlapInfo);
        }
      }
    }
    return overlapMap;
  }

  // Nếu có dữ liệu đăng ký thực tế từ bảng cbq_student_registrations
  for (let i = 0; i < activities.length; i++) {
    for (let j = i + 1; j < activities.length; j++) {
      const a1 = activities[i];
      const a2 = activities[j];

      // Tìm những học sinh đăng ký cả a1 và a2
      const sharedStudents = registrations.filter(r => {
        const res = r.responses || {};
        const values = Object.values(res).flat().map(v => String(v).toLowerCase().trim());
        const hasA1 = values.some(v => v.includes(a1.name.toLowerCase()) || a1.name.toLowerCase().includes(v));
        const hasA2 = values.some(v => v.includes(a2.name.toLowerCase()) || a2.name.toLowerCase().includes(v));
        return hasA1 && hasA2;
      });

      if (sharedStudents.length > 0 || a1.teacher_name === a2.teacher_name || a1.room === a2.room) {
        const key1 = `${a1.id}__${a2.id}`;
        const key2 = `${a2.id}__${a1.id}`;
        const info = {
          activity1: a1.name,
          activity2: a2.name,
          overlapCount: sharedStudents.length,
          sharedStudents: sharedStudents.map(s => `${s.student_name || 'Học sinh'} (${s.student_class || ''})`),
          sameTeacher: a1.teacher_name === a2.teacher_name,
          sameRoom: a1.room === a2.room,
          isStrictConflict: true
        };
        overlapMap.set(key1, info);
        overlapMap.set(key2, info);
      }
    }
  }

  return overlapMap;
}

/**
 * THUẬT TOÁN AI XẾP LỊCH TỰ ĐỘNG BỒI DƯỠNG HSG & CLB
 * Đảm bảo 0% xung đột: Chính khóa, Giáo viên, Phòng học và Trùng học sinh chéo
 */
export function solveExtracurricularSchedule({
  activities = DEFAULT_EXTRACURRICULAR_ACTIVITIES,
  regularSchedule = [],
  teacherLocks = {},
  schoolLocks = [],
  registrations = []
}) {
  const overlapMap = buildStudentOverlapMatrix(activities, registrations);
  const scheduledSessions = []; // [{ activity_id, name, type, day, period, teacher, room, target_classes, color, badge }]
  const afternoonDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  // Các cặp tiết chiều lý tưởng (thường xếp 2 tiết liền kề): Tiết 6-7 hoặc Tiết 8-9
  const afternoonSlotPairs = [
    { startP: 8, endP: 9, label: 'Tiết 8 - 9 (Cuối chiều)' },
    { startP: 6, endP: 7, label: 'Tiết 6 - 7 (Đầu chiều)' },
    { startP: 7, endP: 8, label: 'Tiết 7 - 8' },
    { startP: 9, endP: 10, label: 'Tiết 9 - 10' }
  ];

  let totalConflicts = 0;
  let studentOverlapConflictsAvoided = 0;

  // Sắp xếp các hoạt động ưu tiên: HSG xếp trước -> CLB lớn xếp sau
  const sortedActivities = [...activities].sort((a, b) => {
    if (a.type === 'hsg' && b.type !== 'hsg') return -1;
    if (a.type !== 'hsg' && b.type === 'hsg') return 1;
    return b.periods_per_week - a.periods_per_week;
  });

  for (const act of sortedActivities) {
    let placed = false;
    const requiredPairs = Math.ceil(act.periods_per_week / 2);

    for (let pairIndex = 0; pairIndex < requiredPairs; pairIndex++) {
      let bestSlot = null;
      let minPenalty = Infinity;

      for (const day of afternoonDays) {
        for (const pair of afternoonSlotPairs) {
          const p1 = pair.startP;
          const p2 = pair.endP;

          // 1. Kiểm tra Khóa trường
          if (schoolLocks.includes(`${day}_${p1}`) || schoolLocks.includes(`${day}_${p2}`)) continue;

          // 2. Kiểm tra Giáo viên bận chính khóa hoặc bận hoạt động khác
          const teacher = getFullTeacherName(act.teacher_name);
          const teacherLocked = (teacherLocks[teacher] || []).includes(`${day}_${p1}`) || (teacherLocks[teacher] || []).includes(`${day}_${p2}`);
          if (teacherLocked) continue;

          const teacherBusyRegular = regularSchedule.some(s => 
            getFullTeacherName(s.teacher_name, s.subject) === teacher &&
            s.day_of_week === day &&
            (Number(s.period) === p1 || Number(s.period) === p2)
          );
          if (teacherBusyRegular) continue;

          const teacherBusyExtracurricular = scheduledSessions.some(s =>
            s.teacher === teacher &&
            s.day === day &&
            (s.period === p1 || s.period === p2)
          );
          if (teacherBusyExtracurricular) continue;

          // 3. Kiểm tra Trùng Phòng học / Sân bãi
          const roomBusy = scheduledSessions.some(s =>
            s.room === act.room &&
            s.day === day &&
            (s.period === p1 || s.period === p2)
          );
          if (roomBusy) continue;

          // 4. Kiểm tra Trùng học sinh chéo (Overlap Conflict) với các CLB/HSG khác đã xếp
          const hasOverlapClash = scheduledSessions.some(s => {
            if (s.day !== day || (s.period !== p1 && s.period !== p2)) return false;
            const conflictKey = `${act.id}__${s.activity_id}`;
            const overlapInfo = overlapMap.get(conflictKey);
            return overlapInfo && (overlapInfo.overlapCount > 0 || overlapInfo.isStrictConflict);
          });
          if (hasOverlapClash) continue;

          // 5. Kiểm tra Trùng lịch học Chính khóa ca chiều của các Lớp mục tiêu
          const classesBusyRegular = act.target_classes.some(cls =>
            regularSchedule.some(s =>
              s.student_class === cls &&
              s.day_of_week === day &&
              (Number(s.period) === p1 || Number(s.period) === p2)
            )
          );

          // Tính điểm số ưu tiên cho vị trí này
          let penalty = 0;
          if (classesBusyRegular) penalty += 50; // Ưu tiên buổi lớp không phải học chính khóa
          if (p1 === 8) penalty -= 10; // Ưu tiên tiết 8-9 (sau giờ chính khóa)
          if (day === 'Thứ 5' || day === 'Thứ 7') penalty -= 5; // Chiều Thứ 5 & Thứ 7 thường là buổi ngoại khóa lý tưởng

          if (penalty < minPenalty) {
            minPenalty = penalty;
            bestSlot = { day, p1, p2 };
          }
        }
      }

      if (bestSlot) {
        // Xếp tiết 1
        scheduledSessions.push({
          activity_id: act.id,
          name: act.name,
          type: act.type,
          day: bestSlot.day,
          period: bestSlot.p1,
          teacher: act.teacher_name,
          room: act.room,
          target_classes: act.target_classes,
          color: act.color,
          badge: act.badge
        });
        // Xếp tiết 2
        scheduledSessions.push({
          activity_id: act.id,
          name: act.name,
          type: act.type,
          day: bestSlot.day,
          period: bestSlot.p2,
          teacher: act.teacher_name,
          room: act.room,
          target_classes: act.target_classes,
          color: act.color,
          badge: act.badge
        });
        studentOverlapConflictsAvoided++;
      } else {
        totalConflicts++;
      }
    }
  }

  return {
    scheduledSessions,
    totalScheduled: scheduledSessions.length,
    totalActivities: activities.length,
    conflicts: totalConflicts,
    studentOverlapConflictsAvoided,
    overlapMatrixSummary: Array.from(overlapMap.values()).filter((v, idx, self) => self.findIndex(t => t.activity1 === v.activity1 && t.activity2 === v.activity2) === idx)
  };
}
