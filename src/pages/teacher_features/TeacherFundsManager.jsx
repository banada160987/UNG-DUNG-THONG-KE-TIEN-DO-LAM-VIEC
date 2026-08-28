import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Plus, Save, Wallet, CheckCircle, Clock } from 'lucide-react';

export default function TeacherFundsManager() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    campaign_name: '',
    amount_per_student: '',
    deadline: ''
  });

  useEffect(() => {
    const currentTeacherStr = localStorage.getItem('cbq_current_teacher');
    if (!currentTeacherStr) {
      navigate('/dang-nhap-giao-vien');
      return;
    }
    const currentTeacher = JSON.parse(currentTeacherStr);
    
    if (!currentTeacher.homeroom_class) {
      alert("Chức năng này chỉ dành cho Giáo viên chủ nhiệm.");
      navigate('/teacher-dashboard');
      return;
    }
    
    setTeacher(currentTeacher);
    fetchCampaigns(currentTeacher.homeroom_class);
  }, [navigate]);

  const fetchCampaigns = async (className) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_fee_campaigns')
        .select('*')
        .eq('class_name', className)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setCampaigns(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.campaign_name || !formData.amount_per_student) {
      alert("Vui lòng điền đủ Tên đợt thu và Số tiền.");
      return;
    }

    const newRecord = {
      class_name: teacher.homeroom_class,
      campaign_name: formData.campaign_name,
      amount_per_student: Number(formData.amount_per_student),
      deadline: formData.deadline || null,
      created_by: teacher.username
    };

    try {
      const { error } = await supabase
        .from('cbq_fee_campaigns')
        .insert([newRecord]);
        
      if (error) throw error;
      
      alert("Đã tạo đợt thu thành công!");
      setShowForm(false);
      setFormData({ campaign_name: '', amount_per_student: '', deadline: '' });
      fetchCampaigns(teacher.homeroom_class);
    } catch (err) {
      alert("Lỗi khi lưu: " + err.message);
    }
  };

  if (!teacher) return null;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      <Link to="/teacher-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', marginBottom: '24px', fontWeight: 'bold' }}>
        <ArrowLeft size={20} /> Bảng điều khiển GVCN
      </Link>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Wallet color="#16a34a" size={32} /> Quản Lý Thu/Chi Lớp Chủ Nhiệm
          </h1>
          <p style={{ margin: 0, color: '#64748b' }}>Lớp: <strong>{teacher.homeroom_class}</strong> | GVCN: <strong>{teacher.full_name}</strong></p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Plus size={18} /> Tạo đợt thu mới
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #4ade80', marginBottom: '32px', boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.1)' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#14532d', fontSize: '18px' }}>Tạo đợt thu tiền</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Tên đợt thu (*)</label>
              <input type="text" required placeholder="VD: Thu Bảo hiểm y tế năm học 2023-2024" value={formData.campaign_name} onChange={e => setFormData({...formData, campaign_name: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Định mức mỗi học sinh (VNĐ) (*)</label>
              <input type="number" required placeholder="VD: 680000" min="0" value={formData.amount_per_student} onChange={e => setFormData({...formData, amount_per_student: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Hạn chót đóng tiền (Tùy chọn)</label>
              <input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
              <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}><Save size={18} /> Lưu đợt thu</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '18px' }}>Danh sách các đợt thu</h3>
        
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0' }}>Lớp {teacher.homeroom_class} chưa có đợt thu nào.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {campaigns.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '18px' }}>{c.campaign_name}</h4>
                  <div style={{ display: 'flex', gap: '16px', color: '#64748b', fontSize: '14px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Wallet size={16} /> Định mức: <strong style={{ color: '#0f172a' }}>{Number(c.amount_per_student).toLocaleString('vi-VN')} đ/HS</strong></span>
                    {c.deadline && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={16} /> Hạn chót: {new Date(c.deadline).toLocaleDateString('vi-VN')}</span>}
                  </div>
                </div>
                <div>
                  <button style={{ padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={18} color="#16a34a" /> Cập nhật người đóng
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' };
