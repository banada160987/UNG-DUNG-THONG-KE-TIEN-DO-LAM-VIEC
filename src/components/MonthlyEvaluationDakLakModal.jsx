import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, Check, Printer, PenTool, Save, Send, ShieldCheck, 
  Award, AlertTriangle, FileText, CheckCircle2, User, ChevronRight,
  Sparkles, RefreshCw, Trash2, Download
} from 'lucide-react';
import SignaturePadModal from './SignaturePadModal';
import { exportMonthlyEvaluationToWordDecree30 } from '../utils/decree30KpiWord';

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
    teacher_name: '',
    teacher_title: 'Giáo viên',
    department: '',
    evaluation_month: 'Tháng 6',
    school_year: '2025-2026',
    eval_year: '2026',

    self_crit_1: 'Đạt',
    self_crit_2: 'Đạt',
    self_crit_3: 'Đạt',

    manager_crit_1: 'Đạt',
    manager_crit_2: 'Đạt',
    manager_crit_3: 'Đạt',

    self_base_score: 100,
    self_minus_score: 0,
    self_plus_score: 0,
    self_total_score: 100,

    manager_base_score: 100,
    manager_minus_score: 0,
    manager_plus_score: 0,
    manager_total_score: 100,

    self_classification: 'Hoàn thành tốt nhiệm vụ',
    manager_classification: 'Hoàn thành tốt nhiệm vụ',
    manager_comments: 'Đồng chí hoàn thành tốt mọi nhiệm vụ giảng dạy và công tác được phân công trong tháng.',
    principal_comments: '',
    principal_conclusion: 'Hoàn thành tốt nhiệm vụ',

    self_signature: null,
    self_signed_date: '',
    self_signer_name: '',

    manager_signature: null,
    manager_signed_date: '',
    manager_signer_name: 'Trần Thị Quế Quyên',

    principal_signature: null,
    principal_signed_date: '',
    principal_signer_name: '',

    status: 'DRAFT'
  });

  const [sigModalOpen, setSigModalOpen] = useState(false);
  const [sigTargetRole, setSigTargetRole] = useState('self');
  const [submitting, setSubmitting] = useState(false);

  const evalYearNum = useMemo(() => {
    if (schoolYear && schoolYear.includes('-')) {
      return schoolYear.split('-')[1] || '2026';
    }
    return '2026';
  }, [schoolYear]);

  const monthNum = useMemo(() => {
    return evaluationMonth.replace('Tháng ', '');
  }, [evaluationMonth]);

  useEffect(() => {
    if (!isOpen || !teacherData) return;

    const teacherName = teacherData.teacher_name || teacherData.name || '';
    const title = teacherData.teacher_title || teacherData.title || 'Giáo viên';
    const dept = departmentName || teacherData.department_name || teacherData.department || 'Tổ Chuyên Môn';

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

  const openSignaturePad = (role) => {
    setSigTargetRole(role);
    setSigModalOpen(true);
  };

  const handleSaveSignature = (signatureDataUrl) => {
    if (sigTargetRole === 'self') {
      setFormData(prev => ({
        ...prev,
        self_signature: signatureDataUrl,
        self_signer_name: prev.teacher_name,
        self_signed_date: new Date().toLocaleDateString('vi-VN')
      }));
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

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    exportMonthlyEvaluationToWordDecree30(formData);
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
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid #cbd5e1',
        overflow: 'hidden'
      }}>
        
        {/* MODAL HEADER (Hidden on Print) */}
        <div className="no-print" style={{
          padding: '14px 20px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px' }}>
              <Award size={20} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                Phiếu Đánh Giá Viên Chức Hàng Tháng (Chuẩn Nghị Định 30)
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#93c5fd' }}>
                Giáo viên: <strong>{formData.teacher_name}</strong> • {formData.department} • Tháng {monthNum}/{evalYearNum}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleExportWord}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37,99,235,0.3)'
              }}
              title="Xuất văn bản Word (.doc) căn lề và định dạng chuẩn Nghị định 30/2020/NĐ-CP"
            >
              <Download size={15} /> Xuất Word (NĐ 30)
            </button>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                background: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <Printer size={15} /> In Phiếu A4
            </button>
            <button
              type="button"
              onClick={() => handleSaveEvaluationData(formData.status)}
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                background: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <Save size={15} /> {submitting ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '7px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL BODY (Print Paper A4 Standard) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#e2e8f0', display: 'flex', justifyContent: 'center' }}>
          
          <div ref={printRef} className="daklak-print-paper" style={{
            background: 'white',
            width: '100%',
            maxWidth: '794px', // 210mm at 96dpi
            minHeight: '1123px',
            padding: '40px 48px', // Standard margins (Top 20mm, Left 30mm, Right 15mm, Bottom 20mm)
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            borderRadius: '4px',
            fontFamily: '"Times New Roman", Times, serif',
            color: '#000000',
            lineHeight: 1.35,
            boxSizing: 'border-box'
          }}>

            {/* TRANG 1 */}
            <div className="print-page-1">
              
              {/* Header Quốc hiệu & Đơn vị (Chuẩn NĐ 30) */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', tableLayout: 'fixed' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '45%', textAlign: 'center', verticalAlign: 'top', fontSize: '12pt', fontWeight: 'bold' }}>
                      SỞ GD&ĐT TỈNH ĐẮK LẮK<br />
                      <span style={{ textDecoration: 'underline' }}>TRƯỜNG THPT CAO BÁ QUÁT</span>
                    </td>
                    <td style={{ width: '55%', textAlign: 'center', verticalAlign: 'top', fontSize: '11pt', fontWeight: 'bold' }}>
                      CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM<br />
                      <span style={{ fontSize: '12pt', textDecoration: 'underline' }}>Độc lập - Tự do - Hạnh phúc</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Document Title */}
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                  PHIẾU ĐÁNH GIÁ, XẾP LOẠI HÀNG THÁNG (CB-GV-NV)
                </h2>
                <div style={{ fontSize: '12.5pt', fontWeight: 'bold', fontStyle: 'italic', marginBottom: '8px' }}>
                  Tháng: {monthNum} / {evalYearNum}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '12.5pt', marginTop: '4px' }}>
                  <div>- Họ và tên: <span style={{ fontWeight: 'bold', color: '#002277' }}>{formData.teacher_name}</span></div>
                  <div>- Chức vụ: <span>{formData.teacher_title}</span></div>
                </div>
              </div>

              {/* Main Evaluation Table (Trang 1) */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt', border: '1px solid black', marginBottom: '14px', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', fontWeight: 'bold', textAlign: 'center' }}>
                    <th style={{ border: '1px solid black', padding: '5px 2px', width: '6%' }} rowSpan={2}>STT</th>
                    <th style={{ border: '1px solid black', padding: '5px 6px', width: '52%' }} rowSpan={2}>Nội dung đánh giá</th>
                    <th style={{ border: '1px solid black', padding: '5px 4px', width: '14%' }} rowSpan={2}>Điểm (mức)</th>
                    <th style={{ border: '1px solid black', padding: '5px 4px', width: '28%' }} colSpan={2}>Kết quả đánh giá</th>
                  </tr>
                  <tr style={{ background: '#f8fafc', fontWeight: 'bold', textAlign: 'center' }}>
                    <th style={{ border: '1px solid black', padding: '3px 2px', width: '14%', fontSize: '10pt' }}>Cá nhân tự đánh giá</th>
                    <th style={{ border: '1px solid black', padding: '3px 2px', width: '14%', fontSize: '10pt' }}>Cấp trên trực tiếp đánh giá</th>
                  </tr>
                </thead>
                <tbody>
                  
                  {/* PHẦN I */}
                  <tr style={{ fontWeight: 'bold', background: '#f1f5f9' }}>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '5px' }}>I</td>
                    <td style={{ border: '1px solid black', padding: '5px 6px' }} colSpan={4}>
                      TIÊU CHÍ CHUNG
                    </td>
                  </tr>

                  {/* 1. Chính trị, tư tưởng */}
                  <tr>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'top', padding: '5px', fontWeight: 'bold' }}>1</td>
                    <td style={{ border: '1px solid black', padding: '5px 6px', textAlign: 'justify' }}>
                      <strong>Chính trị, tư tưởng:</strong><br />
                      - Chấp hành chủ trương, đường lối, quy định của Đảng, chính sách, pháp luật của Nhà nước và các nguyên tắc tổ chức, kỷ luật của Đảng, nhất là nguyên tắc tập trung dân chủ, tự phê bình và phê bình;<br />
                      - Có quan điểm, bản lĩnh chính trị vững vàng; kiên định lập trường; không dao động trước mọi khó khăn, thách thức;<br />
                      - Đặt lợi ích của Đảng, quốc gia - dân tộc, nhân dân, tập thể lên trên lợi ích cá nhân;<br />
                      - Có ý thức nghiên cứu, học tập, vận dụng chủ nghĩa Mác - Lênin, tư tưởng Hồ Chí Minh, nghị quyết, chỉ thị, quyết định và các văn bản của Đảng.
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'middle', padding: '5px', fontWeight: 'bold' }}>
                      Đạt<br /><span style={{ fontSize: '9.5pt', fontWeight: 'normal' }}>(Chưa đạt)</span>
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'middle', padding: '2px' }}>
                      <select
                        value={formData.self_crit_1}
                        onChange={(e) => setFormData(p => ({ ...p, self_crit_1: e.target.value }))}
                        className="eval-select"
                        style={{ width: '100%', padding: '3px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '11.5pt', color: '#002277' }}
                      >
                        <option value="Đạt">Đạt</option>
                        <option value="Chưa đạt">Chưa đạt</option>
                      </select>
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'middle', padding: '2px' }}>
                      <select
                        value={formData.manager_crit_1}
                        onChange={(e) => setFormData(p => ({ ...p, manager_crit_1: e.target.value }))}
                        className="eval-select"
                        style={{ width: '100%', padding: '3px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '11.5pt', color: '#002277' }}
                      >
                        <option value="Đạt">Đạt</option>
                        <option value="Chưa đạt">Chưa đạt</option>
                      </select>
                    </td>
                  </tr>

                  {/* 2. Đạo đức, lối sống */}
                  <tr>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'top', padding: '5px', fontWeight: 'bold' }}>2</td>
                    <td style={{ border: '1px solid black', padding: '5px 6px', textAlign: 'justify' }}>
                      <strong>Đạo đức, lối sống:</strong><br />
                      - Không tham ô, tham nhũng, tiêu cực, lãng phí, quan liêu, cơ hội, vụ lợi, hách dịch, cửa quyền; không có biểu hiện suy thoái về đạo đức, lối sống, tự diễn biến, tự chuyển hóa;<br />
                      - Có lối sống trung thực, khiêm tốn, chân thành, trong sáng, giản dị;<br />
                      - Có tinh thần đoàn kết, xây dựng cơ quan, tổ chức, đơn vị trong sạch, vững mạnh;<br />
                      - Không để người thân, người quen lợi dụng chức vụ, quyền hạn của mình để trục lợi.
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'middle', padding: '5px', fontWeight: 'bold' }}>
                      Đạt<br /><span style={{ fontSize: '9.5pt', fontWeight: 'normal' }}>(Chưa đạt)</span>
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'middle', padding: '2px' }}>
                      <select
                        value={formData.self_crit_2}
                        onChange={(e) => setFormData(p => ({ ...p, self_crit_2: e.target.value }))}
                        className="eval-select"
                        style={{ width: '100%', padding: '3px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '11.5pt', color: '#002277' }}
                      >
                        <option value="Đạt">Đạt</option>
                        <option value="Chưa đạt">Chưa đạt</option>
                      </select>
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'middle', padding: '2px' }}>
                      <select
                        value={formData.manager_crit_2}
                        onChange={(e) => setFormData(p => ({ ...p, manager_crit_2: e.target.value }))}
                        className="eval-select"
                        style={{ width: '100%', padding: '3px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '11.5pt', color: '#002277' }}
                      >
                        <option value="Đạt">Đạt</option>
                        <option value="Chưa đạt">Chưa đạt</option>
                      </select>
                    </td>
                  </tr>

                  {/* 3. Tác phong, lề lối làm việc */}
                  <tr>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'top', padding: '5px', fontWeight: 'bold' }}>3</td>
                    <td style={{ border: '1px solid black', padding: '5px 6px', textAlign: 'justify' }}>
                      <strong>Tác phong, lề lối làm việc:</strong><br />
                      - Có trách nhiệm với công việc; năng động, sáng tạo, dám nghĩ, dám làm, linh hoạt trong thực hiện nhiệm vụ;<br />
                      - Phương pháp làm việc khoa học, dân chủ, đúng nguyên tắc;<br />
                      - Có tinh thần trách nhiệm và phối hợp trong thực hiện nhiệm vụ;<br />
                      - Có thái độ đúng mực và phong cách ứng xử, lề lối làm việc chuẩn mực, đáp ứng yêu cầu của văn hóa công vụ.
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'middle', padding: '5px', fontWeight: 'bold' }}>
                      Đạt<br /><span style={{ fontSize: '9.5pt', fontWeight: 'normal' }}>(Chưa đạt)</span>
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'middle', padding: '2px' }}>
                      <select
                        value={formData.self_crit_3}
                        onChange={(e) => setFormData(p => ({ ...p, self_crit_3: e.target.value }))}
                        className="eval-select"
                        style={{ width: '100%', padding: '3px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '11.5pt', color: '#002277' }}
                      >
                        <option value="Đạt">Đạt</option>
                        <option value="Chưa đạt">Chưa đạt</option>
                      </select>
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', verticalAlign: 'middle', padding: '2px' }}>
                      <select
                        value={formData.manager_crit_3}
                        onChange={(e) => setFormData(p => ({ ...p, manager_crit_3: e.target.value }))}
                        className="eval-select"
                        style={{ width: '100%', padding: '3px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '11.5pt', color: '#002277' }}
                      >
                        <option value="Đạt">Đạt</option>
                        <option value="Chưa đạt">Chưa đạt</option>
                      </select>
                    </td>
                  </tr>

                  {/* PHẦN II */}
                  <tr style={{ fontWeight: 'bold', background: '#f1f5f9' }}>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '5px' }}>II</td>
                    <td style={{ border: '1px solid black', padding: '5px 6px' }}>
                      KẾT QUẢ THỰC HIỆN NHIỆM VỤ
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '5px' }}>100</td>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '5px' }}>
                      <input
                        type="number"
                        value={formData.self_base_score}
                        onChange={(e) => handleSelfScoreChange('self_base_score', e.target.value)}
                        style={{ width: '40px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '11.5pt' }}
                      />
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '5px' }}>
                      <input
                        type="number"
                        value={formData.manager_base_score}
                        onChange={(e) => handleManagerScoreChange('manager_base_score', e.target.value)}
                        style={{ width: '40px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '11.5pt' }}
                      />
                    </td>
                  </tr>

                  {/* Điểm trừ */}
                  <tr>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '5px' }}></td>
                    <td style={{ border: '1px solid black', padding: '5px 6px' }}>
                      Điểm trừ
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '5px' }}>0</td>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '5px' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.self_minus_score}
                        onChange={(e) => handleSelfScoreChange('self_minus_score', e.target.value)}
                        style={{ width: '40px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '11.5pt', color: '#b91c1c' }}
                      />
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '5px' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.manager_minus_score}
                        onChange={(e) => handleManagerScoreChange('manager_minus_score', e.target.value)}
                        style={{ width: '40px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '11.5pt', color: '#b91c1c' }}
                      />
                    </td>
                  </tr>

                </tbody>
              </table>

              <div style={{ textAlign: 'center', fontSize: '11pt', marginTop: '8px' }}>1</div>

            </div>

            {/* PAGE BREAK */}
            <div className="page-break" style={{ pageBreakBefore: 'always', margin: '24px 0', borderTop: '2px dashed #94a3b8' }}></div>

            {/* TRANG 2 */}
            <div className="print-page-2" style={{ paddingTop: '10px' }}>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt', border: '1px solid black', marginBottom: '16px', tableLayout: 'fixed' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid black', textAlign: 'center', width: '6%', padding: '5px' }}></td>
                    <td style={{ border: '1px solid black', padding: '5px 6px', width: '52%' }}>
                      Điểm cộng
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', width: '14%', padding: '5px' }}>0</td>
                    <td style={{ border: '1px solid black', textAlign: 'center', width: '14%', padding: '5px' }}>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={formData.self_plus_score}
                        onChange={(e) => handleSelfScoreChange('self_plus_score', e.target.value)}
                        style={{ width: '40px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '11.5pt', color: '#15803d' }}
                      />
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', width: '14%', padding: '5px' }}>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={formData.manager_plus_score}
                        onChange={(e) => handleManagerScoreChange('manager_plus_score', e.target.value)}
                        style={{ width: '40px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold', fontSize: '11.5pt', color: '#15803d' }}
                      />
                    </td>
                  </tr>

                  <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '5px' }}></td>
                    <td style={{ border: '1px solid black', padding: '5px 6px' }}>
                      Tổng điểm
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '5px' }}>100</td>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '5px', fontSize: '12pt', color: '#002277' }}>
                      {formData.self_total_score}
                    </td>
                    <td style={{ border: '1px solid black', textAlign: 'center', padding: '5px', fontSize: '12pt', color: '#002277' }}>
                      {formData.manager_total_score}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Mức tự cá nhân đánh giá */}
              <div style={{ marginBottom: '14px', fontSize: '11.5pt', lineHeight: 1.45 }}>
                <p style={{ margin: '0 0 4px 0', textIndent: '1.27cm' }}>
                  <strong>- Mức tự cá nhân đánh giá, xếp loại:</strong> <span style={{ fontWeight: 'bold', color: '#002277', textDecoration: 'underline' }}>{formData.self_classification}</span>, đạt <span style={{ fontWeight: 'bold' }}>{formData.self_total_score}</span> điểm.
                </p>
                <div style={{ paddingLeft: '1.27cm', fontSize: '11pt', color: '#334155' }}>
                  <p style={{ margin: '2px 0' }}><em>+ Hoàn thành xuất sắc nhiệm vụ:</em> Các tiêu chí chung đều đạt và có tổng điểm từ 100 điểm trở lên.</p>
                  <p style={{ margin: '2px 0' }}><em>+ Hoàn thành tốt nhiệm vụ:</em> Các tiêu chí chung đều đạt và có tổng điểm từ 90 điểm trở lên.</p>
                  <p style={{ margin: '2px 0' }}><em>+ Hoàn thành nhiệm vụ:</em> Các tiêu chí chung đều đạt và có tổng điểm từ 80 điểm trở lên.</p>
                  <p style={{ margin: '2px 0' }}><em>+ Không hoàn thành nhiệm vụ:</em> Các trường hợp còn lại.</p>
                </div>
              </div>

              {/* Chữ ký Giáo viên */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px' }}>
                <div style={{ textAlign: 'center', width: '260px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11.5pt' }}>Người tự đánh giá</div>
                  <div style={{ fontSize: '10.5pt', fontStyle: 'italic', marginBottom: '6px' }}>(Ký và ghi rõ họ tên)</div>

                  <div style={{ minHeight: '65px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {formData.self_signature ? (
                      <div>
                        <img 
                          src={formData.self_signature} 
                          alt="Chữ ký giáo viên" 
                          style={{ maxHeight: '60px', maxWidth: '160px', objectFit: 'contain' }} 
                        />
                        <div className="no-print" style={{ marginTop: '2px' }}>
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
                            gap: '4px',
                            padding: '5px 10px',
                            background: '#e0f2fe',
                            color: '#0284c7',
                            border: '1px dashed #0284c7',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          <PenTool size={13} /> Ký trên màn hình
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={{ fontWeight: 'bold', fontSize: '12pt', color: '#002277', marginTop: '4px' }}>
                    {formData.self_signer_name || formData.teacher_name}
                  </div>
                </div>
              </div>

              {/* NHẬN XÉT CỦA TTCM */}
              <div style={{ borderTop: '1px dotted #000', paddingTop: '10px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11.5pt', marginBottom: '6px' }}>
                  * NHẬN XÉT, ĐÁNH GIÁ CỦA LÃNH ĐẠO TRỰC TIẾP QUẢN LÝ
                </div>
                
                <div style={{ fontSize: '11.5pt', marginBottom: '6px' }}>
                  - Đánh giá, xếp loại: VC <strong style={{ color: '#002277' }}>{formData.teacher_name}</strong>: {' '}
                  <span style={{ fontWeight: 'bold', textDecoration: 'underline', color: '#002277' }}>
                    {formData.manager_classification}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <div style={{ textAlign: 'center', width: '260px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '11.5pt' }}>Tổ trưởng</div>
                    <div style={{ fontSize: '10.5pt', fontStyle: 'italic', marginBottom: '6px' }}>(Ký và ghi rõ họ tên)</div>

                    <div style={{ minHeight: '65px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      {formData.manager_signature ? (
                        <div>
                          <img 
                            src={formData.manager_signature} 
                            alt="Chữ ký tổ trưởng" 
                            style={{ maxHeight: '60px', maxWidth: '160px', objectFit: 'contain' }} 
                          />
                          <div className="no-print" style={{ marginTop: '2px' }}>
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
                              gap: '4px',
                              padding: '5px 10px',
                              background: '#fef3c7',
                              color: '#b45309',
                              border: '1px dashed #f59e0b',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            <PenTool size={13} /> TTCM Ký duyệt
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ fontWeight: 'bold', fontSize: '12pt', color: '#002277', marginTop: '4px' }}>
                      {formData.manager_signer_name || 'Trần Thị Quế Quyên'}
                    </div>
                  </div>
                </div>
              </div>

              {/* NHẬN XÉT CỦA TẬP THỂ LÃNH ĐẠO */}
              <div style={{ borderTop: '1px dotted #000', paddingTop: '10px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11.5pt', marginBottom: '6px' }}>
                  * NHẬN XÉT, ĐÁNH GIÁ CỦA TẬP THỂ LÃNH ĐẠO CƠ QUAN, ĐƠN VỊ
                </div>
                
                <div style={{ fontSize: '11.5pt', marginBottom: '12px' }}>
                  Kết luận: VC <strong style={{ color: '#002277' }}>{formData.teacher_name}</strong>: {' '}
                  <span style={{ fontWeight: 'bold', textDecoration: 'underline', color: '#002277' }}>
                    {formData.principal_conclusion || formData.manager_classification}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <div style={{ textAlign: 'center', width: '280px' }}>
                    <div style={{ fontStyle: 'italic', fontSize: '11pt', marginBottom: '2px' }}>
                      Ngày ..... tháng ..... năm {evalYearNum}
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>Hiệu trưởng</div>
                    <div style={{ fontSize: '10.5pt', fontStyle: 'italic', marginBottom: '40px' }}>(Ký tên, đóng dấu)</div>

                    <div style={{ fontWeight: 'bold', fontSize: '12pt', color: '#002277' }}>
                      {formData.principal_signer_name || ''}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', fontSize: '11pt', marginTop: '10px' }}>2</div>

            </div>

          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="no-print" style={{
          padding: '12px 20px',
          background: 'white',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569' }}>
              Trạng thái:
            </span>
            <span style={{
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '11.5px',
              fontWeight: 'bold',
              background: formData.manager_signature ? '#dcfce7' : formData.self_signature ? '#e0f2fe' : '#f1f5f9',
              color: formData.manager_signature ? '#15803d' : formData.self_signature ? '#0369a1' : '#64748b'
            }}>
              {formData.manager_signature ? '✅ TTCM Đã Phê Duyệt & Ký Số' : formData.self_signature ? '📝 Giáo Viên Đã Ký Tên (Chờ TTCM)' : '⏳ Bản Nháp Chưa Ký'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px 14px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={handleExportWord}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <Download size={14} /> Xuất Word (NĐ 30)
            </button>

            <button
              type="button"
              onClick={() => handleSaveEvaluationData('SUBMITTED_TEACHER')}
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <Send size={14} /> Gửi TTCM Duyệt
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                background: '#0f172a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <Printer size={14} /> In Phiếu A4
            </button>
          </div>

        </div>

      </div>

      {/* SIGNATURE PAD */}
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

      {/* Print CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 20mm 15mm 20mm 30mm;
          }
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
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 0 !important;
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
