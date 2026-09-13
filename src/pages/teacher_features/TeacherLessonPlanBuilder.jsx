import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Save, Download, Sparkles, Plus, Trash2, Edit3, Copy, Check, FileText, Printer } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// 📚 Pre-built Expert Templates according to GDPT 2018 & CV 5512/BGDĐT
const SUBJECT_TEMPLATES = {
  'Toán': {
    lessonTitle: 'Cấp số cộng và Cấp số nhân',
    subject: 'Toán',
    grade: 'Khối 11',
    duration: '2 tiết',
    objectives: {
      knowledge: '- Nắm vững định nghĩa, công thức số hạng tổng quát, tính chất và tổng n số hạng đầu của cấp số cộng, cấp số nhân.\n- Giải quyết các bài toán thực tế liên quan đến tính toán tăng trưởng, lãi suất, chuỗi chu kỳ.',
      competencies: '1. Năng lực chung:\n- Năng lực tự chủ và tự học: Tự nghiên cứu ví dụ SGK và hoàn thành phiếu học tập.\n- Năng lực giải quyết vấn đề và sáng tạo: Vận dụng kiến thức cấp số để tính bài toán tài chính.\n2. Năng lực đặc thù:\n- Năng lực tư duy và lập luận toán học.\n- Năng lực mô hình hóa toán học.',
      qualities: '- Chăm chỉ: Tích cực suy nghĩ giải bài tập cá nhân và làm việc nhóm.\n- Trung thực: Tự giác làm bài và đánh giá kết quả đúng thực chất.\n- Trách nhiệm: Hoàn thành nhiệm vụ được phân công trong nhóm.'
    },
    equipment: {
      teacher: 'Kế hoạch bài dạy, bài giảng trình chiếu PowerPoint, Phụ lục bài tập, Phiếu học tập số 1 và 2.',
      student: 'SGK Toán 11, Vở ghi, Thước kẻ, Máy tính cầm tay FX-580VN X.'
    },
    activities: [
      {
        id: 'act_1',
        name: 'Hoạt động 1: Mở đầu / Khởi động (10 phút)',
        objective: 'Tạo tình huống có vấn đề về sự tăng trưởng số lượng theo quy luật cộng dồn, kích thích học sinh khám phá khái niệm cấp số cộng.',
        content: 'GV chiếu bài toán thực tế: "Một vận động viên chạy cự ly ngày đầu 2km, mỗi ngày tiếp theo chạy tăng thêm 0.5km. Hỏi sau 10 ngày vận động viên chạy được bao nhiêu km trong ngày thứ 10?"',
        product: 'Câu trả lời của HS: Ngày thứ nhất 2km, ngày thứ 2 là 2.5km... ngày thứ 10 là 2 + 9 x 0.5 = 6.5km.',
        execution: {
          step1: 'GV giao nhiệm vụ: Yêu cầu HS tính nhẩm và viết dãy số quãng đường chạy từ ngày 1 đến ngày 5.',
          step2: 'HS cá nhân suy nghĩ, ghi kết quả ra nháp trong 3 phút.',
          step3: 'GV gọi 2 HS đại diện lên bảng viết dãy số; các HS khác nhận xét.',
          step4: 'GV kết luận: Dãy số trên có đặc điểm kể từ số hạng thứ hai, mỗi số hạng đều bằng số hạng đứng ngay trước nó cộng với một số không đổi (0.5). Đó là ví dụ về Cấp số cộng.'
        }
      },
      {
        id: 'act_2',
        name: 'Hoạt động 2: Hình thành kiến thức mới (35 phút)',
        objective: 'Học sinh phát biểu được định nghĩa Cấp số cộng, công thức số hạng tổng quát Un = U1 + (n-1)d và công thức tính tổng Sn.',
        content: 'Nghiên cứu Định nghĩa Cấp số cộng (SGK), rút ra công thức tổng quát và công thức tổng n số hạng đầu.',
        product: 'Bản ghi chép định nghĩa, công thức $U_n = U_1 + (n-1)d$ và $S_n = \\frac{n(U_1 + U_n)}{2}$ trong vở học sinh.',
        execution: {
          step1: 'GV chia lớp thành 4 nhóm, phát Phiếu học tập số 1 chứa các câu hỏi gợi mở định nghĩa và chứng minh bằng phương pháp quy suy luận.',
          step2: 'Các nhóm thảo luận trong 10 phút, ghi kết quả lên bảng phụ / giấy A0.',
          step3: 'Đại diện Nhóm 1 và Nhóm 3 trình bày sản phẩm; Nhóm 2 và Nhóm 4 phản biện, góp ý.',
          step4: 'GV nhận xét, chính xác hóa kiến thức, ghi bảng công thức chuẩn và đưa ra ví dụ minh họa mẫu.'
        }
      },
      {
        id: 'act_3',
        name: 'Hoạt động 3: Luyện tập (30 phút)',
        objective: 'Học sinh vận dụng được các công thức đã học để giải bài tập tìm U1, d, Un, Sn và xác định một dãy số có phải cấp số cộng hay không.',
        content: 'Giải các bài tập 1, 2, 3 trong SGK và bài tập trắc nghiệm nhanh trên phiếu học tập số 2.',
        product: 'Lời giải chi tiết bài tập trong vở của học sinh.',
        execution: {
          step1: 'GV giao bài tập theo mức độ: Bài 1 (Nhận biết U1, d), Bài 2 (Tính Un), Bài 3 (Tính Sn).',
          step2: 'HS làm bài cá nhân 15 phút. GV đi quanh lớp quan sát và hỗ trợ học sinh yếu.',
          step3: 'GV gọi 3 HS lên bảng trình bày 3 bài tập; gọi HS dưới lớp nhận xét chéo.',
          step4: 'GV nhận xét bài làm trên bảng, chỉ ra các lỗi sai phổ biến (nhầm dấu d, quên bớt 1 đơn vị ở n-1).'
        }
      },
      {
        id: 'act_4',
        name: 'Hoạt động 4: Vận dụng (15 phút)',
        objective: 'Vận dụng cấp số cộng vào giải quyết bài toán tính tiền tiết kiệm hoặc tính số hàng ghế trong rạp hát.',
        content: 'Bài toán rạp hát có 20 hàng ghế, hàng 1 có 15 ghế, mỗi hàng sau nhiều hơn hàng trước 2 ghế. Tính tổng số ghế của rạp hát.',
        product: 'Bài giải hoàn chỉnh bài toán thực tế của học sinh.',
        execution: {
          step1: 'GV trình chiếu bài toán thực tế và yêu cầu HS phân tích U1 = ?, d = ?, n = ?',
          step2: 'HS thảo luận cặp đôi trong 5 phút.',
          step3: 'GV gọi 1 cặp HS lên trình bày: U1 = 15, d = 2, n = 20 -> S20 = 20*(2*15 + 19*2)/2 = 680 ghế.',
          step4: 'GV tổng kết bài học, dặn dò bài tập về nhà.'
        }
      }
    ]
  },
  'Ngữ văn': {
    lessonTitle: 'Đọc hiểu văn bản: Vợ Nhặt (Kim Lân)',
    subject: 'Ngữ văn',
    grade: 'Khối 12',
    duration: '2 tiết',
    objectives: {
      knowledge: '- Tóm tắt được tác phẩm, phân tích được hình tượng nhân vật Tràng, thị và bà cụ Tứ trong nạn đói năm 1945.\n- Cảm nhận được giá trị nhân đạo sâu sắc: tình người, niềm hy vọng sống và sức sống kỳ diệu của con người Việt Nam.',
      competencies: '1. Năng lực chung: Năng lực tự chủ, giao tiếp và hợp tác văn học.\n2. Năng lực đặc thù: Năng lực đọc hiểu văn bản tự sự hiện đại, năng lực cảm thụ thẩm mỹ.',
      qualities: '- Nhân ái: Biết thấu hiểu, sẻ chia với những kiếp người nghèo khổ.\n- Trách nhiệm: Trân trọng giá trị cuộc sống hòa bình, ấm no hôm nay.'
    },
    equipment: {
      teacher: 'Kế hoạch bài dạy, bài trình chiếu, tư liệu hình ảnh nạn đói năm 1945, chân dung nhà văn Kim Lân.',
      student: 'SGK Ngữ văn 12, Soạn bài theo câu hỏi hướng dẫn đọc hiểu.'
    },
    activities: [
      {
        id: 'act_1',
        name: 'Hoạt động 1: Mở đầu / Khởi động (5 phút)',
        objective: 'Tạo không gian cảm xúc về bức tranh lịch sử nạn đói 1945, dẫn dắt vào bài học Vợ Nhặt.',
        content: 'GV chiếu đoạn clip tư liệu ngắn (2 phút) về nạn đói năm Ất Dậu 1945.',
        product: 'Cảm xúc và suy nghĩ ban đầu của HS về thảm kịch nạn đói và giá trị sự sống.',
        execution: {
          step1: 'GV chiếu tư liệu và đặt câu hỏi: "Em có cảm nhận gì về không khí và con người trong đoạn phim?"',
          step2: 'HS quan sát và chuẩn bị ý kiến cá nhân.',
          step3: 'GV mời 2 HS phát biểu cảm nghĩ.',
          step4: 'GV dẫn dắt: Trong cái ranh giới mong mong giữa sự sống và cái chết ấy, Kim Lân đã thắp lên ngọn lửa ấm áp của tình người qua tác phẩm "Vợ nhặt".'
        }
      },
      {
        id: 'act_2',
        name: 'Hoạt động 2: Hình thành kiến thức mới (40 phút)',
        objective: 'Phân tích tình huống truyện độc đáo và diễn biến tâm trạng nhân vật Tràng, Thị và bà cụ Tứ.',
        content: 'Thảo luận nhóm về tình huống "nhặt được vợ" và phân tích tâm trạng bà cụ Tứ trong bữa cơm ngày đói.',
        product: 'Sơ đồ tư duy phân tích tình huống truyện và nét đẹp tâm hồn nhân vật bà cụ Tứ.',
        execution: {
          step1: 'GV chia 3 nhóm thảo luận: Nhóm 1 (Tình huống truyện), Nhóm 2 (Nhân vật Tràng & Thị), Nhóm 3 (Bà cụ Tứ).',
          step2: 'Các nhóm thảo luận 15 phút ghi phiếu học tập.',
          step3: 'Đại diện nhóm thuyết trình, các nhóm khác nhận xét phản biện.',
          step4: 'GV chốt kiến thức cơ bản về tình huống éo le nhưng chứa chan tình người, sự thay đổi tâm lý từ âu lo đến hy vọng.'
        }
      },
      {
        id: 'act_3',
        name: 'Hoạt động 3: Luyện tập (25 phút)',
        objective: 'Củng cố nghệ thuật miêu tả tâm lý nhân vật và giá trị nhân đạo của tác phẩm.',
        content: 'Viết đoạn văn ngắn (8-10 câu) cảm nhận về hình ảnh "bát cháo cám" ở cuối tác phẩm.',
        product: 'Đoạn văn cảm nhận của học sinh trong vở bài tập.',
        execution: {
          step1: 'GV nêu đề bài viết đoạn văn ngắn.',
          step2: 'HS làm bài độc lập trong 10 phút.',
          step3: 'GV gọi 2-3 HS đọc đoạn văn, GV và lớp cùng góp ý.',
          step4: 'GV nhận xét, chỉ ra cái hay trong cách thể hiện tình thương bao la của người mẹ nghèo.'
        }
      },
      {
        id: 'act_4',
        name: 'Hoạt động 4: Vận dụng (10 phút)',
        objective: 'Liên hệ thực tế về tinh thần lá lành đùm lá rách trong đời sống hôm nay.',
        content: 'Tìm hiểu các hoạt động thiện nguyện, chia sẻ khó khăn trong cộng đồng em biết.',
        product: 'Ý kiến liên hệ thực tế của học sinh.',
        execution: {
          step1: 'GV giao câu hỏi liên hệ thực tế.',
          step2: 'HS suy nghĩ và trả lời nhanh.',
          step3: 'GV tổng kết toàn bài, hướng dẫn học bài ở nhà.'
        }
      }
    ]
  }
};

