import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Download, Trash2, Search, Filter, RefreshCw, PlusCircle, CheckCircle2 } from 'lucide-react';

const OFFICIAL_SPORTS = [
  'Kéo co (nam - phối hợp)',
  'Pickleball (đôi nam)',
  'Pickleball (đôi nữ)',
  'Pickleball (đôi nam - nữ)',
  'Bóng đá Futsal Nam',
  'Bóng chuyền hơi Nữ'
];

export default function AdminSports() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_sports_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (err) {
      console.warn("Dùng fallback LocalStorage:", err);
      const local = JSON.parse(localStorage.getItem('cbq_local_sports_regs') || '[]');
      setRegistrations(local);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lượt đăng ký này không?")) return;

    try {
      await supabase.from('cbq_sports_registrations').delete().eq('id', id);
      setRegistrations(prev => prev.filter(item => item.id !== id));
      
      // Local fallback
      const local = JSON.parse(localStorage.getItem('cbq_local_sports_regs') || '[]');
      const updatedLocal = local.filter(item => item.id !== id);
      localStorage.setItem('cbq_local_sports_regs', JSON.stringify(updatedLocal));
    } catch (err) {
      console.error("Lỗi xóa VĐV:", err);
      alert("Không thể xóa. Vui lòng thử lại!");
    }
  };

  const exportCSV = () => {
    if (registrations.length === 0) {
      alert("Không có dữ liệu để xuất file!");
      return;
    }

    let csvContent = "\uFEFFSTT,HỌ VÀ TÊN,MÔN,SỐ ĐIỆN THOẠI,NIÊN KHÓA,ĐƠN VỊ,GHI CHÚ,ĐỐI TƯỢNG,NGÀY ĐĂNG KÝ\n";
    filteredRegistrations.forEach((item, idx) => {
      const row = [
        idx + 1,
        `"${item.full_name || ''}"`,
        `"${item.sport_name || ''}"`,
        `"${item.phone || ''}"`,
        `"${item.cohort_year || ''}"`,
        `"${item.unit_name || ''}"`,
        `"${item.notes || ''}"`,
        `"${item.user_category || ''}"`,
        `"${new Date(item.created_at).toLocaleDateString('vi-VN')}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `DANH_SÁCH_VĐV_THỂ_THAO_30_NĂM_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRegistrations = registrations.filter(item => {
    const matchSport = selectedSport === 'Tất cả' || item.sport_name === selectedSport;
    const matchSearch = (item.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.unit_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.phone || '').includes(searchQuery);
    return matchSport && matchSearch;
  });

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0369a1', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy size={26} color="#0369a1" /> QUẢN LÝ ĐĂNG KÝ VẬN ĐỘNG VIÊN THỂ THAO ({registrations.length})
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#64748b' }}>
            Quản lý và xuất danh sách VĐV thi đấu 06 môn thể thao Kỷ niệm 30 năm Cao Bá Quát
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchRegistrations}
            style={{ padding: '9px 15px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={16} /> Tải Lại
          </button>
          
          <button
            onClick={exportCSV}
            style={{ padding: '9px 16px', background: '#166534', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(22,101,52,0.2)' }}
          >
            <Download size={16} /> Xuất File Excel / CSV
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Tìm theo Tên, Đơn vị hoặc SĐT..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
          />
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '12px' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#64748b" />
          <select
            value={selectedSport}
            onChange={e => setSelectedSport(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', background: '#ffffff' }}
          >
            <option value="Tất cả">Tất Cả Môn Thi Đấu ({registrations.length})</option>
            {OFFICIAL_SPORTS.map(sp => (
              <option key={sp} value={sp}>{sp}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải danh sách...</div>
        ) : filteredRegistrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Chưa có lượt đăng ký VĐV nào thỏa mãn điều kiện.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0369a1', color: '#ffffff' }}>
                  <th style={{ padding: '12px 10px', textAlign: 'center', width: '50px' }}>STT</th>
                  <th style={{ padding: '12px 10px' }}>HỌ VÀ TÊN</th>
                  <th style={{ padding: '12px 10px' }}>MÔN</th>
                  <th style={{ padding: '12px 10px' }}>SỐ ĐIỆN THOẠI</th>
                  <th style={{ padding: '12px 10px' }}>NIÊN KHÓA</th>
                  <th style={{ padding: '12px 10px' }}>ĐƠN VỊ</th>
                  <th style={{ padding: '12px 10px' }}>TRẠNG THÁI KINH PHÍ</th>
                  <th style={{ padding: '12px 10px' }}>GHI CHÚ</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#1e293b' }}>
                      {item.full_name}
                      <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 'normal' }}>{item.user_category}</div>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', fontSize: '12px' }}>
                        {item.sport_name}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#0369a1', fontFamily: 'monospace' }}>{item.phone}</td>
                    <td style={{ padding: '12px 10px', color: '#475569' }}>{item.cohort_year || '-'}</td>
                    <td style={{ padding: '12px 10px', fontWeight: '600', color: '#334155' }}>{item.unit_name}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <button
                        onClick={async () => {
                          const newStatus = (item.payment_status || '').includes('Đã nộp') ? 'Chờ nộp kinh phí (300.000đ)' : 'Đã nộp kinh phí (300.000đ)';
                          setRegistrations(prev => prev.map(r => r.id === item.id ? { ...r, payment_status: newStatus } : r));
                          try {
                            await supabase.from('cbq_sports_registrations').update({ payment_status: newStatus }).eq('id', item.id);
                          } catch (e) {
                            console.warn("Update local fallback:", e);
                          }
                        }}
                        style={{ padding: '4px 10px', borderRadius: '12px', border: 'none', background: (item.payment_status || '').includes('Miễn phí') ? '#dcfce7' : (item.payment_status || '').includes('Đã nộp') ? '#dcfce7' : '#fef9c3', color: (item.payment_status || '').includes('Miễn phí') ? '#166534' : (item.payment_status || '').includes('Đã nộp') ? '#166534' : '#854d0e', fontWeight: 'bold', fontSize: '11.5px', cursor: 'pointer' }}
                        title="Click để đổi trạng thái nộp kinh phí"
                      >
                        {item.payment_status || (item.fee_amount === 0 ? 'Miễn phí' : 'Chờ nộp kinh phí (300.000đ)')}
                      </button>
                    </td>
                    <td style={{ padding: '12px 10px', color: '#64748b', fontSize: '12px' }}>{item.notes || '-'}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{ padding: '6px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        title="Xóa lượt đăng ký này"
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
