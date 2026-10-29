import { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { supabase, supabaseAdmin } from '../lib/supabase';
import { 
  Users, Save, Trash2, Settings, X, Plus, ShieldCheck, 
  CheckSquare, Square, RefreshCw, Search, Filter, Key, 
  Mail, User, Phone, Check, AlertCircle, BookOpen, 
  GraduationCap, Utensils, Award, Sparkles, ExternalLink
} from 'lucide-react';

// =========================================================================
// 1. MA TRẬN 18 QUYỀN HẠN PHÂN THEO 4 NHÓM CHUYÊN NGHỆP
// =========================================================================
export const PERMISSION_GROUPS = [
  {
    id: 'academics',
    name: 'QUẢN LÝ CHUYÊN MÔN & GIẢNG DẠY',
    icon: '📚',
    badgeColor: '#0284c7',
    badgeBg: '#e0f2fe',
    permissions: [
      { 
        key: 'canViewDocs', 
        label: 'Sổ Văn Bản, Lịch Tuần & Điểm Danh Họp', 
        desc: 'Xem và quản lý lịch công tác tuần, thông báo văn bản nội bộ, mở phòng điểm danh họp trực tuyến' 
      },
      { 
        key: 'canManageDepartments', 
        label: 'Sổ Kế Hoạch & Hồ Sơ Tổ Chuyên Môn', 
        desc: 'Quản lý duyệt kế hoạch dạy học, hồ sơ chuyên môn, sinh hoạt tổ của Tổ trưởng (TTCM)' 
      },
      { 
        key: 'canViewEduHub', 
        label: 'Trạm Video & Học Liệu Số 4.0', 
        desc: 'Đăng tải video bài giảng số, học liệu điện tử phục vụ giáo viên và học sinh học tập' 
      }
    ]
  },
  {
    id: 'students',
    name: 'QUẢN LÝ HỌC SINH & NỀ NẾP',
    icon: '👨‍🎓',
    badgeColor: '#16a34a',
    badgeBg: '#dcfce7',
    permissions: [
      { 
        key: 'canViewStudents', 
        label: 'Sổ Học Sinh, Chuyển Lớp & Điểm Danh QR', 
        desc: 'Tra cứu hồ sơ học sinh toàn trường, danh sách lớp, quét mã QR check-in sự kiện' 
      },
      { 
        key: 'canViewEmulation', 
        label: 'Sổ Chấm Điểm Thi Đua & Nề Nếp Lớp', 
        desc: 'Chấm điểm trực tuần Đội cờ đỏ, trừ điểm vi phạm nề nếp, tổng hợp bảng xếp hạng tuần' 
      },
      { 
        key: 'canViewDigitalVault', 
        label: 'Kho Văn Bằng Số & Hồ Sơ Tốt Nghiệp', 
        desc: 'Kiểm tra hồ sơ thi tốt nghiệp THPT, số hiệu bằng tốt nghiệp, học bạ điện tử học sinh' 
      },
      { 
        key: 'canViewFeedback', 
        label: 'Hòm Thư Học Sinh & Tiếp Nhận Góp Ý', 
        desc: 'Xem tâm tư nguyện vọng của học sinh, phản hồi thư ẩn danh, ý kiến đóng góp xây dựng' 
      }
    ]
  },
  {
    id: 'services',
    name: 'DỊCH VỤ, ĐĂNG KÝ & ĐỜI SỐNG',
    icon: '📋',
    badgeColor: '#ea580c',
    badgeBg: '#ffedd5',
    permissions: [
      { 
        key: 'canManageCanteen', 
        label: 'Điều Phối Điểm Tâm Sáng (Cô Vân)', 
        desc: 'Tiếp nhận phiếu đăng ký suất ăn, tổng hợp số lượng món nấu buổi sáng, đối soát kinh phí VietQR' 
      },
      { 
        key: 'canViewParking', 
        label: 'Quản Lý Xe Máy & Xe Đưa Đón Học Sinh', 
        desc: 'Duyệt đơn đăng ký xe máy trên 50cc, cấp mã gửi xe, quản lý tuyến xe buýt đưa đón học sinh' 
      },
      { 
        key: 'canViewSports', 
        label: 'Quản Lý Giải Đấu Thể Thao Học Đường', 
        desc: 'Lập lịch thi đấu bóng đá, bóng chuyền, chia bảng đấu, cập nhật kết quả và bảng tổng sắp' 
      },
      { 
        key: 'canViewRegistrations', 
        label: 'Quản Lý Các Đợt Đăng Ký Trực Tuyến', 
        desc: 'Tạo form đăng ký sự kiện động, tải danh sách đăng ký ngoại khóa và hoạt động phong trào' 
      },
      { 
        key: 'canViewQuizzes', 
        label: 'Quản Lý Cuộc Thi Online & Bình Chọn', 
        desc: 'Soạn đề thi trực tuyến trắc nghiệm, quản lý bình chọn tác phẩm ảnh/video của học sinh' 
      }
    ]
  },
  {
    id: 'media',
    name: 'TRUYỀN THÔNG, TƯ LIỆU & KỶ NIỆM 30 NĂM',
    icon: '📰',
    badgeColor: '#9333ea',
    badgeBg: '#f3e8ff',
    permissions: [
      { 
        key: 'canViewNews', 
        label: 'Tin Tức, Sự Kiện & Thư Viện Ảnh', 
        desc: 'Đăng tải bản tin hoạt động nhà trường, quản lý album ảnh sự kiện và lễ hội' 
      },
      { 
        key: 'canViewSponsors', 
        label: 'Quản Lý Tài Trợ & Bảng Vàng Vinh Danh', 
        desc: 'Cập nhật danh sách nhà tài trợ, các khoản đóng góp ủng hộ, vinh danh cựu học sinh' 
      },
      { 
        key: 'canViewGuests', 
        label: 'Quản Lý Khách Mời & Thiệp Mời Điện Tử', 
        desc: 'Lập danh sách đại biểu, gửi thiệp mời trực tuyến, kiểm tra xác nhận tham dự lễ kỷ niệm' 
      },
      { 
        key: 'canViewMagazine', 
        label: 'Quản Lý Tập San & Kỷ Yếu 30 Năm', 
        desc: 'Biên tập bài viết văn nghệ, bài viết kỷ yếu, duyệt nội dung tập san số 3D' 
      },
      { 
        key: 'canViewGuestbook', 
        label: 'Quản Lý Sổ Lưu Bút Kỷ Niệm', 
        desc: 'Duyệt các bài cảm tưởng, lời chúc kỷ niệm của thầy cô, cựu giáo viên và học sinh' 
      },
      { 
        key: 'canViewLinks', 
        label: 'Cấu Hình Liên Kết Trang Web Ngoài', 
        desc: 'Thêm, sửa, ẩn/hiện danh sách liên kết bên ngoài trên thanh menu trang chủ' 
      }
    ]
  }
];

// Danh sách phẳng tất cả key quyền hạn
export const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key));

