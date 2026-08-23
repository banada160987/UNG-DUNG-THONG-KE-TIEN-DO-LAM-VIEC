import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Settings, Plus, Save, Trash2, Edit3, Eye, EyeOff, Globe, LayoutDashboard, ArrowUp, ArrowDown } from 'lucide-react';

const DEFAULT_PUBLIC_MENUS = [
  { id: 'm1', target_type: 'public', parent_group: 'school', label: '📅 Lịch công tác tuần & Trực BGH', path: '/lich-cong-tac', icon: 'Calendar', sort_order: 1, is_active: true },
  { id: 'm2', target_type: 'public', parent_group: 'school', label: '👨‍🏫 Đội ngũ & Tổ chuyên môn', path: '/to-chuyen-mon', icon: 'Users', sort_order: 2, is_active: true },
  { id: 'm3', target_type: 'public', parent_group: 'school', label: '🛵 Đăng ký Xe máy Học sinh', path: '/dang-ky-xe-may', icon: 'Bike', sort_order: 3, is_active: true },
  { id: 'm4', target_type: 'public', parent_group: 'school', label: '📋 Sổ Chấm điểm Thi đua Trực tuần', path: '/cham-diem-thi-dua', icon: 'Award', sort_order: 4, is_active: true },
  { id: 'm5', target_type: 'public', parent_group: 'school', label: '📜 Văn bản - Thông báo', path: '/van-ban', icon: 'FileText', sort_order: 5, is_active: true },
  { id: 'm6', target_type: 'public', parent_group: 'school', label: '✍️ Góp ý Công việc & Đề án', path: '/gop-y', icon: 'MessageSquare', sort_order: 6, is_active: true }
];

export default function AdminMenuConfig() {
  const [targetType, setTargetType] = useState('public'); // 'public', 'admin'
  const [menus, setMenus] = useState(DEFAULT_PUBLIC_MENUS);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [label, setLabel] = useState('');
  const [path, setPath] = useState('');
  const [parentGroup, setParentGroup] = useState('school');
  const [icon, setIcon] = useState('Link2');
  const [sortOrder, setSortOrder] = useState(1);

  useEffect(() => {
    fetchMenus();
  }, [targetType]);

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
        if (local) setMenus(JSON.parse(local));
      }
    } catch (err) {
      console.warn("Nạp menu mặc định:", err);
    } finally {
      setLoading(false);
    }
  }

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
      updated = [...menus, { ...payload, id: Date.now().toString() }];
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

  return (
    <Layout title="Cấu hình Menu Động">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={26} color="#be123c" /> Cấu Hình Menu Hiển Thị Động
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Thêm, sửa, xóa, sắp xếp và Ẩn/Hiện các mục Menu trên Giao diện Công khai & Sidebar Admin
          </p>
        </div>

        <button onClick={() => { setEditingId(null); setLabel(''); setPath(''); setSortOrder(menus.length + 1); setShowForm(!showForm); }} className="btn-primary" style={{ padding: '10px 18px', backgroundColor: '#be123c' }}>
          <Plus size={18} /> {showForm ? 'Đóng Form' : 'Thêm Mục Menu Mới'}
        </button>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={styles.label}>Tên Menu hiển thị (*)</label>
              <input type="text" required value={label} onChange={e => setLabel(e.target.value)} style={styles.input} placeholder="VD: 🛵 Đăng ký Xe máy Học sinh" />
            </div>
            <div>
              <label style={styles.label}>Tuyến đường Link Path (*)</label>
              <input type="text" required value={path} onChange={e => setPath(e.target.value)} style={styles.input} placeholder="VD: /dang-ky-xe-may" />
            </div>
            <div>
              <label style={styles.label}>Nhóm Menu</label>
              <select value={parentGroup} onChange={e => setParentGroup(e.target.value)} style={styles.input}>
                <option value="school">🏫 Vận hành Nhà trường</option>
                <option value="anniversary">🎉 Đại Lễ Kỷ Niệm 30 Năm</option>
                <option value="media">📰 Tin tức & Thư viện</option>
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

      {/* MENUS LIST TABLE */}
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'white' }}>
        <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
          📑 Danh Sách Mục Menu {targetType === 'public' ? 'Trang Công Khai' : 'Trang Admin'} ({menus.length})
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
              <th style={{ padding: '10px' }}>Thứ tự</th>
              <th style={{ padding: '10px' }}>Tên Mục Menu</th>
              <th style={{ padding: '10px' }}>Đường dẫn Path</th>
              <th style={{ padding: '10px' }}>Nhóm Menu</th>
              <th style={{ padding: '10px' }}>Trạng thái</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {menus.map((m, idx) => (
              <tr key={m.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>#{m.sort_order || idx + 1}</td>
                <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{m.label}</td>
                <td style={{ padding: '10px', fontWeight: 'bold', color: '#0284c7' }}>{m.path}</td>
                <td style={{ padding: '10px', color: '#475569' }}>{m.parent_group || 'school'}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: m.is_active ? '#f0fdf4' : '#fef2f2', color: m.is_active ? '#166534' : '#ef4444' }}>
                    {m.is_active ? 'Đang hiện' : 'Đã ẩn'}
                  </span>
                </td>
                <td style={{ padding: '10px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => handleEdit(m)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', cursor: 'pointer' }}>
                      <Edit3 size={14} />
                    </button>
                    <button type="button" onClick={() => handleToggleActive(m)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', cursor: 'pointer' }}>
                      {m.is_active ? <EyeOff size={14} color="#ef4444" /> : <Eye size={14} color="#166534" />}
                    </button>
                    <button type="button" onClick={() => handleDelete(m.id)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

const styles = {
  tabBtn: { padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' },
  input: { width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }
};
