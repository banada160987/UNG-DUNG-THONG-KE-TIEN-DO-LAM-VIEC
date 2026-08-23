import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { Users, Save, Trash2, Settings, X, Plus, ShieldCheck } from 'lucide-react';

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

const PERMISSION_LABELS = {
  canViewStudents: '🛵 Quản lý Xe máy & Học sinh',
  canViewEmulation: '📋 Quản lý Thi đua & Cờ đỏ',
  canViewDocs: '📅 Lịch tuần & Tổ chuyên môn & Văn bản',
  canViewNews: '📰 Tin tức & Thư viện ảnh',
  canViewSponsors: '🏆 Quản lý Tài trợ & Bảng vàng',
  canViewGuests: '✉️ Quản lý Khách mời & Lễ tân',
  canViewSports: '⚽ Quản lý Thể thao & Bảng đấu',
  canViewPages: '🌐 Trang Giới thiệu & Thiệp mời'
};

const ROLE_OPTIONS = [
  { value: 'admin', label: '👑 Ban Giám Hiệu / Quản trị viên', color: '#be123c', bg: '#fef2f2' },
  { value: 'secretary', label: '✍️ Thư ký Hội đồng / Văn thư', color: '#0369a1', bg: '#e0f2fe' },
  { value: 'dang_uy', label: '🚩 Đảng ủy Nhà trường', color: '#dc2626', bg: '#fef2f2' },
  { value: 'chi_bo_1', label: '🚩 Chi bộ 01', color: '#b91c1c', bg: '#fee2e2' },
  { value: 'chi_bo_2', label: '🚩 Chi bộ 02', color: '#b91c1c', bg: '#fee2e2' },
  { value: 'chi_bo_3', label: '🚩 Chi bộ 03', color: '#b91c1c', bg: '#fee2e2' },
  { value: 'doan_thanh_nien', label: '🌟 Đoàn Thanh niên / BCH Đoàn trường', color: '#d97706', bg: '#fef3c7' },
  { value: 'cong_doan', label: '🤝 Công đoàn Nhà trường', color: '#15803d', bg: '#dcfce7' },
  { value: 'to_toan_tin', label: '📐 Tổ Toán - Tin học', color: '#4338ca', bg: '#e0e7ff' },
  { value: 'to_ngu_van', label: '📚 Tổ Ngữ văn', color: '#c026d3', bg: '#fae8ff' },
  { value: 'to_ly_hoa_sinh', label: '🧪 Tổ Vật lý - Hóa học - Sinh học', color: '#0d9488', bg: '#ccfbf1' },
  { value: 'to_ngoai_ngu', label: '🌐 Tổ Ngoại ngữ (Tiếng Anh)', color: '#0284c7', bg: '#e0f2fe' },
  { value: 'to_su_dia_gdcd', label: '🏛️ Tổ Lịch sử - Địa lý - GDCD', color: '#b45309', bg: '#fef3c7' },
  { value: 'to_the_duc_qpan', label: '⚽ Tổ Thể dục - QPAN', color: '#166534', bg: '#dcfce7' },
  { value: 'to_van_phong', label: '🏢 Tổ Văn phòng - Kế toán', color: '#475569', bg: '#f1f5f9' },
  { value: 'gvcn', label: '👩‍🏫 Giáo viên Chủ nhiệm Lớp', color: '#6b21a8', bg: '#f3e8ff' },
  { value: 'doi_co_do', label: '🚩 Đội Cờ đỏ / Trực tuần', color: '#991b1b', bg: '#fee2e2' },
  { value: 'bao_ve', label: '🛡️ Ban Bảo vệ Cổng trường', color: '#7c2d12', bg: '#ffedd5' },
  { value: 'custom', label: '➕ Nhập Vai trò / Tổ tùy chỉnh mới...', color: '#475569', bg: '#f1f5f9' }
];

