import React, { useState, useMemo } from 'react';
import { 
  GitBranch, Users, BookOpen, ChevronRight, ChevronDown, CheckCircle2, 
  Clock, Award, FolderOpen, FileText, Download, Search, Filter, 
  Sparkles, ExternalLink, ShieldCheck, UserCheck, Layers, Calendar, 
  BarChart2, ArrowRight, CornerDownRight, Landmark
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Dữ liệu mẫu chuẩn cơ cấu 8 Tổ chuyên môn Trường THPT Cao Bá Quát
export const SCHOOL_DEPARTMENTS = [
  {
    id: 'toan_tin',
    name: 'Tổ Toán - Tin',
    shortName: 'Toán - Tin',
    color: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
    head: 'Cô Trần Thị Hoa',
    deputyHead: 'Thầy Nguyễn Văn Đạt',
    totalTeachers: 18,
    totalClassesTaught: 36,
    kpiScore: 98.5,
    driveFolderId: 'CBQ_DRIVE_TOAN_TIN',
    activities: {
      lessonPlan5512: { total: 72, submitted: 72, approved: 70, pending: 2, rate: '100%' },
      shcm: {
        lastMeeting: '15/10/2026',
        topic: 'Đổi mới phương pháp dạy học hàm số lượng giác theo định hướng ĐGNL & TN THPT 2026',
        host: 'Thầy Nguyễn Văn Đạt',
        status: 'Đã hoàn thành biên bản'
      },
      classInspection: { planned: 36, completed: 32, rateA: '91%', rateB: '9%' },
      hsgTeam: { studentCount: 24, leadTeacher: 'Cô Trần Thị Hoa', target: '4 Giải cấp Tỉnh' },
      nextEvent: 'Thao giảng chuyên đề ứng dụng GeoGebra và Python trong Toán 11 (25/10/2026)'
    },
    teachers: [
      { id: 'tt_1', name: 'Trần Thị Hoa', role: 'Tổ trưởng chuyên môn', subject: 'Toán', homeroom: '12A01', periodsPerWeek: 17, lessonPlanStatus: 'Đã duyệt 100%', classes: ['12A01', '12A02', '12A03'] },
      { id: 'tt_2', name: 'Nguyễn Văn Đạt', role: 'Tổ phó chuyên môn', subject: 'Toán', homeroom: '11A02', periodsPerWeek: 18, lessonPlanStatus: 'Đã duyệt 100%', classes: ['11A01', '11A02', '11A05'] },
      { id: 'tt_3', name: 'Lê Hoàng Anh', role: 'Giáo viên bộ môn', subject: 'Tin học', homeroom: '10A04', periodsPerWeek: 16, lessonPlanStatus: 'Đã duyệt 100%', classes: ['10A01', '10A02', '10A03', '10A04'] },
      { id: 'tt_4', name: 'Phạm Thị Thảo', role: 'Giáo viên bộ môn', subject: 'Toán', homeroom: null, periodsPerWeek: 17, lessonPlanStatus: 'Chờ duyệt 1 bài', classes: ['10A05', '10A06', '10A07'] },
      { id: 'tt_5', name: 'Vũ Quốc Cường', role: 'Giáo viên bộ môn', subject: 'Tin học', homeroom: '11A08', periodsPerWeek: 17, lessonPlanStatus: 'Đã duyệt 100%', classes: ['11A07', '11A08', '11A09', '11A10'] }
    ]
  },
  {
    id: 'ngu_van',
    name: 'Tổ Ngữ Văn',
    shortName: 'Ngữ Văn',
    color: '#e11d48',
    bgColor: '#fff1f2',
    borderColor: '#fecdd3',
    head: 'Thầy Phạm Đức Minh',
    deputyHead: 'Cô Hoàng Thị Hương',
    totalTeachers: 14,
    totalClassesTaught: 36,
    kpiScore: 97.8,
    driveFolderId: 'CBQ_DRIVE_NGU_VAN',
    activities: {
      lessonPlan5512: { total: 56, submitted: 56, approved: 55, pending: 1, rate: '100%' },
      shcm: {
        lastMeeting: '12/10/2026',
        topic: 'Dạy học văn bản nghị luận xã hội gắn với kỹ năng tranh biện và phân tích ngữ liệu ngoài SGK',
        host: 'Cô Hoàng Thị Hương',
        status: 'Đã hoàn thành biên bản'
      },
      classInspection: { planned: 28, completed: 25, rateA: '92%', rateB: '8%' },
      hsgTeam: { studentCount: 18, leadTeacher: 'Thầy Phạm Đức Minh', target: '3 Giải cấp Tỉnh' },
      nextEvent: 'Hội thảo Sáng tác thơ văn & Văn hóa đọc học sinh Cao Bá Quát (28/10/2026)'
    },
    teachers: [
      { id: 'nv_1', name: 'Phạm Đức Minh', role: 'Tổ trưởng chuyên môn', subject: 'Ngữ văn', homeroom: '12A04', periodsPerWeek: 16, lessonPlanStatus: 'Đã duyệt 100%', classes: ['12A04', '12A05', '12A06'] },
      { id: 'nv_2', name: 'Hoàng Thị Hương', role: 'Tổ phó chuyên môn', subject: 'Ngữ văn', homeroom: '11A01', periodsPerWeek: 17, lessonPlanStatus: 'Đã duyệt 100%', classes: ['11A01', '11A03', '11A04'] },
      { id: 'nv_3', name: 'Đỗ Thị Kim Oanh', role: 'Giáo viên bộ môn', subject: 'Ngữ văn', homeroom: null, periodsPerWeek: 18, lessonPlanStatus: 'Đã duyệt 100%', classes: ['10A08', '10A09', '10A10'] },
      { id: 'nv_4', name: 'Bùi Thị Hà', role: 'Giáo viên bộ môn', subject: 'Ngữ văn', homeroom: '10A02', periodsPerWeek: 17, lessonPlanStatus: 'Chờ duyệt 1 bài', classes: ['10A02', '10A03', '10A05'] }
    ]
  },
  {
    id: 'tieng_anh',
    name: 'Tổ Ngoại Ngữ',
    shortName: 'Ngoại Ngữ (Tiếng Anh)',
    color: '#059669',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    head: 'Cô Vũ Thị Lan',
    deputyHead: 'Thầy Bùi Quang Hưng',
    totalTeachers: 12,
    totalClassesTaught: 36,
    kpiScore: 99.0,
    driveFolderId: 'CBQ_DRIVE_NGOAI_NGU',
    activities: {
      lessonPlan5512: { total: 48, submitted: 48, approved: 48, pending: 0, rate: '100%' },
      shcm: {
        lastMeeting: '14/10/2026',
        topic: 'Tích hợp tài liệu IELTS và định dạng bài thi tốt nghiệp THPT 2026 môn Tiếng Anh',
        host: 'Cô Vũ Thị Lan',
        status: 'Đã hoàn thành biên bản'
      },
      classInspection: { planned: 24, completed: 22, rateA: '95%', rateB: '5%' },
      hsgTeam: { studentCount: 16, leadTeacher: 'Thầy Bùi Quang Hưng', target: '5 Giải cấp Tỉnh, 2 chứng chỉ IELTS 7.5+' },
      nextEvent: 'Cuộc thi Hùng biện Tiếng Anh CBQ English Speaking Contest 2026 (02/11/2026)'
    },
    teachers: [
      { id: 'nn_1', name: 'Vũ Thị Lan', role: 'Tổ trưởng chuyên môn', subject: 'Tiếng Anh', homeroom: '12A07', periodsPerWeek: 16, lessonPlanStatus: 'Đã duyệt 100%', classes: ['12A07', '12A08', '12A09'] },
      { id: 'nn_2', name: 'Bùi Quang Hưng', role: 'Tổ phó chuyên môn', subject: 'Tiếng Anh', homeroom: '11A06', periodsPerWeek: 17, lessonPlanStatus: 'Đã duyệt 100%', classes: ['11A06', '11A07', '11A11'] },
      { id: 'nn_3', name: 'Lê Thu Trang', role: 'Giáo viên bộ môn', subject: 'Tiếng Anh', homeroom: '10A01', periodsPerWeek: 17, lessonPlanStatus: 'Đã duyệt 100%', classes: ['10A01', '10A06', '10A11'] }
    ]
  },
  {
    id: 'vat_ly_cn',
    name: 'Tổ KHTN - Vật Lý & Công Nghệ',
    shortName: 'Vật Lý & Công Nghệ',
    color: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    head: 'Thầy Đặng Văn Long',
    deputyHead: 'Cô Lê Thị Mỹ',
    totalTeachers: 10,
    totalClassesTaught: 36,
    kpiScore: 96.5,
    driveFolderId: 'CBQ_DRIVE_VAT_LY',
    activities: {
      lessonPlan5512: { total: 40, submitted: 40, approved: 39, pending: 1, rate: '100%' },
      shcm: {
        lastMeeting: '10/10/2026',
        topic: 'Tổ chức hoạt động trải nghiệm STEM Chế tạo Robot và Mô hình Năng lượng tái tạo',
        host: 'Thầy Đặng Văn Long',
        status: 'Đã hoàn thành biên bản'
      },
      classInspection: { planned: 20, completed: 18, rateA: '89%', rateB: '11%' },
      hsgTeam: { studentCount: 14, leadTeacher: 'Thầy Đặng Văn Long', target: '3 Giải HSG Tỉnh & 1 Đề tài KHKT' },
      nextEvent: 'Ngày hội Trưng bày Sản phẩm Sáng tạo STEM - Vật lý (10/11/2026)'
    },
    teachers: [
      { id: 'vl_1', name: 'Đặng Văn Long', role: 'Tổ trưởng chuyên môn', subject: 'Vật lý', homeroom: '12A02', periodsPerWeek: 17, lessonPlanStatus: 'Đã duyệt 100%', classes: ['12A01', '12A02', '12A03'] },
      { id: 'vl_2', name: 'Lê Thị Mỹ', role: 'Tổ phó chuyên môn', subject: 'Công nghệ', homeroom: '11A05', periodsPerWeek: 16, lessonPlanStatus: 'Đã duyệt 100%', classes: ['11A02', '11A05', '11A08'] },
      { id: 'vl_3', name: 'Nguyễn Văn Tuấn', role: 'Giáo viên bộ môn', subject: 'Vật lý', homeroom: null, periodsPerWeek: 18, lessonPlanStatus: 'Chờ duyệt 1 bài', classes: ['10A03', '10A07', '10A12'] }
    ]
  },
  {
    id: 'hoa_hoc',
    name: 'Tổ KHTN - Hóa Học',
    shortName: 'Hóa Học',
    color: '#7c3aed',
    bgColor: '#faf5ff',
    borderColor: '#ddd6fe',
    head: 'Cô Đỗ Thị Tuyết',
    deputyHead: 'Thầy Lê Thanh Sơn',
    totalTeachers: 9,
    totalClassesTaught: 36,
    kpiScore: 97.2,
    driveFolderId: 'CBQ_DRIVE_HOA_HOC',
    activities: {
      lessonPlan5512: { total: 36, submitted: 36, approved: 36, pending: 0, rate: '100%' },
      shcm: {
        lastMeeting: '13/10/2026',
        topic: 'Quy trình an toàn phòng thí nghiệm và dạy học Hóa học thực nghiệm theo CT GDPT 2018',
        host: 'Cô Đỗ Thị Tuyết',
        status: 'Đã hoàn thành biên bản'
      },
      classInspection: { planned: 18, completed: 16, rateA: '93%', rateB: '7%' },
      hsgTeam: { studentCount: 12, leadTeacher: 'Thầy Lê Thanh Sơn', target: '3 Giải cấp Tỉnh' },
      nextEvent: 'Thí nghiệm biểu diễn phản ứng Hóa học vui chào mừng 20/11'
    },
    teachers: [
      { id: 'hh_1', name: 'Đỗ Thị Tuyết', role: 'Tổ trưởng chuyên môn', subject: 'Hóa học', homeroom: '12A05', periodsPerWeek: 16, lessonPlanStatus: 'Đã duyệt 100%', classes: ['12A04', '12A05', '12A06'] },
      { id: 'hh_2', name: 'Lê Thanh Sơn', role: 'Tổ phó chuyên môn', subject: 'Hóa học', homeroom: '11A03', periodsPerWeek: 17, lessonPlanStatus: 'Đã duyệt 100%', classes: ['11A01', '11A03', '11A09'] }
    ]
  },
  {
    id: 'sinh_hoc',
    name: 'Tổ KHTN - Sinh Học',
    shortName: 'Sinh Học',
    color: '#0891b2',
    bgColor: '#ecfeff',
    borderColor: '#a5f3fc',
    head: 'Thầy Ngô Văn Hùng',
    deputyHead: 'Cô Phan Thị Thu',
    totalTeachers: 8,
    totalClassesTaught: 36,
    kpiScore: 98.0,
    driveFolderId: 'CBQ_DRIVE_SINH_HOC',
    activities: {
      lessonPlan5512: { total: 32, submitted: 32, approved: 32, pending: 0, rate: '100%' },
      shcm: {
        lastMeeting: '09/10/2026',
        topic: 'Phương pháp phân tích phả hệ và di truyền học phân tử thế hệ mới trong đề thi TN THPT',
        host: 'Thầy Ngô Văn Hùng',
        status: 'Đã hoàn thành biên bản'
      },
      classInspection: { planned: 16, completed: 15, rateA: '94%', rateB: '6%' },
      hsgTeam: { studentCount: 12, leadTeacher: 'Thầy Ngô Văn Hùng', target: '3 Giải cấp Tỉnh' },
      nextEvent: 'Dự án Sinh thái Vườn thuốc Nam & Môi trường xanh học đường'
    },
    teachers: [
      { id: 'sh_1', name: 'Ngô Văn Hùng', role: 'Tổ trưởng chuyên môn', subject: 'Sinh học', homeroom: '12A06', periodsPerWeek: 17, lessonPlanStatus: 'Đã duyệt 100%', classes: ['12A01', '12A06', '12A10'] },
      { id: 'sh_2', name: 'Phan Thị Thu', role: 'Tổ phó chuyên môn', subject: 'Sinh học', homeroom: '10A07', periodsPerWeek: 16, lessonPlanStatus: 'Đã duyệt 100%', classes: ['10A05', '10A07', '10A11'] }
    ]
  },
  {
    id: 'khxh',
    name: 'Tổ KHXH - Sử - Địa - GDKT&PL',
    shortName: 'Sử - Địa - GDKT-PL',
    color: '#c2410c',
    bgColor: '#fff7ed',
    borderColor: '#fed7aa',
    head: 'Thầy Lương Văn Chiến',
    deputyHead: 'Cô Nguyễn Thị Thảo',
    totalTeachers: 13,
    totalClassesTaught: 36,
    kpiScore: 97.4,
    driveFolderId: 'CBQ_DRIVE_KHXH',
    activities: {
      lessonPlan5512: { total: 52, submitted: 52, approved: 51, pending: 1, rate: '100%' },
      shcm: {
        lastMeeting: '11/10/2026',
        topic: 'Dạy học Lịch sử địa phương Đắk Lắk và lồng ghép giáo dục pháp luật phòng chống tệ nạn',
        host: 'Thầy Lương Văn Chiến',
        status: 'Đã hoàn thành biên bản'
      },
      classInspection: { planned: 26, completed: 23, rateA: '91%', rateB: '9%' },
      hsgTeam: { studentCount: 20, leadTeacher: 'Thầy Lương Văn Chiến', target: '4 Giải cấp Tỉnh' },
      nextEvent: 'Hành trình Về nguồn Địa chỉ đỏ tại Di tích Nhà đày Buôn Ma Thuột'
    },
    teachers: [
      { id: 'xh_1', name: 'Lương Văn Chiến', role: 'Tổ trưởng chuyên môn', subject: 'Lịch sử', homeroom: '12A11', periodsPerWeek: 17, lessonPlanStatus: 'Đã duyệt 100%', classes: ['12A09', '12A11', '12A12'] },
      { id: 'xh_2', name: 'Nguyễn Thị Thảo', role: 'Tổ phó chuyên môn', subject: 'Địa lý', homeroom: '11A10', periodsPerWeek: 16, lessonPlanStatus: 'Đã duyệt 100%', classes: ['11A08', '11A10', '11A12'] },
      { id: 'xh_3', name: 'Vũ Minh Đức', role: 'Giáo viên bộ môn', subject: 'GDKT-PL', homeroom: '10A09', periodsPerWeek: 17, lessonPlanStatus: 'Chờ duyệt 1 bài', classes: ['10A08', '10A09', '10A10'] }
    ]
  },
  {
    id: 'the_chat_qp',
    name: 'Tổ GD Thể Chất & GDQP-AN',
    shortName: 'Thể Chất & GDQP-AN',
    color: '#047857',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    head: 'Thầy Trần Quốc Tuấn',
    deputyHead: 'Thầy Phạm Minh Trí',
    totalTeachers: 8,
    totalClassesTaught: 36,
    kpiScore: 98.6,
    driveFolderId: 'CBQ_DRIVE_THE_CHAT',
    activities: {
      lessonPlan5512: { total: 32, submitted: 32, approved: 32, pending: 0, rate: '100%' },
      shcm: {
        lastMeeting: '08/10/2026',
        topic: 'Phương pháp huấn luyện kỹ thuật tháo lắp súng tiểu liên AK và kỹ thuật ném lựu đạn trúng đích',
        host: 'Thầy Trần Quốc Tuấn',
        status: 'Đã hoàn thành biên bản'
      },
      classInspection: { planned: 16, completed: 16, rateA: '96%', rateB: '4%' },
      hsgTeam: { studentCount: 22, leadTeacher: 'Thầy Phạm Minh Trí', target: 'Nhất toàn đoàn Hội thao HKPĐ cấp Tỉnh' },
      nextEvent: 'Lễ xuất quân tham dự Hội khỏe Phù Đổng và Hội thao Quốc phòng cấp Tỉnh 2026'
    },
    teachers: [
      { id: 'tc_1', name: 'Trần Quốc Tuấn', role: 'Tổ trưởng chuyên môn', subject: 'GDQP-AN', homeroom: null, periodsPerWeek: 18, lessonPlanStatus: 'Đã duyệt 100%', classes: ['12A01', '12A02', '12A03', '12A04'] },
      { id: 'tc_2', name: 'Phạm Minh Trí', role: 'Tổ phó chuyên môn', subject: 'GD Thể chất', homeroom: '11A04', periodsPerWeek: 17, lessonPlanStatus: 'Đã duyệt 100%', classes: ['11A03', '11A04', '11A05', '11A06'] }
    ]
  }
];

export default function DepartmentOrganizationalTree() {
  const [selectedDeptId, setSelectedDeptId] = useState('toan_tin');
  const [expandedLevels, setExpandedLevels] = useState({
    bgh: true,
    depts: true,
    teachers: true,
    classes: false
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeActivityTab, setActiveActivityTab] = useState('lessonPlan'); // 'lessonPlan' | 'shcm' | 'inspection' | 'hsg'

  const activeDept = useMemo(() => {
    return SCHOOL_DEPARTMENTS.find(d => d.id === selectedDeptId) || SCHOOL_DEPARTMENTS[0];
  }, [selectedDeptId]);

  // Bộ lọc tìm kiếm giáo viên / tổ
  const filteredDepartments = useMemo(() => {
    if (!searchKeyword.trim()) return SCHOOL_DEPARTMENTS;
    const kw = searchKeyword.toLowerCase();
    return SCHOOL_DEPARTMENTS.filter(d => 
      d.name.toLowerCase().includes(kw) ||
      d.head.toLowerCase().includes(kw) ||
      d.deputyHead.toLowerCase().includes(kw) ||
      d.teachers.some(t => t.name.toLowerCase().includes(kw) || t.subject.toLowerCase().includes(kw))
    );
  }, [searchKeyword]);

  // Xuất Báo cáo Cơ cấu Tổ Chuyên Môn & Hoạt Động (Excel theo quy tắc GEMINI.md)
  const handleExportTreeReport = () => {
    const exportData = [];

    SCHOOL_DEPARTMENTS.forEach(dept => {
      dept.teachers.forEach(t => {
        exportData.push({
          'Tổ Chuyên Môn': dept.name,
          'Tổ Trưởng': dept.head,
          'Tổ Phó': dept.deputyHead,
          'Họ Và Tên Giáo Viên': t.name,
          'Vai Trò Trong Tổ': t.role,
          'Môn Phụ Trách': t.subject,
          'Chủ Nhiệm Lớp': t.homeroom || 'Không',
          'Số Tiết / Tuần': t.periodsPerWeek,
          'Tiến Độ Kế Hoạch 5512': t.lessonPlanStatus,
          'Các Lớp Giảng Dạy': t.classes.join(', '),
          'Điểm Đánh Giá KPI Tổ': `${dept.kpiScore}/100`,
          'Sinh Hoạt Chuyên Môn Gần Nhất': dept.activities.shcm.topic,
          'Kế Hoạch Bồi Dưỡng HSG': dept.activities.hsgTeam.target
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CoCau_ToChuyenMon");

    const todayStr = new Date().toISOString().split('T')[0];
    const fileName = `1-Bao_cao_co_cau_to_chuyen_mon_va_hoat_dong_CBQ_${todayStr}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: '20px', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '8px' }}>
              <GitBranch size={15} color="#38bdf8" /> CÂY PHÂN CẤP ĐIỀU HÀNH 4 TẦNG (BGH ➔ 8 TỔ ➔ GV ➔ LỚP)
            </div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#ffffff', letterSpacing: '0.3px' }}>
              CƠ CẤU TỔ CHỨC & BẢNG THEO DÕI HOẠT ĐỘNG 8 TỔ CHUYÊN MÔN
            </h2>
            <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#94a3b8' }}>
              Phân định thẩm quyền rõ ràng: Ban Giám Hiệu chỉ đạo • Tổ trưởng duyệt giáo án 5512 & SHCM • Giáo viên thực hiện giảng dạy & chủ nhiệm.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleExportTreeReport}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}
            >
              <Download size={15} /> Xuất Báo Cáo Cơ Cấu Tổ (Excel)
            </button>
          </div>
        </div>
      </div>

      {/* TOP INTERACTIVE LEVEL 1: BAN GIÁM HIỆU & THƯ KÝ */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#fef3c7', padding: '8px', borderRadius: '8px' }}>
              <Landmark size={22} color="#b45309" />
            </div>
            <div>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TẦNG 1: ĐIỀU HÀNH TỔNG THỂ</span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                HỘI ĐỒNG BAN GIÁM HIỆU & THƯ KÝ NHÀ TRƯỜNG
              </h3>
            </div>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>3 Cán bộ QL + 1 Thư ký Hội đồng</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div style={styles.execCard('#eff6ff', '#1d4ed8', '#bfdbfe')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={styles.avatarCircle('#1d4ed8')}>LT</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e3a8a' }}>ThS. Lê Thị Thảo</div>
                <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600' }}>Hiệu trưởng - Bí thư Chi bộ</div>
              </div>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
              Phụ trách chung toàn diện: Chiến lược phát triển, tài chính, quy hoạch nhân sự & phát ngôn đối ngoại.
            </p>
          </div>

          <div style={styles.execCard('#f0fdf4', '#15803d', '#bbf7d0')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={styles.avatarCircle('#15803d')}>NV</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#14532d' }}>ThS. Nguyễn Văn Nam</div>
                <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>Phó Hiệu trưởng (Chuyên môn)</div>
              </div>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
              Chỉ đạo trực tiếp 8 Tổ chuyên môn: Kế hoạch bài dạy 5512, Đổi mới PPDH, Ôn thi Tốt nghiệp THPT & HSG.
            </p>
          </div>

          <div style={styles.execCard('#fffbeb', '#b45309', '#fde68a')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={styles.avatarCircle('#b45309')}>HT</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#78350f' }}>ThS. Hoàng Văn Tuấn</div>
                <div style={{ fontSize: '12px', color: '#d97706', fontWeight: '600' }}>Phó Hiệu trưởng (Cơ sở vật chất)</div>
              </div>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
              Phụ trách CSVC, an toàn trường học, phong trào Đoàn thanh niên, quản lý xe máy và các câu lạc bộ.
            </p>
          </div>

          <div style={styles.execCard('#faf5ff', '#7e22ce', '#e9d5ff')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={styles.avatarCircle('#7e22ce')}>TM</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#581c87' }}>Cô Trần Thị Mai Anh</div>
                <div style={{ fontSize: '12px', color: '#9333ea', fontWeight: '600' }}>Thư ký Hội đồng Nhà trường</div>
              </div>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
              Tổng hợp sổ sách, báo cáo điều hành hàng ngày cho BGH, kiểm tra lịch báo giảng & xuất dữ liệu thi đua.
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH AND DEPARTMENT SELECTOR BAR */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        padding: '16px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TẦNG 2: 8 TỔ CHUYÊN MÔN</span>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
              DANH SÁCH 8 TỔ CHUYÊN MÔN GDPT 2018 (Nhấp chọn để xem hoạt động chi tiết)
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '280px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Tìm giáo viên, môn, hoặc tổ..."
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* 8 DEPARTMENT BUTTONS PILLS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          {filteredDepartments.map(dept => {
            const isSelected = dept.id === selectedDeptId;
            return (
              <button
                key={dept.id}
                onClick={() => setSelectedDeptId(dept.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: `2px solid ${isSelected ? dept.color : '#e2e8f0'}`,
                  backgroundColor: isSelected ? dept.bgColor : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? `0 4px 12px ${dept.color}25` : 'none'
                }}
              >
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: isSelected ? dept.color : '#1e293b' }}>
                    {dept.name}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                    TT: <b>{dept.head}</b> ({dept.totalTeachers} GV)
                  </div>
                </div>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: isSelected ? dept.color : '#f1f5f9',
                  color: isSelected ? '#ffffff' : '#475569',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  {dept.kpiScore}đ
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECTED DEPARTMENT DETAILED EXPANDED VIEW */}
      {activeDept && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          border: `1.5px solid ${activeDept.borderColor}`,
          padding: '22px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}>
          
          {/* DEPT HEADER INFO */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ backgroundColor: activeDept.bgColor, border: `1px solid ${activeDept.borderColor}`, padding: '12px', borderRadius: '12px' }}>
                <BookOpen size={28} color={activeDept.color} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: '800', color: activeDept.color, textTransform: 'uppercase' }}>HỒ SƠ TỔ CHUYÊN MÔN</span>
                  <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>Chuẩn GDPT 2018</span>
                </div>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>
                  {activeDept.name} • THPT CAO BÁ QUÁT
                </h3>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', color: '#64748b', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span>Tổ trưởng: <strong style={{ color: '#0f172a' }}>{activeDept.head}</strong></span>
                  <span>•</span>
                  <span>Tổ phó: <strong style={{ color: '#0f172a' }}>{activeDept.deputyHead}</strong></span>
                  <span>•</span>
                  <span>Quy mô: <strong style={{ color: '#0f172a' }}>{activeDept.totalTeachers} Giáo viên</strong> (Phụ trách {activeDept.totalClassesTaught} lớp)</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <a 
                href="/admin/department-drives" 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '8px 14px', 
                  backgroundColor: activeDept.bgColor, 
                  color: activeDept.color, 
                  borderRadius: '8px', 
                  border: `1px solid ${activeDept.borderColor}`,
                  fontSize: '12.5px', 
                  fontWeight: 'bold', 
                  textDecoration: 'none' 
                }}
              >
                <FolderOpen size={15} /> Kho Drive Hồ Sơ Tổ
              </a>
            </div>
          </div>

          {/* ACTIVITY TABS BAR */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', borderBottom: '2px solid #f1f5f9', gap: '8px', paddingBottom: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveActivityTab('lessonPlan')}
                style={styles.activityTabBtn(activeActivityTab === 'lessonPlan', activeDept.color)}
              >
                <FileText size={15} /> 1. Kế Hoạch Bài Dạy (CV 5512)
              </button>
              <button
                onClick={() => setActiveActivityTab('shcm')}
                style={styles.activityTabBtn(activeActivityTab === 'shcm', activeDept.color)}
              >
                <Users size={15} /> 2. Sinh Hoạt Chuyên Môn (SHCM)
              </button>
              <button
                onClick={() => setActiveActivityTab('inspection')}
                style={styles.activityTabBtn(activeActivityTab === 'inspection', activeDept.color)}
              >
                <CheckCircle2 size={15} /> 3. Dự Giờ & Thao Giảng
              </button>
              <button
                onClick={() => setActiveActivityTab('hsg')}
                style={styles.activityTabBtn(activeActivityTab === 'hsg', activeDept.color)}
              >
                <Award size={15} /> 4. Bồi Dưỡng HSG & KHKT
              </button>
            </div>

            {/* TAB CONTENT: 1. LESSON PLAN 5512 */}
            {activeActivityTab === 'lessonPlan' && (
              <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div style={styles.metricCard('#f0fdf4', '#15803d')}>
                  <span style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>Tỷ Lệ Nộp Giáo Án Đúng Hạn</span>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#14532d', marginTop: '4px' }}>
                    {activeDept.activities.lessonPlan5512.rate}
                  </div>
                  <span style={{ fontSize: '11px', color: '#16a34a' }}>100% giáo viên nộp đúng quy định</span>
                </div>

                <div style={styles.metricCard('#eff6ff', '#1d4ed8')}>
                  <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: 'bold' }}>Tổng Số Kế Hoạch Đã Nộp</span>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e3a8a', marginTop: '4px' }}>
                    {activeDept.activities.lessonPlan5512.submitted} / {activeDept.activities.lessonPlan5512.total}
                  </div>
                  <span style={{ fontSize: '11px', color: '#3b82f6' }}>Kế hoạch bài dạy từ tuần 1 - tuần hiện tại</span>
                </div>

                <div style={styles.metricCard('#faf5ff', '#7e22ce')}>
                  <span style={{ fontSize: '12px', color: '#6b21a8', fontWeight: 'bold' }}>Tổ Trưởng / BGH Đã Duyệt</span>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#581c87', marginTop: '4px' }}>
                    {activeDept.activities.lessonPlan5512.approved} bài
                  </div>
                  <span style={{ fontSize: '11px', color: '#9333ea' }}>Đạt chuẩn định dạng Công văn 5512</span>
                </div>

                <div style={styles.metricCard('#fffbeb', '#b45309')}>
                  <span style={{ fontSize: '12px', color: '#a16207', fontWeight: 'bold' }}>Chờ Duyệt Bổ Sung</span>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#78350f', marginTop: '4px' }}>
                    {activeDept.activities.lessonPlan5512.pending} bài
                  </div>
                  <span style={{ fontSize: '11px', color: '#ca8a04' }}>Đang chờ tổ trưởng góp ý hoàn thiện</span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. SHCM */}
            {activeActivityTab === 'shcm' && (
              <div style={{ marginTop: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Calendar size={18} color="#0284c7" />
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>Buổi Sinh Hoạt Chuyên Môn Định Kỳ (Nghiên cứu bài học)</strong>
                  <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '11.5px', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                    {activeDept.activities.shcm.status}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                  <p style={{ margin: '4px 0' }}>• <b>Ngày họp:</b> {activeDept.activities.shcm.lastMeeting}</p>
                  <p style={{ margin: '4px 0' }}>• <b>Chuyên đề trọng tâm:</b> <span style={{ color: '#0369a1', fontWeight: '700' }}>{activeDept.activities.shcm.topic}</span></p>
                  <p style={{ margin: '4px 0' }}>• <b>Chủ trì & Báo cáo viên:</b> {activeDept.activities.shcm.host}</p>
                  <p style={{ margin: '4px 0' }}>• <b>Sự kiện chuyên môn kế tiếp:</b> <span style={{ color: '#d97706', fontWeight: 'bold' }}>{activeDept.activities.nextEvent}</span></p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 3. INSPECTION & OBSERVATION */}
            {activeActivityTab === 'inspection' && (
              <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div style={styles.metricCard('#f0fdf4', '#15803d')}>
                  <span style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>Tiến Độ Dự Giờ Học Kỳ</span>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#14532d', marginTop: '4px' }}>
                    {activeDept.activities.classInspection.completed} / {activeDept.activities.classInspection.planned} tiết
                  </div>
                  <span style={{ fontSize: '11px', color: '#16a34a' }}>Đạt {(activeDept.activities.classInspection.completed / activeDept.activities.classInspection.planned * 100).toFixed(0)}% chỉ tiêu học kỳ</span>
                </div>

                <div style={styles.metricCard('#eff6ff', '#1d4ed8')}>
                  <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: 'bold' }}>Tỷ Lệ Giờ Dạy Loại Giỏi (A)</span>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e3a8a', marginTop: '4px' }}>
                    {activeDept.activities.classInspection.rateA}
                  </div>
                  <span style={{ fontSize: '11px', color: '#3b82f6' }}>Đánh giá theo chuẩn phiếu dự giờ của Sở</span>
                </div>

                <div style={styles.metricCard('#fffbeb', '#b45309')}>
                  <span style={{ fontSize: '12px', color: '#a16207', fontWeight: 'bold' }}>Tỷ Lệ Giờ Dạy Loại Khá (B)</span>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#78350f', marginTop: '4px' }}>
                    {activeDept.activities.classInspection.rateB}
                  </div>
                  <span style={{ fontSize: '11px', color: '#ca8a04' }}>0% giờ dạy xếp loại Đạt/Chưa đạt</span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 4. HSG TEAM */}
            {activeActivityTab === 'hsg' && (
              <div style={{ marginTop: '16px', backgroundColor: '#fdf4ff', padding: '16px', borderRadius: '10px', border: '1px solid #f0abfc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Award size={18} color="#a21caf" />
                  <strong style={{ fontSize: '14px', color: '#701a75' }}>Đội Tuyển Bồi Dưỡng Học Sinh Giỏi & Sáng Tạo Khoa Học Kỹ Thuật</strong>
                </div>
                <div style={{ fontSize: '13px', color: '#4a044e', lineHeight: 1.5 }}>
                  <p style={{ margin: '4px 0' }}>• <b>Số lượng học sinh đội tuyển:</b> <strong>{activeDept.activities.hsgTeam.studentCount} học sinh</strong> (Khối 10, 11, 12)</p>
                  <p style={{ margin: '4px 0' }}>• <b>Giáo viên phụ trách bồi dưỡng:</b> {activeDept.activities.hsgTeam.leadTeacher}</p>
                  <p style={{ margin: '4px 0' }}>• <b>Mục tiêu chỉ tiêu phấn đấu:</b> <span style={{ color: '#be185d', fontWeight: 'bold' }}>{activeDept.activities.hsgTeam.target}</span></p>
                </div>
              </div>
            )}
          </div>

          {/* TẦNG 3: NHÂN SỰ GIÁO VIÊN & PHÂN CÔNG GIẢNG DẠY */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>TẦNG 3 & 4: GIÁO VIÊN ➔ LỚP PHỤ TRÁCH</span>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                  DANH SÁCH GIÁO VIÊN & LỊCH PHÂN CÔNG GIẢNG DẠY TRONG TỔ
                </h4>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Hiển thị {activeDept.teachers.length} giáo viên đại diện</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '10px 12px', fontWeight: '700' }}>Giáo Viên</th>
                    <th style={{ padding: '10px 12px', fontWeight: '700' }}>Vai Trò Trong Tổ</th>
                    <th style={{ padding: '10px 12px', fontWeight: '700' }}>Môn Dạy</th>
                    <th style={{ padding: '10px 12px', fontWeight: '700' }}>Chủ Nhiệm</th>
                    <th style={{ padding: '10px 12px', fontWeight: '700' }}>Tiết/Tuần</th>
                    <th style={{ padding: '10px 12px', fontWeight: '700' }}>Kế Hoạch 5512</th>
                    <th style={{ padding: '10px 12px', fontWeight: '700' }}>Lớp Phụ Trách (Tầng 4)</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDept.teachers.map((teacher, index) => (
                    <tr key={teacher.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: index % 2 === 0 ? '#ffffff' : '#fcfcfc' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f172a' }}>
                        {teacher.name}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          backgroundColor: teacher.role.includes('Tổ trưởng') ? '#dbeafe' : teacher.role.includes('Tổ phó') ? '#e0e7ff' : '#f1f5f9',
                          color: teacher.role.includes('Tổ trưởng') ? '#1d4ed8' : teacher.role.includes('Tổ phó') ? '#4338ca' : '#475569'
                        }}>
                          {teacher.role}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155' }}>{teacher.subject}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {teacher.homeroom ? (
                          <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11.5px' }}>
                            Lớp {teacher.homeroom}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: '600' }}>{teacher.periodsPerWeek} tiết</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: teacher.lessonPlanStatus.includes('100%') ? '#16a34a' : '#d97706',
                          fontWeight: '600',
                          fontSize: '12px'
                        }}>
                          <CheckCircle2 size={13} /> {teacher.lessonPlanStatus}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {teacher.classes.map(cls => (
                            <span key={cls} style={{
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              padding: '1px 6px',
                              fontSize: '11px',
                              color: '#334155',
                              fontWeight: '600'
                            }}>
                              {cls}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  execCard: (bg, border, circleBg) => ({
    backgroundColor: bg,
    border: `1px solid ${circleBg}`,
    borderRadius: '10px',
    padding: '14px',
    transition: 'all 0.2s ease'
  }),
  avatarCircle: (bg) => ({
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: bg,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '13px'
  }),
  activityTabBtn: (active, color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: active ? color : '#f8fafc',
    color: active ? '#ffffff' : '#475569',
    fontWeight: '700',
    fontSize: '12.5px',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  }),
  metricCard: (bg, color) => ({
    backgroundColor: bg,
    padding: '12px 14px',
    borderRadius: '10px',
    border: `1px solid ${bg === '#ffffff' ? '#e2e8f0' : 'transparent'}`
  })
};
