import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Users, Search, Download, KeyRound, CheckCircle2, AlertCircle, Phone, IdCard, RefreshCw, X, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function TeacherHomeroomStudents() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [homeroomClass, setHomeroomClass] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Password Reset Modal State
  const [resetModalStudent, setResetModalStudent] = useState(null);
  const [newPassword, setNewPassword] = useState('123456');
  const [resetting, setResetting] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [resetErrMsg, setResetErrMsg] = useState('');

  // Selected Student View Modal State
  const [viewStudent, setViewStudent] = useState(null);

  useEffect(() => {
    const currentTeacherStr = localStorage.getItem('cbq_current_teacher') || localStorage.getItem('cbq_teacher_session') || localStorage.getItem('cbq_user');
    if (!currentTeacherStr) {
      navigate('/dang-nhap-giao-vien');
      return;
    }

    try {
      const parsedTeacher = JSON.parse(currentTeacherStr);
      const hClass = parsedTeacher.homeroom_class || parsedTeacher.homeroomClass || '';
      if (!hClass) {
        alert('Tài khoản của bạn không được phân công Giáo viên Chủ nhiệm lớp nào.');
        navigate('/teacher-dashboard');
        return;
      }
      setTeacher(parsedTeacher);
      setHomeroomClass(hClass);
      fetchClassStudents(hClass);
    } catch (e) {
      console.error('Error parsing teacher session:', e);
      navigate('/dang-nhap-giao-vien');
    }
  }, [navigate]);

  const fetchClassStudents = async (className) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbq_students')
        .select('*')
        .ilike('student_class', className)
        .order('student_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching homeroom students:', err);
      // Fallback local storage
      const local = JSON.parse(localStorage.getItem('cbq_students_data') || '[]');
      const filtered = local.filter(s => (s.student_class || '').toUpperCase() === className.toUpperCase());
      setStudents(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (students.length === 0) {
      alert('Không có dữ liệu học sinh để xuất!');
      return;
    }

    const dataToExport = students.map((s, idx) => ({
      'STT': idx + 1,
      'Mã học sinh': s.student_code || '',
      'Họ và tên': s.student_name || '',
      'Lớp': s.student_class || homeroomClass,
      'Giới tính': s.gender || 'Nam',
      'Ngày sinh': s.birth_date || '',
      'Số CCCD / Định danh': s.identity_card || '',
      'Số điện thoại HS': s.phone || '',
      'Họ tên Cha': s.father_name || '',
      'SĐT Cha': s.father_phone || '',
      'Họ tên Mẹ': s.mother_name || '',
      'SĐT Mẹ': s.mother_phone || '',
      'Địa chỉ thường trú': s.permanent_address || s.address || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Lop_${homeroomClass}`);
    
    // Quy tắc đặt tên file: có tiền tố STT số thứ tự (GEMINI.md)
    const exportFileName = `1-Danh_Sach_Hoc_Sinh_Lop_${homeroomClass}.xlsx`;
    XLSX.writeFile(workbook, exportFileName);
  };

  const handleOpenResetModal = (student) => {
    setResetModalStudent(student);
    setNewPassword('123456');
    setResetSuccessMsg('');
    setResetErrMsg('');
  };

  const handleExecuteResetPassword = async () => {
    if (!resetModalStudent) return;
    if (!newPassword || newPassword.trim().length < 6) {
      setResetErrMsg('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    setResetting(true);
    setResetErrMsg('');
    setResetSuccessMsg('');

    try {
      const studentCode = resetModalStudent.student_code;
      // Cập nhật bảng cbq_student_users nếu có tài khoản
      const { data: matchedUsers, error: findErr } = await supabase
        .from('cbq_student_users')
        .select('id, username')
        .or(`username.eq.${studentCode},student_code.eq.${studentCode}`);

      if (findErr) throw findErr;

      if (matchedUsers && matchedUsers.length > 0) {
        for (const u of matchedUsers) {
          await supabase
            .from('cbq_student_users')
            .update({ password: newPassword.trim() })
            .eq('id', u.id);
        }
      } else {
        // Tạo mới tài khoản nếu học sinh chưa có tài khoản đăng nhập
        await supabase
          .from('cbq_student_users')
          .insert([{
            username: studentCode,
            student_code: studentCode,
            password: newPassword.trim(),
            full_name: resetModalStudent.student_name,
            student_class: homeroomClass,
            role: 'student'
          }]);
      }

      // Cập nhật luôn local storage dự phòng
      const localAccs = JSON.parse(localStorage.getItem('cbq_student_accounts') || '[]');
      const foundIdx = localAccs.findIndex(a => a.username === studentCode);
      if (foundIdx >= 0) {
        localAccs[foundIdx].password = newPassword.trim();
      } else {
        localAccs.push({
          username: studentCode,
          password: newPassword.trim(),
          full_name: resetModalStudent.student_name,
          student_class: homeroomClass,
          role: 'student'
        });
      }
      localStorage.setItem('cbq_student_accounts', JSON.stringify(localAccs));

      setResetSuccessMsg(`Đã đặt lại mật khẩu thành công cho học sinh ${resetModalStudent.student_name}! Mật khẩu mới: ${newPassword.trim()}`);
    } catch (err) {
      console.error('Error resetting password:', err);
      setResetErrMsg('Có lỗi xảy ra khi đặt lại mật khẩu: ' + (err.message || 'Lỗi kết nối máy chủ'));
    } finally {
      setResetting(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (s.student_name || '').toLowerCase().includes(q) ||
      (s.student_code || '').toLowerCase().includes(q) ||
      (s.identity_card || '').toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q)
    );
  });

  if (!teacher) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px 16px', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <Link to="/teacher-dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#0f766e', textDecoration: 'none', fontWeight: '600', fontSize: '15px' }}>
            <ArrowLeft size={18} /> Bảng điều khiển Giáo viên
          </Link>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => fetchClassStudents(homeroomClass)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
            >
              <RefreshCw size={15} /> Làm mới
            </button>
            <button
              onClick={handleExportExcel}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#059669', color: '#ffffff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(5,150,105,0.25)' }}
            >
              <Download size={16} /> Xuất Excel Lớp {homeroomClass}
            </button>
          </div>
        </div>

        {/* Banner Section */}
        <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)', borderRadius: '16px', padding: '24px', color: '#ffffff', marginBottom: '24px', boxShadow: '0 10px 25px -5px rgba(6,78,59,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={28} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 6px 0' }}>
                Quản Lý Học Sinh & Cấp Lại Mật Khẩu — Lớp {homeroomClass}
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: '#a7f3d0' }}>
                GVCN: <strong>{teacher.name}</strong> • Tổng số học sinh: <strong>{students.length}</strong> em
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Tìm kiếm theo Tên, Mã định danh/Học sinh, Số CCCD, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', color: '#1e293b' }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Students Table */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
              <p style={{ margin: 0, fontSize: '15px' }}>Đang nạp danh sách học sinh Lớp {homeroomClass}...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ padding: '50px 20px', textAlign: 'center', color: '#64748b' }}>
              <AlertCircle size={32} color="#f59e0b" style={{ margin: '0 auto 10px auto' }} />
              <p style={{ margin: 0, fontSize: '15px', fontWeight: '500' }}>Không tìm thấy học sinh nào phù hợp trong lớp {homeroomClass}.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>
                    <th style={{ padding: '14px 16px', width: '60px', textAlign: 'center' }}>STT</th>
                    <th style={{ padding: '14px 16px' }}>Mã Học Sinh</th>
                    <th style={{ padding: '14px 16px' }}>Họ Và Tên</th>
                    <th style={{ padding: '14px 16px' }}>Ngày Sinh</th>
                    <th style={{ padding: '14px 16px' }}>Số CCCD</th>
                    <th style={{ padding: '14px 16px' }}>SĐT Học Sinh</th>
                    <th style={{ padding: '14px 16px' }}>Liên Hệ Phụ Huynh</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, idx) => (
                    <tr key={s.id || idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0f766e' }}>{s.student_code || '---'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1e293b' }}>
                        <button
                          onClick={() => setViewStudent(s)}
                          style={{ background: 'none', border: 'none', padding: 0, color: '#1e293b', fontWeight: '600', cursor: 'pointer', textAlign: 'left', fontSize: '14px' }}
                        >
                          {s.student_name}
                        </button>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{s.birth_date || '---'}</td>
                      <td style={{ padding: '12px 16px', color: '#475569', fontFamily: 'monospace' }}>{s.identity_card || 'Chưa cập nhật'}</td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        {s.phone ? (
                          <a href={`tel:${s.phone}`} style={{ color: '#0284c7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={13} /> {s.phone}
                          </a>
                        ) : '---'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', fontSize: '13px' }}>
                        {s.father_phone ? <div>Cha: {s.father_phone}</div> : null}
                        {s.mother_phone ? <div>Mẹ: {s.mother_phone}</div> : null}
                        {!s.father_phone && !s.mother_phone && '---'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => setViewStudent(s)}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            Chi tiết
                          </button>
                          <button
                            onClick={() => handleOpenResetModal(s)}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#f59e0b', color: '#ffffff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <KeyRound size={13} /> Cấp lại MK
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

        {/* Modal: Đặt lại Mật khẩu cho Học sinh */}
        {resetModalStudent && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <KeyRound size={20} color="#f59e0b" /> Cấp Lại Mật Khẩu Học Sinh
                </h3>
                <button onClick={() => setResetModalStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '14px', color: '#334155' }}>
                <div>Học sinh: <strong>{resetModalStudent.student_name}</strong></div>
                <div>Mã số: <strong>{resetModalStudent.student_code}</strong> • Lớp: <strong>{homeroomClass}</strong></div>
              </div>

              {resetErrMsg && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', fontSize: '13px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={16} /> {resetErrMsg}
                </div>
              )}

              {resetSuccessMsg && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', fontSize: '13px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} /> {resetSuccessMsg}
                </div>
              )}

              {!resetSuccessMsg ? (
                <>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                    Mật khẩu mới (tối thiểu 6 ký tự):
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', marginBottom: '18px', boxSizing: 'border-box' }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setResetModalStudent(null)}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteResetPassword}
                      disabled={resetting}
                      style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#ffffff', fontWeight: '600', cursor: resetting ? 'not-allowed' : 'pointer' }}
                    >
                      {resetting ? 'Đang cập nhật...' : 'Xác nhận cấp lại'}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <button
                    onClick={() => setResetModalStudent(null)}
                    style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#059669', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Xem chi tiết Hồ sơ Học sinh */}
        {viewStudent && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IdCard size={20} color="#059669" /> Hồ Sơ Học Sinh: {viewStudent.student_name}
                </h3>
                <button onClick={() => setViewStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '14px' }}>
                <div><span style={{ color: '#64748b' }}>Mã định danh/học sinh:</span> <strong style={{ color: '#0f766e' }}>{viewStudent.student_code}</strong></div>
                <div><span style={{ color: '#64748b' }}>Lớp:</span> <strong>{viewStudent.student_class || homeroomClass}</strong></div>
                <div><span style={{ color: '#64748b' }}>Giới tính:</span> <strong>{viewStudent.gender || 'Nam'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Ngày sinh:</span> <strong>{viewStudent.birth_date || '---'}</strong></div>
                <div><span style={{ color: '#64748b' }}>CCCD (12 số):</span> <strong>{viewStudent.identity_card || 'Chưa cập nhật'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Số điện thoại:</span> <strong>{viewStudent.phone || '---'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Họ tên Cha:</span> <strong>{viewStudent.father_name || '---'}</strong></div>
                <div><span style={{ color: '#64748b' }}>SĐT Cha:</span> <strong>{viewStudent.father_phone || '---'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Họ tên Mẹ:</span> <strong>{viewStudent.mother_name || '---'}</strong></div>
                <div><span style={{ color: '#64748b' }}>SĐT Mẹ:</span> <strong>{viewStudent.mother_phone || '---'}</strong></div>
                <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#64748b' }}>Địa chỉ thường trú:</span> <strong>{viewStudent.permanent_address || viewStudent.address || '---'}</strong></div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => {
                    const st = viewStudent;
                    setViewStudent(null);
                    handleOpenResetModal(st);
                  }}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#ffffff', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <KeyRound size={15} /> Cấp lại mật khẩu
                </button>
                <button
                  onClick={() => setViewStudent(null)}
                  style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
