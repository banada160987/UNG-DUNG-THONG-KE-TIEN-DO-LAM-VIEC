import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, ArrowLeft, Sparkles, BookOpen, Target, Award, 
  GraduationCap, CheckCircle2, ChevronRight, Download, BrainCircuit,
  Building2, Users, Layers, AlertTriangle, Lightbulb
} from 'lucide-react';

const ELECTIVE_SUBJECTS = [
  { id: 'anh', name: 'Tiếng Anh', icon: '🌍', desc: 'Mở rộng hầu hết các khối xét tuyển D01, A01, D07' },
  { id: 'ly', name: 'Vật lí', icon: '⚡', desc: 'Cốt lõi cho khối kỹ thuật, công nghệ, A00, A01' },
  { id: 'hoa', name: 'Hóa học', icon: '🧪', desc: 'Trọng tâm cho khối Y Dược, Hóa sinh, A00, B00' },
  { id: 'sinh', name: 'Sinh học', icon: '🧬', desc: 'Bắt buộc cho Y khoa, Công nghệ sinh học B00' },
  { id: 'su', name: 'Lịch sử', icon: '📜', desc: 'Môn thi bắt buộc hoặc tự chọn khối Xã hội C00, C19' },
  { id: 'dia', name: 'Địa lí', icon: '🌐', desc: 'Thế mạnh khối C00, Logistics, Quản trị du lịch' },
  { id: 'gdktpl', name: 'GDKT & PL', icon: '⚖️', desc: 'Thích hợp ngành Luật, Quản trị, Kinh tế chính trị' },
  { id: 'tin', name: 'Tin học', icon: '💻', desc: 'Ưu thế mới cho CNTT, Khoa học dữ liệu, AI' },
  { id: 'cn', name: 'Công nghệ', icon: '⚙️', desc: 'Ứng dụng thực tiễn trong nông nghiệp số & công nghiệp' }
];

const CAREER_GROUPS = [
  {
    id: 'it_ai',
    name: 'Công Nghệ Thông Tin & AI',
    icon: '💻',
    color: '#0284c7',
    desc: 'Lập trình, Trí tuệ nhân tạo, Vi mạch bán dẫn, An ninh mạng',
    recommendedElectives: ['Vật lí', 'Tiếng Anh'],
    topCombos: ['A00 (Toán, Lý, Hóa)', 'A01 (Toán, Lý, Anh)', 'D01 (Toán, Văn, Anh)'],
    unis: ['ĐH Bách Khoa TP.HCM', 'ĐH CNTT (ĐHQG TP.HCM)', 'ĐH Tây Nguyên (Khoa CNTT)', 'ĐH Bách Khoa Đà Nẵng']
  },
  {
    id: 'med_health',
    name: 'Y Đa Khoa, Dược & Sức Khỏe',
    icon: '🩺',
    color: '#16a34a',
    desc: 'Bác sĩ, Dược sĩ, Nha khoa, Kỹ thuật xét nghiệm y sinh',
    recommendedElectives: ['Hóa học', 'Sinh học'],
    topCombos: ['B00 (Toán, Hóa, Sinh)', 'A00 (Toán, Lý, Hóa)', 'B08 (Toán, Sinh, Anh)'],
    unis: ['ĐH Y Dược TP.HCM', 'ĐH Y Khoa Phạm Ngọc Thạch', 'Khoa Y - ĐH Tây Nguyên', 'Khoa Y Dược - ĐH Đà Nẵng']
  },
  {
    id: 'biz_fin',
    name: 'Kinh Tế, Tài Chính & Marketing',
    icon: '📈',
    color: '#f59e0b',
    desc: 'Tài chính ngân hàng, Kinh doanh quốc tế, Digital Marketing, Logistics',
    recommendedElectives: ['Tiếng Anh', 'Vật lí'],
    topCombos: ['A01 (Toán, Lý, Anh)', 'D01 (Toán, Văn, Anh)', 'D07 (Toán, Hóa, Anh)'],
    unis: ['ĐH Kinh Tế TP.HCM (UEH)', 'ĐH Ngoại Thương', 'ĐH Kinh Tế - Luật', 'ĐH Tây Nguyên (Khoa Kinh tế)']
  },
  {
    id: 'law_social',
    name: 'Luật, Ngoại Giao & Xã Hội',
    icon: '⚖️',
    color: '#8b5cf6',
    desc: 'Luật kinh tế, Luật quốc tế, Ngoại giao, Báo chí, Tâm lý học',
    recommendedElectives: ['Lịch sử', 'Tiếng Anh'],
    topCombos: ['C00 (Văn, Sử, Địa)', 'D01 (Toán, Văn, Anh)', 'C19 (Văn, Sử, GDKT&PL)'],
    unis: ['ĐH Luật TP.HCM', 'ĐH KHXH&NV TP.HCM', 'Học viện Ngoại Giao', 'Khoa Luật - ĐH Tây Nguyên']
  },
  {
    id: 'pedagogy',
    name: 'Sư Phạm & Giáo Dục',
    icon: '🏫',
    color: '#e11d48',
    desc: 'Giáo viên Toán, Văn, Ngoại ngữ, Tiểu học, Quản lý giáo dục',
    recommendedElectives: ['Tiếng Anh', 'Vật lí'],
    topCombos: ['D01 (Toán, Văn, Anh)', 'C00 (Văn, Sử, Địa)', 'A00 (Toán, Lý, Hóa)'],
    unis: ['ĐH Sư Phạm TP.HCM', 'ĐH Sư Phạm Huế', 'ĐH Sư Phạm Đà Nẵng', 'Khoa Sư phạm - ĐH Tây Nguyên']
  }
];

