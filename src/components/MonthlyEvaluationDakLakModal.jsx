import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, Check, Printer, PenTool, Save, Send, ShieldCheck, 
  Award, AlertTriangle, FileText, CheckCircle2, User, ChevronRight,
  Sparkles, RefreshCw, Trash2, Download
} from 'lucide-react';
import SignaturePadModal from './SignaturePadModal';

export default function MonthlyEvaluationDakLakModal({
  isOpen,
  onClose,
  teacherData,
  evaluationMonth = 'Tháng 6',
  schoolYear = '2025-2026',
  departmentName = 'Tổ Ngữ văn',
  currentTeacher = null,
  isManager = false,
  onSaveEvaluation = null
}) {
  const printRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    // Header Info
    teacher_name: '',
    teacher_title: 'Giáo viên',
    department: '',
    evaluation_month: 'Tháng 6',
    school_year: '2025-2026',
    eval_year: '2026',

    // Section I: Criteria (Self & Manager)
    self_crit_1: 'Đạt', // Chính trị, tư tưởng
    self_crit_2: 'Đạt', // Đạo đức, lối sống
    self_crit_3: 'Đạt', // Tác phong, lề lối làm việc

    manager_crit_1: 'Đạt',
    manager_crit_2: 'Đạt',
    manager_crit_3: 'Đạt',

    // Section II: Scores
    self_base_score: 100,
    self_minus_score: 0,
    self_plus_score: 0,
    self_total_score: 100,

    manager_base_score: 100,
    manager_minus_score: 0,
    manager_plus_score: 0,
    manager_total_score: 100,

    // Classifications & Comments
    self_classification: 'Hoàn thành tốt nhiệm vụ',
    manager_classification: 'Hoàn thành tốt nhiệm vụ',
    manager_comments: 'Đồng chí hoàn thành tốt mọi nhiệm vụ giảng dạy và công tác được phân công trong tháng.',
    principal_comments: '',
    principal_conclusion: 'Hoàn thành tốt nhiệm vụ',

    // Signatures (Base64 data URLs)
    self_signature: null,
    self_signed_date: '',
    self_signer_name: '',

    manager_signature: null,
    manager_signed_date: '',
    manager_signer_name: 'Trần Thị Quế Quyên',

    principal_signature: null,
    principal_signed_date: '',
    principal_signer_name: '',

    // Workflow status: 'DRAFT' | 'SUBMITTED_TEACHER' | 'APPROVED_TTCM' | 'FINALIZED_PRINCIPAL'
    status: 'DRAFT'
  });

  // Signature Pad State
  const [sigModalOpen, setSigModalOpen] = useState(false);
  const [sigTargetRole, setSigTargetRole] = useState('self'); // 'self' | 'manager' | 'principal'
  const [submitting, setSubmitting] = useState(false);

  // Extract year from month or schoolYear
  const evalYearNum = useMemo(() => {
    if (schoolYear && schoolYear.includes('-')) {
      const parts = schoolYear.split('-');
      return parts[1] || '2026';
    }
    return '2026';
  }, [schoolYear]);

  // Initialize from props or cached evaluation
  useEffect(() => {
    if (!isOpen || !teacherData) return;

    const teacherName = teacherData.teacher_name || teacherData.name || '';
    const title = teacherData.teacher_title || teacherData.title || 'Giáo viên';
    const dept = departmentName || teacherData.department_name || teacherData.department || 'Tổ Chuyên Môn';

    // Check if there is existing saved data in teacherData or localStorage
    const storageKey = `cbq_daklak_eval_${teacherName}_${evaluationMonth}_${schoolYear}`;
    let savedObj = null;
    const localCached = localStorage.getItem(storageKey);
    if (localCached) {
      try {
        savedObj = JSON.parse(localCached);
      } catch (e) {
        console.warn(e);
      }
    }

    const todayStr = new Date().toLocaleDateString('vi-VN');

    setFormData({
      teacher_name: teacherName,
      teacher_title: title,
      department: dept,
      evaluation_month: evaluationMonth,
      school_year: schoolYear,
      eval_year: evalYearNum,

      self_crit_1: savedObj?.self_crit_1 || 'Đạt',
      self_crit_2: savedObj?.self_crit_2 || 'Đạt',
      self_crit_3: savedObj?.self_crit_3 || 'Đạt',

      manager_crit_1: savedObj?.manager_crit_1 || 'Đạt',
      manager_crit_2: savedObj?.manager_crit_2 || 'Đạt',
      manager_crit_3: savedObj?.manager_crit_3 || 'Đạt',

      self_base_score: Number(savedObj?.self_base_score ?? 100),
      self_minus_score: Number(savedObj?.self_minus_score ?? 0),
      self_plus_score: Number(savedObj?.self_plus_score ?? 0),
      self_total_score: Number(savedObj?.self_total_score ?? 100),

      manager_base_score: Number(savedObj?.manager_base_score ?? 100),
      manager_minus_score: Number(savedObj?.manager_minus_score ?? 0),
      manager_plus_score: Number(savedObj?.manager_plus_score ?? 0),
      manager_total_score: Number(savedObj?.manager_total_score ?? 100),

      self_classification: savedObj?.self_classification || 'Hoàn thành tốt nhiệm vụ',
      manager_classification: savedObj?.manager_classification || 'Hoàn thành tốt nhiệm vụ',
      manager_comments: savedObj?.manager_comments || `Đồng chí ${teacherName} thực hiện tốt quy chế chuyên môn và kế hoạch giáo dục trong tháng.`,
      principal_comments: savedObj?.principal_comments || '',
      principal_conclusion: savedObj?.principal_conclusion || 'Hoàn thành tốt nhiệm vụ',

      self_signature: savedObj?.self_signature || localStorage.getItem(`cbq_signature_${teacherName}`) || null,
      self_signed_date: savedObj?.self_signed_date || todayStr,
      self_signer_name: savedObj?.self_signer_name || teacherName,

      manager_signature: savedObj?.manager_signature || localStorage.getItem(`cbq_signature_manager_${dept}`) || null,
      manager_signed_date: savedObj?.manager_signed_date || todayStr,
      manager_signer_name: savedObj?.manager_signer_name || (currentTeacher?.full_name || 'Tổ trưởng chuyên môn'),

      principal_signature: savedObj?.principal_signature || null,
      principal_signed_date: savedObj?.principal_signed_date || todayStr,
      principal_signer_name: savedObj?.principal_signer_name || 'Hiệu trưởng',

      status: savedObj?.status || 'DRAFT'
    });
  }, [isOpen, teacherData, evaluationMonth, schoolYear, departmentName, evalYearNum, currentTeacher]);

  // Recalculate Self Total & Classification
  const handleSelfScoreChange = (field, val) => {
    const num = Number(val) || 0;
    setFormData(prev => {
      const next = { ...prev, [field]: num };
      const total = Number(next.self_base_score) - Number(next.self_minus_score) + Number(next.self_plus_score);
      next.self_total_score = total;

      const allCriteriaMet = next.self_crit_1 === 'Đạt' && next.self_crit_2 === 'Đạt' && next.self_crit_3 === 'Đạt';
      if (!allCriteriaMet || total < 80) {
        next.self_classification = 'Không hoàn thành nhiệm vụ';
      } else if (total >= 100) {
        next.self_classification = 'Hoàn thành xuất sắc nhiệm vụ';
      } else if (total >= 90) {
        next.self_classification = 'Hoàn thành tốt nhiệm vụ';
      } else {
        next.self_classification = 'Hoàn thành nhiệm vụ';
      }

      return next;
    });
  };

  // Recalculate Manager Total & Classification
  const handleManagerScoreChange = (field, val) => {
    const num = Number(val) || 0;
    setFormData(prev => {
      const next = { ...prev, [field]: num };
      const total = Number(next.manager_base_score) - Number(next.manager_minus_score) + Number(next.manager_plus_score);
      next.manager_total_score = total;

      const allCriteriaMet = next.manager_crit_1 === 'Đạt' && next.manager_crit_2 === 'Đạt' && next.manager_crit_3 === 'Đạt';
      if (!allCriteriaMet || total < 80) {
        next.manager_classification = 'Không hoàn thành nhiệm vụ';
      } else if (total >= 100) {
        next.manager_classification = 'Hoàn thành xuất sắc nhiệm vụ';
      } else if (total >= 90) {
        next.manager_classification = 'Hoàn thành tốt nhiệm vụ';
      } else {
        next.manager_classification = 'Hoàn thành nhiệm vụ';
      }

      return next;
    });
  };

  // Open Signature Pad
  const openSignaturePad = (role) => {
    setSigTargetRole(role);
    setSigModalOpen(true);
  };

  // Receive Saved Signature from Pad
  const handleSaveSignature = (signatureDataUrl) => {
    if (sigTargetRole === 'self') {
      setFormData(prev => ({
        ...prev,
        self_signature: signatureDataUrl,
        self_signer_name: prev.teacher_name,
        self_signed_date: new Date().toLocaleDateString('vi-VN')
      }));
      // Persist signature for fast reuse
      if (formData.teacher_name) {
        localStorage.setItem(`cbq_signature_${formData.teacher_name}`, signatureDataUrl);
      }
    } else if (sigTargetRole === 'manager') {
      setFormData(prev => ({
        ...prev,
        manager_signature: signatureDataUrl,
        manager_signer_name: currentTeacher?.full_name || prev.manager_signer_name || 'Tổ trưởng chuyên môn',
        manager_signed_date: new Date().toLocaleDateString('vi-VN')
      }));
      if (formData.department) {
        localStorage.setItem(`cbq_signature_manager_${formData.department}`, signatureDataUrl);
      }
    } else if (sigTargetRole === 'principal') {
      setFormData(prev => ({
        ...prev,
        principal_signature: signatureDataUrl,
        principal_signer_name: currentTeacher?.full_name || 'Hiệu trưởng',
        principal_signed_date: new Date().toLocaleDateString('vi-VN')
      }));
    }
  };

  // Save Evaluation to DB & LocalStorage
  const handleSaveEvaluationData = async (targetStatus = null) => {
    setSubmitting(true);
    try {
      const finalStatus = targetStatus || formData.status || 'DRAFT';
      const updatedData = {
        ...formData,
        status: finalStatus
      };

      const storageKey = `cbq_daklak_eval_${formData.teacher_name}_${evaluationMonth}_${schoolYear}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedData));

      if (onSaveEvaluation) {
        await onSaveEvaluation(updatedData);
      }

      setFormData(updatedData);
      alert("🎉 ĐÃ LƯU KẾT QUẢ ĐÁNH GIÁ THÀNH CÔNG!\n\nThông tin tự đánh giá, thẩm định TTCM và chữ ký số đã được lưu trữ an toàn.");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi lưu đánh giá: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !teacherData) return null;

  return (
    <div className="daklak-evaluation-modal-wrapper" style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      
      {/* Modal Container */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        maxWidth: '1000px',
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid #cbd5e1',
        overflow: 'hidden'
      }}>
        
        {/* MODAL HEADER (Hidden on Print) */}
        <div className="no-print" style={{
          padding: '16px 24px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px' }}>
              <Award size={22} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold' }}>
                Phiếu Đánh Giá, Xếp Loại Viên Chức Hàng Tháng (Mẫu Sở GD&ĐT Đắk Lắk)
              </h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#93c5fd' }}>
                Giáo viên: <strong>{formData.teacher_name}</strong> • {formData.department} • {evaluationMonth} ({schoolYear})
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
              }}
            >
              <Printer size={16} /> In Phiếu Chuẩn A4
            </button>
            <button
              type="button"
              onClick={() => handleSaveEvaluationData(formData.status)}
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <Save size={16} /> {submitting ? 'Đang lưu...' : 'Lưu Đánh Giá'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* MODAL BODY (Scrollable Screen View & Printable Paper Form) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#f8fafc' }}>
          
          {/* Printable Document Sheet */}
          <div ref={printRef} className="daklak-print-paper" style={{
            background: 'white',
            maxWidth: '850px',
            margin: '0 auto',
            padding: '36px 40px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            borderRadius: '8px',
            fontFamily: '"Times New Roman", Times, serif',
            color: '#000000',
            lineHeight: 1.4
          }}>

            {/* ============================================================== */}
            {/* TRANG 1: TIÊU CHÍ CHUNG & KẾT QUẢ THỰC HIỆN NHIỆM VỤ           */}
            {/* ============================================================== */}
            <div className="print-page-1">
              
              {/* Header Quốc hiệu & Đơn vị */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '45%', textAlign: 'center', verticalAlign: 'top', fontSize: '13pt', fontWeight: 'bold' }}>
                      SỞ GD&ĐT TỈNH ĐẮK LẮK<br />
                      <span style={{ textDecoration: 'underline' }}>TRƯỜNG THPT CAO BÁ QUÁT</span>
                    </td>
                    <td style={{ width: '55%', textAlign: 'center', verticalAlign: 'top', fontSize: '12pt', fontWeight: 'bold' }}>
                      CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM<br />
                      <span style={{ fontSize: '13pt', textDecoration: 'underline' }}>Độc lập - Tự do - Hạnh phúc</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Document Title */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '15pt', fontWeight: 'bold', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                  PHIẾU ĐÁNH GIÁ, XẾP LOẠI HÀNG THÁNG (CB-GV-NV)
                </h2>
                <div style={{ fontSize: '13pt', fontWeight: 'bold', fontStyle: 'italic', marginBottom: '10px' }}>
                  Tháng: {evaluationMonth.replace('Tháng ', '')} / {evalYearNum}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', fontSize: '13pt', marginTop: '6px' }}>
                  <div>- Họ và tên: <span style={{ fontWeight: 'bold', color: '#002277' }}>{formData.teacher_name}</span></div>
                  <div>- Chức vụ: <span>{formData.teacher_title}</span></div>
                </div>
              </div>

              {/* Main Evaluation Table (Trang 1) */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt', border: '1px solid black', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', fontWeight: 'bold', textAlign: 'center' }}>
                    <th style={{ border: '1px solid black', padding: '6px 4px', width: '40px' }} rowSpan={2}>STT</th>
                    <th style={{ border: '1px solid black', padding: '6px 8px' }} rowSpan={2}>Nội dung đánh giá</th>
                    <th style={{ border: '1px solid black', padding: '6px 4px', width: '100px' }} rowSpan={2}>Điểm (mức)</th>
                    <th style={{ border: '1px solid black', padding: '6px 4px', width: '160px' }} colSpan={2}>Kết quả đánh giá</th>
                  </tr>
                  <tr style={{ background: '#f8fafc', fontWeight: 'bold', textAlign: 'center' }}>
                    <th style={{ border: '1px solid black', padding: '4px', width: '80px', fontSize: '11pt' }}>Cá nhân tự đánh giá</th>
                    <th style={{ border: '1px solid black', padding: '4px', width: '80px', fontSize: '11pt' }}>Cấp trên trực tiếp đánh giá</th>
                  </tr>
                </thead>
                <tbody>
                  
                  {/* PHẦN I: TIÊU CHÍ CHUNG */}
                  <tr style={{ fontWeight: 'bold', background: '#f1f5f9' }}>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '6px' }}>I</td>
                    <td style={{ border: '1px solid black', padding: '6px 8px' }} colSpan={4}>
                      TIÊU CHÍ CHUNG
                    </td>
                  </tr>

                  {/* 1. Chính trị, tư tưởng */}
                  <tr>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'top', padding: '6px', fontWeight: 'bold' }}>1</td>
                    <td style={{ border: '1px solid black', padding: '6px 8px', textAlign: 'justify' }}>
                      <strong>Chính trị, tư tưởng:</strong><br />
                      - Chấp hành chủ trương, đường lối, quy định của Đảng, chính sách, pháp luật của Nhà nước và các nguyên tắc tổ chức, kỷ luật của Đảng, nhất là nguyên tắc tập trung dân chủ, tự phê bình và phê bình;<br />
                      - Có quan điểm, bản lĩnh chính trị vững vàng; kiên định lập trường; không dao động trước mọi khó khăn, thách thức;<br />
                      - Đặt lợi ích của Đảng, quốc gia - dân tộc, nhân dân, tập thể lên trên lợi ích cá nhân;<br />
                      - Có ý thức nghiên cứu, học tập, vận dụng chủ nghĩa Mác - Lênin, tư tưởng Hồ Chí Minh, nghị quyết, chỉ thị, quyết định và các văn bản của Đảng.
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'middle', padding: '6px', fontWeight: 'bold' }}>
                      Đạt<br /><span style={{ fontSize: '10pt', fontWeight: 'normal' }}>(Chưa đạt)</span>
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'middle', padding: '4px' }}>
                      <select
                        value={formData.self_crit_1}
                        onChange={(e) => setFormData(p => ({ ...p, self_crit_1: e.target.value }))}
                        className="eval-select"
                        style={{ width: '100%', padding: '4px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', color: '#002277' }}
                      >
                        <option value="Đạt">Đạt</option>
                        <option value="Chưa đạt">Chưa đạt</option>
                      </select>
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'middle', padding: '4px' }}>
                      <select
                        value={formData.manager_crit_1}
                        onChange={(e) => setFormData(p => ({ ...p, manager_crit_1: e.target.value }))}
                        className="eval-select"
                        style={{ width: '100%', padding: '4px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', color: '#002277' }}
                      >
                        <option value="Đạt">Đạt</option>
                        <option value="Chưa đạt">Chưa đạt</option>
                      </select>
                    </td>
                  </tr>

                  {/* 2. Đạo đức, lối sống */}
                  <tr>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'top', padding: '6px', fontWeight: 'bold' }}>2</td>
                    <td style={{ border: '1px solid black', padding: '6px 8px', textAlign: 'justify' }}>
                      <strong>Đạo đức, lối sống:</strong><br />
                      - Không tham ô, tham nhũng, tiêu cực, lãng phí, quan liêu, cơ hội, vụ lợi, hách dịch, cửa quyền; không có biểu hiện suy thoái về đạo đức, lối sống, tự diễn biến, tự chuyển hóa;<br />
                      - Có lối sống trung thực, khiêm tốn, chân thành, trong sáng, giản dị;<br />
                      - Có tinh thần đoàn kết, xây dựng cơ quan, tổ chức, đơn vị trong sạch, vững mạnh;<br />
                      - Không để người thân, người quen lợi dụng chức vụ, quyền hạn của mình để trục lợi.
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'middle', padding: '6px', fontWeight: 'bold' }}>
                      Đạt<br /><span style={{ fontSize: '10pt', fontWeight: 'normal' }}>(Chưa đạt)</span>
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'middle', padding: '4px' }}>
                      <select
                        value={formData.self_crit_2}
                        onChange={(e) => setFormData(p => ({ ...p, self_crit_2: e.target.value }))}
                        className="eval-select"
                        style={{ width: '100%', padding: '4px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', color: '#002277' }}
                      >
                        <option value="Đạt">Đạt</option>
                        <option value="Chưa đạt">Chưa đạt</option>
                      </select>
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'middle', padding: '4px' }}>
                      <select
                        value={formData.manager_crit_2}
                        onChange={(e) => setFormData(p => ({ ...p, manager_crit_2: e.target.value }))}
                        className="eval-select"
                        style={{ width: '100%', padding: '4px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', color: '#002277' }}
                      >
                        <option value="Đạt">Đạt</option>
                        <option value="Chưa đạt">Chưa đạt</option>
                      </select>
                    </td>
                  </tr>

                  {/* 3. Tác phong, lề lối làm việc */}
                  <tr>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'top', padding: '6px', fontWeight: 'bold' }}>3</td>
                    <td style={{ border: '1px solid black', padding: '6px 8px', textAlign: 'justify' }}>
                      <strong>Tác phong, lề lối làm việc:</strong><br />
                      - Có trách nhiệm với công việc; năng động, sáng tạo, dám nghĩ, dám làm, linh hoạt trong thực hiện nhiệm vụ;<br />
                      - Phương pháp làm việc khoa học, dân chủ, đúng nguyên tắc;<br />
                      - Có tinh thần trách nhiệm và phối hợp trong thực hiện nhiệm vụ;<br />
                      - Có thái độ đúng mực và phong cách ứng xử, lề lối làm việc chuẩn mực, đáp ứng yêu cầu của văn hóa công vụ.
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'middle', padding: '6px', fontWeight: 'bold' }}>
                      Đạt<br /><span style={{ fontSize: '10pt', fontWeight: 'normal' }}>(Chưa đạt)</span>
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'middle', padding: '4px' }}>
                      <select
                        value={formData.self_crit_3}
                        onChange={(e) => setFormData(p => ({ ...p, self_crit_3: e.target.value }))}
                        className="eval-select"
                        style={{ width: '100%', padding: '4px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', color: '#002277' }}
                      >
                        <option value="Đạt">Đạt</option>
                        <option value="Chưa đạt">Chưa đạt</option>
                      </select>
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'middle', padding: '4px' }}>
                      <select
                        value={formData.manager_crit_3}
                        onChange={(e) => setFormData(p => ({ ...p, manager_crit_3: e.target.value }))}
                        className="eval-select"
                        style={{ width: '100%', padding: '4px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', color: '#002277' }}
                      >
                        <option value="Đạt">Đạt</option>
                        <option value="Chưa đạt">Chưa đạt</option>
                      </select>
                    </td>
                  </tr>

                  {/* PHẦN II: KẾT QUẢ THỰC HIỆN NHIỆM VỤ */}
                  <tr style={{ fontWeight: 'bold', background: '#f1f5f9' }}>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '6px' }}>II</td>
                    <td style={{ border: '1px solid black', padding: '6px 8px' }}>
                      KẾT QUẢ THỰC HIỆN NHIỆM VỤ
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '6px' }}>100</td>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '6px' }}>
                      <input
                        type="number"
                        value={formData.self_base_score}
                        onChange={(e) => handleSelfScoreChange('self_base_score', e.target.value)}
                        style={{ width: '50px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '12pt' }}
                      />
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '6px' }}>
                      <input
                        type="number"
                        value={formData.manager_base_score}
                        onChange={(e) => handleManagerScoreChange('manager_base_score', e.target.value)}
                        style={{ width: '50px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '12pt' }}
                      />
                    </td>
                  </tr>

                  {/* Điểm trừ */}
                  <tr>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '6px' }}></td>
                    <td style={{ border: '1px solid black', padding: '6px 8px' }}>
                      Điểm trừ
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '6px' }}>0</td>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '6px' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.self_minus_score}
                        onChange={(e) => handleSelfScoreChange('self_minus_score', e.target.value)}
                        style={{ width: '50px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', color: '#b91c1c' }}
                      />
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '6px' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.manager_minus_score}
                        onChange={(e) => handleManagerScoreChange('manager_minus_score', e.target.value)}
                        style={{ width: '50px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', color: '#b91c1c' }}
                      />
                    </td>
                  </tr>

                </tbody>
              </table>

              {/* Page Number 1 Footer */}
              <div style={{ textAlign: 'center', fontSize: '11pt', marginTop: '10px' }}>1</div>

            </div>

            {/* PAGE BREAK FOR PRINTING */}
            <div className="page-break" style={{ pageBreakBefore: 'always', margin: '30px 0', borderTop: '2px dashed #cbd5e1' }}></div>

            {/* ============================================================== */}
            {/* TRANG 2: TỔNG ĐIỂM, XẾP LOẠI & 3 CẤP KÝ DUYỆT                 */}
            {/* ============================================================== */}
            <div className="print-page-2" style={{ paddingTop: '20px' }}>
              
              {/* Summary Table Row continuation */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt', border: '1px solid black', marginBottom: '20px' }}>
                <tbody>
                  {/* Điểm cộng */}
                  <tr>
                    <td style={{ border: '1px solid black', textAlign: 'center', width: '40px', padding: '6px' }}></td>
                    <td style={{ border: '1px solid black', padding: '6px 8px' }}>
                      Điểm cộng
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', width: '100px', padding: '6px' }}>0</td>
                    <td style={{ border: '1px solid black', textAlign: 'center', width: '80px', padding: '6px' }}>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={formData.self_plus_score}
                        onChange={(e) => handleSelfScoreChange('self_plus_score', e.target.value)}
                        style={{ width: '50px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', color: '#15803d' }}
                      />
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', width: '80px', padding: '6px' }}>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={formData.manager_plus_score}
                        onChange={(e) => handleManagerScoreChange('manager_plus_score', e.target.value)}
                        style={{ width: '50px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', color: '#15803d' }}
                      />
                    </td>
                  </tr>

                  {/* Tổng điểm */}
                  <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '6px' }}></td>
                    <td style={{ border: '1px solid black', padding: '6px 8px' }}>
                      Tổng điểm
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '6px' }}>100</td>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '6px', fontSize: '13pt', color: '#002277' }}>
                      {formData.self_total_score}
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '6px', fontSize: '13pt', color: '#002277' }}>
                      {formData.manager_total_score}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Mức tự cá nhân đánh giá, xếp loại */}
              <div style={{ marginBottom: '16px', fontSize: '12pt', lineHeight: 1.5 }}>
                <p style={{ margin: '0 0 6px 0', textIndent: '20px' }}>
                  <strong>- Mức tự cá nhân đánh giá, xếp loại:</strong> <span style={{ fontWeight: 'bold', color: '#002277', textDecoration: 'underline' }}>{formData.self_classification}</span>, đạt <span style={{ fontWeight: 'bold' }}>{formData.self_total_score}</span> điểm.
                </p>
                <div style={{ paddingLeft: '20px', fontSize: '11.5pt', color: '#334155' }}>
                  <p style={{ margin: '2px 0' }}><em>+ Hoàn thành xuất sắc nhiệm vụ:</em> Các tiêu chí chung đều đạt và có tổng điểm từ 100 điểm trở lên.</p>
                  <p style={{ margin: '2px 0' }}><em>+ Hoàn thành tốt nhiệm vụ:</em> Các tiêu chí chung đều đạt và có tổng điểm từ 90 điểm trở lên.</p>
                  <p style={{ margin: '2px 0' }}><em>+ Hoàn thành nhiệm vụ:</em> Các tiêu chí chung đều đạt và có tổng điểm từ 80 điểm trở lên.</p>
                  <p style={{ margin: '2px 0' }}><em>+ Không hoàn thành nhiệm vụ:</em> Các trường hợp còn lại.</p>
                </div>
              </div>

              {/* Chữ ký Giáo viên tự đánh giá */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <div style={{ textAlign: 'center', width: '280px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>Người tự đánh giá</div>
                  <div style={{ fontSize: '11pt', fontStyle: 'italic', marginBottom: '8px' }}>(Ký và ghi rõ họ tên)</div>

                  {/* Interactive Signature Area */}
                  <div style={{ minHeight: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {formData.self_signature ? (
                      <div>
                        <img 
                          src={formData.self_signature} 
                          alt="Chữ ký giáo viên" 
                          style={{ maxHeight: '70px', maxWidth: '180px', objectFit: 'contain' }} 
                        />
                        <div className="no-print" style={{ marginTop: '4px' }}>
                          <button
                            type="button"
                            onClick={() => openSignaturePad('self')}
                            style={{ fontSize: '11px', color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Ký lại
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="no-print">
                        <button
                          type="button"
                          onClick={() => openSignaturePad('self')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: '#e0f2fe',
                            color: '#0284c7',
                            border: '1px dashed #0284c7',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          <PenTool size={14} /> Bấm để ký trên màn hình
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ fontWeight: 'bold', fontSize: '13pt', color: '#002277', marginTop: '6px' }}>
                    {formData.self_signer_name || formData.teacher_name}
                  </div>
                </div>
              </div>

              {/* NHẬN XÉT, ĐÁNH GIÁ CỦA LÃNH ĐẠO TRỰC TIẾP QUẢN LÝ (TTCM) */}
              <div style={{ borderTop: '1px dotted #64748b', paddingTop: '12px', marginBottom: '20px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12pt', marginBottom: '8px' }}>
                  * NHẬN XÉT, ĐÁNH GIÁ CỦA LÃNH ĐẠO TRỰC TIẾP QUẢN LÝ
                </div>
                
                <div style={{ fontSize: '12pt', marginBottom: '8px' }}>
                  - Đánh giá, xếp loại: VC <strong style={{ color: '#002277' }}>{formData.teacher_name}</strong>: {' '}
                  <span style={{ fontWeight: 'bold', textDecoration: 'underline', color: '#002277' }}>
                    {formData.manager_classification}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <div style={{ textAlign: 'center', width: '280px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>Tổ trưởng</div>
                    <div style={{ fontSize: '11pt', fontStyle: 'italic', marginBottom: '8px' }}>(Ký và ghi rõ họ tên)</div>

                    {/* Interactive TTCM Signature Area */}
                    <div style={{ minHeight: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      {formData.manager_signature ? (
                        <div>
                          <img 
                            src={formData.manager_signature} 
                            alt="Chữ ký tổ trưởng" 
                            style={{ maxHeight: '70px', maxWidth: '180px', objectFit: 'contain' }} 
                          />
                          <div className="no-print" style={{ marginTop: '4px' }}>
                            <button
                              type="button"
                              onClick={() => openSignaturePad('manager')}
                              style={{ fontSize: '11px', color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              Ký lại
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="no-print">
                          <button
                            type="button"
                            onClick={() => openSignaturePad('manager')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              background: '#fef3c7',
                              color: '#b45309',
                              border: '1px dashed #f59e0b',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            <PenTool size={14} /> TTCM Ký phê duyệt
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ fontWeight: 'bold', fontSize: '13pt', color: '#002277', marginTop: '6px' }}>
                      {formData.manager_signer_name || 'Trần Thị Quế Quyên'}
                    </div>
                  </div>
                </div>
              </div>

              {/* NHẬN XÉT, ĐÁNH GIÁ CỦA TẬP THỂ LÃNH ĐẠO CƠ QUAN, ĐƠN VỊ */}
              <div style={{ borderTop: '1px dotted #64748b', paddingTop: '12px', marginBottom: '20px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12pt', marginBottom: '8px' }}>
                  * NHẬN XÉT, ĐÁNH GIÁ CỦA TẬP THỂ LÃNH ĐẠO CƠ QUAN, ĐƠN VỊ
                </div>
                
                <div style={{ fontSize: '12pt', marginBottom: '16px' }}>
                  Kết luận: VC <strong style={{ color: '#002277' }}>{formData.teacher_name}</strong>: {' '}
                  <span style={{ fontWeight: 'bold', textDecoration: 'underline', color: '#002277' }}>
                    {formData.principal_conclusion || formData.manager_classification}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <div style={{ textAlign: 'center', width: '320px' }}>
                    <div style={{ fontStyle: 'italic', fontSize: '12pt', marginBottom: '4px' }}>
                      Ngày ..... tháng ..... năm {evalYearNum}
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '13pt' }}>Hiệu trưởng</div>
                    <div style={{ fontSize: '11pt', fontStyle: 'italic', marginBottom: '50px' }}>(Ký tên, đóng dấu)</div>

                    <div style={{ fontWeight: 'bold', fontSize: '13pt', color: '#002277' }}>
                      {formData.principal_signer_name || ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Page Number 2 Footer */}
              <div style={{ textAlign: 'center', fontSize: '11pt', marginTop: '20px' }}>2</div>

            </div>

          </div>

        </div>

        {/* MODAL FOOTER CONTROLS */}
        <div className="no-print" style={{
          padding: '14px 24px',
          background: 'white',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>
              Trạng thái số:
            </span>
            <span style={{
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
              background: formData.manager_signature ? '#dcfce7' : formData.self_signature ? '#e0f2fe' : '#f1f5f9',
              color: formData.manager_signature ? '#15803d' : formData.self_signature ? '#0369a1' : '#64748b'
            }}>
              {formData.manager_signature ? '✅ TTCM Đã Phê Duyệt & Ký Số' : formData.self_signature ? '📝 Giáo Viên Đã Ký Tên (Chờ TTCM)' : '⏳ Bản Nháp Chưa Ký'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={() => handleSaveEvaluationData('SUBMITTED_TEACHER')}
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
              }}
            >
              <Send size={15} /> Gửi Tổ Trưởng Duyệt
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                background: '#0f172a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <Printer size={15} /> In Phiếu (2 Trang A4)
            </button>
          </div>

        </div>

      </div>

      {/* SIGNATURE PAD MODAL */}
      {sigModalOpen && (
        <SignaturePadModal
          isOpen={sigModalOpen}
          onClose={() => setSigModalOpen(false)}
          onSaveSignature={handleSaveSignature}
          initialSignature={
            sigTargetRole === 'self' ? formData.self_signature :
            sigTargetRole === 'manager' ? formData.manager_signature :
            formData.principal_signature
          }
          signerName={
            sigTargetRole === 'self' ? formData.teacher_name :
            sigTargetRole === 'manager' ? (currentTeacher?.full_name || formData.manager_signer_name) :
            'Hiệu trưởng'
          }
          signerTitle={
            sigTargetRole === 'self' ? 'Giáo viên tự đánh giá' :
            sigTargetRole === 'manager' ? 'Tổ trưởng chuyên môn' :
            'Hiệu trưởng phê duyệt'
          }
        />
      )}

      {/* Embedded CSS for High Quality Standard A4 Print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .daklak-evaluation-modal-wrapper,
          .daklak-evaluation-modal-wrapper * {
            visibility: visible;
          }
          .daklak-evaluation-modal-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .daklak-print-paper {
            box-shadow: none !important;
            padding: 20mm 15mm !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .page-break {
            page-break-before: always !important;
            border-top: none !important;
            margin: 0 !important;
          }
          select.eval-select {
            appearance: none !important;
            -webkit-appearance: none !important;
            border: none !important;
          }
        }
      `}} />

    </div>
  );
}
