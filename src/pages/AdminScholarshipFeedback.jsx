import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Download, Trash2, Search, Filter, RefreshCw, Printer, CheckCircle2, AlertCircle, Clock, Building2 } from 'lucide-react';

const REQUIRED_ORGANIZATIONS = [
  'BCH Đảng ủy trường THPT Cao Bá Quát',
  'Ban Thường vụ Đoàn trường THPT Cao Bá Quát',
  'Tổ Ngữ văn',
  'Tổ Toán',
  'Tổ Tin học',
  'Tổ Vật lí',
  'Tổ Hóa học',
  'Tổ Sinh học',
  'Tổ Sử - Địa - GDKTPL',
  'Tổ Ngoại ngữ',
  'Tổ GDTC - QPAN',
  'Tổ Văn phòng'
];

export default function AdminScholarshipFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  async function fetchFeedbacks() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_scholarship_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (err) {
      console.warn("Dùng LocalStorage fallback:", err);
      const local = JSON.parse(localStorage.getItem('cbq_local_scholarship_feedbacks') || '[]');
      setFeedbacks(local);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ý kiến góp ý này không?")) return;

    try {
      await supabase.from('cbq_scholarship_feedback').delete().eq('id', id);
      setFeedbacks(prev => prev.filter(item => item.id !== id));
      
      const local = JSON.parse(localStorage.getItem('cbq_local_scholarship_feedbacks') || '[]');
      const updatedLocal = local.filter(item => item.id !== id);
      localStorage.setItem('cbq_local_scholarship_feedbacks', JSON.stringify(updatedLocal));
    } catch (err) {
      console.error("Lỗi xóa ý kiến:", err);
      alert("Không thể xóa. Vui lòng thử lại!");
    }
  };

  const exportCSV = () => {
    if (feedbacks.length === 0) {
      alert("Không có dữ liệu để xuất file!");
      return;
    }

    let csvContent = "\uFEFFSTT,ĐƠN VỊ GÓP Ý,NGƯỜI ĐẠI DIỆN,SỐ ĐIỆN THOẠI,EMAIL,NỘI DUNG GÓP Ý DỰ THẢO ĐỀ ÁN QUỸ HỌC BỔNG,LINK FILE ĐÍNH KÈM,NGÀY GỬI\n";
    filteredFeedbacks.forEach((item, idx) => {
      const row = [
        idx + 1,
        `"${item.organization_unit || ''}"`,
        `"${item.representative_name || ''}"`,
        `"${item.phone || ''}"`,
        `"${item.email || ''}"`,
        `"${(item.feedback_content || '').replace(/"/g, '""')}"`,
        `"${item.attached_file_url || ''}"`,
        `"${new Date(item.created_at).toLocaleDateString('vi-VN')}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `TỔNG_HỢP_GÓP_Ý_ĐỀ_ÁN_QUỸ_HỌC_BỔNG_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const submittedOrgNames = feedbacks.map(f => f.organization_unit);
  const submittedCount = REQUIRED_ORGANIZATIONS.filter(org => submittedOrgNames.some(name => name.includes(org))).length;

  const filteredFeedbacks = feedbacks.filter(item => {
    const matchSearch = (item.organization_unit || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.representative_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.feedback_content || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1250px', margin: '0 auto' }}>
      
      {/* HEADER & TOOLBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={26} color="#166534" /> TỔNG HỢP Ý KIẾN GÓP Ý ĐỀ ÁN QUỸ HỌC BỔNG ({feedbacks.length})
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#64748b' }}>
            Công cụ tổng hợp tự động dành cho Văn phòng nhà trường (Đ/c Nghiêm Xuân Bảo) trình Sở GD&ĐT
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={fetchFeedbacks}
            style={{ padding: '9px 14px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={16} /> Tải Lại
          </button>
          
          <button
            onClick={exportCSV}
            style={{ padding: '9px 16px', background: '#166534', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(22,101,52,0.2)' }}
          >
            <Download size={16} /> Xuất File Tổng Hợp (Excel / CSV)
          </button>
        </div>
      </div>

      {/* STATS CHECKLIST OF ORGANIZATIONS */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1.5px solid #cbd5e1', padding: '18px', marginBottom: '22px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontWeight: 'bold', color: '#166534', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} color="#166534" /> THỐNG KÊ TIẾN ĐỘ GỬI GÓP Ý CỦA CÁC TỔ / ĐƠN VỊ ({submittedCount} / {REQUIRED_ORGANIZATIONS.length} ĐÃ NỘP)
          </div>
          <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '600' }}>Hạn chót: <span style={{ color: '#dc2626' }}>19/8/2026</span></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          {REQUIRED_ORGANIZATIONS.map(org => {
            const hasSubmitted = submittedOrgNames.some(name => name.includes(org));
            return (
              <div key={org} style={{ background: hasSubmitted ? '#f0fdf4' : '#f8fafc', border: `1px solid ${hasSubmitted ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '10px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ fontWeight: 'bold', color: hasSubmitted ? '#166534' : '#64748b' }}>{org}</span>
                {hasSubmitted ? (
                  <span style={{ color: '#166534', fontWeight: 'bold', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Đã gửi
                  </span>
                ) : (
                  <span style={{ color: '#854d0e', fontWeight: '600', background: '#fef9c3', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> Chưa gửi
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder="Tìm theo Đơn vị, Người đại diện hoặc Nội dung góp ý..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
          />
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '12px' }} />
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải danh sách góp ý...</div>
        ) : filteredFeedbacks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Chưa có đơn vị nào gửi ý kiến góp ý.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#166534', color: '#ffffff' }}>
                  <th style={{ padding: '12px 10px', textAlign: 'center', width: '50px' }}>STT</th>
                  <th style={{ padding: '12px 10px' }}>ĐƠN VỊ GÓP Ý</th>
                  <th style={{ padding: '12px 10px' }}>NGƯỜI ĐẠI DIỆN / TỔ TRƯỞNG</th>
                  <th style={{ padding: '12px 10px' }}>SỐ ĐIỆN THOẠI</th>
                  <th style={{ padding: '12px 10px' }}>NỘI DUNG GÓP Ý CHI TIẾT</th>
                  <th style={{ padding: '12px 10px' }}>TỆP ĐÍNH KÈM</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#166534' }}>
                      {item.organization_unit}
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: '600', color: '#1e293b' }}>{item.representative_name}</td>
                    <td style={{ padding: '12px 10px', color: '#0369a1', fontFamily: 'monospace' }}>{item.phone}</td>
                    <td style={{ padding: '12px 10px', color: '#334155', maxWidth: '380px' }}>
                      <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', lineHeight: '1.5' }}>
                        {item.feedback_content}
                      </div>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      {item.attached_file_url ? (
                        <a href={item.attached_file_url} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 'bold', textDecoration: 'underline' }}>
                          Xem File
                        </a>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{ padding: '6px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        title="Xóa ý kiến này"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

