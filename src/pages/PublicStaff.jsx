import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Search, Mail, Phone, RefreshCw, Filter } from 'lucide-react';

// Dữ liệu dự phòng khớp 100% CSDL cbq_departments và cbq_staff
const CANONICAL_DEPARTMENTS = [
  'Ban Giám Hiệu',
  'Tổ Toán',
  'Tổ Ngữ Văn',
  'Tổ Tin học - Ngoại Ngữ',
  'Tổ Vật Lý - Hóa học',
  'Tổ Sinh học',
  'Tổ Sử - Địa - GDKT&PL',
  'Tổ GDTC - QPAN',
  'Tổ Văn Phòng'
];

const DEFAULT_STAFF = [
  { id: '1', name: 'Lê Thị Thảo', title: 'Hiệu trưởng', department: 'Ban Giám Hiệu', avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80', email: 'hieutruong@thptcaobaquat.edu.vn', bio: 'Thạc sĩ Quản lý Giáo dục, 25 năm cống hiến cho sự nghiệp giáo dục.' },
  { id: '2', name: 'Nguyễn Hữu Lam', title: 'Phó Hiệu trưởng', department: 'Ban Giám Hiệu', avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&q=80', email: 'pht.lam@thptcaobaquat.edu.vn', bio: 'Phụ trách công tác Chuyên môn & Kế hoạch giáo dục.' },
  { id: '3', name: 'Phạm Thị Nguyệt Thơ', title: 'Phó Hiệu trưởng', department: 'Ban Giám Hiệu', avatar_url: 'https://images.unsplash.com/photo-1580894732413-87b1c4c1a5b8?w=500&q=80', email: 'pht.tho@thptcaobaquat.edu.vn', bio: 'Phụ trách công tác Khảo thí, Cơ sở vật chất & Công nghệ thông tin.' },
  { id: '4', name: 'Trần Thị Hoa', title: 'Tổ trưởng Tổ Toán', department: 'Tổ Toán', avatar_url: 'https://images.unsplash.com/photo-1580894732413-87b1c4c1a5b8?w=500&q=80', email: 'hoa.toan@thptcaobaquat.edu.vn', bio: 'Giáo viên Giỏi cấp Tỉnh nhiều năm liên tục.' },
  { id: '5', name: 'Phạm Đức Minh', title: 'Tổ trưởng Tổ Ngữ Văn', department: 'Tổ Ngữ Văn', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80', email: 'minh.van@thptcaobaquat.edu.vn', bio: 'Chủ biên nhiều chuyên đề ôn thi Học sinh giỏi & ĐGNL.' },
  { id: '6', name: 'Nguyễn Công Sỹ', title: 'Tổ trưởng Tổ GDTC - QPAN', department: 'Tổ GDTC - QPAN', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80', email: 'sy.gdtc@thptcaobaquat.edu.vn', bio: 'Huấn luyện viên các đội tuyển thể thao học sinh THPT Cao Bá Quát.' }
];

const DEPT_BADGE_STYLES = {
  'Ban Giám Hiệu': { bg: 'linear-gradient(135deg, #1e3a8a, #1e40af)', color: '#ffffff' },
  'Lãnh đạo trường': { bg: 'linear-gradient(135deg, #1e3a8a, #1e40af)', color: '#ffffff' },
  'Tổ Toán': { bg: 'linear-gradient(135deg, #0284c7, #0369a1)', color: '#ffffff' },
  'Tổ Ngữ Văn': { bg: 'linear-gradient(135deg, #e11d48, #be123c)', color: '#ffffff' },
  'Tổ Tin học - Ngoại Ngữ': { bg: 'linear-gradient(135deg, #059669, #047857)', color: '#ffffff' },
  'Tổ Vật Lý - Hóa học': { bg: 'linear-gradient(135deg, #d97706, #b45309)', color: '#ffffff' },
  'Tổ Sinh học': { bg: 'linear-gradient(135deg, #0891b2, #0e7490)', color: '#ffffff' },
  'Tổ Sử - Địa - GDKT&PL': { bg: 'linear-gradient(135deg, #c2410c, #9a3412)', color: '#ffffff' },
  'Tổ GDTC - QPAN': { bg: 'linear-gradient(135deg, #15803d, #166534)', color: '#ffffff' },
  'Tổ Văn Phòng': { bg: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#ffffff' }
};

export default function PublicStaff() {
  const [staffList, setStaffList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState(CANONICAL_DEPARTMENTS);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();

    // Đồng bộ Realtime từ Database Supabase khi có thay đổi ở bảng cbq_staff hoặc cbq_departments
    const channel = supabase.channel('cbq_public_staff_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbq_staff' }, () => loadAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cbq_departments' }, () => loadAllData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [deptRes, staffRes] = await Promise.all([
        supabase
          .from('cbq_departments')
          .select('*')
          .or('is_active.eq.true,is_active.is.null')
          .order('sort_order', { ascending: true }),
        supabase
          .from('cbq_staff')
          .select('*')
          .or('is_active.eq.true,is_active.is.null')
          .order('sort_order', { ascending: true })
      ]);

      const staff = staffRes.data && staffRes.data.length > 0 ? staffRes.data : DEFAULT_STAFF;
      setStaffList(staff);

      // Xây dựng danh mục các tổ chuyên môn chuẩn theo CSDL cbq_departments
      const deptNames = [];
      if (deptRes.data && deptRes.data.length > 0) {
        deptRes.data.forEach(d => {
          const rawName = (d.name || '').trim();
          if (!rawName) return;
          // Chuẩn hóa "Lãnh đạo trường" -> "Ban Giám Hiệu" để đồng nhất với cbq_staff
          const mappedName = rawName === 'Lãnh đạo trường' ? 'Ban Giám Hiệu' : rawName;
          if (!deptNames.includes(mappedName)) {
            deptNames.push(mappedName);
          }
        });
      }

      // Đảm bảo Ban Giám Hiệu luôn đứng đầu tiên
      if (!deptNames.includes('Ban Giám Hiệu')) {
        deptNames.unshift('Ban Giám Hiệu');
      } else {
        const bghIdx = deptNames.indexOf('Ban Giám Hiệu');
        if (bghIdx > 0) {
          deptNames.splice(bghIdx, 1);
          deptNames.unshift('Ban Giám Hiệu');
        }
      }

      // Bổ sung các tổ có giáo viên trong cbq_staff nhưng chưa có trong cbq_departments
      staff.forEach(s => {
        const dName = (s.department || '').trim();
        if (dName && !deptNames.includes(dName) && dName !== 'Lãnh đạo trường') {
          deptNames.push(dName);
        }
      });

      const finalDepts = deptNames.length > 0 ? deptNames : CANONICAL_DEPARTMENTS;
      setDepartmentsList(finalDepts);
    } catch (err) {
      console.warn("Lỗi nạp dữ liệu từ CSDL, dùng mặc định:", err);
      setStaffList(DEFAULT_STAFF);
      setDepartmentsList(CANONICAL_DEPARTMENTS);
    } finally {
      setLoading(false);
    }
  }

  // Thống kê số lượng giáo viên theo từng tổ chuyên môn
  const deptCounts = useMemo(() => {
    const counts = { ALL: staffList.length };
    departmentsList.forEach(dept => {
      if (dept === 'Ban Giám Hiệu' || dept === 'Lãnh đạo trường') {
        counts[dept] = staffList.filter(s => s.department === 'Ban Giám Hiệu' || s.department === 'Lãnh đạo trường').length;
      } else {
        counts[dept] = staffList.filter(s => (s.department || '').trim().toLowerCase() === dept.trim().toLowerCase()).length;
      }
    });
    return counts;
  }, [staffList, departmentsList]);

  // Bộ lọc giáo viên theo Tổ chuyên môn và Từ khóa tìm kiếm
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      let matchDept = false;
      if (selectedDept === 'ALL') {
        matchDept = true;
      } else if (selectedDept === 'Ban Giám Hiệu' || selectedDept === 'Lãnh đạo trường') {
        matchDept = s.department === 'Ban Giám Hiệu' || s.department === 'Lãnh đạo trường';
      } else {
        matchDept = (s.department || '').trim().toLowerCase() === selectedDept.trim().toLowerCase();
      }

      if (!matchDept) return false;

      if (!searchTerm.trim()) return true;

      const q = searchTerm.toLowerCase().trim();
      return (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q)) ||
        (s.bio && s.bio.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q))
      );
    });
  }, [staffList, selectedDept, searchTerm]);

  return (
    <div style={styles.container}>
      {/* HEADER BAR */}
      <div style={styles.headerCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={styles.iconCircle}>
            <Users size={28} color="#be123c" />
          </div>
          <div>
            <h2 style={styles.pageTitle}>ĐỘI NGŨ THẦY CÔ & TỔ CHUYÊN MÔN</h2>
            <p style={styles.pageSubtitle}>
              Trường THPT Cao Bá Quát • Danh mục Hội đồng Sư phạm nhà trường ({staffList.length} Cán bộ, Giáo viên & Nhân viên)
            </p>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div style={styles.searchWrapper}>
          <Search size={18} color="#64748b" />
          <input 
            type="text" 
            placeholder="Tìm kiếm Thầy Cô theo tên, tổ, chức vụ..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              style={styles.clearSearchBtn}
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* DEPARTMENT FILTER CHIPS (ĐỒNG BỘ 100% CSDL CBQ_DEPARTMENTS & CBQ_STAFF) */}
      <div style={styles.chipsRow}>
        <button
          onClick={() => setSelectedDept('ALL')}
          style={{
            ...styles.chipBtn,
            backgroundColor: selectedDept === 'ALL' ? '#be123c' : '#ffffff',
            color: selectedDept === 'ALL' ? '#ffffff' : '#334155',
            borderColor: selectedDept === 'ALL' ? '#be123c' : '#cbd5e1',
            boxShadow: selectedDept === 'ALL' ? '0 3px 10px rgba(190, 18, 60, 0.25)' : 'none'
          }}
        >
          Tất cả Tổ chuyên môn
          <span style={{ 
            marginLeft: '6px', 
            fontSize: '11.5px', 
            padding: '2px 7px',
            borderRadius: '10px',
            backgroundColor: selectedDept === 'ALL' ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
            color: selectedDept === 'ALL' ? '#ffffff' : '#64748b',
            fontWeight: 'bold'
          }}>
            {deptCounts.ALL || 0}
          </span>
        </button>

        {departmentsList.map(dept => {
          const isSelected = selectedDept === dept;
          const count = deptCounts[dept] || 0;
          return (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              style={{
                ...styles.chipBtn,
                backgroundColor: isSelected ? '#be123c' : '#ffffff',
                color: isSelected ? '#ffffff' : '#334155',
                borderColor: isSelected ? '#be123c' : '#cbd5e1',
                boxShadow: isSelected ? '0 3px 10px rgba(190, 18, 60, 0.25)' : 'none'
              }}
            >
              {dept}
              <span style={{ 
                marginLeft: '6px', 
                fontSize: '11.5px', 
                padding: '2px 7px',
                borderRadius: '10px',
                backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                color: isSelected ? '#ffffff' : '#64748b',
                fontWeight: 'bold'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* STAFF CARDS GRID */}
      {loading ? (
        <div style={styles.loadingBox}>
          <RefreshCw size={26} color="#be123c" className="animate-spin" />
          <span style={{ marginTop: '10px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
            Đang tải dữ liệu Đội ngũ Thầy Cô & Tổ chuyên môn từ CSDL...
          </span>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredStaff.map((staff, idx) => {
            const badgeStyle = DEPT_BADGE_STYLES[staff.department] || {
              bg: 'linear-gradient(135deg, #475569, #334155)',
              color: '#ffffff'
            };

            return (
              <div key={staff.id || idx} style={styles.staffCard}>
                <div style={styles.avatarBox}>
                  <img 
                    src={staff.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80'} 
                    alt={staff.name} 
                    style={styles.avatar}
                    onError={(e) => { 
                      e.target.onerror = null; 
                      e.target.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80'; 
                    }}
                  />
                  <span style={{ 
                    ...styles.deptBadge, 
                    background: badgeStyle.bg,
                    color: badgeStyle.color
                  }}>
                    {staff.department}
                  </span>
                </div>

                <div style={styles.cardContent}>
                  <h3 style={styles.staffName}>{staff.name}</h3>
                  <div style={styles.staffTitle}>{staff.title || 'Giáo viên'}</div>

                  {staff.bio && (
                    <p style={styles.staffBio}>{staff.bio}</p>
                  )}

                  <div style={styles.contactSection}>
                    {staff.email && (
                      <div style={styles.contactItem}>
                        <Mail size={14} color="#0284c7" />
                        <a href={`mailto:${staff.email}`} style={styles.contactLink}>
                          {staff.email}
                        </a>
                      </div>
                    )}
                    {staff.phone && (
                      <div style={styles.contactItem}>
                        <Phone size={14} color="#16a34a" />
                        <a href={`tel:${staff.phone}`} style={{ ...styles.contactLink, color: '#16a34a' }}>
                          {staff.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredStaff.length === 0 && (
            <div style={styles.emptyBox}>
              <Filter size={36} color="#94a3b8" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                Không tìm thấy thông tin Giáo viên phù hợp
              </div>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b', maxWidth: '420px' }}>
                Không có dữ liệu trùng khớp với bộ lọc <strong>{selectedDept === 'ALL' ? 'Tất cả' : selectedDept}</strong>
                {searchTerm ? ` và từ khóa "${searchTerm}"` : ''}.
              </p>
              <button 
                onClick={() => { setSelectedDept('ALL'); setSearchTerm(''); }}
                style={styles.resetFilterBtn}
              >
                Xem tất cả Thầy Cô ({staffList.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px 10px',
    maxWidth: '1240px',
    margin: '0 auto',
    boxSizing: 'border-box'
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '20px 24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    border: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  iconCircle: {
    width: '50px',
    height: '50px',
    borderRadius: '14px',
    backgroundColor: '#fff1f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  pageTitle: {
    margin: 0,
    fontSize: '18.5px',
    fontWeight: '800',
    color: '#be123c',
    letterSpacing: '0.4px'
  },
  pageSubtitle: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: '#64748b'
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '9px 14px',
    width: '320px',
    position: 'relative'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    fontSize: '13.5px',
    color: '#1e293b'
  },
  clearSearchBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    fontSize: '13px',
    padding: '0 4px',
    display: 'flex',
    alignItems: 'center'
  },
  chipsRow: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    marginBottom: '25px',
    paddingBottom: '8px',
    scrollbarWidth: 'thin'
  },
  chipBtn: {
    padding: '9px 16px',
    borderRadius: '24px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center'
  },
  loadingBox: {
    padding: '60px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.04)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
    gap: '22px'
  },
  staffCard: {
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    overflow: 'hidden',
    boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  avatarBox: {
    position: 'relative',
    height: '240px',
    backgroundColor: '#f1f5f9',
    overflow: 'hidden'
  },
  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  deptBadge: {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    fontSize: '11px',
    fontWeight: '800',
    padding: '5px 12px',
    borderRadius: '14px',
    boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
    letterSpacing: '0.3px'
  },
  cardContent: {
    padding: '18px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  staffName: {
    margin: 0,
    fontSize: '16.5px',
    fontWeight: '800',
    color: '#0f172a'
  },
  staffTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#b45309',
    marginTop: '4px',
    marginBottom: '10px'
  },
  staffBio: {
    fontSize: '12.5px',
    color: '#475569',
    lineHeight: '1.55',
    margin: '0 0 14px 0',
    flex: 1
  },
  contactSection: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    paddingTop: '10px',
    borderTop: '1px dashed #e2e8f0'
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    fontSize: '12px',
    color: '#0284c7'
  },
  contactLink: {
    color: '#0284c7',
    textDecoration: 'none',
    fontWeight: '600',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  emptyBox: {
    gridColumn: '1 / -1',
    padding: '50px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
  },
  resetFilterBtn: {
    marginTop: '15px',
    padding: '9px 20px',
    backgroundColor: '#be123c',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(190, 18, 60, 0.3)'
  }
};
