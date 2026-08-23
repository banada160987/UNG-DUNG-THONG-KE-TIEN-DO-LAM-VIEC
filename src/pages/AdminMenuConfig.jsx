import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Settings, Plus, Save, Trash2, Edit3, Eye, EyeOff, Globe, LayoutDashboard, RefreshCw } from 'lucide-react';

const DEFAULT_FULL_PUBLIC_MENUS = [
  // Group 1: Kỷ niệm 30 năm
  { id: 'pub_anniv_1', target_type: 'public', parent_group: 'anniversary', label: 'ℹ️ Giới thiệu 30 năm', path: '/gioi-thieu', sort_order: 1, is_active: true },
  { id: 'pub_anniv_2', target_type: 'public', parent_group: 'anniversary', label: '📖 Tập san 30 năm 3D', path: '/tap-san', sort_order: 2, is_active: true },
  { id: 'pub_anniv_3', target_type: 'public', parent_group: 'anniversary', label: '📘 Cẩm nang hướng dẫn', path: '/huong-dan', sort_order: 3, is_active: true },
  { id: 'pub_anniv_4', target_type: 'public', parent_group: 'anniversary', label: '🏆 Cuộc thi tìm hiểu 30 năm', path: '/cuoc-thi', sort_order: 4, is_active: true },
  { id: 'pub_anniv_5', target_type: 'public', parent_group: 'anniversary', label: '⚽ Đăng ký thi đấu thể thao', path: '/dang-ky-the-thao', sort_order: 5, is_active: true },
  { id: 'pub_anniv_6', target_type: 'public', parent_group: 'anniversary', label: '🗳️ Bình chọn tác phẩm', path: '/binh-chon', sort_order: 6, is_active: true },
  { id: 'pub_anniv_7', target_type: 'public', parent_group: 'anniversary', label: '📤 Nộp bài thi sáng tạo', path: '/nop-bai-thi', sort_order: 7, is_active: true },
  { id: 'pub_anniv_8', target_type: 'public', parent_group: 'anniversary', label: '💖 Sổ lưu bút kỷ niệm', path: '/luu-but', sort_order: 8, is_active: true },

  // Group 2: Vận hành nhà trường
  { id: 'pub_school_1', target_type: 'public', parent_group: 'school', label: '📅 Lịch công tác tuần & Trực BGH', path: '/lich-cong-tac', sort_order: 1, is_active: true },
  { id: 'pub_school_2', target_type: 'public', parent_group: 'school', label: '👨‍🏫 Đội ngũ & Tổ chuyên môn', path: '/to-chuyen-mon', sort_order: 2, is_active: true },
  { id: 'pub_school_3', target_type: 'public', parent_group: 'school', label: '🛵 Đăng ký Xe máy Học sinh', path: '/dang-ky-xe-may', sort_order: 3, is_active: true },
  { id: 'pub_school_4', target_type: 'public', parent_group: 'school', label: '📋 Sổ Chấm điểm Thi đua Trực tuần', path: '/cham-diem-thi-dua', sort_order: 4, is_active: true },
  { id: 'pub_school_5', target_type: 'public', parent_group: 'school', label: '📜 Văn bản - Thông báo', path: '/van-ban', sort_order: 5, is_active: true },
  { id: 'pub_school_6', target_type: 'public', parent_group: 'school', label: '✍️ Góp ý Công việc & Đề án', path: '/gop-y', sort_order: 6, is_active: true },

  // Group 3: Tin tức & Thư viện
  { id: 'pub_media_1', target_type: 'public', parent_group: 'media', label: '📰 Tin tức - Sự kiện', path: '/tin-tuc', sort_order: 1, is_active: true },
  { id: 'pub_media_2', target_type: 'public', parent_group: 'media', label: '📸 Thư viện ảnh 30 năm', path: '/thu-vien-anh', sort_order: 2, is_active: true },
  { id: 'pub_media_3', target_type: 'public', parent_group: 'media', label: '🎖️ Bảng vàng kỷ niệm', path: '/bang-vang', sort_order: 3, is_active: true }
];

