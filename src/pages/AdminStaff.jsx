import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Users, Plus, Save, Trash2, Edit3, Eye, Upload, RefreshCw, Mail, Phone, Award } from 'lucide-react';

const DEPARTMENTS = [
  'Ban Giám Hiệu',
  'Tổ Toán - Tin',
  'Tổ Ngữ Văn',
  'Tổ Ngoại Ngữ',
  'Tổ Lý - Hóa - Sinh',
  'Tổ Sử - Địa - GDCD',
  'Tổ Thể Dục - QQP',
  'Tổ Văn Phòng & Kế Toán'
];

export default function AdminStaff() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Ban Giám Hiệu');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_staff')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setStaffList(data);
      }
    } catch (err) {
      console.error("Lỗi nạp danh sách giáo viên:", err);
    } finally {
      setLoading(false);
    }
  }

  // Upload Avatar File with Base64 Fallback
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `staff-avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('gallery').upload(fileName, file);
      if (!uploadError) {
        const { data } = supabase.storage.from('gallery').getPublicUrl(fileName);
        if (data && data.publicUrl) {
          setAvatarUrl(data.publicUrl);
          setUploading(false);
          return;
        }
      }

      // Fallback Base64
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarUrl(ev.target.result);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("Lỗi tải ảnh: " + err.message);
      setUploading(false);
    } finally {
      e.target.value = '';
    }
  };

  const handleEditStaff = (staff) => {
    setEditingId(staff.id);
    setName(staff.name || '');
    setTitle(staff.title || '');
    setDepartment(staff.department || 'Ban Giám Hiệu');
    setAvatarUrl(staff.avatar_url || '');
    setEmail(staff.email || '');
    setPhone(staff.phone || '');
    setBio(staff.bio || '');
    setSortOrder(staff.sort_order || 0);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa Giáo viên này khỏi danh mục?")) return;
    try {
      const { error } = await supabase.from('cbq_staff').delete().eq('id', id);
      if (error) throw error;
      fetchStaff();
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        title,
        department,
        avatar_url: avatarUrl,
        email,
        phone,
        bio,
        sort_order: Number(sortOrder) || 0,
        is_active: true
      };

      if (editingId) {
        const { error } = await supabase.from('cbq_staff').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cbq_staff').insert([payload]);
        if (error) throw error;
      }

      alert("🎉 ĐÃ LƯU THÔNG TIN GIÁO VIÊN THÀNH CÔNG!");
      setShowForm(false);
      setEditingId(null);
      fetchStaff();
    } catch (err) {
      alert("Lỗi khi lưu: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Quản lý Đội ngũ & Tổ chuyên môn">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={24} color="#be123c" /> Quản lý Đội ngũ Giáo viên & Tổ Chuyên Môn
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Quản lý hồ sơ cán bộ giáo viên, phân tổ chuyên môn và ảnh chân dung
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a 
            href="/to-chuyen-mon" 
            target="_blank" 
            rel="noreferrer" 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0284c7', textDecoration: 'none', padding: '10px 18px' }}
          >
            <Eye size={18} /> Xem Danh Mục Công Khai
          </a>
          <button 
            onClick={() => {
              setEditingId(null);
              setName('');
              setTitle('');
              setAvatarUrl('');
              setEmail('');
              setPhone('');
              setBio('');
              setShowForm(!showForm);
            }} 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 22px', backgroundColor: '#be123c' }}
          >
            <Plus size={18} /> {showForm ? 'Đóng Form' : 'Thêm Giáo Viên Mới'}
          </button>
        </div>
      </div>

      {/* FORM SECTION */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white', marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
            {editingId ? '📝 Cập nhật thông tin Giáo viên' : '➕ Thêm Cán bộ / Giáo viên mới'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px', marginTop: '15px' }}>
            <div>
              <label style={styles.label}>Họ và Tên Giáo viên (*)</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} style={styles.input} placeholder="VD: Thầy Nguyễn Văn A" />
            </div>

            <div>
              <label style={styles.label}>Chức vụ / Danh hiệu</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={styles.input} placeholder="VD: Tổ trưởng, GV Giỏi..." />
            </div>

            <div>
              <label style={styles.label}>Tổ Chuyên Môn (*)</label>
              <select value={department} onChange={e => setDepartment(e.target.value)} style={styles.input}>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={styles.label}>Ảnh Chân Dung (Chọn file từ máy HOẶC Dán link)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} style={styles.input} placeholder="Dán link ảnh hoặc chọn file từ máy..." />
                <label style={{ padding: '8px 14px', background: '#166534', color: 'white', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Upload size={16} /> Chọn File
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <div>
              <label style={styles.label}>Thứ tự hiển thị</label>
              <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={styles.input} />
            </div>

            <div>
              <label style={styles.label}>Địa chỉ Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} placeholder="gv@thptcaobaquat.edu.vn" />
            </div>

            <div>
              <label style={styles.label}>Số điện thoại</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={styles.input} placeholder="0912..." />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={styles.label}>Tóm tắt Giới thiệu / Thành tích</label>
              <textarea rows={2} value={bio} onChange={e => setBio(e.target.value)} style={styles.input} placeholder="Nhập tóm tắt tiểu sử, môn giảng dạy, thành tích nổi bật..." />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
            <button type="submit" disabled={saving || uploading} className="btn-primary" style={{ padding: '10px 24px', backgroundColor: '#be123c' }}>
              <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu Thông Tin'}
            </button>
          </div>
        </form>
      )}

      {/* STAFF LIST TABLE */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
        <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
          👨‍🏫 Danh sách Cán bộ Giáo viên ({staffList.length})
        </h3>

        {loading ? <p>Đang nạp dữ liệu...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                  <th style={{ padding: '10px' }}>Chân dung</th>
                  <th style={{ padding: '10px' }}>Họ và Tên</th>
                  <th style={{ padding: '10px' }}>Chức vụ</th>
                  <th style={{ padding: '10px' }}>Tổ Chuyên Môn</th>
                  <th style={{ padding: '10px' }}>Email / Liên hệ</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((s, idx) => (
                  <tr key={s.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px' }}>
                      <img 
                        src={s.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80'} 
                        alt={s.name} 
                        style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }}
                      />
                    </td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{s.name}</td>
                    <td style={{ padding: '10px', fontWeight: '600', color: '#b45309' }}>{s.title || 'Giáo viên'}</td>
                    <td style={{ padding: '10px', color: '#be123c', fontWeight: 'bold' }}>{s.department}</td>
                    <td style={{ padding: '10px', color: '#64748b' }}>{s.email || '-'}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => handleEditStaff(s)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', cursor: 'pointer' }}>
                          <Edit3 size={14} /> Sửa
                        </button>
                        <button type="button" onClick={() => handleDeleteStaff(s.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash2 size={14} /> Xóa
                        </button>
                      </div>
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

const styles = {
  label: { display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 'bold', color: '#334155' },
  input: { width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }
};
