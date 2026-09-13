import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle2, XCircle, Clock, FileText, Download, Users, Plus, Edit3, Trash2, Check, Filter, Search, Award } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Sample Department Data & Submitted Lesson Plans
const INITIAL_DEPARTMENT_PLANS = [
  {
    id: 'plan_sub_1',
    teacherName: 'Nguyễn Văn A',
    subject: 'Toán',
    grade: 'Khối 11',
    lessonTitle: 'Cấp số cộng và Cấp số nhân',
    duration: '2 tiết',
    submittedAt: '2026-09-12T14:30:00Z',
    status: 'PENDING', // 'PENDING' | 'APPROVED' | 'REJECTED'
    reviewerNotes: '',
    approvedAt: null
  },
  {
    id: 'plan_sub_2',
    teacherName: 'Trần Thị B',
    subject: 'Ngữ văn',
    grade: 'Khối 12',
    lessonTitle: 'Đọc hiểu văn bản: Vợ Nhặt (Kim Lân)',
    duration: '2 tiết',
    submittedAt: '2026-09-11T09:15:00Z',
    status: 'APPROVED',
    reviewerNotes: 'Bài soạn chuẩn 5512, thể hiện rõ 4 bước hoạt động học.',
    approvedAt: '2026-09-11T16:00:00Z'
  }
];

const PPCT_GDPT_2018 = [
  { week: 'Tuần 1', lesson: 'Bài 1: Mệnh đề và Tập hợp', periods: 4, type: 'Bắt buộc', notes: 'Học tại lớp' },
  { week: 'Tuần 2', lesson: 'Bài 2: Bất phương trình bậc nhất hai ẩn', periods: 4, type: 'Bắt buộc', notes: 'Có kiểm tra 15p' },
  { week: 'Tuần 3', lesson: 'Chuyên đề 1: Phương pháp tọa độ trong không gian (Tiết 1-3)', periods: 3, type: 'Chuyên đề lựa chọn', notes: 'Cụm chuyên đề 15 tiết' },
  { week: 'Tuần 9', lesson: 'Kiểm tra Đánh giá Giữa kỳ I', periods: 2, type: 'Kiểm tra định kỳ', notes: 'Ma trận CV 3175' }
];

