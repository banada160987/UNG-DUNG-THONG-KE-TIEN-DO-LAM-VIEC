import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, Printer, PenTool, Save, Award, FileSpreadsheet, 
  CheckCircle2, Building2, Calendar, FileText, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import SignaturePadModal from './SignaturePadModal';

export default function MonthlyDepartmentSummaryDakLakModal({
  isOpen,
  onClose,
  departmentName = 'Tổ Ngữ văn',
  evaluationMonth = 'Tháng 6',
  schoolYear = '2025-2026',
  staffList = [],
  evaluations = [],
  currentTeacher = null
}) {
  const printRef = useRef(null);
  const [sigModalOpen, setSigModalOpen] = useState(false);

  // Department Head Signature
  const [managerSignature, setManagerSignature] = useState(null);
  const [managerName, setManagerName] = useState('Trần Thị Quế Quyên');
  const [reportDate, setReportDate] = useState(() => {
    const d = new Date();
    return `Tân An, ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
  });

  const evalYearNum = useMemo(() => {
    if (schoolYear && schoolYear.includes('-')) {
      return schoolYear.split('-')[1] || '2026';
    }
    return '2026';
  }, [schoolYear]);

  const monthNum = useMemo(() => {
    return evaluationMonth.replace('Tháng ', '');
  }, [evaluationMonth]);

  // Load TTCM signature from cache
  useEffect(() => {
    if (!isOpen) return;
    const cachedSig = localStorage.getItem(`cbq_signature_manager_${departmentName}`);
    if (cachedSig) setManagerSignature(cachedSig);

    if (currentTeacher?.full_name && (currentTeacher.title || '').toLowerCase().includes('tổ trưởng')) {
      setManagerName(currentTeacher.full_name);
    } else {
      // Find staff with TTCM title
      const ttcmStaff = staffList.find(s => (s.title || '').toLowerCase().includes('tổ trưởng') || (s.title || '').toLowerCase().includes('ttcm'));
      if (ttcmStaff) {
        setManagerName(ttcmStaff.name);
      }
    }
  }, [isOpen, departmentName, currentTeacher, staffList]);

  // Merge staff and evaluations
  const mergedRows = useMemo(() => {
    return staffList.map((st, idx) => {
      // Look up in evaluations or localStorage
      const evalItem = evaluations.find(e => e.staff_id === st.id || e.teacher_name === st.name);
      const storageKey = `cbq_daklak_eval_${st.name}_${evaluationMonth}_${schoolYear}`;
      let localEval = null;
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) localEval = JSON.parse(cached);
      } catch (e) {}

      let rank = 'Hoàn thành tốt nhiệm vụ';
      if (localEval?.manager_classification) {
        rank = localEval.manager_classification;
      } else if (evalItem?.officer_classification) {
        rank = evalItem.officer_classification;
      }

      let roleType = 'Viên chức';
      if ((st.title || '').toLowerCase().includes('hợp đồng') || (st.title || '').toLowerCase().includes('hđ 68')) {
        roleType = 'HĐ 68';
      }

      let shortTitle = 'GV';
      const t = (st.title || '').toLowerCase();
      if (t.includes('tổ trưởng') || t.includes('ttcm')) shortTitle = 'TTCM';
      else if (t.includes('tổ phó') || t.includes('tpcm')) shortTitle = 'TPCM';
      else if (t.includes('nhân viên') || t.includes('văn thư') || t.includes('kế toán')) shortTitle = 'NV';

      return {
        stt: idx + 1,
        id: st.id,
        name: st.name,
        title: shortTitle,
        fullTitle: st.title || 'Giáo viên',
        targetType: roleType,
        rank: rank,
        notes: evalItem?.notes || localEval?.notes || ''
      };
    });
  }, [staffList, evaluations, evaluationMonth, schoolYear]);

  // Statistics calculation
  const summaryStats = useMemo(() => {
    const total = mergedRows.length;
    let excellent = 0;
    let good = 0;
    let accomplished = 0;
    let failed = 0;
    let unranked = 0;

    mergedRows.forEach(r => {
      if (r.rank === 'Hoàn thành xuất sắc nhiệm vụ') excellent++;
      else if (r.rank === 'Hoàn thành tốt nhiệm vụ') good++;
      else if (r.rank === 'Hoàn thành nhiệm vụ') accomplished++;
      else if (r.rank === 'Không hoàn thành nhiệm vụ') failed++;
      else unranked++;
    });

    return {
      total,
      excellent,
      good,
      accomplished,
      failed,
      unranked
    };
  }, [mergedRows]);

  const handleSaveSignature = (sigUrl) => {
    setManagerSignature(sigUrl);
    localStorage.setItem(`cbq_signature_manager_${departmentName}`, sigUrl);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const rows = mergedRows.map(r => ({
      'TT': r.stt,
      'Họ và tên': r.name,
      'Chức vụ': r.title,
      'Đối tượng (viên chức, HĐ 68, hợp đồng)': r.targetType,
      [`Mức đánh giá, xếp loại tháng ${monthNum}/${evalYearNum}`]: r.rank,
      'Ghi chú': r.notes
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `TongHop_${evaluationMonth}`);
    XLSX.writeFile(wb, `Tong_Hop_Danh_Gia_KPI_${departmentName.replace(/\s+/g, '_')}_${evaluationMonth}_${evalYearNum}.xlsx`);
  };

  if (!isOpen) return null;

  return (
    <div className="daklak-summary-modal-wrapper" style={{
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
        maxWidth: '950px',
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
          background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px' }}>
              <FileText size={22} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold' }}>
                Bảng Tổng Hợp Đánh Giá, Xếp Loại Hàng Tháng Của Tổ (Chuẩn Sở GD&ĐT Đắk Lắk)
              </h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#bae6fd' }}>
                Đơn vị: <strong>{departmentName}</strong> • {evaluationMonth}/{evalYearNum} (Năm học {schoolYear})
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleExportExcel}
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
              <FileSpreadsheet size={16} /> Xuất Excel
            </button>
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
                cursor: 'pointer'
              }}
            >
              <Printer size={16} /> In Bảng Tổng Hợp A4
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

        {/* MODAL BODY (Print Paper) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#f8fafc' }}>
          
          <div ref={printRef} className="daklak-summary-print-paper" style={{
            background: 'white',
            maxWidth: '850px',
            margin: '0 auto',
            padding: '36px 40px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            borderRadius: '8px',
            fontFamily: '"Times New Roman", Times, serif',
            color: '#000000',
            lineHeight: 1.45
          }}>

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
                TỔNG HỢP ĐÁNH GIÁ, XẾP LOẠI HÀNG THÁNG
              </h2>
              <div style={{ fontSize: '13pt', fontWeight: 'bold', marginBottom: '6px' }}>
                Tháng {monthNum}/{evalYearNum}
              </div>
              <div style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase' }}>
                TỔ: {departmentName.replace('Tổ ', '')}
              </div>
            </div>

            {/* Main Summary Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt', border: '1px solid black', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', fontWeight: 'bold', textAlign: 'center' }}>
                  <th style={{ border: '1px solid black', padding: '8px 4px', width: '40px' }}>TT</th>
                  <th style={{ border: '1px solid black', padding: '8px 10px', minWidth: '180px' }}>Họ và tên</th>
                  <th style={{ border: '1px solid black', padding: '8px 6px', width: '70px' }}>Chức vụ</th>
                  <th style={{ border: '1px solid black', padding: '8px 8px', width: '130px' }}>
                    Đối tượng<br />
                    <span style={{ fontSize: '10.5pt', fontWeight: 'normal' }}>(viên chức, HĐ 68, hợp đồng)</span>
                  </th>
                  <th style={{ border: '1px solid black', padding: '8px 10px', minWidth: '170px' }}>
                    Mức đánh giá, xếp loại<br />
                    tháng {monthNum}/{evalYearNum}
                  </th>
                  <th style={{ border: '1px solid black', padding: '8px 6px', width: '80px' }}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {mergedRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ border: '1px solid black', padding: '20px', textAlign: 'center', color: '#64748b' }}>
                      Chưa có danh sách giáo viên trong tổ này.
                    </td>
                  </tr>
                ) : (
                  mergedRows.map(row => (
                    <tr key={row.stt}>
                      <td style={{ border: '1px solid black', textAlign: 'center', padding: '6px' }}>{row.stt}</td>
                      <td style={{ border: '1px solid black', padding: '6px 10px', fontWeight: 'bold' }}>{row.name}</td>
                      <td style={{ border: '1px solid black', textAlign: 'center', padding: '6px' }}>{row.title}</td>
                      <td style={{ border: '1px solid black', textAlign: 'center', padding: '6px' }}>{row.targetType}</td>
                      <td style={{ border: '1px solid black', padding: '6px 10px', textAlign: 'center' }}>{row.rank}</td>
                      <td style={{ border: '1px solid black', textAlign: 'center', padding: '6px' }}>{row.notes}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Statistics & Signature Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px', fontSize: '12pt' }}>
              
              {/* Left Column: Breakdown Statistics */}
              <div>
                <div style={{ fontStyle: 'italic', fontWeight: 'bold', marginBottom: '8px' }}>
                  Tổng số: {String(summaryStats.total).padStart(2, '0')} trong đó:
                </div>
                <div style={{ paddingLeft: '8px', lineHeight: 1.6 }}>
                  <div>1. Hoàn thành xuất sắc nhiệm vụ: <strong>{String(summaryStats.excellent).padStart(2, '0')}</strong></div>
                  <div>2. Hoàn thành tốt nhiệm vụ: <strong>{String(summaryStats.good).padStart(2, '0')}</strong></div>
                  <div>3. Hoàn thành nhiệm vụ: <strong>{String(summaryStats.accomplished).padStart(2, '0')}</strong></div>
                  <div>4. Không hoàn thành nhiệm vụ: <strong>{String(summaryStats.failed).padStart(2, '0')}</strong></div>
                  <div>5. Không xếp loại: <strong>{String(summaryStats.unranked).padStart(2, '0')}</strong></div>
                </div>
              </div>

              {/* Right Column: TTCM Signature */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontStyle: 'italic', marginBottom: '6px' }}>
                  {reportDate}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '13pt' }}>Tổ trưởng</div>
                <div style={{ fontSize: '11pt', fontStyle: 'italic', marginBottom: '8px' }}>(Ký và ghi rõ họ tên)</div>

                {/* Digital Signature Container */}
                <div style={{ minHeight: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {managerSignature ? (
                    <div>
                      <img 
                        src={managerSignature} 
                        alt="Chữ ký tổ trưởng" 
                        style={{ maxHeight: '75px', maxWidth: '200px', objectFit: 'contain' }} 
                      />
                      <div className="no-print" style={{ marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => setSigModalOpen(true)}
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
                        onClick={() => setSigModalOpen(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          background: '#e0f2fe',
                          color: '#0284c7',
                          border: '1px dashed #0284c7',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        <PenTool size={14} /> Tổ trưởng Ký Tên
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ fontWeight: 'bold', fontSize: '13pt', color: '#002277', marginTop: '6px' }}>
                  {managerName}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* SIGNATURE PAD MODAL */}
      {sigModalOpen && (
        <SignaturePadModal
          isOpen={sigModalOpen}
          onClose={() => setSigModalOpen(false)}
          onSaveSignature={handleSaveSignature}
          initialSignature={managerSignature}
          signerName={managerName}
          signerTitle="Tổ trưởng chuyên môn"
        />
      )}

      {/* CSS Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .daklak-summary-modal-wrapper,
          .daklak-summary-modal-wrapper * {
            visibility: visible;
          }
          .daklak-summary-modal-wrapper {
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
          .daklak-summary-print-paper {
            box-shadow: none !important;
            padding: 20mm 15mm !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}} />

    </div>
  );
}
