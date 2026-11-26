// =========================================================================
// TRANG QUẢN TRỊ: QUỸ HỌC BỔNG "CHẮP CÁNH ƯỚC MƠ" - THPT CAO BÁ QUÁT
// Quản lý xét duyệt hồ sơ, sổ quỹ thu chi, xuất file chuẩn Nghị định 30 & Excel
// =========================================================================

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  Heart, Sparkles, Award, Gift, Search, Plus, FileSpreadsheet, 
  FileText, CheckCircle2, XCircle, Clock, Trash2, Edit3, 
  Eye, Download, RefreshCw, Filter, Settings, DollarSign, 
  ArrowUpRight, ArrowDownLeft, ShieldCheck, Check, Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  fetchScholarshipApplications,
  reviewScholarshipApplication,
  deleteScholarshipApplication,
  fetchFundTransactions,
  recordFundTransaction,
  deleteFundTransaction,
  fetchFundSettings,
  saveFundSettings,
  getFundStatistics,
  exportScholarshipExcel,
  exportScholarshipDecisionWord,
  exportFundReportExcel
} from '../services/scholarshipFundService';

const ALL_CLASSES = [];
['10', '11', '12'].forEach(grade => {
  for (let i = 1; i <= 15; i++) {
    const num = String(i).padStart(2, '0');
    ALL_CLASSES.push(`${grade}A${num}`);
  }
});

