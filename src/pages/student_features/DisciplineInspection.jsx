import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Plus, Save, ShieldAlert, Camera, Search } from 'lucide-react';

const SCHOOL_CLASSES = [
  '10A01', '10A02', '10A03', '10A04', '10A05', '10A06', '10A07', '10A08', '10A09', '10A10', '10A11', '10A12',
  '11A01', '11A02', '11A03', '11A04', '11A05', '11A06', '11A07', '11A08', '11A09', '11A10', '11A11', '11A12',
  '12A01', '12A02', '12A03', '12A04', '12A05', '12A06', '12A07', '12A08', '12A09', '12A10', '12A11', '12A12'
];

const VIOLATION_TYPES = [
  { id: 'v1', name: 'Không đeo thẻ học sinh / Sai phù hiệu', points: 5 },
  { id: 'v2', name: 'Đồng phục sai quy định / Trang phục không chuẩn', points: 5 },
  { id: 'v3', name: 'Đi học muộn / Trễ giờ truy bài', points: 5 },
  { id: 'v4', name: 'Bỏ tiết / Trốn học / Ra ngoài không phép', points: 10 },
  { id: 'v5', name: 'Nói chuyện riêng / Mất trật tự trong giờ học', points: 3 },
  { id: 'v6', name: 'Xả rác / Không vệ sinh phòng học', points: 5 },
  { id: 'v7', name: 'Không tắt quạt, điện khi ra khỏi lớp', points: 5 },
  { id: 'v8', name: 'Sử dụng điện thoại di động không phép', points: 5 },
  { id: 'v9', name: 'Vi phạm nề nếp khác', points: 2 }
];