const DEFAULT_FULL_ADMIN_MENUS = [
  // Group 1: 🎉 ĐẠI LỄ KỶ NIỆM 30 NĂM
  { id: 'adm_anniv_1', target_type: 'admin', parent_group: 'anniversary', label: 'Việc của Tiểu ban', path: '/admin/committee', sort_order: 1, is_active: true },
  { id: 'adm_anniv_2', target_type: 'admin', parent_group: 'anniversary', label: 'Quản lý Khách mời', path: '/admin/guests', sort_order: 2, is_active: true },
  { id: 'adm_anniv_3', target_type: 'admin', parent_group: 'anniversary', label: 'Quản lý Tài trợ', path: '/admin/sponsors', sort_order: 3, is_active: true },
  { id: 'adm_anniv_4', target_type: 'admin', parent_group: 'anniversary', label: 'Cuộc thi tìm hiểu', path: '/admin/quizzes', sort_order: 4, is_active: true },
  { id: 'adm_anniv_5', target_type: 'admin', parent_group: 'anniversary', label: 'Bình chọn tác phẩm', path: '/admin/voting', sort_order: 5, is_active: true },
  { id: 'adm_anniv_6', target_type: 'admin', parent_group: 'anniversary', label: '⚽ Thể thao & Bảng đấu', path: '/admin/the-thao', sort_order: 6, is_active: true },
  { id: 'adm_anniv_7', target_type: 'admin', parent_group: 'anniversary', label: '📖 Quản lý Tập San 30 năm', path: '/admin/tap-san', sort_order: 7, is_active: true },

  // Group 2: 🏫 VẬN HÀNH NHÀ TRƯỜNG
  { id: 'adm_school_1', target_type: 'admin', parent_group: 'school', label: '📋 Chấm Điểm Thi Đua Lớp', path: '/admin/emulation', sort_order: 1, is_active: true },
  { id: 'adm_school_2', target_type: 'admin', parent_group: 'school', label: '👨‍🎓 Danh Sách Học Sinh', path: '/admin/students', sort_order: 2, is_active: true },
  { id: 'adm_school_3', target_type: 'admin', parent_group: 'school', label: '📅 Lịch Công Tác Tuần', path: '/admin/schedule', sort_order: 3, is_active: true },
  { id: 'adm_school_4', target_type: 'admin', parent_group: 'school', label: '👨‍🏫 Đội Ngũ & Tổ Chuyên Môn', path: '/admin/staff', sort_order: 4, is_active: true },
  { id: 'adm_school_5', target_type: 'admin', parent_group: 'school', label: '🛵 Quản Lý Xe Máy Học Sinh', path: '/admin/parking', sort_order: 5, is_active: true },
  { id: 'adm_school_6', target_type: 'admin', parent_group: 'school', label: 'Văn bản - Thông báo', path: '/admin/docs', sort_order: 6, is_active: true },
  { id: 'adm_school_7', target_type: 'admin', parent_group: 'school', label: '✍️ Quản lý Góp ý Công việc', path: '/admin/gop-y', sort_order: 7, is_active: true },

  // Group 3: 🌐 NỘI DUNG WEBSITE
  { id: 'adm_media_1', target_type: 'admin', parent_group: 'media', label: 'Tin tức - Sự kiện', path: '/admin/news', sort_order: 1, is_active: true },
  { id: 'adm_media_2', target_type: 'admin', parent_group: 'media', label: 'Thư viện ảnh', path: '/admin/gallery', sort_order: 2, is_active: true },
  { id: 'adm_media_3', target_type: 'admin', parent_group: 'media', label: 'Trang Giới thiệu & Nội dung', path: '/admin/pages', sort_order: 3, is_active: true },
  { id: 'adm_media_4', target_type: 'admin', parent_group: 'media', label: 'Cấu hình Thiệp Mời', path: '/admin/invite-config', sort_order: 4, is_active: true },
  { id: 'adm_media_5', target_type: 'admin', parent_group: 'media', label: 'Cấu hình Liên kết trang', path: '/admin/links', sort_order: 5, is_active: true },

  // Group 4: ⚙️ HỆ THỐNG
  { id: 'adm_sys_1', target_type: 'admin', parent_group: 'system', label: '⚙️ Phân quyền Tài khoản', path: '/admin/users', sort_order: 1, is_active: true },
  { id: 'adm_sys_2', target_type: 'admin', parent_group: 'system', label: '🌐 Cấu Hình Menu Hiển Thị', path: '/admin/menu-config', sort_order: 2, is_active: true },
  { id: 'adm_sys_3', target_type: 'admin', parent_group: 'system', label: 'Nhật ký Hoạt động', path: '/admin/audit', sort_order: 3, is_active: true }
];