export default function TeacherLessonPlanBuilder() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  
  // Lesson plan form state
  const [subject, setSubject] = useState('Toán');
  const [grade, setGrade] = useState('Khối 11');
  const [lessonTitle, setLessonTitle] = useState('');
  const [duration, setDuration] = useState('2 tiết');
  const [knowledge, setKnowledge] = useState('');
  const [competencies, setCompetencies] = useState('');
  const [qualities, setQualities] = useState('');
  const [equipmentTeacher, setEquipmentTeacher] = useState('');
  const [equipmentStudent, setEquipmentStudent] = useState('');
  const [activities, setActivities] = useState([]);
  const [savedPlans, setSavedPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);

  useEffect(() => {
    const currentTeacherStr = localStorage.getItem('cbq_current_teacher');
    if (!currentTeacherStr) {
      navigate('/dang-nhap-giao-vien');
      return;
    }
    const tData = JSON.parse(currentTeacherStr);
    setTeacher(tData);

    // Load saved plans from localStorage
    const localPlans = JSON.parse(localStorage.getItem('cbq_teacher_lesson_plans') || '[]');
    setSavedPlans(localPlans);

    // Apply default template (Toán)
    applyTemplate('Toán');
  }, [navigate]);

  const applyTemplate = (subjKey) => {
    const tmpl = SUBJECT_TEMPLATES[subjKey] || SUBJECT_TEMPLATES['Toán'];
    setSubject(tmpl.subject);
    setGrade(tmpl.grade);
    setLessonTitle(tmpl.lessonTitle);
    setDuration(tmpl.duration);
    setKnowledge(tmpl.objectives.knowledge);
    setCompetencies(tmpl.objectives.competencies);
    setQualities(tmpl.objectives.qualities);
    setEquipmentTeacher(tmpl.equipment.teacher);
    setEquipmentStudent(tmpl.equipment.student);
    setActivities(tmpl.activities);
  };

  const handleAddActivity = () => {
    const actNum = activities.length + 1;
    const newAct = {
      id: `act_${Date.now()}`,
      name: `Hoạt động ${actNum}: (Tên hoạt động bổ sung)`,
      objective: 'Mục tiêu hoạt động...',
      content: 'Nội dung hoạt động...',
      product: 'Sản phẩm hoạt động...',
      execution: {
        step1: 'Bước 1: Chuyển giao nhiệm vụ...',
        step2: 'Bước 2: Thực hiện nhiệm vụ...',
        step3: 'Bước 3: Báo cáo, thảo luận...',
        step4: 'Bước 4: Kết luận, nhận định...'
      }
    };
    setActivities([...activities, newAct]);
  };

  const handleUpdateActivity = (index, key, val) => {
    const updated = [...activities];
    updated[index][key] = val;
    setActivities(updated);
  };

  const handleUpdateExecutionStep = (actIndex, stepKey, val) => {
    const updated = [...activities];
    updated[actIndex].execution[stepKey] = val;
    setActivities(updated);
  };

  const handleRemoveActivity = (index) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleSavePlan = () => {
    if (!lessonTitle) return alert("Vui lòng nhập Tiêu đề bài dạy!");
    
    const planObj = {
      id: activePlanId || `plan_${Date.now()}`,
      teacherName: teacher?.full_name || 'Giáo viên',
      school: 'TRƯỜNG THPT CAO BÁ QUÁT',
      department: teacher?.department || 'Tổ Chuyên Môn',
      subject,
      grade,
      lessonTitle,
      duration,
      objectives: { knowledge, competencies, qualities },
      equipment: { teacher: equipmentTeacher, student: equipmentStudent },
      activities,
      updatedAt: new Date().toISOString()
    };

    let updatedList = [...savedPlans];
    const existingIdx = updatedList.findIndex(p => p.id === planObj.id);
    if (existingIdx >= 0) {
      updatedList[existingIdx] = planObj;
    } else {
      updatedList.unshift(planObj);
    }

    setSavedPlans(updatedList);
    setActivePlanId(planObj.id);
    localStorage.setItem('cbq_teacher_lesson_plans', JSON.stringify(updatedList));

    alert("🎉 Đã lưu Kế hoạch bài dạy (Giáo án 5512) thành công!");
  };

  const handleLoadPlan = (plan) => {
    setActivePlanId(plan.id);
    setSubject(plan.subject || 'Toán');
    setGrade(plan.grade || 'Khối 11');
    setLessonTitle(plan.lessonTitle || '');
    setDuration(plan.duration || '2 tiết');
    setKnowledge(plan.objectives?.knowledge || '');
    setCompetencies(plan.objectives?.competencies || '');
    setQualities(plan.objectives?.qualities || '');
    setEquipmentTeacher(plan.equipment?.teacher || '');
    setEquipmentStudent(plan.equipment?.student || '');
    setActivities(plan.activities || []);
  };

  const handleExportWord5512 = () => {
    const planElement = document.getElementById('lesson-plan-preview-content');
    if (!planElement) return;

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Kế hoạch bài dạy - ${lessonTitle}</title>
        <style>
          @page Section1 { size: 21.0cm 29.7cm; margin: 2.0cm 2.0cm 2.0cm 3.0cm; mso-header-margin: 35.4pt; mso-footer-margin: 35.4pt; mso-paper-source: 0; }
          div.Section1 { page: Section1; }
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; color: #000000; }
          h1, h2, h3, h4 { font-family: 'Times New Roman', serif; margin-top: 10px; margin-bottom: 6px; }
          h1 { font-size: 15pt; text-align: center; text-transform: uppercase; font-weight: bold; }
          h2 { font-size: 13.5pt; text-transform: uppercase; font-weight: bold; }
          h3 { font-size: 13pt; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
          th, td { border: 1pt solid black; padding: 6px; font-size: 12pt; text-align: left; vertical-align: top; }
          .header-table { width: 100%; border: none !important; margin-bottom: 15px; }
          .header-table td { border: none !important; padding: 0; vertical-align: top; }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${planElement.innerHTML}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Giao_An_5512_${lessonTitle.replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!teacher) return null;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Inter", sans-serif', color: '#1e293b' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <Link to="/teacher-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 'bold' }}>
          <ArrowLeft size={20} /> Bảng điều khiển Giáo viên
        </Link>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleSavePlan} 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(22,163,74,0.3)' }}
          >
            <Save size={18} /> Lưu Giáo Án (5512)
          </button>

          <button 
            onClick={handleExportWord5512} 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(2,132,199,0.3)' }}
          >
            <Download size={18} /> Tải File Word (.doc)
          </button>
        </div>
      </div>

      {/* Title */}
      <div style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', padding: '24px', borderRadius: '16px', color: 'white', boxShadow: '0 10px 15px -3px rgba(2,132,199,0.2)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={28} /> Soạn Kế Hoạch Bài Dạy (Giáo Án Chuẩn CV 5512/BGDĐT)
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
          Công cụ chuyên môn dành cho Giáo viên THPT Cao Bá Quát — Tự động cấu trúc 4 bước & 3 nhóm mục tiêu theo Chương trình GDPT 2018.
        </p>
      </div>

      {/* Main Layout: Left Editor / Right Saved & Template bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        
        {/* LEFT COLUMN: EDITOR FORM */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          
          {/* Preset Template Selector */}
          <div style={{ marginBottom: '20px', background: '#f0f9ff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} /> Gợi ý mẫu bài dạy GDPT 2018:
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => applyTemplate('Toán')} style={styles.tmplBadgeBtn}>Toán 11</button>
              <button onClick={() => applyTemplate('Ngữ văn')} style={styles.tmplBadgeBtn}>Ngữ Văn 12</button>
            </div>
          </div>

          {/* Section 0: General Info */}
          <h3 style={styles.sectionHeader}>📋 Thông Tin Chung Bài Dạy</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={styles.label}>Môn học (*)</label>
              <select value={subject} onChange={e => setSubject(e.target.value)} style={styles.input}>
                <option value="Toán">Toán học</option>
                <option value="Ngữ văn">Ngữ văn</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Vật lí">Vật lí</option>
                <option value="Hóa học">Hóa học</option>
                <option value="Sinh học">Sinh học</option>
                <option value="Lịch sử">Lịch sử</option>
                <option value="Địa lí">Địa lí</option>
                <option value="GDKT&PL">GDKT & PL</option>
                <option value="Tin học">Tin học</option>
                <option value="GDTC">GDTC - QP</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Khối lớp (*)</label>
              <select value={grade} onChange={e => setGrade(e.target.value)} style={styles.input}>
                <option value="Khối 10">Khối 10</option>
                <option value="Khối 11">Khối 11</option>
                <option value="Khối 12">Khối 12</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Thời lượng (*)</label>
              <input type="text" value={duration} onChange={e => setDuration(e.target.value)} style={styles.input} placeholder="VD: 2 tiết" />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={styles.label}>Tên Bài Học / Chủ Đề (*)</label>
              <input type="text" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} style={{ ...styles.input, fontWeight: 'bold', color: '#0284c7' }} placeholder="VD: Bài 3. Cấp số cộng và Cấp số nhân" />
            </div>
          </div>

          {/* Section I: Objectives */}
          <h3 style={styles.sectionHeader}>I. MỤC TIÊU BÀI HỌC (Chuẩn 5512 & GDPT 2018)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div>
              <label style={styles.label}>1. Về Kiến thức (Yêu cầu cần đạt)</label>
              <textarea rows={3} value={knowledge} onChange={e => setKnowledge(e.target.value)} style={styles.textarea} placeholder="Nêu rõ kiến thức học sinh cần nắm được..." />
            </div>

            <div>
              <label style={styles.label}>2. Về Năng lực (Năng lực chung & Năng lực đặc thù)</label>
              <textarea rows={4} value={competencies} onChange={e => setCompetencies(e.target.value)} style={styles.textarea} placeholder="Nêu năng lực tự chủ, giải quyết vấn đề, tư duy chuyên môn..." />
            </div>

            <div>
              <label style={styles.label}>3. Về Phẩm chất (Chăm chỉ, Trung thực, Trách nhiệm...)</label>
              <textarea rows={3} value={qualities} onChange={e => setQualities(e.target.value)} style={styles.textarea} placeholder="Các phẩm chất hình thành ở học sinh..." />
            </div>
          </div>

          {/* Section II: Equipment */}
          <h3 style={styles.sectionHeader}>II. THIẾT BỊ DẠY HỌC & HỌC LIỆU</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div>
              <label style={styles.label}>1. Thiết bị & học liệu của Giáo viên</label>
              <textarea rows={3} value={equipmentTeacher} onChange={e => setEquipmentTeacher(e.target.value)} style={styles.textarea} placeholder="Kế hoạch bài dạy, PowerPoint, phiếu học tập, máy chiếu..." />
            </div>

            <div>
              <label style={styles.label}>2. Học liệu & chuẩn bị của Học sinh</label>
              <textarea rows={3} value={equipmentStudent} onChange={e => setEquipmentStudent(e.target.value)} style={styles.textarea} placeholder="SGK, vở ghi, dụng cụ học tập, máy tính..." />
            </div>
          </div>

          {/* Section III: Process & Activities */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ ...styles.sectionHeader, margin: 0 }}>III. TIẾN TRÌNH DẠY HỌC (4 BƯỚC CHUẨN 5512)</h3>
            <button onClick={handleAddActivity} style={{ padding: '6px 12px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={14} /> Thêm Hoạt Động
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
            {activities.map((act, idx) => (
              <div key={act.id} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', position: 'relative' }}>
                <button 
                  onClick={() => handleRemoveActivity(idx)} 
                  style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                  title="Xóa hoạt động này"
                >
                  <Trash2 size={16} />
                </button>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#0369a1' }}>Tên Hoạt động ({idx + 1})</label>
                  <input 
                    type="text" 
                    value={act.name} 
                    onChange={e => handleUpdateActivity(idx, 'name', e.target.value)} 
                    style={{ ...styles.input, fontWeight: 'bold', color: '#0f172a' }} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={styles.subLabel}>a) Mục tiêu</label>
                    <textarea rows={3} value={act.objective} onChange={e => handleUpdateActivity(idx, 'objective', e.target.value)} style={styles.textarea} />
                  </div>
                  <div>
                    <label style={styles.subLabel}>b) Nội dung</label>
                    <textarea rows={3} value={act.content} onChange={e => handleUpdateActivity(idx, 'content', e.target.value)} style={styles.textarea} />
                  </div>
                  <div>
                    <label style={styles.subLabel}>c) Sản phẩm</label>
                    <textarea rows={3} value={act.product} onChange={e => handleUpdateActivity(idx, 'product', e.target.value)} style={styles.textarea} />
                  </div>
                </div>

                {/* d) 4 STEPS OF EXECUTION */}
                <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#b91c1c', marginBottom: '8px' }}>
                    d) Tổ chức thực hiện (4 Bước Bắt Buộc theo CV 5512):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <span style={styles.stepTag}>Bước 1: Chuyển giao nhiệm vụ</span>
                      <textarea rows={2} value={act.execution?.step1 || ''} onChange={e => handleUpdateExecutionStep(idx, 'step1', e.target.value)} style={styles.textarea} />
                    </div>
                    <div>
                      <span style={styles.stepTag}>Bước 2: Thực hiện nhiệm vụ</span>
                      <textarea rows={2} value={act.execution?.step2 || ''} onChange={e => handleUpdateExecutionStep(idx, 'step2', e.target.value)} style={styles.textarea} />
                    </div>
                    <div>
                      <span style={styles.stepTag}>Bước 3: Báo cáo, thảo luận</span>
                      <textarea rows={2} value={act.execution?.step3 || ''} onChange={e => handleUpdateExecutionStep(idx, 'step3', e.target.value)} style={styles.textarea} />
                    </div>
                    <div>
                      <span style={styles.stepTag}>Bước 4: Kết luận, nhận định</span>
                      <textarea rows={2} value={act.execution?.step4 || ''} onChange={e => handleUpdateExecutionStep(idx, 'step4', e.target.value)} style={styles.textarea} />
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* RIGHT COLUMN: SAVED PLANS & LIVE PREVIEW */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Saved Plans Card */}
          <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#0284c7" /> Giáo Án Đã Lưu ({savedPlans.length})
            </h3>
            
            {savedPlans.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Chưa có giáo án nào được lưu.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                {savedPlans.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => handleLoadPlan(p)}
                    style={{ 
                      padding: '10px 12px', 
                      borderRadius: '8px', 
                      background: activePlanId === p.id ? '#e0f2fe' : '#f8fafc',
                      border: activePlanId === p.id ? '1px solid #0284c7' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: activePlanId === p.id ? '#0369a1' : '#1e293b', marginBottom: '2px' }}>
                      {p.lessonTitle}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{p.subject} - {p.grade}</span>
                      <span>{new Date(p.updatedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Preview Container (Formatted as Standard A4 Word Page) */}
          <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>📄 Xem Trước Định Dạng VĂN BẢN (5512)</h3>
              <button onClick={handleExportWord5512} style={{ fontSize: '11px', padding: '4px 8px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Xuất Word
              </button>
            </div>

            <div style={{ border: '1px solid #cbd5e1', padding: '20px', background: '#fafafa', borderRadius: '8px', maxHeight: '500px', overflowY: 'auto' }}>
              <div id="lesson-plan-preview-content" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '13pt', lineHeight: '1.4', color: '#000000', backgroundColor: '#ffffff', padding: '25px' }}>
                
                {/* Header Table */}
                <table className="header-table" style={{ width: '100%', border: 'none', marginBottom: '15px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', border: 'none', textAlign: 'left', padding: 0 }}>
                        <div style={{ fontSize: '12pt', textTransform: 'uppercase' }}>SỞ GD&ĐT ĐẮK LẮK</div>
                        <div style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase' }}>TRƯỜNG THPT CAO BÁ QUÁT</div>
                        <div style={{ fontSize: '12pt', fontStyle: 'italic' }}>Tổ Chuyên Môn: {teacher.department || 'Toán - Tin'}</div>
                      </td>
                      <td style={{ width: '50%', border: 'none', textAlign: 'right', padding: 0 }}>
                        <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>Họ tên GV: {teacher.full_name}</div>
                        <div style={{ fontSize: '12pt' }}>Môn học: {subject} - {grade}</div>
                        <div style={{ fontSize: '12pt' }}>Thời lượng: {duration}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <h1 style={{ fontSize: '15pt', textAlign: 'center', textTransform: 'uppercase', fontWeight: 'bold', margin: '20px 0 10px 0' }}>
                  KẾ HOẠCH BÀI DẠY
                </h1>
                <div style={{ fontSize: '13.5pt', textAlign: 'center', fontWeight: 'bold', marginBottom: '20px' }}>
                  TÊN BÀI HỌC: {lessonTitle.toUpperCase()}
                </div>

                <div style={{ fontWeight: 'bold', fontSize: '13pt', marginTop: '10px' }}>I. MỤC TIÊU BÀI HỌC</div>
                <div style={{ textIndent: '0.5cm', marginTop: '4px' }}><strong>1. Về kiến thức:</strong></div>
                <div style={{ whiteSpace: 'pre-wrap', marginLeft: '0.5cm' }}>{knowledge || 'Chưa nhập...'}</div>
                
                <div style={{ textIndent: '0.5cm', marginTop: '6px' }}><strong>2. Về năng lực:</strong></div>
                <div style={{ whiteSpace: 'pre-wrap', marginLeft: '0.5cm' }}>{competencies || 'Chưa nhập...'}</div>
                
                <div style={{ textIndent: '0.5cm', marginTop: '6px' }}><strong>3. Về phẩm chất:</strong></div>
                <div style={{ whiteSpace: 'pre-wrap', marginLeft: '0.5cm' }}>{qualities || 'Chưa nhập...'}</div>

                <div style={{ fontWeight: 'bold', fontSize: '13pt', marginTop: '15px' }}>II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU</div>
                <div style={{ textIndent: '0.5cm', marginTop: '4px' }}><strong>1. Giáo viên:</strong> {equipmentTeacher}</div>
                <div style={{ textIndent: '0.5cm', marginTop: '4px' }}><strong>2. Học sinh:</strong> {equipmentStudent}</div>

                <div style={{ fontWeight: 'bold', fontSize: '13pt', marginTop: '15px', marginBottom: '8px' }}>III. TIẾN TRÌNH DẠY HỌC</div>
                {activities.map((act, i) => (
                  <div key={act.id} style={{ marginBottom: '15px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13pt', color: '#000' }}>{act.name}</div>
                    <div style={{ textIndent: '0.5cm' }}><strong>a) Mục tiêu:</strong> {act.objective}</div>
                    <div style={{ textIndent: '0.5cm' }}><strong>b) Nội dung:</strong> {act.content}</div>
                    <div style={{ textIndent: '0.5cm' }}><strong>c) Sản phẩm:</strong> {act.product}</div>
                    <div style={{ textIndent: '0.5cm' }}><strong>d) Tổ chức thực hiện:</strong></div>
                    <div style={{ marginLeft: '1cm' }}>- <em>Bước 1 (Chuyển giao NV):</em> {act.execution?.step1}</div>
                    <div style={{ marginLeft: '1cm' }}>- <em>Bước 2 (Thực hiện NV):</em> {act.execution?.step2}</div>
                    <div style={{ marginLeft: '1cm' }}>- <em>Bước 3 (Báo cáo, thảo luận):</em> {act.execution?.step3}</div>
                    <div style={{ marginLeft: '1cm' }}>- <em>Bước 4 (Kết luận, nhận định):</em> {act.execution?.step4}</div>
                  </div>
                ))}

              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

const styles = {
  sectionHeader: { fontSize: '15px', fontWeight: 'bold', color: '#0f172a', borderBottom: '2px solid #f1f5f9', paddingBottom: '6px', marginBottom: '12px' },
  label: { display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' },
  subLabel: { display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: '#0369a1', marginBottom: '2px' },
  stepTag: { display: 'inline-block', fontSize: '11px', fontWeight: 'bold', color: '#991b1b', backgroundColor: '#fef2f2', padding: '2px 6px', borderRadius: '4px', marginBottom: '2px' },
  input: { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' },
  tmplBadgeBtn: { padding: '4px 10px', background: '#ffffff', color: '#0284c7', border: '1px solid #0284c7', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }
};
