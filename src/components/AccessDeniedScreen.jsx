import React from 'react';
import { ShieldAlert, LogOut, ArrowLeft, GraduationCap, Briefcase, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { clearTeacherSession, clearStudentSession } from '../services/authSessionManager';

export default function AccessDeniedScreen({ requiredRole, currentRole, currentUser, targetPath }) {
  const navigate = useNavigate();

  const isCurrentStudent = currentRole === 'student' || (!currentRole && currentUser?.student_class);
  const isCurrentTeacher = currentRole === 'teacher';

  const userDisplayName = currentUser?.full_name || currentUser?.name || currentUser?.username || 'Người dùng';
  const userSubInfo = currentUser?.student_class 
    ? `Lớp ${currentUser.student_class}` 
    : (currentUser?.department || currentUser?.homeroom_class ? `Tổ: ${currentUser.department || ''}` : '');

  const handleLogout = () => {
    if (isCurrentStudent) {
      clearStudentSession();
      navigate('/dang-nhap-hoc-sinh', { replace: true });
    } else {
      clearTeacherSession();
      navigate('/dang-nhap-giao-vien', { replace: true });
    }
  };

  return (
    <div style={{
      minHeight: '85vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 20px 45px rgba(220, 38, 38, 0.12), 0 4px 12px rgba(0, 0, 0, 0.05)',
        border: '1px solid #fee2e2',
        overflow: 'hidden',
        textAlign: 'center'
      }}>
        {/* Banner Top */}
        <div style={{
          background: 'linear-gradient(135deg, #991b1b 0%, #dc2626 60%, #ea580c 100%)',
          padding: '32px 24px 28px',
          color: '#ffffff'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            marginBottom: '16px',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }}>
            <ShieldAlert size={38} color="#ffffff" />
          </div>

          <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '900', letterSpacing: '-0.3px' }}>
            TRUY CẬP BỊ TỪ CHỐI (403)
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#fecaca', fontWeight: '500' }}>
            Phân Quyền & Bảo Mật Nghiệp Vụ THPT Cao Bá Quát
          </p>
        </div>

        {/* Nội dung thông báo chi tiết */}
        <div style={{ padding: '28px 24px' }}>
          
          {/* Card thông tin định danh hiện tại */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: isCurrentStudent ? '#e0f2fe' : '#dcfce7',
              color: isCurrentStudent ? '#0369a1' : '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {isCurrentStudent ? <GraduationCap size={24} /> : <Briefcase size={24} />}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold' }}>
                Đang Đăng Nhập Với Tư Cách
              </div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userDisplayName}
              </div>
              <div style={{ fontSize: '12px', color: isCurrentStudent ? '#0284c7' : '#16a34a', fontWeight: '600' }}>
                {isCurrentStudent ? `Học sinh • ${userSubInfo}` : `Cán bộ Giáo viên • ${userSubInfo}`}
              </div>
            </div>
          </div>

          {/* Giải thích lý do từ chối truy cập */}
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '24px',
            fontSize: '13px',
            color: '#991b1b',
            lineHeight: 1.5,
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Lock size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Lý do bảo vệ nghiệp vụ:</strong>
                {requiredRole === 'teacher' ? (
                  <span>
                    {' '}Trang bạn đang truy cập thuộc <strong>Không Gian Quản Lý Chuyên Môn Giáo Viên</strong> (Sổ điểm, Báo giảng, Ra đề thi, Quản lý lớp). Học sinh <u>không được phép</u> truy cập khu vực này theo quy chế GDPT 2018.
                  </span>
                ) : (
                  <span>
                    {' '}Trang bạn đang truy cập là <strong>Không Gian Sinh Hoạt & Học Tập Của Học Sinh</strong>. Thầy/Cô vui lòng quay lại Cổng Giáo Viên để thực hiện các chức năng giảng dạy chuyên môn.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Các nút hành động an toàn */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {isCurrentStudent ? (
              <Link
                to="/student-dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
                }}
              >
                <ArrowLeft size={16} /> Quay Về Cổng Học Sinh Của Bạn
              </Link>
            ) : (
              <Link
                to="/teacher-dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                }}
              >
                <ArrowLeft size={16} /> Quay Về Cổng Giáo Viên
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#ffffff',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                padding: '11px 20px',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '13.5px',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} /> Đăng Xuất Khỏi Tài Khoản Này
            </button>
          </div>

          <div style={{ marginTop: '20px', fontSize: '11.5px', color: '#94a3b8' }}>
            Hệ thống an ninh thông tin & phân quyền số • THPT Cao Bá Quát
          </div>
        </div>
      </div>
    </div>
  );
}