const PRESET_SYSTEM_PAGES = [
  // Public Pages
  { label: '🏠 Trang chủ Kỷ niệm 30 năm', path: '/', group: 'school' },
  { label: '📅 Lịch công tác tuần & Trực BGH', path: '/lich-cong-tac', group: 'school' },
  { label: '👨‍🏫 Đội ngũ & Tổ chuyên môn', path: '/to-chuyen-mon', group: 'school' },
  { label: '🛵 Đăng ký Xe máy Học sinh', path: '/dang-ky-xe-may', group: 'school' },
  { label: '📋 Sổ Chấm điểm Thi đua Trực tuần', path: '/cham-diem-thi-dua', group: 'school' },
  { label: '📜 Văn bản - Thông báo', path: '/van-ban', group: 'school' },
  { label: '✍️ Góp ý Công việc & Đề án', path: '/gop-y', group: 'school' },
  { label: 'ℹ️ Giới thiệu lịch sử 30 năm', path: '/gioi-thieu', group: 'anniversary' },
  { label: '📖 Tập san 30 năm 3D', path: '/tap-san', group: 'anniversary' },
  { label: '📘 Cẩm nang hướng dẫn', path: '/huong-dan', group: 'anniversary' },
  { label: '🏆 Cuộc thi tìm hiểu 30 năm', path: '/cuoc-thi', group: 'anniversary' },
  { label: '⚽ Đăng ký thi đấu thể thao', path: '/dang-ky-the-thao', group: 'anniversary' },
  { label: '🗳️ Bình chọn tác phẩm', path: '/binh-chon', group: 'anniversary' },
  { label: '📤 Nộp bài thi sáng tạo', path: '/nop-bai-thi', group: 'anniversary' },
  { label: '💖 Sổ lưu bút kỷ niệm', path: '/luu-but', group: 'anniversary' },
  { label: '📰 Tin tức - Sự kiện', path: '/tin-tuc', group: 'media' },
  { label: '📸 Thư viện ảnh 30 năm', path: '/thu-vien-anh', group: 'media' },
  { label: '🎖️ Bảng vàng kỷ niệm', path: '/bang-vang', group: 'media' },

  // Admin Pages
  { label: '👨‍🎓 Quản lý Học sinh & Chuyển lớp', path: '/admin/students', group: 'school' },
  { label: '📋 Quản lý Thi đua & Bảng xếp hạng', path: '/admin/emulation', group: 'school' },
  { label: '🛵 Quản lý Xe máy Học sinh', path: '/admin/parking', group: 'school' },
  { label: '📅 Quản lý Lịch công tác tuần', path: '/admin/schedule', group: 'school' },
  { label: '👨‍🏫 Quản lý Đội ngũ & Tổ chuyên môn', path: '/admin/staff', group: 'school' },
  { label: '📜 Quản lý Văn bản - Thông báo', path: '/admin/docs', group: 'school' },
  { label: '📰 Quản lý Tin tức - Sự kiện', path: '/admin/news', group: 'media' },
  { label: '📸 Quản lý Thư viện ảnh', path: '/admin/gallery', group: 'media' },
  { label: '🏆 Quản lý Tài trợ', path: '/admin/sponsors', group: 'anniversary' },
  { label: '✉️ Quản lý Khách mời', path: '/admin/guests', group: 'anniversary' },
  { label: '⚙️ Phân quyền Tài khoản', path: '/admin/users', group: 'system' },
  { label: '🌐 Cấu hình Menu Hiển thị', path: '/admin/menu-config', group: 'system' }
];

