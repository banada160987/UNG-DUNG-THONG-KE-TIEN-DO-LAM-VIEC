import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, LogOut, FileText, CheckSquare, Bus, Bike, MessageSquare, Award, Clock, BookOpen, ClipboardList, ShieldAlert, Wallet, Shield, AlertTriangle, Users, ClipboardCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentStudentStr = localStorage.getItem('cbq_current_student');
    if (!currentStudentStr) {
      navigate('/dang-nhap-hoc-sinh');
      return;
    }
    const currentStudent = JSON.parse(currentStudentStr);
    setStudent(currentStudent);

    fetchStudentData(currentStudent.full_name);
  }, [navigate]);

  const fetchStudentData = async (studentName) => {
    setLoading(true);
    try {
      // Fetch Parking Tickets
      const { data: parkingData } = await supabase
        .from('cbq_parking_registrations')
        .select('*')
        .ilike('student_name', `%${studentName}%`)
        .order('created_at', { ascending: false });

      // Fetch Bus Tickets
      const { data: busData } = await supabase
        .from('cbq_bus_registrations')
        .select('*')
        .ilike('student_name', `%${studentName}%`)
        .order('created_at', { ascending: false });

      const allTickets = [
        ...(parkingData || []).map(t => ({ ...t, _type: 'parking' })),
        ...(busData || []).map(t => ({ ...t, _type: 'bus' }))
      ];
      setTickets(allTickets);

      // Fetch Quizzes taken (Need user id or name in cbq_quiz_submissions)
      // Usually it's tracked by student_id or something similar. 
      // We will skip quiz data for now if not strictly tied to name, or try to fetch by name if possible.
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cbq_current_student');
    navigate('/dang-nhap-hoc-sinh');
  };

  if (!student) return null;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1e293b' }}>
            Không gian Học sinh
          </h1>
          <p style={{ margin: 0, color: '#64748b' }}>Hệ sinh thái Cao Bá Quát 4.0</p>
        </div>
        <button 
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <LogOut size={18} /> Đăng xuất
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* ID Card */}
        <div className="glass" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', padding: '24px', borderRadius: '16px', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
            <User size={150} />
          </div>
          <h2 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8, margin: '0 0 16px 0' }}>Thẻ Học Sinh (Digital ID)</h2>
          <div style={{ fontSize: '24px', fontWeight: '900', marginBottom: '8px' }}>{student.full_name}</div>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Lớp</div>
              <div style={{ fontWeight: 'bold' }}>{student.student_class}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Chức vụ</div>
              <div style={{ fontWeight: 'bold' }}>
                {student.role === 'class_president' && '👑 Lớp trưởng'}
                {student.role === 'vp_academics' && '📚 Lớp phó Học tập'}
                {student.role === 'inspector' && '🚩 Cờ Đỏ'}
                {student.role === 'youth_union_secretary' && '🌟 Bí thư'}
                {(!student.role || student.role === 'member') && '🧑‍🎓 Học sinh'}
              </div>
            </div>
          </div>
          <div style={{ background: 'white', padding: '12px', borderRadius: '8px', display: 'inline-block' }}>
            <QRCodeSVG value={`STUDENT:${student.username}`} size={80} level="M" />
          </div>
        </div>

        {/* Quick Links */}
        <div className="glass" style={{ padding: '24px', borderRadius: '16px', background: 'white' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>Tiện ích học đường</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Link to="/binh-chon" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', background: '#f8fafc', borderRadius: '12px', textDecoration: 'none', color: '#0f172a', transition: 'all 0.2s', border: '1px solid #e2e8f0' }}>
              <CheckSquare size={28} color="#0284c7" />
              <span style={{ fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>Bình chọn & Đánh giá</span>
            </Link>
            <Link to="/gop-y" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', background: '#f8fafc', borderRadius: '12px', textDecoration: 'none', color: '#0f172a', transition: 'all 0.2s', border: '1px solid #e2e8f0' }}>
              <MessageSquare size={28} color="#16a34a" />
              <span style={{ fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>Góp ý 24/7</span>
            </Link>
            <Link to="/dang-ky-xe" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', background: '#f8fafc', borderRadius: '12px', textDecoration: 'none', color: '#0f172a', transition: 'all 0.2s', border: '1px solid #e2e8f0' }}>
              <Bike size={28} color="#ea580c" />
              <span style={{ fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>Đăng ký Xe Máy</span>
            </Link>
            <Link to="/thi-truc-tuyen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', background: '#f8fafc', borderRadius: '12px', textDecoration: 'none', color: '#0f172a', transition: 'all 0.2s', border: '1px solid #e2e8f0' }}>
              <Award size={28} color="#9333ea" />
              <span style={{ fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>Thi Trực Tuyến</span>
            </Link>
          </div>
        </div>

        {/* My Tickets */}
        <div className="glass" style={{ padding: '24px', borderRadius: '16px', background: 'white' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>Vé Xe Đã Đăng Ký</h2>
          {loading ? (
            <p>Đang tải dữ liệu...</p>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0' }}>
              <FileText size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
              <p>Bạn chưa đăng ký vé xe nào.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
              {tickets.map(ticket => (
                <div key={ticket.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px', borderLeft: `4px solid ${ticket.status === 'approved' ? '#22c55e' : '#eab308'}` }}>
                  {ticket._type === 'parking' ? <Bike size={24} color="#0f172a" /> : <Bus size={24} color="#0f172a" />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '15px' }}>
                      {ticket.ticket_code}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      {ticket._type === 'parking' ? 'Vé tháng xe máy/đạp' : 'Xe buýt đưa đón'}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '999px', background: ticket.status === 'approved' ? '#dcfce7' : '#fef9c3', color: ticket.status === 'approved' ? '#166534' : '#854d0e' }}>
                    {ticket.status === 'approved' ? 'Hợp lệ' : 'Chờ xử lý'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CÁN BỘ LỚP / QUẢN TRỊ VIÊN */}
      {student.role && student.role !== 'member' && (
        <div style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield color="#3b82f6" /> Khu vực Quản trị - Dành cho Cán bộ Lớp
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            {student.role === 'class_president' && (
              <>
                <div className="glass" style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, #fef08a, #fde047)', border: '1px solid #facc15' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '12px', color: '#ca8a04' }}><BookOpen size={24} /></div>
                    <h3 style={{ margin: 0, color: '#854d0e', fontSize: '16px' }}>Sổ đầu bài điện tử</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#713f12', margin: '0 0 16px 0' }}>Ghi nhận tiết học, điểm danh đầu giờ và nhận xét của GV bộ môn.</p>
                  <button style={{ width: '100%', padding: '10px', background: '#ca8a04', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Mở Sổ Đầu Bài</button>
                </div>
                
                <div className="glass" style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, #fed7aa, #fdba74)', border: '1px solid #fb923c' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '12px', color: '#c2410c' }}><ClipboardCheck size={24} /></div>
                    <h3 style={{ margin: 0, color: '#9a3412', fontSize: '16px' }}>Phân công trực nhật</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#7c2d12', margin: '0 0 16px 0' }}>Xếp lịch trực nhật, lao động và theo dõi tiến độ hoàn thành.</p>
                  <button style={{ width: '100%', padding: '10px', background: '#ea580c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Mở Bảng Phân Công</button>
                </div>
              </>
            )}

            {student.role === 'vp_academics' && (
              <>
                <div className="glass" style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, #bfdbfe, #93c5fd)', border: '1px solid #60a5fa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '12px', color: '#2563eb' }}><ClipboardList size={24} /></div>
                    <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: '16px' }}>Báo cáo chuyên cần HT</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#1e3a8a', margin: '0 0 16px 0' }}>Báo cáo số lượng học sinh làm bài tập về nhà hàng ngày.</p>
                  <button style={{ width: '100%', padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Báo cáo ngay</button>
                </div>
              </>
            )}

            {student.role === 'inspector' && (
              <>
                <div className="glass" style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, #fecaca, #fca5a5)', border: '1px solid #f87171' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '12px', color: '#dc2626' }}><ShieldAlert size={24} /></div>
                    <h3 style={{ margin: 0, color: '#7f1d1d', fontSize: '16px' }}>Sổ Chấm điểm Nề nếp</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#7f1d1d', margin: '0 0 16px 0' }}>Chấm điểm thi đua di động (Thanh tra chéo các lớp).</p>
                  <button style={{ width: '100%', padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Bắt đầu chấm điểm</button>
                </div>
              </>
            )}

            {student.role === 'youth_union_secretary' && (
              <>
                <div className="glass" style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, #bbf7d0, #86efac)', border: '1px solid #4ade80' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '12px', color: '#16a34a' }}><Wallet size={24} /></div>
                    <h3 style={{ margin: 0, color: '#14532d', fontSize: '16px' }}>Quản lý Quỹ đoàn</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#14532d', margin: '0 0 16px 0' }}>Sổ thu/chi quỹ đoàn trực tuyến, đảm bảo minh bạch.</p>
                  <button style={{ width: '100%', padding: '10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Mở Sổ Quỹ</button>
                </div>
                
                <div className="glass" style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, #e9d5ff, #d8b4fe)', border: '1px solid #c084fc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ padding: '10px', background: 'white', borderRadius: '12px', color: '#9333ea' }}><Users size={24} /></div>
                    <h3 style={{ margin: 0, color: '#4c1d95', fontSize: '16px' }}>Điểm danh Sự kiện</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#4c1d95', margin: '0 0 16px 0' }}>Điểm danh đoàn viên tham gia mít tinh, hội thao.</p>
                  <button style={{ width: '100%', padding: '10px', background: '#9333ea', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Điểm danh QR</button>
                </div>
              </>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}
