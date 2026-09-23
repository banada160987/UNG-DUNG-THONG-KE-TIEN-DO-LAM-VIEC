import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase, supabase2, DualSupabaseService, fetchStudentsByClass, searchStudentsByName } from '../lib/supabase';
import { FileText, CheckCircle2, User, Search, Navigation, Lock, Clock, AlertTriangle, ShieldCheck, ShieldAlert, Users, QrCode, ExternalLink, Calendar, MapPin, Award, X } from 'lucide-react';
import { CLUB_SUB_DISCIPLINES, getSubDisciplinesForClub } from '../data/clubSubDisciplines';

export default function PublicRegistrations() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  
  // Verification States
  const [studentRoster, setStudentRoster] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Prerequisite Club Verification States
  const [checkingClubEligibility, setCheckingClubEligibility] = useState(false);
  const [clubEligibility, setClubEligibility] = useState(null); 
  // { eligible: boolean, requiredClub: string, registeredClubs: string[] }

  // QR Modal State
  const [qrModalItem, setQrModalItem] = useState(null);

  // Class Autocomplete States
  const [classSuggestions, setClassSuggestions] = useState([]);
  const [showClassSuggestions, setShowClassSuggestions] = useState(false);

  // Form Submission States
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const dropdownRef = useRef(null);
  const classDropdownRef = useRef(null);

  useEffect(() => {
    fetchActiveCampaigns();
    fetchStudentRoster();

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target)) {
        setShowClassSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchActiveCampaigns() {
    try {
      const res = await DualSupabaseService.selectSmart(
        'cbq_registration_campaigns',
        (q) => q.order('created_at', { ascending: false }),
        'id'
      );
      setCampaigns(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  const getClosedNotice = (cam) => {
    if (!cam) return '';
    if (cam.closed_notice) return cam.closed_notice;
    if (cam.form_schema && !Array.isArray(cam.form_schema) && cam.form_schema.closed_notice) {
      return cam.form_schema.closed_notice;
    }
    return '';
  };

  const getPrerequisiteClub = (cam) => {
    if (!cam) return null;
    if (cam.prerequisite_club) return cam.prerequisite_club;
    if (cam.form_schema && !Array.isArray(cam.form_schema) && cam.form_schema.prerequisite_club) {
      return cam.form_schema.prerequisite_club;
    }
    // Fallback nhận diện theo tiêu đề
    const title = (cam.title || '').toLowerCase();
    if (title.includes('thể dục') || title.includes('thể thao') || title.includes('tdtt')) {
      if (title.includes('môn phụ') || title.includes('phân môn') || title.includes('bộ môn')) {
        return '2) Câu lạc bộ Thể duc - Thể thao';
      }
    }
    return null;
  };

  const getCampaignStatus = (cam) => {
    if (!cam) return { code: 'open', label: '🟢 Đang mở', isLocked: false, message: '' };
    const now = new Date();
    
    if (cam.is_active === false) {
      return { 
        code: 'locked', 
        label: '🔴 Đã khóa', 
        isLocked: true, 
        message: getClosedNotice(cam) || 'Đợt đăng ký này hiện đã bị khóa bởi Quản trị viên.' 
      };
    }
    if (cam.start_date && now < new Date(cam.start_date)) {
      const timeStr = new Date(cam.start_date).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
      return { 
        code: 'not_started', 
        label: '🟡 Chờ mở đăng ký', 
        isLocked: true, 
        message: `Đợt đăng ký sẽ mở vào lúc ${timeStr}. Vui lòng quay lại sau.` 
      };
    }
    if (cam.end_date && now > new Date(cam.end_date)) {
      const timeStr = new Date(cam.end_date).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
      return { 
        code: 'expired', 
        label: '⏰ Đã hết hạn', 
        isLocked: true, 
        message: getClosedNotice(cam) || `Đợt đăng ký đã chính thức kết thúc vào lúc ${timeStr}.` 
      };
    }
    return { code: 'open', label: '🟢 Đang mở', isLocked: false, message: '' };
  };

  async function fetchStudentRoster() {}

  const getUniqueClassesList = () => {
    const defaults = [];
    ['10', '11', '12'].forEach(g => {
      for (let i = 1; i <= 15; i++) {
        const num = String(i).padStart(2, '0');
        defaults.push(`${g}A${num}`);
      }
    });
    return defaults;
  };

  const filterNameSuggestions = async (nameVal, classVal = studentClass) => {
    const cleanName = (nameVal || '').trim();
    const cleanClass = (classVal || '').trim();

    if (cleanClass) {
      const studentsInClass = await fetchStudentsByClass(cleanClass);
      let matches = studentsInClass;
      if (cleanName) {
        matches = matches.filter(s => 
          s.student_name.toLowerCase().includes(cleanName.toLowerCase()) ||
          s.student_code.toLowerCase().includes(cleanName.toLowerCase())
        );
      }
      setSuggestions(matches.slice(0, 10));
      setShowSuggestions(matches.length > 0);
    } else if (cleanName.length >= 2) {
      const matches = await searchStudentsByName(cleanName);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const filterClassSuggestions = (val) => {
    const allUnique = getUniqueClassesList();
    const clean = (val || '').trim().toUpperCase();
    if (!clean) {
      setClassSuggestions(allUnique.slice(0, 15));
      setShowClassSuggestions(true);
      return;
    }
    const filtered = allUnique.filter(c => c.toUpperCase().includes(clean)).slice(0, 15);
    setClassSuggestions(filtered);
    setShowClassSuggestions(filtered.length > 0);
  };

  const handleNameChange = (val) => {
    setStudentName(val);
    setIsVerified(false);
    setClubEligibility(null);
    filterNameSuggestions(val);
  };

  const handleClassChange = (val) => {
    setStudentClass(val);
    setClubEligibility(null);
    filterClassSuggestions(val);
    if (val) fetchStudentsByClass(val);
  };

  const handleSelectClassSuggestion = (clsName) => {
    setStudentClass(clsName);
    setShowClassSuggestions(false);
    setClubEligibility(null);
    fetchStudentsByClass(clsName);
    filterNameSuggestions(studentName, clsName);
  };

  // KIỂM TRA ĐIỀU KIỆN TIÊN QUYẾT: Học sinh đã đăng ký CLB mẹ hay chưa
  const verifyClubPrerequisite = async (studentCodeVal, targetCampaign) => {
    const requiredClub = getPrerequisiteClub(targetCampaign);
    if (!requiredClub) {
      setClubEligibility({ eligible: true, requiredClub: null, registeredClubs: [] });
      return true;
    }

    setCheckingClubEligibility(true);
    try {
      // Tìm đợt đăng ký CLB mẹ
      const client = targetCampaign._source === 'sb1' && supabase ? supabase : (supabase2 || supabase);
      
      // Truy vấn kết quả đăng ký của học sinh trong đợt CLB
      const { data: regRecords, error } = await client
        .from('cbq_student_registrations')
        .select('*')
        .eq('student_code', studentCodeVal);

      if (error) throw error;

      // Trích xuất toàn bộ CLB mà học sinh này đã từng đăng ký
      const registeredClubs = [];
      (regRecords || []).forEach(rec => {
        if (!rec.responses) return;
        Object.values(rec.responses).forEach(ans => {
          if (Array.isArray(ans)) {
            ans.forEach(item => {
              if (typeof item === 'string' && (item.includes('Câu lạc bộ') || item.includes('CLB'))) {
                registeredClubs.push(item);
              }
            });
          } else if (typeof ans === 'string' && (ans.includes('Câu lạc bộ') || ans.includes('CLB'))) {
            registeredClubs.push(ans);
          }
        });
      });

      // Kiểm tra xem có khớp requiredClub không (hỗ trợ so sánh chuẩn hóa)
      const cleanReq = requiredClub.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isEligible = registeredClubs.some(club => {
        const cleanClub = club.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanClub.includes(cleanReq) || cleanReq.includes(cleanClub) || 
          (cleanReq.includes('theduc') && cleanClub.includes('theduc')) ||
          (cleanReq.includes('thethao') && cleanClub.includes('thethao'));
      });

      const eligibilityResult = {
        eligible: isEligible,
        requiredClub: requiredClub,
        registeredClubs: registeredClubs
      };

      setClubEligibility(eligibilityResult);
      return isEligible;
    } catch (err) {
      console.error('Lỗi khi kiểm tra tư cách thành viên CLB:', err);
      // Mặc định cho qua nếu mạng lỗi
      setClubEligibility({ eligible: true, requiredClub, registeredClubs: [] });
      return true;
    } finally {
      setCheckingClubEligibility(false);
    }
  };

  const handleSelectSuggestion = async (student) => {
    setStudentName(student.student_name);
    setStudentClass(student.student_class);
    setStudentCode(student.student_code);
    setIsVerified(true);
    setShowSuggestions(false);
    setShowClassSuggestions(false);

    // Kiểm tra tính hợp lệ về khối của Campaign
    if (selectedCampaign && selectedCampaign.target_grades && selectedCampaign.target_grades.length > 0) {
      const matchPrefix = student.student_class.trim().toUpperCase().match(/^(10|11|12)/);
      const gradeStr = matchPrefix ? `Khối ${matchPrefix[1]}` : null;
      if (!selectedCampaign.target_grades.includes(gradeStr)) {
        alert(`Lỗi: Đợt đăng ký này chỉ áp dụng cho ${selectedCampaign.target_grades.join(', ')}.`);
        setIsVerified(false);
        setStudentName('');
        setStudentCode('');
        return;
      }
    }

    // Kiểm tra điều kiện CLB
    await verifyClubPrerequisite(student.student_code, selectedCampaign);
  };

  const selectCampaign = (cam) => {
    setSelectedCampaign(cam);
    setSuccess(false);
    setIsVerified(false);
    setStudentName('');
    setStudentClass('');
    setStudentCode('');
    setClubEligibility(null);
    setSubmittedData(null);
    
    // Init default responses
    const initialResponses = {};
    const schemaFields = Array.isArray(cam.form_schema) ? cam.form_schema : (cam.form_schema?.fields || []);
    schemaFields.forEach(f => {
      if (f.type === 'checkbox') initialResponses[f.id] = [];
      else initialResponses[f.id] = '';
    });
    setResponses(initialResponses);
    window.scrollTo(0, 0);
  };

  const handleResponseChange = (fieldId, value, type) => {
    if (type === 'checkbox') {
      const current = responses[fieldId] || [];
      if (current.includes(value)) {
        setResponses({ ...responses, [fieldId]: current.filter(v => v !== value) });
      } else {
        setResponses({ ...responses, [fieldId]: [...current, value] });
      }
    } else {
      setResponses({ ...responses, [fieldId]: value });
    }
  };

  const currentSchemaFields = useMemo(() => {
    if (!selectedCampaign) return [];
    return Array.isArray(selectedCampaign.form_schema) 
      ? selectedCampaign.form_schema 
      : (selectedCampaign.form_schema?.fields || []);
  }, [selectedCampaign]);

  const requiredClubName = useMemo(() => {
    return getPrerequisiteClub(selectedCampaign);
  }, [selectedCampaign]);

  const subDisciplinesList = useMemo(() => {
    if (!requiredClubName) return [];
    return getSubDisciplinesForClub(requiredClubName);
  }, [requiredClubName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isVerified) {
      return alert("Bạn phải chọn đúng họ tên và mã học sinh từ danh sách gợi ý để đăng ký.");
    }
    if (!studentCode) {
      return alert("Lỗi: Không tìm thấy Mã học sinh.");
    }

    // Kiểm tra điều kiện CLB
    if (clubEligibility && clubEligibility.eligible === false) {
      return alert(`⛔ Bạn không đủ điều kiện đăng ký đợt này vì chưa có tên trong danh sách đăng ký ${clubEligibility.requiredClub}.`);
    }

    // Validate required fields
    for (const field of currentSchemaFields) {
      if (field.required) {
        const val = responses[field.id];
        if (!val || (Array.isArray(val) && val.length === 0)) {
          return alert(`Vui lòng chọn hoặc trả lời: "${field.label}"`);
        }
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        campaign_id: selectedCampaign.id,
        student_code: studentCode,
        student_name: studentName,
        student_class: studentClass,
        responses
      };

      const targetClient = (selectedCampaign._source === 'sb1' && supabase) ? supabase : (supabase2 || supabase);
      const { error } = await targetClient.from('cbq_student_registrations').insert([payload]);

      if (error) {
        if (error.code === '23505') {
          alert("Bạn đã đăng ký đợt này rồi. Mỗi học sinh chỉ được nộp 1 lần.");
        } else {
          throw error;
        }
      } else {
        setSubmittedData({
          studentName,
          studentClass,
          studentCode,
          responses,
          campaignTitle: selectedCampaign.title
        });
        setSuccess(true);
      }
    } catch (err) {
      alert("Lỗi khi nộp: " + (err.message || 'Không thể lưu bản ghi'));
    } finally {
      setSubmitting(false);
    }
  };

  // Trích xuất môn phụ đã chọn sau khi nộp thành công để hiện nút Zalo
  const submittedSubDiscipline = useMemo(() => {
    if (!submittedData || !subDisciplinesList || subDisciplinesList.length === 0) return null;
    const ansValues = Object.values(submittedData.responses || {}).flat();
    for (const sub of subDisciplinesList) {
      if (ansValues.some(v => String(v).includes(sub.name) || String(v).includes(sub.code))) {
        return sub;
      }
    }
    return subDisciplinesList[0] || null;
  }, [submittedData, subDisciplinesList]);

  if (success) {
    return (
      <div style={{ maxWidth: '650px', margin: '40px auto', padding: '0 16px', textAlign: 'center' }}>
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '36px 24px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
          <CheckCircle2 size={68} color="#10b981" style={{ margin: '0 auto', marginBottom: '16px' }} />
          <h2 style={{ color: '#0f172a', fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0' }}>Đăng Ký Thành Công!</h2>
          <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
            Chúc mừng em <strong>{submittedData?.studentName}</strong> (Lớp <strong>{submittedData?.studentClass}</strong>) đã hoàn tất đăng ký <strong>"{selectedCampaign?.title}"</strong>.
          </p>

          {/* NẾU ĐĂNG KÝ MÔN PHỤ -> HIỆN THÔNG TIN NHÓM ZALO VÀ LỊCH TẬP NGAY */}
          {submittedSubDiscipline && (
            <div style={{ 
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', 
              border: '2px solid #86efac', 
              borderRadius: '16px', 
              padding: '20px', 
              textAlign: 'left',
              marginBottom: '25px',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '28px' }}>{submittedSubDiscipline.icon}</span>
                <div>
                  <h4 style={{ margin: 0, color: '#166534', fontSize: '17px', fontWeight: '800' }}>
                    Phân môn: {submittedSubDiscipline.name}
                  </h4>
                  <span style={{ fontSize: '12.5px', color: '#15803d', fontWeight: '600' }}>
                    Thuộc {requiredClubName || 'Câu lạc bộ'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px', color: '#334155', background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} color="#059669" /> <strong>Địa điểm:</strong> {submittedSubDiscipline.location}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} color="#059669" /> <strong>Thời gian:</strong> {submittedSubDiscipline.schedule}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={15} color="#059669" /> <strong>Phụ trách:</strong> {submittedSubDiscipline.coaches.join(', ')}
                </div>
              </div>

              {submittedSubDiscipline.zaloUrl ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '13.5px', color: '#166534', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                    👉 BƯỚC TIẾP THEO: Em vui lòng bấm nút dưới đây để tham gia ngay nhóm Zalo môn {submittedSubDiscipline.name}:
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a
                      href={submittedSubDiscipline.zaloUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '11px 22px',
                        background: '#0284c7',
                        color: '#ffffff',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '14px',
                        textDecoration: 'none',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                      }}
                    >
                      <ExternalLink size={16} /> Vào Nhóm Zalo Môn {submittedSubDiscipline.name}
                    </a>
                    <button
                      onClick={() => setQrModalItem(submittedSubDiscipline)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '11px 18px',
                        background: '#ffffff',
                        color: '#0369a1',
                        border: '1.5px solid #0284c7',
                        borderRadius: '10px',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      <QrCode size={16} /> Quét QR Zalo
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: '#166534', textAlign: 'center', fontStyle: 'italic' }}>
                  Giáo viên phụ trách sẽ liên hệ và thêm em vào nhóm Zalo sinh hoạt qua số điện thoại em đã cung cấp.
                </p>
              )}
            </div>
          )}

          <button 
            onClick={() => setSelectedCampaign(null)} 
            style={{ padding: '12px 28px', background: '#be123c', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(190, 18, 60, 0.25)' }}
          >
            Quay lại Cổng Đăng Ký
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '750px', margin: '40px auto', padding: '0 16px' }}>
      
      {/* HEADER BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0284c7 100%)',
        borderRadius: '20px 20px 0 0',
        padding: '28px 24px',
        color: '#ffffff',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(30, 27, 75, 0.2)'
      }}>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '25px', fontFamily: 'Playfair Display, Georgia, serif', color: '#fde047', textShadow: '0 2px 10px rgba(0,0,0,0.6)', fontWeight: '800' }}>
          📝 CỔNG ĐĂNG KÝ HOẠT ĐỘNG
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#e0f2fe', fontWeight: '500' }}>
          Trường THPT Cao Bá Quát - Tân An
        </p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '0 0 20px 20px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', borderTop: 'none' }}>
        
        {!selectedCampaign ? (
          <div>
            <h3 style={{ marginTop: 0, color: '#334155' }}>Danh sách các đợt đăng ký ({campaigns.length})</h3>
            {campaigns.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', color: '#64748b' }}>
                Hiện tại nhà trường chưa tạo đợt đăng ký nào.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {campaigns.map(cam => {
                  const status = getCampaignStatus(cam);
                  const reqClub = getPrerequisiteClub(cam);
                  return (
                    <div 
                      key={cam.id} 
                      onClick={() => selectCampaign(cam)} 
                      style={{ 
                        border: status.isLocked ? '1px solid #fca5a5' : '1px solid #cbd5e1', 
                        borderRadius: '12px', 
                        padding: '16px', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s', 
                        background: status.isLocked ? '#fff5f5' : '#ffffff',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 6px 0', color: status.isLocked ? '#991b1b' : '#0284c7', fontSize: '16px' }}>
                            {cam.title}
                          </h4>
                          {reqClub && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '6px', fontWeight: '700', marginBottom: '8px' }}>
                              <ShieldCheck size={13} /> Yêu cầu thành viên: {reqClub}
                            </span>
                          )}
                        </div>
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: 'bold', 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          whiteSpace: 'nowrap',
                          background: status.code === 'open' ? '#f0fdf4' : status.code === 'locked' ? '#fef2f2' : '#fff7ed',
                          color: status.code === 'open' ? '#16a34a' : status.code === 'locked' ? '#ef4444' : '#ea580c',
                          border: status.code === 'open' ? '1px solid #86efac' : '1px solid #fca5a5'
                        }}>
                          {status.label}
                        </span>
                      </div>
                      
                      {cam.description && <p style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: '#64748b' }}>{cam.description}</p>}
                      
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ padding: '3px 10px', background: '#f1f5f9', color: '#475569', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                          Đối tượng: {!cam.target_grades || cam.target_grades.length === 0 ? 'Tất cả học sinh' : cam.target_grades.join(', ')}
                        </div>
                        {cam.end_date && (
                          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> Hạn chót: {new Date(cam.end_date).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            <button onClick={() => setSelectedCampaign(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '15px', padding: 0 }}>
              ← Quay lại danh sách
            </button>
            <h3 style={{ margin: '0 0 10px 0', color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
              {selectedCampaign.title}
            </h3>
            {selectedCampaign.description && (
              <p style={{ fontSize: '14px', color: '#475569', background: '#f8fafc', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #0284c7' }}>
                {selectedCampaign.description}
              </p>
            )}

            {/* CẢNH BÁO YÊU CẦU ĐÃ ĐĂNG KÝ CLB NẾU CÓ */}
            {requiredClubName && (
              <div style={{ 
                background: '#fffbeb', 
                border: '1.5px solid #fde68a', 
                borderRadius: '10px', 
                padding: '12px 16px', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#92400e',
                fontSize: '13.5px'
              }}>
                <ShieldCheck size={20} color="#d97706" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Lưu ý điều kiện tham gia:</strong> Đợt đăng ký này chỉ dành cho các học sinh <strong>đã đăng ký tham gia {requiredClubName}</strong> ở đợt 1.
                </div>
              </div>
            )}

            {/* HIỂN THỊ CẢNH BÁO NẾU ĐỢT ĐĂNG KÝ BỊ KHÓA / HẾT HẠN */}
            {getCampaignStatus(selectedCampaign).isLocked ? (
              <div style={{ 
                background: '#fef2f2', 
                border: '2px solid #fca5a5', 
                borderRadius: '16px', 
                padding: '30px 20px', 
                textAlign: 'center', 
                marginTop: '20px',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.08)'
              }}>
                <div style={{ width: '64px', height: '64px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <Lock size={32} color="#ef4444" />
                </div>
                <h3 style={{ color: '#991b1b', margin: '0 0 10px 0', fontSize: '20px', fontWeight: 'bold' }}>
                  Đợt Đăng Ký Đã Tạm Khóa Hoặc Hết Hạn
                </h3>
                <div style={{ color: '#7f1d1d', fontSize: '15px', lineHeight: '1.6', marginBottom: '20px', maxWidth: '500px', margin: '0 auto 20px auto', background: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #fecaca' }}>
                  {getCampaignStatus(selectedCampaign).message}
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>
                  Nếu có thắc mắc hoặc cần bổ sung thông tin, em vui lòng liên hệ Văn phòng nhà trường hoặc Giáo viên chủ nhiệm để được hỗ trợ.
                </p>
                <button 
                  onClick={() => setSelectedCampaign(null)} 
                  style={{ padding: '10px 24px', background: '#475569', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                >
                  ← Quay lại danh sách đợt đăng ký
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
              
              {/* PHẦN XÁC THỰC DANH TÍNH */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px', marginBottom: '25px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={18} color="#0284c7" /> 1. Xác thực học sinh
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                  <div style={{ position: 'relative' }} ref={classDropdownRef}>
                    <label style={styles.label}>Lớp học (*)</label>
                    <input 
                      type="text" 
                      value={studentClass} 
                      onChange={e => handleClassChange(e.target.value)} 
                      onFocus={() => filterClassSuggestions(studentClass)}
                      style={styles.input} 
                      placeholder="Gõ tìm lớp... (VD: 12A01)" 
                      disabled={isVerified}
                    />
                    {showClassSuggestions && (
                      <ul style={styles.dropdown}>
                        {classSuggestions.map((cls, i) => (
                          <li key={i} style={styles.dropdownItem} onClick={() => handleSelectClassSuggestion(cls)}>
                            {cls}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <label style={styles.label}>Họ và Tên Học sinh (*)</label>
                    <div style={{ position: 'relative' }}>
                      <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input 
                        type="text" 
                        value={studentName} 
                        onChange={e => handleNameChange(e.target.value)} 
                        onFocus={() => filterNameSuggestions(studentName)}
                        style={{ ...styles.input, paddingLeft: '34px' }} 
                        placeholder="Gõ tìm họ tên hoặc mã HS..." 
                        disabled={isVerified}
                      />
                    </div>
                    {showSuggestions && (
                      <ul style={styles.dropdown}>
                        {suggestions.length === 0 ? (
                          <li style={{ padding: '10px', color: '#94a3b8', fontSize: '13px' }}>Không tìm thấy học sinh phù hợp</li>
                        ) : suggestions.map((stu) => (
                          <li key={stu.id} style={styles.dropdownItem} onClick={() => handleSelectSuggestion(stu)}>
                            <strong style={{ color: '#0f172a' }}>{stu.student_name}</strong> - Lớp <span style={{ color: '#be123c' }}>{stu.student_class}</span> (Mã HS: {stu.student_code})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {checkingClubEligibility && (
                    <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd', color: '#0369a1', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} className="animate-spin" /> Đang kiểm tra tư cách thành viên câu lạc bộ trên CSDL...
                    </div>
                  )}

                  {/* THÔNG BÁO XÁC THỰC THÀNH CÔNG VÀ ĐỦ ĐIỀU KIỆN CLB */}
                  {isVerified && clubEligibility?.eligible === true && (
                    <div style={{ background: '#ecfdf5', padding: '14px', borderRadius: '10px', border: '1px solid #a7f3d0', color: '#065f46', fontSize: '13.5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginBottom: '4px' }}>
                        <CheckCircle2 size={18} color="#059669" /> Đã xác thực danh tính hợp lệ
                        <button type="button" onClick={() => { setIsVerified(false); setClubEligibility(null); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#059669', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}>Đổi học sinh khác</button>
                      </div>
                      {clubEligibility.requiredClub && (
                        <div style={{ fontSize: '12.5px', color: '#047857', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          <ShieldCheck size={15} /> Xác nhận: Học sinh đã đăng ký <strong>{clubEligibility.requiredClub}</strong> ở đợt 1.
                        </div>
                      )}
                    </div>
                  )}

                  {/* THÔNG BÁO KHÔNG ĐỦ ĐIỀU KIỆN (CHƯA ĐĂNG KÝ CLB MẸ) */}
                  {isVerified && clubEligibility?.eligible === false && (
                    <div style={{ 
                      background: '#fef2f2', 
                      border: '2px solid #fca5a5', 
                      borderRadius: '12px', 
                      padding: '16px', 
                      color: '#991b1b' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                        <ShieldAlert size={24} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <h5 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '800' }}>
                            Không đủ điều kiện đăng ký môn phụ này
                          </h5>
                          <p style={{ margin: '0 0 8px 0', fontSize: '13.5px', lineHeight: '1.5' }}>
                            Em <strong>{studentName}</strong> (Lớp <strong>{studentClass}</strong>) <strong>chưa đăng ký tham gia {clubEligibility.requiredClub}</strong> trong đợt đăng ký câu lạc bộ trước đó.
                          </p>
                          <div style={{ fontSize: '13px', background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '8px' }}>
                            <strong>Các câu lạc bộ em đã đăng ký:</strong>
                            {clubEligibility.registeredClubs.length > 0 ? (
                              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                {clubEligibility.registeredClubs.map((c, i) => (
                                  <li key={i} style={{ color: '#0284c7', fontWeight: '600' }}>{c}</li>
                                ))}
                              </ul>
                            ) : (
                              <span style={{ color: '#64748b', fontStyle: 'italic', marginLeft: '6px' }}>Em chưa đăng ký tham gia câu lạc bộ nào trong năm học này.</span>
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: '12.5px', color: '#7f1d1d' }}>
                            💡 Em chỉ có thể chọn môn phụ của những câu lạc bộ mà em đã đăng ký. Vui lòng liên hệ Thầy/Cô Ban Chủ nhiệm nếu cần đăng ký bổ sung.
                          </p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => { setIsVerified(false); setClubEligibility(null); setStudentName(''); setStudentCode(''); }} 
                        style={{ padding: '6px 14px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12.5px', cursor: 'pointer', display: 'block', margin: '10px auto 0 auto' }}
                      >
                        Chọn học sinh khác
                      </button>
                    </div>
                  )}

                </div>
              </div>

              {/* DYNAMIC FORM FIELDS (CHỈ HIỆN KHI ĐÃ XÁC THỰC VÀ ĐỦ ĐIỀU KIỆN) */}
              {isVerified && clubEligibility?.eligible === true && (
                <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} color="#be123c" /> 2. Nhập thông tin đăng ký
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {currentSchemaFields.map(field => {
                      // Kiểm tra xem field này có phải là chọn môn phụ không
                      const isSubDisciplineField = field.id === 'field_sub_discipline' || 
                        (field.label && (field.label.toLowerCase().includes('môn phụ') || field.label.toLowerCase().includes('phân môn') || field.label.toLowerCase().includes('bộ môn')));

                      return (
                        <div key={field.id}>
                          <label style={styles.label}>
                            {field.label} {field.required && <span style={{ color: '#ef4444' }}>(*)</span>}
                          </label>
                          
                          {/* NẾU LÀ MÔN PHỤ -> HIỂN THỊ THẺ MÔN TRỰC QUAN KÈM LỊCH TẬP & NHÓM ZALO */}
                          {isSubDisciplineField && subDisciplinesList.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginTop: '8px' }}>
                              {subDisciplinesList.map(sub => {
                                const isSelected = (responses[field.id] || '').includes(sub.name) || responses[field.id] === sub.name;
                                return (
                                  <div
                                    key={sub.id}
                                    onClick={() => handleResponseChange(field.id, sub.name, 'select')}
                                    style={{
                                      border: isSelected ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                                      backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                                      borderRadius: '14px',
                                      padding: '16px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      boxShadow: isSelected ? '0 4px 15px rgba(2, 132, 199, 0.15)' : '0 2px 6px rgba(0,0,0,0.02)',
                                      position: 'relative'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '26px' }}>{sub.icon}</span>
                                        <div>
                                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: isSelected ? '#0369a1' : '#0f172a' }}>
                                            {sub.name}
                                          </h4>
                                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                                            {sub.description}
                                          </span>
                                        </div>
                                      </div>

                                      <input 
                                        type="radio"
                                        name={field.id}
                                        checked={isSelected}
                                        onChange={() => handleResponseChange(field.id, sub.name, 'select')}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0284c7', marginTop: '4px' }}
                                      />
                                    </div>

                                    {/* THÔNG TIN LỊCH TẬP & ĐỊA ĐIỂM & GIÁO VIÊN */}
                                    <div style={{ 
                                      display: 'grid', 
                                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                                      gap: '8px', 
                                      marginTop: '12px', 
                                      padding: '10px 12px', 
                                      background: isSelected ? '#e0f2fe' : '#f8fafc', 
                                      borderRadius: '10px',
                                      fontSize: '12.5px',
                                      color: '#334155'
                                    }}>
                                      <div>
                                        <MapPin size={13} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px', color: '#0284c7' }} />
                                        <strong>Địa điểm:</strong> {sub.location}
                                      </div>
                                      <div>
                                        <Calendar size={13} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px', color: '#0284c7' }} />
                                        <strong>Thời gian:</strong> {sub.schedule}
                                      </div>
                                      <div>
                                        <Users size={13} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px', color: '#0284c7' }} />
                                        <strong>Phụ trách:</strong> {sub.coaches.join(', ')}
                                      </div>
                                    </div>

                                    {/* NÚT THAM GIA ZALO & MÃ QR */}
                                    {sub.zaloUrl && (
                                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                                        <a 
                                          href={sub.zaloUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            padding: '6px 12px',
                                            background: '#0284c7',
                                            color: '#ffffff',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            textDecoration: 'none'
                                          }}
                                        >
                                          <ExternalLink size={13} /> Nhóm Zalo
                                        </a>
                                        <button
                                          type="button"
                                          onClick={() => setQrModalItem(sub)}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '6px 10px',
                                            background: '#ffffff',
                                            color: '#0369a1',
                                            border: '1px solid #0284c7',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          <QrCode size={13} /> Xem QR
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <>
                              {field.type === 'text' && (
                                <input 
                                  type="text" 
                                  style={styles.input} 
                                  value={responses[field.id] || ''}
                                  onChange={(e) => handleResponseChange(field.id, e.target.value, 'text')}
                                  required={field.required}
                                  placeholder={field.label.includes('điện thoại') ? 'Nhập số điện thoại (VD: 0912345678)' : ''}
                                />
                              )}

                              {field.type === 'textarea' && (
                                <textarea 
                                  rows={3}
                                  style={styles.input} 
                                  value={responses[field.id] || ''}
                                  onChange={(e) => handleResponseChange(field.id, e.target.value, 'textarea')}
                                  required={field.required}
                                />
                              )}

                              {field.type === 'select' && (
                                <select 
                                  style={styles.input}
                                  value={responses[field.id] || ''}
                                  onChange={(e) => handleResponseChange(field.id, e.target.value, 'select')}
                                  required={field.required}
                                >
                                  <option value="">-- Lựa chọn --</option>
                                  {(field.options || []).map((opt, idx) => (
                                    <option key={idx} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              )}

                              {field.type === 'radio' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                                  {(field.options || []).map((opt, idx) => (
                                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer' }}>
                                      <input 
                                        type="radio" 
                                        name={field.id}
                                        value={opt}
                                        checked={responses[field.id] === opt}
                                        onChange={(e) => handleResponseChange(field.id, e.target.value, 'radio')}
                                        required={field.required}
                                      />
                                      {opt}
                                    </label>
                                  ))}
                                </div>
                              )}

                              {field.type === 'checkbox' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                                  {(field.options || []).map((opt, idx) => (
                                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer' }}>
                                      <input 
                                        type="checkbox" 
                                        value={opt}
                                        checked={(responses[field.id] || []).includes(opt)}
                                        onChange={(e) => handleResponseChange(field.id, e.target.value, 'checkbox')}
                                      />
                                      {opt}
                                    </label>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button 
                    type="submit" 
                    disabled={submitting}
                    style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #be123c, #9f1239)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(190, 18, 60, 0.3)' }}
                  >
                    {submitting ? 'ĐANG GỬI...' : 'GỬI ĐĂNG KÝ'}
                  </button>
                </div>
              )}

            </form>
            )}
          </div>
        )}
      </div>

      {/* POPUP XEM MÃ QR ZALO CỦA TỪNG MÔN PHỤ */}
      {qrModalItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', maxWidth: '380px', width: '100%', textAlign: 'center', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <button 
              onClick={() => setQrModalItem(null)}
              style={{ position: 'absolute', right: '14px', top: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={20} />
            </button>

            <span style={{ fontSize: '36px' }}>{qrModalItem.icon}</span>
            <h3 style={{ margin: '8px 0 4px 0', fontSize: '18px', color: '#0f172a', fontWeight: '800' }}>
              Môn: {qrModalItem.name}
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
              Quét mã QR bằng ứng dụng Zalo để tham gia nhóm
            </p>

            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'inline-block', marginBottom: '16px' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrModalItem.zaloUrl)}`}
                alt={`QR Zalo ${qrModalItem.name}`}
                style={{ width: '180px', height: '180px', display: 'block', margin: '0 auto' }}
              />
            </div>

            <div style={{ fontSize: '12.5px', color: '#334155', marginBottom: '16px', textAlign: 'left', background: '#f0f9ff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
              <div><strong>📍 Địa điểm:</strong> {qrModalItem.location}</div>
              <div><strong>⏰ Thời gian:</strong> {qrModalItem.schedule}</div>
              <div><strong>👨‍🏫 Phụ trách:</strong> {qrModalItem.coaches.join(', ')}</div>
            </div>

            <a
              href={qrModalItem.zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                width: '100%',
                padding: '11px 0',
                background: '#0284c7',
                color: '#ffffff',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '14px',
                textDecoration: 'none',
                boxSizing: 'border-box'
              }}
            >
              Mở Trực Tiếp Trên Zalo
            </a>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  label: { display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold', color: '#334155' },
  input: { width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#fff' },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '4px', padding: 0, listStyle: 'none', maxHeight: '200px', overflowY: 'auto', zIndex: 50, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
  dropdownItem: { padding: '10px 12px', fontSize: '13.5px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }
};
