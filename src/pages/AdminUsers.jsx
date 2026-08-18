import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { Users, Save, Trash2, Key } from 'lucide-react';

export default function AdminUsers() {
  const [usersList, setUsersList] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('committee_member');
  const [committeeId, setCommitteeId] = useState('');

  // Password reset state
  const [resetUserId, setResetUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (supabaseAdmin) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch users from Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) throw authError;

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase.from('cbq_user_roles').select('*, cbq_committees(name)');
      if (rolesError) throw rolesError;

      // Fetch committees for dropdown
      const { data: comData } = await supabase.from('cbq_committees').select('id, name');
      if (comData) setCommittees(comData);

      // Merge data
      const merged = authData.users.map(u => {
        const userRole = rolesData.find(r => r.user_id === u.id);
        return {
          id: u.id,
          email: u.email,
          role: userRole?.role || 'Chưa phân quyền',
          committeeName: userRole?.cbq_committees?.name || '-'
        };
      });

      setUsersList(merged);
    } catch (err) {
      alert("Lỗi khi tải dữ liệu: " + err.message);
    }
    setLoading(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!supabaseAdmin) return;
    
    // Auto-generate temporary password if empty
    const finalPassword = password || Math.random().toString(36).slice(-8);

    try {
      // 1. Create Auth User
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true
      });

      if (createError) throw createError;

      // 2. Assign Role
      const { error: roleError } = await supabaseAdmin.from('cbq_user_roles').insert([{
        user_id: userData.user.id,
        role: role,
        committee_id: (role === 'admin' || role === 'secretary') ? null : committeeId
      }]);

      if (roleError) throw roleError;

      alert(`Tạo tài khoản thành công!\nEmail: ${email}\nMật khẩu: ${finalPassword}`);
      setEmail('');
      setPassword('');
      fetchData();
    } catch (err) {
      alert("Lỗi tạo tài khoản: " + err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("BẠN CÓ CHẮC CHẮN MUỐN XÓA TÀI KHOẢN NÀY? Toàn bộ dữ liệu của họ sẽ bị mất!")) return;
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;
      alert("Đã xóa tài khoản thành công!");
      fetchData();
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(resetUserId, { password: newPassword });
      if (error) throw error;
      alert("Đổi mật khẩu thành công!");
      setResetUserId(null);
      setNewPassword('');
    } catch (err) {
      alert("Lỗi đổi mật khẩu: " + err.message);
    }
  };

  if (!supabaseAdmin) {
    return (
      <Layout title="Lỗi Bảo mật">
        <div className="glass" style={{ padding: '3rem', textAlign: 'center', color: '#ef4444', maxWidth: '600px', margin: '0 auto' }}>
          <h2>Thiếu Khóa Quản Trị (Service Role Key)</h2>
          <p style={{ marginTop: '1rem', color: '#334155' }}>
            Để sử dụng chức năng tạo tài khoản trực tiếp trên Web, hệ thống cần được cấp quyền tối cao.
          </p>
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', marginTop: '1.5rem', textAlign: 'left', border: '1px solid #e2e8f0' }}>
            <p><strong>Cách khắc phục:</strong></p>
            <ol style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', color: '#475569' }}>
              <li>Vào Supabase &gt; Project Settings &gt; API</li>
              <li>Copy chuỗi mã ở mục <strong>service_role (secret)</strong></li>
              <li>Mở file <code>.env</code> trong mã nguồn, thêm dòng:<br/><code style={{color: '#d97706'}}>VITE_SUPABASE_SERVICE_ROLE_KEY=dán_mã_vào_đây</code></li>
              <li>Khởi động lại server React (tắt dev server cũ rồi chạy lại npm run dev)</li>
            </ol>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Quản lý Tài khoản & Phân quyền">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        
        {/* Left Col: Create User Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', marginBottom: '1.5rem' }}>
              <Users size={20} /> Tạo Tài Khoản Mới
            </h3>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={styles.label}>Email (Tên đăng nhập)</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} placeholder="canbo@caobaquat.edu.vn" />
              </div>
              <div>
                <label style={styles.label}>Mật khẩu (Bỏ trống để tạo ngẫu nhiên)</label>
                <input type="text" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} placeholder="********" />
              </div>
              <div>
                <label style={styles.label}>Vai trò</label>
                <select value={role} onChange={e => setRole(e.target.value)} style={styles.input}>
                  <option value="committee_member">Thành viên Tiểu ban (Bị giới hạn)</option>
                  <option value="secretary">Thư ký (Quản lý công việc)</option>
                  <option value="admin">Quản trị viên (Admin - Toàn quyền)</option>
                </select>
              </div>
              
              {role === 'committee_member' && (
                <div>
                  <label style={styles.label}>Phân vào Tiểu ban</label>
                  <select required value={committeeId} onChange={e => setCommitteeId(e.target.value)} style={styles.input}>
                    <option value="">-- Chọn tiểu ban --</option>
                    {committees.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ padding: '12px', marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <Save size={18} /> Lưu & Kích hoạt
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Users List */}
        <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', backgroundColor: 'white', overflowX: 'auto' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}>Danh sách Người dùng Hệ thống</h3>
          
          {/* Password Reset Modal */}
          {resetUserId && (
            <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>Đổi mật khẩu</h4>
              <form onSubmit={handleChangePassword} style={{ display: 'flex', gap: '10px' }}>
                <input required type="text" placeholder="Nhập mật khẩu mới..." value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ ...styles.input, flex: 1 }} />
                <button type="submit" className="btn-primary" style={{ padding: '0 1rem' }}>Cập nhật</button>
                <button type="button" onClick={() => setResetUserId(null)} style={{ padding: '0 1rem', background: '#e2e8f0', color: '#475569', borderRadius: '0.5rem', border: 'none' }}>Hủy</button>
              </form>
            </div>
          )}

          {loading ? <p>Đang tải...</p> : (
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontSize: '14px' }}>
                  <th style={{padding: '12px 8px'}}>Email</th>
                  <th style={{padding: '12px 8px'}}>Vai trò</th>
                  <th style={{padding: '12px 8px'}}>Tiểu ban phụ trách</th>
                  <th style={{padding: '12px 8px', textAlign: 'right'}}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                    <td style={{padding: '12px 8px', fontWeight: '500'}}>{u.email}</td>
                    <td style={{padding: '12px 8px'}}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                        backgroundColor: u.role === 'admin' ? '#fee2e2' : (u.role === 'secretary' ? '#fef3c7' : (u.role === 'committee_member' ? '#e0f2fe' : '#f1f5f9')),
                        color: u.role === 'admin' ? '#ef4444' : (u.role === 'secretary' ? '#d97706' : (u.role === 'committee_member' ? '#0284c7' : '#475569'))
                      }}>
                        {u.role === 'admin' ? 'Admin' : (u.role === 'secretary' ? 'Thư ký' : (u.role === 'committee_member' ? 'Thành viên' : 'Lỗi/Trống'))}
                      </span>
                    </td>
                    <td style={{padding: '12px 8px', color: '#475569'}}>{u.committeeName}</td>
                    <td style={{padding: '12px 8px', textAlign: 'right'}}>
                      <button onClick={() => setResetUserId(u.id)} title="Đổi mật khẩu" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', marginRight: '10px' }}>
                        <Key size={18} />
                      </button>
                      <button onClick={() => handleDeleteUser(u.id)} title="Xóa tài khoản" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {usersList.length === 0 && (
                  <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>Không có tài khoản nào</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}

const styles = {
  label: { display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: '500', color: '#334155' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }
};

