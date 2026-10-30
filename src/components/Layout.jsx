import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Home, Users, CheckSquare, FileText, Globe, Gift, Settings, Image, LayoutDashboard, Menu, Bell, Calendar, Link2, Activity, Trophy, BookOpen, Bike, Bus, QrCode, FolderOpen, Flame, Heart, Award, FileSpreadsheet, FileCheck, Video, Mail, ChevronDown, Search, X, Minimize2, Maximize2, ExternalLink, Utensils } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { differenceInDays } from 'date-fns';
import MobileBottomNav from './MobileBottomNav';
import ErrorBoundary from './ErrorBoundary';

// Top-level NavItem to prevent re-creation on every render in React 19
const NavItem = ({ to, icon: Icon, label, active, onClick }) => {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px 8px 22px',
        color: active ? '#38bdf8' : '#cbd5e1',
        textDecoration: 'none',
        fontSize: '13px',
        fontWeight: active ? '600' : '400',
        backgroundColor: active ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
        borderLeft: active ? '3.5px solid #38bdf8' : '3.5px solid transparent',
        borderRadius: '0 8px 8px 0',
        margin: '2px 8px 2px 0',
        transition: 'all 0.15s ease'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.color = '#ffffff';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#cbd5e1';
        }
      }}
    >
      {Icon && <Icon size={16} style={{ color: active ? '#38bdf8' : '#94a3b8', flexShrink: 0 }} />} 
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
    </Link>
  );
};

