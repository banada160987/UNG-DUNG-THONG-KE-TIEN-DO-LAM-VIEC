import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Clock, Play, Pause, RotateCcw, Volume2, Sparkles, Shuffle,
  Users, Award, Calendar, DollarSign, FileText, Check, Copy,
  Printer, Download, Grid, ChevronRight, Home, ArrowLeft,
  Settings, CheckCircle2, AlertCircle, RefreshCw, Eye, Edit3,
  Flame, HelpCircle, Star, ThumbsUp, Send, UserCheck, Shield
} from 'lucide-react';
import Confetti from 'react-confetti';
import { ALL_CBQ_CLASSES_34 } from '../../services/signmarTournamentService';
import { getTeacherSession } from '../../services/authSessionManager';
import * as XLSX from 'xlsx';

// Dữ liệu mẫu môn học THPT
const SUBJECTS_LIST = [
  'Toán học', 'Ngữ văn', 'Tiếng Anh', 'Vật lí', 'Hóa học', 'Sinh học',
  'Lịch sử', 'Địa lí', 'Tin học', 'Giáo dục kinh tế và pháp luật',
  'Công nghệ', 'Giáo dục thể chất', 'Giáo dục quốc phòng và an ninh',
  'Hoạt động trải nghiệm, hướng nghiệp'
];

export default function TeacherSmartUtilities() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'timer';
  const [activeTab, setActiveTab] = useState(initialTab); // 'timer' | 'wheel' | 'groups' | 'seating' | 'comments' | 'swap' | 'overtime' | 'shuffler'
  const [teacher, setTeacher] = useState(null);

  useEffect(() => {
    const activeTeacher = getTeacherSession();
    if (activeTeacher) {
      setTeacher(activeTeacher);
    }
  }, []);

  // Web Audio Context for Chimes & Sound Effects
  const playChimeSound = (type = 'bell') => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'tick') {
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      } else if (type === 'bell') {
        // School Bell chime (Ding-Dong)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.3); // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.8);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.8);
      } else if (type === 'win') {
        // Fanfare
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.connect(g);
          g.connect(audioCtx.destination);
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.2, audioCtx.currentTime + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.12 + 0.4);
          o.start(audioCtx.currentTime + i * 0.12);
          o.stop(audioCtx.currentTime + i * 0.12 + 0.4);
        });
      }
    } catch (e) {
      console.warn("Audio Context not allowed without interaction:", e);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '24px 16px', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>

        {/* TOP BAR NAVIGATION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate('/teacher-dashboard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                color: '#334155',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <ArrowLeft size={16} /> Quay lại Dashboard
            </button>
            <span style={{ fontSize: '13px', color: '#64748b' }}>/</span>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#7c3aed' }}>Tiện Ích Giáo Viên 4.0</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', background: '#ede9fe', color: '#6d28d9', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
              Năm học 2026 - 2027
            </span>
            <button
              onClick={() => navigate('/')}
              style={{ padding: '8px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', fontWeight: '600' }}
            >
              <Home size={14} /> Trang Chủ
            </button>
          </div>
        </div>

        {/* HERO TITLE BANNER */}
        <div style={{
          background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #7c3aed 100%)',
          borderRadius: '20px',
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(109, 40, 217, 0.3)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.18)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Sparkles size={14} color="#fde047" /> TRUNG TÂM TIỆN ÍCH TRỢ GIẢNG & NGHIỆP VỤ SỐ
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '8px 0 4px 0' }}>
                Hộp Công Cụ Tiện Ích Giáo Viên 4.0
              </h1>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#ddd6fe', maxWidth: '720px', lineHeight: '1.5' }}>
                Trọn bộ giải pháp thông minh hỗ trợ giảng dạy trên lớp, xếp chỗ ngồi, sinh nhận xét học bạ Thông tư 22, đổi tiết TKB và tính thù lao dạy thêm giờ trường THPT Cao Bá Quát.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '14px', padding: '12px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#e9d5ff', textTransform: 'uppercase', fontWeight: 'bold' }}>Thầy/Cô Đang Sử Dụng</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginTop: '2px' }}>
                {teacher?.name || 'Giáo viên THPT Cao Bá Quát'}
              </div>
              <div style={{ fontSize: '11.5px', color: '#c4b5fd' }}>
                {teacher?.homeroomClass ? `GVCN Lớp ${teacher.homeroomClass}` : (teacher?.subject || 'Tổ Chuyên Môn')}
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '22px',
          borderBottom: '2px solid #e2e8f0',
          scrollbarWidth: 'thin'
        }}>
          {[
            { id: 'timer', label: '⏱️ Đồng Hồ Lớp Học', icon: Clock },
            { id: 'wheel', label: '🎯 Bốc Thăm Gọi Tên', icon: Shuffle },
            { id: 'groups', label: '👥 Chia Nhóm Ngẫu Nhiên', icon: Users },
            { id: 'seating', label: '🪑 Sơ Đồ Chỗ Ngồi Lớp', icon: Grid },
            { id: 'comments', label: '📝 Nhận Xét Học Bạ TT22', icon: FileText },
            { id: 'swap', label: '🔄 Xin Đổi Tiết Dạy', icon: RefreshCw },
            { id: 'overtime', label: '💰 Tính Tiết Vượt Giờ', icon: DollarSign },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '12px',
                  fontSize: '13.5px',
                  fontWeight: isActive ? '700' : '600',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#6d28d9' : '#ffffff',
                  color: isActive ? '#ffffff' : '#475569',
                  boxShadow: isActive ? '0 4px 12px rgba(109, 40, 217, 0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENTS */}
        <div style={{ minHeight: '520px' }}>
          {activeTab === 'timer' && <ClassroomTimerTool playChime={playChimeSound} />}
          {activeTab === 'wheel' && <LuckyWheelTool playChime={playChimeSound} />}
          {activeTab === 'groups' && <GroupMakerTool />}
          {activeTab === 'seating' && <SeatingPlannerTool />}
          {activeTab === 'comments' && <TT22CommentGeneratorTool />}
          {activeTab === 'swap' && <ShiftSwapHelperTool teacher={teacher} />}
          {activeTab === 'overtime' && <OvertimeHoursCalculatorTool />}
        </div>

      </div>
    </div>
  );
}