export default function AdminUsers() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State for Creating New User
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRoleSelect, setCreateRoleSelect] = useState('to_toan_tin');
  const [createCustomRole, setCreateCustomRole] = useState('');
  const [createPermissions, setCreatePermissions] = useState(INITIAL_PERMISSIONS);

  // Modal State for Editing Permissions
  const [editingUser, setEditingUser] = useState(null); // { id, email, role, permissions }
  const [editRoleSelect, setEditRoleSelect] = useState('to_toan_tin');
  const [editCustomRole, setEditCustomRole] = useState('');
  const [editPermissions, setEditPermissions] = useState(INITIAL_PERMISSIONS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      if (!supabaseAdmin) {
        // Fallback fetch via public client
        const { data: rolesData } = await supabase.from('cbq_user_roles').select('*');
        if (rolesData) {
          setUsersList(rolesData.map(r => ({
            id: r.user_id,
            email: `Tài khoản (ID: ${r.user_id.slice(0, 8)}...)`,
            role: r.role,
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
      const { data: rolesData } = await supabase.from('cbq_user_roles').select('*');

      // Merge data
      const merged = authData.users.map(u => {
        const userRole = rolesData?.find(r => r.user_id === u.id);
        const isAdminEmail = u.email && (u.email.toLowerCase().startsWith('admin') || u.email.toLowerCase().includes('admin'));
        const effectiveRole = userRole?.role ? userRole.role : (isAdminEmail ? 'admin' : 'committee_member');

        return {
          id: u.id,
          email: u.email,
          role: effectiveRole,
          permissions: userRole?.permissions || INITIAL_PERMISSIONS
        };
      });

      setUsersList(merged);
    } catch (err) {
      console.warn("Lỗi tải dữ liệu tài khoản:", err);
    } finally {
      setLoading(false);
    }
  }

  // Open Edit Permissions Modal
  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    const existingRole = u.role || 'committee_member';
    const isPreset = ROLE_OPTIONS.some(r => r.value === existingRole);

    if (isPreset) {
      setEditRoleSelect(existingRole);
      setEditCustomRole('');
    } else {
      setEditRoleSelect('custom');
      setEditCustomRole(existingRole);
    }

    setEditPermissions({
      ...INITIAL_PERMISSIONS,
      ...(u.permissions || {})
    });
  };

  const getEffectiveRole = (roleSelect, customRole) => {
    if (roleSelect === 'custom') {
      return customRole.trim() || 'Tổ tùy chỉnh';
    }
    return roleSelect;
  };

  const getRoleDisplay = (roleVal) => {
    const found = ROLE_OPTIONS.find(r => r.value === roleVal);
    if (found && found.value !== 'custom') {
      return found;
    }
    return {
      value: roleVal,
      label: roleVal.startsWith('🏢') || roleVal.startsWith('🚩') ? roleVal : `🏢 ${roleVal}`,
      color: '#475569',
      bg: '#f1f5f9'
    };
  };

  // Toggle Edit Permission Checkbox
  const toggleEditPermission = (key) => {
    setEditPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Toggle Create Permission Checkbox
  const toggleCreatePermission = (key) => {
    setCreatePermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Save Edit Permissions
  const handleSavePermissions = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    const finalRole = getEffectiveRole(editRoleSelect, editCustomRole);
    setSaving(true);
    try {
      const client = supabaseAdmin || supabase;

      // 1. Try Update
      const { data: updateData, error: updateError } = await client
        .from('cbq_user_roles')
        .update({
          role: finalRole,
          permissions: editPermissions
        })
        .eq('user_id', editingUser.id)
        .select();

      // 2. Fallback Upsert if row didn't exist
      if (updateError || !updateData || updateData.length === 0) {
        await client
          .from('cbq_user_roles')
          .upsert([{
            user_id: editingUser.id,
            role: finalRole,
            permissions: editPermissions
          }], { onConflict: 'user_id' });
      }

      // 3. Update Local State immediately
      setUsersList(prev => prev.map(u => u.id === editingUser.id ? {
        ...u,
        role: finalRole,
        permissions: editPermissions
      } : u));

      alert(`🎉 ĐÃ LƯU MA TRẬN PHÂN QUYỀN CHO TÀI KHOẢN ${editingUser.email} THÀNH CÔNG!`);
      setEditingUser(null);
    } catch (err) {
      alert("Lỗi khi lưu phân quyền: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Create User Handler
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!supabaseAdmin) {
      alert("Cần quyền supabaseAdmin để tạo tài khoản mới!");
      return;
    }
    
    const finalRole = getEffectiveRole(createRoleSelect, createCustomRole);
    const finalPassword = createPassword || Math.random().toString(36).slice(-8);

    try {
      // 1. Create Auth User
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: createEmail,
        password: finalPassword,
        email_confirm: true
      });

      if (createError) throw createError;

      // 2. Assign Role & Matrix Permissions
      await supabaseAdmin.from('cbq_user_roles').insert([{
        user_id: userData.user.id,
        role: finalRole,
        permissions: createPermissions
      }]);

      alert(`🎉 ĐÃ TẠO TÀI KHOẢN THÀNH CÔNG!\nEmail: ${createEmail}\nMật khẩu: ${finalPassword}\nVai trò/Tổ: ${finalRole}`);
      setShowCreateModal(false);
      setCreateEmail('');
      setCreatePassword('');
      setCreateCustomRole('');
      fetchData();
    } catch (err) {
      alert("Lỗi tạo tài khoản: " + err.message);
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn XÓA tài khoản này khỏi hệ thống?")) return;
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={26} color="#be123c" /> Quản Lý Tài Khoản, Tổ Chuyên Môn & Phân Quyền
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Gán Vai trò / Tổ chuyên môn (Đảng ủy, Đoàn Thanh niên, Tổ môn...) và bật/tắt ma trận phân quyền chi tiết
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ padding: '10px 18px', backgroundColor: '#be123c', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={18} /> Tạo Tài Khoản Mới
        </button>
      </div>

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
                <th style={{ padding: '10px' }}>Vai trò / Tổ chuyên môn</th>
                <th style={{ padding: '10px' }}>Các quyền hạn đã cấp</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => {
                const roleDisp = getRoleDisplay(u.role);
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{u.email}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: roleDisp.bg, color: roleDisp.color, border: `1px solid ${roleDisp.color}33` }}>
                        {roleDisp.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px', fontSize: '12.5px', color: '#475569' }}>
                      {u.role === 'admin' ? (
                        <span style={{ fontWeight: 'bold', color: '#be123c' }}>🔥 Toàn quyền hệ thống</span>
                      ) : (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {Object.keys(PERMISSION_LABELS).map(k => {
                            const isGranted = u.permissions?.[k];
                            return (
                              <span key={k} style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: isGranted ? 'bold' : 'normal', backgroundColor: isGranted ? '#f0fdf4' : '#f1f5f9', color: isGranted ? '#166534' : '#94a3b8', border: isGranted ? '1px solid #bbf7d0' : '1px solid #e2e8f0' }}>
                                {isGranted ? '✓ ' : '✕ '} {k.replace('canView', '')}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button 
                          type="button" 
                          onClick={() => handleOpenEditModal(u)} 
                          style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #0284c7', background: '#e0f2fe', color: '#0284c7', cursor: 'pointer', fontSize: '12.5px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Settings size={14} /> Sửa Quyền
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteUser(u.id)} 
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ==================== MODAL DIALOG: EDIT USER PERMISSIONS & ROLE ==================== */}
      {editingUser && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, color: '#be123c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={22} color="#be123c" /> Chỉnh Sửa Vai Trò & Phân Quyền Tài Khoản
                </h3>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>
                  Email: <strong>{editingUser.email}</strong>
                </div>
              </div>
              <button onClick={() => setEditingUser(null)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePermissions} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={styles.label}>1. Chọn Vai Trò / Tổ Chuyên Môn / Đoàn Thể (*)</label>
                <select value={editRoleSelect} onChange={e => setEditRoleSelect(e.target.value)} style={{ ...styles.input, fontWeight: 'bold' }}>
                  {ROLE_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>

                {editRoleSelect === 'custom' && (
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ ...styles.label, color: '#be123c' }}>Nhập Tên Vai Trò / Tổ Tùy Chỉnh Mới (*)</label>
                    <input 
                      type="text" 
                      required 
                      value={editCustomRole} 
                      onChange={e => setEditCustomRole(e.target.value)} 
                      style={{ ...styles.input, fontWeight: 'bold' }} 
                      placeholder="VD: Chi bộ 01, Ban Thanh tra nhân dân, CLB Truyền thông..." 
                    />
                  </div>
                )}
              </div>

              {/* PERMISSION CHECKBOX MATRIX */}
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
                <label style={{ ...styles.label, color: '#be123c', fontSize: '14px', marginBottom: '12px' }}>
                  2. Ma Trận Checkbox Phân Quyền Chi Tiết Chức Năng:
                </label>

                {editRoleSelect === 'admin' ? (
                  <div style={{ padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#be123c', fontSize: '13px', fontWeight: 'bold' }}>
                    🔥 Tài khoản Vai trò Quản trị viên (Admin) sẽ mặc định có Toàn quyền truy cập tất cả chức năng!
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                    {Object.keys(PERMISSION_LABELS).map(key => (
                      <label key={key} style={{ ...styles.checkboxLabel, backgroundColor: editPermissions[key] ? '#f0fdf4' : '#ffffff', borderColor: editPermissions[key] ? '#bbf7d0' : '#e2e8f0' }}>
                        <input 
                          type="checkbox" 
                          checked={!!editPermissions[key]} 
                          onChange={() => toggleEditPermission(key)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                        />
                        <span style={{ fontWeight: editPermissions[key] ? 'bold' : 'normal', color: editPermissions[key] ? '#166534' : '#334155' }}>
                          {PERMISSION_LABELS[key]}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setEditingUser(null)} style={{ padding: '10px 18px', background: '#cbd5e1', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                  Hủy
                </button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '10px 24px', backgroundColor: '#be123c' }}>
                  <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu Cập Nhật Phân Quyền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL DIALOG: CREATE USER ==================== */}
      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, color: '#be123c' }}>➕ Tạo Tài Khoản Nối Mới & Phân Quyền</h3>
              <button onClick={() => setShowCreateModal(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
                <div>
                  <label style={styles.label}>Email Đăng nhập (*)</label>
                  <input type="email" required value={createEmail} onChange={e => setCreateEmail(e.target.value)} style={styles.input} placeholder="VD: gv_nvA@caobaquat.edu.vn" />
                </div>
                <div>
                  <label style={styles.label}>Mật khẩu (để trống tự tạo)</label>
                  <input type="password" value={createPassword} onChange={e => setCreatePassword(e.target.value)} style={styles.input} placeholder="Tự tạo ngẫu nhiên nếu trống" />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={styles.label}>1. Chọn Vai Trò / Tổ Chuyên Môn / Đoàn Thể (*)</label>
                <select value={createRoleSelect} onChange={e => setCreateRoleSelect(e.target.value)} style={{ ...styles.input, fontWeight: 'bold' }}>
                  {ROLE_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>

                {createRoleSelect === 'custom' && (
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ ...styles.label, color: '#be123c' }}>Nhập Tên Vai Trò / Tổ Tùy Chỉnh Mới (*)</label>
                    <input 
                      type="text" 
                      required 
                      value={createCustomRole} 
                      onChange={e => setCreateCustomRole(e.target.value)} 
                      style={{ ...styles.input, fontWeight: 'bold' }} 
                      placeholder="VD: Chi bộ 01, Ban Thanh tra nhân dân, CLB Truyền thông..." 
                    />
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '15px' }}>
                <label style={{ ...styles.label, color: '#be123c', marginBottom: '10px' }}>2. Ma Trận Checkbox Phân Quyền Chi Tiết:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  {Object.keys(PERMISSION_LABELS).map(key => (
                    <label key={key} style={styles.checkboxLabel}>
                      <input type="checkbox" checked={!!createPermissions[key]} onChange={() => toggleCreatePermission(key)} />
                      <span>{PERMISSION_LABELS[key]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '8px 16px', background: '#cbd5e1', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 22px', backgroundColor: '#be123c' }}>
                  <Save size={16} /> Tạo Tài Khoản & Phân Quyền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

const styles = {
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' },
  input: { width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#1e293b', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', transition: 'all 0.2s' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' },
  modalContent: { backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  modalHeader: { padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', borderRadius: '50%' }
};