export default function DisciplineInspection() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    inspected_class: '',
    week_number: 1,
    violation_type: '',
    point_deduction: 5,
    notes: ''
  });

  useEffect(() => {
    const currentStudentStr = localStorage.getItem('cbq_current_student');
    if (!currentStudentStr) {
      navigate('/dang-nhap-hoc-sinh');
      return;
    }
    const currentStudent = JSON.parse(currentStudentStr);
    
    if (currentStudent.role !== 'inspector') {
      alert("Bạn không có quyền truy cập trang này. Chức năng chỉ dành cho Đội Cờ Đỏ.");
      navigate('/student-dashboard');
      return;
    }
    
    setStudent(currentStudent);
    fetchRecords(currentStudent.username);
  }, [navigate]);

  const fetchRecords = async (username) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_discipline_records')
        .select('*')
        .eq('logged_by', username)
        .order('inspection_date', { ascending: false })
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setRecords(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViolationSelect = (e) => {
    const vName = e.target.value;
    const vItem = VIOLATION_TYPES.find(v => v.name === vName);
    setFormData({
      ...formData,
      violation_type: vName,
      point_deduction: vItem ? vItem.points : 5
    });
  };

  const normalizeClassCode = (cls) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.inspected_class || !formData.violation_type) {
      alert("Vui lòng chọn đầy đủ Lớp vi phạm và Hành vi vi phạm.");
      return;
    }

    const myClass = normalizeClassCode(student?.student_class || student?.class_name);
    const targetClass = normalizeClassCode(formData.inspected_class);

    // Chặn xung đột lợi ích: Đội cờ đỏ không được chấm điểm lớp của chính mình
    if (myClass && targetClass && myClass === targetClass) {
      alert(`⚠️ QUY TẮC CÔNG BẰNG ĐỘI CỜ ĐỎ:\n\nBạn thuộc chi đoàn lớp ${myClass}, do đó KHÔNG ĐƯỢC PHÉP tự chấm điểm hoặc trừ điểm lớp của chính mình nhằm đảm bảo tính khách quan.`);
      return;
    }

    const newRecord = {
      inspected_class: targetClass,
      inspection_date: new Date().toISOString().split('T')[0],
      week_number: Number(formData.week_number) || 1,
      violation_type: formData.violation_type,
      point_deduction: Number(formData.point_deduction) || 0,
      notes: formData.notes,
      logged_by: student.username,
      reporter_name: student.full_name || student.username
    };

    try {
      const { error } = await supabase
        .from('cbq_discipline_records')
        .insert([newRecord]);
        
      if (error) throw error;
      
      alert("🎉 Đã ghi nhận trừ điểm vi phạm nề nếp thành công!");
      setShowForm(false);
      setFormData({ inspected_class: '', week_number: 1, violation_type: '', point_deduction: 5, notes: '' });
      fetchRecords(student.username);
    } catch (err) {
      alert("Lỗi khi lưu: " + err.message);
    }
  };

  if (!student) return null;

  return (
    <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      <Link to="/student-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', marginBottom: '20px', fontWeight: 'bold' }}>
        <ArrowLeft size={20} /> Dashboard
      </Link>
      
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: '#fee2e2', borderRadius: '50%', color: '#dc2626', marginBottom: '16px' }}>
          <ShieldAlert size={40} />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 8px 0', color: '#7f1d1d' }}>Sổ Thanh Tra Cờ Đỏ</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Cán bộ thanh tra: <strong>{student.full_name}</strong></p>
      </div>

      {!showForm ? (
        <button 
          onClick={() => setShowForm(true)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 10px 20px -5px rgba(220, 38, 38, 0.4)', marginBottom: '32px' }}
        >
          <Plus size={24} /> BẮT ĐẦU CHẤM ĐIỂM
        </button>
      ) : (
        <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #fca5a5', marginBottom: '32px', boxShadow: '0 10px 30px -5px rgba(220, 38, 38, 0.1)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#991b1b', fontSize: '18px', textAlign: 'center' }}>Ghi nhận Vi phạm</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Tuần thi đua (*)</label>
              <select
                required
                value={formData.week_number}
                onChange={e => setFormData({ ...formData, week_number: Number(e.target.value) })}
                style={{ ...inputStyle, fontSize: '15px' }}
              >
                {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>Tuần {w}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Lớp vi phạm (*)</label>
              <select
                required
                value={formData.inspected_class}
                onChange={e => setFormData({ ...formData, inspected_class: e.target.value })}
                style={{ ...inputStyle, fontSize: '15px' }}
              >
                <option value="">-- Chọn lớp cần chấm điểm --</option>
                {SCHOOL_CLASSES.map(cls => {
                  const isMyClass = normalizeClassCode(cls) === normalizeClassCode(student?.student_class);
                  return (
                    <option key={cls} value={cls} disabled={isMyClass}>
                      {cls} {isMyClass ? '(Lớp của bạn - Khóa chấm điểm)' : ''}
                    </option>
                  );
                })}
              </select>
              {student?.student_class && (
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  ℹ️ Lớp của bạn: <strong>{student.student_class}</strong> (Tự động khóa để phòng ngừa xung đột lợi ích)
                </p>
              )}
            </div>

            <div>
              <label style={labelStyle}>Hành vi vi phạm (*)</label>
              <select required value={formData.violation_type} onChange={handleViolationSelect} style={{ ...inputStyle, fontSize: '15px' }}>
                <option value="">-- Chọn lỗi vi phạm --</option>
                {VIOLATION_TYPES.map(v => <option key={v.id} value={v.name}>{v.name} (-{v.points}đ)</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Mức điểm trừ</label>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>-{formData.point_deduction} điểm</div>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Ghi chú thêm (Tên HS vi phạm, địa điểm...)</label>
              <textarea placeholder="VD: Em Nam tổ 1 không đeo thẻ, đi trễ tiết 1..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} style={{ ...inputStyle, height: '80px', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>Hủy</button>
              <button type="submit" style={{ flex: 2, padding: '14px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>Ghi Nhận Vi Phạm</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '18px' }}>Lịch sử chấm điểm của bạn</h3>
        
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>Chưa có bản ghi nào.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {records.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '900', color: '#991b1b', fontSize: '17px' }}>
                      LỚP {r.inspected_class}
                    </span>
                    <span style={{ fontSize: '12px', backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                      Tuần {r.week_number || 1}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#7f1d1d', fontWeight: 'bold' }}>
                    {r.violation_type}
                  </div>
                  <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px' }}>
                    {new Date(r.inspection_date).toLocaleDateString('vi-VN')} {r.notes && `- ${r.notes}`}
                  </div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>
                  -{r.point_deduction}đ
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '16px', boxSizing: 'border-box' };
