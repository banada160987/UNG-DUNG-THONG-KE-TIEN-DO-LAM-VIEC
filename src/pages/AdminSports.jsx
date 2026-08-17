import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Download, Trash2, Search, Filter, RefreshCw, Dices, Printer, Users, DollarSign, CheckCircle2, AlertCircle, X, ShieldAlert } from 'lucide-react';

const OFFICIAL_SPORTS = [
  'Kéo co Nam Nữ phối hợp (5 Nam, 5 Nữ)',
  'Pickleball (đôi Nam)',
  'Pickleball (đôi Nữ)',
  'Pickleball (đôi Nam - Nữ)',
  'Bóng đá Futsal Nam (2 hiệp x 20 phút)',
  'Bóng chuyền hơi Nữ (dự kiến 6 đội)',
  'Bóng chuyền Nam - Nữ phối hợp (3 Nam, 3 Nữ - Thi đấu theo lớp)'
];

export default function AdminSports() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // Bracket Draw Modal State
  const [showBracketModal, setShowBracketModal] = useState(false);
  const [drawSport, setDrawSport] = useState(OFFICIAL_SPORTS[0]);
  const [numGroups, setNumGroups] = useState(2); // 2 or 4 groups
  const [drawnBrackets, setDrawnBrackets] = useState(null);

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
      
      const local = JSON.parse(localStorage.getItem('cbq_local_sports_regs') || '[]');
      const updatedLocal = local.filter(item => item.id !== id);
      localStorage.setItem('cbq_local_sports_regs', JSON.stringify(updatedLocal));
    } catch (err) {
      console.error("Lỗi xóa VĐV:", err);
      alert("Không thể xóa. Vui lòng thử lại!");
    }
  };

  // EXPORT EXCEL / CSV
  const exportCSV = () => {
    if (registrations.length === 0) {
      alert("Không có dữ liệu để xuất file!");
      return;
    }

    let csvContent = "\uFEFFSTT,HỌ VÀ TÊN,MÔN THI ĐẤU,SỐ ĐIỆN THOẠI,NIÊN KHÓA,ĐƠN VỊ,ĐỐI TƯỢNG,TRẠNG THÁI KINH PHÍ,GHI CHÚ,NGÀY ĐĂNG KÝ\n";
    filteredRegistrations.forEach((item, idx) => {
      const row = [
        idx + 1,
        `"${item.full_name || ''}"`,
        `"${item.sport_name || ''}"`,
        `"${item.phone || ''}"`,
        `"${item.cohort_year || ''}"`,
        `"${item.unit_name || ''}"`,
        `"${item.user_category || ''}"`,
        `"${item.payment_status || (item.fee_amount === 0 ? 'Miễn phí' : 'Chờ nộp')}"`,
        `"${item.notes || ''}"`,
        `"${new Date(item.created_at).toLocaleDateString('vi-VN')}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `DANH_SÁCH_VĐV_BẢNG_ĐẤU_THỂ_THAO_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // RANDOM BRACKET DRAW LOGIC
  const handleRandomDraw = () => {
    const athletesInSport = registrations.filter(r => r.sport_name.includes(drawSport) || drawSport.includes(r.sport_name));
    if (athletesInSport.length === 0) {
      alert(`Hiện tại chưa có VĐV hoặc đội nào đăng ký môn "${drawSport}" để bốc thăm.`);
      return;
    }

    // Shuffle array
    const shuffled = [...athletesInSport].sort(() => Math.random() - 0.5);

    // Divide into groups
    const groups = Array.from({ length: numGroups }, () => []);
    shuffled.forEach((item, idx) => {
      groups[idx % numGroups].push(item);
    });

    setDrawnBrackets(groups);
  };

  // STATISTICAL CALCULATIONS
  const totalVdvs = registrations.length;
  const countDivisionA = registrations.filter(r => (r.fee_amount || 0) > 0 || !(r.user_category || '').includes('Học sinh đang học')).length;
  const countDivisionB = totalVdvs - countDivisionA;
  const paidCount = registrations.filter(r => (r.payment_status || '').includes('Đã nộp')).length;
  const totalExpectedFee = countDivisionA * 300000;
  const totalCollectedFee = paidCount * 300000;

  const filteredRegistrations = registrations.filter(item => {
    const matchSport = selectedSport === 'Tất cả' || item.sport_name.includes(selectedSport) || selectedSport.includes(item.sport_name);
    const matchSearch = (item.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.unit_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.phone || '').includes(searchQuery);
    return matchSport && matchSearch;
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1250px', margin: '0 auto' }}>
      
      {/* TITLE & TOOLBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0369a1', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy size={26} color="#0369a1" /> THỐNG KÊ & SẮP XẾP BẢNG ĐẤU THỂ THAO KỶ NIỆM 30 NĂM
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#64748b' }}>
            Quản lý VĐV, thu kinh phí và công cụ bốc thăm xếp lịch thi đấu dành cho Ban Tổ Chức
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowBracketModal(true)}
            style={{ padding: '9px 15px', background: '#7c3aed', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(124,58,237,0.2)' }}
          >
            <Dices size={16} /> 🎲 Bốc Thăm Chia Bảng Đấu
          </button>

          <button
            onClick={fetchRegistrations}
            style={{ padding: '9px 14px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
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

      {/* STATISTIC DASHBOARD CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '22px' }}>
        <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', borderRadius: '14px', padding: '18px', boxShadow: '0 4px 14px rgba(2,132,199,0.2)' }}>
          <div style={{ fontSize: '12.5px', fontWeight: 'bold', opacity: 0.9 }}>TỔNG VĐV ĐĂNG KÝ</div>
          <div style={{ fontSize: '28px', fontWeight: '800', margin: '4px 0' }}>{totalVdvs} <span style={{ fontSize: '14px' }}>VĐV</span></div>
          <div style={{ fontSize: '11.5px', opacity: 0.85 }}>Bảng A: {countDivisionA} • Bảng B: {countDivisionB}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #bbf7d0', borderRadius: '14px', padding: '18px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#166534' }}>KINH PHÍ ĐÃ THU (300.000đ)</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#166534', margin: '4px 0' }}>
            {totalCollectedFee.toLocaleString('vi-VN')} đ
          </div>
          <div style={{ fontSize: '11.5px', color: '#15803d', fontWeight: '600' }}>Đã nộp: {paidCount} / {countDivisionA} VĐV Bảng A</div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #fef08a', borderRadius: '14px', padding: '18px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#854d0e' }}>DỰ KIẾN TỔNG KINH PHÍ</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#854d0e', margin: '4px 0' }}>
            {totalExpectedFee.toLocaleString('vi-VN')} đ
          </div>
          <div style={{ fontSize: '11.5px', color: '#a16207' }}>Chờ thu: {(totalExpectedFee - totalCollectedFee).toLocaleString('vi-VN')} đ</div>
        </div>

        <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '18px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#334155' }}>HỌC SINH ĐANG HỌC (BẢNG B)</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0369a1', margin: '4px 0' }}>
            {countDivisionB} <span style={{ fontSize: '14px' }}>VĐV</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#166534', fontWeight: 'bold' }}>🎉 MIỄN PHÍ 100%</div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Tìm theo Tên VĐV, Đơn vị hoặc SĐT..."
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
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', background: '#ffffff', fontWeight: 'bold', color: '#0369a1' }}
          >
            <option value="Tất cả">Tất Cả Môn Thi Đấu ({registrations.length})</option>
            {OFFICIAL_SPORTS.map(sp => (
              <option key={sp} value={sp}>{sp}</option>
            ))}
          </select>
        </div>
      </div>

      {/* MAIN DATA TABLE */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải danh sách vận động viên...</div>
        ) : filteredRegistrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Chưa có lượt đăng ký VĐV nào thỏa mãn điều kiện.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#0369a1', color: '#ffffff' }}>
                  <th style={{ padding: '12px 10px', textAlign: 'center', width: '50px' }}>STT</th>
                  <th style={{ padding: '12px 10px' }}>HỌ VÀ TÊN</th>
                  <th style={{ padding: '12px 10px' }}>MÔN THI ĐẤU</th>
                  <th style={{ padding: '12px 10px' }}>SỐ ĐIỆN THOẠI</th>
                  <th style={{ padding: '12px 10px' }}>NIÊN KHÓA / LỚP</th>
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

      {/* MODAL BỐC THĂM CHIA BẢNG ĐẤU */}
      {showBracketModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '25px', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: 'bold', fontSize: '18px' }}>
                <Dices size={24} color="#7c3aed" /> CÔNG CỤ BỐC THĂM CHIA BẢNG ĐẤU TỰ ĐỘNG
              </div>
              <button onClick={() => setShowBracketModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="#64748b" />
              </button>
            </div>

            {/* CONTROL TOOLBAR */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px', background: '#f5f3ff', padding: '16px', borderRadius: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#5b21b6', marginBottom: '5px' }}>Chọn Môn Bốc Thăm *</label>
                <select
                  value={drawSport}
                  onChange={e => setDrawSport(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #c4b5fd', fontSize: '13.5px' }}
                >
                  {OFFICIAL_SPORTS.map(sp => (
                    <option key={sp} value={sp}>{sp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#5b21b6', marginBottom: '5px' }}>Số Lượng Bảng Đấu *</label>
                <select
                  value={numGroups}
                  onChange={e => setNumGroups(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #c4b5fd', fontSize: '13.5px' }}
                >
                  <option value={2}>Chia 2 Bảng (Bảng A & Bảng B)</option>
                  <option value={4}>Chia 4 Bảng (Bảng A, B, C, D)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={handleRandomDraw}
                  style={{ width: '100%', padding: '9px 16px', background: '#7c3aed', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}
                >
                  🎲 Tiến Hành Bốc Thăm
                </button>
              </div>
            </div>

            {/* RESULT BRACKETS DISPLAY */}
            {drawnBrackets ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '15px', color: '#15803d', fontWeight: 'bold', fontSize: '15px' }}>
                  🎉 KẾT QUẢ BỐC THĂM MÔN: {drawSport.toUpperCase()}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '15px' }}>
                  {drawnBrackets.map((grp, gIdx) => (
                    <div key={gIdx} style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '14px' }}>
                      <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '15px', marginBottom: '10px', borderBottom: '2px solid #3b82f6', paddingBottom: '4px' }}>
                        BẢNG {String.fromCharCode(65 + gIdx)} ({grp.length} Đội/VĐV)
                      </div>
                      
                      {grp.length === 0 ? (
                        <div style={{ fontSize: '12.5px', color: '#94a3b8', fontStyle: 'italic' }}>Chưa có VĐV</div>
                      ) : (
                        <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '13px', color: '#334155' }}>
                          {grp.map((v, vIdx) => (
                            <li key={vIdx} style={{ marginBottom: '6px' }}>
                              <strong>{v.full_name}</strong> ({v.unit_name}) - <span style={{ color: '#0284c7' }}>{v.phone}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <button
                    onClick={() => window.print()}
                    style={{ padding: '9px 20px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Printer size={16} /> 🖨️ In Bảng Bốc Thăm Thi Đấu
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 15px', color: '#64748b', fontStyle: 'italic' }}>
                Vui lòng chọn môn và bấm nút <strong>"🎲 Tiến Hành Bốc Thăm"</strong> để chia bảng ngẫu nhiên.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
