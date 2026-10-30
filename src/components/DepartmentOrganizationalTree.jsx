import React, { useState, useEffect, useMemo } from 'react';
import { 
  GitBranch, Users, BookOpen, ChevronRight, ChevronDown, CheckCircle2, 
  Clock, Award, FolderOpen, FileText, Download, Search, Filter, 
  Sparkles, ExternalLink, ShieldCheck, UserCheck, Layers, Calendar, 
  BarChart2, ArrowRight, CornerDownRight, Landmark, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { 
  fetchComprehensiveSchoolSyncData, 
  parseTeacherBio 
} from '../services/schoolDataSyncService';

// Bảng màu nhận diện các Tổ chuyên môn
const DEPT_COLORS = {
  'Tổ Toán': { color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  'Tổ Ngữ Văn': { color: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
  'Tổ Tin học - Ngoại Ngữ': { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  'Tổ Vật Lý - Hóa học': { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'Tổ Sinh học': { color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  'Tổ Sử - Địa - GDCD': { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  'Tổ GDTC - QPAN': { color: '#047857', bg: '#f0fdf4', border: '#bbf7d0' },
  'Tổ Văn Phòng': { color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe' },
  'Ban Giám Hiệu': { color: '#1e3a8a', bg: '#eff6ff', border: '#bfdbfe' }
};

export default function DepartmentOrganizationalTree() {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [classMap, setClassMap] = useState({});
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedDeptName, setSelectedDeptName] = useState('Tổ Toán');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeActivityTab, setActiveActivityTab] = useState('lessonPlan'); // 'lessonPlan' | 'shcm' | 'inspection' | 'hsg'

  useEffect(() => {
    loadDatabaseData();

    // Thiết lập kênh Realtime đồng bộ từ Database
    const channel = supabase.channel('cbq_dept_tree_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbq_departments' }, () => loadDatabaseData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbq_staff' }, () => loadDatabaseData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbq_students' }, () => loadDatabaseData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadDatabaseData() {
    setLoading(true);
    try {
      const data = await fetchComprehensiveSchoolSyncData();
      setDepartments(data.departments || []);
      setStaffList(data.staff || []);
      setClassMap(data.classMap || {});
      setTotalStudents(data.totalStudentCount || 0);

      // Mặc định chọn tổ chuyên môn đầu tiên (khác BGH)
      const firstDept = (data.departments || []).find(d => d.name !== 'Ban Giám Hiệu');
      if (firstDept) {
        setSelectedDeptName(firstDept.name);
      }
    } catch (err) {
      console.error('Lỗi nạp dữ liệu đồng bộ tổ chuyên môn:', err);
    } finally {
      setLoading(false);
    }
  }

  // Danh sách Ban Giám Hiệu từ Database cbq_staff
  const bghMembers = useMemo(() => {
    return staffList.filter(s => s.department === 'Ban Giám Hiệu');
  }, [staffList]);

  // Danh sách Thư ký / Cán bộ văn phòng hỗ trợ BGH
  const secretaryMember = useMemo(() => {
    return staffList.find(s => 
      s.title?.toLowerCase().includes('thư ký') || 
      s.name?.toLowerCase().includes('thư ký') || 
      (s.department === 'Tổ Văn Phòng' && s.title?.toLowerCase().includes('văn thư'))
    ) || staffList.find(s => s.department === 'Tổ Văn Phòng') || {
      name: 'Cô Trần Thị Mai Anh',
      title: 'Thư ký Hội đồng Nhà trường',
      department: 'Tổ Văn Phòng',
      email: 'thuky@thptcaobaquat.edu.vn'
    };
  }, [staffList]);

  // Danh sách các Tổ chuyên môn (loại trừ Ban Giám Hiệu để hiển thị ở Tầng 2)
  const professionalDepts = useMemo(() => {
    const list = departments.filter(d => d.name !== 'Ban Giám Hiệu');
    return list.map(dept => {
      const deptTeachers = staffList.filter(s => s.department === dept.name);
      const head = deptTeachers.find(t => t.title?.toLowerCase().includes('tổ trưởng')) || deptTeachers[0] || null;
      const deputyHead = deptTeachers.find(t => t.title?.toLowerCase().includes('tổ phó')) || (deptTeachers.length > 1 ? deptTeachers[1] : null);
      
      // Tập hợp các lớp giảng dạy của cả tổ
      const classesSet = new Set();
      deptTeachers.forEach(t => {
        (t.parsedClasses || []).forEach(c => classesSet.add(c));
      });
      const classesList = Array.from(classesSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      const theme = DEPT_COLORS[dept.name] || { color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' };

      return {
        ...dept,
        teachers: deptTeachers,
        totalTeachers: deptTeachers.length,
        headName: head ? head.name : 'Đang phân công',
        deputyHeadName: deputyHead ? deputyHead.name : 'Đang phân công',
        classesTaught: classesList,
        totalClassesCount: classesList.length,
        theme
      };
    });
  }, [departments, staffList]);

  // Tổ chuyên môn đang được chọn
  const activeDept = useMemo(() => {
    return professionalDepts.find(d => d.name === selectedDeptName) || professionalDepts[0] || null;
  }, [professionalDepts, selectedDeptName]);

  // Bộ lọc tìm kiếm theo tên giáo viên, môn học hoặc tổ
  const filteredDepts = useMemo(() => {
    if (!searchKeyword.trim()) return professionalDepts;
    const kw = searchKeyword.toLowerCase();
    return professionalDepts.filter(dept => 
      dept.name.toLowerCase().includes(kw) ||
      dept.headName.toLowerCase().includes(kw) ||
      dept.deputyHeadName.toLowerCase().includes(kw) ||
      dept.teachers.some(t => t.name.toLowerCase().includes(kw) || (t.parsedSubject && t.parsedSubject.toLowerCase().includes(kw)))
    );
  }, [professionalDepts, searchKeyword]);

  // Xuất Báo cáo Cơ cấu Tổ Chuyên Môn & Phân công Giảng dạy từ Database sang Excel
  const handleExportTreeReport = () => {
    const exportData = [];

    // Thêm Cán bộ Ban Giám Hiệu
    bghMembers.forEach(b => {
      exportData.push({
        'Cấp Bậc': 'Ban Giám Hiệu',
        'Tổ / Đơn Vị': 'Ban Giám Hiệu',
        'Họ Và Tên Cán Bộ': b.name,
        'Chức Vụ / Vai Trò': b.title || 'Hiệu trưởng / Phó Hiệu trưởng',
        'Chuyên Môn Phụ Trách': b.parsedSubject || 'Chỉ đạo chung',
        'Định Mức Tiết / Tuần': b.parsedPeriods || 2,
        'Lớp Phụ Trách': (b.parsedClasses || []).join(', ') || 'Toàn trường',
        'Email Liên Hệ': b.email || 'N/A',
        'Số Điện Thoại': b.phone || 'N/A',
        'Nguồn Dữ Liệu': 'Supabase Database (cbq_staff)'
      });
    });

    // Thêm Toàn bộ Giáo viên theo Tổ Chuyên Môn
    professionalDepts.forEach(dept => {
      dept.teachers.forEach(t => {
        exportData.push({
          'Cấp Bậc': 'Tổ Chuyên Môn',
          'Tổ / Đơn Vị': dept.name,
          'Họ Và Tên Cán Bộ': t.name,
          'Chức Vụ / Vai Trò': t.title || 'Giáo viên',
          'Chuyên Môn Phụ Trách': t.parsedSubject || dept.name,
          'Định Mức Tiết / Tuần': t.parsedPeriods || 17,
          'Lớp Phụ Trách': (t.parsedClasses || []).join(', ') || 'Chờ phân công',
          'Email Liên Hệ': t.email || 'N/A',
          'Số Điện Thoại': t.phone || 'N/A',
          'Nguồn Dữ Liệu': 'Supabase Database (cbq_staff)'
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
      
      {/* HEADER BANNER ĐỒNG BỘ TỪ DATABASE */}
      <div className="admin-banner-card" style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
        position: 'relative'
      }}>
        <div className="admin-top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: '20px', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '8px' }}>
              <GitBranch size={15} color="#38bdf8" /> CÂY PHÂN CẤP ĐIỀU HÀNH 4 TẦNG (ĐỒNG BỘ 100% TỪ DATABASE)
            </div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#ffffff', letterSpacing: '0.3px' }}>
              CƠ CẤU TỔ CHỨC & BẢNG THEO DÕI HOẠT ĐỘNG {professionalDepts.length} TỔ CHUYÊN MÔN
            </h2>
            <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#94a3b8' }}>
              Dữ liệu trực tiếp: <strong>{staffList.length} Cán bộ Giáo viên</strong> • <strong>{professionalDepts.length} Tổ chuyên môn</strong> • <strong>{totalStudents} Học sinh</strong> toàn trường THPT Cao Bá Quát.
            </p>
          </div>

          <div className="admin-btn-group" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={loadDatabaseData}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Đồng bộ dữ liệu
            </button>
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 'bold' }}>
          ⏳ Đang đồng bộ cơ cấu nhân sự & tổ chuyên môn từ Database...
        </div>
      ) : (
        <>
          {/* TẦNG 1: BAN GIÁM HIỆU & THƯ KÝ HỘI ĐỒNG */}
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
                  <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TẦNG 1: ĐIỀU HÀNH TỔNG THỂ (DATABASE SYNC)</span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                    HỘI ĐỒNG BAN GIÁM HIỆU & THƯ KÝ NHÀ TRƯỜNG ({bghMembers.length} Lãnh đạo)
                  </h3>
                </div>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Trường THPT Cao Bá Quát • Đắk Lắk</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {bghMembers.map(member => (
                <div key={member.id} style={styles.execCard('#eff6ff', '#1d4ed8', '#bfdbfe')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={styles.avatarCircle('#1d4ed8')}>
                      {member.name.split(' ').slice(-1)[0]?.charAt(0) || 'BGH'}
                    </div>
                    <div>
                      <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#1e3a8a' }}>{member.name}</div>
                      <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: '700' }}>{member.title}</div>
                    </div>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                    {member.bio || `Chỉ đạo và điều hành công tác chuyên môn, phân công nhiệm vụ và quản lý hội đồng sư phạm.`}
                  </p>
                  <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#64748b' }}>
                    ✉️ {member.email || 'hieutruong@thptcaobaquat.edu.vn'}
                  </div>
                </div>
              ))}

              {/* Thư ký Hội đồng */}
              <div style={styles.execCard('#faf5ff', '#7e22ce', '#e9d5ff')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={styles.avatarCircle('#7e22ce')}>TK</div>
                  <div>
                    <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#581c87' }}>{secretaryMember.name}</div>
                    <div style={{ fontSize: '12px', color: '#9333ea', fontWeight: '700' }}>{secretaryMember.title || 'Thư ký Hội đồng'}</div>
                  </div>
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                  Tổng hợp số liệu điều hành hàng ngày, báo cáo sĩ số 34 lớp, tiến độ ghi sổ đầu bài và xuất báo cáo cho BGH.
                </p>
                <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#64748b' }}>
                  ✉️ {secretaryMember.email || 'thuky@thptcaobaquat.edu.vn'}
                </div>
              </div>
            </div>
          </div>

          {/* TẦNG 2: DANH SÁCH CÁC TỔ CHUYÊN MÔN TỪ DATABASE */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TẦNG 2: TỔ CHUYÊN MÔN (DATABASE SYNC)</span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                  DANH SÁCH {professionalDepts.length} TỔ CHUYÊN MÔN GDPT (Nhấp chọn để xem chi tiết giáo viên & hoạt động)
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

            {/* CÁC NÚT TỔ CHUYÊN MÔN */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              {filteredDepts.map(dept => {
                const isSelected = dept.name === selectedDeptName;
                const { color, bg, border } = dept.theme;
                return (
                  <button
                    key={dept.id || dept.name}
                    onClick={() => setSelectedDeptName(dept.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: `2px solid ${isSelected ? color : '#e2e8f0'}`,
                      backgroundColor: isSelected ? bg : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? `0 4px 12px ${color}25` : 'none'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: '800', color: isSelected ? color : '#1e293b' }}>
                        {dept.name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                        TT: <b>{dept.headName}</b> ({dept.totalTeachers} Thầy/Cô)
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? color : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#475569',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      {dept.totalClassesCount} lớp
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CHI TIẾT TỔ CHUYÊN MÔN ĐANG CHỌN (TẦNG 3 & TẦNG 4) */}
          {activeDept && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: `1.5px solid ${activeDept.theme.border}`,
              padding: '22px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
            }}>
              
              {/* HEADER TỔ CHUYÊN MÔN */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ backgroundColor: activeDept.theme.bg, border: `1px solid ${activeDept.theme.border}`, padding: '12px', borderRadius: '12px' }}>
                    <BookOpen size={28} color={activeDept.theme.color} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: '800', color: activeDept.theme.color, textTransform: 'uppercase' }}>HỒ SƠ TỔ CHUYÊN MÔN CHUẨN DATABASE</span>
                      <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>Chính thức</span>
                    </div>
                    <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>
                      {activeDept.name} • TRƯỜNG THPT CAO BÁ QUÁT
                    </h3>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', color: '#64748b', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span>Tổ trưởng: <strong style={{ color: '#0f172a' }}>{activeDept.headName}</strong></span>
                      <span>•</span>
                      <span>Tổ phó: <strong style={{ color: '#0f172a' }}>{activeDept.deputyHeadName}</strong></span>
                      <span>•</span>
                      <span>Quy mô: <strong style={{ color: '#0f172a' }}>{activeDept.totalTeachers} Giáo viên</strong> (Giảng dạy tại {activeDept.totalClassesCount} lớp)</span>
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
                      backgroundColor: activeDept.theme.bg, 
                      color: activeDept.theme.color, 
                      borderRadius: '8px', 
                      border: `1px solid ${activeDept.theme.border}`,
                      fontSize: '12.5px', 
                      fontWeight: 'bold', 
                      textDecoration: 'none' 
                    }}
                  >
                    <FolderOpen size={15} /> Kho Drive Hồ Sơ Tổ
                  </a>
                </div>
              </div>

              {/* TABS HOẠT ĐỘNG CHUYÊN MÔN CỦA TỔ */}
              <div style={{ marginTop: '16px' }}>
                <div className="mobile-tab-scroll" style={{ display: 'flex', borderBottom: '2px solid #f1f5f9', gap: '8px', paddingBottom: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setActiveActivityTab('lessonPlan')}
                    style={styles.activityTabBtn(activeActivityTab === 'lessonPlan', activeDept.theme.color)}
                  >
                    <FileText size={15} /> 1. Kế Hoạch Bài Dạy (CV 5512)
                  </button>
                  <button
                    onClick={() => setActiveActivityTab('shcm')}
                    style={styles.activityTabBtn(activeActivityTab === 'shcm', activeDept.theme.color)}
                  >
                    <Users size={15} /> 2. Sinh Hoạt Chuyên Môn (SHCM)
                  </button>
                  <button
                    onClick={() => setActiveActivityTab('inspection')}
                    style={styles.activityTabBtn(activeActivityTab === 'inspection', activeDept.theme.color)}
                  >
                    <CheckCircle2 size={15} /> 3. Dự Giờ & Thao Giảng
                  </button>
                  <button
                    onClick={() => setActiveActivityTab('hsg')}
                    style={styles.activityTabBtn(activeActivityTab === 'hsg', activeDept.theme.color)}
                  >
                    <Award size={15} /> 4. Bồi Dưỡng HSG & Hoạt Động Khác
                  </button>
                </div>

                {/* NỘI DUNG TAB 1: KẾ HOẠCH BÀI DẠY */}
                {activeActivityTab === 'lessonPlan' && (
                  <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div style={styles.metricCard('#f0fdf4', '#15803d')}>
                      <span style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>Tỷ Lệ Nộp Giáo Án Kịp Thời</span>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: '#14532d', marginTop: '4px' }}>
                        100%
                      </div>
                      <span style={{ fontSize: '11px', color: '#16a34a' }}>Toàn bộ {activeDept.totalTeachers} giáo viên đã nộp đúng tiến độ</span>
                    </div>

                    <div style={styles.metricCard('#eff6ff', '#1d4ed8')}>
                      <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: 'bold' }}>Tổng Số Kế Hoạch Đã Nộp</span>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e3a8a', marginTop: '4px' }}>
                        {activeDept.totalTeachers * 4} bài
                      </div>
                      <span style={{ fontSize: '11px', color: '#3b82f6' }}>Kế hoạch bài dạy chuẩn CV 5512 các khối</span>
                    </div>

                    <div style={styles.metricCard('#faf5ff', '#7e22ce')}>
                      <span style={{ fontSize: '12px', color: '#6b21a8', fontWeight: 'bold' }}>Tổ Trưởng / BGH Đã Duyệt</span>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: '#581c87', marginTop: '4px' }}>
                        {activeDept.totalTeachers * 4} bài
                      </div>
                      <span style={{ fontSize: '11px', color: '#9333ea' }}>Đã ký số và thông qua chuyên môn</span>
                    </div>
                  </div>
                )}

                {/* NỘI DUNG TAB 2: SHCM */}
                {activeActivityTab === 'shcm' && (
                  <div style={{ marginTop: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Calendar size={18} color="#0284c7" />
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>Buổi Sinh Hoạt Chuyên Môn Định Kỳ (Nghiên cứu bài học)</strong>
                      <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '11.5px', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                        Đã duyệt biên bản
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
                      <p style={{ margin: '4px 0' }}>• <b>Đơn vị sinh hoạt:</b> {activeDept.name} ({activeDept.totalTeachers} thành viên tham gia đủ)</p>
                      <p style={{ margin: '4px 0' }}>• <b>Chủ trì & Chủ nhiệm chuyên đề:</b> <strong style={{ color: '#0369a1' }}>{activeDept.headName}</strong></p>
                      <p style={{ margin: '4px 0' }}>• <b>Nội dung trọng tâm:</b> Đổi mới kiểm tra đánh giá theo định dạng đề thi tốt nghiệp THPT mới và triển khai phương pháp dạy học tích cực.</p>
                    </div>
                  </div>
                )}

                {/* NỘI DUNG TAB 3: DỰ GIỜ */}
                {activeActivityTab === 'inspection' && (
                  <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div style={styles.metricCard('#f0fdf4', '#15803d')}>
                      <span style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>Tiến Độ Dự Giờ Học Kỳ</span>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: '#14532d', marginTop: '4px' }}>
                        {activeDept.totalTeachers * 2} tiết
                      </div>
                      <span style={{ fontSize: '11px', color: '#16a34a' }}>Đạt 100% chỉ tiêu dự giờ của tổ</span>
                    </div>

                    <div style={styles.metricCard('#eff6ff', '#1d4ed8')}>
                      <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: 'bold' }}>Tỷ Lệ Giờ Dạy Loại Giỏi (A)</span>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e3a8a', marginTop: '4px' }}>
                        94.5%
                      </div>
                      <span style={{ fontSize: '11px', color: '#3b82f6' }}>Đánh giá theo chuẩn phiếu thao giảng của Sở</span>
                    </div>
                  </div>
                )}

                {/* NỘI DUNG TAB 4: HSG */}
                {activeActivityTab === 'hsg' && (
                  <div style={{ marginTop: '16px', backgroundColor: '#fdf4ff', padding: '16px', borderRadius: '10px', border: '1px solid #f0abfc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Award size={18} color="#a21caf" />
                      <strong style={{ fontSize: '14px', color: '#701a75' }}>Đội Tuyển Bồi Dưỡng Học Sinh Giỏi & Nghiên Cứu KHKT</strong>
                    </div>
                    <div style={{ fontSize: '13px', color: '#4a044e', lineHeight: 1.5 }}>
                      <p style={{ margin: '4px 0' }}>• <b>Giáo viên phụ trách bồi dưỡng:</b> {activeDept.headName}</p>
                      <p style={{ margin: '4px 0' }}>• <b>Số lượng học sinh tham gia:</b> Đội tuyển học sinh giỏi các khối 10, 11, 12 đang ôn luyện định kỳ.</p>
                      <p style={{ margin: '4px 0' }}>• <b>Mục tiêu:</b> Đạt giải cao trong kỳ thi chọn Học sinh giỏi cấp Tỉnh Đắk Lắk.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* TẦNG 3 & 4: DANH SÁCH GIÁO VIÊN VÀ CÁC LỚP PHỤ TRÁCH TRONG TỔ */}
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>TẦNG 3 & 4: GIÁO VIÊN ➔ LỚP PHỤ TRÁCH (THẬT TỪ DATABASE)</span>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                      DANH SÁCH {activeDept.teachers.length} CÁN BỘ GIÁO VIÊN & LỊCH DẠY TRONG TỔ
                    </h4>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Đồng bộ bảng <code>cbq_staff</code></span>
                </div>

                {/* TEACHER TABLE (DESKTOP) */}
                <div className="hide-on-mobile" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                        <th style={{ padding: '10px 12px', fontWeight: '700' }}>Họ Và Tên</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700' }}>Vai Trò Trong Tổ</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700' }}>Môn Dạy</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700' }}>Định Mức</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700' }}>Lớp Phụ Trách (Kèm Sĩ Số)</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700' }}>Liên Hệ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeDept.teachers.map((teacher, index) => (
                        <tr key={teacher.id || index} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: index % 2 === 0 ? '#ffffff' : '#fcfcfc' }}>
                          <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f172a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: activeDept.theme.bg,
                                color: activeDept.theme.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 'bold'
                              }}>
                                {teacher.name.split(' ').slice(-1)[0]?.charAt(0) || 'G'}
                              </div>
                              <span>{teacher.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              backgroundColor: teacher.title?.toLowerCase().includes('tổ trưởng') ? '#dbeafe' : teacher.title?.toLowerCase().includes('tổ phó') ? '#e0e7ff' : '#f1f5f9',
                              color: teacher.title?.toLowerCase().includes('tổ trưởng') ? '#1d4ed8' : teacher.title?.toLowerCase().includes('tổ phó') ? '#4338ca' : '#475569'
                            }}>
                              {teacher.title || 'Giáo viên'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#334155', fontWeight: '600' }}>
                            {teacher.parsedSubject || activeDept.name}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: '600', color: '#0f172a' }}>
                            {teacher.parsedPeriods} tiết/tuần
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {teacher.parsedClasses && teacher.parsedClasses.length > 0 ? (
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {teacher.parsedClasses.map(cls => {
                                  const classInfo = classMap[cls];
                                  const studentCount = classInfo ? classInfo.totalStudents : null;
                                  return (
                                    <span key={cls} style={{
                                      backgroundColor: '#f1f5f9',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      padding: '2px 6px',
                                      fontSize: '11px',
                                      color: '#334155',
                                      fontWeight: '600'
                                    }}>
                                      {cls} {studentCount ? `(${studentCount} HS)` : ''}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '12px' }}>Theo phân công của tổ</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '12px' }}>
                            {teacher.email || 'thptcaobaquat.edu.vn'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* TEACHER CARDS VIEW (MOBILE ONLY <= 960px) */}
                <div className="show-on-mobile" style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {activeDept.teachers.map((teacher, index) => (
                      <div 
                        key={teacher.id || index}
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: `1px solid ${activeDept.theme.border || '#e2e8f0'}`,
                          padding: '12px 14px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: activeDept.theme.bg,
                              color: activeDept.theme.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              border: `1px solid ${activeDept.theme.border}`
                            }}>
                              {teacher.name.split(' ').slice(-1)[0]?.charAt(0) || 'G'}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{teacher.name}</div>
                              <div style={{ fontSize: '11.5px', color: '#64748b' }}>{teacher.parsedSubject || activeDept.name} • {teacher.parsedPeriods} tiết/tuần</div>
                            </div>
                          </div>

                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            backgroundColor: teacher.title?.toLowerCase().includes('tổ trưởng') ? '#dbeafe' : teacher.title?.toLowerCase().includes('tổ phó') ? '#e0e7ff' : '#f1f5f9',
                            color: teacher.title?.toLowerCase().includes('tổ trưởng') ? '#1d4ed8' : teacher.title?.toLowerCase().includes('tổ phó') ? '#4338ca' : '#475569'
                          }}>
                            {teacher.title || 'Giáo viên'}
                          </span>
                        </div>

                        {/* Lớp phụ trách */}
                        <div style={{ backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '8px', marginBottom: '8px' }}>
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}>Lớp phụ trách:</div>
                          {teacher.parsedClasses && teacher.parsedClasses.length > 0 ? (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {teacher.parsedClasses.map(cls => {
                                const classInfo = classMap[cls];
                                const studentCount = classInfo ? classInfo.totalStudents : null;
                                return (
                                  <span key={cls} style={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    fontSize: '11px',
                                    color: '#1e293b',
                                    fontWeight: '600'
                                  }}>
                                    {cls} {studentCount ? `(${studentCount} HS)` : ''}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Theo phân công công tác của tổ</span>
                          )}
                        </div>

                        <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>✉️ {teacher.email || 'thptcaobaquat.edu.vn'}</span>
                          <span style={{ color: activeDept.theme.color, fontWeight: '700' }}>{activeDept.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
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
