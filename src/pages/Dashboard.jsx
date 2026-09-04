import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { 
  FolderOpen, Award, Users, Calendar, FileText, LayoutDashboard, 
  Bike, Bus, QrCode, MessageSquare, Download, Trophy, Sparkles, 
  BookOpen, CheckCircle, Clock, AlertTriangle, Plus, ChevronRight, ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import TaskModal from '../components/TaskModal';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('teaching'); // 'teaching' | 'student' | 'archive'
  const [tasks, setTasks] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [parkingCount, setParkingCount] = useState(0);
  const [busCount, setBusCount] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [digitalVaultCount, setDigitalVaultCount] = useState(0);
  const [drivesCount, setDrivesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('academic_dashboard_realtime_v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbq_tasks' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbq_students' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbq_department_drives' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbq_digital_vault' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbq_feedback_topics' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [tasksRes, committeesRes, parkingRes, busRes, feedbackRes, studentsRes, vaultRes, drivesRes] = await Promise.all([
        supabase.from('cbq_tasks').select('*'),
        supabase.from('cbq_committees').select('*'),
        supabase.from('cbq_parking_registrations').select('id', { count: 'exact' }),
        supabase.from('cbq_bus_registrations').select('id', { count: 'exact' }),
        supabase.from('cbq_feedback_topics').select('id', { count: 'exact' }),
        supabase.from('cbq_students').select('id', { count: 'exact' }),
        supabase.from('cbq_digital_vault').select('id', { count: 'exact' }),
        supabase.from('cbq_department_drives').select('id', { count: 'exact' })
      ]);

      setTasks(tasksRes.data || []);
      setCommittees(committeesRes.data || []);
      setParkingCount(parkingRes.count || 0);
      setBusCount(busRes.count || 0);
      setFeedbackCount(feedbackRes.count || 0);
      setStudentsCount(studentsRes.count || 0);
      setDigitalVaultCount(vaultRes.count || 0);
      setDrivesCount(drivesRes.count || 0);
    } catch (error) {
      console.error('Lỗi tải dữ liệu điều hành chuyên môn:', error);
    } finally {
      setLoading(false);
    }
  }

  const getRedAlertTasks = () => {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    return tasks.filter(t => {
      if (t.status === 'completed') return false;
      const deadline = new Date(t.deadline);
      return deadline <= threeDaysFromNow;
    });
  };

  const redAlertTasks = getRedAlertTasks();

  const handleExportAcademicReport = () => {
    const assignees = {};
    tasks.forEach(t => {
      const name = t.assignee || 'Chưa phân công';
      if (!assignees[name]) {
        assignees[name] = { total: 0, completed: 0, overdue: 0, pending: 0 };
      }
      assignees[name].total += 1;
      if (t.status === 'completed') assignees[name].completed += 1;
      else if (new Date(t.deadline) < new Date()) assignees[name].overdue += 1;
      else assignees[name].pending += 1;
    });

    const exportData = Object.keys(assignees).map(name => {
      const stats = assignees[name];
      const rate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0;
      return {
        'Cán Bộ / Giáo Viên': name,
        'Tổng Nhiệm Vụ Chuyên Môn': stats.total,
        'Đã Hoàn Thành': stats.completed,
        'Đang Thực Hiện': stats.pending,
        'Trễ Hạn': stats.overdue,
        'Tỷ Lệ Hoàn Thành (%)': Number(rate)
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BaoCao_ChuyenMon");
    XLSX.writeFile(wb, "BaoCao_QuanLyChuyenMon_SoSach.xlsx");
  };

  return (
    <Layout title="Bảng Điều Hành Quản Lý Chuyên Môn & Sổ Sách Điện Tử">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontWeight: 'bold' }}>
          ⏳ Đang kết nối hệ thống Sổ sách & Chuyên môn Nhà trường...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TOP PROFESSIONAL HEADER BANNER */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0369a1 100%)',
            color: '#ffffff',
            borderRadius: '16px',
            padding: '22px 26px',
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 10 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#fef08a', borderRadius: '20px', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '8px' }}>
                  <ShieldCheck size={15} color="#4ade80" /> HỆ THỐNG ĐIỀU HÀNH CHUYÊN MÔN & SỔ SÁCH 4.0
                </div>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#ffffff', letterSpacing: '0.3px' }}>
                  TRƯỜNG THPT CAO BÁ QUÁT • QUẢN LÝ CHUYÊN MÔN & SỔ SÁCH ĐIỆN TỬ
                </h1>
                <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#cbd5e1' }}>
                  Điều hành toàn bộ Hồ sơ Tổ Chuyên môn - Sổ Thi đua Kỷ luật - Lịch Báo giảng & Kho Văn bằng Số.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleExportAcademicReport}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', backgroundColor: '#ffffff', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                >
                  <Download size={15} color="#0284c7" /> Xuất Báo Cáo Chuyên Môn (Excel)
                </button>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}
                >
                  <Plus size={16} /> Giao Việc Báo Giảng / Chuyên Môn
                </button>
              </div>
            </div>
          </div>

          {/* REALTIME ACADEMIC KPI INDICATORS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
            <div style={styles.kpiCard('#eff6ff', '#3b82f6', '#1d4ed8')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#1e40af', fontWeight: 'bold' }}>Hồ Sơ Tổ Chuyên Môn</span>
                <FolderOpen size={22} color="#1d4ed8" />
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#1e3a8a', marginTop: '6px' }}>{drivesCount} <small style={{ fontSize: '13px', fontWeight: 'normal', color: '#3b82f6' }}>hồ sơ</small></div>
            </div>

            <div style={styles.kpiCard('#f0fdf4', '#22c55e', '#166534')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 'bold' }}>Sổ Điểm Thi Đua Lớp</span>
                <Award size={22} color="#166534" />
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#14532d', marginTop: '6px' }}>100% <small style={{ fontSize: '13px', fontWeight: 'normal', color: '#16a34a' }}>nề nếp khối</small></div>
            </div>

            <div style={styles.kpiCard('#fffbebfb', '#f59e0b', '#b45309')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#a16207', fontWeight: 'bold' }}>Hồ Sơ Học Sinh</span>
                <Users size={22} color="#b45309" />
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#78350f', marginTop: '6px' }}>{studentsCount} <small style={{ fontSize: '13px', fontWeight: 'normal', color: '#ca8a04' }}>học sinh</small></div>
            </div>

            <div style={styles.kpiCard('#faf5ff', '#a855f7', '#7e22ce')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#6b21a8', fontWeight: 'bold' }}>Kho Văn Bằng Số</span>
                <FileText size={22} color="#7e22ce" />
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#581c87', marginTop: '6px' }}>{digitalVaultCount} <small style={{ fontSize: '13px', fontWeight: 'normal', color: '#9333ea' }}>văn bằng</small></div>
            </div>

            <div style={styles.kpiCard('#fff1f2', '#f43f5e', '#be123c')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#9f1239', fontWeight: 'bold' }}>Nhiệm Vụ Chuyên Môn</span>
                <Clock size={22} color="#be123c" />
              </div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#881337', marginTop: '6px' }}>{tasks.length} <small style={{ fontSize: '13px', fontWeight: 'normal', color: '#e11d48' }}>công việc</small></div>
            </div>
          </div>

          {/* QUICK ACTION SHORTCUTS HUB (THAO TÁC NHANH 1-TOUCH) */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            padding: '18px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                  LỐI TẮT THAO TÁC NHANH CHUYÊN MÔN & BAN GIÁM HIỆU
                </h3>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>⚡ Xử lý nhanh trong 1 touch</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <Link to="/admin/department-drives" style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                  <FolderOpen size={20} color="#0284c7" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0369a1' }}>Duyệt Giáo Án / Kế Hoạch</div>
                    <div style={{ fontSize: '11px', color: '#0284c7' }}>Tổ chuyên môn GDPT</div>
                  </div>
                </div>
              </Link>

              <Link to="/admin/emulation" style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                  <Award size={20} color="#16a34a" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#15803d' }}>Báo Cáo Thi Đua Tuần</div>
                    <div style={{ fontSize: '11px', color: '#16a34a' }}>Xuất điểm nề nếp lớp</div>
                  </div>
                </div>
              </Link>

              <Link to="/admin/schedule" style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: '#fffbebfb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                  <Calendar size={20} color="#d97706" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#b45309' }}>Lịch Công Tác BGH</div>
                    <div style={{ fontSize: '11px', color: '#d97706' }}>Lịch tuần & Báo giảng</div>
                  </div>
                </div>
              </Link>

              <Link to="/admin/digital-vault" style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                  <FileText size={20} color="#9333ea" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#6b21a8' }}>Tra Cứu Học Bạ Số</div>
                    <div style={{ fontSize: '11px', color: '#9333ea' }}>Sổ sách & Văn bằng</div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* ACADEMIC MODULE TABS HEADER */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', padding: '16px 20px' }}>
            <div style={{ display: 'flex', borderBottom: '2px solid #f1f5f9', gap: '8px', paddingBottom: '8px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setActiveTab('teaching')}
                style={styles.tabBtn(activeTab === 'teaching', '#0284c7')}
              >
                <BookOpen size={16} /> 📚 PHÂN HỆ TỔ CHUYÊN MÔN & GIẢNG DẠY
              </button>

              <button 
                onClick={() => setActiveTab('student')}
                style={styles.tabBtn(activeTab === 'student', '#166534')}
              >
                <Users size={16} /> 👨‍🎓 PHÂN HỆ SỔ SÁCH HỌC SINH & NỀ NẾP
              </button>

              <button 
                onClick={() => setActiveTab('archive')}
                style={styles.tabBtn(activeTab === 'archive', '#b45309')}
              >
                <FileText size={16} /> 📄 VĂN BẢN & TƯ LIỆU NỘI BỘ
              </button>
            </div>

            {/* TAB 1: TEACHING & DEPARTMENT MANAGEMENT */}
            {activeTab === 'teaching' && (
              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <Link to="/admin/department-drives" style={styles.recordBox('#eff6ff', '#3b82f6')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.iconCircle('#dbeafe', '#1d4ed8')}>📁</div>
                    <div>
                      <h3 style={styles.boxTitle('#1e3a8a')}>Sổ Kế Hoạch & Hồ Sơ Tổ Chuyên Môn</h3>
                      <p style={styles.boxDesc}>Quản lý hồ sơ giáo án, kế hoạch bài dạy & biên bản tổ ({drivesCount} mục)</p>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#3b82f6" />
                </Link>

                <Link to="/admin/schedule" style={styles.recordBox('#fff1f2', '#f43f5e')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.iconCircle('#ffe4e6', '#be123c')}>📅</div>
                    <div>
                      <h3 style={styles.boxTitle('#881337')}>Sổ Lịch Báo Giảng & Công Tác Tuần</h3>
                      <p style={styles.boxDesc}>Theo dõi lịch dạy, lịch trực BGH, lịch họp chuyên môn tuần</p>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#f43f5e" />
                </Link>

                <Link to="/admin/staff" style={styles.recordBox('#f0fdf4', '#22c55e')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.iconCircle('#dcfce7', '#166534')}>👨‍🏫</div>
                    <div>
                      <h3 style={styles.boxTitle('#14532d')}>Sổ Cán Bộ & Phân Công Giảng Dạy</h3>
                      <p style={styles.boxDesc}>Danh sách ban giám hiệu, giáo viên bộ môn & tổ chuyên môn</p>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#22c55e" />
                </Link>

                <Link to="/admin/gop-y" style={styles.recordBox('#f0fdfa', '#14b8a6')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.iconCircle('#ccfbf1', '#0f766e')}>✍️</div>
                    <div>
                      <h3 style={styles.boxTitle('#134e4a')}>Sổ Góp Ý & Đánh Giá Chuyên Môn</h3>
                      <p style={styles.boxDesc}>Tiếp nhận góp ý, giải pháp nâng cao chất lượng dạy học ({feedbackCount} ý kiến)</p>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#14b8a6" />
                </Link>

                <Link to="/admin/app-hub" style={styles.recordBox('#faf5ff', '#a855f7')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.iconCircle('#f3e8ff', '#7e22ce')}>🎯</div>
                    <div>
                      <h3 style={styles.boxTitle('#581c87')}>Cổng Tiện Ích Sổ Sách Điện Tử (Hub)</h3>
                      <p style={styles.boxDesc}>Kho công cụ & tiện ích tra cứu công việc giảng dạy cho giáo viên</p>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#a855f7" />
                </Link>
              </div>
            )}

            {/* TAB 2: STUDENT & CLASS REGISTERS */}
            {activeTab === 'student' && (
              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <Link to="/admin/emulation" style={styles.recordBox('#f0fdf4', '#22c55e')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.iconCircle('#dcfce7', '#166534')}>📋</div>
                    <div>
                      <h3 style={styles.boxTitle('#14532d')}>Sổ Chấm Điểm Thi Đua & Nề Nếp Lớp</h3>
                      <p style={styles.boxDesc}>Theo dõi xếp hạng thi đua tuần, nề nếp kỷ luật các khối lớp</p>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#22c55e" />
                </Link>

                <Link to="/admin/students" style={styles.recordBox('#fffbebfb', '#f59e0b')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.iconCircle('#fef9c3', '#b45309')}>👨‍🎓</div>
                    <div>
                      <h3 style={styles.boxTitle('#78350f')}>Sổ Danh Sách Học Sinh & Chuyển Lớp</h3>
                      <p style={styles.boxDesc}>Quản lý hồ sơ học sinh toàn trường & sổ chuyển lớp ({studentsCount} học sinh)</p>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#f59e0b" />
                </Link>

                <Link to="/admin/digital-vault" style={styles.recordBox('#faf5ff', '#a855f7')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.iconCircle('#f3e8ff', '#7e22ce')}>📜</div>
                    <div>
                      <h3 style={styles.boxTitle('#581c87')}>Kho Văn Bằng Số & Học Bạ Điện Tử</h3>
                      <p style={styles.boxDesc}>Tra cứu bằng tốt nghiệp THPT, chứng chỉ & học bạ số ({digitalVaultCount} hồ sơ)</p>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#a855f7" />
                </Link>

                <Link to="/admin/parking" style={styles.recordBox('#eff6ff', '#3b82f6')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.iconCircle('#dbeafe', '#1d4ed8')}>🛵</div>
                    <div>
                      <h3 style={styles.boxTitle('#1e3a8a')}>Sổ Quản Lý Xe Máy Học Sinh</h3>
                      <p style={styles.boxDesc}>Theo dõi danh sách đăng ký xe máy & vé xe học sinh ({parkingCount} vé)</p>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#3b82f6" />
                </Link>

                <Link to="/admin/bus" style={styles.recordBox('#fff1f2', '#f43f5e')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.iconCircle('#ffe4e6', '#be123c')}>🚌</div>
                    <div>
                      <h3 style={styles.boxTitle('#881337')}>Sổ Quản Lý Xe Đưa Đón Học Sinh</h3>
                      <p style={styles.boxDesc}>Theo dõi các tuyến xe đưa đón học sinh an toàn ({busCount} tuyến)</p>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#f43f5e" />
                </Link>
              </div>
            )}

            {/* TAB 3: INTERNAL DOCUMENTS & TRADITION ARCHIVE */}
            {activeTab === 'archive' && (
              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <Link to="/admin/docs" style={styles.recordBox('#eff6ff', '#3b82f6')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.iconCircle('#dbeafe', '#1d4ed8')}>📄</div>
                    <div>
                      <h3 style={styles.boxTitle('#1e3a8a')}>Sổ Văn Bản - Thông Báo Chỉ Đạo Nội Bộ</h3>
                      <p style={styles.boxDesc}>Lưu trữ công văn, quyết định chỉ đạo & văn bản hành chính nhà trường</p>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#3b82f6" />
                </Link>

                <Link to="/admin/news" style={styles.recordBox('#f0fdf4', '#22c55e')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.iconCircle('#dcfce7', '#166534')}>📰</div>
                    <div>
                      <h3 style={styles.boxTitle('#14532d')}>Quản Lý Tin Tức & Truyền Thông</h3>
                      <p style={styles.boxDesc}>Đăng tải tin tức hoạt động dạy học, sự kiện & thông báo công khai</p>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#22c55e" />
                </Link>

                <Link to="/admin/committee" style={styles.recordBox('#fffbebfb', '#f59e0b')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.iconCircle('#fef9c3', '#b45309')}>🏆</div>
                    <div>
                      <h3 style={styles.boxTitle('#78350f')}>Kho Tư Liệu Kỷ Niệm 30 Năm Thành Lập</h3>
                      <p style={styles.boxDesc}>Lưu trữ thông tin tiểu ban, giải thể thao, tập san & danh sách tri ân</p>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#f59e0b" />
                </Link>
              </div>
            )}
          </div>

          {/* RED ALERT PROGRESS WARNING SECTION */}
          {redAlertTasks.length > 0 && (
            <div style={{ backgroundColor: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: '14px', padding: '18px 22px' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#9f1239', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                <AlertTriangle color="#be123c" size={20} /> Cảnh Báo Tiến Độ Công Việc Chuyên Môn ({redAlertTasks.length} việc gần hạn chót)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {redAlertTasks.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #ffe4e6' }}>
                    <div>
                      <strong style={{ color: '#991b1b', fontSize: '14px' }}>{t.title}</strong>
                      <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                        Cán bộ phụ trách: <strong>{t.assignee || 'Chưa phân công'}</strong> | Hạn chót: {new Date(t.deadline).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <span style={{ padding: '4px 12px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px' }}>
                      {t.progress}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* TASK MODAL FOR ASSIGNING NEW ACADEMIC TASKS */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (taskData) => {
          try {
            const { error } = await supabase.from('cbq_tasks').insert([{
              ...taskData,
              progress: 0,
              status: 'pending'
            }]);
            if (error) throw error;
            alert('Giao việc chuyên môn thành công!');
            setIsModalOpen(false);
            fetchData();
          } catch (err) {
            alert('Lỗi giao việc: ' + err.message);
          }
        }}
        committees={committees}
        task={null}
      />
    </Layout>
  );
}

const styles = {
  kpiCard: (bg, border, color) => ({
    padding: '16px 18px',
    backgroundColor: bg,
    border: `1.5px solid ${border}`,
    borderRadius: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
  }),
  tabBtn: (isActive, color) => ({
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: isActive ? color : '#f1f5f9',
    color: isActive ? '#ffffff' : '#475569',
    fontWeight: 'bold',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
  }),
  recordBox: (bg, border) => ({
    display: 'flex',
    alignItems: 'center',
    justify: 'space-between',
    padding: '16px',
    backgroundColor: bg,
    border: `1.5px solid ${border}`,
    borderRadius: '12px',
    textDecoration: 'none',
    transition: 'all 0.2s ease'
  }),
  iconCircle: (bg, color) => ({
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: bg,
    display: 'flex',
    alignItems: 'center',
    justify: 'center',
    fontSize: '20px',
    flexShrink: 0
  }),
  boxTitle: (color) => ({
    margin: 0,
    fontSize: '15px',
    fontWeight: 'bold',
    color: color
  }),
  boxDesc: {
    margin: '2px 0 0 0',
    fontSize: '12.5px',
    color: '#64748b'
  }
};