export default function AdminScholarshipFund() {
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'cashbook' | 'sponsors' | 'settings'
  const [loading, setLoading] = useState(true);

  // Thống kê tổng quan
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    fundBalance: 0,
    totalApplications: 0,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    totalScholarshipGranted: 0,
    sponsorsCount: 0
  });

  // 1. Hồ sơ học sinh
  const [applications, setApplications] = useState([]);
  const [appFilterStatus, setAppFilterStatus] = useState('all');
  const [appFilterClass, setAppFilterClass] = useState('all');
  const [appSearch, setAppSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState(null); // Modal chi tiết
  const [reviewModalData, setReviewModalData] = useState({
    status: 'approved',
    granted_amount: 2000000,
    granted_item: '',
    scholarship_term: 'Đợt 1 - Năm học 2026-2027',
    review_note: ''
  });

  // 2. Sổ quỹ thu chi
  const [transactions, setTransactions] = useState([]);
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [txFormData, setTxFormData] = useState({
    trans_type: 'income',
    amount: '',
    donor_or_recipient: '',
    category: 'Ủng hộ Quỹ học bổng',
    receipt_code: '',
    trans_date: new Date().toISOString().split('T')[0],
    note: ''
  });

  // 3. Quản lý Bảng vàng tri ân
  const [sponsors, setSponsors] = useState([]);
  const [sponsorSearch, setSponsorSearch] = useState('');

  // 4. Cấu hình quỹ
  const [fundSettings, setFundSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [st, apps, trans, sett, spRes] = await Promise.all([
        getFundStatistics(),
        fetchScholarshipApplications(),
        fetchFundTransactions(),
        fetchFundSettings(),
        supabase.from('cbq_sponsors').select('*').order('date_received', { ascending: false })
      ]);

      setStats(st);
      setApplications(apps || []);
      setTransactions(trans || []);
      setFundSettings(sett);
      setSponsors(spRes.data || []);
      if (sett?.current_term_name) {
        setReviewModalData(prev => ({ ...prev, scholarship_term: sett.current_term_name }));
      }
    } catch (err) {
      console.warn("Lỗi nạp dữ liệu quản trị quỹ:", err);
    } finally {
      setLoading(false);
    }
  }

  // Phê duyệt hoặc Từ chối hồ sơ
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      await reviewScholarshipApplication(selectedApp.id, reviewModalData);
      alert(`Đã cập nhật trạng thái hồ sơ của học sinh ${selectedApp.student_name}!`);
      setSelectedApp(null);
      loadAllData();
    } catch (err) {
      alert("Lỗi khi cập nhật hồ sơ: " + err.message);
    }
  };

  // Xóa hồ sơ
  const handleDeleteApp = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ học sinh ${name}?`)) return;
    try {
      await deleteScholarshipApplication(id);
      loadAllData();
    } catch (err) {
      alert("Lỗi khi xóa hồ sơ: " + err.message);
    }
  };

  // Thêm giao dịch Sổ Quỹ
  const handleAddTxSubmit = async (e) => {
    e.preventDefault();
    if (!txFormData.amount || Number(txFormData.amount) <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ (> 0)");
      return;
    }
    if (!txFormData.donor_or_recipient.trim()) {
      alert("Vui lòng nhập Người đóng góp hoặc Người thụ hưởng");
      return;
    }

    try {
      await recordFundTransaction(txFormData);
      setShowAddTxModal(false);
      setTxFormData({
        trans_type: 'income',
        amount: '',
        donor_or_recipient: '',
        category: 'Ủng hộ Quỹ học bổng',
        receipt_code: '',
        trans_date: new Date().toISOString().split('T')[0],
        note: ''
      });
      loadAllData();
    } catch (err) {
      alert("Lỗi ghi sổ quỹ: " + err.message);
    }
  };

  // Xóa giao dịch Sổ Quỹ
  const handleDeleteTx = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phiếu giao dịch này khỏi Sổ Quỹ?")) return;
    try {
      await deleteFundTransaction(id);
      loadAllData();
    } catch (err) {
      alert("Lỗi khi xóa phiếu: " + err.message);
    }
  };

  // Duyệt hiển thị nhà tài trợ công khai
  const handleToggleSponsorPublic = async (id, currentStatus) => {
    try {
      await supabase.from('cbq_sponsors').update({ is_public: !currentStatus }).eq('id', id);
      loadAllData();
    } catch (err) {
      alert("Lỗi cập nhật nhà tài trợ: " + err.message);
    }
  };

  // Lưu cài đặt quỹ
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await saveFundSettings(fundSettings);
      alert("Đã lưu thành công cài đặt Quỹ Chắp cánh ước mơ!");
      loadAllData();
    } catch (err) {
      alert("Lỗi lưu cài đặt: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // Lọc danh sách hồ sơ
  const filteredApps = applications.filter(app => {
    if (appFilterStatus !== 'all' && app.status !== appFilterStatus) return false;
    if (appFilterClass !== 'all' && app.student_class !== appFilterClass) return false;
    if (appSearch) {
      const q = appSearch.toLowerCase();
      const name = (app.student_name || '').toLowerCase();
      const code = (app.application_code || '').toLowerCase();
      const cls = (app.student_class || '').toLowerCase();
      const cat = (app.category || '').toLowerCase();
      return name.includes(q) || code.includes(q) || cls.includes(q) || cat.includes(q);
    }
    return true;
  });

  const approvedApps = applications.filter(a => a.status === 'approved');

  return (
    <Layout>
      <div style={styles.container}>
        {/* HEADER QUẢN TRỊ */}
        <div style={styles.header}>
          <div>
            <div style={styles.headerBadge}>
              <Sparkles size={16} color="#fbbf24" />
              <span>HỘI ĐỒNG QUẢN LÝ QUỸ • BAN GIÁM HIỆU</span>
            </div>
            <h1 style={styles.headerTitle}>QUẢN LÝ QUỸ HỌC BỔNG "CHẮP CÁNH ƯỚC MƠ"</h1>
            <p style={styles.headerDesc}>
              Xét duyệt hồ sơ học sinh, quản lý nguồn thu - chi minh bạch và xuất Quyết định chuẩn thể thức Nghị định 30.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={loadAllData} style={styles.refreshBtn} title="Làm mới dữ liệu">
              <RefreshCw size={16} /> Làm mới
            </button>
            <button 
              onClick={() => exportScholarshipExcel(approvedApps, fundSettings?.current_term_name)}
              style={styles.exportExcelBtn}
              title="Xuất file Excel theo quy tắc 1-Danh_sach_hoc_sinh_nhan_hoc_bong_Chap_canh_uoc_mo.xlsx"
            >
              <FileSpreadsheet size={16} /> Xuất Excel DS Học Bổng ({approvedApps.length})
            </button>
            <button 
              onClick={() => exportScholarshipDecisionWord(approvedApps, fundSettings)}
              style={styles.exportWordBtn}
              title="Xuất file Word chuẩn NĐ 30 theo quy tắc 1-Quyet_dinh_trao_hoc_bong_Chap_canh_uoc_mo.docx"
            >
              <FileText size={16} /> Xuất Quyết Định Word (NĐ30)
            </button>
          </div>
        </div>

        {/* 4 CARDS THỐNG KÊ TỔNG QUAN */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIconWrap, background: '#eff6ff', color: '#2563eb' }}>
              <Heart size={24} />
            </div>
            <div>
              <div style={styles.statLabel}>Tổng nguồn quỹ vận động</div>
              <div style={{ ...styles.statValue, color: '#1e3a8a' }}>
                {(stats.totalIncome || 0).toLocaleString('vi-VN')} <span style={{ fontSize: '14px' }}>đ</span>
              </div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconWrap, background: '#ecfdf5', color: '#059669' }}>
              <ArrowDownLeft size={24} />
            </div>
            <div>
              <div style={styles.statLabel}>Số dư quỹ hiện tại</div>
              <div style={{ ...styles.statValue, color: '#059669' }}>
                {(stats.fundBalance || 0).toLocaleString('vi-VN')} <span style={{ fontSize: '14px' }}>đ</span>
              </div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconWrap, background: '#fef3c7', color: '#d97706' }}>
              <Award size={24} />
            </div>
            <div>
              <div style={styles.statLabel}>Hồ sơ đã duyệt trao</div>
              <div style={{ ...styles.statValue, color: '#b45309' }}>
                {stats.approvedCount} / {stats.totalApplications} <span style={{ fontSize: '14px' }}>hồ sơ</span>
              </div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconWrap, background: '#fdf2f8', color: '#db2777' }}>
              <ArrowUpRight size={24} />
            </div>
            <div>
              <div style={styles.statLabel}>Kinh phí đã giải ngân</div>
              <div style={{ ...styles.statValue, color: '#be185d' }}>
                {(stats.totalExpense || 0).toLocaleString('vi-VN')} <span style={{ fontSize: '14px' }}>đ</span>
              </div>
            </div>
          </div>
        </div>

        {/* TABS ĐIỀU HƯỚNG QUẢN TRỊ */}
        <div style={styles.tabContainer}>
          <button 
            onClick={() => setActiveTab('applications')}
            style={activeTab === 'applications' ? styles.tabActive : styles.tab}
          >
            <FileText size={18} /> Xét Duyệt Hồ Sơ Học Sinh ({applications.length})
          </button>
          <button 
            onClick={() => setActiveTab('cashbook')}
            style={activeTab === 'cashbook' ? styles.tabActive : styles.tab}
          >
            <DollarSign size={18} /> Sổ Quỹ Thu - Chi ({transactions.length})
          </button>
          <button 
            onClick={() => setActiveTab('sponsors')}
            style={activeTab === 'sponsors' ? styles.tabActive : styles.tab}
          >
            <Award size={18} /> Quản Lý Bảng Vàng Tri Ân ({sponsors.length})
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            style={activeTab === 'settings' ? styles.tabActive : styles.tab}
          >
            <Settings size={18} /> Cài Đặt & Đợt Tiếp Nhận
          </button>
        </div>

        {/* ===================== TAB 1: XÉT DUYỆT HỒ SƠ HỌC SINH ===================== */}
        {activeTab === 'applications' && (
          <div style={styles.panel}>
            {/* THANH CÔNG CỤ LỌC & TÌM KIẾM */}
            <div style={styles.filterBar}>
              <div style={styles.searchBox}>
                <Search size={18} color="#64748b" />
                <input 
                  type="text" 
                  placeholder="Tìm học sinh, lớp, mã hồ sơ, hoàn cảnh..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  style={styles.filterInput}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <select 
                  value={appFilterStatus} 
                  onChange={(e) => setAppFilterStatus(e.target.value)}
                  style={styles.filterSelect}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">⏳ Đang chờ duyệt ({stats.pendingCount})</option>
                  <option value="approved">✓ Đã duyệt trao ({stats.approvedCount})</option>
                  <option value="rejected">✕ Từ chối ({stats.rejectedCount})</option>
                </select>

                <select 
                  value={appFilterClass} 
                  onChange={(e) => setAppFilterClass(e.target.value)}
                  style={styles.filterSelect}
                >
                  <option value="all">Tất cả các lớp (34 lớp)</option>
                  {ALL_CLASSES.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* DANH SÁCH HỒ SƠ BẢNG */}
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>STT</th>
                    <th style={styles.th}>Mã Hồ Sơ</th>
                    <th style={styles.th}>Họ và Tên</th>
                    <th style={styles.th}>Lớp</th>
                    <th style={styles.th}>Hoàn cảnh / Ưu tiên</th>
                    <th style={styles.th}>Học lực / Rèn luyện</th>
                    <th style={styles.th}>Mức duyệt</th>
                    <th style={styles.th}>Trạng thái</th>
                    <th style={styles.thCenter}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        Không có hồ sơ nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((item, idx) => (
                      <tr key={item.id} style={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                        <td style={styles.tdCenter}>{idx + 1}</td>
                        <td style={styles.tdCode}>{item.application_code || '—'}</td>
                        <td style={styles.tdBold}>{item.student_name}</td>
                        <td style={styles.tdCenter}><span style={styles.classBadge}>{item.student_class}</span></td>
                        <td style={styles.td}>{item.category}</td>
                        <td style={styles.tdCenter}>{item.academic_grade} / {item.conduct_grade}</td>
                        <td style={styles.tdAmount}>
                          {item.status === 'approved' && item.granted_amount > 0 ? (
                            <span style={{ color: '#059669', fontWeight: 700 }}>
                              {Number(item.granted_amount).toLocaleString('vi-VN')} đ
                            </span>
                          ) : '—'}
                        </td>
                        <td style={styles.tdCenter}>
                          {item.status === 'approved' && (
                            <span style={styles.badgeApproved}>✓ Đã duyệt</span>
                          )}
                          {item.status === 'pending' && (
                            <span style={styles.badgePending}>⏳ Chờ duyệt</span>
                          )}
                          {item.status === 'rejected' && (
                            <span style={styles.badgeRejected}>✕ Từ chối</span>
                          )}
                        </td>
                        <td style={styles.tdCenter}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => {
                                setSelectedApp(item);
                                setReviewModalData({
                                  status: item.status || 'approved',
                                  granted_amount: item.granted_amount || fundSettings?.default_scholarship_amount || 2000000,
                                  granted_item: item.granted_item || '',
                                  scholarship_term: item.scholarship_term || fundSettings?.current_term_name || 'Đợt 1 - Năm học 2026-2027',
                                  review_note: item.review_note || ''
                                });
                              }}
                              style={styles.reviewBtn}
                              title="Xem chi tiết & Xét duyệt hồ sơ"
                            >
                              <Eye size={15} /> Xem & Duyệt
                            </button>
                            <button 
                              onClick={() => handleDeleteApp(item.id, item.student_name)}
                              style={styles.deleteBtn}
                              title="Xóa hồ sơ này"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: SỔ QUỸ THU - CHI ===================== */}
        {activeTab === 'cashbook' && (
          <div style={styles.panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>Sổ Quỹ Thu - Chi Minh Bạch</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                  Ghi chép và theo dõi toàn bộ các nguồn thu tài trợ và chi trao học bổng, quà tặng tiếp sức.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => exportFundReportExcel(transactions, stats)}
                  style={styles.exportExcelBtn}
                  title="Xuất file theo quy tắc 1-Bao_cao_thu_chi_quy_Chap_canh_uoc_mo.xlsx"
                >
                  <FileSpreadsheet size={16} /> Xuất Báo Cáo Sổ Quỹ Excel
                </button>
                <button onClick={() => setShowAddTxModal(true)} style={styles.addTxBtn}>
                  <Plus size={16} /> Lập Phiếu Thu / Chi Mới
                </button>
              </div>
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>STT</th>
                    <th style={styles.th}>Ngày</th>
                    <th style={styles.th}>Mã Chứng Từ</th>
                    <th style={styles.th}>Loại Phiếu</th>
                    <th style={styles.th}>Số Tiền</th>
                    <th style={styles.th}>Người Nộp / Thụ Hưởng</th>
                    <th style={styles.th}>Nội Dung / Diễn Giải</th>
                    <th style={styles.th}>Người Lập</th>
                    <th style={styles.thCenter}>Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        Chưa có phát sinh giao dịch thu chi nào trong sổ quỹ.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx, idx) => (
                      <tr key={tx.id} style={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                        <td style={styles.tdCenter}>{idx + 1}</td>
                        <td style={styles.tdCenter}>{tx.trans_date}</td>
                        <td style={styles.tdCode}>{tx.receipt_code || '—'}</td>
                        <td style={styles.tdCenter}>
                          {tx.trans_type === 'income' ? (
                            <span style={styles.badgeIncome}>+ THU ĐÓNG GÓP</span>
                          ) : (
                            <span style={styles.badgeExpense}>- CHI HỌC BỔNG</span>
                          )}
                        </td>
                        <td style={styles.tdAmount}>
                          <span style={{ fontWeight: 700, color: tx.trans_type === 'income' ? '#059669' : '#dc2626' }}>
                            {tx.trans_type === 'income' ? '+' : '-'}{Number(tx.amount).toLocaleString('vi-VN')} đ
                          </span>
                        </td>
                        <td style={styles.tdBold}>{tx.donor_or_recipient}</td>
                        <td style={styles.td}>{tx.category} {tx.note && `(${tx.note})`}</td>
                        <td style={styles.td}>{tx.recorded_by || 'Ban Quản Lý Quỹ'}</td>
                        <td style={styles.tdCenter}>
                          <button onClick={() => handleDeleteTx(tx.id)} style={styles.deleteBtn}>
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: QUẢN LÝ BẢNG VÀNG ===================== */}
        {activeTab === 'sponsors' && (
          <div style={styles.panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0f172a' }}>Danh Sách Nhà Hảo Tâm & Cựu Học Sinh</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                  Phê duyệt hiển thị công khai trên Bảng Vàng và tri ân các nhà tài trợ.
                </p>
              </div>

              <input 
                type="text" 
                placeholder="Tìm kiếm nhà tài trợ..."
                value={sponsorSearch}
                onChange={(e) => setSponsorSearch(e.target.value)}
                style={styles.filterInput}
              />
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>STT</th>
                    <th style={styles.th}>Tên Nhà Hảo Tâm / Đơn Vị</th>
                    <th style={styles.th}>Tiền Mặt Ủng Hộ</th>
                    <th style={styles.th}>Hiện Vật Tài Trợ</th>
                    <th style={styles.th}>Ngày Đóng Góp</th>
                    <th style={styles.thCenter}>Trạng Thái Hiển Thị</th>
                    <th style={styles.thCenter}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {sponsors
                    .filter(s => (s.name || '').toLowerCase().includes(sponsorSearch.toLowerCase()))
                    .map((s, idx) => (
                      <tr key={s.id} style={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                        <td style={styles.tdCenter}>{idx + 1}</td>
                        <td style={styles.tdBold}>{s.name}</td>
                        <td style={styles.tdAmount}>
                          {s.donation_amount > 0 ? (
                            <span style={{ color: '#059669', fontWeight: 700 }}>
                              {Number(s.donation_amount).toLocaleString('vi-VN')} đ
                            </span>
                          ) : '—'}
                        </td>
                        <td style={styles.td}>{s.donation_item || '—'}</td>
                        <td style={styles.tdCenter}>
                          {s.date_received ? new Date(s.date_received).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td style={styles.tdCenter}>
                          {s.is_public ? (
                            <span style={styles.badgeApproved}>Công khai</span>
                          ) : (
                            <span style={styles.badgePending}>Chờ duyệt</span>
                          )}
                        </td>
                        <td style={styles.tdCenter}>
                          <button 
                            onClick={() => handleToggleSponsorPublic(s.id, s.is_public)}
                            style={s.is_public ? styles.hideBtn : styles.showBtn}
                          >
                            {s.is_public ? 'Ẩn khỏi bảng vàng' : '✓ Duyệt công khai'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: CÀI ĐẶT QUỸ ===================== */}
        {activeTab === 'settings' && fundSettings && (
          <div style={styles.panel}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#0f172a' }}>Cấu Hình Quỹ & Tài Khoản Tiếp Nhận</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b' }}>
              Điều chỉnh thông tin tài khoản ngân hàng sinh mã VietQR và trạng thái cổng nhận hồ sơ của học sinh.
            </p>

            <form onSubmit={handleSaveSettings} style={{ maxWidth: '700px' }}>
              <div style={styles.formRow}>
                <label style={styles.label}>Tên đợt xét học bổng hiện tại</label>
                <input 
                  type="text" 
                  value={fundSettings.current_term_name || ''} 
                  onChange={(e) => setFundSettings({ ...fundSettings, current_term_name: e.target.value })}
                  style={styles.input}
                  placeholder="VD: Đợt 1 - Năm học 2026-2027"
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Mức học bổng chuẩn khuyến nghị (VNĐ)</label>
                <input 
                  type="number" 
                  value={fundSettings.default_scholarship_amount || 2000000} 
                  onChange={(e) => setFundSettings({ ...fundSettings, default_scholarship_amount: Number(e.target.value) })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Ngân hàng tiếp nhận quyên góp</label>
                <input 
                  type="text" 
                  value={fundSettings.bank_name || ''} 
                  onChange={(e) => setFundSettings({ ...fundSettings, bank_name: e.target.value })}
                  style={styles.input}
                  placeholder="VD: Vietcombank"
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Số tài khoản ngân hàng</label>
                <input 
                  type="text" 
                  value={fundSettings.bank_account_number || ''} 
                  onChange={(e) => setFundSettings({ ...fundSettings, bank_account_number: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Tên chủ tài khoản (In hoa không dấu)</label>
                <input 
                  type="text" 
                  value={fundSettings.bank_account_name || ''} 
                  onChange={(e) => setFundSettings({ ...fundSettings, bank_account_name: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Hotline hỗ trợ & xác nhận</label>
                <input 
                  type="text" 
                  value={fundSettings.hotline || ''} 
                  onChange={(e) => setFundSettings({ ...fundSettings, hotline: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={{ ...styles.formRow, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="open-app"
                  checked={fundSettings.is_open_application} 
                  onChange={(e) => setFundSettings({ ...fundSettings, is_open_application: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="open-app" style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                  Đang mở cổng nhận nộp đơn trực tuyến của học sinh
                </label>
              </div>

              <button type="submit" disabled={savingSettings} style={styles.saveBtn}>
                <Check size={18} />
                <span>{savingSettings ? 'Đang lưu...' : 'LƯU CÀI ĐẶT QUỸ'}</span>
              </button>
            </form>
          </div>
        )}

        {/* ===================== MODAL CHI TIẾT & XÉT DUYỆT HỒ SƠ ===================== */}
        {selectedApp && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <div>
                  <span style={styles.modalCode}>{selectedApp.application_code}</span>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', color: '#0f172a' }}>
                    Hồ sơ học sinh: {selectedApp.student_name} — Lớp {selectedApp.student_class}
                  </h3>
                </div>
                <button onClick={() => setSelectedApp(null)} style={styles.closeBtn}>×</button>
              </div>

              <div style={styles.modalBody}>
                {/* THÔNG TIN HỌC SINH */}
                <div style={styles.infoGrid}>
                  <div><strong>Giới tính:</strong> {selectedApp.gender || 'Nam'}</div>
                  <div><strong>Ngày sinh:</strong> {selectedApp.birthday || '—'}</div>
                  <div><strong>SĐT liên hệ:</strong> {selectedApp.phone || '—'}</div>
                  <div><strong>Phụ huynh / Giám hộ:</strong> {selectedApp.parent_name || '—'}</div>
                  <div><strong>Địa chỉ:</strong> {selectedApp.home_address || '—'}</div>
                  <div><strong>Diện ưu tiên:</strong> {selectedApp.category}</div>
                  <div><strong>Học lực / Hạnh kiểm:</strong> {selectedApp.academic_grade} / {selectedApp.conduct_grade}</div>
                  <div><strong>Ngày nộp đơn:</strong> {new Date(selectedApp.created_at).toLocaleString('vi-VN')}</div>
                </div>

                {/* TỰ THUẬT HOÀN CẢNH */}
                <div style={styles.storySection}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#1e293b' }}>
                    📖 Hoàn cảnh gia đình tự thuật:
                  </h4>
                  <div style={styles.storyBox}>
                    {selectedApp.circumstance_story || 'Chưa có ghi chú.'}
                  </div>
                </div>

                {selectedApp.dream_aspiration && (
                  <div style={styles.storySection}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#1e293b' }}>
                      🌟 Ước mơ & Kế hoạch phấn đấu:
                    </h4>
                    <div style={styles.storyBox}>
                      {selectedApp.dream_aspiration}
                    </div>
                  </div>
                )}

                {/* HÌNH ẢNH MINH CHỨNG */}
                {selectedApp.evidence_urls && selectedApp.evidence_urls.length > 0 && (
                  <div style={styles.storySection}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#1e293b' }}>
                      📎 Ảnh chụp minh chứng hoàn cảnh ({selectedApp.evidence_urls.length} ảnh):
                    </h4>
                    <div style={styles.evidenceModalGrid}>
                      {selectedApp.evidence_urls.map((img, idx) => (
                        <a key={idx} href={img} target="_blank" rel="noreferrer" style={styles.evidenceLink}>
                          <img src={img} alt={`Minh chứng ${idx + 1}`} style={styles.evidenceThumb} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* BIỂU MẪU XÉT DUYỆT */}
                <form onSubmit={handleReviewSubmit} style={styles.reviewForm}>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                    ⚖️ Kết luận của Hội đồng Quản lý Quỹ
                  </h4>

                  <div style={styles.row2}>
                    <div>
                      <label style={styles.label}>Trạng thái phê duyệt (*)</label>
                      <select 
                        value={reviewModalData.status}
                        onChange={(e) => setReviewModalData({ ...reviewModalData, status: e.target.value })}
                        style={styles.select}
                      >
                        <option value="approved">✓ PHÊ DUYỆT TRAO HỌC BỔNG</option>
                        <option value="pending">⏳ Đang chờ xác minh thêm</option>
                        <option value="rejected">✕ Không đủ điều kiện (Từ chối)</option>
                      </select>
                    </div>

                    <div>
                      <label style={styles.label}>Mức học bổng trao tặng (VNĐ)</label>
                      <input 
                        type="number" 
                        value={reviewModalData.granted_amount}
                        onChange={(e) => setReviewModalData({ ...reviewModalData, granted_amount: e.target.value })}
                        style={styles.input}
                        placeholder="VD: 2000000"
                      />
                    </div>
                  </div>

                  <div style={styles.row2}>
                    <div>
                      <label style={styles.label}>Đợt trao học bổng</label>
                      <input 
                        type="text" 
                        value={reviewModalData.scholarship_term}
                        onChange={(e) => setReviewModalData({ ...reviewModalData, scholarship_term: e.target.value })}
                        style={styles.input}
                      />
                    </div>

                    <div>
                      <label style={styles.label}>Hiện vật tặng kèm (nếu có)</label>
                      <input 
                        type="text" 
                        value={reviewModalData.granted_item}
                        onChange={(e) => setReviewModalData({ ...reviewModalData, granted_item: e.target.value })}
                        style={styles.input}
                        placeholder="VD: 1 chiếc xe đạp, balo, sách vở..."
                      />
                    </div>
                  </div>

                  <div>
                    <label style={styles.label}>Nhận xét / Ý kiến Hội đồng</label>
                    <textarea 
                      rows={3}
                      value={reviewModalData.review_note}
                      onChange={(e) => setReviewModalData({ ...reviewModalData, review_note: e.target.value })}
                      style={styles.textarea}
                      placeholder="Ghi chú đánh giá của Hội đồng xét duyệt..."
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button type="button" onClick={() => setSelectedApp(null)} style={styles.cancelBtn}>
                      Đóng
                    </button>
                    <button type="submit" style={styles.saveReviewBtn}>
                      <CheckCircle2 size={16} /> Lưu Kết Quả Xét Duyệt
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ===================== MODAL LẬP PHIẾU THU / CHI MỚI ===================== */}
        {showAddTxModal && (
          <div style={styles.modalOverlay}>
            <div style={{ ...styles.modalContent, maxWidth: '540px' }}>
              <div style={styles.modalHeader}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Lập Phiếu Thu / Chi Sổ Quỹ</h3>
                <button onClick={() => setShowAddTxModal(false)} style={styles.closeBtn}>×</button>
              </div>

              <form onSubmit={handleAddTxSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={styles.label}>Loại phiếu (*)</label>
                  <select 
                    value={txFormData.trans_type}
                    onChange={(e) => setTxFormData({ 
                      ...txFormData, 
                      trans_type: e.target.value,
                      category: e.target.value === 'income' ? 'Ủng hộ Quỹ học bổng' : 'Chi trao học bổng'
                    })}
                    style={styles.select}
                  >
                    <option value="income">+ PHIẾU THU (Tiếp nhận đóng góp)</option>
                    <option value="expense">- PHIẾU CHI (Trao học bổng / Hỗ trợ)</option>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Số tiền (VNĐ) (*)</label>
                  <input 
                    required
                    type="number" 
                    value={txFormData.amount}
                    onChange={(e) => setTxFormData({ ...txFormData, amount: e.target.value })}
                    style={styles.input}
                    placeholder="VD: 5000000"
                  />
                </div>

                <div>
                  <label style={styles.label}>Người nộp tiền / Người nhận tiền (*)</label>
                  <input 
                    required
                    type="text" 
                    value={txFormData.donor_or_recipient}
                    onChange={(e) => setTxFormData({ ...txFormData, donor_or_recipient: e.target.value })}
                    style={styles.input}
                    placeholder="VD: Cựu học sinh Khóa 2005-2008 hoặc Em Nguyễn Văn An (10A01)"
                  />
                </div>

                <div style={styles.row2}>
                  <div>
                    <label style={styles.label}>Danh mục / Nội dung</label>
                    <input 
                      type="text" 
                      value={txFormData.category}
                      onChange={(e) => setTxFormData({ ...txFormData, category: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Ngày phát sinh</label>
                    <input 
                      type="date" 
                      value={txFormData.trans_date}
                      onChange={(e) => setTxFormData({ ...txFormData, trans_date: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div>
                  <label style={styles.label}>Ghi chú chi tiết</label>
                  <textarea 
                    rows={2}
                    value={txFormData.note}
                    onChange={(e) => setTxFormData({ ...txFormData, note: e.target.value })}
                    style={styles.textarea}
                    placeholder="Ghi chú thêm về chứng từ, chuyển khoản..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" onClick={() => setShowAddTxModal(false)} style={styles.cancelBtn}>
                    Hủy
                  </button>
                  <button type="submit" style={styles.saveReviewBtn}>
                    Lưu Phiếu Giao Dịch
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

const styles = {
  container: {
    maxWidth: '1350px',
    margin: '0 auto',
    padding: '24px 20px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '26px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  headerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#fef3c7',
    color: '#92400e',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
    marginBottom: '8px'
  },
  headerTitle: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 6px 0',
    letterSpacing: '-0.5px'
  },
  headerDesc: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0
  },
  refreshBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 14px',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    cursor: 'pointer'
  },
  exportExcelBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    background: '#10b981',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#ffffff',
    cursor: 'pointer'
  },
  exportWordBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    background: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#ffffff',
    cursor: 'pointer'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '26px'
  },
  statCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  statIconWrap: {
    padding: '12px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statLabel: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: 500,
    marginBottom: '4px'
  },
  statValue: {
    fontSize: '22px',
    fontWeight: 800,
    lineHeight: 1.2
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid #e2e8f0',
    marginBottom: '20px',
    overflowX: 'auto'
  },
  tab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 18px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: '14px',
    fontWeight: 600,
    color: '#64748b',
    cursor: 'pointer'
  },
  tabActive: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 18px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid #2563eb',
    fontSize: '14px',
    fontWeight: 700,
    color: '#2563eb',
    cursor: 'pointer'
  },
  panel: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '0 12px',
    flex: 1,
    minWidth: '260px'
  },
  filterInput: {
    width: '100%',
    padding: '9px 4px',
    border: 'none',
    background: 'transparent',
    fontSize: '13px',
    outline: 'none'
  },
  filterSelect: {
    padding: '9px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '13px',
    background: '#ffffff',
    outline: 'none'
  },
  tableWrap: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  },
  th: {
    background: '#f8fafc',
    padding: '12px 14px',
    textAlign: 'left',
    color: '#475569',
    fontWeight: 700,
    borderBottom: '2px solid #e2e8f0',
    whiteSpace: 'nowrap'
  },
  thCenter: {
    background: '#f8fafc',
    padding: '12px 14px',
    textAlign: 'center',
    color: '#475569',
    fontWeight: 700,
    borderBottom: '2px solid #e2e8f0',
    whiteSpace: 'nowrap'
  },
  td: {
    padding: '12px 14px',
    borderBottom: '1px solid #f1f5f9',
    color: '#334155'
  },
  tdBold: {
    padding: '12px 14px',
    borderBottom: '1px solid #f1f5f9',
    fontWeight: 700,
    color: '#0f172a'
  },
  tdCenter: {
    padding: '12px 14px',
    borderBottom: '1px solid #f1f5f9',
    textAlign: 'center',
    color: '#64748b'
  },
  tdCode: {
    padding: '12px 14px',
    borderBottom: '1px solid #f1f5f9',
    fontFamily: 'monospace',
    fontWeight: 600,
    color: '#2563eb'
  },
  tdAmount: {
    padding: '12px 14px',
    borderBottom: '1px solid #f1f5f9',
    textAlign: 'right'
  },
  trEven: {
    background: '#ffffff'
  },
  trOdd: {
    background: '#fafafa'
  },
  classBadge: {
    background: '#f1f5f9',
    color: '#334155',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: 600
  },
  badgeApproved: {
    background: '#d1fae5',
    color: '#065f46',
    padding: '4px 10px',
    borderRadius: '20px',
    fontWeight: 700,
    fontSize: '12px',
    display: 'inline-block'
  },
  badgePending: {
    background: '#fef3c7',
    color: '#92400e',
    padding: '4px 10px',
    borderRadius: '20px',
    fontWeight: 700,
    fontSize: '12px',
    display: 'inline-block'
  },
  badgeRejected: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '4px 10px',
    borderRadius: '20px',
    fontWeight: 700,
    fontSize: '12px',
    display: 'inline-block'
  },
  badgeIncome: {
    background: '#ecfdf5',
    color: '#047857',
    padding: '4px 10px',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '11px',
    display: 'inline-block'
  },
  badgeExpense: {
    background: '#fef2f2',
    color: '#b91c1c',
    padding: '4px 10px',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '11px',
    display: 'inline-block'
  },
  reviewBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#2563eb',
    cursor: 'pointer'
  },
  deleteBtn: {
    padding: '6px 8px',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    color: '#dc2626',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addTxBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    background: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#ffffff',
    cursor: 'pointer'
  },
  showBtn: {
    padding: '5px 10px',
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#059669',
    fontWeight: 600,
    cursor: 'pointer'
  },
  hideBtn: {
    padding: '5px 10px',
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#64748b',
    cursor: 'pointer'
  },
  formRow: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    background: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '14px'
  },
  saveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 28px',
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '10px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '20px'
  },
  modalContent: {
    background: '#ffffff',
    borderRadius: '16px',
    maxWidth: '780px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0'
  },
  modalCode: {
    fontSize: '12px',
    fontWeight: 700,
    background: '#eff6ff',
    color: '#2563eb',
    padding: '3px 8px',
    borderRadius: '4px'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '24px',
    color: '#64748b',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1
  },
  modalBody: {
    padding: '24px'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
    fontSize: '13px',
    background: '#f8fafc',
    padding: '16px',
    borderRadius: '10px',
    marginBottom: '18px',
    border: '1px solid #f1f5f9'
  },
  storySection: {
    marginBottom: '18px'
  },
  storyBox: {
    background: '#fffbeb',
    border: '1px solid #fef3c7',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '13px',
    color: '#92400e',
    lineHeight: 1.6
  },
  evidenceModalGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '10px',
    marginTop: '8px'
  },
  evidenceLink: {
    display: 'block',
    height: '90px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #cbd5e1'
  },
  evidenceThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  reviewForm: {
    background: '#f8fafc',
    borderRadius: '12px',
    padding: '18px',
    border: '1px solid #e2e8f0',
    marginTop: '20px'
  },
  cancelBtn: {
    padding: '9px 18px',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#475569',
    cursor: 'pointer'
  },
  saveReviewBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 20px',
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer'
  }
};
