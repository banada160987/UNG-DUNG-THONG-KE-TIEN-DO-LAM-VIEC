import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import { 
  FileBadge, Search, CheckCircle2, Clock, AlertCircle, 
  Printer, Download, ShieldCheck, Phone, User, Calendar, 
  MessageSquare, RefreshCw, X, Trash2, Check, Eye, Filter
} from 'lucide-react';
import { 
  PUBLIC_PROCEDURES, 
  getAllPublicServices, 
  updatePublicServiceStatus, 
  deletePublicService, 
  exportPublicServicesExcel 
} from '../../services/publicService';
import PublicServicesPrintModal from '../../components/PublicServicesPrintModal';

export default function AdminPublicServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProcedure, setFilterProcedure] = useState('all');
  const [filterClass, setFilterClass] = useState('all');

  // Modal in ấn / xem chi tiết
  const [printingService, setPrintingService] = useState(null);

  // Modal từ chối hồ sơ
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getAllPublicServices();
        setServices(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshKey]);

  // Danh sách các lớp học có trong hồ sơ
  const availableClasses = useMemo(() => {
    const set = new Set(services.map(s => s.studentClass).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [services]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = services.length;
    const pending = services.filter(s => s.status === 'pending').length;
    const approved = services.filter(s => s.status === 'approved').length;
    const rejected = services.filter(s => s.status === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [services]);

  // Lọc dữ liệu
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (filterProcedure !== 'all' && s.procedureType !== filterProcedure) return false;
      if (filterClass !== 'all' && s.studentClass !== filterClass) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inCode = s.code?.toLowerCase().includes(q);
        const inName = s.studentName?.toLowerCase().includes(q);
        const inParent = s.parentName?.toLowerCase().includes(q);
        const inPhone = s.parentPhone?.includes(q);
        const inCccd = s.identityCard?.includes(q);
        if (!inCode && !inName && !inParent && !inPhone && !inCccd) return false;
      }

      return true;
    });
  }, [services, filterStatus, filterProcedure, filterClass, searchQuery]);

  // Hành động Duyệt hồ sơ 1-chạm
  const handleApprove = async (id, studentName, procTitle) => {
    if (window.confirm(`Xác nhận phê duyệt và ký số điện tử hồ sơ "${procTitle}" của học sinh ${studentName}?`)) {
      await updatePublicServiceStatus(id, 'approved', {
        processedBy: 'Ban Giám Hiệu / Văn Thư THPT Cao Bá Quát'
      });
      setRefreshKey(k => k + 1);
    }
  };

  // Hành động Từ chối hồ sơ
  const handleConfirmReject = async () => {
    if (!rejectionReasonInput.trim()) {
      alert("Vui lòng nhập lý do từ chối để phụ huynh biết và bổ sung!");
      return;
    }

    await updatePublicServiceStatus(rejectingItem.id, 'rejected', {
      rejectionReason: rejectionReasonInput.trim(),
      processedBy: 'Ban Giám Hiệu / Văn Thư THPT Cao Bá Quát'
    });

    setRejectingItem(null);
    setRejectionReasonInput('');
    setRefreshKey(k => k + 1);
  };

  // Hành động Xóa hồ sơ
  const handleDelete = async (id, code) => {
    if (window.confirm(`Thầy/Cô có chắc chắn muốn xóa vĩnh viễn hồ sơ #${code}?`)) {
      await deletePublicService(id);
      setRefreshKey(k => k + 1);
    }
  };

  return (
    <Layout title="Quản Lý Dịch Vụ Công & Tiếp Nhận Hồ Sơ Trực Tuyến">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 1. TOP HEADER BANNER */}
        <div className="admin-banner-card" style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '22px 26px',
          boxShadow: '0 10px 25px rgba(2, 132, 199, 0.15)',
          position: 'relative'
        }}>
          <div className="admin-top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#bae6fd', borderRadius: '20px', fontSize: '12.5px', fontWeight: 'bold', marginBottom: '8px' }}>
                <ShieldCheck size={15} color="#38bdf8" /> BỘ PHẬN MỘT CỬA ĐIỆN TỬ • THPT CAO BÁ QUÁT
              </div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#ffffff', letterSpacing: '0.3px' }}>
                TIẾP NHẬN & PHÊ DUYỆT DỊCH VỤ CÔNG TRỰC TUYẾN 4.0
              </h1>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#e0f2fe' }}>
                Xử lý giấy xác nhận học sinh, đơn xin nghỉ phép, sao y học bạ có ký số điện tử và mã QR tra cứu chuẩn Nghị định 30.
              </p>
            </div>

            <div className="admin-btn-group" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setRefreshKey(k => k + 1)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Làm mới
              </button>

              <button
                type="button"
                onClick={() => exportPublicServicesExcel(filteredServices)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 18px',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                }}
                title="Xuất Excel tuân thủ quy tắc tiền tố 1-... trong GEMINI.md"
              >
                <Download size={15} /> Xuất Báo Cáo Excel (1-...)
              </button>
            </div>
          </div>
        </div>

        {/* 2. STATS OVERVIEW CARDS */}
        <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #bae6fd', boxShadow: '0 2px 6px rgba(2,132,199,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0369a1' }}>TỔNG SỐ HỒ SƠ</span>
              <FileBadge size={18} color="#0284c7" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#0284c7' }}>{stats.total}</div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>Toàn bộ thủ tục gửi đến</div>
          </div>

          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #fde68a', boxShadow: '0 2px 6px rgba(234,179,8,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#a16207' }}>HỒ SƠ CHỜ DUYỆT</span>
              <Clock size={18} color="#d97706" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#b45309' }}>{stats.pending}</div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>Cần xử lý phê duyệt ngay</div>
          </div>

          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #bbf7d0', boxShadow: '0 2px 6px rgba(22,163,74,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#15803d' }}>ĐÃ PHÊ DUYỆT & KÝ SỐ</span>
              <CheckCircle2 size={18} color="#16a34a" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#16a34a' }}>{stats.approved}</div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>Đã cấp mộc số & trả kết quả</div>
          </div>

          <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #fecaca', boxShadow: '0 2px 6px rgba(220,38,38,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#991b1b' }}>TỪ CHỐI / CẦN BỔ SUNG</span>
              <AlertCircle size={18} color="#dc2626" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#dc2626' }}>{stats.rejected}</div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>Thiếu thông tin hoặc sai lệch</div>
          </div>
        </div>

        {/* 3. FILTER TOOLBAR */}
        <div className="glass admin-filter-toolbar" style={{ padding: '14px 18px', borderRadius: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Tìm theo mã hồ sơ, tên học sinh, CCCD, phụ huynh, SĐT..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
            />
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 'bold' }}
            >
              <option value="all">Mọi trạng thái</option>
              <option value="pending">⏳ Chờ tiếp nhận</option>
              <option value="approved">✅ Đã phê duyệt</option>
              <option value="rejected">❌ Bị từ chối</option>
            </select>
          </div>

          <div>
            <select
              value={filterProcedure}
              onChange={e => setFilterProcedure(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 'bold' }}
            >
              <option value="all">Tất cả loại thủ tục</option>
              {PUBLIC_PROCEDURES.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 'bold' }}
            >
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>{cls === 'all' ? 'Tất cả lớp' : `Lớp ${cls}`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. ORDERS DATA TABLE */}
        <div className="glass" style={{ padding: '20px', borderRadius: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>
              Danh Sách Hồ Sơ Đã Tiếp Nhận ({filteredServices.length})
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              💡 Bấm <strong>&quot;Duyệt & Ký số&quot;</strong> để cấp dấu mộc số điện tử và mã QR xác thực tức thì cho học sinh
            </span>
          </div>

          <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Mã Hồ Sơ</th>
                  <th style={{ padding: '10px' }}>Thủ Tục Yêu Cầu</th>
                  <th style={{ padding: '10px' }}>Học Sinh & Lớp</th>
                  <th style={{ padding: '10px' }}>Phụ Huynh & SĐT</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      Không có hồ sơ nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredServices.map(item => {
                    const isApproved = item.status === 'approved';
                    const isRejected = item.status === 'rejected';

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        
                        {/* Mã hồ sơ */}
                        <td style={{ padding: '10px' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: '900', color: '#0284c7' }}>
                            #{item.code}
                          </span>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {new Date(item.createdAt).toLocaleString('vi-VN')}
                          </div>
                        </td>

                        {/* Loại thủ tục */}
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontWeight: '800', color: '#0f172a' }}>
                            {item.procedureTitle}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                            Lý do: <em>{item.reason}</em>
                          </div>
                          {item.digitalCertificateCode && (
                            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold', marginTop: '2px' }}>
                              Mộc số: {item.digitalCertificateCode}
                            </div>
                          )}
                        </td>

                        {/* Học sinh */}
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                            {item.studentName}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                            Lớp: <strong>{item.studentClass}</strong> • CCCD: {item.identityCard || '---'}
                          </div>
                        </td>

                        {/* Phụ huynh */}
                        <td style={{ padding: '10px' }}>
                          <div>{item.parentName}</div>
                          <div style={{ fontSize: '11.5px', color: '#0284c7', fontWeight: 'bold' }}>
                            📞 {item.parentPhone}
                          </div>
                        </td>

                        {/* Trạng thái */}
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            backgroundColor: isApproved ? '#dcfce7' : isRejected ? '#fee2e2' : '#fef9c3',
                            color: isApproved ? '#15803d' : isRejected ? '#dc2626' : '#a16207'
                          }}>
                            {isApproved ? '✅ Đã Duyệt' : isRejected ? '❌ Từ Chối' : '⏳ Chờ Duyệt'}
                          </span>
                        </td>

                        {/* Thao tác */}
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            
                            {/* Nút Xem / In Giấy Xác Nhận */}
                            <button
                              type="button"
                              onClick={() => setPrintingService(item)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid #0284c7',
                                background: '#f0f9ff',
                                color: '#0284c7',
                                fontSize: '11.5px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Xem và In Giấy Xác Nhận chuẩn Nghị định 30 A4"
                            >
                              <Printer size={13} /> In Giấy
                            </button>

                            {/* Nút Duyệt & Ký Số */}
                            {!isApproved && (
                              <button
                                type="button"
                                onClick={() => handleApprove(item.id, item.studentName, item.procedureTitle)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: '#16a34a',
                                  color: '#ffffff',
                                  fontSize: '11.5px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Check size={13} /> Duyệt & Ký Số
                              </button>
                            )}

                            {/* Nút Từ chối */}
                            {!isRejected && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingItem(item);
                                  setRejectionReasonInput('');
                                }}
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #fecaca',
                                  background: '#fef2f2',
                                  color: '#dc2626',
                                  fontSize: '11.5px',
                                  cursor: 'pointer'
                                }}
                                title="Từ chối hồ sơ (Yêu cầu bổ sung)"
                              >
                                ✕
                              </button>
                            )}

                            {/* Nút Xóa */}
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id, item.code)}
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#64748b',
                                fontSize: '11.5px',
                                cursor: 'pointer'
                              }}
                              title="Xóa hồ sơ"
                            >
                              <Trash2 size={13} />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL IN GIẤY XÁC NHẬN */}
      {printingService && (
        <PublicServicesPrintModal
          service={printingService}
          onClose={() => setPrintingService(null)}
        />
      )}

      {/* MODAL TỪ CHỐI HỒ SƠ */}
      {rejectingItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '16px' }}>
          <div className="admin-modal-card" style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '900', color: '#991b1b' }}>
              Từ Chối Tiếp Nhận Hồ Sơ #{rejectingItem.code}
            </h3>
            <p style={{ fontSize: '12.5px', color: '#475569', margin: '0 0 14px 0' }}>
              Học sinh: <strong>{rejectingItem.studentName}</strong> • Thủ tục: <strong>{rejectingItem.procedureTitle}</strong>
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                Lý do từ chối / Hướng dẫn phụ huynh bổ sung (*):
              </label>
              <textarea
                rows={3}
                value={rejectionReasonInput}
                onChange={e => setRejectionReasonInput(e.target.value)}
                placeholder="VD: Thiếu ảnh chụp Căn cước công dân / Thông tin năm sinh không khớp với dữ liệu nhà trường..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#ffffff', fontWeight: '700', cursor: 'pointer' }}
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
