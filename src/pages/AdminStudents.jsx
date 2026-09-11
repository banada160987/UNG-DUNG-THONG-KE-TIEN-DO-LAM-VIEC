import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase, supabaseAdmin } from '../lib/supabase';
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGrade]);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [identityCard, setIdentityCard] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('Nam');
  const [address, setAddress] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');

  const resetFormState = () => {
    setEditingId(null);
    setCode('');
    setName('');
    setClassName('');
    setIdentityCard('');
    setBirthDate('');
    setGender('Nam');
    setAddress('');
    setFatherName('');
    setFatherPhone('');
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);
    try {
      let allStudents = [];
      let from = 0;
      const step = 1000;
      let fetchMore = true;

      while (fetchMore) {
        const { data, error } = await supabase
          .from('cbq_students')
          .select('*')
          .order('student_class', { ascending: true })
          .range(from, from + step - 1);

        if (error) {
          console.warn("Lỗi khi tải dữ liệu từ Supabase:", error);
          break;
        }

        if (data && data.length > 0) {
          allStudents = [...allStudents, ...data];
          from += step;
          if (data.length < step) {
            fetchMore = false;
          }
        } else {
          fetchMore = false;
        }
      }

      if (allStudents.length > 0) {
        setStudents(allStudents);
        localStorage.setItem('cbq_students_data', JSON.stringify(allStudents));
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

    const matchPrefix = clean.match(/^(10|11|12)/);
    if (matchPrefix) {
      return `Khối ${matchPrefix[1]}`;
    }

    if (/\b12\b|12[A-Z]/i.test(clean)) return 'Khối 12';
    if (/\b11\b|11[A-Z]/i.test(clean)) return 'Khối 11';
    if (/\b10\b|10[A-Z]/i.test(clean)) return 'Khối 10';

    return 'Khối 10';
  };

  // Helper to extract value from row object matching any keyword
  const getValByKeywords = (rowObj, keywords) => {
    if (!rowObj || typeof rowObj !== 'object') return "";
    const keys = Object.keys(rowObj);
    for (const k of keys) {
      const cleanK = String(k).trim().toLowerCase();
      for (const kw of keywords) {
        if (cleanK.includes(kw)) {
          return rowObj[k];
        }
      }
    }
    return "";
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

        const sheet2D = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        let headerRowIndex = 0;
        for (let r = 0; r < Math.min(sheet2D.length, 20); r++) {
          const rowStr = (sheet2D[r] || []).join(" ").toLowerCase();

          const hasName = rowStr.includes("tên") || rowStr.includes("họ");
          const hasClass = rowStr.includes("lớp") || rowStr.includes("class");
          const hasCode = rowStr.includes("mã") || rowStr.includes("stt");

          if ((hasName && hasClass) || (hasName && hasCode)) {
            headerRowIndex = r;
            break;
          }
        }

        const rawData = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex, defval: "" });

        if (!rawData || rawData.length === 0) {
          alert("Tệp Excel không chứa dữ liệu!");
          setUploading(false);
          return;
        }

        const formattedList = [];
        rawData.forEach((row, idx) => {
          const sCode = getValByKeywords(row, ['mã hs', 'mã học sinh', 'mã', 'stt', 'code', 'studentcode', 'id']);
          const sName = getValByKeywords(row, ['họ và tên', 'họ tên', 'tên học sinh', 'tên', 'studentname', 'name', 'full name']);
          const sClass = getValByKeywords(row, ['lớp', 'tên lớp', 'lớp học', 'class']);
          const sCCCD = getValByKeywords(row, ['cccd', 'số cccd', 'mã định danh', 'cmnd', 'identity']);
          const sBirthDate = getValByKeywords(row, ['ngày sinh', 'dob', 'birth_date', 'birthdate']);
          const sGender = getValByKeywords(row, ['giới tính', 'gioi tinh', 'gender', 'sex']);
          const sAddress = getValByKeywords(row, ['địa chỉ', 'dia chi', 'address', 'thường trú']);
          const sFatherName = getValByKeywords(row, ['bố', 'mẹ', 'phụ huynh', 'người giám hộ', 'parent']);
          const sFatherPhone = getValByKeywords(row, ['sđt bố', 'sđt mẹ', 'sđt phụ huynh', 'sđt người giám hộ', 'phone']);

          if (sName && String(sName).trim()) {
            const cleanClass = sClass ? String(sClass).trim().toUpperCase() : '10A1';
            const cleanCode = sCode && String(sCode).trim() ? String(sCode).trim().toUpperCase() : `HS${cleanClass}-${idx + 1}`;

            formattedList.push({
              student_code: cleanCode,
              student_name: String(sName).trim(),
              student_class: cleanClass,
              grade_level: getGradeLevel(cleanClass),
              identity_card: sCCCD ? String(sCCCD).trim().replace(/\D/g, '') : '',
              birth_date: sBirthDate ? String(sBirthDate).trim() : '',
              gender: sGender ? String(sGender).trim() : 'Nam',
              current_address: sAddress ? String(sAddress).trim() : '',
              father_name: sFatherName ? String(sFatherName).trim() : '',
              father_phone: sFatherPhone ? String(sFatherPhone).trim() : '',
              parent_phone: sFatherPhone ? String(sFatherPhone).trim() : '',
              is_active: true
            });
          }
        });

        if (formattedList.length === 0) {
          alert("Không tìm thấy dữ liệu cột 'Họ và Tên' và 'Lớp' trong file Excel!");
          setUploading(false);
          return;
        }

        const generateUUID = () => {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
          }
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };

        const existingCodesMap = new Map(students.map(s => [s.student_code, s.id]));
        let newCount = 0;
        let updateCount = 0;

        formattedList.forEach(item => {
          const existingId = existingCodesMap.get(item.student_code);
          if (existingId) {
            item.id = existingId;
            updateCount++;
          } else {
            item.id = generateUUID();
            newCount++;
          }
        });

        setStudents(prev => {
          const map = new Map();
          prev.forEach(item => map.set(item.student_code, item));

          formattedList.forEach(newItem => {
            const existing = map.get(newItem.student_code);
            if (existing) {
              map.set(newItem.student_code, {
                ...existing,
                ...newItem,
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

        let dbSuccessCount = 0;
        let dbErrorMsg = null;
        const BATCH_SIZE = 100;
        const dbClient = supabaseAdmin || supabase;

        for (let i = 0; i < formattedList.length; i += BATCH_SIZE) {
          const chunk = formattedList.slice(i, i + BATCH_SIZE);
          const { error: batchErr } = await dbClient
            .from('cbq_students')
            .upsert(chunk);

          if (batchErr) {
            console.error(`Lỗi upsert CSDL lô ${Math.floor(i / BATCH_SIZE) + 1}:`, batchErr);
            dbErrorMsg = batchErr.message;
          } else {
            dbSuccessCount += chunk.length;
            chunk.forEach(item => {
              dbClient.from('cbq_parking_registrations').update({ student_class: item.student_class, student_name: item.student_name }).eq('student_code', item.student_code).then(() => {});
              dbClient.from('cbq_bus_registrations').update({ student_class: item.student_class, student_name: item.student_name }).eq('student_code', item.student_code).then(() => {});
            });
          }
        }

        await fetchStudents();

        let reportMsg = `🎉 IMPORT DỮ LIỆU HỌC SINH THÀNH CÔNG!\n\n`;
        reportMsg += `📊 Tổng số học sinh từ tệp: ${formattedList.length} học sinh\n`;
        reportMsg += `✨ Thêm mới: ${newCount} học sinh\n`;
        if (updateCount > 0) {
          reportMsg += `🔄 Cập nhật thông tin mới (trùng Mã HS): ${updateCount} học sinh\n`;
        }
        reportMsg += `\n💾 ĐÃ GHI VÀO CSDL SUPABASE: ${dbSuccessCount}/${formattedList.length} bản ghi\n`;
        reportMsg += `🚗 Đã tự động đồng bộ Lớp mới sang Thẻ giữ xe & Dịch vụ Xe đưa đón cho học sinh!`;
        if (dbErrorMsg) {
          reportMsg += `\n⚠️ Cảnh báo CSDL Supabase: ${dbErrorMsg}\n👉 Nếu gặp sự cố ghi CSDL, bạn hãy chạy câu lệnh SQL này trong Supabase Editor:\n\nALTER TABLE cbq_students DISABLE ROW LEVEL SECURITY;\nGRANT ALL ON TABLE cbq_students TO public, anon, authenticated;`;
        }

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
    const cleanCCCD = identityCard.trim().replace(/\D/g, '');
    if (cleanCCCD && cleanCCCD.length !== 12) {
      alert("Số CCCD nếu nhập phải chứa đúng 12 chữ số theo quy định CSDL Dân cư & SMAS.");
      return;
    }

    const payload = {
      student_code: code.trim().toUpperCase() || `HS-${Date.now()}`,
      student_name: name.trim(),
      student_class: cleanClass,
      grade_level: getGradeLevel(cleanClass),
      identity_card: cleanCCCD,
      birth_date: birthDate.trim(),
      gender: gender,
      current_address: address.trim(),
      father_name: fatherName.trim(),
      father_phone: fatherPhone.trim(),
      parent_phone: fatherPhone.trim(),
      is_active: true
    };

    try {
      const dbClient = supabaseAdmin || supabase;
      let res;
      if (editingId) {
        const targetStudent = students.find(s => s.id === editingId);
        res = await dbClient.from('cbq_students').update(payload).eq('id', editingId);
        if (targetStudent && targetStudent.student_code) {
          await Promise.all([
            dbClient.from('cbq_parking_registrations').update({ student_class: cleanClass, student_name: name.trim() }).eq('student_code', targetStudent.student_code),
            dbClient.from('cbq_bus_registrations').update({ student_class: cleanClass, student_name: name.trim() }).eq('student_code', targetStudent.student_code)
          ]);
        }
      } else {
        res = await dbClient.from('cbq_students').insert([payload]);
      }

      if (res.error) {
        alert("⚠️ Lỗi từ Supabase (Do RLS Bảo vệ CSDL): " + res.error.message + "\nHãy chạy lệnh SQL: ALTER TABLE cbq_students DISABLE ROW LEVEL SECURITY;");
      } else {
        alert("🎉 ĐÃ LƯU THÔNG TIN HỌC SINH THÀNH CÔNG VÀ ĐỒNG BỘ SANG CÁC DỊCH VỤ DỰ BÁO/VÉ XE!");
      }

      setShowForm(false);
      resetFormState();
      fetchStudents();
    } catch (err) {
      alert("Lỗi khi lưu: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa học sinh này khỏi danh sách nhà trường?")) return;
    try {
      const dbClient = supabaseAdmin || supabase;
      await dbClient.from('cbq_students').delete().eq('id', id);
      setStudents(students.filter(s => s.id !== id));
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Mã Học Sinh": "HS10A01-001",
        "Họ và Tên": "Nguyễn Văn An",
        "Số CCCD / Mã Định Danh (12 số)": "001205012345",
        "Lớp": "10A01",
        "Ngày Sinh": "2008-05-15",
        "Giới Tính": "Nam",
        "Địa Chỉ Liên Lạc": "xã Phú Thị, huyện Gia Lâm, Hà Nội",
        "Họ Tên Phụ Huynh": "Nguyễn Văn Bình",
        "SĐT Phụ Huynh": "0912345678"
      },
      {
        "Mã Học Sinh": "HS11A02-015",
        "Họ và Tên": "Trần Thị Bích",
        "Số CCCD / Mã Định Danh (12 số)": "001206098765",
        "Lớp": "11A02",
        "Ngày Sinh": "2007-08-20",
        "Giới Tính": "Nữ",
        "Địa Chỉ Liên Lạc": "thị trấn Sài Đồng, huyện Gia Lâm, Hà Nội",
        "Họ Tên Phụ Huynh": "Trần Văn Cường",
        "SĐT Phụ Huynh": "0987654321"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 22 },
      { wch: 30 },
      { wch: 10 },
      { wch: 14 },
      { wch: 10 },
      { wch: 35 },
      { wch: 22 },
      { wch: 15 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mau_Hoc_Sinh_SMAS");
    XLSX.writeFile(workbook, "Mau_Import_Danh_Sach_Hoc_Sinh_THPT_CBQ_SMAS.xlsx");
  };

  const handleExportExcel = () => {
    const dataToExport = filteredStudents.map(s => ({
      "Mã Học Sinh": s.student_code || '',
      "Họ và Tên": s.student_name || s.full_name || '',
      "Số CCCD": s.identity_card || '',
      "Lớp": s.student_class || '',
      "Khối": s.grade_level || getGradeLevel(s.student_class),
      "Ngày Sinh": s.birth_date || '',
      "Giới Tính": s.gender || '',
      "Địa Chỉ": s.current_address || s.permanent_address || s.address || '',
      "Họ Tên Phụ Huynh": s.father_name || s.mother_name || s.parent_name || '',
      "SĐT Phụ Huynh": s.father_phone || s.mother_phone || s.parent_phone || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachHocSinh_SMAS");
    XLSX.writeFile(workbook, `Danh_Sach_Hoc_Sinh_SMAS_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Bulk Class Transfer State
  const [showBulkTransferForm, setShowBulkTransferForm] = useState(false);
  const [sourceClass, setSourceClass] = useState('');
  const [targetClass, setTargetClass] = useState('');

  const uniqueClassesList = Array.from(new Set(students.map(s => s.student_class))).filter(Boolean).sort();

  const handleIndividualTransfer = async (student) => {
    const newClassInput = window.prompt(`Chuyển lớp cho học sinh: ${student.student_name || student.full_name} (${student.student_class})\n\nNhập Tên Lớp Mới (VD: 11A01, 12A05):`, student.student_class);
    if (!newClassInput || !newClassInput.trim()) return;

    const cleanNewClass = newClassInput.trim().toUpperCase();
    const newGradeLevel = getGradeLevel(cleanNewClass);

    try {
      const updatedItem = {
        ...student,
        student_class: cleanNewClass,
        grade_level: newGradeLevel
      };

      setStudents(prev => {
        const newList = prev.map(s => s.student_code === student.student_code ? updatedItem : s);
        localStorage.setItem('cbq_students_data', JSON.stringify(newList));
        return newList;
      });

      const dbClient = supabaseAdmin || supabase;
      await Promise.all([
        dbClient.from('cbq_students').update({ student_class: cleanNewClass, grade_level: newGradeLevel }).eq('student_code', student.student_code),
        dbClient.from('cbq_parking_registrations').update({ student_class: cleanNewClass }).eq('student_code', student.student_code),
        dbClient.from('cbq_bus_registrations').update({ student_class: cleanNewClass }).eq('student_code', student.student_code)
      ]);

      alert(`🎉 Đã chuyển học sinh ${student.student_name || student.full_name} sang Lớp ${cleanNewClass} (${newGradeLevel}) và tự động cập nhật Thẻ giữ xe & Xe bus!`);
    } catch (err) {
      alert("Lỗi khi chuyển lớp: " + err.message);
    }
  };

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

      const dbClient = supabaseAdmin || supabase;
      const codesToMove = studentsToMove.map(s => s.student_code);
      await Promise.all([
        dbClient.from('cbq_students').update({ student_class: cleanTargetClass, grade_level: targetGradeLevel }).in('student_code', codesToMove),
        dbClient.from('cbq_parking_registrations').update({ student_class: cleanTargetClass }).in('student_code', codesToMove),
        dbClient.from('cbq_bus_registrations').update({ student_class: cleanTargetClass }).in('student_code', codesToMove)
      ]);

      alert(`🎉 ĐÃ CHUYỂN THÀNH CÔNG ${studentsToMove.length} HỌC SINH TỪ LỚP ${sourceClass} SANG LỚP ${cleanTargetClass} (${targetGradeLevel}) VÀ ĐỒNG BỘ TOÀN BỘ THẺ XE, XE BUS!`);
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
      (s.student_name || s.full_name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_class?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.identity_card?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.father_phone || s.parent_phone)?.includes(searchTerm);
    const matchGrade = selectedGrade === 'ALL' || computedGrade === selectedGrade;
    return matchSearch && matchGrade;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  const handleTestDatabaseConnection = async () => {
    const testCode = `TEST-${Date.now()}`;
    const testPayload = {
      student_code: testCode,
      student_name: "Học Sinh Test CSDL",
      student_class: "10A01",
      grade_level: "Khối 10",
      is_active: true
    };

    try {
      const dbClient = supabaseAdmin || supabase;

      const { data: selData, error: selErr } = await dbClient.from('cbq_students').select('*').limit(1);
      if (selErr) {
        alert(`❌ LỖI TRUY VẤN CSDL (SELECT):\n${selErr.code}: ${selErr.message}\n\n👉 Nguyên nhân: Bảng 'cbq_students' chưa có hoặc sai tên cột trên Supabase!\nHãy chạy file SQL tạo bảng trong Supabase SQL Editor.`);
        return;
      }

      const { data: insData, error: insErr } = await dbClient.from('cbq_students').insert([testPayload]).select();
      if (insErr) {
        alert(`❌ LỖI GHI CSDL (INSERT):\n${insErr.code}: ${insErr.message}\n\n👉 Nguyên nhân: RLS của Supabase đang khóa quyền ghi!\nHãy mở Supabase SQL Editor và chạy câu lệnh này:\n\nALTER TABLE cbq_students DISABLE ROW LEVEL SECURITY;\nGRANT ALL ON TABLE cbq_students TO public, anon, authenticated;`);
        return;
      }

      await dbClient.from('cbq_students').delete().eq('student_code', testCode);

      alert("🎉 KẾT NỐI VÀ GHI DỮ LIỆU THÀNH CÔNG 100% LÊN CSDL SUPABASE!");
    } catch (err) {
      alert("❌ Lỗi kết nối CSDL: " + err.message);
    }
  };

  return (
    <Layout title="Danh sách Học sinh Nhà trường">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={26} color="#be123c" /> Quản Lý Danh Sách Học Sinh Nhà Trường (Chuẩn SMAS)
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Quản lý CCCD, Lớp, Khối, Nhân thân và Đồng bộ tự động sang dịch vụ Vé xe & Xe bus
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleTestDatabaseConnection} className="btn-primary" style={{ padding: '10px 16px', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }} title="Kiểm tra xem CSDL Supabase có cho phép ghi dữ liệu không">
            <CheckCircle2 size={18} /> Test Ghi CSDL
          </button>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', backgroundColor: '#166534', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13.5px' }}>
            <FileSpreadsheet size={18} /> {uploading ? 'Đang Import...' : 'Import Từ File Excel'}
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <button onClick={() => setShowBulkTransferForm(!showBulkTransferForm)} className="btn-primary" style={{ padding: '10px 16px', backgroundColor: '#7c3aed', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={18} /> {showBulkTransferForm ? 'Đóng Chuyển Lớp' : 'Chuyển Lớp Hàng Loạt'}
          </button>

          <button onClick={handleDownloadTemplate} className="btn-primary" style={{ padding: '10px 16px', backgroundColor: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={18} /> Tải File Mẫu Import (SMAS)
          </button>

          <button onClick={handleExportExcel} className="btn-primary" style={{ padding: '10px 16px', backgroundColor: '#0284c7' }}>
            <Download size={18} /> Xuất Excel (SMAS)
          </button>

          <button onClick={() => { resetFormState(); setShowForm(!showForm); }} className="btn-primary" style={{ padding: '10px 18px', backgroundColor: '#be123c' }}>
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
                placeholder="VD: 11A01, 12A05..."
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

      {/* FORM SECTION (EXPLICIT SMAS / CSDL NGÀNH FIELDS) */}
      {showForm && (
        <form onSubmit={handleSubmitForm} className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'white', marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0, color: '#be123c', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
            {editingId ? '📝 Sửa thông tin Học sinh (Chuẩn SMAS)' : '➕ Thêm Học sinh Mới (Chuẩn SMAS)'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={styles.label}>Mã Học Sinh (*)</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value)} style={styles.input} placeholder="VD: HS10A01-001" />
            </div>
            <div>
              <label style={styles.label}>Họ và Tên Học sinh (*)</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} style={styles.input} placeholder="VD: Nguyễn Văn An" />
            </div>
            <div>
              <label style={{ ...styles.label, color: '#be123c' }}>Số CCCD / Mã Định Danh (12 số)</label>
              <input 
                type="text" 
                maxLength={12}
                value={identityCard} 
                onChange={e => setIdentityCard(e.target.value.replace(/\D/g, ''))} 
                style={{ ...styles.input, borderColor: '#fca5a5', backgroundColor: '#fff5f5', fontWeight: 'bold' }} 
                placeholder="VD: 001205012345" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={styles.label}>Lớp học (*)</label>
              <input type="text" required value={className} onChange={e => setClassName(e.target.value)} style={styles.input} placeholder="VD: 10A01" />
            </div>
            <div>
              <label style={styles.label}>Ngày Sinh</label>
              <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Giới Tính</label>
              <select value={gender} onChange={e => setGender(e.target.value)} style={styles.input}>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Địa Chỉ Liên Lạc</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} style={styles.input} placeholder="Xã/Phường, Quận/Huyện, Tỉnh/TP" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={styles.label}>Họ Tên Phụ Huynh / Người Giám Hộ</label>
              <input type="text" value={fatherName} onChange={e => setFatherName(e.target.value)} style={styles.input} placeholder="VD: Nguyễn Văn Bình" />
            </div>
            <div>
              <label style={styles.label}>Số Điện Thoại Phụ Huynh</label>
              <input type="tel" value={fatherPhone} onChange={e => setFatherPhone(e.target.value)} style={styles.input} placeholder="VD: 0912345678" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
            <button type="button" onClick={() => { setShowForm(false); resetFormState(); }} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold' }}>Hủy</button>
            <button type="submit" className="btn-primary" style={{ padding: '8px 20px', backgroundColor: '#be123c' }}>
              <Save size={16} /> Lưu Thông Tin Học Sinh
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
            placeholder="Tìm theo Mã HS, CCCD, Họ tên, Lớp, SĐT Phụ huynh..."
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
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                  <th style={{ padding: '10px' }}>STT</th>
                  <th style={{ padding: '10px' }}>Mã Học Sinh</th>
                  <th style={{ padding: '10px' }}>Số CCCD (12 số)</th>
                  <th style={{ padding: '10px' }}>Họ và Tên</th>
                  <th style={{ padding: '10px' }}>Lớp / Khối</th>
                  <th style={{ padding: '10px' }}>Ngày Sinh / Giới Tính</th>
                  <th style={{ padding: '10px' }}>Phụ Huynh & SĐT</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((s, idx) => {
                  const sName = s.student_name || s.full_name || '';
                  const sCccd = s.identity_card || 'Chưa cập nhật';
                  const sClass = s.student_class || '';
                  const sGrade = s.grade_level || getGradeLevel(sClass);
                  const sBirth = s.birth_date || '---';
                  const sGender = s.gender || 'Nam';
                  const pName = s.father_name || s.mother_name || s.parent_name || '';
                  const pPhone = s.father_phone || s.mother_phone || s.parent_phone || '';

                  return (
                    <tr key={s.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>#{indexOfFirstItem + idx + 1}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#0284c7' }}>{s.student_code}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: s.identity_card ? '#059669' : '#94a3b8' }}>
                        {sCccd}
                      </td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{sName}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#be123c' }}>
                        {sClass} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>({sGrade})</span>
                      </td>
                      <td style={{ padding: '10px', color: '#475569' }}>
                        {sBirth} | {sGender}
                      </td>
                      <td style={{ padding: '10px', color: '#334155' }}>
                        {pName ? <div><strong>{pName}</strong></div> : null}
                        {pPhone ? <div style={{ fontSize: '12px', color: '#0284c7' }}>📞 {pPhone}</div> : <span style={{ color: '#cbd5e1' }}>---</span>}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button type="button" onClick={() => handleIndividualTransfer(s)} title="Chuyển lớp học sinh" style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #7c3aed', background: '#f5f3ff', color: '#7c3aed', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <RefreshCw size={12} /> Chuyển Lớp
                          </button>
                          <button type="button" onClick={() => {
                            setEditingId(s.id);
                            setCode(s.student_code || '');
                            setName(sName);
                            setClassName(sClass);
                            setIdentityCard(s.identity_card || '');
                            setBirthDate(s.birth_date || '');
                            setGender(s.gender || 'Nam');
                            setAddress(s.current_address || s.permanent_address || s.address || '');
                            setFatherName(pName);
                            setFatherPhone(pPhone);
                            setShowForm(true);
                          }} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', cursor: 'pointer' }}>
                            <Edit3 size={14} />
                          </button>
                          <button type="button" onClick={() => handleDelete(s.id)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* PAGINATION CONTROLS */}
            {filteredStudents.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ fontSize: '13.5px', color: '#64748b' }}>
                  Hiển thị <strong>{indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, filteredStudents.length)}</strong> trong tổng số <strong>{filteredStudents.length}</strong> học sinh
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '13.5px', color: '#64748b', fontWeight: 'bold' }}>Số dòng mỗi trang:</label>
                  <select
                    value={itemsPerPage}
                    onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none' }}
                  >
                    <option value={50}>50 dòng</option>
                    <option value={100}>100 dòng</option>
                    <option value={200}>200 dòng</option>
                    <option value={500}>500 dòng</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    style={{ padding: '6px 14px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f8fafc' : 'white', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}
                  >
                    Trang trước
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: '13.5px', fontWeight: 'bold', color: '#0f172a' }}>
                    Trang {currentPage} / {totalPages || 1}
                  </div>

                  <button
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    style={{ padding: '6px 14px', border: '1px solid #cbd5e1', background: (currentPage === totalPages || totalPages === 0) ? '#f8fafc' : 'white', color: (currentPage === totalPages || totalPages === 0) ? '#94a3b8' : '#334155', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}
                  >
                    Trang tiếp
                  </button>
                </div>
              </div>
            )}
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
