import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { AlertTriangle, CheckCircle, Clock, Plus, FolderOpen, Award, Users, Calendar, FileText, LayoutDashboard, Bike, Bus, QrCode, MessageSquare, Download, Trophy, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';
import TaskModal from '../components/TaskModal';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [sponsors, setSponsors] = useState([]);
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

    const channel = supabase.channel('academic_dashboard_realtime')
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
      const [tasksRes, committeesRes, sponsorsRes, parkingRes, busRes, feedbackRes, studentsRes, vaultRes, drivesRes] = await Promise.all([
        supabase.from('cbq_tasks').select('*'),
        supabase.from('cbq_committees').select('*'),
        supabase.from('cbq_sponsors').select('donation_amount').eq('is_public', true),
        supabase.from('cbq_parking_registrations').select('id', { count: 'exact' }),
        supabase.from('cbq_bus_registrations').select('id', { count: 'exact' }),
        supabase.from('cbq_feedback_topics').select('id', { count: 'exact' }),
        supabase.from('cbq_students').select('id', { count: 'exact' }),
        supabase.from('cbq_digital_vault').select('id', { count: 'exact' }),
        supabase.from('cbq_department_drives').select('id', { count: 'exact' })
      ]);

      setTasks(tasksRes.data || []);
      setCommittees(committeesRes.data || []);
      setSponsors(sponsorsRes.data || []);
      setParkingCount(parkingRes.count || 0);
      setBusCount(busRes.count || 0);
      setFeedbackCount(feedbackRes.count || 0);
      setStudentsCount(studentsRes.count || 0);
      setDigitalVaultCount(vaultRes.count || 0);
      setDrivesCount(drivesRes.count || 0);
    } catch (error) {
      console.error('Lỗi tải dữ liệu điều hành:', error);
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

  const handleExportPerformance = () => {
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
        'Họ và Tên Cán Bộ': name,
        'Tổng Công Việc Được Giao': stats.total,
        'Đã Hoàn Thành': stats.completed,
        'Đang Thực Hiện': stats.pending,
        'Trễ Hạn': stats.overdue,
        'Tỷ Lệ Hoàn Thành (%)': Number(rate)
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hiệu Suất Chuyên Môn");
    XLSX.writeFile(wb, "BaoCao_HieuSuatChuyenMon.xlsx");
  };

  return (
    <Layout title="Bảng Điều Hành Quản Lý & Vận Hành Chuyên Môn">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontWeight: 'bold' }}>
          Đang kết nối hệ thống Quản lý Chuyên môn Nhà trường...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* CELEBRATION CONGRATULATIONS & ACADEMIC TRANSITION ANNOUNCEMENT */}
          <div style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
            color: '#ffffff',
            borderRadius: '20px',
            padding: '24px 28px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            border: '1px solid #3b82f6',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 10 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', backgroundColor: '#0284c7', color: '#ffffff', borderRadius: '30px', fontWeight: 'bold', fontSize: '13px', marginBottom: '12px' }}>
                <Sparkles size={16} color="#fef08a" /> ĐẠI LỄ KỶ NIỆM 30 NĂM ĐÃ THÀNH CÔNG RỰC RỠ!
              </div>

              <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', fontWeight: '900', color: '#fef08a', letterSpacing: '0.5px' }}>
                HỆ THỐNG QUẢN LÝ & VẬN HÀNH CHUYÊN MÔN THPT CAO BÁ QUÁT
              </h1>

              <p style={{ margin: 0, fontSize: '15px', color: '#e2e8f0', lineHeight: 1.6, maxWidth: '900px' }}>
                Hệ thống đã chính thức chuyển đổi trọng tâm vận hành sang **Quản lý Chuyên môn - Đội ngũ Cán bộ - Thi đua Kỷ luật Học sinh - Kho Hồ sơ Tổ chuyên môn & Lịch công tác hàng tuần** cho năm học mới.
              </p>
            </div>
          </div>

          {/* TOP ACTION BAR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LayoutDashboard size={24} color="#0284c7" /> Lối Tắt Tiện Ích Chuyên Môn Trọng Tâm
            </h2>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleExportPerformance}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '13.5px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)' }}
              >
                <Download size={16} /> Xuất Báo Cáo Hiệu Suất (Excel)
              </button>

              <button 
                onClick={() => setIsModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', backgroundColor: '#166534', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '13.5px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(22, 101, 52, 0.25)' }}
              >
                <Plus size={16} /> Giao Việc Chuyên Môn Mới
              </button>
            </div>
          </div>

          {/* PRIMARY ACADEMIC MODULE CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '16px' }}>
            
            {/* Department Drives */}
            <Link to="/admin/department-drives" style={styles.moduleCard('#eff6ff', '#bfdbfe', '#1d4ed8')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <FolderOpen size={32} color="#1d4ed8" />
                <span style={styles.badge('#dbeafe', '#1e40af')}>Chuyên môn</span>
              </div>
              <h3 style={{ margin: '10px 0 4px 0', fontSize: '17px', color: '#1e3a8a', fontWeight: 'bold' }}>
                Hồ Sơ Tổ Chuyên Môn
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#3b82f6' }}>
                Lưu trữ giáo án, biên bản họp tổ & tài liệu giảng dạy ({drivesCount} mục)
              </p>
            </Link>

            {/* Class Emulation */}
            <Link to="/admin/emulation" style={styles.moduleCard('#f0fdf4', '#bbf7d0', '#166534')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Award size={32} color="#166534" />
                <span style={styles.badge('#dcfce7', '#15803d')}>Nề nếp</span>
              </div>
              <h3 style={{ margin: '10px 0 4px 0', fontSize: '17px', color: '#14532d', fontWeight: 'bold' }}>
                Chấm Điểm Thi Đua Lớp
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#16a34a' }}>
                Theo dõi xếp hạng thi đua tuần, nề nếp kỷ luật học sinh các khối
              </p>
            </Link>

            {/* Students List */}
            <Link to="/admin/students" style={styles.moduleCard('#fffbebfb', '#fef08a', '#b45309')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Users size={32} color="#b45309" />
                <span style={styles.badge('#fef9c3', '#a16207')}>Học sinh</span>
              </div>
              <h3 style={{ margin: '10px 0 4px 0', fontSize: '17px', color: '#78350f', fontWeight: 'bold' }}>
                Danh Sách Học Sinh & Chuyển Lớp
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#ca8a04' }}>
                Hồ sơ học sinh toàn trường & danh sách chuyển lớp ({studentsCount} học sinh)
              </p>
            </Link>

            {/* Digital Vault */}
            <Link to="/admin/digital-vault" style={styles.moduleCard('#faf5ff', '#e9d5ff', '#7e22ce')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <FileText size={32} color="#7e22ce" />
                <span style={styles.badge('#f3e8ff', '#6b21a8')}>Hồ sơ số</span>
              </div>
              <h3 style={{ margin: '10px 0 4px 0', fontSize: '17px', color: '#581c87', fontWeight: 'bold' }}>
                Kho Văn Bằng Số
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#9333ea' }}>
                Tra cứu bằng tốt nghiệp, học bạ số & chứng chỉ ({digitalVaultCount} hồ sơ)
              </p>
            </Link>

            {/* Weekly Schedule */}
            <Link to="/admin/schedule" style={styles.moduleCard('#fff1f2', '#fecdd3', '#be123c')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Calendar size={32} color="#be123c" />
                <span style={styles.badge('#ffe4e6', '#9f1239')}>Lịch tuần</span>
              </div>
              <h3 style={{ margin: '10px 0 4px 0', fontSize: '17px', color: '#881337', fontWeight: 'bold' }}>
                Lịch Công Tác Tuần
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#e11d48' }}>
                Lịch báo giảng, lịch họp chuyên môn & sự kiện nhà trường
              </p>
            </Link>

            {/* App Hub */}
            <Link to="/admin/app-hub" style={styles.moduleCard('#f0fdfa', '#99f6e4', '#0f766e')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <LayoutDashboard size={32} color="#0f766e" />
                <span style={styles.badge('#ccfbf1', '#115e59')}>Tiện ích Hub</span>
              </div>
              <h3 style={{ margin: '10px 0 4px 0', fontSize: '17px', color: '#134e4a', fontWeight: 'bold' }}>
                Cổng Tiện Ích Chuyên Môn
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#0d9488' }}>
                Kho ứng dụng & tiện ích tra cứu công việc cho giáo viên
              </p>
            </Link>

          </div>

          {/* ACADEMIC OPERATIONAL STATS SUMMARY GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={styles.statBox('#ffffff', '#e2e8f0')}>
              <Clock color="#0284c7" size={28} />
              <div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b' }}>
                  {tasks.filter(t => t.status !== 'completed').length}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Nhiệm vụ Chuyên môn Đang làm</div>
              </div>
            </div>

            <div style={styles.statBox('#ffffff', '#e2e8f0')}>
              <CheckCircle color="#166534" size={28} />
              <div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b' }}>
                  {tasks.filter(t => t.status === 'completed').length}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Nhiệm vụ Đã hoàn thành</div>
              </div>
            </div>

            <div style={styles.statBox('#ffffff', '#e2e8f0')}>
              <Bike color="#b45309" size={28} />
              <div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b' }}>{parkingCount}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Vé Xe Máy Học Sinh</div>
              </div>
            </div>

            <div style={styles.statBox('#ffffff', '#e2e8f0')}>
              <Bus color="#1d4ed8" size={28} />
              <div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b' }}>{busCount}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Tuyến Xe Đưa Đón Học Sinh</div>
              </div>
            </div>

            <div style={styles.statBox('#ffffff', '#e2e8f0')}>
              <MessageSquare color="#be123c" size={28} />
              <div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b' }}>{feedbackCount}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Góp Ý & Kiến Nghị Chuyên Môn</div>
              </div>
            </div>
          </div>

          {/* RED ALERT OVERDUE TASKS SECTION */}
          {redAlertTasks.length > 0 && (
            <div style={{ backgroundColor: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#9f1239', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px' }}>
                <AlertTriangle color="#be123c" size={20} /> Báo Động Tiến Độ Chuyên Môn ({redAlertTasks.length} việc cần nhắc nhở)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {redAlertTasks.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #ffe4e6' }}>
                    <div>
                      <strong style={{ color: '#991b1b' }}>{t.title}</strong>
                      <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                        Người thực hiện: {t.assignee || 'Chưa rõ'} | Hạn chót: {new Date(t.deadline).toLocaleDateString('vi-VN')}
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

          {/* ARCHIVED 30TH ANNIVERSARY EVENT RECORD SECTION */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                  <Trophy size={20} color="#d97706" /> Kho Tư Liệu Kỷ Niệm 30 Năm Thành Lập (1996 - 2026)
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Toàn bộ hồ sơ tiểu ban, thông tin khách mời, nhà tài trợ, giải thể thao & tập san đã được cất giữ trân trọng trong mục Lưu trữ Kỷ niệm.
                </p>
              </div>

              <Link 
                to="/admin/committee" 
                style={{ padding: '8px 16px', backgroundColor: '#fffbebfb', color: '#b45309', border: '1px solid #fef08a', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', textDecoration: 'none' }}
              >
                Xem Kho Tư Liệu 30 Năm ➔
              </Link>
            </div>
          </div>

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
  moduleCard: (bg, border, color) => ({
    display: 'flex',
    flexDirection: 'column',
    justify: 'space-between',
    padding: '20px',
    backgroundColor: bg,
    border: `1.5px solid ${border}`,
    borderRadius: '16px',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
  }),
  badge: (bg, color) => ({
    padding: '4px 10px',
    backgroundColor: bg,
    color: color,
    borderRadius: '20px',
    fontWeight: 'bold',
    fontSize: '11.5px'
  }),
  statBox: (bg, border) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px 20px',
    backgroundColor: bg,
    border: `1px solid ${border}`,
    borderRadius: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
  })
};
