import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Zap, Award, BookOpen, Users, Wallet, ShieldAlert,
  Calendar, Grid, LogOut, CheckCircle, ChevronRight, UserCheck, Search, Filter
} from 'lucide-react';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'teaching', 'homeroom', 'utilities'

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
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cbq_teacher_session');
    localStorage.removeItem('cbq_user');
    navigate('/dang-nhap-giao-vien');
  };

  const isHomeroomTeacher = teacher?.role === 'gv_homeroom' || teacher?.homeroomClass;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 1. TOP BANNER & HỒ SƠ GIÁO VIÊN */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl shadow-inner border border-indigo-200">
              {teacher?.name ? teacher.name.charAt(0) : 'GV'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">
                  Giáo viên: {teacher?.name || 'Chưa cập nhật'}
                </h1>
                {isHomeroomTeacher ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> GVCN Lớp {teacher?.homeroomClass || '12A01'}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    Giáo viên Bộ môn {teacher?.subject ? `(${teacher.subject})` : ''}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Cổng thông tin & Tiện ích quản lý giảng dạy - Trường THPT Cao Bá Quát
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-xl transition-colors border border-slate-200"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>

        {/* 2. THANH CHUYỂN TAB PHÂN NHÓM NGHIỆP VỤ */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
          >
            <Filter className="w-4 h-4" /> Tất cả công cụ
          </button>

          <button
            onClick={() => setActiveTab('teaching')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'teaching'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200'
              }`}
          >
            <BookOpen className="w-4 h-4" /> 1. Chuyên Môn & Giảng Dạy
          </button>

          {isHomeroomTeacher && (
            <button
              onClick={() => setActiveTab('homeroom')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'homeroom'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200'
                }`}
            >
              <Users className="w-4 h-4" /> 2. Công Tác Chủ Nhiệm ({teacher?.homeroomClass || '12A01'})
            </button>
          )}

          <button
            onClick={() => setActiveTab('utilities')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'utilities'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-purple-50 hover:text-purple-600 border border-slate-200'
              }`}
          >
            <Calendar className="w-4 h-4" /> 3. Tra Cứu & Tiện Ích
          </button>
        </div>

        {/* 3. KHỐI NỘI DUNG CHỨC NĂNG DẠNG GROUPED CARDS */}
        <div className="space-y-8">

          {/* KHỐI 1: 📘 NGHIỆP VỤ CHUYÊN MÔN & GIẢNG DẠY */}
          {(activeTab === 'all' || activeTab === 'teaching') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Chuyên Môn & Giảng Dạy</h2>
                    <p className="text-xs text-slate-500">Soạn giáo án, ra đề thi THPT 2025, đánh giá học sinh TT 22 & theo dõi sổ đầu bài</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                {/* CARD 1: SOẠN GIÁO ÁN */}
                <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Kế hoạch bài dạy
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-base group-hover:text-indigo-600 transition-colors">
                      Soạn Giáo Án (CV 5512)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      Tự động tạo bài soạn 4 bước & 3 nhóm mục tiêu (Kiến thức, Năng lực, Phẩm chất). Xuất file Word (.doc) chuẩn 5512.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/teacher/lesson-plans')}
                    className="mt-5 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> Soạn Giáo Án 5512
                  </button>
                </div>

                {/* CARD 2: RA ĐỀ THI 2025 */}
                <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-semibold">
                        <Zap className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                        BGDĐT 2025
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-base group-hover:text-amber-600 transition-colors">
                      Ra Đề Thi & Đảo Đề 2025
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      Hỗ trợ 4 dạng câu hỏi chuẩn đề thi THPT 2025 (Đúng/Sai, trả lời ngắn). Tự động đảo mã đề (101, 102...) & xuất đáp án.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/teacher/exam-maker')}
                    className="mt-5 w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" /> Ra Đề Thi & Đảo Đề
                  </button>
                </div>

                {/* CARD 3: ĐÁNH GIÁ TT 22 */}
                <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-semibold">
                        <Award className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        AI Gợi ý
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-base group-hover:text-emerald-600 transition-colors">
                      Đánh Giá Học Sinh (TT 22)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      Sổ đánh giá học sinh chuẩn Thông tư 22/2021/TT-BGDĐT. AI nhận xét tự động theo phẩm chất, năng lực GDPT 2018.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/teacher/assessment-tt22')}
                    className="mt-5 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4" /> Đánh Giá TT 22 & Nhận Xét AI
                  </button>
                </div>

                {/* CARD 4: SỔ ĐẦU BÀI & HỌC TẬP */}
                <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-semibold">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        Sổ điện tử
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors">
                      Tình hình Học tập & Sổ Đầu Bài
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      Kiểm tra Sổ đầu bài điện tử do Lớp trưởng ghi và Báo cáo thiếu BTVN từ Lớp phó Học tập.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/teacher/academics')}
                    className="mt-5 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" /> Xem Tình Hình Học Tập
                  </button>
                </div>

              </div>
            </section>
          )}

          {/* KHỐI 2: 👥 CÔNG TÁC CHỦ NHIỆM */}
          {isHomeroomTeacher && (activeTab === 'all' || activeTab === 'homeroom') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">
                      Công Tác Chủ Nhiệm - Lớp {teacher?.homeroomClass || '12A01'}
                    </h2>
                    <p className="text-xs text-slate-500">Quản lý tài khoản học sinh, nề nếp thi đua cờ đỏ và sổ quỹ lớp thu/chi</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                {/* CARD 1: QUẢN LÝ HỌC SINH */}
                <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-semibold">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                        Reset Mật khẩu
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-base group-hover:text-emerald-600 transition-colors">
                      Quản Lý HS Lớp Chủ Nhiệm
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      Xem danh sách lớp chủ nhiệm, theo dõi trạng thái tài khoản, reset mật khẩu nhanh cho học sinh và xuất CSDL ngành.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/teacher/homeroom')}
                    className="mt-5 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" /> Quản Lý Lớp & Reset MK ({teacher?.homeroomClass || '12A01'})
                  </button>
                </div>

                {/* CARD 2: QUẢN LÝ THU CHI QUỸ LỚP */}
                <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-semibold">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                        Sổ quỹ
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-base group-hover:text-teal-600 transition-colors">
                      Quản Lý Thu / Chi Quỹ Lớp
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      Tạo đợt thu BHYT, BHTT, Quỹ lớp. Tích chọn học sinh đã đóng tiền, tự động thống kê số dư minh bạch.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/teacher/funds')}
                    className="mt-5 w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-4 h-4" /> Mở Sổ Quỹ Lớp
                  </button>
                </div>