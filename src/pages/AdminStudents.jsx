import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Users, Upload, Search, Download, Plus, Save, Trash2, Edit3, CheckCircle2, AlertCircle, RefreshCw, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const DEFAULT_STUDENTS = [
  { id: '1', student_code: 'HS11A1-001', student_name: 'Nguyễn Văn An', student_class: '11A1', grade_level: 'Khối 11' },
  { id: '2', student_code: 'HS11A1-002', student_name: 'Lê Thị Bình', student_class: '11A1', grade_level: 'Khối 11' },
  { id: '3', student_code: 'HS12A3-005', student_name: 'Trần Thị Bích', student_class: '12A3', grade_level: 'Khối 12' },
  { id: '4', student_code: 'HS12A3-008', student_name: 'Nguyễn Đức Cường', student_class: '12A3', grade_level: 'Khối 12' },
  { id: '5', student_code: 'HS10A2-012', student_name: 'Phạm Minh Cường', student_class: '10A2', grade_level: 'Khối 10' }
];

export default function AdminStudents() {
  const [students, setStudents] = useState(DEFAULT_STUDENTS);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_students')
        .select('*')
        .order('student_class', { ascending: true });

      if (!error && data && data.length > 0) {
        setStudents(data);
        localStorage.setItem('cbq_students_data', JSON.stringify(data));
      } else {
        const localData = localStorage.getItem('cbq_students_data');
        if (localData) {
          setStudents(JSON.parse(localData));
        }
      }
    } catch (err) {
      console.warn("Nạp dữ liệu từ localStorage:", err);
      const localData = localStorage.getItem('cbq_students_data');
      if (localData) {
        setStudents(JSON.parse(localData));
      }
    } finally {
      setLoading(false);
    }
  }

  const getGradeLevel = (clsName) => {
    if (!clsName) return 'Khối 10';
    const clean = String(clsName).trim().toUpperCase();

    // Match class prefix: e.g. "10A12", "10A1" -> Khối 10; "11A1" -> Khối 11; "12A3" -> Khối 12
    const matchPrefix = clean.match(/^(10|11|12)/);
    if (matchPrefix) {
      return `Khối ${matchPrefix[1]}`;
    }

    if (/\b12\b|12[A-Z]/i.test(clean)) return 'Khối 12';
    if (/\b11\b|11[A-Z]/i.test(clean)) return 'Khối 11';
    if (/\b10\b|10[A-Z]/i.test(clean)) return 'Khối 10';

    return 'Khối 10';
  };

  // Import Excel File Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (!rawData || rawData.length === 0) {
          alert("Tệp Excel không chứa dữ liệu!");
          setUploading(false);
          return;
        }

        const formattedList = [];
        rawData.forEach((row, idx) => {
          // Flexible Column Names Matching
          const sCode = row['Mã Học Sinh'] || row['Mã HS'] || row['Mã'] || row['StudentCode'] || `HS${idx + 1}`;
          const sName = row['Họ và Tên'] || row['Họ tên'] || row['Tên học sinh'] || row['StudentName'] || row['Full Name'];
          const sClass = row['Lớp'] || row['Tên lớp'] || row['Lớp học'] || row['Class'];

          if (sName && sClass) {
            const cleanClass = String(sClass).trim().toUpperCase();
            formattedList.push({
              student_code: String(sCode).trim().toUpperCase(),
              student_name: String(sName).trim(),
              student_class: cleanClass,
              grade_level: getGradeLevel(cleanClass),
              is_active: true
            });
          }
        });

        if (formattedList.length === 0) {
          alert("Không tìm thấy các cột tương ứng: 'Mã Học Sinh', 'Họ và Tên', 'Lớp' trong file Excel!");
          setUploading(false);
          return;
        }

        // Check duplicates vs existing roster
        const existingCodesSet = new Set(students.map(s => s.student_code));
        let newCount = 0;
        let updateCount = 0;
        const updatedCodesList = [];

        formattedList.forEach(item => {
          if (existingCodesSet.has(item.student_code)) {
            updateCount++;
            if (updatedCodesList.length < 5) {
              updatedCodesList.push(item.student_code);
            }
          } else {
            newCount++;
          }
        });

        // Merge with current state & save to LocalStorage immediately (student_code is primary unique key)
        setStudents(prev => {
          const map = new Map();
          // Existing items first
          prev.forEach(item => map.set(item.student_code, item));
          
          // Overwrite with new file items while preserving existing database ID if present
          formattedList.forEach(newItem => {
            const existing = map.get(newItem.student_code);
            if (existing) {
              map.set(newItem.student_code, {
                ...existing,
                student_name: newItem.student_name,
                student_class: newItem.student_class,
                grade_level: newItem.grade_level,
                is_active: true
              });
            } else {
              map.set(newItem.student_code, newItem);
            }
          });

          const newList = Array.from(map.values());
          localStorage.setItem('cbq_students_data', JSON.stringify(newList));
          return newList;
        });

        // Try upserting to Supabase in background (onConflict: student_code)
        try {
          await supabase
            .from('cbq_students')
            .upsert(formattedList, { onConflict: 'student_code' });
        } catch (dbErr) {
          console.warn("Supabase upsert warn:", dbErr);
        }

        let reportMsg = `🎉 IMPORT DỮ LIỆU HỌC SINH THÀNH CÔNG!\n\n`;
        reportMsg += `🔑 Khóa chính duy nhất: Mã Học Sinh (Student Code)\n\n`;
        reportMsg += `✨ Thêm mới: ${newCount} học sinh\n`;
        if (updateCount > 0) {
          reportMsg += `🔄 Phát hiện trùng Mã HS & ĐÃ CẬP NHẬT THEO THÔNG TIN MỚI: ${updateCount} học sinh\n`;
          reportMsg += `   (Ví dụ các Mã HS được cập nhật thông tin mới: ${updatedCodesList.join(', ')}${updateCount > 5 ? '...' : ''})\n`;
        }
        reportMsg += `\n👉 Đảm bảo: Thông tin tên, lớp, khối mới nhất từ file đã được cập nhật chuẩn xác theo Mã học sinh và KHÔNG bị trùng lặp!`;

        alert(reportMsg);
      } catch (err) {
        alert("Lỗi khi đọc file Excel: " + err.message);
      } finally {
        setUploading(false);
        e.target.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!name.trim() || !className.trim()) {
      alert("Vui lòng điền Họ tên và Lớp học!");
      return;
    }

    const cleanClass = className.trim().toUpperCase();
    const payload = {
      student_code: code.trim().toUpperCase() || `HS-${Date.now()}`,
      student_name: name.trim(),
      student_class: cleanClass,
      grade_level: getGradeLevel(cleanClass),
      is_active: true
    };

    try {
      if (editingId) {
        await supabase.from('cbq_students').update(payload).eq('id', editingId);
      } else {
        await supabase.from('cbq_students').insert([payload]);
      }
      alert("🎉 ĐÃ LƯU THÔNG TIN HỌC SINH THÀNH CÔNG!");
      setShowForm(false);
      setEditingId(null);
      fetchStudents();
    } catch (err) {
      alert("Lỗi khi lưu: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa học sinh này khỏi danh sách nhà trường?")) return;
    try {
      await supabase.from('cbq_students').delete().eq('id', id);
      setStudents(students.filter(s => s.id !== id));
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Mã Học Sinh": "HS10A1-001",
        "Họ và Tên": "Nguyễn Văn An",
        "Lớp": "10A1"
      },
      {
        "Mã Học Sinh": "HS11A2-015",
        "Họ và Tên": "Trần Thị Bích",
        "Lớp": "11A2"
      },
      {
        "Mã Học Sinh": "HS12A5-020",
        "Họ và Tên": "Phạm Minh Cường",
        "Lớp": "12A5"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 25 },
      { wch: 12 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mau_Hoc_Sinh");
    XLSX.writeFile(workbook, "Mau_Import_Danh_Sach_Hoc_Sinh_THPT_CBQ.xlsx");
  };

  const handleExportExcel = () => {
    const dataToExport = filteredStudents.map(s => ({
      "Mã Học Sinh": s.student_code,
      "Họ và Tên": s.student_name,
      "Lớp": s.student_class,
      "Khối": s.grade_level
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachHocSinh");
    XLSX.writeFile(workbook, `Danh_Sach_Hoc_Sinh_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Bulk Class Transfer State
  const [showBulkTransferForm, setShowBulkTransferForm] = useState(false);
  const [sourceClass, setSourceClass] = useState('');
  const [targetClass, setTargetClass] = useState('');

  // Get list of unique current classes
  const uniqueClassesList = Array.from(new Set(students.map(s => s.student_class))).filter(Boolean).sort();

  // Individual Class Transfer Handler
  const handleIndividualTransfer = async (student) => {
    const newClassInput = window.prompt(`Chuyển lớp cho học sinh: ${student.student_name} (${student.student_class})\n\nNhập Tên Lớp Mới (VD: 11A1, 12A5):`, student.student_class);
    if (!newClassInput || !newClassInput.trim()) return;

    const cleanNewClass = newClassInput.trim().toUpperCase();
    const newGradeLevel = getGradeLevel(cleanNewClass);

    try {
      const updatedItem = {
        ...student,
        student_class: cleanNewClass,
        grade_level: newGradeLevel
      };

      // Update Local State & LocalStorage
      setStudents(prev => {
        const newList = prev.map(s => s.student_code === student.student_code ? updatedItem : s);
        localStorage.setItem('cbq_students_data', JSON.stringify(newList));
        return newList;
      });

      // Update Supabase
      await supabase
        .from('cbq_students')
        .update({ student_class: cleanNewClass, grade_level: newGradeLevel })
        .eq('student_code', student.student_code);

      alert(`🎉 Đã chuyển học sinh ${student.student_name} sang Lớp ${cleanNewClass} (${newGradeLevel}) thành công!`);
    } catch (err) {
      alert("Lỗi khi chuyển lớp: " + err.message);
    }
  };

  // Bulk Class Transfer Handler
  const handleBulkTransferSubmit = async (e) => {
    e.preventDefault();
    if (!sourceClass || !targetClass.trim()) {
      alert("Vui lòng chọn Lớp Cũ và nhập Lớp Mới!");
      return;
    }

    const cleanTargetClass = targetClass.trim().toUpperCase();
    const targetGradeLevel = getGradeLevel(cleanTargetClass);

    const studentsToMove = students.filter(s => s.student_class === sourceClass);
    if (studentsToMove.length === 0) {
      alert(`Không tìm thấy học sinh nào trong Lớp ${sourceClass}!`);
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn chuyển TOÀN BỘ ${studentsToMove.length} học sinh từ Lớp ${sourceClass} sang Lớp ${cleanTargetClass} (${targetGradeLevel})?`)) {
      return;
    }

    try {
      // 1. Update Local State & LocalStorage
      setStudents(prev => {
        const newList = prev.map(s => {
          if (s.student_class === sourceClass) {
            return {
              ...s,
              student_class: cleanTargetClass,
              grade_level: targetGradeLevel
            };
          }
          return s;
        });
        localStorage.setItem('cbq_students_data', JSON.stringify(newList));
        return newList;
      });

      // 2. Update Supabase
      const codesToMove = studentsToMove.map(s => s.student_code);
      await supabase
        .from('cbq_students')
        .update({ student_class: cleanTargetClass, grade_level: targetGradeLevel })
        .in('student_code', codesToMove);

      alert(`🎉 ĐÃ CHUYỂN THÀNH CÔNG ${studentsToMove.length} HỌC SINH TỪ LỚP ${sourceClass} SANG LỚP ${cleanTargetClass} (${targetGradeLevel})!`);
      setShowBulkTransferForm(false);
      setSourceClass('');
      setTargetClass('');
    } catch (err) {
      alert("Lỗi khi chuyển lớp hàng loạt: " + err.message);
    }
  };

  const filteredStudents = students.filter(s => {
    const computedGrade = getGradeLevel(s.student_class);
    const matchSearch = !searchTerm || 
      s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_class?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGrade = selectedGrade === 'ALL' || computedGrade === selectedGrade;
    return matchSearch && matchGrade;
  });

  return (
    <Layout title="Danh sách Học sinh Nhà trường">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={26} color="#be123c" /> Quản Lý Danh Sách Học Sinh Nhà Trường
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Import danh sách học sinh từ Excel giúp tự động gợi ý chính xác khi học sinh đăng ký gửi xe
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', backgroundColor: '#166534', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13.5px' }}>
            <FileSpreadsheet size={18} /> {uploading ? 'Đang Import...' : 'Import Từ File Excel'}
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <button onClick={() => setShowBulkTransferForm(!showBulkTransferForm)} className="btn-primary" style={{ padding: '10px 16px', backgroundColor: '#7c3aed', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={18} /> {showBulkTransferForm ? 'Đóng Chuyển Lớp' : 'Chuyển Lớp Hàng Loạt'}
          </button>

          <button onClick={handleDownloadTemplate} className="btn-primary" style={{ padding: '10px 16px', backgroundColor: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={18} /> Tải File Mẫu Import
          </button>

          <button onClick={handleExportExcel} className="btn-primary" style={{ padding: '10px 16px', backgroundColor: '#0284c7' }}>
            <Download size={18} /> Xuất Excel
          </button>

          <button onClick={() => { setEditingId(null); setCode(''); setName(''); setClassName(''); setShowForm(!showForm); }} className="btn-primary" style={{ padding: '10px 18px', backgroundColor: '#be123c' }}>
            <Plus size={18} /> {showForm ? 'Đóng Form' : 'Thêm Học Sinh'}
          </button>
        </div>
      </div>

      {/* BULK CLASS TRANSFER FORM SECTION */}
      {showBulkTransferForm && (
        <form onSubmit={handleBulkTransferSubmit} className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#fef2f2', border: '2px solid #fca5a5', marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #fecdd3', paddingBottom: '10px' }}>
            🚀 Chuyển Lớp Hàng Loạt (Lên Lớp Đầu Năm Học)
          </h3>
          <p style={{ fontSize: '13px', color: '#9f1239', marginTop: '-4px' }}>
            Chuyển TOÀN BỘ danh sách học sinh thuộc một lớp cũ sang một lớp mới và tự động cập nhật Khối học mới.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ ...styles.label, color: '#be123c' }}>1. Chọn Lớp Cũ Cần Chuyển (*)</label>
              <select value={sourceClass} onChange={e => setSourceClass(e.target.value)} style={{ ...styles.input, fontWeight: 'bold' }}>
                <option value="">-- Chọn Lớp Cũ --</option>
                {uniqueClassesList.map(cls => (
                  <option key={cls} value={cls}>Lớp {cls} ({students.filter(s => s.student_class === cls).length} học sinh)</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ ...styles.label, color: '#be123c' }}>2. Nhập Lớp Mới (*)</label>
              <input 
                type="text" 
                required 
                value={targetClass} 
                onChange={e => setTargetClass(e.target.value)} 
                style={{ ...styles.input, fontWeight: 'bold' }} 
                placeholder="VD: 11A1, 12A5..." 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
            <button type="button" onClick={() => setShowBulkTransferForm(false)} style={{ padding: '8px 16px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold' }}>Hủy</button>
            <button type="submit" className="btn-primary" style={{ padding: '8px 20px', backgroundColor: '#be123c' }}>
              🚀 XÁC NHẬN CHUYỂN TOÀN BỘ LỚP
            </button>
          </div>
        </form>
      )}

      {/* FORM SECTION */}
      {showForm && (
        <form onSubmit={handleSubmitForm} className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'white', marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
            {editingId ? '📝 Sửa thông tin Học sinh' : '➕ Thêm Học sinh Mới'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '12px' }}>
            <div>
              <label style={styles.label}>Mã Học Sinh (*)</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value)} style={styles.input} placeholder="VD: HS11A1-001" />
            </div>
            <div>
              <label style={styles.label}>Họ và Tên Học sinh (*)</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} style={styles.input} placeholder="VD: Nguyễn Văn An" />
            </div>
            <div>
              <label style={styles.label}>Lớp học (*)</label>
              <input type="text" required value={className} onChange={e => setClassName(e.target.value)} style={styles.input} placeholder="VD: 11A1" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold' }}>Hủy</button>
            <button type="submit" className="btn-primary" style={{ padding: '8px 20px', backgroundColor: '#be123c' }}>
              <Save size={16} /> Lưu Thông Tin
            </button>
          </div>
        </form>
      )}

      {/* SEARCH & FILTERS */}
      <div className="glass" style={{ padding: '1.2rem', borderRadius: '1rem', backgroundColor: 'white', marginBottom: '1.5rem', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="#64748b" />
          <input 
            type="text" 
            placeholder="Tìm theo Mã học sinh, Họ và Tên, Lớp..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13.5px' }}
          />
        </div>

        <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} style={styles.filterSelect}>
          <option value="ALL">Tất cả Khối lớp</option>
          <option value="Khối 10">Khối 10</option>
          <option value="Khối 11">Khối 11</option>
          <option value="Khối 12">Khối 12</option>
        </select>
      </div>

      {/* DATA TABLE */}
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'white' }}>
        <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
          👨‍🎓 Danh sách Học sinh Nhà trường ({filteredStudents.length})
        </h3>

        {loading ? <p>Đang nạp danh sách học sinh...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                  <th style={{ padding: '10px' }}>STT</th>
                  <th style={{ padding: '10px' }}>Mã Học Sinh</th>
                  <th style={{ padding: '10px' }}>Họ và Tên</th>
                  <th style={{ padding: '10px' }}>Lớp</th>
                  <th style={{ padding: '10px' }}>Khối</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>#{idx + 1}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#0284c7' }}>{s.student_code}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{s.student_name}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#be123c' }}>{s.student_class}</td>
                    <td style={{ padding: '10px', color: '#475569' }}>{s.grade_level}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => handleIndividualTransfer(s)} title="Chuyển lớp học sinh" style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #7c3aed', background: '#f5f3ff', color: '#7c3aed', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <RefreshCw size={12} /> Chuyển Lớp
                        </button>
                        <button type="button" onClick={() => { setEditingId(s.id); setCode(s.student_code); setName(s.student_name); setClassName(s.student_class); setShowForm(true); }} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', cursor: 'pointer' }}>
                          <Edit3 size={14} />
                        </button>
                        <button type="button" onClick={() => handleDelete(s.id)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

const styles = {
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' },
  input: { width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' },
  filterSelect: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#ffffff', color: '#334155' }
};
