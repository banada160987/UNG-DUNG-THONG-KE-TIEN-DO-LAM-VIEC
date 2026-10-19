import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, Search, Filter, Lock, Unlock, CheckCircle2, 
  ExternalLink, Sparkles, QrCode, Send, Video, FileText, User, 
  GraduationCap, AlertCircle, RefreshCw 
} from 'lucide-react';
import { 
  getAllEduMaterials, 
  checkStudentMaterialAccess 
} from '../../services/eduMaterialService';
import VietQRUnlockModal from '../../components/VietQRUnlockModal';

const SUBJECT_LIST = [
  'Tất cả', 'Toán', 'Ngữ văn', 'Tiếng Anh', 'Vật lí', 'Hóa học', 'Sinh học',
  'Lịch sử', 'Địa lí', 'GDKT & PL', 'Tin học', 'Công nghệ'
];

export default function StudentMaterialsHub() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState('Tất cả');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'my_class' | 'unlocked'
  const [searchQuery, setSearchQuery] = useState('');

  // Unlock Modal State
  const [unlockTargetMaterial, setUnlockTargetMaterial] = useState(null);

  useEffect(() => {
    try {
      const currentStudentStr = localStorage.getItem('cbq_current_student');
      if (currentStudentStr) {
        setStudent(JSON.parse(currentStudentStr));
      }
    } catch (_) {}

    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const all = await getAllEduMaterials();
      setMaterials(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(item => {
    if (selectedSubject !== 'Tất cả' && item.subject !== selectedSubject) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchTeacher = (item.teacher_name || '').toLowerCase().includes(q);
      if (!matchTitle && !matchTeacher) return false;
    }

    const access = checkStudentMaterialAccess(item, student);

    if (filterType === 'my_class') {
      if (!student) return false;
      return (item.target_classes || []).includes(student.student_class);
    }

    if (filterType === 'unlocked') {
      return access.hasAccess;
    }

    return true;
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <Link to="/student-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#0284c7', textDecoration: 'none', fontWeight: 'bold' }}>
          <ArrowLeft size={18} /> Quay lại Không Gian Học Sinh
        </Link>

        {student ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', background: '#dbeafe', color: '#1e40af', padding: '5px 14px', borderRadius: '20px', fontWeight: 'bold' }}>
              🎓 {student.full_name} ({student.student_class})
            </span>
          </div>
        ) : (
          <Link
            to="/dang-nhap-hoc-sinh"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0284c7', color: 'white', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none' }}
          >
            <Lock size={14} /> Đăng nhập để nhận học liệu lớp em
          </Link>
        )}
      </div>

      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #0284c7 100%)', borderRadius: '24px', padding: '32px 28px', color: 'white', marginBottom: '28px', boxShadow: '0 10px 25px rgba(30, 58, 138, 0.25)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
          <Sparkles size={14} color="#fde047" /> KHO HỌC LIỆU SỐ THPT CAO BÁ QUÁT
        </div>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BookOpen size={36} color="#38bdf8" /> Góc Học Liệu Số & Bài Giảng Trực Tuyến
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '14.5px', maxWidth: '750px', lineHeight: 1.5, color: '#e2e8f0' }}>
          Tài liệu bổ trợ, chuyên đề nâng cao và video bài giảng do chính Thầy/Cô trường THPT Cao Bá Quát biên soạn. Tự động mở khóa tài liệu môn học theo thời khóa biểu của lớp em!
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: 'white', borderRadius: '18px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginBottom: '28px' }}>
        
        {/* Subject filter pill buttons */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '16px' }}>
          {SUBJECT_LIST.map(sub => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              style={{
                padding: '7px 16px',
                borderRadius: '20px',
                border: selectedSubject === sub ? 'none' : '1px solid #cbd5e1',
                background: selectedSubject === sub ? '#0284c7' : 'white',
                color: selectedSubject === sub ? 'white' : '#475569',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {sub}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Tìm theo tên chuyên đề hoặc tên Thầy/Cô..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
            />
          </div>

          {/* Type filters */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFilterType('all')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: filterType === 'all' ? '#1e3a8a' : '#f1f5f9',
                color: filterType === 'all' ? 'white' : '#475569',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Tất cả
            </button>

            {student && (
              <button
                onClick={() => setFilterType('my_class')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: filterType === 'my_class' ? '#16a34a' : '#f1f5f9',
                  color: filterType === 'my_class' ? 'white' : '#475569',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Môn Lớp {student.student_class} (Đã Mở)
              </button>
            )}

            <button
              onClick={() => setFilterType('unlocked')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: filterType === 'unlocked' ? '#0284c7' : '#f1f5f9',
                color: filterType === 'unlocked' ? 'white' : '#475569',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Tài Liệu Của Tôi
            </button>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>Đang tải kho học liệu số...</div>
      ) : filteredMaterials.length === 0 ? (
        <div style={{ textAlign: 'center', background: 'white', padding: '50px 20px', borderRadius: '18px', border: '1px dashed #cbd5e1' }}>
          <AlertCircle size={44} color="#f59e0b" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#334155' }}>Không tìm thấy học liệu phù hợp</h3>
          <p style={{ color: '#64748b', fontSize: '13.5px', margin: 0 }}>Em hãy thử chọn môn học khác hoặc xóa từ khóa tìm kiếm.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
          {filteredMaterials.map(mat => {
            const access = checkStudentMaterialAccess(mat, student);
            const isTargetClass = student && (mat.target_classes || []).includes(student.student_class);

            return (
              <div 
                key={mat.id} 
                style={{
                  background: 'white', 
                  borderRadius: '18px', 
                  border: access.hasAccess ? '1px solid #bbf7d0' : '1px solid #e2e8f0', 
                  overflow: 'hidden', 
                  boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                {/* Header card */}
                <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', background: access.hasAccess ? '#f0fdf4' : '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ display: 'inline-block', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>
                      Môn {mat.subject} • {mat.grade}
                    </span>

                    {access.hasAccess ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>
                        <CheckCircle2 size={13} /> {isTargetClass ? 'Lớp em được học' : 'Đã mở khóa'}
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>
                        <Lock size={13} /> Lớp ngoài {mat.is_monetized ? `(${(mat.price || 0).toLocaleString('vi-VN')} đ)` : '(Cần xin phép)'}
                      </span>
                    )}
                  </div>

                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16.5px', color: '#0f172a', lineHeight: 1.4, fontWeight: '800' }}>
                    {mat.title}
                  </h3>

                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    Giảng viên: <strong style={{ color: '#0284c7' }}>{mat.teacher_name}</strong>
                  </div>
                </div>

                {/* Body card */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {mat.description && (
                      <p style={{ margin: '0 0 14px 0', color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>
                        {mat.description}
                      </p>
                    )}

                    <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>
                        <strong>Dạy chính khóa cho:</strong>{' '}
                        {(mat.target_classes || []).map(c => (
                          <span key={c} style={{ display: 'inline-block', background: '#e2e8f0', color: '#1e293b', padding: '2px 6px', borderRadius: '4px', marginRight: '4px', fontWeight: 'bold', fontSize: '11px' }}>
                            {c}
                          </span>
                        ))}
                      </div>
                      <div>
                        <strong>Định dạng:</strong> {mat.material_type === 'video' ? '📺 Video bài giảng' : '📄 Tệp tài liệu'} ({mat.file_size || 'Chuẩn'})
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ marginTop: '16px' }}>
                    {access.hasAccess ? (
                      <a
                        href={mat.content_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '11px',
                          background: 'linear-gradient(135deg, #16a34a, #15803d)',
                          color: 'white',
                          borderRadius: '10px',
                          fontWeight: 'bold',
                          fontSize: '13.5px',
                          textDecoration: 'none',
                          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                        }}
                      >
                        <ExternalLink size={15} /> VÀO HỌC NGAY / MỞ TÀI LIỆU
                      </a>
                    ) : (
                      <button
                        onClick={() => setUnlockTargetMaterial(mat)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '11px',
                          background: mat.is_monetized ? 'linear-gradient(135deg, #0284c7, #1e3a8a)' : '#f1f5f9',
                          color: mat.is_monetized ? 'white' : '#1e293b',
                          border: mat.is_monetized ? 'none' : '1px solid #cbd5e1',
                          borderRadius: '10px',
                          fontWeight: 'bold',
                          fontSize: '13.5px',
                          cursor: 'pointer',
                          boxShadow: mat.is_monetized ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none'
                        }}
                      >
                        <Lock size={15} /> {mat.is_monetized ? `Mở Khóa Qua VietQR (${(mat.price || 0).toLocaleString('vi-VN')} đ)` : 'Xin Thầy/Cô Cấp Quyền'}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* VietQR & Access Request Modal */}
      {unlockTargetMaterial && (
        <VietQRUnlockModal
          isOpen={Boolean(unlockTargetMaterial)}
          onClose={() => setUnlockTargetMaterial(null)}
          material={unlockTargetMaterial}
          student={student}
          onSuccess={() => {
            loadMaterials();
            setUnlockTargetMaterial(null);
          }}
        />
      )}

    </div>
  );
}