// =========================================================================
// 2. DANH SÁCH VAI TRÒ CHUẨN TRONG NHÀ TRƯỜNG
// =========================================================================
export const ROLE_OPTIONS = [
  { value: 'admin', label: '👑 Ban Giám Hiệu / Quản trị viên', color: '#be123c', bg: '#fef2f2' },
  { value: 'secretary', label: '✍️ Thư ký Hội đồng / Văn thư', color: '#0369a1', bg: '#e0f2fe' },
  { value: 'canteen_staff', label: '🍳 Tổ Hỗ trợ đời sống / Điểm tâm sáng (Cô Vân)', color: '#ea580c', bg: '#fff7ed' },
  { value: 'dang_uy', label: '🚩 Đảng ủy Nhà trường', color: '#dc2626', bg: '#fef2f2' },
  { value: 'chi_bo_1', label: '🚩 Chi bộ 01', color: '#b91c1c', bg: '#fee2e2' },
  { value: 'chi_bo_2', label: '🚩 Chi bộ 02', color: '#b91c1c', bg: '#fee2e2' },
  { value: 'chi_bo_3', label: '🚩 Chi bộ 03', color: '#b91c1c', bg: '#fee2e2' },
  { value: 'doan_thanh_nien', label: '🌟 Đoàn Thanh niên / BCH Đoàn trường', color: '#d97706', bg: '#fef3c7' },
  { value: 'cong_doan', label: '🤝 Công đoàn Nhà trường', color: '#15803d', bg: '#dcfce7' },
  { value: 'to_toan', label: '📐 Tổ Toán', color: '#4338ca', bg: '#e0e7ff' },
  { value: 'to_ngu_van', label: '📚 Tổ Ngữ văn', color: '#c026d3', bg: '#fae8ff' },
  { value: 'to_tin_hoc_ngoai_ngu', label: '🌐 Tổ Tin học - Ngoại Ngữ', color: '#0284c7', bg: '#e0f2fe' },
  { value: 'to_vat_ly_hoa_hoc', label: '🧪 Tổ Vật Lý - Hóa học', color: '#0d9488', bg: '#ccfbf1' },
  { value: 'to_sinh_hoc', label: '🌱 Tổ Sinh học', color: '#0891b2', bg: '#ecfeff' },
  { value: 'to_su_dia_gdktpl', label: '🏛️ Tổ Sử - Địa - GDKT&PL', color: '#b45309', bg: '#fef3c7' },
  { value: 'to_gdtc_qpan', label: '⚽ Tổ GDTC - QPAN', color: '#166534', bg: '#dcfce7' },
  { value: 'to_van_phong', label: '🏢 Tổ Văn Phòng', color: '#475569', bg: '#f1f5f9' },
  { value: 'gvcn', label: '👩‍🏫 Giáo viên Chủ nhiệm Lớp', color: '#6b21a8', bg: '#f3e8ff' },
  { value: 'doi_co_do', label: '🚩 Đội Cờ đỏ / Trực tuần', color: '#991b1b', bg: '#fee2e2' },
  { value: 'bao_ve', label: '🛡️ Ban Bảo vệ Cổng trường', color: '#7c2d12', bg: '#ffedd5' },
  { value: 'custom', label: '➕ Nhập Vai trò / Tổ tùy chỉnh mới...', color: '#475569', bg: '#f1f5f9' }
];