export default function StudentCareerAdvisor() {
  const [studentName, setStudentName] = useState(() => {
    try {
      const s = localStorage.getItem('cbq_current_student');
      return s ? JSON.parse(s).full_name : '';
    } catch (e) {
      return '';
    }
  });
  const [studentClass, setStudentClass] = useState(() => {
    try {
      const s = localStorage.getItem('cbq_current_student');
      return s ? JSON.parse(s).student_class : '12A01';
    } catch (e) {
      return '12A01';
    }
  });

  const [selectedElectives, setSelectedElectives] = useState(['Tiếng Anh', 'Vật lí']);
  const [targetCareerId, setTargetCareerId] = useState('it_ai');
  const [academicProfile, setAcademicProfile] = useState({
    math: 8.5,
    literature: 7.5,
    english: 8.0,
    physics: 8.0,
    chemistry: 7.0,
    biology: 6.5,
    history: 7.0,
    geography: 7.5,
    informatics: 9.0
  });

  const selectedCareer = useMemo(() => {
    return CAREER_GROUPS.find(c => c.id === targetCareerId) || CAREER_GROUPS[0];
  }, [targetCareerId]);

  const toggleElective = (subjectName) => {
    if (selectedElectives.includes(subjectName)) {
      if (selectedElectives.length <= 1) {
        alert("Em cần chọn ít nhất 1 môn để hệ thống gợi ý tổ hợp!");
        return;
      }
      setSelectedElectives(selectedElectives.filter(s => s !== subjectName));
    } else {
      if (selectedElectives.length >= 2) {
        // Thay thế môn thứ 2 nếu đã chọn đủ 2
        setSelectedElectives([selectedElectives[0], subjectName]);
      } else {
        setSelectedElectives([...selectedElectives, subjectName]);
      }
    }
  };

  // Tính toán các tổ hợp xét tuyển đại học tạo bởi: Toán + Ngữ văn + 2 môn tự chọn
  const analyzedCombinations = useMemo(() => {
    const list = [];
    const hasMath = true;
    const hasLit = true;
    const hasEng = selectedElectives.includes('Tiếng Anh');
    const hasPhy = selectedElectives.includes('Vật lí');
    const hasChem = selectedElectives.includes('Hóa học');
    const hasBio = selectedElectives.includes('Sinh học');
    const hasHis = selectedElectives.includes('Lịch sử');
    const hasGeo = selectedElectives.includes('Địa lí');
    const hasGdkt = selectedElectives.includes('GDKT & PL');
    const hasTin = selectedElectives.includes('Tin học');

    // D01: Toán, Văn, Anh
    if (hasMath && hasLit && hasEng) {
      list.push({ code: 'D01', name: 'Toán, Ngữ văn, Tiếng Anh', broadness: 'Rất Rộng (>60% ngành)', scoreEstimate: (academicProfile.math + academicProfile.literature + academicProfile.english).toFixed(1) });
    }
    // A00: Toán, Lý, Hóa
    if (hasMath && hasPhy && hasChem) {
      list.push({ code: 'A00', name: 'Toán, Vật lí, Hóa học', broadness: 'Kỹ thuật, Công nghệ & Y Dược', scoreEstimate: (academicProfile.math + academicProfile.physics + academicProfile.chemistry).toFixed(1) });
    }
    // A01: Toán, Lý, Anh
    if (hasMath && hasPhy && hasEng) {
      list.push({ code: 'A01', name: 'Toán, Vật lí, Tiếng Anh', broadness: 'Xu hướng Hot: CNTT, Bán dẫn, Tự động hóa', scoreEstimate: (academicProfile.math + academicProfile.physics + academicProfile.english).toFixed(1) });
    }
    // B00: Toán, Hóa, Sinh
    if (hasMath && hasChem && hasBio) {
      list.push({ code: 'B00', name: 'Toán, Hóa học, Sinh học', broadness: 'Độc quyền ngành Y, Dược & Sinh học', scoreEstimate: (academicProfile.math + academicProfile.chemistry + academicProfile.biology).toFixed(1) });
    }
    // D07: Toán, Hóa, Anh
    if (hasMath && hasChem && hasEng) {
      list.push({ code: 'D07', name: 'Toán, Hóa học, Tiếng Anh', broadness: 'Hóa dược, Công nghệ thực phẩm, Môi trường', scoreEstimate: (academicProfile.math + academicProfile.chemistry + academicProfile.english).toFixed(1) });
    }
    // C00: Văn, Sử, Địa
    if (hasLit && hasHis && hasGeo) {
      list.push({ code: 'C00', name: 'Ngữ văn, Lịch sử, Địa lí', broadness: 'Báo chí, Sư phạm Văn/Sử/Địa, Luật, Quân đội', scoreEstimate: (academicProfile.literature + academicProfile.history + academicProfile.geography).toFixed(1) });
    }
    // C19: Văn, Sử, GDKT&PL
    if (hasLit && hasHis && hasGdkt) {
      list.push({ code: 'C19', name: 'Ngữ văn, Lịch sử, GDKT & PL', broadness: 'Luật, Hành chính, Quản lý nhà nước', scoreEstimate: (academicProfile.literature + academicProfile.history + 8.0).toFixed(1) });
    }
    // A02: Toán, Lý, Sinh
    if (hasMath && hasPhy && hasBio) {
      list.push({ code: 'A02', name: 'Toán, Vật lí, Sinh học', broadness: 'Kỹ thuật Y sinh, Nông lâm', scoreEstimate: (academicProfile.math + academicProfile.physics + academicProfile.biology).toFixed(1) });
    }
    // Tổ hợp Tin học mới (Toán, Văn, Tin / Toán, Lý, Tin)
    if (hasMath && hasTin) {
      list.push({ code: 'Tổ hợp Tin', name: hasPhy ? 'Toán, Vật lí, Tin học' : 'Toán, Ngữ văn, Tin học', broadness: 'Đón đầu định hướng CNTT theo GDPT 2018', scoreEstimate: (academicProfile.math + (hasPhy ? academicProfile.physics : academicProfile.literature) + academicProfile.informatics).toFixed(1) });
    }

    return list;
  }, [selectedElectives, academicProfile]);

  // Xuất Báo Cáo Định Hướng Word chuẩn Nghị định 30 & GEMINI.md
  const handleExportWordRoadmap = () => {
    const safeName = (studentName || 'HocSinh').replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Lộ trình hướng nghiệp GDPT 2018</title>
        <style>
          @page Section1 { size: 21.0cm 29.7cm; margin: 2.0cm 2.0cm 2.0cm 3.0cm; mso-header-margin: 35.4pt; }
          div.Section1 { page: Section1; }
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.35; color: #000000; }
          h1, h2, h3 { font-family: 'Times New Roman', serif; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
          th, td { border: 1pt solid black; padding: 6px 8px; font-size: 12pt; text-align: left; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <p class="center" style="font-size: 11pt; text-transform: uppercase; margin-bottom: 2px;">SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐẮK LẮK<br><b>TRƯỜNG THPT CAO BÁ QUÁT</b></p>
          <hr style="width: 30%; margin: 4px auto 16px auto;">
          <h2 style="text-transform: uppercase; color: #1e3a8a; margin-top: 10px;">BÁO CÁO TƯ VẤN ĐỊNH HƯỚNG TỔ HỢP MÔN THI TN THPT 2026<br><span style="font-size: 12pt; font-weight: normal;">(Mô hình thi 2+2 theo Chương trình GDPT 2018 & Xét tuyển Đại học)</span></h2>
          
          <p><b>Họ và tên học sinh:</b> ${studentName || 'Nguyễn Văn An'} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>Lớp:</b> ${studentClass}</p>
          <p><b>Ngành nghề mục tiêu:</b> ${selectedCareer.name}</p>
          <p><b>Mô hình thi TN THPT lựa chọn:</b> 02 Môn Bắt Buộc (Toán, Ngữ văn) + 02 Môn Tự Chọn: <b>${selectedElectives.join(' và ')}</b></p>
          
          <h3>I. CÁC TỔ HỢP XÉT TUYỂN ĐẠI HỌC TỐI ƯU TẠO RA</h3>
          <table>
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th class="center" style="width: 15%;">Mã Tổ Hợp</th>
                <th style="width: 35%;">Các Môn Thành Phần</th>
                <th style="width: 35%;">Độ Mở Khối Ngành</th>
                <th class="center" style="width: 15%;">Điểm Ước Tính</th>
              </tr>
            </thead>
            <tbody>
              ${analyzedCombinations.map(c => `
                <tr>
                  <td class="center"><b>${c.code}</b></td>
                  <td>${c.name}</td>
                  <td>${c.broadness}</td>
                  <td class="center"><b>${c.scoreEstimate} đ</b></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h3>II. DANH MỤC TRƯỜNG ĐẠI HỌC TIÊU BIỂU GỢI Ý</h3>
          <ul>
            ${selectedCareer.unis.map(u => `<li><b>${u}</b></li>`).join('')}
          </ul>

          <h3>III. KHUYẾN NGHỊ TỪ BAN TƯ VẤN HƯỚNG NGHIỆP THPT CAO BÁ QUÁT</h3>
          <p>- Cần tập trung củng cố 2 môn bắt buộc Toán và Văn đạt điểm sàn an toàn (&ge; 7.5 điểm).</p>
          <p>- Hai môn tự chọn đã chọn (${selectedElectives.join(', ')}) rất phù hợp với xu thế tuyển sinh của các trường đại học nhóm ${selectedCareer.name}.</p>
          
          <table style="border: none; margin-top: 30px;">
            <tr style="border: none;">
              <td style="border: none; width: 50%; text-align: center;"></td>
              <td style="border: none; width: 50%; text-align: center;">
                <i>Buôn Ma Thuột, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</i><br>
                <b>BAN TƯ VẤN HƯỚNG NGHIỆP & HỌC ĐƯỜNG</b><br>
                <br><br><br>
                <b>Hệ Thống Trợ Lý AI - THPT Cao Bá Quát</b>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // QUY TẮC GEMINI.md: Tiền tố số thứ tự 1- ở đầu file
    a.download = `1-Lo_Trinh_Dinh_Huong_Nghe_Nghiep_K12_${safeName}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px', fontFamily: '"Inter", sans-serif', color: '#1e293b' }}>
      
      {/* NAVIGATION BACK */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Link to="/student-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 'bold' }}>
          <ArrowLeft size={18} /> Quay lại Không gian Học sinh
        </Link>
        <button
          onClick={handleExportWordRoadmap}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
        >
          <Download size={15} /> Xuất Báo Cáo Định Hướng Word
        </button>
      </div>

      {/* HEADER BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)',
        color: '#ffffff',
        padding: '28px',
        borderRadius: '24px',
        marginBottom: '28px',
        boxShadow: '0 10px 25px rgba(37, 99, 235, 0.25)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
          <Sparkles size={14} color="#fde047" /> ĐÓN ĐẦU CHƯƠNG TRÌNH GDPT 2018 - THPT 2026
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Compass size={30} color="#93c5fd" /> AI CỐ VẤN TỔ HỢP MÔN THI TN THPT (2+2) & HƯỚNG NGHIỆP
        </h1>
        <p style={{ margin: 0, fontSize: '14.5px', opacity: 0.95, lineHeight: '1.5' }}>
          Phân tích thông minh: Kết hợp <strong>Toán + Ngữ văn</strong> cùng <strong>02 môn tự chọn</strong> tối ưu cơ hội xét tuyển Đại học trên toàn quốc.
        </p>
      </div>

      {/* MAIN TWO COLUMN LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* LEFT COLUMN: CHỌN NGHỀ & CHỌN MÔN TỰ CHỌN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 1: Chọn Ngành Nghề Ước Mơ */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 'bold', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} color="#2563eb" /> 1. Chọn Lĩnh Vực / Ngành Nghề Mục Tiêu
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {CAREER_GROUPS.map(c => {
                const isSelected = targetCareerId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setTargetCareerId(c.id);
                      setSelectedElectives(c.recommendedElectives);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: isSelected ? `2px solid ${c.color}` : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#f8fafc' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{c.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: isSelected ? c.color : '#1e293b' }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {c.desc}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 size={18} color={c.color} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Chọn 2 Môn Tự Chọn trong 9 Môn */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} color="#2563eb" /> 2. Chọn 02 Môn Thi Tự Chọn
              </h3>
              <span style={{ fontSize: '12px', fontWeight: 'bold', backgroundColor: selectedElectives.length === 2 ? '#dcfce7' : '#fee2e2', color: selectedElectives.length === 2 ? '#15803d' : '#b91c1c', padding: '3px 8px', borderRadius: '6px' }}>
                Đã chọn {selectedElectives.length}/2 môn
              </span>
            </div>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748b' }}>
              (Toán và Ngữ văn là 02 môn bắt buộc thi của Bộ GD&ĐT)
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {ELECTIVE_SUBJECTS.map(subj => {
                const isChecked = selectedElectives.includes(subj.name);
                return (
                  <div
                    key={subj.id}
                    onClick={() => toggleElective(subj.name)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: isChecked ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: isChecked ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ fontSize: '20px' }}>{subj.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: isChecked ? '#1d4ed8' : '#334155', marginTop: '4px' }}>
                      {subj.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: KẾT QUẢ PHÂN TÍCH MA TRẬN KHỐI THI & TRƯỜNG ĐẠI HỌC */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 3: Tổ Hợp Môn Mở Ra */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 'bold', color: '#047857', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#059669" /> Các Khối Thi Đại Học Được Mở Ra ({analyzedCombinations.length} khối)
            </h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#64748b' }}>
              Dựa trên: <strong>Toán + Văn + {selectedElectives.join(' + ')}</strong>
            </p>

            {analyzedCombinations.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                Vui lòng chọn đủ 2 môn tự chọn để hệ thống mở các khối xét tuyển.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {analyzedCombinations.map(combo => (
                  <div key={combo.code} style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '900', color: '#15803d' }}>
                          Khối {combo.code}
                        </span>
                        <span style={{ fontSize: '12px', color: '#166534', fontWeight: '600' }}>
                          ({combo.name})
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '3px' }}>
                        🎯 {combo.broadness}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: '900', color: '#059669' }}>
                        {combo.scoreEstimate}đ
                      </div>
                      <div style={{ fontSize: '10px', color: '#6b7280' }}>Ước tính</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 4: Top Trường Đại Học Tiêu Biểu */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="#2563eb" /> Trường Đại Học Tiêu Biểu Khu Vực & Cả Nước
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedCareer.unis.map((uni, idx) => (
                <div key={idx} style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '13.5px', fontWeight: '600', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GraduationCap size={16} color="#3b82f6" /> {uni}
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: Lời Khuyên Sư Phạm Của Thầy Cô */}
          <div style={{ backgroundColor: '#fffbeb', borderRadius: '18px', padding: '18px', border: '1px solid #fef3c7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>
              <Lightbulb size={18} /> Lời Khuyên Sư Phạm Dành Cho Học Sinh THPT Cao Bá Quát
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#92400e', lineHeight: '1.5' }}>
              Việc chọn cặp môn <strong>{selectedElectives.join(' và ')}</strong> mang lại lợi thế kép: vừa bám sát thế mạnh học bạ của em, vừa mở ra {analyzedCombinations.length} khối thi then chốt. Hãy giữ vững sự tập trung vào bài tập thực hành trên lớp và tham gia các buổi tư vấn chuyên đề của trường!
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
