import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { Users, Save, Trash2, Key, ShieldCheck, CheckSquare, Settings } from 'lucide-react';

const INITIAL_PERMISSIONS = {
  canViewStudents: true,
  canViewEmulation: true,
  canViewDocs: true,
  canViewNews: false,
  canViewSponsors: false,
  canViewGuests: false,
  canViewSports: false,
  canViewPages: false
};

export default function AdminUsers() {
  const [usersList, setUsersList] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('committee_member');
  const [committeeId, setCommitteeId] = useState('');
  const [userPermissions, setUserPermissions] = useState(INITIAL_PERMISSIONS);
  const [editingUserId, setEditingUserId] = useState(null);

  // Password reset state
  const [resetUserId, setResetUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      if (!supabaseAdmin) {
        // Fallback fetch via public client
        const { data: rolesData } = await supabase.from('cbq_user_roles').select('*, cbq_committees(name)');
        const { data: comData } = await supabase.from('cbq_committees').select('id, name');
        if (comData) setCommittees(comData);
        if (rolesData) {
          setUsersList(rolesData.map(r => ({
            id: r.user_id,
            email: `User ID: ${r.user_id.slice(0, 8)}...`,
            role: r.role,
            committeeName: r.cbq_committees?.name || '-',
            permissions: r.permissions || {}
          })));
        }
        setLoading(false);
        return;
      }

      // Fetch users from Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) throw authError;

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase.from('cbq_user_roles').select('*, cbq_committees(name)');
      if (rolesError) throw rolesError;

      // Fetch committees
      const { data: comData } = await supabase.from('cbq_committees').select('id, name');
      if (comData) setCommittees(comData);

      // Merge data
      const merged = authData.users.map(u => {
        const userRole = rolesData.find(r => r.user_id === u.id);
        return {
          id: u.id,
          email: u.email,
          role: userRole?.role || 'Chưa phân quyền',
          committeeName: userRole?.cbq_committees?.name || '-',
          permissions: userRole?.permissions || {}
        };
      });

      setUsersList(merged);
    } catch (err) {
      console.warn("Lỗi tải dữ liệu tài khoản:", err);
    } finally {
      setLoading(false);
    }
  }

  const togglePermission = (key) => {
    setUserPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleEditUserPerms = (u) => {
    setEditingUserId(u.id);
    setEmail(u.email);
    setRole(u.role);
    setUserPermissions({
      ...INITIAL_PERMISSIONS,
      ...(u.permissions || {})
    });
  };

  const handleSaveUserPermissions = async (e) => {
    e.preventDefault();
    if (!editingUserId) return;

    try {
      const client = supabaseAdmin || supabase;
      const { error } = await client
        .from('cbq_user_roles')
        .upsert([{
          user_id: editingUserId,
          role: role,
          committee_id: committeeId || null,
          permissions: userPermissions
        }], { onConflict: 'user_id' });

      if (error) throw error;

      alert("🎉 ĐÃ LƯU MA TRẬN PHÂN QUYỀN TÀI KHOẢN THÀNH CÔNG!");
      setEditingUserId(null);
      fetchData();
    } catch (err) {
      alert("Lỗi khi lưu phân quyền: " + err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!supabaseAdmin) {
      alert("Cần quyền supabaseAdmin để tạo tài khoản mới trực tiếp!");
      return;
    }
    
    const finalPassword = password || Math.random().toString(36).slice(-8);

    try {
      // 1. Create Auth User
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true
      });

      if (createError) throw createError;

      // 2. Assign Role & Matrix Permissions
      const { error: roleError } = await supabaseAdmin.from('cbq_user_roles').insert([{
        user_id: userData.user.id,
        role: role,
        committee_id: committeeId || null,
        permissions: userPermissions
      }]);

      if (roleError) throw roleError;

      alert(`🎉 ĐÃ TẠO TÀI KHOẢN THÀNH CÔNG!\nEmail: ${email}\nMật khẩu: ${finalPassword}`);
      setEmail('');
      setPassword('');
      fetchData();
    } catch (err) {
      alert("Lỗi tạo tài khoản: " + err.message);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!newPassword || !supabaseAdmin) return;
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
      if (error) throw error;
      alert("🎉 Đã đổi mật khẩu thành công!");
      setResetUserId(null);
      setNewPassword('');
    } catch (err) {
      alert("Lỗi đổi mật khẩu: " + err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn XÓA tài khoản này?")) return;
    try {
      if (supabaseAdmin) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }
      await supabase.from('cbq_user_roles').delete().eq('user_id', userId);
      setUsersList(usersList.filter(u => u.id !== userId));
      alert("Đã xóa tài khoản thành công!");
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  return (
    <Layout title="Quản lý Tài khoản & Phân quyền">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={26} color="#be123c" /> Quản Lý Tài Khoản & Ma Trận Phân Quyền
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Cấp quyền chi tiết theo từng chức năng (Thi đua, Xe máy, Lịch tuần, Tin tức...) khi tạo/sửa tài khoản
          </p>
        </div>
      </div>

      {/* FORM CREATE / EDIT USER PERMISSION MATRIX */}
      <form onSubmit={editingUserId ? handleSaveUserPermissions : handleCreateUser} className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'white', marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
          {editingUserId ? `📝 Chỉnh Sửa Ma Trận Phân Quyền (${email})` : '➕ Tạo Tài Khoản Nối Mới & Phân Quyền'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '15px' }}>
          <div>
            <label style={styles.label}>Email Đăng nhập (*)</label>
            <input type="email" required disabled={!!editingUserId} value={email} onChange={e => setEmail(e.target.value)} style={styles.input} placeholder="VD: gv_nvA@caobaquat.edu.vn" />
          </div>
          {!editingUserId && (
            <div>
              <label style={styles.label}>Mật khẩu (để trống tự tạo)</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} placeholder="Tự tạo ngẫu nhiên nếu trống" />
            </div>
          )}
          <div>
            <label style={styles.label}>Vai trò chính (*)</label>
            <select value={role} onChange={e => setRole(e.target.value)} style={styles.input}>
              <option value="committee_member">Giáo viên / Cán bộ Tiểu ban</option>
              <option value="secretary">Thư ký Hội đồng</option>
              <option value="admin">Quản trị viên (Admin Toàn quyền)</option>
            </select>
          </div>
        </div>

        {/* GRANULAR PERMISSION MATRIX CHECKBOXES */}
        <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '15px' }}>
          <label style={{ ...styles.label, color: '#be123c', fontSize: '14px', marginBottom: '10px' }}>
            🔳 Ma Trận Phân Quyền Chi Tiết Theo Chức Năng:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={!!userPermissions.canViewStudents} onChange={() => togglePermission('canViewStudents')} />
              <span>🛵 Quản lý Xe máy & Học sinh (`canViewStudents`)</span>
            </label>

            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={!!userPermissions.canViewEmulation} onChange={() => togglePermission('canViewEmulation')} />
              <span>📋 Quản lý Thi đua & Cờ đỏ (`canViewEmulation`)</span>
            </label>

            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={!!userPermissions.canViewDocs} onChange={() => togglePermission('canViewDocs')} />
              <span>📅 Lịch tuần & Tổ chuyên môn (`canViewDocs`)</span>
            </label>

            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={!!userPermissions.canViewNews} onChange={() => togglePermission('canViewNews')} />
              <span>📰 Tin tức & Thư viện ảnh (`canViewNews`)</span>
            </label>

            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={!!userPermissions.canViewSponsors} onChange={() => togglePermission('canViewSponsors')} />
              <span>🏆 Quản lý Tài trợ & Bảng vàng (`canViewSponsors`)</span>
            </label>

            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={!!userPermissions.canViewGuests} onChange={() => togglePermission('canViewGuests')} />
              <span>✉️ Quản lý Khách mời & Lễ tân (`canViewGuests`)</span>
            </label>

            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={!!userPermissions.canViewSports} onChange={() => togglePermission('canViewSports')} />
              <span>⚽ Quản lý Thể thao & Bảng đấu (`canViewSports`)</span>
            </label>

            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={!!userPermissions.canViewPages} onChange={() => togglePermission('canViewPages')} />
              <span>🌐 Trang Giới thiệu & Thiệp mời (`canViewPages`)</span>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          {editingUserId && (
            <button type="button" onClick={() => { setEditingUserId(null); setEmail(''); }} style={{ padding: '8px 16px', background: '#cbd5e1', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
              Hủy Sửa
            </button>
          )}
          <button type="submit" className="btn-primary" style={{ padding: '8px 22px', backgroundColor: '#be123c' }}>
            <Save size={16} /> {editingUserId ? 'Lưu Cập Nhật Phân Quyền' : 'Tạo Tài Khoản & Cấp Quyền'}
          </button>
        </div>
      </form>

      {/* USERS LIST TABLE */}
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'white' }}>
        <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
          👥 Danh Sách Tài Khoản Người Dùng ({usersList.length})
        </h3>

        {loading ? <p>Đang nạp danh sách tài khoản...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                <th style={{ padding: '10px' }}>Email đăng nhập</th>
                <th style={{ padding: '10px' }}>Vai trò chính</th>
                <th style={{ padding: '10px' }}>Các quyền hạn đã cấp</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{u.email}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: u.role === 'admin' ? '#fef2f2' : '#f0fdf4', color: u.role === 'admin' ? '#be123c' : '#166534' }}>
                      {u.role === 'admin' ? 'Quản trị viên' : u.role === 'secretary' ? 'Thư ký' : 'Giáo viên / Cán bộ'}
                    </span>
                  </td>
                  <td style={{ padding: '10px', fontSize: '12px', color: '#475569' }}>
                    {u.role === 'admin' ? '🔥 Toàn quyền hệ thống' : Object.keys(u.permissions || {}).filter(k => u.permissions[k]).join(', ') || 'Quyền mặc định'}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => handleEditUserPerms(u)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                        <Settings size={14} /> Sửa Quyền
                      </button>
                      <button type="button" onClick={() => handleDeleteUser(u.id)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

const styles = {
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' },
  input: { width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1e293b', cursor: 'pointer', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }
};