export default function TeacherDepartmentManagement() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [activeTab, setActiveTab] = useState('approval'); // 'approval' | 'ppct' | 'shcm'
  
  // Department Submitted Plans State
  const [departmentPlans, setDepartmentPlans] = useState(INITIAL_DEPARTMENT_PLANS);
  const [selectedPlanModal, setSelectedPlanModal] = useState(null);
  const [reviewNoteInput, setReviewNoteInput] = useState('');
  
  // Filter States
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    const currentTeacherStr = localStorage.getItem('cbq_current_teacher');
    if (!currentTeacherStr) {
      navigate('/dang-nhap-giao-vien');
      return;
    }
    const tData = JSON.parse(currentTeacherStr);
    setTeacher(tData);

    // Merge with local teacher lesson plans if any
    const localPlans = JSON.parse(localStorage.getItem('cbq_teacher_lesson_plans') || '[]');
    if (localPlans.length > 0) {
      const formattedLocal = localPlans.map(p => ({
        id: p.id,
        teacherName: p.teacherName || tData.full_name,
        subject: p.subject || 'Toán',
        grade: p.grade || 'Khối 11',
        lessonTitle: p.lessonTitle,
        duration: p.duration || '2 tiết',
        submittedAt: p.updatedAt || new Date().toISOString(),
        status: p.status || 'PENDING',
        reviewerNotes: p.reviewerNotes || '',
        approvedAt: p.approvedAt || null
      }));

      // Merge uniqueness by ID
      const mergedMap = new Map();
      INITIAL_DEPARTMENT_PLANS.forEach(item => mergedMap.set(item.id, item));
      formattedLocal.forEach(item => mergedMap.set(item.id, item));
      setDepartmentPlans(Array.from(mergedMap.values()));
    }
  }, [navigate]);

  const handleApprovePlan = (planId, isApproved) => {
    const updated = departmentPlans.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          status: isApproved ? 'APPROVED' : 'REJECTED',
          reviewerNotes: reviewNoteInput,
          approvedAt: isApproved ? new Date().toISOString() : null
        };
      }
      return p;
    });

    setDepartmentPlans(updated);
    setSelectedPlanModal(null);
    setReviewNoteInput('');
    alert(isApproved ? "🎉 Đã duyệt Giáo án thành công!" : "🔴 Đã yêu cầu giáo viên chỉnh sửa bài soạn!");
  };

  if (!teacher) return null;

  const filteredPlans = departmentPlans.filter(p => {
    return filterStatus === 'ALL' || p.status === filterStatus;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Inter", sans-serif', color: '#1e293b' }}>
      
      {/* Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <Link to="/teacher-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 'bold' }}>
          <ArrowLeft size={20} /> Bảng điều khiển Giáo viên
        </Link>
      </div>

      {/* Title Card */}
      <div style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', padding: '24px', borderRadius: '16px', color: 'white', boxShadow: '0 10px 15px -3px rgba(30,27,75,0.3)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building2 size={28} color="#818cf8" /> Cổng Quản Lý Tổ Chuyên Môn & Ký Duyệt Giáo Án Điện Tử (5512)
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
          Tổ Chuyên Môn: <strong>{teacher.department || 'Toán - Tin'}</strong> | Duyệt Kế hoạch bài dạy trực tuyến & Quản lý Khung PPCT GDPT 2018.
        </p>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
        <button onClick={() => setActiveTab('approval')} style={{ ...styles.tabBtn, borderBottom: activeTab === 'approval' ? '3px solid #4f46e5' : '3px solid transparent', color: activeTab === 'approval' ? '#4f46e5' : '#64748b' }}>
          <CheckCircle2 size={18} /> Duyệt Giáo Án Điện Tử ({departmentPlans.filter(p => p.status === 'PENDING').length} Chờ duyệt)
        </button>
        <button onClick={() => setActiveTab('ppct')} style={{ ...styles.tabBtn, borderBottom: activeTab === 'ppct' ? '3px solid #4f46e5' : '3px solid transparent', color: activeTab === 'ppct' ? '#4f46e5' : '#64748b' }}>
          <FileText size={18} /> Khung PPCT & Chuyên Đề Lựa Chọn (GDPT 2018)
        </button>
        <button onClick={() => setActiveTab('shcm')} style={{ ...styles.tabBtn, borderBottom: activeTab === 'shcm' ? '3px solid #4f46e5' : '3px solid transparent', color: activeTab === 'shcm' ? '#4f46e5' : '#64748b' }}>
          <Users size={18} /> Sinh Hoạt Chuyên Môn (NCBH)
        </button>
      </div>

      {/* TAB 1: APPROVAL PORTAL */}
      {activeTab === 'approval' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>📋 Danh Sách Giáo Án 5512 Nộp Duyệt Trong Tổ</h3>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Lọc trạng thái:</span>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold' }}>
                <option value="ALL">Tất cả Trạng thái</option>
                <option value="PENDING">⏳ Chờ duyệt</option>
                <option value="APPROVED">🟢 Đã phê duyệt</option>
                <option value="REJECTED">🔴 Yêu cầu chỉnh sửa</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#e0e7ff', borderBottom: '2px solid #c7d2fe', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>STT</th>
                  <th style={{ padding: '10px' }}>Giáo Viên Nộp</th>
                  <th style={{ padding: '10px' }}>Tên Bài Học / Chủ Đề (5512)</th>
                  <th style={{ padding: '10px' }}>Môn / Khối</th>
                  <th style={{ padding: '10px' }}>Thời Gian Nộp</th>
                  <th style={{ padding: '10px' }}>Trạng Thái</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Thao Tác Duyệt</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Không có giáo án nào</td></tr>
                ) : filteredPlans.map((p, idx) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '10px', color: '#94a3b8', fontWeight: 'bold' }}>{idx + 1}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e1b4b' }}>{p.teacherName}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#4338ca' }}>{p.lessonTitle}</td>
                    <td style={{ padding: '10px' }}>{p.subject} - {p.grade} ({p.duration})</td>
                    <td style={{ padding: '10px', color: '#64748b', fontSize: '12px' }}>{new Date(p.submittedAt).toLocaleString('vi-VN')}</td>
                    <td style={{ padding: '10px' }}>
                      {p.status === 'APPROVED' ? (
                        <span style={styles.badgeApproved}>🟢 Đã Duyệt</span>
                      ) : p.status === 'REJECTED' ? (
                        <span style={styles.badgeRejected}>🔴 Cần Chỉnh Sửa</span>
                      ) : (
                        <span style={styles.badgePending}>⏳ Chờ Duyệt</span>
                      )}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <button 
                        onClick={() => { setSelectedPlanModal(p); setReviewNoteInput(p.reviewerNotes || ''); }}
                        style={{ padding: '6px 12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                      >
                        Ký Duyệt & Ghi Nhận Xét
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 2: KHUNG PHÂN PHỐI CHƯƠNG TRÌNH */}
      {activeTab === 'ppct' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>📚 Khung Phân Phối Chương Trình (PPCT) & Cụm Chuyên Đề Lựa Chọn GDPT 2018</h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Tuần</th>
                <th style={{ padding: '10px' }}>Tên Bài Học / Chủ Đề</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Số Tiết</th>
                <th style={{ padding: '10px' }}>Phân Loại</th>
                <th style={{ padding: '10px' }}>Ghi Chú</th>
              </tr>
            </thead>
            <tbody>
              {PPCT_GDPT_2018.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#4f46e5' }}>{item.week}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.lesson}</td>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{item.periods}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ fontSize: '11.5px', padding: '3px 8px', borderRadius: '12px', background: item.type === 'Chuyên đề lựa chọn' ? '#fef3c7' : '#e0e7ff', color: item.type === 'Chuyên đề lựa chọn' ? '#b45309' : '#3730a3', fontWeight: 'bold' }}>
                      {item.type}
                    </span>
                  </td>
                  <td style={{ padding: '10px', color: '#64748b', fontSize: '12px' }}>{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: SHCM theo NCBH */}
      {activeTab === 'shcm' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>👥 Hồ Sơ Sinh Hoạt Chuyên Môn Theo Nghiên Cứu Bài Học (SHCM theo NCBH)</h3>
          
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#4338ca' }}>Quy Trình 4 Bước SHCM Theo NCBH Đã Số Hóa:</h4>
            <div style={{ fontSize: '13px', color: '#334155', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
              <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong>Bước 1:</strong> Xây dựng bài dạy minh họa GDPT 2018.
              </div>
              <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong>Bước 2:</strong> Dạy minh họa & Dự giờ quan sát hoạt động HS.
              </div>
              <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong>Bước 3:</strong> Thảo luận, phân tích suy ngẫm bài học.
              </div>
              <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong>Bước 4:</strong> Vận dụng rút kinh nghiệm vào thực tế.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW & APPROVAL MODAL */}
      {selectedPlanModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '650px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#4338ca', fontSize: '17px' }}>
                🖋 Duyệt Kế Hoạch Bài Dạy (Giáo Án 5512)
              </h3>
              <button onClick={() => setSelectedPlanModal(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '13.5px', color: '#334155', background: '#f0fdf4', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
              <strong>Giáo viên soạn:</strong> {selectedPlanModal.teacherName} <br/>
              <strong>Tên bài học:</strong> {selectedPlanModal.lessonTitle} <br/>
              <strong>Môn/Khối:</strong> {selectedPlanModal.subject} - {selectedPlanModal.grade} ({selectedPlanModal.duration})
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                Nhận xét & Ghi chú kiểm duyệt của Tổ Trưởng Chuyên Môn:
              </label>
              <textarea 
                rows={4} 
                value={reviewNoteInput} 
                onChange={e => setReviewNoteInput(e.target.value)} 
                placeholder="Nhập ghi chú góp ý về 4 bước hoạt động học hoặc xác nhận đạt chuẩn 5512..."
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => handleApprovePlan(selectedPlanModal.id, false)} style={{ padding: '9px 16px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                🔴 Yêu Cầu Chỉnh Sửa
              </button>

              <button onClick={() => handleApprovePlan(selectedPlanModal.id, true)} style={{ padding: '9px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} /> 🟢 Phê Duyệt & Gắn Tem Ký Duyệt
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  tabBtn: { padding: '12px 18px', background: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  badgeApproved: { color: '#16a34a', background: '#f0fdf4', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' },
  badgeRejected: { color: '#dc2626', background: '#fef2f2', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' },
  badgePending: { color: '#d97706', background: '#fffbeb', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' }
};
