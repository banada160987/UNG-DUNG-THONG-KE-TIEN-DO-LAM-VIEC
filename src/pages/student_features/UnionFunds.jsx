import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { ArrowLeft, Plus, Save, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function UnionFunds() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    amount: '',
    transaction_type: 'thu',
    description: ''
  });

  useEffect(() => {
    const currentStudentStr = localStorage.getItem('cbq_current_student');
    if (!currentStudentStr) {
      navigate('/dang-nhap-hoc-sinh');
      return;
    }
    const currentStudent = JSON.parse(currentStudentStr);
    
    if (currentStudent.role !== 'youth_union_secretary') {
      alert("Bạn không có quyền truy cập trang này. Chức năng chỉ dành cho Bí thư.");
      navigate('/student-dashboard');
      return;
    }
    
    setStudent(currentStudent);
    fetchTransactions(currentStudent.student_class);
  }, [navigate]);

  const fetchTransactions = async (className) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_youth_union_funds')
        .select('*')
        .eq('class_name', className)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setTransactions(data);
        const currentBalance = data.reduce((acc, curr) => {
          return curr.transaction_type === 'thu' ? acc + Number(curr.amount) : acc - Number(curr.amount);
        }, 0);
        setBalance(currentBalance);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) {
      alert("Vui lòng điền đủ Số tiền và Lý do.");
      return;
    }

    const newRecord = {
      class_name: student.student_class,
      transaction_date: formData.transaction_date,
      amount: Number(formData.amount),
      transaction_type: formData.transaction_type,
      description: formData.description,
      logged_by: student.username
    };

    try {
      const { error } = await supabase
        .from('cbq_youth_union_funds')
        .insert([newRecord]);
        
      if (error) throw error;
      
      alert("Đã ghi nhận giao dịch thành công!");
      setShowForm(false);
      setFormData({ transaction_date: new Date().toISOString().split('T')[0], amount: '', transaction_type: 'thu', description: '' });
      fetchTransactions(student.student_class);
    } catch (err) {
      alert("Lỗi khi lưu: " + err.message);
    }
  };

  if (!student) return null;

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      <Link to="/student-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', marginBottom: '24px', fontWeight: 'bold' }}>
        <ArrowLeft size={20} /> Quay lại Không gian Học sinh
      </Link>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Wallet color="#16a34a" size={32} /> Quản Lý Quỹ Đoàn
          </h1>
          <p style={{ margin: 0, color: '#64748b' }}>Quản lý bởi Bí thư <strong>{student.full_name}</strong> - Lớp <strong>{student.student_class}</strong></p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', padding: '24px', borderRadius: '20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.4)' }}>
          <div>
            <div style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, marginBottom: '8px' }}>Tồn Quỹ Hiện Tại</div>
            <div style={{ fontSize: '36px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {balance.toLocaleString('vi-VN')} <span style={{ fontSize: '24px' }}>VNĐ</span>
            </div>
          </div>
          <DollarSign size={64} opacity={0.2} />
        </div>
      </div>

      <button 
        onClick={() => setShowForm(!showForm)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginBottom: '32px' }}
      >
        <Plus size={20} /> Ghi nhận Thu / Chi
      </button>

      {showForm && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #4ade80', marginBottom: '32px', boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.1)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#14532d', fontSize: '18px' }}>Giao dịch mới</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Loại giao dịch (*)</label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px', border: formData.transaction_type === 'thu' ? '2px solid #22c55e' : '1px solid #cbd5e1', borderRadius: '8px', background: formData.transaction_type === 'thu' ? '#f0fdf4' : 'white', flex: 1, fontWeight: 'bold' }}>
                  <input type="radio" name="type" value="thu" checked={formData.transaction_type === 'thu'} onChange={e => setFormData({...formData, transaction_type: e.target.value})} style={{ display: 'none' }} />
                  <TrendingUp color="#22c55e" /> Tiền Thu Vào
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px', border: formData.transaction_type === 'chi' ? '2px solid #ef4444' : '1px solid #cbd5e1', borderRadius: '8px', background: formData.transaction_type === 'chi' ? '#fef2f2' : 'white', flex: 1, fontWeight: 'bold' }}>
                  <input type="radio" name="type" value="chi" checked={formData.transaction_type === 'chi'} onChange={e => setFormData({...formData, transaction_type: e.target.value})} style={{ display: 'none' }} />
                  <TrendingDown color="#ef4444" /> Tiền Chi Ra
                </label>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Ngày giao dịch (*)</label>
              <input type="date" required value={formData.transaction_date} onChange={e => setFormData({...formData, transaction_date: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Số tiền (VNĐ) (*)</label>
              <input type="number" required placeholder="VD: 50000" min="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Lý do / Mô tả (*)</label>
              <input type="text" required placeholder="VD: Thu đoàn phí tháng 9, Chi mua giấy A0 báo tường..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '12px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
              <button type="submit" style={{ padding: '12px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Lưu Giao Dịch</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '18px' }}>Lịch sử giao dịch</h3>
        
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0' }}>Chưa có giao dịch nào được ghi nhận.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {transactions.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', borderRadius: '12px', borderLeft: `4px solid ${t.transaction_type === 'thu' ? '#22c55e' : '#ef4444'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ padding: '10px', background: t.transaction_type === 'thu' ? '#dcfce7' : '#fee2e2', borderRadius: '12px', color: t.transaction_type === 'thu' ? '#16a34a' : '#dc2626' }}>
                    {t.transaction_type === 'thu' ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '15px' }}>{t.description}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{new Date(t.transaction_date).toLocaleDateString('vi-VN')}</div>
                  </div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: t.transaction_type === 'thu' ? '#16a34a' : '#dc2626' }}>
                  {t.transaction_type === 'thu' ? '+' : '-'}{Number(t.amount).toLocaleString('vi-VN')} đ
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
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' };
