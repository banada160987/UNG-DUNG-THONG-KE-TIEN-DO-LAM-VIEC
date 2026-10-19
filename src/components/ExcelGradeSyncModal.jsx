import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, ArrowRight, 
  Download, X, Sparkles, Filter, Settings, RefreshCw, Check 
} from 'lucide-react';
import { syncGradesToExcelWorkbook } from '../services/smartAssessmentService';

export default function ExcelGradeSyncModal({ 
  isOpen, 
  onClose, 
  submissions = [], 
  examTitle = 'Bài Kiểm Tra', 
  subject = 'Toán', 
  targetClass = '10A01' 
}) {
  const [file, setFile] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  
  // Mapping config
  const [columnsList, setColumnsList] = useState([]);
  const [keyColIndex, setKeyColIndex] = useState(1); // Mặc định Cột B (index 1)
  const [targetColIndex, setTargetColIndex] = useState(5); // Mặc định Cột F (index 5)
  const [startRowIndex, setStartRowIndex] = useState(4); // Mặc định Dòng 5 (index 4)
  const [matchType, setMatchType] = useState('code'); // 'code' hoặc 'name'

  // Sync Results
  const [previewLogs, setPreviewLogs] = useState([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [synced, setSynced] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setProcessing(true);
    setSynced(false);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const wb = XLSX.read(data, { type: 'binary', cellStyles: true });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        
        const firstSheet = wb.SheetNames[0];
        setSelectedSheet(firstSheet);
        analyzeSheetColumns(wb, firstSheet);
      } catch (err) {
        alert("Lỗi đọc tệp Excel: " + err.message);
      } finally {
        setProcessing(false);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const analyzeSheetColumns = (wb, sheetName) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:Z50');
    const cols = [];

    // Tìm dòng tiêu đề tốt nhất (thường từ dòng 1 đến dòng 6)
    for (let c = range.s.c; c <= range.e.c; c++) {
      let headerName = '';
      for (let r = 0; r <= Math.min(6, range.e.r); r++) {
        const cell = ws[XLSX.utils.encode_cell({ c, r })];
        if (cell && cell.v !== undefined && String(cell.v).trim().length > 0) {
          headerName += (headerName ? ' - ' : '') + String(cell.v).trim();
        }
      }
      
      const colLetter = XLSX.utils.encode_col(c);
      cols.push({
        index: c,
        letter: colLetter,
        label: `Cột ${colLetter}${headerName ? ` (${headerName.substring(0, 30)})` : ''}`
      });
    }

    setColumnsList(cols);
    runSyncPreview(wb, sheetName, keyColIndex, targetColIndex, startRowIndex, matchType);
  };

  const handleSheetChange = (sheetName) => {
    setSelectedSheet(sheetName);
    analyzeSheetColumns(workbook, sheetName);
  };

  const runSyncPreview = (wb, sheetName, keyCol, targetCol, startRow, type) => {
    if (!wb || !sheetName) return;

    try {
      // Clone workbook để preview
      const wbCopy = JSON.parse(JSON.stringify(wb));
      const res = syncGradesToExcelWorkbook({
        workbook: wbCopy,
        sheetName,
        keyColumnIndex: parseInt(keyCol, 10),
        targetGradeColumnIndex: parseInt(targetCol, 10),
        startRowIndex: parseInt(startRow, 10),
        submissions,
        matchType: type
      });

      setPreviewLogs(res.updateLogs || []);
      setMatchedCount(res.matchedCount || 0);
      setTotalRows(res.totalRowsChecked || 0);
    } catch (e) {
      console.warn("Lỗi tạo preview:", e);
    }
  };

  const handleApplySyncAndDownload = () => {
    if (!workbook || !selectedSheet) {
      alert("Vui lòng tải lên file Excel trước.");
      return;
    }

    try {
      const res = syncGradesToExcelWorkbook({
        workbook,
        sheetName: selectedSheet,
        keyColumnIndex: parseInt(keyColIndex, 10),
        targetGradeColumnIndex: parseInt(targetColIndex, 10),
        startRowIndex: parseInt(startRowIndex, 10),
        submissions,
        matchType
      });

      // Tên file xuất chuẩn quy tắc có tiền tố số thứ tự theo GEMINI.md
      const cleanSubject = (subject || 'MonHoc').replace(/\s+/g, '_');
      const cleanClass = (targetClass || 'Lop').replace(/\s+/g, '_');
      const downloadFileName = `1-Bang_diem_cap_nhat_${cleanSubject}_${cleanClass}.xlsx`;

      XLSX.writeFile(workbook, downloadFileName);
      setSynced(true);
      alert(`🎉 ĐÃ GHI ĐIỂM THÀNH CÔNG!\n\nĐã cập nhật ${res.matchedCount} học sinh vào file.\nTệp tải về: ${downloadFileName}`);
    } catch (err) {
      alert("Lỗi khi ghi điểm vào file: " + err.message);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 'bold', marginBottom: '6px' }}>
              <Sparkles size={13} color="#fde047" /> TÍNH NĂNG ĐỘT PHÁ
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={24} /> Ghi Điểm Trực Tiếp Vào File Excel Sổ Điểm Cá Nhân
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
              Khớp mã học sinh và ghi thẳng điểm kiểm tra vào cột giáo viên chọn trên file gốc.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          
          {/* Step 1: Upload File */}
          <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              id="excel-grade-upload" 
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <label htmlFor="excel-grade-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <Upload size={28} />
              </div>
              <div>
                <strong style={{ fontSize: '15px', color: '#1e293b', display: 'block' }}>
                  {file ? file.name : 'Nhấp để chọn File Excel Sổ Điểm từ máy tính'}
                </strong>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                  Hỗ trợ định dạng .xlsx, .xls (Giữ nguyên 100% công thức, font chữ và màu sắc)
                </span>
              </div>
              {file && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                  <CheckCircle2 size={14} /> Đã nạp dữ liệu ({sheetNames.length} Sheets)
                </span>
              )}
            </label>
          </div>

          {/* Step 2: Mapping Configuration */}
          {file && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#166534', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} /> Cấu Hình Cột Khớp Dữ Liệu & Cột Ghi Điểm
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                
                {/* Chọn Sheet */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                    1. Bảng tính (Sheet)
                  </label>
                  <select 
                    value={selectedSheet} 
                    onChange={e => handleSheetChange(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: 'white' }}
                  >
                    {sheetNames.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Tiêu chí khớp */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                    2. Tiêu chí khớp học sinh
                  </label>
                  <select 
                    value={matchType} 
                    onChange={e => {
                      setMatchType(e.target.value);
                      runSyncPreview(workbook, selectedSheet, keyColIndex, targetColIndex, startRowIndex, e.target.value);
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: 'white' }}
                  >
                    <option value="code">Theo Mã Học Sinh (Khuyên dùng)</option>
                    <option value="name">Theo Họ và Tên</option>
                  </select>
                </div>

                {/* Cột mã / tên */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                    3. Cột chứa Mã / Tên học sinh
                  </label>
                  <select 
                    value={keyColIndex} 
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      setKeyColIndex(val);
                      runSyncPreview(workbook, selectedSheet, val, targetColIndex, startRowIndex, matchType);
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: 'white' }}
                  >
                    {columnsList.map(c => <option key={c.index} value={c.index}>{c.label}</option>)}
                  </select>
                </div>

                {/* Cột ghi điểm */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#166534', marginBottom: '6px' }}>
                    4. Cột Muốn Ghi Điểm Vào 🎯
                  </label>
                  <select 
                    value={targetColIndex} 
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      setTargetColIndex(val);
                      runSyncPreview(workbook, selectedSheet, keyColIndex, val, startRowIndex, matchType);
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '2px solid #16a34a', fontSize: '13.5px', background: 'white', fontWeight: 'bold', color: '#15803d' }}
                  >
                    {columnsList.map(c => <option key={c.index} value={c.index}>{c.label}</option>)}
                  </select>
                </div>

                {/* Dòng bắt đầu */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                    5. Hàng bắt đầu danh sách
                  </label>
                  <input 
                    type="number" 
                    min={1} 
                    max={20} 
                    value={startRowIndex + 1} 
                    onChange={e => {
                      const val = Math.max(0, parseInt(e.target.value, 10) - 1);
                      setStartRowIndex(val);
                      runSyncPreview(workbook, selectedSheet, keyColIndex, targetColIndex, val, matchType);
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>

              </div>
            </div>
          )}

          {/* Step 3: Match Summary & Preview Table */}
          {file && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', color: '#1e293b', fontWeight: 'bold' }}>
                  Xem Trước Kết Quả Khớp Điểm ({matchedCount}/{totalRows} học sinh)
                </h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '12px', background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                    ✓ Khớp: {matchedCount}
                  </span>
                  <span style={{ fontSize: '12px', background: '#fee2e2', color: '#991b1b', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                    ✗ Chưa khớp: {totalRows - matchedCount}
                  </span>
                </div>
              </div>

              <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '8px 12px' }}>Dòng</th>
                      <th style={{ padding: '8px 12px' }}>Giá trị trên Excel</th>
                      <th style={{ padding: '8px 12px' }}>Ô Ghi Điểm</th>
                      <th style={{ padding: '8px 12px' }}>Điểm Kiểm Tra</th>
                      <th style={{ padding: '8px 12px' }}>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewLogs.slice(0, 50).map((log, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: log.status === 'matched' ? '#f0fdf4' : 'transparent' }}>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>{log.row}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#1e293b' }}>{log.key}</td>
                        <td style={{ padding: '8px 12px', color: '#0284c7' }}><code>{log.cell || '-'}</code></td>
                        <td style={{ padding: '8px 12px', fontWeight: '900', color: log.score !== null ? '#16a34a' : '#94a3b8' }}>
                          {log.score !== null ? `${log.score} điểm` : 'Chưa có bài'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          {log.status === 'matched' ? (
                            <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '12px' }}>✓ Khớp</span>
                          ) : (
                            <span style={{ color: '#dc2626', fontSize: '12px' }}>Không tìm thấy</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Tổng số bài kiểm tra đã chấm: <strong>{submissions.length} bài</strong>
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{ padding: '10px 18px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '13.5px', fontWeight: 'bold', cursor: 'pointer', color: '#475569' }}
            >
              Đóng
            </button>

            <button
              onClick={handleApplySyncAndDownload}
              disabled={!file || matchedCount === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                background: (!file || matchedCount === 0) ? '#94a3b8' : 'linear-gradient(135deg, #059669, #10b981)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: (!file || matchedCount === 0) ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Download size={16} /> Ghi Điểm & Tải File Excel Mới
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
