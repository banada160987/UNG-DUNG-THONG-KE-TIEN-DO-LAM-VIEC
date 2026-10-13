import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { 
  Heart, Mail, Download, Trash2, Search, Filter, RefreshCw, 
  CheckCircle2, Clock, AlertTriangle, ShieldCheck, User, Users, 
  Eye, ExternalLink, Sparkles, MessageSquare, Copy, Check, Save, 
  ArrowLeft, Phone, Calendar, Info, X
} from 'lucide-react';
import { 
  STUDENT_ASPIRATIONS_TOPIC_ID, 
  ASPIRATION_CATEGORIES 
} from '../utils/aiPsychologyAdvisor';

export default function AdminStudentAspirations() {
  const [aspirations, setAspirations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedAnonFilter, setSelectedAnonFilter] = useState('ALL');

  // Modal xem chi tiết & xử lý
  const [selectedItem, setSelectedItem] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchAspirations();

    // Lắng nghe realtime từ Supabase
    const channel = supabase.channel('realtime:cbq_student_aspirations')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'cbq_feedback_responses',
        filter: `topic_id=eq.${STUDENT_ASPIRATIONS_TOPIC_ID}`
      }, () => {
        fetchAspirations(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedItem) {
      const existingNote = selectedItem.feedback_items?.[0]?.admin_note || '';
      setAdminNote(existingNote);
    } else {
      setAdminNote('');
    }
  }, [selectedItem]);

  const fetchAspirations = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const dbClient = supabaseAdmin || supabase;
      const { data, error } = await dbClient
        .from('cbq_feedback_responses')
        .select('*')
        .eq('topic_id', STUDENT_ASPIRATIONS_TOPIC_ID)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Lỗi tải hòm thư học sinh từ DB:', error);
        loadLocalFallback();
      } else {
        // Hợp nhất dữ liệu local nếu có tin mới tạo offline
        const localResKey = `cbq_local_feedback_res_${STUDENT_ASPIRATIONS_TOPIC_ID}`;
        const localList = JSON.parse(localStorage.getItem(localResKey) || '[]');
        const existingIds = new Set((data || []).map(d => d.id));
        const merged = [...(data || [])];
        
        localList.forEach(l => {
          if (!existingIds.has(l.id)) {
            merged.push(l);
          }
        });

        // Sắp xếp theo ngày giảm dần
        merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setAspirations(merged);
      }
    } catch (err) {
      console.warn('Exception fetch aspirations:', err);
      loadLocalFallback();
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const loadLocalFallback = () => {
    const localResKey = `cbq_local_feedback_res_${STUDENT_ASPIRATIONS_TOPIC_ID}`;
    const localList = JSON.parse(localStorage.getItem(localResKey) || '[]');
    setAspirations(localList);
  };

  // Helper phân tích dữ liệu tâm tư học sinh
  const parseAspiration = (item) => {
    const meta = item.feedback_items?.[0] || {};
    const isAnonymous = (item.organization_unit || '').includes('Ẩn danh') || 
                        (item.representative_name || '').includes('Ẩn danh') ||
                        meta.isAnonymous === true;
    
    const isUrgent = item.agreement_level === 'phan_anh_khan_cap' || 
                     (item.feedback_content || '').toLowerCase().includes('khẩn cấp') || 
                     meta.urgency === 'Khẩn cấp';
    
    const isConcern = meta.urgency === 'Cần quan tâm' || item.agreement_level === 'sua_doi';

    const categoryId = meta.category || meta.categoryId || 'co_so_vat_chat';
    const categoryObj = ASPIRATION_CATEGORIES.find(c => c.id === categoryId);
    const categoryLabel = meta.categoryLabel || categoryObj?.label || 'Chung';

    const studentName = !isAnonymous ? (item.representative_name || meta.studentName || 'Học sinh CBQ') : 'Ẩn danh';
    const className = !isAnonymous ? (meta.className || item.organization_unit || '') : '';
    const phone = !isAnonymous ? (item.phone || meta.phone || '') : '';

    const isVerified = item.is_verified === true;

    return {
      isAnonymous,
      isUrgent,
      isConcern,
      categoryLabel,
      categoryId,
      studentName,
      className,
      phone,
      isVerified,
      adminNote: meta.admin_note || '',
      rawContent: item.feedback_content || ''
    };
  };

  // Toggle trạng thái đã tiếp nhận / chưa tiếp nhận
  const handleToggleVerified = async (item, e) => {
    if (e) e.stopPropagation();
    const newStatus = !(item.is_verified === true);
    
    // Cập nhật State tức thì
    setAspirations(prev => prev.map(r => r.id === item.id ? { ...r, is_verified: newStatus } : r));
    if (selectedItem && selectedItem.id === item.id) {
      setSelectedItem(prev => ({ ...prev, is_verified: newStatus }));
    }

    try {
      const dbClient = supabaseAdmin || supabase;
      await dbClient
        .from('cbq_feedback_responses')
        .update({ is_verified: newStatus })
        .eq('id', item.id);
    } catch (err) {
      console.warn('Lỗi cập nhật trạng thái:', err);
    }

    // Cập nhật LocalStorage
    try {
      const localResKey = `cbq_local_feedback_res_${STUDENT_ASPIRATIONS_TOPIC_ID}`;
      const local = JSON.parse(localStorage.getItem(localResKey) || '[]');
      const updatedLocal = local.map(r => r.id === item.id ? { ...r, is_verified: newStatus } : r);
      localStorage.setItem(localResKey, JSON.stringify(updatedLocal));
    } catch (localErr) {
      console.warn('Lỗi update local:', localErr);
    }
  };

  // Lưu ghi chú xử lý của BGH
  const handleSaveAdminNote = async () => {
    if (!selectedItem) return;
    setSavingNote(true);

    const currentItems = selectedItem.feedback_items && Array.isArray(selectedItem.feedback_items) && selectedItem.feedback_items.length > 0
      ? selectedItem.feedback_items
      : [{}];

    const updatedItems = currentItems.map((meta, idx) => {
      if (idx === 0) {
        return {
          ...meta,
          admin_note: adminNote.trim(),
          admin_note_updated_at: new Date().toISOString()
        };
      }
      return meta;
    });

    const updatedItem = {
      ...selectedItem,
      feedback_items: updatedItems,
      is_verified: true // Ghi nhận BGH đã tiếp nhận và xử lý
    };

    // Cập nhật state UI
    setSelectedItem(updatedItem);
    setAspirations(prev => prev.map(r => r.id === selectedItem.id ? updatedItem : r));

    try {
      const dbClient = supabaseAdmin || supabase;
      await dbClient
        .from('cbq_feedback_responses')
        .update({
          feedback_items: updatedItems,
          is_verified: true
        })
        .eq('id', selectedItem.id);

      alert('✅ Đã lưu ý kiến chỉ đạo & ghi chú xử lý của BGH thành công!');
    } catch (err) {
      console.warn('Lỗi lưu ghi chú BGH:', err);
      alert('Đã lưu cục bộ ghi chú BGH.');
    } finally {
      setSavingNote(false);
    }

    // Lưu LocalStorage
    try {
      const localResKey = `cbq_local_feedback_res_${STUDENT_ASPIRATIONS_TOPIC_ID}`;
      const local = JSON.parse(localStorage.getItem(localResKey) || '[]');
      const updatedLocal = local.map(r => r.id === selectedItem.id ? updatedItem : r);
      localStorage.setItem(localResKey, JSON.stringify(updatedLocal));
    } catch (e) {
      console.warn(e);
    }
  };

  // Xóa thư tâm tư
  const handleDeleteAspiration = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Thầy/Cô có chắc chắn muốn xóa bức thư tâm tư này khỏi hệ thống?')) return;

    setAspirations(prev => prev.filter(r => r.id !== id));
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem(null);
    }

    try {
      const dbClient = supabaseAdmin || supabase;
      await dbClient
        .from('cbq_feedback_responses')
        .delete()
        .eq('id', id);
    } catch (err) {
      console.warn('Lỗi xóa thư:', err);
    }

    try {
      const localResKey = `cbq_local_feedback_res_${STUDENT_ASPIRATIONS_TOPIC_ID}`;
      const local = JSON.parse(localStorage.getItem(localResKey) || '[]');
      const updated = local.filter(r => r.id !== id);
      localStorage.setItem(localResKey, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  // Copy link hòm thư công khai cho học sinh
  const handleCopyPublicLink = () => {
    const fullUrl = `${window.location.origin}/hom-thu-hoc-sinh`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Xuất Excel theo quy tắc GEMINI.md (có tiền tố số thứ tự ở đầu tên file)
  const handleExportExcel = () => {
    if (aspirations.length === 0) {
      alert('Chưa có thư tâm tư nào để xuất Excel!');
      return;
    }

    const exportRows = filteredAspirations.map((item, index) => {
      const parsed = parseAspiration(item);
      return {
        'STT': index + 1,
        'Thời gian gửi': new Date(item.created_at).toLocaleString('vi-VN'),
        'Hình thức': parsed.isAnonymous ? 'Ẩn danh bảo mật' : 'Có danh tính',
        'Họ và tên học sinh': parsed.studentName,
        'Lớp / Chi đoàn': parsed.className || 'Không ghi rõ',
        'Số điện thoại / Zalo': parsed.phone || 'Bảo mật',
        'Chủ đề phản ánh': parsed.categoryLabel,
        'Mức độ khẩn cấp': parsed.isUrgent ? 'Khẩn cấp (Cần can thiệp gấp)' : (parsed.isConcern ? 'Cần quan tâm' : 'Bình thường'),
        'Trạng thái tiếp nhận': parsed.isVerified ? 'Đã tiếp nhận' : 'Đang chờ xử lý',
        'Nội dung tâm tư / Nguyện vọng': parsed.rawContent,
        'Ý kiến chỉ đạo / Ghi chú xử lý của BGH': parsed.adminNote || 'Chưa ghi chú'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    
    // Auto-fit độ rộng cột
    worksheet['!cols'] = [
      { wch: 6 },  // STT
      { wch: 20 }, // Thời gian
      { wch: 18 }, // Hình thức
      { wch: 22 }, // Họ tên
      { wch: 15 }, // Lớp
      { wch: 16 }, // SĐT
      { wch: 28 }, // Chủ đề
      { wch: 26 }, // Khẩn cấp
      { wch: 18 }, // Trạng thái
      { wch: 65 }, // Nội dung
      { wch: 40 }  // Ghi chú BGH
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'TamTu_HocSinh_CBQ');

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    // QUY TẮC GEMINI.md: Tiền tố số thứ tự ở đầu tên file
    const fileName = `1-Bao_cao_tong_hop_hom_thu_tam_tu_hoc_sinh_CBQ_${dateStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = aspirations.length;
    let urgent = 0;
    let anon = 0;
    let named = 0;
    let verified = 0;
    let pending = 0;

    aspirations.forEach(item => {
      const parsed = parseAspiration(item);
      if (parsed.isUrgent) urgent++;
      if (parsed.isAnonymous) anon++;
      else named++;
      if (parsed.isVerified) verified++;
      else pending++;
    });

    return { total, urgent, anon, named, verified, pending };
  }, [aspirations]);

  // Bộ lọc dữ liệu
  const filteredAspirations = useMemo(() => {
    return aspirations.filter(item => {
      const parsed = parseAspiration(item);

      // Tìm kiếm từ khóa
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = parsed.studentName.toLowerCase().includes(q);
        const matchClass = (parsed.className || '').toLowerCase().includes(q);
        const matchContent = parsed.rawContent.toLowerCase().includes(q);
        const matchNote = parsed.adminNote.toLowerCase().includes(q);
        const matchCat = parsed.categoryLabel.toLowerCase().includes(q);
        if (!matchName && !matchClass && !matchContent && !matchNote && !matchCat) {
          return false;
        }
      }

      // Lọc danh mục
      if (selectedCategoryFilter !== 'ALL') {
        if (parsed.categoryId !== selectedCategoryFilter) return false;
      }

      // Lọc khẩn cấp
      if (selectedUrgencyFilter === 'URGENT' && !parsed.isUrgent) return false;
      if (selectedUrgencyFilter === 'CONCERN' && !parsed.isConcern) return false;
      if (selectedUrgencyFilter === 'NORMAL' && (parsed.isUrgent || parsed.isConcern)) return false;

      // Lọc trạng thái
      if (selectedStatusFilter === 'VERIFIED' && !parsed.isVerified) return false;
      if (selectedStatusFilter === 'PENDING' && parsed.isVerified) return false;

      // Lọc danh tính
      if (selectedAnonFilter === 'ANON' && !parsed.isAnonymous) return false;
      if (selectedAnonFilter === 'NAMED' && parsed.isAnonymous) return false;

      return true;
    });
  }, [aspirations, searchQuery, selectedCategoryFilter, selectedUrgencyFilter, selectedStatusFilter, selectedAnonFilter]);

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '24px 20px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER SECTION */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
        background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 50%, #ffffff 100%)',
        padding: '24px 28px',
        borderRadius: '20px',
        border: '1.5px solid #fecdd3',
        boxShadow: '0 4px 20px rgba(225,29,72,0.06)'
      }}>
        <div style={{ flex: 1, minWidth: '320px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e11d48', color: '#ffffff', fontSize: '11px', fontWeight: '800', padding: '3px 10px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            <Heart size={13} fill="#ffffff" /> Ban Giám Hiệu & Đoàn Trường THPT Cao Bá Quát
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#881337', margin: '0 0 6px 0', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Mail size={26} color="#e11d48" /> HÒM THƯ TÂM TƯ & NGUYỆN VỌNG HỌC SINH
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.5', maxWidth: '820px' }}>
            Kênh quản trị tiếp nhận tâm tư, nguyện vọng cơ sở vật chất, cảm xúc học đường và sáng kiến của học sinh. 
            Hệ thống đảm bảo tính bảo mật và hỗ trợ Ban Giám Hiệu theo dõi, chỉ đạo xử lý kịp thời.
          </p>
        </div>

        {/* TOP ACTION BUTTONS */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleCopyPublicLink}
            style={{
              padding: '10px 16px',
              background: copiedLink ? '#059669' : '#ffffff',
              color: copiedLink ? '#ffffff' : '#be123c',
              border: copiedLink ? '1px solid #059669' : '1.5px solid #fda4af',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.2s'
            }}
            title="Sao chép liên kết trang gửi tâm tư công khai cho học sinh"
          >
            {copiedLink ? <Check size={16} /> : <Copy size={16} />}
            <span>{copiedLink ? 'Đã Copy Link!' : '📢 Copy Link Hòm Thư'}</span>
          </button>

          <Link
            to="/hom-thu-hoc-sinh"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 16px',
              background: '#ffffff',
              color: '#0284c7',
              border: '1.5px solid #bae6fd',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
            title="Mở giao diện học sinh trong tab mới"
          >
            <ExternalLink size={16} />
            <span>Mở Cổng Học Sinh</span>
          </Link>

          <button
            onClick={handleExportExcel}
            style={{
              padding: '10px 18px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(2,132,199,0.22)'
            }}
            title="Xuất Báo cáo danh sách tâm tư ra tệp Excel (.xlsx)"
          >
            <Download size={16} />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => fetchAspirations()}
            style={{
              padding: '10px 14px',
              background: '#ffffff',
              color: '#475569',
              border: '1.5px solid #cbd5e1',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Tải lại danh sách mới nhất"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* DASHBOARD STATISTICS CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Tổng số thư */}
        <div style={{ background: '#ffffff', padding: '16px 18px', borderRadius: '16px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '12.5px', fontWeight: 'bold' }}>
            <span>💌 Tổng Số Thư Đã Nhận</span>
            <Mail size={16} color="#64748b" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginTop: '6px' }}>
            {stats.total} <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#64748b' }}>thư</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>
            Toàn bộ tâm tư gửi về hệ thống
          </div>
        </div>

        {/* Card 2: Khẩn cấp */}
        <div style={{ background: '#fff1f2', padding: '16px 18px', borderRadius: '16px', border: '1.5px solid #fecdd3', boxShadow: '0 2px 8px rgba(225,29,72,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#be123c', fontSize: '12.5px', fontWeight: 'bold' }}>
            <span>🚨 Cần Can Thiệp Gấp</span>
            <AlertTriangle size={16} color="#e11d48" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#e11d48', marginTop: '6px' }}>
            {stats.urgent} <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#be123c' }}>thư</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#f43f5e', marginTop: '4px', fontWeight: '600' }}>
            {stats.urgent > 0 ? '⚠️ Cần BGH ưu tiên xem xét ngay' : 'Không có thư khẩn cấp nào'}
          </div>
        </div>

        {/* Card 3: Ẩn danh bảo mật */}
        <div style={{ background: '#ecfdf5', padding: '16px 18px', borderRadius: '16px', border: '1.5px solid #a7f3d0', boxShadow: '0 2px 8px rgba(5,150,105,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#065f46', fontSize: '12.5px', fontWeight: 'bold' }}>
            <span>🔒 Gửi Ẩn Danh Bảo Mật</span>
            <ShieldCheck size={16} color="#059669" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#059669', marginTop: '6px' }}>
            {stats.anon} <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#065f46' }}>thư</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#047857', marginTop: '4px' }}>
            Học sinh bảo mật thông tin cá nhân
          </div>
        </div>

        {/* Card 4: Có danh tính */}
        <div style={{ background: '#eff6ff', padding: '16px 18px', borderRadius: '16px', border: '1.5px solid #bfdbfe', boxShadow: '0 2px 8px rgba(37,99,235,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1e40af', fontSize: '12.5px', fontWeight: 'bold' }}>
            <span>👤 Ghi Rõ Họ Tên & Lớp</span>
            <User size={16} color="#2563eb" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#2563eb', marginTop: '6px' }}>
            {stats.named} <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#1e40af' }}>thư</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#3b82f6', marginTop: '4px' }}>
            Có thông tin lớp để BGH liên hệ
          </div>
        </div>

        {/* Card 5: Đã tiếp nhận */}
        <div style={{ background: '#f0fdf4', padding: '16px 18px', borderRadius: '16px', border: '1.5px solid #bbf7d0', boxShadow: '0 2px 8px rgba(22,101,52,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#166534', fontSize: '12.5px', fontWeight: 'bold' }}>
            <span>✅ Đã Tiếp Nhận & Xử Lý</span>
            <CheckCircle2 size={16} color="#16a34a" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#16a34a', marginTop: '6px' }}>
            {stats.verified} <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#166534' }}>thư</span>
          </div>
          <div style={{ fontSize: '11.5px', color: '#15803d', marginTop: '4px' }}>
            Còn {stats.pending} thư đang chờ xử lý
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div style={{
        background: '#ffffff',
        padding: '16px 20px',
        borderRadius: '16px',
        border: '1.5px solid #e2e8f0',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        {/* Search input */}
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Tìm theo họ tên học sinh, lớp hoặc từ khóa tâm tư..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              fontSize: '13.5px',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569' }}>Chủ đề:</span>
          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              fontSize: '13px',
              fontWeight: '600',
              color: '#1e293b',
              background: '#f8fafc',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">-- Tất cả ({aspirations.length}) --</option>
            {ASPIRATION_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Filter Urgency */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569' }}>Mức độ:</span>
          <select
            value={selectedUrgencyFilter}
            onChange={e => setSelectedUrgencyFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              fontSize: '13px',
              fontWeight: '600',
              color: '#1e293b',
              background: '#f8fafc',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">-- Tất cả mức độ --</option>
            <option value="URGENT">🚨 Khẩn cấp ({stats.urgent})</option>
            <option value="CONCERN">🟡 Cần quan tâm</option>
            <option value="NORMAL">🟢 Bình thường</option>
          </select>
        </div>

        {/* Filter Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569' }}>Xử lý:</span>
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              fontSize: '13px',
              fontWeight: '600',
              color: '#1e293b',
              background: '#f8fafc',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">-- Tất cả trạng thái --</option>
            <option value="VERIFIED">✅ Đã tiếp nhận ({stats.verified})</option>
            <option value="PENDING">⏳ Đang chờ ({stats.pending})</option>
          </select>
        </div>

        {/* Filter Anon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569' }}>Hình thức:</span>
          <select
            value={selectedAnonFilter}
            onChange={e => setSelectedAnonFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              fontSize: '13px',
              fontWeight: '600',
              color: '#1e293b',
              background: '#f8fafc',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">-- Tất cả --</option>
            <option value="ANON">🔒 Ẩn danh ({stats.anon})</option>
            <option value="NAMED">👤 Có danh tính ({stats.named})</option>
          </select>
        </div>
      </div>

      {/* MAIN ASPIRATIONS TABLE */}
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1.5px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Đang tải danh sách hòm thư học sinh...</div>
          </div>
        ) : filteredAspirations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <Mail size={40} color="#cbd5e1" style={{ marginBottom: '10px' }} />
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#64748b' }}>Chưa có bức thư tâm tư nào phù hợp với bộ lọc.</div>
            <div style={{ fontSize: '13px', marginTop: '6px' }}>Thầy/Cô có thể đổi từ khóa tìm kiếm hoặc bấm Đặt lại bộ lọc.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #be123c 0%, #e11d48 100%)', color: '#ffffff' }}>
                  <th style={{ padding: '14px 12px', textAlign: 'center', width: '45px' }}>STT</th>
                  <th style={{ padding: '14px 12px', width: '190px' }}>HỌC SINH / LỚP</th>
                  <th style={{ padding: '14px 12px', width: '130px' }}>THỜI GIAN GỬI</th>
                  <th style={{ padding: '14px 12px', width: '180px' }}>CHỦ ĐỀ & MỨC ĐỘ</th>
                  <th style={{ padding: '14px 12px' }}>NỘI DUNG TÂM TƯ / KIẾN NGHỊ</th>
                  <th style={{ padding: '14px 12px', textAlign: 'center', width: '110px' }}>TIẾP NHẬN</th>
                  <th style={{ padding: '14px 12px', textAlign: 'center', width: '90px' }}>XEM THƯ</th>
                  <th style={{ padding: '14px 12px', textAlign: 'center', width: '60px' }}>XÓA</th>
                </tr>
              </thead>
              <tbody>
                {filteredAspirations.map((item, index) => {
                  const parsed = parseAspiration(item);

                  return (
                    <tr 
                      key={item.id || index}
                      onClick={() => setSelectedItem(item)}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: parsed.isUrgent ? '#fff1f2' : (index % 2 === 0 ? '#ffffff' : '#fcfdfd'),
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => {
                        if (!parsed.isUrgent) e.currentTarget.style.background = '#f8fafc';
                      }}
                      onMouseLeave={e => {
                        if (!parsed.isUrgent) e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#fcfdfd';
                      }}
                    >
                      {/* STT */}
                      <td style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>
                        {index + 1}
                      </td>

                      {/* HỌC SINH / LỚP */}
                      <td style={{ padding: '14px 12px' }}>
                        {parsed.isAnonymous ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '14px', fontSize: '11.5px', fontWeight: '800' }}>
                            <ShieldCheck size={13} color="#059669" /> Ẩn danh bảo mật
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: '800', color: '#1e3a8a', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <User size={13} color="#2563eb" /> {parsed.studentName}
                            </div>
                            {parsed.className && (
                              <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px', fontWeight: '600' }}>
                                Lớp: <span style={{ color: '#0f172a' }}>{parsed.className}</span>
                              </div>
                            )}
                            {parsed.phone && parsed.phone !== 'Bảo mật' && (
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                                📞 {parsed.phone}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* THỜI GIAN GỬI */}
                      <td style={{ padding: '14px 12px', color: '#334155' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                          {new Date(item.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '1px' }}>
                          {new Date(item.created_at).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      {/* CHỦ ĐỀ & MỨC ĐỘ */}
                      <td style={{ padding: '14px 12px' }}>
                        {parsed.isUrgent ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '900' }}>
                            <AlertTriangle size={12} /> 🚨 KHẨN CẤP
                          </div>
                        ) : parsed.isConcern ? (
                          <div style={{ display: 'inline-block', background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                            🟡 Cần quan tâm
                          </div>
                        ) : (
                          <div style={{ display: 'inline-block', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                            🟢 Bình thường
                          </div>
                        )}
                        <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', fontWeight: '600' }}>
                          {parsed.categoryLabel}
                        </div>
                      </td>

                      {/* NỘI DUNG TÂM TƯ */}
                      <td style={{ padding: '14px 12px', maxWidth: '420px' }}>
                        <div style={{
                          background: parsed.isUrgent ? '#ffffff' : '#f8fafc',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: parsed.isUrgent ? '1.5px solid #fca5a5' : '1px solid #e2e8f0',
                          fontSize: '13px',
                          lineHeight: '1.55',
                          maxHeight: '80px',
                          overflowY: 'auto',
                          color: '#0f172a',
                          fontWeight: parsed.isUrgent ? '600' : 'normal'
                        }}>
                          {parsed.rawContent}
                        </div>
                        {parsed.adminNote && (
                          <div style={{ marginTop: '5px', fontSize: '11.5px', color: '#0369a1', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Info size={12} /> Đã có ghi chú BGH: {parsed.adminNote.slice(0, 45)}...
                          </div>
                        )}
                      </td>

                      {/* TIẾP NHẬN TOGGLE */}
                      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleVerified(item, e)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            border: 'none',
                            background: parsed.isVerified ? '#dcfce7' : '#fef9c3',
                            color: parsed.isVerified ? '#166534' : '#854d0e',
                            fontWeight: '800',
                            fontSize: '11.5px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                          }}
                          title="Bấm để đánh dấu đã tiếp nhận hoặc đang chờ giải quyết"
                        >
                          {parsed.isVerified ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                          <span>{parsed.isVerified ? '✅ Đã nhận' : '⏳ Chờ'}</span>
                        </button>
                      </td>

                      {/* XEM CHI TIẾT */}
                      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #fecdd3',
                            background: '#fff1f2',
                            color: '#be123c',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Xem toàn bộ thư và viết ý kiến chỉ đạo"
                        >
                          <Mail size={13} color="#e11d48" />
                          <span>Xem</span>
                        </button>
                      </td>

                      {/* XÓA */}
                      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteAspiration(item.id, e)}
                          style={{
                            padding: '6px 8px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                          title="Xóa thư này"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT & XỬ LÝ TÂM TƯ HỌC SINH */}
      {selectedItem && (() => {
        const parsed = parseAspiration(selectedItem);

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '780px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
              border: parsed.isUrgent ? '3px solid #fda4af' : '1px solid #e2e8f0',
              position: 'relative'
            }}>
              
              {/* Modal Header */}
              <div style={{
                background: parsed.isUrgent 
                  ? 'linear-gradient(135deg, #be123c 0%, #e11d48 100%)' 
                  : 'linear-gradient(135deg, #881337 0%, #be123c 100%)',
                color: '#ffffff',
                padding: '22px 26px',
                borderRadius: '23px 23px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '14px'
              }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>
                    <Heart size={12} fill="#ffffff" /> Phiếu Tâm Tư & Nguyện Vọng Học Sinh
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0, letterSpacing: '-0.2px' }}>
                    {parsed.isAnonymous ? '💌 Bức thư Ẩn Danh Từ Học Sinh' : `💌 Thư Gửi Từ: ${parsed.studentName}`}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px 26px' }}>
                
                {/* Meta details bar */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  marginBottom: '20px',
                  border: '1px solid #e2e8f0',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px'
                }}>
                  <div>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 'bold' }}>👤 Người gửi:</span>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                      {parsed.isAnonymous ? '🔒 Ẩn danh bảo mật 100%' : parsed.studentName}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 'bold' }}>🏫 Chi đoàn / Lớp:</span>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                      {parsed.className || 'Không ghi rõ'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 'bold' }}>🕒 Thời gian gửi:</span>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                      {new Date(selectedItem.created_at).toLocaleString('vi-VN')}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 'bold' }}>📌 Chủ đề & Mức độ:</span>
                    <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#881337' }}>{parsed.categoryLabel}</span>
                      {parsed.isUrgent && (
                        <span style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '1px 6px', borderRadius: '8px', fontSize: '10.5px', fontWeight: '900' }}>
                          🚨 KHẨN CẤP
                        </span>
                      )}
                    </div>
                  </div>

                  {parsed.phone && parsed.phone !== 'Bảo mật' && (
                    <div style={{ gridColumn: '1 / -1', background: '#eff6ff', padding: '8px 12px', borderRadius: '10px', border: '1px solid #bfdbfe', fontSize: '12.5px', color: '#1e40af' }}>
                      📞 <strong>Số điện thoại / Zalo để lại:</strong> {parsed.phone}
                    </div>
                  )}
                </div>

                {/* Letter Content */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquare size={16} color="#e11d48" /> NỘI DUNG TÂM TƯ & KIẾN NGHỊ CỦA HỌC SINH:
                  </div>
                  <div style={{
                    background: '#fffdfa',
                    border: '1.5px solid #fed7aa',
                    padding: '20px 22px',
                    borderRadius: '16px',
                    fontSize: '14.5px',
                    lineHeight: '1.7',
                    color: '#0f172a',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    fontFamily: 'inherit'
                  }}>
                    {parsed.rawContent || 'Không có nội dung.'}
                  </div>
                </div>

                {/* Status Toggle & Admin Note Section */}
                <div style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={17} color="#16a34a" /> Ý KIẾN CHỈ ĐẠO & GHI CHÚ NỘI BỘ CỦA BGH / ĐOÀN TRƯỜNG:
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleVerified(selectedItem)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: 'none',
                        background: parsed.isVerified ? '#dcfce7' : '#fef9c3',
                        color: parsed.isVerified ? '#166534' : '#854d0e',
                        fontWeight: '800',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      {parsed.isVerified ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                      <span>{parsed.isVerified ? '✅ Đã Tiếp Nhận' : '⏳ Đang Chờ Xử Lý'}</span>
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Nhập hướng xử lý, phân công giáo viên/bộ phận phụ trách hoặc phản hồi nội bộ của BGH..."
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '13.5px',
                      lineHeight: '1.5',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      outline: 'none',
                      marginBottom: '12px'
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={handleSaveAdminNote}
                      disabled={savingNote}
                      style={{
                        padding: '9px 18px',
                        background: '#166534',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: savingNote ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(22,101,52,0.2)'
                      }}
                    >
                      <Save size={15} />
                      <span>{savingNote ? 'Đang lưu...' : 'Lưu Ý Kiến BGH'}</span>
                    </button>
                  </div>
                </div>

                {/* Modal Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleDeleteAspiration(selectedItem.id)}
                    style={{
                      padding: '9px 16px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fca5a5',
                      borderRadius: '10px',
                      fontWeight: '700',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Trash2 size={15} /> Xóa Bức Thư
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    style={{
                      padding: '9px 20px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Đóng Cửa Sổ
                  </button>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