export default function Layout({ children, title }) {
  const { user, role, permissions = {}, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const targetDate = new Date('2026-09-03');
  const daysLeft = differenceInDays(targetDate, new Date());

  const handleNotificationClick = (notif) => {
    setShowNotifications(false);
    if (notif.task_id) {
      navigate(`/admin/committee?taskId=${notif.task_id}`);
    } else if (notif.title && (notif.title.includes('Tâm tư') || notif.title.includes('Hòm thư'))) {
      navigate('/admin/hom-thu-hoc-sinh');
    }
  };

  useEffect(() => {
    const fetchNotifs = async () => {
      const { data } = await supabase.from('cbq_notifications').select('*').order('created_at', { ascending: false }).limit(5);
      if(data) setNotifications(data);
    }
    fetchNotifs();
    
    const channel = supabase.channel('public:cbq_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cbq_notifications' }, payload => {
        setNotifications(prev => [payload.new, ...prev].slice(0, 5));
      })
      .subscribe();
      
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  };

  const isAdmin = role === 'admin';

  const menuItems = [
    // 1. 📚 QUẢN LÝ TỔ CHUYÊN MÔN & SỔ SÁCH GIẢNG DẠY
    { path: '/admin', icon: Home, label: '📊 Tổng Quan Điều Hành Sổ Sách', group: '📚 QUẢN LÝ TỔ CHUYÊN MÔN & GIẢNG DẠY', show: isAdmin || role === 'secretary' },
    { path: '/can-chinh-nghi-dinh-30', icon: FileCheck, label: '📄 Căn Chỉnh Văn Bản Chuẩn NĐ 30', group: '📚 QUẢN LÝ TỔ CHUYÊN MÔN & GIẢNG DẠY', show: true },
    { path: '/kiem-tra-ho-so-tn', icon: FileSpreadsheet, label: '🎓 Kiểm Tra Hồ Sơ Thi TN THPT', group: '📚 QUẢN LÝ TỔ CHUYÊN MÔN & GIẢNG DẠY', show: true },
    { path: '/admin/department-drives', icon: FolderOpen, label: '📁 Sổ Kế Hoạch & Hồ Sơ Tổ Chuyên Môn', group: '📚 QUẢN LÝ TỔ CHUYÊN MÔN & GIẢNG DẠY', show: isAdmin || role === 'secretary' || !!permissions.canManageDepartments },
    { path: '/admin/schedule', icon: Calendar, label: '📅 Lịch Công Tác & Thời Khóa Biểu', group: '📚 QUẢN LÝ TỔ CHUYÊN MÔN & GIẢNG DẠY', show: isAdmin || !!permissions.canViewDocs },
    { path: '/admin/staff', icon: Users, label: '👨‍🏫 Đội Ngũ Cán Bộ & Phân Công Dạy', group: '📚 QUẢN LÝ TỔ CHUYÊN MÔN & GIẢNG DẠY', show: isAdmin || !!permissions.canViewDocs },
    { path: '/admin/diem-danh-hop-online', icon: Video, label: '💻 Điểm Danh Họp Trực Tuyến & Sĩ Số', group: '📚 QUẢN LÝ TỔ CHUYÊN MÔN & GIẢNG DẠY', show: isAdmin || role === 'secretary' || !!permissions.canViewDocs },
    { path: '/admin/eduhub', icon: Video, label: '📺 Quản Trị Video & Học Liệu Số', group: '📚 QUẢN LÝ TỔ CHUYÊN MÔN & GIẢNG DẠY', show: isAdmin || role === 'secretary' || !!permissions.canViewEduHub },
    { path: '/admin/app-hub', icon: LayoutDashboard, label: '🎯 Cổng Tiện Ích Sổ Sách (Hub)', group: '📚 QUẢN LÝ TỔ CHUYÊN MÔN & GIẢNG DẠY', show: true },

    // 2. 📋 QUẢN LÝ DỊCH VỤ & ĐĂNG KÝ TRỰC TUYẾN
    { path: '/admin/cantin', icon: Utensils, label: '🍳 Điều Phối Điểm Tâm & Suất Ăn Sáng', group: '📋 QUẢN LÝ DỊCH VỤ & ĐĂNG KÝ TRỰC TUYẾN', show: isAdmin || role === 'secretary' || role === 'canteen_staff' || !!permissions.canManageCanteen },
    { path: '/bep-sang', icon: Utensils, label: '🍱 Đăng Ký Điểm Tâm Sáng (Tiếp Sức Học Đường)', group: '📋 QUẢN LÝ DỊCH VỤ & ĐĂNG KÝ TRỰC TUYẾN', show: true },
    { path: '/admin/registrations', icon: FileText, label: '📋 Quản Lý Đợt Đăng Ký Động', group: '📋 QUẢN LÝ DỊCH VỤ & ĐĂNG KÝ TRỰC TUYẾN', show: isAdmin || role === 'secretary' || !!permissions.canViewRegistrations },
    { path: '/admin/quizzes', icon: CheckSquare, label: '📝 Quản Lý Cuộc Thi & Quiz Online', group: '📋 QUẢN LÝ DỊCH VỤ & ĐĂNG KÝ TRỰC TUYẾN', show: isAdmin || !!permissions.canViewQuizzes },
    { path: '/admin/voting', icon: Heart, label: '❤️ Quản Lý Bầu Chọn & Tác Phẩm', group: '📋 QUẢN LÝ DỊCH VỤ & ĐĂNG KÝ TRỰC TUYẾN', show: isAdmin || !!permissions.canViewQuizzes },
    { path: '/admin/the-thao', icon: Activity, label: '⚽ Quản Lý Đăng Ký Thể Thao', group: '📋 QUẢN LÝ DỊCH VỤ & ĐĂNG KÝ TRỰC TUYẾN', show: isAdmin || !!permissions.canViewSports },
    { path: '/admin/parking', icon: Bike, label: '🛵 Quản Lý Đăng Ký Xe Máy', group: '📋 QUẢN LÝ DỊCH VỤ & ĐĂNG KÝ TRỰC TUYẾN', show: isAdmin || !!permissions.canViewParking || !!permissions.canViewStudents },
    { path: '/admin/bus', icon: Bus, label: '🚌 Quản Lý Đăng Ký Xe Đưa Đón', group: '📋 QUẢN LÝ DỊCH VỤ & ĐĂNG KÝ TRỰC TUYẾN', show: isAdmin || !!permissions.canViewParking || !!permissions.canViewStudents },
    { path: '/admin/gop-y', icon: FileText, label: '✍️ Tiếp Nhận Phản Hồi & Góp Ý', group: '📋 QUẢN LÝ DỊCH VỤ & ĐĂNG KÝ TRỰC TUYẾN', show: isAdmin || !!permissions.canViewFeedback },

    // 3. 👨‍🎓 QUẢN LÝ HỌC SINH & SỔ SÁCH NỀ NẾP
    { path: '/admin/hom-thu-hoc-sinh', icon: Mail, label: '💌 Hòm Thư Tâm Tư & Nguyện Vọng HS', group: '👨‍🎓 QUẢN LÝ HỌC SINH & NỀ NẾP', show: isAdmin || role === 'secretary' || !!permissions.canViewFeedback || !!permissions.canViewStudents },
    { path: '/admin/emulation', icon: Trophy, label: '📋 Sổ Chấm Điểm Thi Đua & Nề Nếp Lớp', group: '👨‍🎓 QUẢN LÝ HỌC SINH & NỀ NẾP', show: isAdmin || !!permissions.canViewEmulation },
    { path: '/admin/students', icon: Users, label: '👨‍🎓 Sổ Học Sinh & Chuyển Lớp', group: '👨‍🎓 QUẢN LÝ HỌC SINH & NỀ NẾP', show: isAdmin || !!permissions.canViewStudents },
    { path: '/admin/digital-vault', icon: FileText, label: '📜 Kho Văn Bằng Số & Hồ Sơ HS', group: '👨‍🎓 QUẢN LÝ HỌC SINH & NỀ NẾP', show: isAdmin || role === 'secretary' || !!permissions.canViewDigitalVault },
    { path: '/admin/qr-scanner', icon: QrCode, label: '📱 Quét Mã QR Check-in / Điểm Danh', group: '👨‍🎓 QUẢN LÝ HỌC SINH & NỀ NẾP', show: isAdmin || !!permissions.canViewStudents || !!permissions.canViewEmulation },

    // 4. 📄 VĂN BẢN, TRUYỀN THÔNG & TƯ LIỆU TRUYỀN THỐNG
    { path: '/admin/docs', icon: FileText, label: '📄 Sổ Văn Bản - Thông Báo Nội Bộ', group: '📄 VĂN BẢN & TƯ LIỆU TRUYỀN THỐNG', show: isAdmin || !!permissions.canViewDocs },
    { path: '/admin/news', icon: Image, label: '📰 Tin tức - Sự kiện Nhà trường', group: '📄 VĂN BẢN & TƯ LIỆU TRUYỀN THỐNG', show: isAdmin || !!permissions.canViewNews },
    { path: '/admin/gallery', icon: Image, label: '🖼️ Thư viện ảnh Hoạt động', group: '📄 VĂN BẢN & TƯ LIỆU TRUYỀN THỐNG', show: isAdmin || !!permissions.canViewNews },
    { path: '/admin/luu-but', icon: BookOpen, label: '📓 Quản lý Sổ Lưu bút', group: '📄 VĂN BẢN & TƯ LIỆU TRUYỀN THỐNG', show: isAdmin || !!permissions.canViewGuestbook },
    { path: '/admin/tap-san', icon: BookOpen, label: '📖 Quản lý Tập San 30 Năm', group: '📄 VĂN BẢN & TƯ LIỆU TRUYỀN THỐNG', show: isAdmin || !!permissions.canViewMagazine },
    { path: '/admin/sponsors', icon: Award, label: '🏆 Quản lý Tài trợ & Bảng Vàng', group: '📄 VĂN BẢN & TƯ LIỆU TRUYỀN THỐNG', show: isAdmin || !!permissions.canViewSponsors },
    { path: '/admin/guests', icon: Users, label: '✉️ Quản lý Khách mời & Lễ tân', group: '📄 VĂN BẢN & TƯ LIỆU TRUYỀN THỐNG', show: isAdmin || !!permissions.canViewGuests },
    { path: '/admin/committee', icon: CheckSquare, label: '🏆 Kho Tư Liệu Kỷ Niệm 30 Năm', group: '📄 VĂN BẢN & TƯ LIỆU TRUYỀN THỐNG', show: true },

    // 5. ⚙️ QUẢN TRỊ HỆ THỐNG
    { path: '/admin/users', icon: Settings, label: '⚙️ Phân quyền Tài khoản Cán bộ', group: '⚙️ QUẢN TRỊ HỆ THỐNG', show: isAdmin },
    { path: '/admin/menu-config', icon: Globe, label: '🌐 Cấu Hình Menu Hiển Thị', group: '⚙️ QUẢN TRỊ HỆ THỐNG', show: isAdmin },
    { path: '/admin/links', icon: Link2, label: '🔗 Quản Lý Liên Kết Trang Web', group: '⚙️ QUẢN TRỊ HỆ THỐNG', show: isAdmin || !!permissions.canViewLinks },
    { path: '/admin/audit', icon: Activity, label: '📋 Nhật ký Hoạt động Hệ thống', group: '⚙️ QUẢN TRỊ HỆ THỐNG', show: isAdmin },
  ];

  const visibleMenuItems = useMemo(() => menuItems.filter(item => item.show), [isAdmin, role, permissions]);

  // Accordion State: Mặc định THU GỌN toàn bộ khi load trang, chỉ tự động mở nhóm chứa trang active
  const [openGroups, setOpenGroups] = useState(() => {
    try {
      const curPath = window.location.pathname;
      const initialActive = menuItems.find(item => 
        item.path === curPath || (item.path !== '/admin' && curPath.startsWith(item.path + '/'))
      );
      if (initialActive?.group) {
        return { [initialActive.group]: true };
      }
    } catch {
      // fallback
    }
    return {};
  });

  // Tự động mở nhóm khi điều hướng trang
  useEffect(() => {
    const activeItem = visibleMenuItems.find(item => 
      item.path === location.pathname || (item.path !== '/admin' && location.pathname.startsWith(item.path + '/'))
    );
    if (activeItem?.group) {
      setOpenGroups(prev => {
        if (prev[activeItem.group] === true) return prev;
        return { ...prev, [activeItem.group]: true };
      });
    }
  }, [location.pathname, visibleMenuItems]);

  // Bộ lọc tìm kiếm nhanh chức năng menu
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMenuItems = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return visibleMenuItems;
    const term = searchTerm.toLowerCase().trim();
    return visibleMenuItems.filter(item => 
      (item.label || '').toLowerCase().includes(term) || 
      (item.group || '').toLowerCase().includes(term) || 
      (item.path || '').toLowerCase().includes(term)
    );
  }, [visibleMenuItems, searchTerm]);

  // Gom nhóm các mục menu
  const groupedItems = useMemo(() => {
    return (filteredMenuItems || []).reduce((acc, item) => {
      if (!item || !item.group) return acc;
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item);
      return acc;
    }, {});
  }, [filteredMenuItems]);

  const toggleGroup = (groupName) => {
    if (!groupName) return;
    setOpenGroups(prev => ({ ...(prev || {}), [groupName]: !prev?.[groupName] }));
  };

  const handleCollapseAll = () => {
    setOpenGroups({});
  };

  const handleExpandAll = () => {
    const all = {};
    Object.keys(groupedItems || {}).forEach(g => { all[g] = true; });
    setOpenGroups(all);
  };

  const isActive = (path) => {
    if (!path) return false;
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div style={styles.container}>
      <div className={`layout-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      
      {/* Sidebar */}
      <aside className={`layout-sidebar ${isSidebarOpen ? 'open' : ''}`} style={styles.sidebar}>
        {/* Header Thương hiệu & Trạng thái */}
        <div style={{ ...styles.logoArea, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{ position: 'relative' }}>
              <img src="/logo.jpg" alt="Logo THPT Cao Bá Quát" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(56, 189, 248, 0.4)' }} />
              <span style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '10px',
                height: '10px',
                backgroundColor: '#22c55e',
                border: '2px solid #0f172a',
                borderRadius: '50%'
              }} title="Hệ thống trực tuyến" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h2 style={{margin: 0, fontSize: '15px', color: 'white', fontWeight: 'bold', letterSpacing: '0.2px'}}>CBQ ADMIN</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                <span style={{
                  backgroundColor: isAdmin ? 'rgba(239, 68, 68, 0.2)' : 'rgba(147, 51, 234, 0.2)',
                  color: isAdmin ? '#fca5a5' : '#d8b4fe',
                  border: isAdmin ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(147, 51, 234, 0.4)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  {isAdmin ? 'Quản Trị Viên' : (role === 'secretary' ? 'Thư Ký Hội Đồng' : 'Cán Bộ Giáo Viên')}
                </span>
              </div>
            </div>
          </div>

          {/* Nút đóng sidebar trên màn hình di động */}
          <button 
            type="button"
            className="sidebar-close-btn"
            onClick={() => setIsSidebarOpen(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '8px',
              color: '#cbd5e1',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Đóng menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Thanh công cụ tìm kiếm & Thao tác nhanh */}
        <div style={{
          padding: '10px 12px 8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* Ô tìm kiếm nhanh */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            padding: '5px 8px'
          }}>
            <Search size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
            <input 
              type="text"
              placeholder="Tìm tính năng nhanh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f8fafc',
                fontSize: '12px',
                width: '100%'
              }}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                title="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Nút Thu gọn / Mở hết */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8', padding: '0 2px' }}>
            <span>{searchTerm ? `Tìm thấy: ${filteredMenuItems.length}` : 'Danh mục quản trị:'}</span>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button
                onClick={handleCollapseAll}
                title="Thu gọn tất cả nhóm menu"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <Minimize2 size={11} /> Thu gọn
              </button>
              <button
                onClick={handleExpandAll}
                title="Mở rộng tất cả nhóm menu"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <Maximize2 size={11} /> Mở hết
              </button>
            </div>
          </div>
        </div>

        {/* Danh sách nhóm menu dạng Accordion */}
        <div style={styles.navContainer}>
          {Object.keys(groupedItems).length === 0 ? (
            <div style={{ padding: '24px 15px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
              Không tìm thấy tính năng &quot;{searchTerm}&quot;
            </div>
          ) : (
            Object.entries(groupedItems).map(([group, items]) => {
              const isOpen = searchTerm.trim() ? true : (openGroups[group] ?? false);
              return (
                <div key={group} style={{ marginBottom: '6px' }}>
                  <div 
                    onClick={() => toggleGroup(group)}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      backgroundColor: isOpen ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                      border: isOpen ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '6px',
                      margin: '4px 8px 3px 8px',
                      color: isOpen ? '#38bdf8' : '#cbd5e1',
                      fontWeight: '600',
                      fontSize: '11px',
                      letterSpacing: '0.2px',
                      userSelect: 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group}</span>
                      <span style={{
                        fontSize: '9.5px',
                        backgroundColor: isOpen ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                        color: isOpen ? '#38bdf8' : '#94a3b8',
                        padding: '1px 5px',
                        borderRadius: '10px',
                        fontWeight: 'bold'
                      }}>
                        {items.length}
                      </span>
                    </div>
                    <ChevronDown 
                      size={14} 
                      style={{ 
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                        transition: 'transform 0.25s ease',
                        color: isOpen ? '#38bdf8' : '#64748b',
                        flexShrink: 0
                      }} 
                    />
                  </div>
                  {isOpen && items.map(item => (
                    <NavItem 
                      key={item.path} 
                      to={item.path} 
                      icon={item.icon} 
                      label={item.label} 
                      active={isActive(item.path)} 
                      onClick={() => setIsSidebarOpen(false)} 
                    />
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* Chân Sidebar */}
        <div style={styles.sidebarBottom}>
          <Link 
            to="/" 
            style={{
              ...styles.publicLink,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <ExternalLink size={13} />
            <span>← Trở ra Cổng thông tin</span>
          </Link>
          <div style={{ textAlign: 'center', fontSize: '10px', color: '#64748b', marginTop: '8px' }}>
            CBQ Smart School • 2025-2026
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="layout-main-wrapper" style={{ ...styles.mainWrapper, minWidth: 0 }}>
        <header className="layout-header" style={styles.header}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1}}>
            <button className="hamburger-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={22} />
            </button>
            <h1 className="header-title layout-header-title" style={styles.headerTitle}>{title}</h1>
          </div>
          <div className="layout-header-right" style={styles.headerRight}>
            <Link
              to="/bep-sang"
              target="_blank"
              className="admin-header-canteen-link"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px',
                color: '#d97706',
                fontSize: '12px',
                fontWeight: '700',
                textDecoration: 'none'
              }}
              title="Mở Cổng đăng ký Điểm Tâm Sáng CBQ (Giao diện học sinh/giáo viên)"
            >
              <span>🍳 Điểm Tâm Sáng</span>
              <ExternalLink size={12} />
            </Link>

            <div style={{position: 'relative'}} ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                style={styles.notifBtn}
                title="Thông báo"
              >
                <Bell size={18} />
                {notifications.length > 0 && <span style={styles.notifBadge}>{notifications.length}</span>}
              </button>
              
              {showNotifications && (
                <div style={styles.notifDropdown}>
                  <div style={styles.notifHeader}>Thông báo mới nhất</div>
                  <div style={styles.notifList}>
                    {notifications.map(n => (
                      <div key={n.id} style={{...styles.notifItem, cursor: n.task_id ? 'pointer' : 'default'}} onClick={() => handleNotificationClick(n)}>
                        <div style={{fontSize: '0.85rem', fontWeight: 'bold'}}>{n.title}</div>
                        <div style={{fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem'}}>{n.message}</div>
                        <div style={{fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.5rem'}}>{new Date(n.created_at).toLocaleString('vi-VN')}</div>
                      </div>
                    ))}
                    {notifications.length === 0 && <div style={{padding: '1rem', textAlign: 'center', color: '#64748b'}}>Không có thông báo.</div>}
                  </div>
                </div>
              )}
            </div>

            <span className="admin-header-user-email" style={styles.userInfo}>{user?.email || 'Admin User'}</span>
            <button onClick={signOut} style={styles.logoutBtn} title="Đăng xuất">
              <LogOut size={16} />
            </button>
          </div>
        </header>
        
        <main className="main-content-area layout-main-area" style={styles.mainContent}>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f1f5f9',
  },
  sidebar: {
    width: '270px',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '4px 0 16px rgba(0,0,0,0.2)',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    zIndex: 20
  },
  logoArea: {
    padding: '14px 14px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoCircle: {
    width: '40px',
    height: '40px',
    backgroundColor: '#d32f2f',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  navContainer: {
    flex: 1,
    padding: '8px 0',
    overflowY: 'auto',
    scrollbarWidth: 'thin'
  },
  navGroup: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#64748b',
    padding: '8px 16px',
    marginTop: '6px',
    letterSpacing: '0.5px'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 16px',
    color: '#cbd5e1',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
    fontSize: '13px'
  },
  sidebarBottom: {
    padding: '12px 14px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)'
  },
  publicLink: {
    color: '#cbd5e1',
    textDecoration: 'none',
    fontSize: '12px',
    display: 'block',
    textAlign: 'center',
    padding: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    transition: 'all 0.2s'
  },
  mainWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    backgroundColor: '#ffffff',
    height: '70px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 30px',
    borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#0f172a',
    margin: 0
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  userInfo: {
    fontSize: '14px',
    color: '#475569',
    fontWeight: '500'
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    padding: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: '0.2s'
  },
  mainContent: {
    flex: 1,
    padding: '30px',
    overflowY: 'auto'
  },
  countdown: {
    display: 'none',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#fef2f2',
    padding: '0.5rem 1rem',
    borderRadius: '2rem',
    border: '1px solid #fca5a5',
    fontSize: '0.85rem'
  },
  notifBtn: {
    background: '#f1f5f9',
    border: 'none',
    padding: '8px',
    borderRadius: '50%',
    cursor: 'pointer',
    color: '#475569',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  notifBadge: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    backgroundColor: '#ef4444',
    color: 'white',
    fontSize: '0.65rem',
    fontWeight: 'bold',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  notifDropdown: {
    position: 'absolute',
    top: '120%',
    right: '0',
    width: '320px',
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    zIndex: 50,
    overflow: 'hidden'
  },
  notifHeader: {
    padding: '1rem',
    borderBottom: '1px solid #e2e8f0',
    fontWeight: 'bold',
    backgroundColor: '#f8fafc'
  },
  notifList: {
    maxHeight: '300px',
    overflowY: 'auto'
  },
  notifItem: {
    padding: '1rem',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    transition: 'background 0.2s'
  }
};

// Add to global CSS or handle inline via JS for media query equivalent
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @media (min-width: 768px) {
      .layout-header-countdown {
        display: flex !important;
      }
    }
  `;
  document.head.appendChild(style);
}
