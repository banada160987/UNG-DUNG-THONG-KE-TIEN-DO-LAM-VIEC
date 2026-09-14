import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Award, CheckCircle2, AlertTriangle, FileSpreadsheet, 
  Printer, Save, Search, Filter, BookOpen, UserCheck, 
  Sliders, HelpCircle, ShieldCheck, ChevronRight, BarChart3, 
  Check, RefreshCw, AlertCircle, Info, Calendar, Sparkles, Building2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';

// Standard 4 Evaluation Criteria Breakdown
export const KPI_CRITERIA_DEFINITIONS = [
  {
    groupId: 'group_teaching',
    groupName: 'I. Hoạt động Chuyên môn & Giảng dạy',
    maxScore: 45,
    badgeColor: '#0284c7',
    badgeBg: '#e0f2fe',
    items: [
      { id: 't1', name: 'Kế hoạch bài dạy (CV 5512), tiến độ PPCT, cập nhật sổ báo giảng đúng hạn', max: 15, defaultVal: 15 },
      { id: 't2', name: 'Chất lượng giờ dạy, thực hiện đủ chỉ tiêu dự giờ đồng nghiệp & thao giảng', max: 15, defaultVal: 14 },
      { id: 't3', name: 'Kiểm tra, đánh giá thường xuyên/định kỳ đúng ma trận, vào điểm đúng hạn trên CSDL', max: 15, defaultVal: 14 }
    ]
  },
  {
    groupId: 'group_homeroom',
    groupName: 'II. Công tác Chủ nhiệm & Kiêm nhiệm',
    maxScore: 25,
    badgeColor: '#16a34a',
    badgeBg: '#dcfce7',
    items: [
      { id: 'h1', name: 'Quản lý nề nếp lớp chủ nhiệm (chuyên cần ≥98%) / Hoặc Bồi dưỡng HSG, phụ đạo HS yếu', max: 15, defaultVal: 14 },
      { id: 'h2', name: 'Phối hợp PHHS kịp thời / Tham gia ban thanh tra, giám sát, hoạt động đoàn thể', max: 10, defaultVal: 10 }
    ]
  },
  {
    groupId: 'group_innovation',
    groupName: 'III. Đổi mới sáng tạo & Chuyển đổi số',
    maxScore: 15,
    badgeColor: '#d97706',
    badgeBg: '#fef3c7',
    items: [
      { id: 'i1', name: 'Ứng dụng CNTT, học liệu số, LMS, ra đề thi trắc nghiệm ma trận chuẩn 2025', max: 8, defaultVal: 8 },
      { id: 'i2', name: 'Sáng kiến kinh nghiệm, bài giảng E-learning, STEM hoặc tham gia hội thi GV dạy giỏi', max: 7, defaultVal: 6 }
    ]
  },
  {
    groupId: 'group_discipline',
    groupName: 'IV. Đạo đức nhà giáo & Kỷ cương công vụ',
    maxScore: 15,
    badgeColor: '#9333ea',
    badgeBg: '#f3e8ff',
    items: [
      { id: 'd1', name: 'Chấp hành nghiêm túc ngày giờ công, coi thi, họp hội đồng, sinh hoạt chuyên môn', max: 8, defaultVal: 8 },
      { id: 'd2', name: 'Tác phong chuẩn mực, không vi phạm dạy thêm học thêm, giữ gìn đoàn kết nội bộ', max: 7, defaultVal: 7 }
    ]
  }
];

export const EVALUATION_MONTHS = [
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12', 
  'Tổng kết Học kỳ 1', 
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 
  'Tổng kết Cả năm học'
];

export const SCHOOL_YEARS = ['2025-2026', '2026-2027'];

// Map KPI Score to Officer Classification according to ND 90/2020 & ND 48/2023 & Law on Emulation 2022
export function calculateKPIGrade(totalScore) {
  if (totalScore >= 90) {
    return {
      grade: 'A',
      gradeName: 'Loại A (Xuất sắc)',
      officerRank: 'Hoàn thành xuất sắc nhiệm vụ',
      emulationAward: 'Chiến sĩ thi đua cơ sở',
      color: '#16a34a',
      bgColor: '#dcfce7',
      borderColor: '#86efac'
    };
  }
  if (totalScore >= 75) {
    return {
      grade: 'B',
      gradeName: 'Loại B (Tốt)',
      officerRank: 'Hoàn thành tốt nhiệm vụ',
      emulationAward: 'Lao động tiên tiến',
      color: '#0284c7',
      bgColor: '#e0f2fe',
      borderColor: '#7dd3fc'
    };
  }
  if (totalScore >= 50) {
    return {
      grade: 'C',
      gradeName: 'Loại C (Hoàn thành)',
      officerRank: 'Hoàn thành nhiệm vụ',
      emulationAward: 'Không bình xét',
      color: '#d97706',
      bgColor: '#fef3c7',
      borderColor: '#fde68a'
    };
  }
  return {
    grade: 'D',
    gradeName: 'Loại D (Không đạt)',
    officerRank: 'Không hoàn thành nhiệm vụ',
    emulationAward: 'Không xét thi đua',
    color: '#dc2626',
    bgColor: '#fee2e2',
    borderColor: '#fca5a5'
  };
}

