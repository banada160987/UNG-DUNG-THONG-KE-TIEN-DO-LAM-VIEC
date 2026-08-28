import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { QrCode, Plus, Save, FileText, CheckCircle, Search, FileBadge, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';

export default function AdminDigitalVault() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    student_name: '',
    student_class: '',
    document_type: 'Giấy khen',
    title: '',
    content: '',
    issued_by: 'Hiệu trưởng'
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_digital_documents')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setDocuments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateDocumentCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'CBQ-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_name || !formData.student_class || !formData.title) {
      alert("Vui lòng điền đủ các trường bắt buộc (*).");
      return;
    }

    const newRecord = {
      ...formData,
      document_code: generateDocumentCode(),
    };

    try {
      const { error } = await supabase
        .from('cbq_digital_documents')
        .insert([newRecord]);
        
      if (error) throw error;
      
      alert(`Đã cấp ${formData.document_type} thành công! Mã QR Code: ${newRecord.document_code}`);
      setShowForm(false);
      setFormData({ student_name: '', student_class: '', document_type: 'Giấy khen', title: '', content: '', issued_by: 'Hiệu trưởng' });
      fetchDocuments();
    } catch (err) {
      alert("Lỗi khi lưu: " + err.message);
    }
  };
  
  const handleRevoke = async (id, currentStatus) => {
    if(!window.confirm(`Bạn có chắc muốn ${currentStatus === 'Active' ? 'thu hồi' : 'kích hoạt lại'} giấy tờ này?`)) return;
    
    try {
      const newStatus = currentStatus === 'Active' ? 'Revoked' : 'Active';
      const { error } = await supabase
        .from('cbq_digital_documents')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      fetchDocuments();
    } catch (err) {
      alert("Lỗi cập nhật: " + err.message);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.student_class.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.document_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileBadge color="#3b82f6" size={32} /> Cấp phát & Số hóa Văn Bằng
          </h1>
          <p style={{ margin: 0, color: '#64748b' }}>Quản lý Giấy khen, Giấy chứng nhận lưu trữ đám mây cho học sinh.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Plus size={18} /> Cấp Giấy tờ mới
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #93c5fd', marginBottom: '32px', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.1)' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#1e3a8a', fontSize: '18px' }}>Nhập thông tin cấp phát</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Tên Học Sinh (*)</label>
              <input type="text" required placeholder="VD: Nguyễn Văn A" value={formData.student_name} onChange={e => setFormData({...formData, student_name: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Lớp (*)</label>
              <input type="text" required placeholder="VD: 10A1" value={formData.student_class} onChange={e => setFormData({...formData, student_class: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Loại giấy tờ (*)</label>
              <select value={formData.document_type} onChange={e => setFormData({...formData, document_type: e.target.value})} style={inputStyle}>
                <option value="Giấy khen">Giấy khen (Thành tích HT/Nề nếp)</option>
                <option value="Giấy chứng nhận">Giấy chứng nhận (Đoàn viên/Hoạt động)</option>
                <option value="Giấy xác nhận">Giấy xác nhận (Đang học tại trường)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Đơn vị/Người cấp (*)</label>
              <input type="text" required placeholder="VD: Hiệu trưởng" value={formData.issued_by} onChange={e => setFormData({...formData, issued_by: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Tiêu đề Giấy tờ (*)</label>
              <input type="text" required placeholder="VD: Giấy khen Đạt Danh hiệu Học sinh Giỏi Học kỳ 1" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Nội dung chi tiết (Tùy chọn)</label>
              <textarea placeholder="Ghi chú thêm về thành tích hoặc mục đích sử dụng..." value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} style={{...inputStyle, height: '80px', resize: 'vertical'}} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
              <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}><Save size={18} /> Cấp Phát Kỹ Thuật Số</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px' }}>Kho Lưu Trữ ({filteredDocs.length})</h3>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Tìm theo Tên, Lớp hoặc Mã QR..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : documents.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0' }}>Chưa có giấy tờ số hóa nào được cấp phát.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={thStyle}>Mã QR / ID</th>
                  <th style={thStyle}>Học Sinh</th>
                  <th style={thStyle}>Thông Tin Giấy Tờ</th>
                  <th style={thStyle}>Ngày Cấp</th>
                  <th style={thStyle}>Trạng Thái</th>
                  <th style={thStyle}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map(doc => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={tdStyle}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#1d4ed8', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px' }}>
                        <QrCode size={14} /> {doc.document_code}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <strong>{doc.student_name}</strong><br/>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Lớp: {doc.student_class}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ display: 'inline-block', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#475569', marginBottom: '4px' }}>{doc.document_type}</span><br/>
                      <strong>{doc.title}</strong>
                    </td>
                    <td style={tdStyle}>{new Date(doc.issue_date).toLocaleDateString('vi-VN')}</td>
                    <td style={tdStyle}>
                      {doc.status === 'Active' 
                        ? <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14}/> Có hiệu lực</span>
                        : <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Trash2 size={14}/> Đã thu hồi</span>
                      }
                    </td>
                    <td style={tdStyle}>
                      <button 
                        onClick={() => handleRevoke(doc.id, doc.status)}
                        style={{ padding: '6px 10px', background: doc.status === 'Active' ? '#fee2e2' : '#dcfce7', color: doc.status === 'Active' ? '#dc2626' : '#16a34a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                      >
                        {doc.status === 'Active' ? 'Thu hồi' : 'Kích hoạt lại'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' };
const thStyle = { padding: '12px 16px', fontSize: '13px', fontWeight: 'bold' };
const tdStyle = { padding: '12px 16px', fontSize: '14px', color: '#334155' };