// =========================================================================
// 3. HÀM TẠO GỢI Ý MA TRẬN PHÂN QUYỀN MẶC ĐỊNH THEO VAI TRÒ
// =========================================================================
export function getRoleDefaultPermissions(roleValue) {
  // Tạo đối tượng trống ban đầu: toàn bộ false
  const base = {};
  ALL_PERMISSION_KEYS.forEach(k => { base[k] = false; });

  if (!roleValue) return base;

  // 1. Quản trị viên / Ban Giám Hiệu: Có toàn bộ 100% quyền
  if (roleValue === 'admin') {
    ALL_PERMISSION_KEYS.forEach(k => { base[k] = true; });
    return base;
  }

  // 2. Thư ký Hội đồng / Văn thư
  if (roleValue === 'secretary') {
    return {
      ...base,
      canViewDocs: true,
      canManageDepartments: true,
      canViewEduHub: true,
      canViewStudents: true,
      canViewEmulation: true,
      canViewDigitalVault: true,
      canViewFeedback: true,
      canViewParking: true,
      canViewSports: true,
      canViewRegistrations: true,
      canViewQuizzes: true,
      canViewNews: true,
      canViewSponsors: true,
      canViewGuests: true,
      canViewMagazine: true,
      canViewGuestbook: true,
      canViewLinks: true,
      canManageCanteen: false // Tách bạch điểm tâm sáng cho cô Vân
    };
  }

  // 3. Cô Lương Thị Hải Vân (Tổ Hỗ trợ đời sống / Điểm tâm sáng)
  if (roleValue === 'canteen_staff') {
    return {
      ...base,
      canManageCanteen: true // Quyền điều phối suất ăn & đối soát tài chính
    };
  }

  // 4. Đoàn Thanh Niên / BCH Đoàn trường
  if (roleValue === 'doan_thanh_nien') {
    return {
      ...base,
      canViewDocs: true,
      canViewStudents: true,
      canViewEmulation: true,
      canViewFeedback: true,
      canViewSports: true,
      canViewRegistrations: true,
      canViewQuizzes: true,
      canViewNews: true,
      canViewMagazine: true,
      canViewGuestbook: true
    };
  }

  // 5. Đội Cờ đỏ / Trực tuần nề nếp
  if (roleValue === 'doi_co_do') {
    return {
      ...base,
      canViewStudents: true,
      canViewEmulation: true
    };
  }

  // 6. Ban Bảo vệ cổng trường
  if (roleValue === 'bao_ve') {
    return {
      ...base,
      canViewParking: true
    };
  }

  // 7. Giáo viên chủ nhiệm (GVCN)
  if (roleValue === 'gvcn') {
    return {
      ...base,
      canViewDocs: true,
      canViewStudents: true,
      canViewEmulation: true,
      canViewFeedback: true
    };
  }

  // 8. Tổ GDTC - QPAN (Thể dục & Thể thao)
  if (roleValue === 'to_gdtc_qpan') {
    return {
      ...base,
      canViewDocs: true,
      canManageDepartments: true,
      canViewSports: true
    };
  }

  // 9. Các tổ chuyên môn (Toán, Văn, Lý, Hóa, Sinh, Sử, Địa, Tin...)
  if (typeof roleValue === 'string' && roleValue.startsWith('to_')) {
    return {
      ...base,
      canViewDocs: true,
      canManageDepartments: true,
      canViewEduHub: roleValue === 'to_tin_hoc_ngoai_ngu' // Tổ tin học có thể hỗ trợ video học liệu
    };
  }

  // 10. Mặc định cho vai trò thành viên khác
  return {
    ...base,
    canViewDocs: true,
    canViewStudents: true,
    canViewEmulation: true
  };
}