// =========================================================================
// 1. TIỆN ÍCH: ĐỒNG HỒ ĐẾM NGƯỢC HOẠT ĐỘNG LỚP HỌC (CLASSROOM TIMER)
// =========================================================================
function ClassroomTimerTool({ playChime }) {
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 phút mặc định
  const [totalSeconds, setTotalSeconds] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [taskName, setTaskName] = useState('Thảo luận nhóm & Hoàn thành phiếu học tập');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            playChime('bell');
            playChime('win');
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 7000);
            return 0;
          }
          if (prev <= 4) {
            playChime('tick');
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const setPreset = (sec, name) => {
    setIsRunning(false);
    setSecondsLeft(sec);
    setTotalSeconds(sec);
    if (name) setTaskName(name);
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '20px',
      padding: isFullscreen ? '40px' : '28px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      position: isFullscreen ? 'fixed' : 'relative',
      inset: isFullscreen ? 0 : 'auto',
      zIndex: isFullscreen ? 9999 : 'auto',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {showConfetti && <Confetti recycle={false} numberOfPieces={350} />}

      <div style={{ width: '100%', maxWidth: '800px', textAlign: 'center' }}>
        
        {/* TIÊU ĐỀ HOẠT ĐỘNG */}
        <div style={{ marginBottom: '14px' }}>
          <input
            type="text"
            value={taskName}
            onChange={e => setTaskName(e.target.value)}
            placeholder="Nhập tên hoạt động lớp học..."
            style={{
              width: '100%',
              fontSize: isFullscreen ? '28px' : '20px',
              fontWeight: '800',
              textAlign: 'center',
              border: 'none',
              borderBottom: '2px dashed #cbd5e1',
              padding: '6px',
              color: '#1e293b',
              outline: 'none',
              background: 'transparent'
            }}
          />
        </div>

        {/* MẶT ĐỒNG HỒ ĐẾM NGƯỢC */}
        <div style={{
          background: secondsLeft === 0 ? 'linear-gradient(135deg, #16a34a, #15803d)' : (secondsLeft <= 30 && isRunning ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'linear-gradient(135deg, #0f172a, #1e293b)'),
          color: '#ffffff',
          borderRadius: '30px',
          padding: isFullscreen ? '60px 40px' : '36px 20px',
          margin: '18px 0',
          boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'background 0.3s ease'
        }}>
          {/* Thanh tiến trình chạy dưới đáy */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '8px',
            backgroundColor: secondsLeft === 0 ? '#facc15' : '#38bdf8',
            width: `${progressPercent}%`,
            transition: 'width 1s linear'
          }} />

          <div style={{
            fontSize: isFullscreen ? '120px' : '72px',
            fontWeight: '900',
            fontFamily: 'monospace',
            letterSpacing: '4px',
            textShadow: '0 4px 16px rgba(0,0,0,0.3)'
          }}>
            {formatTime(secondsLeft)}
          </div>

          <div style={{ fontSize: isFullscreen ? '18px' : '14px', color: '#94a3b8', marginTop: '6px' }}>
            {secondsLeft === 0 ? '🎉 HẾT GIỜ! XIN MỜI CÁC NHÓM TRÌNH BÀY' : (isRunning ? '⏳ Đang đếm ngược thời gian...' : '⏸️ Đang tạm dừng')}
          </div>
        </div>

        {/* NÚT ĐIỀU KHIỂN CHÍNH */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '22px' }}>
          <button
            onClick={() => {
              if (!isRunning && secondsLeft === 0) {
                setSecondsLeft(totalSeconds);
              }
              setIsRunning(!isRunning);
            }}
            style={{
              padding: '12px 28px',
              fontSize: '16px',
              fontWeight: '700',
              borderRadius: '14px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: isRunning ? '#ea580c' : '#16a34a',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
            }}
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
            {isRunning ? 'Tạm Dừng' : (secondsLeft === 0 ? 'Bắt Đầu Lại' : 'Bắt Đầu Đếm')}
          </button>

          <button
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(totalSeconds);
            }}
            style={{
              padding: '12px 20px',
              fontSize: '15px',
              fontWeight: '600',
              borderRadius: '14px',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
              backgroundColor: '#ffffff',
              color: '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={18} /> Đặt Lại
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              padding: '12px 20px',
              fontSize: '15px',
              fontWeight: '600',
              borderRadius: '14px',
              border: '1px solid #c4b5fd',
              cursor: 'pointer',
              backgroundColor: '#f5f3ff',
              color: '#6d28d9',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isFullscreen ? 'Thu Nhỏ' : '📺 Chiếu Toàn Màn Hình'}
          </button>
        </div>

        {/* CÁC MỐC THỜI GIAN NHANH */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
            Mốc thời gian lớp học nhanh:
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {[
              { s: 60, name: '1 Phút (Hỏi đáp nhanh)' },
              { s: 120, name: '2 Phút (Chuẩn bị câu trả lời)' },
              { s: 180, name: '3 Phút (Thảo luận cặp đôi)' },
              { s: 300, name: '5 Phút (Hoạt động nhóm)' },
              { s: 600, name: '10 Phút (Bài tập nhóm nhỏ)' },
              { s: 900, name: '15 Phút (Kiểm tra 15 phút)' },
              { s: 2700, name: '45 Phút (Trọn vẹn 1 tiết dạy)' },
            ].map((p, idx) => (
              <button
                key={idx}
                onClick={() => setPreset(p.s, p.name)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: totalSeconds === p.s ? '1.5px solid #7c3aed' : '1px solid #cbd5e1',
                  background: totalSeconds === p.s ? '#f5f3ff' : '#ffffff',
                  color: totalSeconds === p.s ? '#6d28d9' : '#334155',
                  cursor: 'pointer'
                }}
              >
                {p.s < 60 ? `${p.s}s` : `${Math.floor(p.s / 60)}p`}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// =========================================================================
// 2. TIỆN ÍCH: VÒNG QUAY MAY MẮN / BỐC THĂM GỌI TÊN HỌC SINH (LUCKY WHEEL)
// =========================================================================
function LuckyWheelTool({ playChime }) {
  const [selectedClass, setSelectedClass] = useState('10A01');
  const [totalStudents, setTotalStudents] = useState(42);
  const [studentNamesText, setStudentNamesText] = useState('');
  const [callingMode, setCallingMode] = useState('number'); // 'number' (STT 1-45) | 'list' (Tên cụ thể)
  const [isSpinning, setIsSpinning] = useState(false);
  const [pickedResult, setPickedResult] = useState(null);
  const [calledHistory, setCalledHistory] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const startSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setPickedResult(null);

    // Xác định tập ứng viên chưa được gọi
    let pool = [];
    if (callingMode === 'number') {
      for (let i = 1; i <= totalStudents; i++) {
        const strNum = `Số ${i}`;
        if (!calledHistory.includes(strNum)) pool.push(strNum);
      }
    } else {
      const lines = studentNamesText.split('\n').map(s => s.trim()).filter(Boolean);
      pool = lines.filter(name => !calledHistory.includes(name));
    }

    if (pool.length === 0) {
      alert('Tất cả học sinh trong danh sách đã được gọi hết lượt! Nhấn "Đặt lại lượt gọi" để quay từ đầu.');
      setIsSpinning(false);
      return;
    }

    // Hiệu ứng quay hồi hộp
    let counter = 0;
    const interval = setInterval(() => {
      counter++;
      const randomCandidate = pool[Math.floor(Math.random() * pool.length)];
      setPickedResult(randomCandidate);
      playChime('tick');

      if (counter > 25) {
        clearInterval(interval);
        const finalWinner = pool[Math.floor(Math.random() * pool.length)];
        setPickedResult(finalWinner);
        setIsSpinning(false);
        setCalledHistory(prev => [finalWinner, ...prev]);
        playChime('win');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }, 100);
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
      {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
        
        {/* CỘT CẤU HÌNH */}
        <div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>
            ⚙️ Cấu Hình Gọi Học Sinh Lên Bảng
          </h3>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
              Hình thức gọi học sinh:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setCallingMode('number')}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: callingMode === 'number' ? '1.5px solid #7c3aed' : '1px solid #cbd5e1',
                  background: callingMode === 'number' ? '#f5f3ff' : '#ffffff',
                  color: callingMode === 'number' ? '#6d28d9' : '#475569',
                  cursor: 'pointer'
                }}
              >
                🔢 Gọi theo Số Thứ Tự (1 - {totalStudents})
              </button>
              <button
                onClick={() => setCallingMode('list')}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: callingMode === 'list' ? '1.5px solid #7c3aed' : '1px solid #cbd5e1',
                  background: callingMode === 'list' ? '#f5f3ff' : '#ffffff',
                  color: callingMode === 'list' ? '#6d28d9' : '#475569',
                  cursor: 'pointer'
                }}
              >
                📋 Dán Danh Sách Tên
              </button>
            </div>
          </div>

          {callingMode === 'number' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Chọn Lớp Học:</label>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                >
                  {ALL_CBQ_CLASSES_34.map(c => (
                    <option key={c.id} value={c.name}>Lớp {c.name} ({c.grade})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Sĩ Số Lớp (1-50):</label>
                <input
                  type="number"
                  min="5"
                  max="55"
                  value={totalStudents}
                  onChange={e => setTotalStudents(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                />
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                Danh sách họ tên học sinh (mỗi bạn 1 dòng):
              </label>
              <textarea
                rows="6"
                value={studentNamesText}
                onChange={e => setStudentNamesText(e.target.value)}
                placeholder="Nguyễn Văn An&#10;Trần Thị Bích&#10;Lê Hoàng Cường&#10;Phạm Thu Dung..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', lineHeight: '1.4' }}
              />
            </div>
          )}

          {/* LỊCH SỬ ĐÃ GỌI */}
          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 14px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>
                Đã gọi ({calledHistory.length} bạn):
              </span>
              {calledHistory.length > 0 && (
                <button
                  onClick={() => setCalledHistory([])}
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Xóa Lịch Sử
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
              {calledHistory.map((item, i) => (
                <span key={i} style={{ background: '#ede9fe', color: '#6d28d9', fontSize: '11.5px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px' }}>
                  {item}
                </span>
              ))}
              {calledHistory.length === 0 && (
                <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Chưa có học sinh nào được gọi.</span>
              )}
            </div>
          </div>
        </div>

        {/* CỘT QUAY THƯỞNG */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          
          <div style={{
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: isSpinning ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'linear-gradient(135deg, #1e293b, #0f172a)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 14px 35px rgba(124, 58, 237, 0.3)',
            border: '6px solid #f1f5f9',
            padding: '20px',
            position: 'relative'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '4px' }}>
              {isSpinning ? '🌀' : (pickedResult ? '🎉' : '🎯')}
            </div>
            <div style={{
              fontSize: pickedResult ? '24px' : '15px',
              fontWeight: '900',
              color: '#facc15',
              wordBreak: 'break-word',
              maxWidth: '200px'
            }}>
              {pickedResult || 'SẴN SÀNG QUAY'}
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>
              {isSpinning ? 'Đang chọn ngẫu nhiên...' : (pickedResult ? 'Mời em lên bảng!' : 'Nhấn nút bên dưới')}
            </div>
          </div>

          <button
            onClick={startSpin}
            disabled={isSpinning}
            style={{
              marginTop: '24px',
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: '800',
              borderRadius: '16px',
              border: 'none',
              cursor: isSpinning ? 'not-allowed' : 'pointer',
              background: isSpinning ? '#94a3b8' : 'linear-gradient(135deg, #7c3aed, #9333ea)',
              color: '#ffffff',
              boxShadow: '0 6px 18px rgba(124,58,237,0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Shuffle size={18} /> {isSpinning ? 'Đang Quay...' : '🎲 QUAY GỌI HỌC SINH'}
          </button>
        </div>

      </div>
    </div>
  );
}

// =========================================================================
// 3. TIỆN ÍCH: CHIA NHÓM HỌC TẬP NGẪU NHIÊN (GROUP MAKER)
// =========================================================================
function GroupMakerTool() {
  const [numGroups, setNumGroups] = useState(4);
  const [totalStudents, setTotalStudents] = useState(40);
  const [studentsText, setStudentsText] = useState('');
  const [generatedGroups, setGeneratedGroups] = useState(null);
  const [copiedGroupText, setCopiedGroupText] = useState(false);

  const groupNames = [
    'Nhóm 1: Chiến Binh', 'Nhóm 2: Sáng Tạo', 'Nhóm 3: Tiên Phong', 'Nhóm 4: Bứt Phá',
    'Nhóm 5: Đột Phá', 'Nhóm 6: Tỏa Sáng', 'Nhóm 7: Đoàn Kết', 'Nhóm 8: Trí Tuệ'
  ];

  const handleGenerateGroups = () => {
    let pool = [];
    const customList = studentsText.split('\n').map(s => s.trim()).filter(Boolean);
    if (customList.length > 0) {
      pool = [...customList];
    } else {
      for (let i = 1; i <= totalStudents; i++) {
        pool.push(`Học sinh số ${i}`);
      }
    }

    // Shuffle
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const groups = Array.from({ length: numGroups }, (_, i) => ({
      name: groupNames[i] || `Nhóm ${i + 1}`,
      members: []
    }));

    shuffled.forEach((st, idx) => {
      groups[idx % numGroups].members.push(st);
    });

    setGeneratedGroups(groups);
  };

  const copyGroups = () => {
    if (!generatedGroups) return;
    let t = `🏛️ TRƯỜNG THPT CAO BÁ QUÁT - ĐẮK LẮK\n📢 KẾT QUẢ CHIA NHÓM THẢO LUẬN LỚP HỌC:\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    generatedGroups.forEach(g => {
      t += `📌 ${g.name.toUpperCase()} (${g.members.length} bạn):\n`;
      g.members.forEach((m, idx) => {
        t += `  ${idx + 1}. ${m}\n`;
      });
      t += `\n`;
    });
    navigator.clipboard.writeText(t);
    setCopiedGroupText(true);
    setTimeout(() => setCopiedGroupText(false), 3000);
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>
        👥 Chia Nhóm Học Tập Tự Động & Công Bằng
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Số Lượng Nhóm Cần Chia *</label>
          <select
            value={numGroups}
            onChange={e => setNumGroups(Number(e.target.value))}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
          >
            <option value={2}>Chia 2 Nhóm</option>
            <option value={3}>Chia 3 Nhóm</option>
            <option value={4}>Chia 4 Nhóm (Khuyên dùng)</option>
            <option value={5}>Chia 5 Nhóm</option>
            <option value={6}>Chia 6 Nhóm</option>
            <option value={8}>Chia 8 Nhóm</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Sĩ Số Học Sinh (Nếu dùng số thứ tự):</label>
          <input
            type="number"
            min="4"
            max="55"
            value={totalStudents}
            onChange={e => setTotalStudents(Number(e.target.value))}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={handleGenerateGroups}
            style={{ width: '100%', padding: '10px 16px', background: '#4338ca', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Shuffle size={15} /> 🎲 Tiến Hành Chia Nhóm
          </button>
        </div>
      </div>

      {generatedGroups && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534' }}>
              ✅ Đã chia thành công {generatedGroups.length} nhóm:
            </span>
            <button
              onClick={copyGroups}
              style={{ padding: '6px 12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {copiedGroupText ? <Check size={14} /> : <Copy size={14} />} {copiedGroupText ? 'Đã sao chép!' : '📋 Copy Gửi Zalo Lớp'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {generatedGroups.map((g, gIdx) => (
              <div key={gIdx} style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontWeight: '800', color: '#4338ca', fontSize: '14px', marginBottom: '8px', borderBottom: '2px solid #818cf8', paddingBottom: '4px' }}>
                  {g.name} ({g.members.length} bạn)
                </div>
                <ol style={{ paddingLeft: '18px', margin: 0, fontSize: '12.5px', color: '#334155' }}>
                  {g.members.map((m, mIdx) => (
                    <li key={mIdx} style={{ marginBottom: '3px' }}>{m}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 4. TIỆN ÍCH: SƠ ĐỒ CHỖ NGỒI LỚP HỌC & ĐẢO CHỖ THÔNG MINH (SEATING PLANNER)
// =========================================================================
function SeatingPlannerTool() {
  const [selectedClass, setSelectedClass] = useState('10A01');
  const [rowsCount, setRowsCount] = useState(5); // 5 bàn dọc
  const [colsCount, setColsCount] = useState(4); // 4 dãy ngang
  const [seatingGrid, setSeatingGrid] = useState(() => {
    // 4 dãy x 5 bàn = 20 bàn (mỗi bàn 2 học sinh = 40 chỗ)
    const grid = [];
    let count = 1;
    for (let r = 0; r < 5; r++) {
      const row = [];
      for (let c = 0; c < 4; c++) {
        row.push({
          deskId: `Bàn ${r + 1}-${c + 1}`,
          left: `HS số ${count++}`,
          right: `HS số ${count++}`
        });
      }
      grid.push(row);
    }
    return grid;
  });

  // Tự động xoay vòng chỗ ngồi (Chống cận thị lệch cột sống)
  const handleRotateSeats = () => {
    const flatStudents = [];
    seatingGrid.forEach(row => {
      row.forEach(desk => {
        flatStudents.push(desk.left);
        flatStudents.push(desk.right);
      });
    });

    // Dịch chuyển vòng tròn 2 bước
    const shifted = [
      ...flatStudents.slice(4),
      ...flatStudents.slice(0, 4)
    ];

    let ptr = 0;
    const newGrid = seatingGrid.map(row => 
      row.map(desk => ({
        ...desk,
        left: shifted[ptr++],
        right: shifted[ptr++]
      }))
    );
    setSeatingGrid(newGrid);
  };

  // Xuất file Excel sơ đồ chỗ ngồi tuân thủ rule GEMINI.md: 1-So_do_cho_ngoi...
  const handleExportExcel = () => {
    const wsData = [
      ['TRƯỜNG THPT CAO BÁ QUÁT - ĐẮK LẮK'],
      [`SƠ ĐỒ CHỖ NGỒI HỌC SINH LỚP ${selectedClass}`],
      ['Năm học 2026 - 2027'],
      [''],
      ['[ BỤC GIẢNG & BÀN GIÁO VIÊN ]'],
      ['']
    ];

    seatingGrid.forEach((row, rIdx) => {
      const rowLabels = [];
      row.forEach((desk, cIdx) => {
        rowLabels.push(`[Dãy ${cIdx + 1} - Bàn ${rIdx + 1}]: ${desk.left} | ${desk.right}`);
      });
      wsData.push(rowLabels);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Lớp_${selectedClass}`);
    XLSX.writeFile(wb, `1-So_do_cho_ngoi_lop_${selectedClass}_CBQ.xlsx`);
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>
            🪑 Sơ Đồ Bố Trí Chỗ Ngồi Lớp Học (Chuẩn 4 Dãy x 5 Bàn)
          </h3>
          <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
            Quản lý sơ đồ bàn học sinh, đảo chỗ định kỳ xoay vòng bảo vệ mắt & chống gù lưng.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleRotateSeats}
            style={{ padding: '8px 14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Shuffle size={14} /> 🔄 Đảo Chỗ Định Kỳ
          </button>
          <button
            onClick={handleExportExcel}
            style={{ padding: '8px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Download size={14} /> 📥 Xuất Excel (1-...)
          </button>
          <button
            onClick={() => window.print()}
            style={{ padding: '8px 14px', background: '#475569', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Printer size={14} /> In A4
          </button>
        </div>
      </div>

      {/* BỤC GIẢNG & BÀN GIÁO VIÊN */}
      <div style={{
        background: '#f1f5f9',
        border: '2px dashed #94a3b8',
        borderRadius: '12px',
        padding: '10px',
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#475569',
        fontSize: '13px',
        maxWidth: '450px',
        margin: '0 auto 20px auto'
      }}>
        👩‍🏫 BỤC GIẢNG & BÀN GIÁO VIÊN
      </div>

      {/* LƯỚI BÀN HỌC */}
      <div style={{ overflowX: 'auto', paddingBottom: '10px' }}>
        <div style={{ minWidth: '720px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {seatingGrid.map((row, rIdx) => (
            <div key={rIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              {row.map((desk, cIdx) => (
                <div key={cIdx} style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#6d28d9', marginBottom: '4px', textAlign: 'center' }}>
                    Dãy {cIdx + 1} - Bàn {rIdx + 1}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px', fontSize: '11.5px', textAlign: 'center', fontWeight: '600', color: '#0f172a' }}>
                      {desk.left}
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px', fontSize: '11.5px', textAlign: 'center', fontWeight: '600', color: '#0f172a' }}>
                      {desk.right}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 5. TIỆN ÍCH: TRỢ LÝ SOẠN NHẬN XÉT HỌC BẠ THÔNG TƯ 22 (TT22 COMMENT GENERATOR)
// =========================================================================
function TT22CommentGeneratorTool() {
  const [subject, setSubject] = useState('Toán học');
  const [gradeLevel, setGradeLevel] = useState('Khá');
  const [attitude, setAttitude] = useState('Chăm chỉ, hăng hái phát biểu');
  const [generatedComments, setGeneratedComments] = useState([]);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const handleGenerate = () => {
    let variants = [];

    if (gradeLevel === 'Xuất sắc / Giỏi') {
      variants = [
        `Nắm rất vững kiến thức môn ${subject}, tư duy nhanh nhạy, giải quyết bài toán độc lập và sáng tạo. ${attitude}, luôn gương mẫu trong học tập.`,
        `Học tập xuất sắc môn ${subject}. Có năng lực tự học và tư duy logic rất tốt. ${attitude}, tích cực hỗ trợ bạn bè cùng tiến bộ.`,
        `Thành tích học tập môn ${subject} vượt trội. Nắm chắc phương pháp học tập, tích cực phát biểu xây dựng bài. Rất đáng biểu dương!`
      ];
    } else if (gradeLevel === 'Khá') {
      variants = [
        `Nắm chắc kiến thức cơ bản môn ${subject}. Có ý thức học tập tốt, ${attitude}. Cần rèn luyện thêm ở các dạng bài nâng cao để bứt phá.`,
        `Hoàn thành tốt các nhiệm vụ học tập môn ${subject}. ${attitude}, có tiến bộ rõ rệt trong học kỳ. Tiếp tục phát huy!`,
        `Có năng lực học tập môn ${subject} khá tốt. Tiếp thu bài nhanh, cần cẩn thận hơn trong khâu trình bày để đạt kết quả tối đa.`
      ];
    } else if (gradeLevel === 'Đạt') {
      variants = [
        `Nắm được các yêu cầu cơ bản của môn ${subject}. ${attitude}. Cần chủ động hơn trong việc ôn tập và rèn luyện kỹ năng giải bài tập.`,
        `Có cố gắng trong học tập môn ${subject}. Cần tập trung hơn trong giờ học và thường xuyên trao đổi với thầy cô khi gặp bài tập khó.`,
        `Hoàn thành mức độ cơ bản môn ${subject}. Khuyến khích em tự tin phát biểu xây dựng bài và tăng cường tự học ở nhà.`
      ];
    } else {
      variants = [
        `Còn hổng một số kiến thức cơ bản môn ${subject}. Cần dành nhiều thời gian hơn để tự học và bám sát hướng dẫn của giáo viên bộ môn.`,
        `Kỹ năng vận dụng kiến thức môn ${subject} còn hạn chế. Cần chú ý lắng nghe giảng bài, làm bài tập đầy đủ trước khi đến lớp.`,
        `Cần tăng cường ý thức tự học môn ${subject}. Khuyến khích em tham gia học tập cùng nhóm bạn để củng cố lại kiến thức cơ bản.`
      ];
    }

    setGeneratedComments(variants);
  };

  const copyComment = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2500);
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>
        📝 Trợ Lý Viết Lời Nhận Xét Học Bạ Chuẩn Thông Tư 22/2021/BGDĐT
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Môn Học *</label>
          <select
            value={subject}
            onChange={e => setSubject(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          >
            {SUBJECTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Mức Xếp Loại Học Lực *</label>
          <select
            value={gradeLevel}
            onChange={e => setGradeLevel(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', color: '#0369a1' }}
          >
            <option value="Xuất sắc / Giỏi">Xuất sắc / Giỏi (8.0 - 10.0)</option>
            <option value="Khá">Khá (6.5 - 7.9)</option>
            <option value="Đạt">Đạt (5.0 - 6.4)</option>
            <option value="Chưa đạt / Cần cố gắng">Chưa đạt / Cần cố gắng (&lt; 5.0)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Thái Độ & Phẩm Chất Nổi Bật:</label>
          <select
            value={attitude}
            onChange={e => setAttitude(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          >
            <option value="Chăm chỉ, hăng hái phát biểu">Chăm chỉ, hăng hái phát biểu</option>
            <option value="Có ý thức kỷ luật tốt, nghiêm túc">Có ý thức kỷ luật tốt, nghiêm túc</option>
            <option value="Tiếp thu bài nhanh, làm việc nhóm tốt">Tiếp thu bài nhanh, làm việc nhóm tốt</option>
            <option value="Có nhiều tiến bộ vượt bậc">Có nhiều tiến bộ vượt bậc</option>
            <option value="Còn nhút nhát, ít phát biểu">Còn nhút nhát, ít phát biểu</option>
            <option value="Cần cẩn thận hơn trong tính toán">Cần cẩn thận hơn trong tính toán</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={handleGenerate}
            style={{ width: '100%', padding: '9px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Sparkles size={15} /> Sinh Nhận Xét AI
          </button>
        </div>
      </div>

      {generatedComments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534' }}>
            🎯 3 Gợi ý nhận xét chuẩn hóa (Bấm để sao chép vào sổ liên lạc/học bạ SMAS):
          </div>

          {generatedComments.map((comment, idx) => (
            <div key={idx} style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
              <div style={{ fontSize: '13.5px', color: '#1e293b', lineHeight: '1.5' }}>
                <span style={{ fontWeight: 'bold', color: '#4338ca', marginRight: '6px' }}>Mẫu {idx + 1}:</span>
                {comment}
              </div>
              <button
                onClick={() => copyComment(comment, idx)}
                style={{ flexShrink: 0, padding: '7px 12px', background: copiedIdx === idx ? '#16a34a' : '#4338ca', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copiedIdx === idx ? <Check size={14} /> : <Copy size={14} />} {copiedIdx === idx ? 'Đã chép!' : 'Chép'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 6. TIỆN ÍCH: TRỢ LÝ ĐỔI TIẾT DẠY & XUẤT ĐƠN BÁO BGH (SHIFT SWAP HELPER)
// =========================================================================
function ShiftSwapHelperTool({ teacher }) {
  const [formData, setFormData] = useState({
    originalDate: '',
    originalSession: 'Sáng',
    originalPeriod: 'Tiết 1',
    originalClass: '10A01',
    swapWithTeacher: 'Nguyễn Văn B',
    swapDate: '',
    swapSession: 'Chiều',
    swapPeriod: 'Tiết 3',
    swapClass: '11A04',
    reason: 'Tham dự lớp tập huấn chuyên môn của Sở GD&ĐT'
  });
  const [copiedNotice, setCopiedNotice] = useState(false);

  const noticeText = `KÍNH GỬI BAN GIÁM HIỆU & TỔ CHUYÊN MÔN
Tôi là: ${teacher?.name || 'Giáo viên'}
Xin phép được đổi tiết dạy như sau:
• Tiết dạy gốc: ${formData.originalPeriod} (${formData.originalSession}) - Lớp ${formData.originalClass} ngày ${formData.originalDate || '...'}
• Đổi với Thầy/Cô: ${formData.swapWithTeacher}
• Tiết dạy bù: ${formData.swapPeriod} (${formData.swapSession}) - Lớp ${formData.swapClass} ngày ${formData.swapDate || '...'}
• Lý do: ${formData.reason}
Kính mong Ban Giám hiệu xem xét và phê duyệt!`;

  return (
    <div style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>
        🔄 Đổi Tiết Dạy & Tự Động Soạn Phiếu Báo Ban Giám Hiệu
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* KHỐI TIẾT DẠY GỐC */}
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontWeight: 'bold', color: '#b91c1c', fontSize: '13.5px', marginBottom: '10px' }}>
            📅 1. TIẾT XIN NGHỈ / CẦN ĐỔI:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 'bold' }}>Ngày dạy gốc:</label>
              <input type="date" value={formData.originalDate} onChange={e => setFormData({ ...formData, originalDate: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 'bold' }}>Buổi:</label>
                <select value={formData.originalSession} onChange={e => setFormData({ ...formData, originalSession: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option>Sáng</option>
                  <option>Chiều</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 'bold' }}>Tiết:</label>
                <select value={formData.originalPeriod} onChange={e => setFormData({ ...formData, originalPeriod: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option>Tiết 1</option>
                  <option>Tiết 2</option>
                  <option>Tiết 3</option>
                  <option>Tiết 4</option>
                  <option>Tiết 5</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 'bold' }}>Lớp dạy:</label>
              <select value={formData.originalClass} onChange={e => setFormData({ ...formData, originalClass: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                {ALL_CBQ_CLASSES_34.map(c => <option key={c.id} value={c.name}>Lớp {c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* KHỐI TIẾT DẠY THAY / DẠY BÙ */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontWeight: 'bold', color: '#166534', fontSize: '13.5px', marginBottom: '10px' }}>
            🤝 2. THẦY CÔ NHẬN ĐỔI TIẾT / DẠY BÙ:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 'bold' }}>Họ tên đồng nghiệp đổi tiết:</label>
              <input type="text" value={formData.swapWithTeacher} onChange={e => setFormData({ ...formData, swapWithTeacher: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div>
              <label style={{ fontSize: '11.5px', fontWeight: 'bold' }}>Ngày dạy bù/đổi:</label>
              <input type="date" value={formData.swapDate} onChange={e => setFormData({ ...formData, swapDate: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 'bold' }}>Buổi:</label>
                <select value={formData.swapSession} onChange={e => setFormData({ ...formData, swapSession: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option>Sáng</option>
                  <option>Chiều</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 'bold' }}>Tiết:</label>
                <select value={formData.swapPeriod} onChange={e => setFormData({ ...formData, swapPeriod: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option>Tiết 1</option>
                  <option>Tiết 2</option>
                  <option>Tiết 3</option>
                  <option>Tiết 4</option>
                  <option>Tiết 5</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Lý do đổi tiết:</label>
        <input type="text" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
      </div>

      {/* MẪU TIN NHẮN TỰ ĐỘNG */}
      <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#334155' }}>
            📱 Nội dung thông báo sẵn sàng gửi nhóm Zalo BGH:
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(noticeText);
              setCopiedNotice(true);
              setTimeout(() => setCopiedNotice(false), 2500);
            }}
            style={{ padding: '6px 12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {copiedNotice ? <Check size={14} /> : <Copy size={14} />} {copiedNotice ? 'Đã sao chép!' : 'Chép Gửi Zalo'}
          </button>
        </div>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
          {noticeText}
        </pre>
      </div>
    </div>
  );
}

// =========================================================================
// 7. TIỆN ÍCH: TÍNH TOÁN TIẾT VƯỢT GIỜ & THÙ LAO (OVERTIME CALCULATOR)
// =========================================================================
function OvertimeHoursCalculatorTool() {
  const [baseSalary, setBaseSalary] = useState(2340000); // Mức lương cơ sở hiện hành
  const [salaryCoefficient, setSalaryCoefficient] = useState(3.0); // Hệ số lương (VD 3.0)
  const [isHomeroom, setIsHomeroom] = useState(true); // GVCN giảm 4 tiết
  const [isDeptHead, setIsDeptHead] = useState(false); // Tổ trưởng giảm 3 tiết
  const [actualHoursPerWeek, setActualHoursPerWeek] = useState(19); // Thực dạy
  const [totalWeeks, setTotalWeeks] = useState(18); // Số tuần học kỳ (18 tuần)

  // Định mức THPT: 17 tiết/tuần
  let standardHours = 17;
  if (isHomeroom) standardHours -= 4;
  if (isDeptHead) standardHours -= 3;

  const excessHoursPerWeek = Math.max(0, actualHoursPerWeek - standardHours);
  const totalExcessHours = excessHoursPerWeek * totalWeeks;

  // Công thức Thông tư liên tịch: Tiền 1 tiết = (Lương tháng x 12) / (35 tuần x 17 tiết) x 150%
  const monthlySalary = baseSalary * salaryCoefficient;
  const hourlyRate = Math.round(((monthlySalary * 12) / (35 * 17)) * 1.5);
  const totalOvertimePay = Math.round(totalExcessHours * hourlyRate);

  return (
    <div style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: '700', color: '#1e293b' }}>
        💰 Bảng Tính Số Tiết Thừa Giờ & Dự Toán Thù Lao (Chuẩn Thông Tư 28 & TT 15)
      </h3>
      <p style={{ margin: '0 0 18px 0', fontSize: '12.5px', color: '#64748b' }}>
        Áp dụng định mức giảng dạy THPT 17 tiết/tuần, các khoản miễn giảm định mức và mức thù lao vượt giờ 150%.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        {/* CỘT NHẬP LIỆU */}
        <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13.5px', color: '#334155', marginBottom: '12px' }}>
            ⚙️ Thông Số Giảng Dạy & Kiêm Nhiệm
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Hệ Số Lương Hiện Hưởng:</label>
              <input type="number" step="0.1" value={salaryCoefficient} onChange={e => setSalaryCoefficient(Number(e.target.value))} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>Số Tiết Thực Dạy / Tuần (Bao gồm tăng tiết):</label>
              <input type="number" value={actualHoursPerWeek} onChange={e => setActualHoursPerWeek(Number(e.target.value))} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              <label style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={isHomeroom} onChange={e => setIsHomeroom(e.target.checked)} />
                <span>Chủ nhiệm lớp (Giảm 4 tiết/tuần)</span>
              </label>
              <label style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={isDeptHead} onChange={e => setIsDeptHead(e.target.checked)} />
                <span>Tổ trưởng chuyên môn (Giảm 3 tiết/tuần)</span>
              </label>
            </div>
          </div>
        </div>

        {/* CỘT KẾT QUẢ TÍNH TOÁN */}
        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase' }}>
              KẾT QUẢ TÍNH TOÁN (HỌC KỲ I - 18 TUẦN)
            </div>

            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Định mức chuẩn sau giảm trừ:</span>
                <strong>{standardHours} tiết / tuần</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Số tiết thừa / tuần:</span>
                <strong style={{ color: '#16a34a' }}>+{excessHoursPerWeek} tiết / tuần</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Tổng số tiết vượt giờ cả kỳ:</span>
                <strong style={{ color: '#15803d', fontSize: '15px' }}>{totalExcessHours} tiết</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #bbf7d0', paddingTop: '8px' }}>
                <span style={{ color: '#475569' }}>Đơn giá 1 tiết vượt giờ (150%):</span>
                <strong>{hourlyRate.toLocaleString('vi-VN')} đ/tiết</strong>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '18px', background: '#ffffff', borderRadius: '10px', padding: '14px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '11.5px', color: '#64748b' }}>TỔNG THÙ LAO VƯỢT GIỜ DỰ KIẾN:</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#16a34a', marginTop: '2px' }}>
              {totalOvertimePay.toLocaleString('vi-VN')} VNĐ
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