export default function TeacherKPIEvaluation() {
  const navigate = useNavigate();
  const [currentTeacher, setCurrentTeacher] = useState(null);
  
  // Selection State
  const [schoolYear, setSchoolYear] = useState('2025-2026');
  const [selectedMonth, setSelectedMonth] = useState('Tháng 9');
  const [selectedDept, setSelectedDept] = useState('');
  
  // Database Data States
  const [departments, setDepartments] = useState([]);
  const [staffInDept, setStaffInDept] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Active Tab: 'scoring' | 'report' | 'regulations'
  const [activeTab, setActiveTab] = useState('scoring');
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('ALL');

  // Modal State for Individual Detailed Scoring
  const [selectedStaffForModal, setSelectedStaffForModal] = useState(null);
  const [modalScores, setModalScores] = useState({
    t1: 15, t2: 14, t3: 14,
    h1: 14, h2: 10,
    i1: 8, i2: 6,
    d1: 8, d2: 7,
    notes: '',
    is_homeroom: false
  });

  // 1. Initial Load: Teacher session, Departments from DB, Staff from DB
  useEffect(() => {
    const teacherStr = localStorage.getItem('cbq_current_teacher');
    let teacherObj = null;
    if (teacherStr) {
      try {
        teacherObj = JSON.parse(teacherStr);
        setCurrentTeacher(teacherObj);
      } catch (e) {
        console.warn("Lỗi đọc thông tin giáo viên:", e);
      }
    }

    loadInitialData(teacherObj);
  }, []);

  const loadInitialData = async (teacherObj) => {
    setLoading(true);
    try {
      // 1. Fetch departments from database table cbq_departments
      let depts = [];
      const { data: deptData, error: deptErr } = await supabase
        .from('cbq_departments')
        .select('*')
        .or('is_active.eq.true,is_active.is.null')
        .order('sort_order', { ascending: true });

      if (!deptErr && deptData && deptData.length > 0) {
        depts = deptData.map(d => d.name);
      } else {
        // Fallback: fetch distinct departments from cbq_staff
        const { data: staffDeptData } = await supabase
          .from('cbq_staff')
          .select('department')
          .not('department', 'is', null);
        if (staffDeptData && staffDeptData.length > 0) {
          depts = [...new Set(staffDeptData.map(s => s.department).filter(Boolean))];
        }
      }

      // Default fallback if still empty
      if (depts.length === 0) {
        depts = [
          'Tổ Toán - Tin', 'Tổ Ngữ Văn', 'Tổ Ngoại Ngữ', 
          'Tổ Lý - Hóa - Sinh', 'Tổ Sử - Địa - GDCD', 
          'Tổ Thể Dục - QQP', 'Tổ Văn Phòng & Kế Toán'
        ];
      }

      setDepartments(depts);

      // Determine initial department
      let initialDept = depts[0];
      if (teacherObj) {
        // Check if teacher has matching department in staff table
        const { data: staffMatch } = await supabase
          .from('cbq_staff')
          .select('department')
          .eq('name', teacherObj.full_name)
          .maybeSingle();

        if (staffMatch?.department && depts.includes(staffMatch.department)) {
          initialDept = staffMatch.department;
        } else if (teacherObj.department && depts.includes(teacherObj.department)) {
          initialDept = teacherObj.department;
        }
      }

      setSelectedDept(initialDept);
      await fetchStaffAndEvaluations(initialDept, selectedMonth, schoolYear);
    } catch (err) {
      console.error("Lỗi khởi tạo dữ liệu KPI:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Staff for the Selected Department and their monthly evaluations
  const fetchStaffAndEvaluations = useCallback(async (deptName, month, year) => {
    if (!deptName) return;
    setLoading(true);

    try {
      // 1. Fetch staff members belonging to this department from cbq_staff
      const { data: staffData, error: staffErr } = await supabase
        .from('cbq_staff')
        .select('*')
        .eq('department', deptName)
        .or('is_active.eq.true,is_active.is.null')
        .order('sort_order', { ascending: true });

      let currentStaffList = [];
      if (!staffErr && staffData && staffData.length > 0) {
        currentStaffList = staffData;
      } else {
        // Fallback sample data if department has no staff yet
        currentStaffList = [
          { id: 'st_1', name: 'Nguyễn Văn An', title: 'Tổ trưởng chuyên môn', department: deptName },
          { id: 'st_2', name: 'Trần Thị Bình', title: 'Tổ phó chuyên môn', department: deptName },
          { id: 'st_3', name: 'Lê Hoàng Cường', title: 'Giáo viên', department: deptName },
          { id: 'st_4', name: 'Phạm Thị Dung', title: 'Giáo viên', department: deptName },
          { id: 'st_5', name: 'Vũ Đức Em', title: 'Giáo viên', department: deptName }
        ];
      }

      setStaffInDept(currentStaffList);

      // 2. Fetch existing evaluations for this dept, month, year from cbq_kpi_evaluations
      let existingEvals = [];
      const { data: evalData } = await supabase
        .from('cbq_kpi_evaluations')
        .select('*')
        .eq('department_name', deptName)
        .eq('evaluation_month', month)
        .eq('school_year', year);

      if (evalData && evalData.length > 0) {
        existingEvals = evalData;
      } else {
        // Check local storage cache
        const localKey = `cbq_kpi_${deptName}_${year}_${month}`;
        const cached = localStorage.getItem(localKey);
        if (cached) {
          try {
            existingEvals = JSON.parse(cached);
          } catch (e) {
            console.warn("Lỗi đọc cache KPI:", e);
          }
        }
      }

      // 3. Map staff to evaluations, creating default entries if none exist
      const mergedEvaluations = currentStaffList.map((st, idx) => {
        const found = existingEvals.find(e => e.staff_id === st.id || e.teacher_name === st.name);
        if (found) {
          return {
            ...found,
            staff_id: st.id,
            teacher_name: st.name,
            teacher_title: st.title || 'Giáo viên'
          };
        }

        // Generate baseline scores
        const isHomeroom = Boolean(st.title?.toLowerCase().includes('chủ nhiệm') || idx % 2 === 0);
        const subScores = {
          t1: 15, t2: 14, t3: 14,
          h1: isHomeroom ? 14 : 15, h2: 10,
          i1: 8, i2: 6,
          d1: 8, d2: 7
        };
        const teachingSum = subScores.t1 + subScores.t2 + subScores.t3; // 43
        const homeroomSum = subScores.h1 + subScores.h2; // 24
        const innovationSum = subScores.i1 + subScores.i2; // 14
        const disciplineSum = subScores.d1 + subScores.d2; // 15
        const total = teachingSum + homeroomSum + innovationSum + disciplineSum; // 96
        const gradeInfo = calculateKPIGrade(total);

        return {
          id: `kpi_${st.id || idx}_${month}`,
          school_year: year,
          evaluation_month: month,
          department_name: deptName,
          staff_id: st.id,
          teacher_name: st.name,
          teacher_title: st.title || 'Giáo viên',
          is_homeroom: isHomeroom,
          score_teaching: teachingSum,
          score_homeroom: homeroomSum,
          score_innovation: innovationSum,
          score_discipline: disciplineSum,
          total_score: total,
          criteria_details: subScores,
          kpi_grade: gradeInfo.grade,
          officer_classification: gradeInfo.officerRank,
          emulation_proposal: gradeInfo.emulationAward,
          notes: 'Hoàn thành tốt nhiệm vụ giảng dạy và nề nếp trong tháng.',
          status: 'COMPLETED'
        };
      });

      setEvaluations(mergedEvaluations);

    } catch (err) {
      console.error("Lỗi nạp dữ liệu đánh giá:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Department / Month / Year change triggers reload
  const handleDepartmentChange = (newDept) => {
    setSelectedDept(newDept);
    fetchStaffAndEvaluations(newDept, selectedMonth, schoolYear);
  };

  const handleMonthChange = (newMonth) => {
    setSelectedMonth(newMonth);
    fetchStaffAndEvaluations(selectedDept, newMonth, schoolYear);
  };

  const handleYearChange = (newYear) => {
    setSchoolYear(newYear);
    fetchStaffAndEvaluations(selectedDept, selectedMonth, newYear);
  };

  // Open Detailed Scoring Modal
  const handleOpenScoreModal = (evalItem) => {
    setSelectedStaffForModal(evalItem);
    const details = evalItem.criteria_details || {};
    setModalScores({
      t1: Number(details.t1 ?? 15),
      t2: Number(details.t2 ?? 14),
      t3: Number(details.t3 ?? 14),
      h1: Number(details.h1 ?? 14),
      h2: Number(details.h2 ?? 10),
      i1: Number(details.i1 ?? 8),
      i2: Number(details.i2 ?? 6),
      d1: Number(details.d1 ?? 8),
      d2: Number(details.d2 ?? 7),
      notes: evalItem.notes || '',
      is_homeroom: evalItem.is_homeroom || false
    });
  };

  // Calculate live modal total
  const modalCalculatedTotal = useMemo(() => {
    const { t1, t2, t3, h1, h2, i1, i2, d1, d2 } = modalScores;
    const teaching = (Number(t1) || 0) + (Number(t2) || 0) + (Number(t3) || 0);
    const homeroom = (Number(h1) || 0) + (Number(h2) || 0);
    const innovation = (Number(i1) || 0) + (Number(i2) || 0);
    const discipline = (Number(d1) || 0) + (Number(d2) || 0);
    const total = teaching + homeroom + innovation + discipline;
    return {
      teaching,
      homeroom,
      innovation,
      discipline,
      total,
      ...calculateKPIGrade(total)
    };
  }, [modalScores]);

  // Save Modal Scores into state
  const handleSaveModalScores = () => {
    if (!selectedStaffForModal) return;

    const updated = evaluations.map(ev => {
      if (ev.id === selectedStaffForModal.id || ev.teacher_name === selectedStaffForModal.teacher_name) {
        return {
          ...ev,
          score_teaching: modalCalculatedTotal.teaching,
          score_homeroom: modalCalculatedTotal.homeroom,
          score_innovation: modalCalculatedTotal.innovation,
          score_discipline: modalCalculatedTotal.discipline,
          total_score: modalCalculatedTotal.total,
          criteria_details: {
            t1: modalScores.t1, t2: modalScores.t2, t3: modalScores.t3,
            h1: modalScores.h1, h2: modalScores.h2,
            i1: modalScores.i1, i2: modalScores.i2,
            d1: modalScores.d1, d2: modalScores.d2
          },
          kpi_grade: modalCalculatedTotal.grade,
          officer_classification: modalCalculatedTotal.officerRank,
          emulation_proposal: modalCalculatedTotal.emulationAward,
          notes: modalScores.notes,
          is_homeroom: modalScores.is_homeroom
        };
      }
      return ev;
    });

    setEvaluations(updated);
    setSelectedStaffForModal(null);
  };

  // Quick Score Change in table
  const handleQuickScoreChange = (evalId, field, delta) => {
    setEvaluations(prev => prev.map(ev => {
      if (ev.id === evalId) {
        const currentVal = Number(ev[field] || 0);
        let maxVal = 45;
        if (field === 'score_homeroom') maxVal = 25;
        if (field === 'score_innovation' || field === 'score_discipline') maxVal = 15;

        const newVal = Math.max(0, Math.min(maxVal, currentVal + delta));
        const newTeaching = field === 'score_teaching' ? newVal : ev.score_teaching;
        const newHomeroom = field === 'score_homeroom' ? newVal : ev.score_homeroom;
        const newInnovation = field === 'score_innovation' ? newVal : ev.score_innovation;
        const newDiscipline = field === 'score_discipline' ? newVal : ev.score_discipline;
        const newTotal = newTeaching + newHomeroom + newInnovation + newDiscipline;
        const gradeInfo = calculateKPIGrade(newTotal);

        return {
          ...ev,
          [field]: newVal,
          total_score: newTotal,
          kpi_grade: gradeInfo.grade,
          officer_classification: gradeInfo.officerRank,
          emulation_proposal: gradeInfo.emulationAward
        };
      }
      return ev;
    }));
  };

  // Save All Evaluations to Supabase and LocalStorage
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // 1. Save to LocalStorage cache
      const localKey = `cbq_kpi_${selectedDept}_${schoolYear}_${selectedMonth}`;
      localStorage.setItem(localKey, JSON.stringify(evaluations));

      // 2. Attempt Upsert to Supabase table cbq_kpi_evaluations
      const payload = evaluations.map(ev => ({
        school_year: schoolYear,
        evaluation_month: selectedMonth,
        department_name: selectedDept,
        staff_id: ev.staff_id && ev.staff_id.length > 20 ? ev.staff_id : null,
        teacher_name: ev.teacher_name,
        teacher_title: ev.teacher_title,
        is_homeroom: ev.is_homeroom,
        score_teaching: ev.score_teaching,
        score_homeroom: ev.score_homeroom,
        score_innovation: ev.score_innovation,
        score_discipline: ev.score_discipline,
        total_score: ev.total_score,
        criteria_details: ev.criteria_details,
        kpi_grade: ev.kpi_grade,
        officer_classification: ev.officer_classification,
        emulation_proposal: ev.emulation_proposal,
        notes: ev.notes,
        evaluator_name: currentTeacher?.full_name || 'Tổ trưởng chuyên môn',
        status: 'COMPLETED',
        updated_at: new Date().toISOString()
      }));

      const { error: upsertErr } = await supabase
        .from('cbq_kpi_evaluations')
        .upsert(payload, { onConflict: 'department_name,school_year,evaluation_month,teacher_name' });

      if (upsertErr) {
        console.warn("Lưu lên Supabase có lưu ý:", upsertErr.message);
      }

      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    } catch (err) {
      console.error("Lỗi khi lưu đánh giá KPI:", err);
      alert("Đã lưu kết quả đánh giá vào bộ nhớ hệ thống (Local Storage)!");
    } finally {
      setSaving(false);
    }
  };

  // Statistical Metrics
  const stats = useMemo(() => {
    const totalTeachers = evaluations.length;
    if (totalTeachers === 0) return { total: 0, countA: 0, countB: 0, countC: 0, countD: 0, percentA: 0, isExceedingQuota: false, avgScore: 0 };

    let countA = 0;
    let countB = 0;
    let countC = 0;
    let countD = 0;
    let sumScore = 0;

    evaluations.forEach(ev => {
      sumScore += Number(ev.total_score || 0);
      if (ev.kpi_grade === 'A') countA++;
      else if (ev.kpi_grade === 'B') countB++;
      else if (ev.kpi_grade === 'C') countC++;
      else countD++;
    });

    // Decree 48/2023 rule: Count A cannot exceed 20% of (Count A + Count B)
    const totalGoodAndExcellent = countA + countB;
    const maxAllowedA = Math.max(1, Math.floor(totalGoodAndExcellent * 0.2));
    const percentA = totalTeachers > 0 ? Math.round((countA / totalTeachers) * 100) : 0;
    const isExceedingQuota = totalGoodAndExcellent > 0 && countA > maxAllowedA;

    return {
      total: totalTeachers,
      countA,
      countB,
      countC,
      countD,
      percentA,
      maxAllowedA,
      isExceedingQuota,
      avgScore: (sumScore / totalTeachers).toFixed(1)
    };
  }, [evaluations]);

  // Filtered Evaluations for Display
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(ev => {
      const matchSearch = !searchTerm || ev.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) || (ev.teacher_title && ev.teacher_title.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchGrade = filterGrade === 'ALL' || ev.kpi_grade === filterGrade;
      return matchSearch && matchGrade;
    });
  }, [evaluations, searchTerm, filterGrade]);

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const excelRows = evaluations.map((ev, idx) => ({
      'STT': idx + 1,
      'Họ và tên': ev.teacher_name,
      'Chức vụ / Nhiệm vụ': ev.teacher_title,
      'Chủ nhiệm': ev.is_homeroom ? 'Có' : 'Không',
      'Chuyên môn (45đ)': ev.score_teaching,
      'Kiêm nhiệm / CN (25đ)': ev.score_homeroom,
      'Đổi mới & CNTT (15đ)': ev.score_innovation,
      'Kỷ cương & Đạo đức (15đ)': ev.score_discipline,
      'Tổng điểm KPI (100đ)': ev.total_score,
      'Xếp loại KPI': ev.kpi_grade,
      'Xếp loại Viên chức (NĐ 48/2023)': ev.officer_classification,
      'Đề xuất Thi đua': ev.emulation_proposal,
      'Ghi chú / Đánh giá tổ': ev.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `KPI_${selectedMonth}`);
    XLSX.writeFile(workbook, `Bang_Danh_Gia_KPI_${selectedDept.replace(/\s+/g, '_')}_${selectedMonth}_${schoolYear}.xlsx`);
  };

  // Print Department Meeting Minutes
  const handlePrintMinutes = () => {
    window.print();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '60px' }}>
      
      {/* HEADER BAR */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate('/giao-vien/quan-ly-to-chuyen-mon')}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', transition: '0.2s' }}
            >
              <ArrowLeft size={18} />
              Quay lại Tổ chuyên môn
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={24} color="#38bdf8" />
                  Đánh Giá KPI & Xếp Loại Viên Chức
                </h1>
                <span style={{ fontSize: '11px', background: '#0284c7', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                  NĐ 48/2023 & Luật TĐKT 2022
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                Hệ thống đánh giá tiến độ và xếp loại chất lượng viên chức hàng tháng cho Tổ Chuyên Môn
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleExportExcel}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#10b981', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
            >
              <FileSpreadsheet size={16} />
              Xuất Excel
            </button>
            <button
              onClick={handlePrintMinutes}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#64748b', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
            >
              <Printer size={16} />
              In Biên Bản
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 4px 12px rgba(2,132,199,0.3)' }}
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Đang lưu...' : 'Lưu Đánh Giá'}
            </button>
          </div>

        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {saveToast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: '#10b981', color: 'white', padding: '12px 20px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
          <CheckCircle2 size={20} />
          Đã lưu kết quả đánh giá KPI thành công!
        </div>
      )}

      {/* MAIN CONTENT CONTAINER */}
      <div style={{ maxWidth: '1400px', margin: '24px auto', padding: '0 24px' }}>
        
        {/* TOP FILTER & CONTROLS CARD */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'center' }}>
            
            {/* Department Select (from DB) */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                <Building2 size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Tổ Chuyên Môn (Dữ liệu hệ thống)
              </label>
              <select
                value={selectedDept}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '600', color: '#1e293b', background: '#f8fafc' }}
              >
                {departments.map((dept, i) => (
                  <option key={i} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Evaluation Month */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                <Calendar size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Kỳ / Tháng Đánh Giá
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '600', color: '#0369a1', background: '#f0f9ff' }}
              >
                {EVALUATION_MONTHS.map((m, i) => (
                  <option key={i} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* School Year */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                Năm học
              </label>
              <select
                value={schoolYear}
                onChange={(e) => handleYearChange(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '500', color: '#334155', background: '#ffffff' }}
              >
                {SCHOOL_YEARS.map((y, i) => (
                  <option key={i} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Quick Summary Badge */}
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Tổng số giáo viên trong tổ</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
                {stats.total} Thành viên
                <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b', marginLeft: '8px' }}>
                  (Điểm TB: {stats.avgScore}/100)
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* STATS OVERVIEW CARDS & DECREE 48 QUOTA ALERT */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          {/* Grade A (Xuất sắc) */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '16px', border: '2px solid #bbf7d0', boxShadow: '0 2px 6px rgba(22,163,74,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534' }}>Loại A (Xuất sắc)</span>
              <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>≥ 90 điểm</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#15803d', marginTop: '6px' }}>
              {stats.countA} <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#4ade80' }}>/ {stats.total}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#166534', marginTop: '4px' }}>
              Tỷ lệ: {stats.percentA}% (Tối đa cho phép: {stats.maxAllowedA} người)
            </div>
          </div>

          {/* Grade B (Tốt) */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '16px', border: '2px solid #bae6fd', boxShadow: '0 2px 6px rgba(2,132,199,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0369a1' }}>Loại B (Tốt)</span>
              <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>75 - 89.5đ</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#0284c7', marginTop: '6px' }}>
              {stats.countB} <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#38bdf8' }}>/ {stats.total}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '4px' }}>
              Hoàn thành tốt nhiệm vụ (Lao động tiên tiến)
            </div>
          </div>

          {/* Grade C (Hoàn thành) */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '16px', border: '2px solid #fde68a', boxShadow: '0 2px 6px rgba(217,119,6,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#854d0e' }}>Loại C (Hoàn thành)</span>
              <span style={{ fontSize: '11px', background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>50 - 74.5đ</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#d97706', marginTop: '6px' }}>
              {stats.countC} <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#facc15' }}>/ {stats.total}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#854d0e', marginTop: '4px' }}>
              Còn tiêu chí cần khắc phục
            </div>
          </div>

          {/* Grade D (Không đạt) */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '16px', border: '2px solid #fecaca', boxShadow: '0 2px 6px rgba(220,38,38,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#991b1b' }}>Loại D (Không đạt)</span>
              <span style={{ fontSize: '11px', background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>&lt; 50 điểm</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#dc2626', marginTop: '6px' }}>
              {stats.countD} <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#f87171' }}>/ {stats.total}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px' }}>
              Vi phạm quy chế hoặc không hoàn thành nhiệm vụ
            </div>
          </div>

        </div>

        {/* NGHỊ ĐỊNH 48/2023 COMPLIANCE ALERT BOX */}
        {stats.isExceedingQuota ? (
          <div style={{ background: '#fff1f2', border: '2px solid #f43f5e', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <AlertTriangle size={24} color="#e11d48" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#9f1239', fontSize: '15px', fontWeight: 'bold' }}>
                CẢNH BÁO KHỐNG CHẾ TỶ LỆ XUẤT SẮC (Theo Nghị định 48/2023/NĐ-CP)
              </h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#881337', lineHeight: '1.5' }}>
                Tổ hiện có <strong>{stats.countA} giáo viên</strong> xếp Loại A (Xuất sắc), vượt quá mức trần quy định <strong>20%</strong> (Tối đa {stats.maxAllowedA} người được loại Xuất sắc). 
                Tổ trưởng vui lòng cân đối, bỏ phiếu bình xét lại để chọn ra những cá nhân thực sự tiêu biểu xuất sắc nhất!
              </p>
            </div>
          </div>
        ) : (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '12px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={20} color="#16a34a" />
            <span style={{ fontSize: '13.5px', color: '#15803d' }}>
              <strong>Tuân thủ quy định:</strong> Tỷ lệ xếp loại Xuất sắc ({stats.percentA}%) hiện nằm trong giới hạn cho phép theo Nghị định 48/2023/NĐ-CP (Tối đa {stats.maxAllowedA} người).
            </span>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('scoring')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: activeTab === 'scoring' ? '3px solid #0284c7' : '3px solid transparent',
              background: 'none',
              color: activeTab === 'scoring' ? '#0284c7' : '#64748b',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <UserCheck size={18} />
            Bảng Chấm Điểm KPI Tổ ({evaluations.length})
          </button>
          <button
            onClick={() => setActiveTab('report')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: activeTab === 'report' ? '3px solid #0284c7' : '3px solid transparent',
              background: 'none',
              color: activeTab === 'report' ? '#0284c7' : '#64748b',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <BarChart3 size={18} />
            Báo Cáo & Xếp Hạng
          </button>
          <button
            onClick={() => setActiveTab('regulations')}
            style={{
              padding: '12px 20px',
              border: 'none',
              borderBottom: activeTab === 'regulations' ? '3px solid #0284c7' : '3px solid transparent',
              background: 'none',
              color: activeTab === 'regulations' ? '#0284c7' : '#64748b',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <BookOpen size={18} />
            Văn Bản Quy Chế & Thang Điểm Chuẩn
          </button>
        </div>

        {/* TAB 1: SCORING TABLE */}
        {activeTab === 'scoring' && (
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            
            {/* Search & Sub Filters */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ position: 'relative', width: '300px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Tìm giáo viên theo tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Lọc xếp loại:</span>
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="ALL">Tất cả xếp loại</option>
                  <option value="A">Loại A (Xuất sắc)</option>
                  <option value="B">Loại B (Tốt)</option>
                  <option value="C">Loại C (Hoàn thành)</option>
                  <option value="D">Loại D (Không đạt)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '14px 16px', width: '50px' }}>STT</th>
                    <th style={{ padding: '14px 16px', minWidth: '180px' }}>Giáo Viên</th>
                    <th style={{ padding: '14px 12px', textAlign: 'center', minWidth: '120px' }}>
                      Chuyên môn<br/><span style={{ fontSize: '11px', color: '#0284c7' }}>(Tối đa 45đ)</span>
                    </th>
                    <th style={{ padding: '14px 12px', textAlign: 'center', minWidth: '120px' }}>
                      CN / Kiêm nhiệm<br/><span style={{ fontSize: '11px', color: '#16a34a' }}>(Tối đa 25đ)</span>
                    </th>
                    <th style={{ padding: '14px 12px', textAlign: 'center', minWidth: '120px' }}>
                      Đổi mới & CNTT<br/><span style={{ fontSize: '11px', color: '#d97706' }}>(Tối đa 15đ)</span>
                    </th>
                    <th style={{ padding: '14px 12px', textAlign: 'center', minWidth: '120px' }}>
                      Kỷ cương<br/><span style={{ fontSize: '11px', color: '#9333ea' }}>(Tối đa 15đ)</span>
                    </th>
                    <th style={{ padding: '14px 12px', textAlign: 'center', minWidth: '100px' }}>
                      Tổng Điểm<br/><span style={{ fontSize: '11px', color: '#0f172a' }}>(100đ)</span>
                    </th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', minWidth: '130px' }}>Xếp Loại KPI</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', minWidth: '120px' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvaluations.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        Không tìm thấy giáo viên nào trong tổ chuyên môn này.
                      </td>
                    </tr>
                  ) : (
                    filteredEvaluations.map((ev, idx) => {
                      const gradeStyle = calculateKPIGrade(ev.total_score);
                      return (
                        <tr key={ev.id || idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                          <td style={{ padding: '14px 16px', color: '#64748b', fontWeight: 'bold' }}>{idx + 1}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '14px' }}>
                              {ev.teacher_name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px' }}>
                                {ev.teacher_title || 'Giáo viên'}
                              </span>
                              {ev.is_homeroom && (
                                <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                  GVCN
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Quick adjustment controls for each pillar */}
                          <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f0f9ff', padding: '4px 8px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                              <button onClick={() => handleQuickScoreChange(ev.id, 'score_teaching', -1)} style={{ border: 'none', background: '#e0f2fe', color: '#0369a1', width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                              <span style={{ fontWeight: 'bold', color: '#0369a1', width: '24px', textAlign: 'center' }}>{ev.score_teaching}</span>
                              <button onClick={() => handleQuickScoreChange(ev.id, 'score_teaching', 1)} style={{ border: 'none', background: '#e0f2fe', color: '#0369a1', width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                            </div>
                          </td>

                          <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f0fdf4', padding: '4px 8px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                              <button onClick={() => handleQuickScoreChange(ev.id, 'score_homeroom', -1)} style={{ border: 'none', background: '#dcfce7', color: '#15803d', width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                              <span style={{ fontWeight: 'bold', color: '#15803d', width: '24px', textAlign: 'center' }}>{ev.score_homeroom}</span>
                              <button onClick={() => handleQuickScoreChange(ev.id, 'score_homeroom', 1)} style={{ border: 'none', background: '#dcfce7', color: '#15803d', width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                            </div>
                          </td>

                          <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fffbeb', padding: '4px 8px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                              <button onClick={() => handleQuickScoreChange(ev.id, 'score_innovation', -1)} style={{ border: 'none', background: '#fef3c7', color: '#b45309', width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                              <span style={{ fontWeight: 'bold', color: '#b45309', width: '24px', textAlign: 'center' }}>{ev.score_innovation}</span>
                              <button onClick={() => handleQuickScoreChange(ev.id, 'score_innovation', 1)} style={{ border: 'none', background: '#fef3c7', color: '#b45309', width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                            </div>
                          </td>

                          <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#faf5ff', padding: '4px 8px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                              <button onClick={() => handleQuickScoreChange(ev.id, 'score_discipline', -1)} style={{ border: 'none', background: '#f3e8ff', color: '#7e22ce', width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                              <span style={{ fontWeight: 'bold', color: '#7e22ce', width: '24px', textAlign: 'center' }}>{ev.score_discipline}</span>
                              <button onClick={() => handleQuickScoreChange(ev.id, 'score_discipline', 1)} style={{ border: 'none', background: '#f3e8ff', color: '#7e22ce', width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                            </div>
                          </td>

                          {/* Total Score */}
                          <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: gradeStyle.color }}>
                              {ev.total_score}
                            </span>
                          </td>

                          {/* Rank Badge */}
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: gradeStyle.bgColor, color: gradeStyle.color, border: `1px solid ${gradeStyle.borderColor}` }}>
                              {gradeStyle.gradeName}
                            </span>
                          </td>

                          {/* Detail Action */}
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleOpenScoreModal(ev)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '12.5px', fontWeight: '600' }}
                            >
                              <Sliders size={14} />
                              Chấm Chi Tiết
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Helper */}
            <div style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                💡 <em>Mẹo: Sử dụng nút (+) (-) để điều chỉnh nhanh, hoặc bấm "Chấm Chi Tiết" để nhập từng tiêu chí con và minh chứng.</em>
              </div>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                style={{ padding: '8px 18px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Save size={16} />
                Lưu Toàn Bộ Bảng Điểm
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: REPORT & RANKINGS */}
        {activeTab === 'report' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            
            {/* Left Card: Summary Table */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} color="#0284c7" />
                Bảng Xếp Hạng KPI {selectedDept} - {selectedMonth}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...evaluations].sort((a, b) => b.total_score - a.total_score).map((ev, i) => {
                  const grade = calculateKPIGrade(ev.total_score);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '10px', background: i === 0 ? '#f0f9ff' : '#f8fafc', border: `1px solid ${i === 0 ? '#bae6fd' : '#e2e8f0'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: i < 3 ? '#0284c7' : '#94a3b8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                          {i + 1}
                        </span>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '14px' }}>{ev.teacher_name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{ev.officer_classification}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: grade.color }}>{ev.total_score}đ</div>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '8px', background: grade.bgColor, color: grade.color }}>
                          {grade.gradeName}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Card: Official Meeting Minutes Preview */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                  Biên Bản Họp Xét KPI Tổ Chuyên Môn
                </h3>
                <button
                  onClick={handlePrintMinutes}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0284c7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  <Printer size={14} />
                  In Biên Bản
                </button>
              </div>

              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13.5px', lineHeight: '1.6', color: '#1e293b' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '12px' }}>
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br/>
                  <span style={{ fontSize: '12px', fontWeight: 'normal' }}>Độc lập - Tự do - Hạnh phúc</span>
                </div>
                <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#0369a1', marginBottom: '16px' }}>
                  BIÊN BẢN HỌP BÌNH XÉT ĐÁNH GIÁ KPI & XẾP LOẠI VIÊN CHỨC<br/>
                  <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#475569' }}>Kỳ đánh giá: {selectedMonth} - Năm học {schoolYear}</span>
                </div>

                <p><strong>1. Đơn vị:</strong> {selectedDept}</p>
                <p><strong>2. Thời gian:</strong> {new Date().toLocaleDateString('vi-VN')}</p>
                <p><strong>3. Thành phần:</strong> Có mặt {stats.total}/{stats.total} đồng chí.</p>
                <p><strong>4. Kết quả bình xét xếp loại:</strong></p>
                <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                  <li>Loại A (Hoàn thành xuất sắc nhiệm vụ): <strong>{stats.countA}</strong> đồng chí ({stats.percentA}% - {stats.isExceedingQuota ? 'Vượt trần quy định' : 'Đạt chuẩn NĐ 48/2023'}).</li>
                  <li>Loại B (Hoàn thành tốt nhiệm vụ): <strong>{stats.countB}</strong> đồng chí.</li>
                  <li>Loại C (Hoàn thành nhiệm vụ): <strong>{stats.countC}</strong> đồng chí.</li>
                  <li>Loại D (Không hoàn thành nhiệm vụ): <strong>{stats.countD}</strong> đồng chí.</li>
                </ul>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1' }}>
                  <div style={{ textAlign: 'center' }}>
                    <strong>Thư ký cuộc họp</strong><br/>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>(Ký và ghi rõ họ tên)</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <strong>Tổ trưởng chuyên môn</strong><br/>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>(Ký và ghi rõ họ tên)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: REGULATIONS & STANDARDS */}
        {activeTab === 'regulations' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            
            <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '16px', marginBottom: '24px' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#0369a1', fontWeight: 'bold' }}>
                QUY CHẾ ĐÁNH GIÁ KPI & XẾP LOẠI VIÊN CHỨC GIÁO VIÊN
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                Căn cứ Luật Thi đua, Khen thưởng số 06/2022/QH15, Nghị định 90/2020/NĐ-CP và Nghị định 48/2023/NĐ-CP của Chính phủ
              </p>
            </div>

            {/* Criteria Detailed Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              {KPI_CRITERIA_DEFINITIONS.map(group => (
                <div key={group.groupId} style={{ background: '#f8fafc', borderRadius: '12px', padding: '18px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', color: group.badgeColor, fontWeight: 'bold' }}>
                      {group.groupName}
                    </h4>
                    <span style={{ background: group.badgeBg, color: group.badgeColor, fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px' }}>
                      Tối đa {group.maxScore}đ
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {group.items.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#334155', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                        <span>• {item.name}</span>
                        <strong style={{ color: group.badgeColor, marginLeft: '8px', flexShrink: 0 }}>{item.max}đ</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Classification Mapping Table */}
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px' }}>
              Khung Phân Loại & Đề Xuất Thi Đua Khen Thưởng
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', marginBottom: '24px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', color: '#334155', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>Điểm KPI</th>
                  <th style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>Xếp loại KPI</th>
                  <th style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>Xếp loại Viên chức (NĐ 48/2023)</th>
                  <th style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>Danh hiệu Thi đua (Luật 2022)</th>
                  <th style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>Tỷ lệ khống chế</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#16a34a' }}>≥ 90 điểm</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Loại A</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>Hoàn thành xuất sắc nhiệm vụ</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>Chiến sĩ thi đua cơ sở / Giấy khen</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1', color: '#dc2626', fontWeight: 'bold' }}>≤ 20% Loại Tốt</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#0284c7' }}>75 – 89.5 điểm</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Loại B</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>Hoàn thành tốt nhiệm vụ</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>Lao động tiên tiến</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>Không khống chế</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#d97706' }}>50 – 74.5 điểm</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Loại C</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>Hoàn thành nhiệm vụ</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>Không bình xét</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>-</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#dc2626' }}>&lt; 50 điểm</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Loại D</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>Không hoàn thành nhiệm vụ</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>Không xét thi đua</td>
                  <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>-</td>
                </tr>
              </tbody>
            </table>

          </div>
        )}

      </div>

      {/* DETAILED SCORING MODAL */}
      {selectedStaffForModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', border: '1px solid #cbd5e1' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                  Phiếu Đánh Giá KPI Chi Tiết: {selectedStaffForModal.teacher_name}
                </h3>
                <span style={{ fontSize: '13px', opacity: 0.9 }}>
                  {selectedStaffForModal.teacher_title || 'Giáo viên'} • {selectedDept} • {selectedMonth} ({schoolYear})
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{modalCalculatedTotal.total}đ</span>
                <div style={{ fontSize: '12px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                  {modalCalculatedTotal.gradeName}
                </div>
              </div>
            </div>

            {/* Modal Form Content */}
            <div style={{ padding: '24px' }}>
              
              {/* Is Homeroom Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd', marginBottom: '20px' }}>
                <input
                  type="checkbox"
                  id="homeroomToggle"
                  checked={modalScores.is_homeroom}
                  onChange={(e) => setModalScores(prev => ({ ...prev, is_homeroom: e.target.checked }))}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="homeroomToggle" style={{ fontSize: '14px', fontWeight: '600', color: '#0369a1', cursor: 'pointer' }}>
                  Đồng chí có kiêm nhiệm Công tác Chủ nhiệm Lớp trong năm học
                </label>
              </div>

              {/* Group 1: Chuyên môn */}
              <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, color: '#0284c7', fontSize: '15px' }}>I. Chuyên Môn & Giảng Dạy</h4>
                  <span style={{ fontWeight: 'bold', color: '#0284c7' }}>{modalCalculatedTotal.teaching} / 45 điểm</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span>1. Soạn giáo án CV 5512, báo giảng & tiến độ PPCT (Tối đa 15đ):</span>
                      <strong>{modalScores.t1}đ</strong>
                    </div>
                    <input
                      type="range" min="0" max="15" step="0.5"
                      value={modalScores.t1}
                      onChange={(e) => setModalScores(prev => ({ ...prev, t1: parseFloat(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#0284c7' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span>2. Chất lượng giờ dạy, dự giờ & thao giảng chuyên đề (Tối đa 15đ):</span>
                      <strong>{modalScores.t2}đ</strong>
                    </div>
                    <input
                      type="range" min="0" max="15" step="0.5"
                      value={modalScores.t2}
                      onChange={(e) => setModalScores(prev => ({ ...prev, t2: parseFloat(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#0284c7' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span>3. Kiểm tra đánh giá ma trận, vào điểm CSDL đúng hạn (Tối đa 15đ):</span>
                      <strong>{modalScores.t3}đ</strong>
                    </div>
                    <input
                      type="range" min="0" max="15" step="0.5"
                      value={modalScores.t3}
                      onChange={(e) => setModalScores(prev => ({ ...prev, t3: parseFloat(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#0284c7' }}
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Chủ nhiệm / Kiêm nhiệm */}
              <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, color: '#16a34a', fontSize: '15px' }}>II. Công Tác Chủ Nhiệm & Kiêm Nhiệm</h4>
                  <span style={{ fontWeight: 'bold', color: '#16a34a' }}>{modalCalculatedTotal.homeroom} / 25 điểm</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span>1. Quản lý nề nếp lớp CN / Bồi dưỡng HSG / Phụ đạo (Tối đa 15đ):</span>
                      <strong>{modalScores.h1}đ</strong>
                    </div>
                    <input
                      type="range" min="0" max="15" step="0.5"
                      value={modalScores.h1}
                      onChange={(e) => setModalScores(prev => ({ ...prev, h1: parseFloat(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#16a34a' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span>2. Phối hợp PHHS / Tham gia hoạt động đoàn thể, giám sát (Tối đa 10đ):</span>
                      <strong>{modalScores.h2}đ</strong>
                    </div>
                    <input
                      type="range" min="0" max="10" step="0.5"
                      value={modalScores.h2}
                      onChange={(e) => setModalScores(prev => ({ ...prev, h2: parseFloat(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#16a34a' }}
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Đổi mới sáng tạo & CNTT */}
              <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, color: '#d97706', fontSize: '15px' }}>III. Đổi Mới Sáng Tạo & Chuyển Đổi Số</h4>
                  <span style={{ fontWeight: 'bold', color: '#d97706' }}>{modalCalculatedTotal.innovation} / 15 điểm</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span>1. Ứng dụng CNTT, học liệu số, ma trận trắc nghiệm 2025 (Tối đa 8đ):</span>
                      <strong>{modalScores.i1}đ</strong>
                    </div>
                    <input
                      type="range" min="0" max="8" step="0.5"
                      value={modalScores.i1}
                      onChange={(e) => setModalScores(prev => ({ ...prev, i1: parseFloat(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#d97706' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span>2. Sáng kiến kinh nghiệm / Bài giảng STEM, E-learning / Thi GV giỏi (Tối đa 7đ):</span>
                      <strong>{modalScores.i2}đ</strong>
                    </div>
                    <input
                      type="range" min="0" max="7" step="0.5"
                      value={modalScores.i2}
                      onChange={(e) => setModalScores(prev => ({ ...prev, i2: parseFloat(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#d97706' }}
                    />
                  </div>
                </div>
              </div>

              {/* Group 4: Kỷ cương & Đạo đức */}
              <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, color: '#9333ea', fontSize: '15px' }}>IV. Đạo Đức Nhà Giáo & Kỷ Cương Công Vụ</h4>
                  <span style={{ fontWeight: 'bold', color: '#9333ea' }}>{modalCalculatedTotal.discipline} / 15 điểm</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span>1. Chấp hành ngày giờ công, dự họp, coi thi nghiêm túc (Tối đa 8đ):</span>
                      <strong>{modalScores.d1}đ</strong>
                    </div>
                    <input
                      type="range" min="0" max="8" step="0.5"
                      value={modalScores.d1}
                      onChange={(e) => setModalScores(prev => ({ ...prev, d1: parseFloat(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#9333ea' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span>2. Tác phong sư phạm, quy chế dạy thêm, đoàn kết nội bộ (Tối đa 7đ):</span>
                      <strong>{modalScores.d2}đ</strong>
                    </div>
                    <input
                      type="range" min="0" max="7" step="0.5"
                      value={modalScores.d2}
                      onChange={(e) => setModalScores(prev => ({ ...prev, d2: parseFloat(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#9333ea' }}
                    />
                  </div>
                </div>
              </div>

              {/* Notes & Evidence */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Ghi chú đánh giá / Minh chứng thành tích trong tháng:
                </label>
                <textarea
                  rows={3}
                  value={modalScores.notes}
                  onChange={(e) => setModalScores(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ghi nhận thành tích nổi bật, bài thi thao giảng tốt, hoặc những điểm cần khắc phục..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedStaffForModal(null)}
                  style={{ padding: '10px 18px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalScores}
                  style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Xác Nhận Điểm
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