const GROUP_METADATA = {
  anniversary: { title: '🎉 ĐẠI LỄ KỶ NIỆM 30 NĂM (1996 - 2026)', color: '#be123c', bg: '#fff1f2', border: '#fca5a5' },
  school: { title: '🏫 VẬN HÀNH NHÀ TRƯỜNG', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  media: { title: '📰 TIN TỨC & THƯ VIỆN MEDIA', color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' },
  system: { title: '⚙️ HỆ THỐNG QUẢN TRỊ ADMIN', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' }
};

export default function AdminMenuConfig() {
  const [targetType, setTargetType] = useState('public'); // 'public', 'admin'
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [label, setLabel] = useState('');
  const [path, setPath] = useState('');
  const [parentGroup, setParentGroup] = useState('school');
  const [icon, setIcon] = useState('Link2');
  const [sortOrder, setSortOrder] = useState(1);

  useEffect(() => {
    fetchMenus();
  }, [targetType]);

  const handleSelectPresetPage = (presetPath) => {
    setSelectedPreset(presetPath);
    if (!presetPath) return;

    const found = PRESET_SYSTEM_PAGES.find(p => p.path === presetPath);
    if (found) {
      setPath(found.path);
      if (!label.trim()) setLabel(found.label);
      if (found.group) setParentGroup(found.group);
    }
  };

  async function fetchMenus() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_navigation_menus')
        .select('*')
        .eq('target_type', targetType)
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setMenus(data);
      } else {
        const local = localStorage.getItem(`cbq_menus_${targetType}`);
        if (local) {
          setMenus(JSON.parse(local));
        } else {
          // Load default full list
          const defaultList = targetType === 'public' ? DEFAULT_FULL_PUBLIC_MENUS : DEFAULT_FULL_ADMIN_MENUS;
          setMenus(defaultList);
          localStorage.setItem(`cbq_menus_${targetType}`, JSON.stringify(defaultList));
        }
      }
    } catch (err) {
      console.warn("Nạp menu mặc định:", err);
      const defaultList = targetType === 'public' ? DEFAULT_FULL_PUBLIC_MENUS : DEFAULT_FULL_ADMIN_MENUS;
      setMenus(defaultList);
    } finally {
      setLoading(false);
    }
  }

  const handleResetDefaultMenus = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn KHÔI PHỤC ĐẦY ĐỦ tất cả danh mục menu mặc định cho ${targetType === 'public' ? 'Trang Công Khai' : 'Trang Admin'}?`)) return;
    
    const defaultList = targetType === 'public' ? DEFAULT_FULL_PUBLIC_MENUS : DEFAULT_FULL_ADMIN_MENUS;
    setMenus(defaultList);
    localStorage.setItem(`cbq_menus_${targetType}`, JSON.stringify(defaultList));

    try {
      // Upsert into Supabase
      await supabase.from('cbq_navigation_menus').delete().eq('target_type', targetType);
      await supabase.from('cbq_navigation_menus').insert(defaultList);
      alert("🎉 ĐÃ KHÔI PHỤC ĐẦY ĐỦ TẤT CẢ MENU MẶC ĐỊNH!");
    } catch (err) {
      console.warn("Lỗi reset DB:", err);
    }
  };

  const handleToggleActive = async (item) => {
    const updated = menus.map(m => m.id === item.id ? { ...m, is_active: !m.is_active } : m);
    setMenus(updated);
    localStorage.setItem(`cbq_menus_${targetType}`, JSON.stringify(updated));

    try {
      await supabase.from('cbq_navigation_menus').update({ is_active: !item.is_active }).eq('id', item.id);
    } catch (err) {
      console.warn("Lỗi lưu DB:", err);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setLabel(item.label);
    setPath(item.path);
    setParentGroup(item.parent_group || 'school');
    setIcon(item.icon || 'Link2');
    setSortOrder(item.sort_order || 1);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa mục menu này?")) return;
    const updated = menus.filter(m => m.id !== id);
    setMenus(updated);
    localStorage.setItem(`cbq_menus_${targetType}`, JSON.stringify(updated));

    try {
      await supabase.from('cbq_navigation_menus').delete().eq('id', id);
    } catch (err) {
      console.warn("Lỗi khi xóa:", err);
    }
  };

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    if (!label.trim() || !path.trim()) {
      alert("Vui lòng điền Tên hiển thị và Tuyến đường (Path)!");
      return;
    }

    const payload = {
      target_type: targetType,
      parent_group: parentGroup,
      label: label.trim(),
      path: path.trim(),
      icon: icon.trim(),
      sort_order: Number(sortOrder) || 1,
      is_active: true
    };

    let updated;
    if (editingId) {
      updated = menus.map(m => m.id === editingId ? { ...m, ...payload } : m);
    } else {
      updated = [...menus, { ...payload, id: `menu_${Date.now()}` }];
    }

    setMenus(updated);
    localStorage.setItem(`cbq_menus_${targetType}`, JSON.stringify(updated));

    try {
      if (editingId) {
        await supabase.from('cbq_navigation_menus').update(payload).eq('id', editingId);
      } else {
        await supabase.from('cbq_navigation_menus').insert([payload]);
      }
      alert("🎉 ĐÃ LƯU CẤU HÌNH MENU THÀNH CÔNG!");
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      console.warn("Lưu DB:", err);
    }
  };

  // Group menus by parent_group for organized layout
  const availableGroups = targetType === 'public' 
    ? ['anniversary', 'school', 'media'] 
    : ['anniversary', 'school', 'media', 'system'];

  return (
    <Layout title="Cấu hình Menu Động">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={26} color="#be123c" /> Cấu Hình Menu Hiển Thị Theo Nhóm
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Thêm, sửa, xóa và Ẩn/Hiện đầy đủ các mục menu được phân chia rõ ràng theo từng nhóm
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleResetDefaultMenus} className="btn-primary" style={{ padding: '10px 16px', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={18} /> Khôi Phục Đầy Đủ Menu Mặc Định
          </button>

          <button onClick={() => { setEditingId(null); setLabel(''); setPath(''); setSortOrder(menus.length + 1); setShowForm(!showForm); }} className="btn-primary" style={{ padding: '10px 18px', backgroundColor: '#be123c' }}>
            <Plus size={18} /> {showForm ? 'Đóng Form' : 'Thêm Mục Menu Mới'}
          </button>
        </div>
      </div>

      {/* SELECT TARGET TYPE */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setTargetType('public')} 
          style={{ ...styles.tabBtn, backgroundColor: targetType === 'public' ? '#be123c' : '#ffffff', color: targetType === 'public' ? '#ffffff' : '#334155' }}
        >
          <Globe size={16} /> 🌐 Menu Giao Diện Công Khai (Public Header)
        </button>
        <button 
          onClick={() => setTargetType('admin')} 
          style={{ ...styles.tabBtn, backgroundColor: targetType === 'admin' ? '#be123c' : '#ffffff', color: targetType === 'admin' ? '#ffffff' : '#334155' }}
        >
          <LayoutDashboard size={16} /> 🏫 Menu Giao Diện Admin (Admin Sidebar)
        </button>
      </div>

      {/* FORM SECTION */}
      {showForm && (
        <form onSubmit={handleSaveMenu} className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'white', marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
            {editingId ? '📝 Sửa Mục Menu' : '➕ Thêm Mục Menu Mới'}
          </h3>

          <div style={{ backgroundColor: '#f0f9ff', padding: '14px', borderRadius: '10px', border: '1px solid #bae6fd', marginBottom: '15px' }}>
            <label style={{ ...styles.label, color: '#0369a1', fontSize: '13.5px', marginBottom: '6px' }}>
              ✨ Chọn Trang Có Sẵn Trong Hệ Thống (Không cần gõ tay Link):
            </label>
            <select 
              value={selectedPreset} 
              onChange={e => handleSelectPresetPage(e.target.value)} 
              style={{ ...styles.input, fontWeight: 'bold', color: '#0284c7', backgroundColor: '#ffffff' }}
            >
              <option value="">-- Bấm vào đây để chọn nhanh trang trong hệ thống --</option>
              {PRESET_SYSTEM_PAGES.map((p, idx) => (
                <option key={idx} value={p.path}>
                  {p.label} &nbsp; ➔ &nbsp; Đường dẫn: {p.path}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={styles.label}>Tên Menu hiển thị (*)</label>
              <input type="text" required value={label} onChange={e => setLabel(e.target.value)} style={styles.input} placeholder="VD: 🛵 Đăng ký Xe máy Học sinh" />
            </div>
            <div>
              <label style={styles.label}>Tuyến đường Link Path (*)</label>
              <input type="text" required value={path} onChange={e => setPath(e.target.value)} style={{ ...styles.input, fontWeight: 'bold', color: '#0284c7' }} placeholder="VD: /dang-ky-xe-may hoặc https://..." />
            </div>
            <div>
              <label style={styles.label}>Nhóm Menu (*)</label>
              <select value={parentGroup} onChange={e => setParentGroup(e.target.value)} style={styles.input}>
                <option value="anniversary">🎉 Đại Lễ Kỷ Niệm 30 Năm</option>
                <option value="school">🏫 Vận hành Nhà trường</option>
                <option value="media">📰 Tin tức & Thư viện</option>
                <option value="system">⚙️ Hệ thống Admin</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Thứ tự hiển thị</label>
              <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={styles.input} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold' }}>Hủy</button>
            <button type="submit" className="btn-primary" style={{ padding: '8px 20px', backgroundColor: '#be123c' }}>
              <Save size={16} /> Lưu Mục Menu
            </button>
          </div>
        </form>
      )}

      {/* GROUPED MENUS DISPLAY CARDS */}
      {loading ? <p>Đang nạp danh sách menu...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {availableGroups.map((grpKey) => {
            const grpMeta = GROUP_METADATA[grpKey] || { title: grpKey, color: '#be123c', bg: '#fff1f2', border: '#fca5a5' };
            const groupItems = menus.filter(m => (m.parent_group === grpKey || (!m.parent_group && grpKey === 'school')));

            return (
              <div key={grpKey} className="glass" style={{ padding: '1.2rem', borderRadius: '1rem', backgroundColor: 'white', border: `2px solid ${grpMeta.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${grpMeta.border}`, paddingBottom: '10px', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, color: grpMeta.color, fontSize: '16px', fontWeight: 'bold' }}>
                    {grpMeta.title} ({groupItems.length} mục)
                  </h3>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: grpMeta.color, backgroundColor: grpMeta.bg, padding: '3px 10px', borderRadius: '12px', border: `1px solid ${grpMeta.border}` }}>
                    Thao tác nhanh theo nhóm
                  </span>
                </div>

                {groupItems.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>Chưa có mục menu nào trong nhóm này. Hãy bấm "Thêm Mục Menu Mới" để bổ sung.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: grpMeta.bg }}>
                        <th style={{ padding: '10px' }}>Thứ tự</th>
                        <th style={{ padding: '10px' }}>Tên Mục Menu</th>
                        <th style={{ padding: '10px' }}>Đường dẫn Link Path</th>
                        <th style={{ padding: '10px' }}>Trạng thái</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupItems.map((m, idx) => (
                        <tr key={m.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>#{m.sort_order || idx + 1}</td>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{m.label}</td>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#0284c7' }}>{m.path}</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: m.is_active !== false ? '#f0fdf4' : '#fef2f2', color: m.is_active !== false ? '#166534' : '#ef4444', border: m.is_active !== false ? '1px solid #bbf7d0' : '1px solid #fca5a5' }}>
                              {m.is_active !== false ? '🟢 Đang hiện' : '🔴 Đã ẩn'}
                            </span>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button type="button" onClick={() => handleEdit(m)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #0284c7', background: '#e0f2fe', color: '#0284c7', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Edit3 size={14} /> Sửa
                              </button>
                              <button type="button" onClick={() => handleToggleActive(m)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {m.is_active !== false ? <EyeOff size={14} color="#ef4444" /> : <Eye size={14} color="#166534" />}
                                {m.is_active !== false ? 'Ẩn' : 'Hiện lại'}
                              </button>
                              <button type="button" onClick={() => handleDelete(m.id)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Trash2 size={14} /> Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

const styles = {
  tabBtn: { padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' },
  input: { width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }
};
