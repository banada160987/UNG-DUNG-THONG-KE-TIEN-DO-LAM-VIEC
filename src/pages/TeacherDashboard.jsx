import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Zap, Award, BookOpen, Users, Wallet, ShieldAlert,
  Calendar, Grid, LogOut, CheckCircle, ChevronRight, UserCheck, Search, Filter,
  Home, FolderArchive, Layers, Sparkles, CalendarCheck
} from 'lucide-react';
import ClubAttendanceManager from '../components/ClubAttendanceManager';
import { DualSupabaseService } from '../lib/supabase';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'teaching', 'homeroom', 'department', 'utilities', 'club_management'
  const [clubRegistrations, setClubRegistrations] = useState([]);

  useEffect(() => {
    // Lấy thông tin tài khoản giáo viên đã đăng nhập
    const saved = localStorage.getItem('cbq_teacher_session') || localStorage.getItem('cbq_user');
    if (saved) {
      try {
        setTeacher(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing teacher session:', e);
      }
    } else {
      // Fallback tài khoản mẫu nếu chưa lưu session
      setTeacher({
        name: 'Tam Bou Branh',
        username: 'gv.tamboubranh',
        role: 'gv_homeroom', // 'gv_homeroom' hoặc 'gv_bomon'
        homeroomClass: '12A01',
        subject: 'Ngữ Văn'
      });
    }

    // Nạp danh sách đăng ký CLB
    DualSupabaseService.select('cbq_student_registrations', q => q.order('created_at', { ascending: false }))
      .then(res => {
        if (res.data) setClubRegistrations(res.data);
      })
      .catch(err => console.error('Error fetching club registrations for teacher:', err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cbq_teacher_session');
    localStorage.removeItem('cbq_user');
    navigate('/dang-nhap-giao-vien');
  };

  const isHomeroomTeacher = teacher?.role === 'gv_homeroom' || teacher?.homeroomClass;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '32px 20px', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1e293b' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        
        {/* 1. TOP BANNER & HỒ SƠ GIÁO VIÊN */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '20px',
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(15,23,42,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '28px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              fontSize: '22px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(59,130,246,0.4)',
              border: '2px solid rgba(255,255,255,0.2)'
            }}>
              {teacher?.name ? teacher.name.charAt(0).toUpperCase() : 'G'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#ffffff' }}>
                  Giáo viên: {teacher?.name || 'Tam Bou Branh'}
                </h1>
                {isHomeroomTeacher ? (
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <UserCheck size={14} /> GVCN Lớp {teacher?.homeroomClass || '12A01'}
                  </span>
                ) : (
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    color: '#93c5fd',
                    border: '1px solid rgba(59, 130, 246, 0.4)'
                  }}>
                    Giáo viên Bộ môn {teacher?.subject ? `(${teacher.subject})` : ''}
                  </span>
                )}
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                Cổng Quản lý Nghiệp vụ & Tiện ích Giảng dạy — Trường THPT Cao Bá Quát
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontSize: '13.5px',
                fontWeight: '600',
                color: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Home size={16} /> Về Trang Chủ
            </button>

            <button
              onClick={handleLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontSize: '13.5px',
                fontWeight: '600',
                color: '#f87171',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        </div>

        {/* 2. THANH CHUYỂN TAB PHÂN NHÓM NGHIỆP VỤ */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '28px',
          overflowX: 'auto',
          paddingBottom: '8px',
          borderBottom: '2px solid #e2e8f0',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              backgroundColor: activeTab === 'all' ? '#0f172a' : '#ffffff',
              color: activeTab === 'all' ? '#ffffff' : '#64748b',
              boxShadow: activeTab === 'all' ? '0 4px 12px rgba(15,23,42,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            <Filter size={16} /> Tất cả công cụ
          </button>

          <button
            onClick={() => setActiveTab('teaching')}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              backgroundColor: activeTab === 'teaching' ? '#4f46e5' : '#ffffff',
              color: activeTab === 'teaching' ? '#ffffff' : '#64748b',
              boxShadow: activeTab === 'teaching' ? '0 4px 12px rgba(79,70,229,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            <BookOpen size={16} /> 1. Chuyên Môn & Giảng Dạy
          </button>

          {isHomeroomTeacher && (
            <button
              onClick={() => setActiveTab('homeroom')}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                backgroundColor: activeTab === 'homeroom' ? '#059669' : '#ffffff',
                color: activeTab === 'homeroom' ? '#ffffff' : '#64748b',
                boxShadow: activeTab === 'homeroom' ? '0 4px 12px rgba(5,150,105,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s'
              }}
            >
              <Users size={16} /> 2. Công Tác Chủ Nhiệm ({teacher?.homeroomClass || '12A01'})
            </button>
          )}

          <button
            onClick={() => setActiveTab('department')}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              backgroundColor: activeTab === 'department' ? '#0284c7' : '#ffffff',
              color: activeTab === 'department' ? '#ffffff' : '#64748b',
              boxShadow: activeTab === 'department' ? '0 4px 12px rgba(2,132,199,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            <Layers size={16} /> 3. Tổ Chuyên Môn & KPI
          </button>

          <button
            onClick={() => setActiveTab('utilities')}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              backgroundColor: activeTab === 'utilities' ? '#7c3aed' : '#ffffff',
              color: activeTab === 'utilities' ? '#ffffff' : '#64748b',
              boxShadow: activeTab === 'utilities' ? '0 4px 12px rgba(124,58,237,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            <Calendar size={16} /> 4. Tra Cứu & Tiện Ích
          </button>

          <button
            onClick={() => setActiveTab('club_management')}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              backgroundColor: activeTab === 'club_management' ? '#be123c' : '#ffffff',
              color: activeTab === 'club_management' ? '#ffffff' : '#64748b',
              boxShadow: activeTab === 'club_management' ? '0 4px 12px rgba(190,18,60,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            <CalendarCheck size={16} /> 5. Điểm Danh & Hoạt Động CLB
          </button>
        </div>

        {/* 3. KHỐI NỘI DUNG CHỨC NĂNG DẠNG GROUPED CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
          
          {/* KHỐI 1: 📘 NGHIỆP VỤ CHUYÊN MÔN & GIẢNG DẠY */}
          {(activeTab === 'all' || activeTab === 'teaching') && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#e0e7ff',
                  color: '#4338ca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(79,70,229,0.15)'
                }}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#0f172a' }}>
                    1. Nghiệp Vụ Chuyên Môn & Giảng Dạy
                  </h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                    Soạn kế hoạch bài dạy 5512, ra đề thi chuẩn THPT 2025, đánh giá học sinh TT 22 & theo dõi sổ đầu bài
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px'
              }}>
                
                {/* CARD 1: SOẠN GIÁO ÁN */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '22px',
                  border: '1px solid #e0e7ff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: '#eef2ff',
                        color: '#4f46e5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FileText size={22} />
                      </div>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: '#eef2ff',
                        color: '#4338ca',
                        border: '1px solid #c7d2fe'
                      }}>
                        CV 5512 BGDĐT
                      </span>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0', color: '#1e293b' }}>
                      Soạn Giáo Án (CV 5512)
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                      Tự động tạo kế hoạch bài dạy 4 bước & 3 nhóm mục tiêu (Kiến thức, Năng lực, Phẩm chất). Xuất file Word (.doc) chuẩn 5512.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/giao-vien/soan-giao-an-5512')}
                    style={{
                      marginTop: '20px',
                      width: '100%',
                      padding: '11px 16px',
                      backgroundColor: '#4f46e5',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 3px 8px rgba(79,70,229,0.3)',
                      transition: 'background 0.2s'
                    }}
                  >
                    <FileText size={16} /> Soạn Giáo Án 5512
                  </button>
                </div>

                {/* CARD 2: RA ĐỀ THI 2025 */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '22px',
                  border: '1px solid #fef3c7',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: '#fffbeb',
                        color: '#d97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Zap size={22} />
                      </div>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: '#fffbeb',
                        color: '#b45309',
                        border: '1px solid #fde68a'
                      }}>
                        Đề Thi THPT 2025
                      </span>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0', color: '#1e293b' }}>
                      Ra Đề Thi & Đảo Đề 2025
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                      Hỗ trợ 4 dạng câu hỏi chuẩn THPT 2025 (Đúng/Sai, trả lời ngắn). Tự động đảo mã đề (101, 102...), xuất ma trận & đáp án.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/giao-vien/ra-de-thi')}
                    style={{
                      marginTop: '20px',
                      width: '100%',
                      padding: '11px 16px',
                      backgroundColor: '#d97706',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 3px 8px rgba(217,119,6,0.3)'
                    }}
                  >
                    <Zap size={16} /> Ra Đề Thi & Đảo Đề
                  </button>
                </div>

                {/* CARD 3: ĐÁNH GIÁ TT 22 */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '22px',
                  border: '1px solid #d1fae5',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Award size={22} />
                      </div>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0'
                      }}>
                        AI Gợi Ý Nhận Xét
                      </span>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0', color: '#1e293b' }}>
                      Đánh Giá Học Sinh (TT 22)
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                      Sổ đánh giá học sinh chuẩn Thông tư 22/2021/TT-BGDĐT. Tích hợp AI tự động gợi ý nhận xét phẩm chất, năng lực GDPT 2018.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/giao-vien/danh-gia-tt22')}
                    style={{
                      marginTop: '20px',
                      width: '100%',
                      padding: '11px 16px',
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 3px 8px rgba(5,150,105,0.3)'
                    }}
                  >
                    <Award size={16} /> Đánh Giá TT 22 & Nhận Xét AI
                  </button>
                </div>

                {/* CARD 4: SỔ ĐẦU BÀI & HỌC TẬP */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '22px',
                  border: '1px solid #e0f2fe',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: '#f0f9ff',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <BookOpen size={22} />
                      </div>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: '#f0f9ff',
                        color: '#0369a1',
                        border: '1px solid #bae6fd'
                      }}>
                        Sổ Điện Tử
                      </span>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0', color: '#1e293b' }}>
                      Tình hình Học tập & Sổ Đầu Bài
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                      Kiểm tra Sổ đầu bài điện tử do Lớp trưởng ghi và Báo cáo thiếu bài tập về nhà hàng ngày từ Ban cán sự lớp.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/teacher-dashboard/academics')}
                    style={{
                      marginTop: '20px',
                      width: '100%',
                      padding: '11px 16px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 3px 8px rgba(2,132,199,0.3)'
                    }}
                  >
                    <Search size={16} /> Xem Tình Hình Học Tập
                  </button>
                </div>

              </div>
            </section>
          )}

          {/* KHỐI 2: 👥 CÔNG TÁC CHỦ NHIỆM */}
          {isHomeroomTeacher && (activeTab === 'all' || activeTab === 'homeroom') && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#d1fae5',
                  color: '#047857',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(5,150,105,0.15)'
                }}>
                  <Users size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#0f172a' }}>
                    2. Công Tác Chủ Nhiệm — Lớp {teacher?.homeroomClass || '12A01'}
                  </h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                    Quản lý danh sách học sinh, cấp lại mật khẩu tài khoản, theo dõi quỹ thu/chi và nề nếp thi đua cờ đỏ
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px'
              }}>
                
                {/* CARD 1: QUẢN LÝ HỌC SINH */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '22px',
                  border: '1px solid #d1fae5',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: '#ecfdf5',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Users size={22} />
                      </div>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: '#fef2f2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca'
                      }}>
                        Reset Mật Khẩu
                      </span>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0', color: '#1e293b' }}>
                      Quản Lý HS Lớp Chủ Nhiệm
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                      Xem danh sách lớp chủ nhiệm, theo dõi trạng thái tài khoản, reset mật khẩu nhanh cho học sinh quên MK và xuất CSDL ngành.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/teacher-dashboard/homeroom')}
                    style={{
                      marginTop: '20px',
                      width: '100%',
                      padding: '11px 16px',
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 3px 8px rgba(5,150,105,0.3)'
                    }}
                  >
                    <Users size={16} /> Quản Lý Lớp & Reset MK ({teacher?.homeroomClass || '12A01'})
                  </button>
                </div>

                {/* CARD 2: QUẢN LÝ THU CHI QUỸ LỚP */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '22px',
                  border: '1px solid #ccfbf1',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: '#f0fdfa',
                        color: '#0d9488',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Wallet size={22} />
                      </div>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: '#f0fdfa',
                        color: '#0f766e',
                        border: '1px solid #99f6e4'
                      }}>
                        Sổ Thu / Chi
                      </span>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0', color: '#1e293b' }}>
                      Quản Lý Thu / Chi Quỹ Lớp
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                      Tạo đợt thu BHYT, BHTT, Quỹ lớp. Tích chọn học sinh đã nộp tiền, tự động tổng kết số dư minh bạch.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/teacher-dashboard/funds')}
                    style={{
                      marginTop: '20px',
                      width: '100%',
                      padding: '11px 16px',
                      backgroundColor: '#0d9488',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 3px 8px rgba(13,148,136,0.3)'
                    }}
                  >
                    <Wallet size={16} /> Mở Sổ Quỹ Lớp
                  </button>
                </div>

                {/* CARD 3: BÁO CÁO NỀ NẾP & CỜ ĐỎ */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '22px',
                  border: '1px solid #ffe4e6',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: '#fff1f2',
                        color: '#e11d48',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <ShieldAlert size={22} />
                      </div>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: '#fff1f2',
                        color: '#be123c',
                        border: '1px solid #fecdd3'
                      }}>
                        Cờ Đỏ Chấm
                      </span>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0', color: '#1e293b' }}>
                      Báo Cáo Nề Nếp & Vi Phạm
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                      Xem danh sách vi phạm nề nếp của lớp hôm nay do Đội Cờ đỏ chấm (kèm hình ảnh minh chứng vi phạm).
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/teacher-dashboard/discipline')}
                    style={{
                      marginTop: '20px',
                      width: '100%',
                      padding: '11px 16px',
                      backgroundColor: '#e11d48',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 3px 8px rgba(225,29,72,0.3)'
                    }}
                  >
                    <ShieldAlert size={16} /> Xem Báo Cáo Vi Phạm
                  </button>
                </div>

              </div>
            </section>
          )}

          {/* KHỐI 3: 🏢 TỔ CHUYÊN MÔN & ĐÁNH GIÁ KPI */}
          {(activeTab === 'all' || activeTab === 'department') && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(2,132,199,0.15)'
                }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#0f172a' }}>
                    3. Tổ Chuyên Môn & Đánh Giá KPI
                  </h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                    Kế hoạch giáo dục tổ, phân công chuyên môn, đánh giá KPI hàng tháng và kho giáo án dùng chung
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px'
              }}>
                
                {/* CARD 1: QUẢN LÝ TỔ CHUYÊN MÔN */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '22px',
                  border: '1px solid #bae6fd',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: '#f0f9ff',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Users size={22} />
                      </div>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: '#f0f9ff',
                        color: '#0369a1',
                        border: '1px solid #bae6fd'
                      }}>
                        Tổ Trưởng & GV
                      </span>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0', color: '#1e293b' }}>
                      Quản Lý Tổ Chuyên Môn
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                      Xem danh sách thành viên tổ, phân công giảng dạy, kế hoạch giáo dục môn học và biên bản sinh hoạt tổ định kỳ.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/giao-vien/quan-ly-to-chuyen-mon')}
                    style={{
                      marginTop: '20px',
                      width: '100%',
                      padding: '11px 16px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 3px 8px rgba(2,132,199,0.3)'
                    }}
                  >
                    <Users size={16} /> Mở Trang Tổ Chuyên Môn
                  </button>
                </div>

                {/* CARD 2: ĐÁNH GIÁ KPI TỔ CHUYÊN MÔN */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '22px',
                  border: '1px solid #fed7aa',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: '#fff7ed',
                        color: '#ea580c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Award size={22} />
                      </div>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: '#fff7ed',
                        color: '#c2410c',
                        border: '1px solid #fed7aa'
                      }}>
                        Chuẩn Thi Đua
                      </span>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0', color: '#1e293b' }}>
                      Đánh Giá KPI Giáo Viên
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                      Đánh giá mức độ hoàn thành nhiệm vụ giảng dạy, hồ sơ giáo án, bồi dưỡng học sinh giỏi và chấm điểm thi đua tháng.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/giao-vien/danh-gia-kpi-to-chuyen-mon')}
                    style={{
                      marginTop: '20px',
                      width: '100%',
                      padding: '11px 16px',
                      backgroundColor: '#ea580c',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 3px 8px rgba(234,88,12,0.3)'
                    }}
                  >
                    <Award size={16} /> Bảng Đánh Giá KPI
                  </button>
                </div>

                {/* CARD 3: KHO GIÁO ÁN & HỌC LIỆU SỐ TỔ */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '22px',
                  border: '1px solid #ddd6fe',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: '#f5f3ff',
                        color: '#7c3aed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FolderArchive size={22} />
                      </div>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: '#f5f3ff',
                        color: '#6d28d9',
                        border: '1px solid #ddd6fe'
                      }}>
                        Kho Số Hóa
                      </span>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0', color: '#1e293b' }}>
                      Kho Học Liệu & Giáo Án Tổ
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                      Kho lưu trữ đám mây chia sẻ giáo án mẫu, ma trận đề kiểm tra, bài giảng điện tử và học liệu dùng chung trong tổ.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/teacher-dashboard/department-drive')}
                    style={{
                      marginTop: '20px',
                      width: '100%',
                      padding: '11px 16px',
                      backgroundColor: '#7c3aed',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 3px 8px rgba(124,58,237,0.3)'
                    }}
                  >
                    <FolderArchive size={16} /> Mở Kho Học Liệu Tổ
                  </button>
                </div>

              </div>
            </section>
          )}

          {/* KHỐI 4: 🗓️ TRA CỨU & TIỆN ÍCH TRƯỜNG HỌC */}
          {(activeTab === 'all' || activeTab === 'utilities') && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#ede9fe',
                  color: '#6d28d9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(124,58,237,0.15)'
                }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#0f172a' }}>
                    4. Tra Cứu & Tiện Ích Trường Học
                  </h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                    Thời khóa biểu giảng dạy, lịch trực ban Ban Giám Hiệu & kho ứng dụng liên kết
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px'
              }}>
                
                {/* CARD 1: TKB & LỊCH TUẦN */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '22px',
                  border: '1px solid #ede9fe',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: '#f5f3ff',
                        color: '#7c3aed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Calendar size={22} />
                      </div>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: '#f5f3ff',
                        color: '#6d28d9',
                        border: '1px solid #ddd6fe'
                      }}>
                        Toàn Trường
                      </span>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0', color: '#1e293b' }}>
                      TKB & Lịch Tuần BGH
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                      Tra cứu Thời khóa biểu cá nhân, lịch dạy theo lớp, lịch công tác BGH và lịch trực ban toàn trường.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/lich-cong-tac')}
                    style={{
                      marginTop: '20px',
                      width: '100%',
                      padding: '11px 16px',
                      backgroundColor: '#7c3aed',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 3px 8px rgba(124,58,237,0.3)'
                    }}
                  >
                    <Calendar size={16} /> Tra Cứu TKB Toàn Trường
                  </button>
                </div>

                {/* CARD 2: CỔNG TIỆN ÍCH LINKING */}
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '22px',
                  border: '1px solid #dbeafe',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Grid size={22} />
                      </div>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe'
                      }}>
                        SMAS / Azota / K12
                      </span>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0', color: '#1e293b' }}>
                      Cổng Tiện Ích & Phần Mềm
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                      Truy cập nhanh vào các phần mềm trường học liên kết: SMAS, Azota, K12Online, Email ngành...
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/teacher-dashboard/app-hub')}
                    style={{
                      marginTop: '20px',
                      width: '100%',
                      padding: '11px 16px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 3px 8px rgba(37,99,235,0.3)'
                    }}
                  >
                    <Grid size={16} /> Mở Kho Ứng Dụng
                  </button>
                </div>

              </div>
            </section>
          )}

          {/* KHỐI 5: 🎯 ĐIỂM DANH & HOẠT ĐỘNG CLB THÔNG MINH */}
          {(activeTab === 'all' || activeTab === 'club_management') && (
            <section style={{ marginBottom: '20px' }}>
              <ClubAttendanceManager 
                userRole="teacher"
                teacherInfo={teacher}
                registrations={clubRegistrations}
              />
            </section>
          )}

        </div>

      </div>
    </div>
  );
}