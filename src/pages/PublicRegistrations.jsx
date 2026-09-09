import { useState, useEffect, useRef } from 'react';
import { supabase, DualSupabaseService, fetchStudentsByClass, searchStudentsByName } from '../lib/supabase';
import { FileText, CheckCircle2, User, Search, Navigation } from 'lucide-react';

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
  
  // Class Autocomplete States
  const [classSuggestions, setClassSuggestions] = useState([]);
  const [showClassSuggestions, setShowClassSuggestions] = useState(false);

  // Form Submission States
  const [responses, setResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
        (q) => q.eq('is_active', true).order('created_at', { ascending: false }),
        'id'
      );
      setCampaigns(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchStudentRoster() {
    // 🟢 CÁCH 02: Không nạp 3,000 học sinh khi vừa mở trang nữa!
    // Hệ thống sẽ tự nạp ngầm ~35 học sinh theo Lớp khi người dùng chọn Lớp.
  }

  const getUniqueClassesList = () => {
    const defaults = [];
    ['10', '11', '12'].forEach(g => {
      for (let i = 1; i <= 15; i++) defaults.push(`${g}A${i}`);
    });
    return defaults;
  };

  const filterNameSuggestions = async (nameVal, classVal = studentClass) => {
    const cleanName = (nameVal || '').trim();
    const cleanClass = (classVal || '').trim();

    if (cleanClass) {
      // Nạp danh sách ~35 học sinh của Lớp đó
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
    filterNameSuggestions(val);
  };

  const handleClassChange = (val) => {
    setStudentClass(val);
    filterClassSuggestions(val);
    if (val) fetchStudentsByClass(val);
  };

  const handleSelectClassSuggestion = (clsName) => {
    setStudentClass(clsName);
    setShowClassSuggestions(false);
    fetchStudentsByClass(clsName);
    filterNameSuggestions(studentName, clsName);
  };

  const handleSelectSuggestion = (student) => {
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
      }
    }
  };

  const selectCampaign = (cam) => {
    setSelectedCampaign(cam);
    setSuccess(false);
    setIsVerified(false);
    setStudentName('');
    setStudentClass('');
    setStudentCode('');
    
    // Init default responses
    const initialResponses = {};
    (cam.form_schema || []).forEach(f => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isVerified) {
      return alert("Bạn phải chọn đúng họ tên và mã học sinh từ danh sách gợi ý để đăng ký.");
    }
    if (!studentCode) {
      return alert("Lỗi: Không tìm thấy Mã học sinh.");
    }

    // Validate required fields
    for (const field of (selectedCampaign.form_schema || [])) {
      if (field.required) {
        const val = responses[field.id];
        if (!val || (Array.isArray(val) && val.length === 0)) {
          return alert(`Vui lòng trả lời câu hỏi: "${field.label}"`);
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

      const client = selectedCampaign._source === 'sb1' ? supabase : supabase2;
      const { error } = await client.from('cbq_student_registrations').insert([payload]);
      if (error) {
        if (error.code === '23505') {
          alert("Bạn đã đăng ký đợt này rồi. Mỗi học sinh chỉ được nộp 1 lần.");
        } else {
          throw error;
        }
      } else {
        setSuccess(true);
      }
    } catch (err) {
      alert("Lỗi khi nộp: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 16px', textAlign: 'center' }}>
        <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto', marginBottom: '15px' }} />
        <h2 style={{ color: '#1e293b' }}>Đăng Ký Thành Công!</h2>
        <p style={{ color: '#64748b' }}>Cảm ơn bạn đã hoàn thành thông tin đăng ký cho "{selectedCampaign?.title}".</p>
        <button onClick={() => setSelectedCampaign(null)} style={{ padding: '10px 20px', background: '#be123c', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 16px' }}>
      
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
            <h3 style={{ marginTop: 0, color: '#334155' }}>Các đợt đang mở ({campaigns.length})</h3>
            {campaigns.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', color: '#64748b' }}>
                Hiện tại nhà trường không có đợt đăng ký nào đang mở.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {campaigns.map(cam => (
                  <div key={cam.id} onClick={() => selectCampaign(cam)} style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s', ':hover': { borderColor: '#0284c7', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.1)' } }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#0284c7', fontSize: '16px' }}>{cam.title}</h4>
                    {cam.description && <p style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: '#64748b' }}>{cam.description}</p>}
                    <div style={{ display: 'inline-block', padding: '4px 10px', background: '#f1f5f9', color: '#475569', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                      Đối tượng: {!cam.target_grades || cam.target_grades.length === 0 ? 'Tất cả học sinh' : cam.target_grades.join(', ')}
                    </div>
                  </div>
                ))}
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

                  {isVerified && (
                    <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', fontSize: '13.5px', fontWeight: 'bold' }}>
                      <CheckCircle2 size={18} /> Đã xác thực thông tin hợp lệ
                      <button type="button" onClick={() => setIsVerified(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#059669', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}>Làm lại</button>
                    </div>
                  )}
                </div>
              </div>

              {/* DYNAMIC FORM FIELDS */}
              {isVerified && (
                <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} color="#be123c" /> 2. Nhập thông tin đăng ký
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {(selectedCampaign.form_schema || []).map(field => (
                      <div key={field.id}>
                        <label style={styles.label}>
                          {field.label} {field.required && <span style={{ color: '#ef4444' }}>(*)</span>}
                        </label>
                        
                        {field.type === 'text' && (
                          <input 
                            type="text" 
                            style={styles.input} 
                            value={responses[field.id] || ''}
                            onChange={(e) => handleResponseChange(field.id, e.target.value, 'text')}
                            required={field.required}
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
                      </div>
                    ))}
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
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  label: { display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 'bold', color: '#334155' },
  input: { width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#fff' },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '4px', padding: 0, listStyle: 'none', maxHeight: '200px', overflowY: 'auto', zIndex: 50, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
  dropdownItem: { padding: '10px 12px', fontSize: '13.5px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }
};
