import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Search, Mail, Phone, Award, BookOpen, ChevronRight } from 'lucide-react';

const DEFAULT_STAFF = [
  { id: '1', name: 'Lê Thị Thảo', title: 'Hiệu trưởng', department: 'Ban Giám Hiệu', avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80', email: 'hieutruong@thptcaobaquat.edu.vn', bio: 'Thạc sĩ Quản lý Giáo dục, 25 năm cống hiến cho sự nghiệp giáo dục.' },
  { id: '2', name: 'Nguyễn Văn Nam', title: 'Phó Hiệu trưởng', department: 'Ban Giám Hiệu', avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&q=80', email: 'pht.nam@thptcaobaquat.edu.vn', bio: 'Phụ trách công tác Chuyên môn & Thi đua khen thưởng.' },
  { id: '3', name: 'Trần Thị Hoa', title: 'Tổ trưởng Tổ Toán - Tin', department: 'Tổ Toán - Tin', avatar_url: 'https://images.unsplash.com/photo-1580894732413-87b1c4c1a5b8?w=500&q=80', email: 'hoa.toan@thptcaobaquat.edu.vn', bio: 'Giáo viên Giỏi cấp Tỉnh/Thành phố nhiều năm liên tục.' },
  { id: '4', name: 'Phạm Đức Minh', title: 'Tổ trưởng Tổ Ngữ văn', department: 'Tổ Ngữ Văn', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80', email: 'minh.van@thptcaobaquat.edu.vn', bio: 'Chủ biên nhiều chuyên đề ôn thi Học sinh giỏi & ĐGNL.' },
  { id: '5', name: 'Vũ Thị Lan', title: 'Tổ trưởng Tổ Tiếng Anh', department: 'Tổ Ngoại Ngữ', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80', email: 'lan.anh@thptcaobaquat.edu.vn', bio: 'Cố vấn các hoạt động Câu lạc bộ Tiếng Anh & Hợp tác quốc tế.' }
];

const DEPARTMENTS = [
  'Tất cả Tổ chuyên môn',
  'Ban Giám Hiệu',
  'Tổ Toán - Tin',
  'Tổ Ngữ Văn',
  'Tổ Ngoại Ngữ',
  'Tổ Lý - Hóa - Sinh',
  'Tổ Sử - Địa - GDCD',
  'Tổ Thể Dục - QQP'
];

export default function PublicStaff() {
  const [staffList, setStaffList] = useState(DEFAULT_STAFF);
  const [selectedDept, setSelectedDept] = useState('Tất cả Tổ chuyên môn');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_staff')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setStaffList(data);
      }
    } catch (err) {
      console.warn("Dùng danh sách thầy cô mặc định:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredStaff = staffList.filter(s => {
    const matchDept = selectedDept === 'Tất cả Tổ chuyên môn' || s.department === selectedDept;
    const matchSearch = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || (s.title && s.title.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchDept && matchSearch;
  });

  return (
    <div style={styles.container}>
      {/* HEADER BAR */}
      <div style={styles.headerCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users size={32} color="#be123c" />
          <div>
            <h2 style={styles.pageTitle}>ĐỘI NGŨ THẦY CÔ & TỔ CHUYÊN MÔN</h2>
            <p style={styles.pageSubtitle}>Trường THPT Cao Bá Quát • Danh mục Hội đồng Sư phạm nhà trường</p>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div style={styles.searchWrapper}>
          <Search size={18} color="#64748b" />
          <input 
            type="text" 
            placeholder="Tìm kiếm Thầy Cô theo tên hoặc chức vụ..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* DEPARTMENT FILTER CHIPS */}
      <div style={styles.chipsRow}>
        {DEPARTMENTS.map(dept => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            style={{
              ...styles.chipBtn,
              backgroundColor: selectedDept === dept ? '#be123c' : '#ffffff',
              color: selectedDept === dept ? '#ffffff' : '#334155',
              borderColor: selectedDept === dept ? '#be123c' : '#cbd5e1'
            }}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* STAFF CARDS GRID */}
      <div style={styles.grid}>
        {filteredStaff.map((staff, idx) => (
          <div key={staff.id || idx} style={styles.staffCard}>
            <div style={styles.avatarBox}>
              <img 
                src={staff.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80'} 
                alt={staff.name} 
                style={styles.avatar}
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80'; }}
              />
              <span style={styles.deptBadge}>{staff.department}</span>
            </div>

            <div style={styles.cardContent}>
              <h3 style={styles.staffName}>{staff.name}</h3>
              <div style={styles.staffTitle}>{staff.title || 'Giáo viên'}</div>

              {staff.bio && (
                <p style={styles.staffBio}>{staff.bio}</p>
              )}

              {staff.email && (
                <div style={styles.contactItem}>
                  <Mail size={14} color="#0284c7" />
                  <a href={`mailto:${staff.email}`} style={styles.contactLink}>{staff.email}</a>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredStaff.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#64748b', backgroundColor: 'white', borderRadius: '12px' }}>
            Không tìm thấy thông tin Giáo viên phù hợp với từ khóa tìm kiếm.
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px 10px',
    maxWidth: '1200px',
    margin: '0 auto',
    boxSizing: 'border-box'
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  pageTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '800',
    color: '#be123c',
    letterSpacing: '0.5px'
  },
  pageSubtitle: {
    margin: '3px 0 0 0',
    fontSize: '13px',
    color: '#64748b'
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '8px 14px',
    width: '320px'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    fontSize: '13.5px'
  },
  chipsRow: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    marginBottom: '25px',
    paddingBottom: '4px'
  },
  chipBtn: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: '0.2s'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
    gap: '20px'
  },
  staffCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  avatarBox: {
    position: 'relative',
    height: '220px',
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
    bottom: '10px',
    left: '10px',
    backgroundColor: 'rgba(190, 18, 60, 0.9)',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 'bold',
    padding: '4px 10px',
    borderRadius: '12px',
    backdropFilter: 'blur(4px)'
  },
  cardContent: {
    padding: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  staffName: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1e293b'
  },
  staffTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#b45309',
    marginTop: '3px',
    marginBottom: '10px'
  },
  staffBio: {
    fontSize: '12.5px',
    color: '#64748b',
    lineHeight: '1.5',
    margin: '0 0 12px 0',
    flex: 1
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#0284c7',
    marginTop: 'auto',
    paddingTop: '8px',
    borderTop: '1px dashed #f1f5f9'
  },
  contactLink: {
    color: '#0284c7',
    textDecoration: 'none',
    fontWeight: 'bold'
  }
};