export default function AdminUsers() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Bộ lọc danh sách người dùng
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Form State: Tạo Tài Khoản Mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFullName, setCreateFullName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRoleSelect, setCreateRoleSelect] = useState('to_toan');
  const [createCustomRole, setCreateCustomRole] = useState('');
  const [createPermissions, setCreatePermissions] = useState(() => getRoleDefaultPermissions('to_toan'));

  // Form State: Chỉnh Sửa Tài Khoản & Phân Quyền
  const [editingUser, setEditingUser] = useState(null); // { id, email, fullName, role, permissions }
  const [editFullName, setEditFullName] = useState('');
  const [editRoleSelect, setEditRoleSelect] = useState('to_toan');
  const [editCustomRole, setEditCustomRole] = useState('');
  const [editPermissions, setEditPermissions] = useState(() => getRoleDefaultPermissions('to_toan'));

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Đọc vai trò từ bảng cbq_user_roles
      const { data: rolesData, error: rolesError } = await supabase.from('cbq_user_roles').select('*');
      if (rolesError) {
        console.warn("Lỗi đọc cbq_user_roles:", rolesError.message);
      }

      if (!supabaseAdmin) {
        // Fallback nếu không có service key admin
        if (rolesData) {
          setUsersList(rolesData.map(r => ({
            id: r.user_id,
            email: `Tài khoản (ID: ${r.user_id.slice(0, 8)}...)`,
            fullName: '',
            phone: '',
            role: r.role,
            permissions: r.permissions || getRoleDefaultPermissions(r.role)
          })));
        }
        setLoading(false);
        return;
      }

      // 2. Lấy danh sách Auth Users từ Supabase Admin
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) throw authError;

      // 3. Khớp dữ liệu Auth và bảng vai trò
      const merged = (authData?.users || []).map(u => {
        const userRole = rolesData?.find(r => r.user_id === u.id);
        const isAdminEmail = u.email && (u.email.toLowerCase().startsWith('admin') || u.email.toLowerCase().includes('admin'));
        const effectiveRole = userRole?.role ? userRole.role : (isAdminEmail ? 'admin' : (u.user_metadata?.role || 'committee_member'));
        const fullName = u.user_metadata?.full_name || u.user_metadata?.name || '';
        const phone = u.user_metadata?.phone || '';

        return {
          id: u.id,
          email: u.email,
          fullName,
          phone,
          role: effectiveRole,
          permissions: userRole?.permissions || getRoleDefaultPermissions(effectiveRole)
        };
      });

      setUsersList(merged);
    } catch (err) {
      console.warn("Lỗi tải dữ liệu tài khoản:", err);
    } finally {
      setLoading(false);
    }
  }

  // Chuyển đổi vai trò tùy chỉnh nếu chọn "custom"
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
      label: (typeof roleVal === 'string' && (roleVal.startsWith('🏢') || roleVal.startsWith('🚩') || roleVal.startsWith('🍳'))) ? roleVal : `🏢 ${roleVal}`,
      color: '#475569',
      bg: '#f1f5f9'
    };
  };

  // Mở modal sửa quyền
  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setEditFullName(u.fullName || '');
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
      ...getRoleDefaultPermissions(existingRole),
      ...(u.permissions || {})
    });
  };

  // Khi thay đổi vai trò trong form tạo mới: Tự động nạp mẫu quyền gợi ý
  const handleCreateRoleChange = (newRole) => {
    setCreateRoleSelect(newRole);
    setCreatePermissions(getRoleDefaultPermissions(newRole));
  };

  // Khi thay đổi vai trò trong form chỉnh sửa: Tự động nạp mẫu quyền gợi ý
  const handleEditRoleChange = (newRole) => {
    setEditRoleSelect(newRole);
    setEditPermissions(getRoleDefaultPermissions(newRole));
  };

  // Nút bấm nhanh Chọn tất cả / Bỏ tất cả
  const handleSetAllPermissions = (target, value) => {
    const updated = {};
    ALL_PERMISSION_KEYS.forEach(k => { updated[k] = value; });
    if (target === 'create') setCreatePermissions(updated);
    if (target === 'edit') setEditPermissions(updated);
  };

  // Lưu hoặc cập nhật vai trò + phân quyền mà không phụ thuộc vào ràng buộc UNIQUE của CSDL
  const saveUserRoleToDB = async (client, targetUserId, targetRole, targetPermissions) => {
    // 1. Xóa bản ghi cũ của user_id (nếu có) để triệt tiêu dòng trùng lặp
    try {
      await client.from('cbq_user_roles').delete().eq('user_id', targetUserId);
    } catch (_) {}

    // 2. Chèn bản ghi mới chuẩn xác
    const { error: insertError } = await client.from('cbq_user_roles').insert([{
      user_id: targetUserId,
      role: targetRole,
      permissions: targetPermissions
    }]);

    if (insertError) throw insertError;
  };

  // Lưu chỉnh sửa phân quyền
  const handleSavePermissions = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    const finalRole = getEffectiveRole(editRoleSelect, editCustomRole);
    setSaving(true);
    try {
      const client = supabaseAdmin || supabase;

      // 1. Cập nhật bảng cbq_user_roles bằng phương thức an toàn
      await saveUserRoleToDB(client, editingUser.id, finalRole, editPermissions);

      // 2. Cập nhật user_metadata trong Auth nếu có quyền admin
      if (supabaseAdmin && editFullName.trim()) {
        try {
          await supabaseAdmin.auth.admin.updateUserById(editingUser.id, {
            user_metadata: {
              full_name: editFullName.trim(),
              name: editFullName.trim(),
              role: finalRole
            }
          });
        } catch (_) {}
      }

      // 3. Cập nhật state trực tiếp ngay lập tức
      setUsersList(prev => prev.map(u => u.id === editingUser.id ? {
        ...u,
        fullName: editFullName.trim() || u.fullName,
        role: finalRole,
        permissions: editPermissions
      } : u));

      alert(`🎉 ĐÃ CẬP NHẬT PHÂN QUYỀN CHO TÀI KHOẢN "${editingUser.email}" THÀNH CÔNG!`);
      setEditingUser(null);
    } catch (err) {
      alert("Lỗi khi lưu phân quyền: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Xử lý tạo tài khoản mới kèm phân quyền
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!supabaseAdmin) {
      alert("Cần quyền supabaseAdmin để tạo tài khoản mới!");
      return;
    }
    
    const finalRole = getEffectiveRole(createRoleSelect, createCustomRole);
    const finalPassword = createPassword.trim() || (Math.random().toString(36).slice(-6) + 'Ab1!');

    try {
      // 1. Tạo tài khoản trong Auth
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: createEmail.trim(),
        password: finalPassword,
        email_confirm: true,
        user_metadata: {
          full_name: createFullName.trim() || createEmail.split('@')[0],
          name: createFullName.trim() || createEmail.split('@')[0],
          phone: createPhone.trim(),
          role: finalRole
        }
      });

      if (createError) throw createError;

      // 2. Lưu vai trò và ma trận quyền vào cbq_user_roles bằng phương thức an toàn
      await saveUserRoleToDB(supabaseAdmin, userData.user.id, finalRole, createPermissions);

      alert(`🎉 ĐÃ TẠO TÀI KHOẢN MỚI THÀNH CÔNG!\n\n👤 Cán bộ/GV: ${createFullName.trim() || 'Cán bộ'}\n📧 Email: ${createEmail}\n🔑 Mật khẩu: ${finalPassword}\n🏷️ Vai trò/Tổ: ${finalRole}\n\n(Hệ thống đã tự động gán đủ ${Object.values(createPermissions).filter(Boolean).length}/18 quyền chức năng đã chọn)`);
      setShowCreateModal(false);
      setCreateFullName('');
      setCreatePhone('');
      setCreateEmail('');
      setCreatePassword('');
      setCreateCustomRole('');
      setCreatePermissions(getRoleDefaultPermissions('to_toan'));
      fetchData();
    } catch (err) {
      alert("Lỗi tạo tài khoản: " + err.message);
    }
  };

  // Xóa tài khoản
  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Bạn có chắc chắn muốn XÓA vĩnh viễn tài khoản "${userEmail}" khỏi hệ thống?`)) return;
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

  // Đồng bộ toàn bộ vào CSDL
  const handleSyncAllRolesToDB = async () => {
    if (usersList.length === 0) return;
    setSaving(true);
    try {
      const client = supabaseAdmin || supabase;
      const userIds = usersList.map(u => u.id);

      // Xóa các bản ghi cũ của các user_id này trước để tránh trùng lặp
      if (userIds.length > 0) {
        try {
          await client.from('cbq_user_roles').delete().in('user_id', userIds);
        } catch (_) {}
      }

      const payload = usersList.map(u => ({
        user_id: u.id,
        role: u.role,
        permissions: u.permissions || getRoleDefaultPermissions(u.role)
      }));

      const { error } = await client
        .from('cbq_user_roles')
        .insert(payload);

      if (error) throw error;
      alert(`🎉 ĐÃ ĐỒNG BỘ THÀNH CÔNG TOÀN BỘ MA TRẬN PHÂN QUYỀN CỦA ${usersList.length} TÀI KHOẢN VÀO CSDL SUPABASE!`);
    } catch (err) {
      alert("Lỗi khi đồng bộ CSDL: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Lọc danh sách người dùng theo ô tìm kiếm và vai trò
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const matchesSearch = 
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.role || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [usersList, searchQuery, roleFilter]);

  // Đếm số quyền đã cấp
  const countActivePermissions = (perms) => {
    if (!perms) return 0;
    return Object.values(perms).filter(Boolean).length;
  };

  return (
    <Layout title="Quản lý Tài khoản & Phân quyền">
      {/* 1. TOP HEADER & ACTION BUTTONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={26} color="#be123c" /> Quản Lý Tài Khoản & Ma Trận Phân Quyền (RBAC)
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13.5px' }}>
            Phân quyền chi tiết 18 danh mục chức năng theo 4 nhóm chuyên môn, dịch vụ, nề nếp và truyền thông nhà trường
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            type="button"
            onClick={handleSyncAllRolesToDB} 
            disabled={saving}
            className="btn-primary" 
            style={{ padding: '9px 16px', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <Save size={16} /> {saving ? 'Đang lưu...' : '💾 Đồng Bộ Toàn Bộ Vào CSDL'}
          </button>

          <button 
            type="button"
            onClick={() => {
              setCreateFullName('');
              setCreatePhone('');
              setCreateEmail('');
              setCreatePassword('');
              setCreateRoleSelect('to_toan');
              setCreateCustomRole('');
              setCreatePermissions(getRoleDefaultPermissions('to_toan'));
              setShowCreateModal(true);
            }} 
            className="btn-primary" 
            style={{ padding: '9px 18px', backgroundColor: '#be123c', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <Plus size={16} /> Tạo Tài Khoản Mới
          </button>
        </div>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px', background: '#ffffff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            placeholder="Tìm theo email, họ tên, vai trò..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
          />
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={15} color="#64748b" />
          <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569' }}>Lọc Vai Trò:</span>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 'bold', color: '#1e293b' }}
          >
            <option value="all">Tất cả vai trò ({usersList.length})</option>
            {ROLE_OPTIONS.filter(r => r.value !== 'custom').map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. USERS LIST TABLE */}
      <div className="glass" style={{ padding: '1.25rem', borderRadius: '1rem', backgroundColor: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, color: '#be123c', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            👥 Danh Sách Tài Khoản Người Dùng ({filteredUsers.length} / {usersList.length})
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            💡 Quản trị viên (Admin) mặc định có đủ 18 quyền. Các tài khoản khác được phân quyền theo ma trận chi tiết.
          </span>
        </div>

        {loading ? <p style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Đang nạp danh sách tài khoản...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                  <th style={{ padding: '12px 10px' }}>Họ Tên & Email Đăng Nhập</th>
                  <th style={{ padding: '12px 10px' }}>Vai Trò / Tổ Chuyên Môn</th>
                  <th style={{ padding: '12px 10px' }}>Ma Trận Quyền Hạn Được Cấp</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      Không tìm thấy tài khoản nào phù hợp với bộ lọc tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const roleDisp = getRoleDisplay(u.role);
                    const activeCount = countActivePermissions(u.permissions);
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13.5px' }}>
                            {u.fullName || 'Chưa cập nhật tên'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Mail size={12} /> {u.email}
                          </div>
                        </td>

                        <td style={{ padding: '10px' }}>
                          <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: roleDisp.bg, color: roleDisp.color, border: `1px solid ${roleDisp.color}33` }}>
                            {roleDisp.label}
                          </span>
                        </td>

                        <td style={{ padding: '10px' }}>
                          {u.role === 'admin' ? (
                            <span style={{ fontWeight: 'bold', color: '#be123c', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12.5px' }}>
                              🔥 Toàn quyền hệ thống (18/18 quyền)
                            </span>
                          ) : (
                            <div>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  backgroundColor: activeCount > 0 ? '#dcfce7' : '#fee2e2',
                                  color: activeCount > 0 ? '#15803d' : '#b91c1c'
                                }}>
                                  Đã cấp {activeCount} / 18 quyền
                                </span>
                              </div>

                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '480px' }}>
                                {ALL_PERMISSION_KEYS.filter(k => u.permissions?.[k]).map(k => (
                                  <span key={k} style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: '600', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                                    ✓ {k.replace('canView', '').replace('canManage', '')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button 
                              type="button" 
                              onClick={() => handleOpenEditModal(u)} 
                              style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #0284c7', background: '#e0f2fe', color: '#0284c7', cursor: 'pointer', fontSize: '12.5px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Settings size={14} /> Sửa Quyền
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDeleteUser(u.id, u.email)} 
                              title="Xóa tài khoản này khỏi hệ thống"
                              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
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
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL DIALOG: CHỈNH SỬA VAI TRÒ & MA TRẬN PHÂN QUYỀN                   */}
      {/* ========================================================================= */}
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
              <button type="button" onClick={() => setEditingUser(null)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePermissions} style={{ padding: '20px' }}>
              
              {/* Họ tên cán bộ */}
              <div style={{ marginBottom: '14px' }}>
                <label style={styles.label}>Họ và Tên Cán Bộ / Giáo Viên:</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  style={styles.input}
                  placeholder="VD: Cô Lương Thị Hải Vân, Thầy Nguyễn Văn A..."
                />
              </div>

              {/* Vai trò */}
              <div style={{ marginBottom: '16px' }}>
                <label style={styles.label}>1. Vai Trò / Tổ Chuyên Môn / Đoàn Thể (*):</label>
                <select 
                  value={editRoleSelect} 
                  onChange={e => handleEditRoleChange(e.target.value)} 
                  style={{ ...styles.input, fontWeight: 'bold' }}
                >
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
                      placeholder="VD: Ban Thanh tra nhân dân, CLB Truyền thông, Tổ Tự nhiên..." 
                    />
                  </div>
                )}
              </div>

              {/* Ma trận phân quyền */}
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <label style={{ ...styles.label, color: '#be123c', fontSize: '14px', margin: 0 }}>
                      2. Ma Trận Phân Quyền Chi Tiết (18 Danh Mục Chức Năng):
                    </label>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Đã chọn: <strong style={{ color: '#be123c' }}>{countActivePermissions(editPermissions)}/18</strong> quyền
                    </span>
                  </div>

                  {/* Nút thao tác nhanh */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleSetAllPermissions('edit', true)}
                      style={{ padding: '4px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #16a34a', background: '#dcfce7', color: '#16a34a', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ✓ Chọn Tất Cả
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAllPermissions('edit', false)}
                      style={{ padding: '4px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ✕ Bỏ Chọn Hết
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPermissions(getRoleDefaultPermissions(editRoleSelect))}
                      style={{ padding: '4px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #0284c7', background: '#e0f2fe', color: '#0284c7', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      🔄 Theo Vai Trò
                    </button>
                  </div>
                </div>

                {editRoleSelect === 'admin' ? (
                  <div style={{ padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#be123c', fontSize: '13px', fontWeight: 'bold', lineHeight: '1.5' }}>
                    🔥 Tài khoản có Vai trò <strong>Quản trị viên (Admin)</strong> được phân bổ mặc định toàn quyền truy cập tất cả chức năng trong hệ thống!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {PERMISSION_GROUPS.map(group => {
                      const groupActiveCount = group.permissions.filter(p => editPermissions[p.key]).length;
                      return (
                        <div key={group.id} style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: group.badgeColor, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{group.icon}</span> {group.name}
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: group.badgeBg, color: group.badgeColor, padding: '2px 8px', borderRadius: '10px' }}>
                              {groupActiveCount} / {group.permissions.length} đang bật
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '8px' }}>
                            {group.permissions.map(p => {
                              const isChecked = !!editPermissions[p.key];
                              return (
                                <label 
                                  key={p.key} 
                                  style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px',
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    border: isChecked ? `1.5px solid ${group.badgeColor}` : '1px solid #e2e8f0',
                                    backgroundColor: isChecked ? group.badgeBg : '#f8fafc',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked} 
                                    onChange={() => setEditPermissions(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                                    style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer' }}
                                  />
                                  <div>
                                    <div style={{ fontSize: '12.5px', fontWeight: isChecked ? '800' : '600', color: isChecked ? '#0f172a' : '#475569' }}>
                                      {p.label}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.3', marginTop: '1px' }}>
                                      {p.desc}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setEditingUser(null)} style={{ padding: '9px 18px', background: '#cbd5e1', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px' }}>
                  Hủy Bỏ
                </button>
                <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '9px 24px', backgroundColor: '#be123c', fontSize: '13px' }}>
                  <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu Ma Trận Phân Quyền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL DIALOG: TẠO TÀI KHOẢN MỚI KÈM MA TRẬN PHÂN QUYỀN                  */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, color: '#be123c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={22} color="#be123c" /> Tạo Tài Khoản Mới & Phân Quyền Chức Năng
                </h3>
                <p style={{ margin: '3px 0 0 0', color: '#64748b', fontSize: '12.5px' }}>
                  Hệ thống tự động liên kết tài khoản Auth và lưu phân quyền tương ứng vào CSDL
                </p>
              </div>
              <button type="button" onClick={() => setShowCreateModal(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ padding: '20px' }}>
              
              {/* Thông tin cơ bản */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={styles.label}>Họ và Tên Cán Bộ / Giáo Viên (*):</label>
                  <input 
                    type="text" 
                    required 
                    value={createFullName} 
                    onChange={e => setCreateFullName(e.target.value)} 
                    style={styles.input} 
                    placeholder="VD: Cô Lương Thị Hải Vân..." 
                  />
                </div>
                <div>
                  <label style={styles.label}>Số Điện Thoại Liên Hệ (tùy chọn):</label>
                  <input 
                    type="text" 
                    value={createPhone} 
                    onChange={e => setCreatePhone(e.target.value)} 
                    style={styles.input} 
                    placeholder="VD: 0984.xxx.xxx" 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={styles.label}>Email Đăng Nhập (*):</label>
                  <input 
                    type="email" 
                    required 
                    value={createEmail} 
                    onChange={e => setCreateEmail(e.target.value)} 
                    style={styles.input} 
                    placeholder="VD: haivan.cbq@caobaquat.edu.vn" 
                  />
                </div>
                <div>
                  <label style={styles.label}>Mật Khẩu Ban Đầu:</label>
                  <input 
                    type="text" 
                    value={createPassword} 
                    onChange={e => setCreatePassword(e.target.value)} 
                    style={styles.input} 
                    placeholder="Để trống hệ thống sẽ tự sinh ngẫu nhiên" 
                  />
                </div>
              </div>

              {/* Vai trò */}
              <div style={{ marginBottom: '16px' }}>
                <label style={styles.label}>1. Chọn Vai Trò / Tổ Chuyên Môn / Đoàn Thể (*):</label>
                <select 
                  value={createRoleSelect} 
                  onChange={e => handleCreateRoleChange(e.target.value)} 
                  style={{ ...styles.input, fontWeight: 'bold' }}
                >
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
                      placeholder="VD: Ban Thanh tra nhân dân, CLB Truyền thông..." 
                    />
                  </div>
                )}
              </div>

              {/* Ma trận phân quyền chi tiết */}
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <label style={{ ...styles.label, color: '#be123c', fontSize: '14px', margin: 0 }}>
                      2. Ma Trận Phân Quyền Chi Tiết (18 Danh Mục Chức Năng):
                    </label>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Đã chọn: <strong style={{ color: '#be123c' }}>{countActivePermissions(createPermissions)}/18</strong> quyền
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleSetAllPermissions('create', true)}
                      style={{ padding: '4px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #16a34a', background: '#dcfce7', color: '#16a34a', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ✓ Chọn Tất Cả
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAllPermissions('create', false)}
                      style={{ padding: '4px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ✕ Bỏ Chọn Hết
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreatePermissions(getRoleDefaultPermissions(createRoleSelect))}
                      style={{ padding: '4px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #0284c7', background: '#e0f2fe', color: '#0284c7', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      🔄 Theo Vai Trò
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {PERMISSION_GROUPS.map(group => {
                    const groupActiveCount = group.permissions.filter(p => createPermissions[p.key]).length;
                    return (
                      <div key={group.id} style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: group.badgeColor, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{group.icon}</span> {group.name}
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: group.badgeBg, color: group.badgeColor, padding: '2px 8px', borderRadius: '10px' }}>
                            {groupActiveCount} / {group.permissions.length} đang bật
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '8px' }}>
                          {group.permissions.map(p => {
                            const isChecked = !!createPermissions[p.key];
                            return (
                              <label 
                                key={p.key} 
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '8px',
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  border: isChecked ? `1.5px solid ${group.badgeColor}` : '1px solid #e2e8f0',
                                  backgroundColor: isChecked ? group.badgeBg : '#f8fafc',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isChecked} 
                                  onChange={() => setCreatePermissions(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                                  style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer' }}
                                />
                                <div>
                                  <div style={{ fontSize: '12.5px', fontWeight: isChecked ? '800' : '600', color: isChecked ? '#0f172a' : '#475569' }}>
                                    {p.label}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.3', marginTop: '1px' }}>
                                    {p.desc}
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '9px 18px', background: '#cbd5e1', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px' }}>
                  Hủy Bỏ
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '9px 24px', backgroundColor: '#be123c', fontSize: '13px' }}>
                  <Save size={16} /> Tạo Tài Khoản & Cấp Quyền
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
  input: { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' },
  modalContent: { backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  modalHeader: { padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', borderRadius: '50%' }
};
