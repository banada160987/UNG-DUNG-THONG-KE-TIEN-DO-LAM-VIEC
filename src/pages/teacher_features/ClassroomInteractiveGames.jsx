import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Confetti from 'react-confetti';
import {
  ArrowLeft, Award, BookOpen, Download, Plus, Trash2, Edit3, Shuffle,
  FileText, CheckCircle2, HelpCircle, Layers, Printer, RefreshCw, Eye, EyeOff,
  CheckSquare, Send, FileSpreadsheet, Sparkles, QrCode, Upload, Image,
  Copy, Search, Filter, Database, Play, Pause, RotateCcw, Volume2, VolumeX,
  Maximize2, Minimize2, Trophy, Users, Flame, Star, Flag, Clock, Zap
} from 'lucide-react';
import MathView from '../../components/MathView';
import { supabase, DualSupabaseService } from '../../lib/supabase';
import { gameAudio } from '../../utils/gameAudio';
import { HIGH_SCHOOL_SUBJECTS } from '../../services/smartAssessmentService';
import MobileBottomNav from '../../components/MobileBottomNav';

export default function ClassroomInteractiveGames() {
  const navigate = useNavigate();

  // 1. DATA STATE (NẠP TRỰC TIẾP TỪ DATABASE)
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('Tất cả môn');
  const [selectedGrade, setSelectedGrade] = useState('Tất cả khối');
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Học sinh từ Database `cbq_students`
  const [classesList, setClassesList] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classStudents, setClassStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);

  // 2. GAME STATE
  const [gameMode, setGameMode] = useState('arena'); // 'arena' (Rung chuông vàng) | 'wheel' (Vòng quay) | 'team_battle' (Đại chiến 4 tổ) | 'puzzle' (Mảnh ghép bí mật)
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Timer State
  const [timerDuration, setTimerDuration] = useState(20);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Arena Mode State
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState([]); // Trợ giúp 50:50
  const [audienceVotes, setAudienceVotes] = useState(null); // Trợ giúp biểu quyết

  // Wheel Mode State
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelWinner, setWheelWinner] = useState(null);
  const [wheelStudentQuestion, setWheelStudentQuestion] = useState(null);
  const canvasRef = useRef(null);
  const currentRotationRef = useRef(0);

  // Team Battle State (4 Tổ)
  const [teams, setTeams] = useState([
    { id: 1, name: 'Tổ 1 (Khởi Động)', color: '#2563eb', bg: '#eff6ff', score: 0 },
    { id: 2, name: 'Tổ 2 (Bứt Phá)', color: '#ea580c', bg: '#fff7ed', score: 0 },
    { id: 3, name: 'Tổ 3 (Tiên Phong)', color: '#16a34a', bg: '#f0fdf4', score: 0 },
    { id: 4, name: 'Tổ 4 (Chiến Thắng)', color: '#9333ea', bg: '#faf5ff', score: 0 }
  ]);
  const [buzzedTeam, setBuzzedTeam] = useState(null);

  // Puzzle Mode State (6 Mảnh ghép bí mật)
  const [puzzleKeyword, setPuzzleKeyword] = useState('CAO BÁ QUÁT');
  const [openedTiles, setOpenedTiles] = useState([]);
  const [activeTileIndex, setActiveTileIndex] = useState(null);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);

  // Session Scoreboard (Lưu điểm học sinh được cộng trong tiết)
  const [sessionScores, setSessionScores] = useState([]);

  // Modal Thêm Câu Hỏi Mới vào CSDL
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQSubject, setNewQSubject] = useState('Toán');
  const [newQTitle, setNewQTitle] = useState('');
  const [newQContent, setNewQContent] = useState('');
  const [newQOptions, setNewQOptions] = useState(['', '', '', '']);
  const [newQCorrect, setNewQCorrect] = useState(0);
  const [newQExplanation, setNewQExplanation] = useState('');
  const [savingNewQ, setSavingNewQ] = useState(false);

  // ==========================================
  // NẠP DỮ LIỆU TỪ SUPABASE
  // ==========================================
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Nạp danh sách Đề thi / Gói câu hỏi từ `cbq_smart_assessments`
      const { data: asmData } = await DualSupabaseService.selectSmart('cbq_smart_assessments', q =>
        q.select('id, title, subject, grade, duration_minutes, questions, teacher_name')
         .eq('status', 'active')
         .order('created_at', { ascending: false })
      );

      // 2. Nạp thêm câu hỏi trắc nghiệm từ `cbq_quiz_questions`
      const { data: quizQData } = await DualSupabaseService.selectSmart('cbq_quiz_questions', q =>
        q.select('*').order('order_index', { ascending: true })
      );

      let allPacks = Array.isArray(asmData) ? [...asmData] : [];

      // Nếu có câu hỏi từ quiz_questions, gói thành một bộ đặc biệt "Truyền Thống & Đố Vui"
      if (Array.isArray(quizQData) && quizQData.length > 0) {
        const quizPack = {
          id: 'quiz-questions-db',
          title: 'Đố Vui Tri Thức & Lịch Sử Trường THPT Cao Bá Quát',
          subject: 'Truyền thống nhà trường',
          grade: 'Tất cả khối',
          teacher_name: 'Đoàn trường',
          questions: quizQData.map((q, idx) => {
            let opts = [];
            try {
              opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
            } catch (_) {
              opts = ['A', 'B', 'C', 'D'];
            }
            return {
              id: q.id || `qq_${idx}`,
              title: `Câu ${idx + 1}`,
              content: q.question_text,
              options: Array.isArray(opts) ? opts : ['A', 'B', 'C', 'D'],
              correctAnswerIndex: q.correct_option_index !== undefined ? q.correct_option_index : 0,
              explanation: q.points ? `Điểm chuẩn câu hỏi: ${q.points} điểm` : ''
            };
          })
        };
        allPacks.unshift(quizPack);
      }

      setAssessments(allPacks);

      // Trích xuất toàn bộ câu hỏi
      let combinedQuestions = [];
      allPacks.forEach(pack => {
        if (pack.questions && Array.isArray(pack.questions)) {
          pack.questions.forEach(q => {
            combinedQuestions.push({
              ...q,
              packId: pack.id,
              packTitle: pack.title,
              subject: pack.subject,
              grade: pack.grade
            });
          });
        }
      });
      setQuestions(combinedQuestions);

      // 3. Nạp danh sách Học sinh từ `cbq_students`
      const { data: studentsData } = await DualSupabaseService.selectSmart('cbq_students', q =>
        q.select('id, student_code, full_name, student_class, grade_level')
         .order('student_class', { ascending: true })
         .order('full_name', { ascending: true })
      );

      if (Array.isArray(studentsData) && studentsData.length > 0) {
        setAllStudents(studentsData);
        const classes = [...new Set(studentsData.map(s => s.student_class).filter(Boolean))].sort();
        setClassesList(classes);
        if (classes.length > 0) {
          setSelectedClass(classes[0]);
          const initialClassStudents = studentsData.filter(s => s.student_class === classes[0]);
          setClassStudents(initialClassStudents);
        }
      }
    } catch (err) {
      console.error('Lỗi nạp dữ liệu trò chơi từ DB:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật danh sách học sinh khi đổi Lớp
  useEffect(() => {
    if (selectedClass && allStudents.length > 0) {
      const filtered = allStudents.filter(s => s.student_class === selectedClass);
      setClassStudents(filtered);
    }
  }, [selectedClass, allStudents]);

  // Lọc câu hỏi theo Môn học, Khối lớp và Gói đề thi
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchSubject = selectedSubject === 'Tất cả môn' || q.subject === selectedSubject;
      const matchGrade = selectedGrade === 'Tất cả khối' || q.grade === selectedGrade;
      const matchPack = selectedAssessmentId === 'all' || q.packId === selectedAssessmentId;
      return matchSubject && matchGrade && matchPack;
    });
  }, [questions, selectedSubject, selectedGrade, selectedAssessmentId]);

  const currentQuestion = filteredQuestions[currentQIndex] || filteredQuestions[0] || null;

  // ==========================================
  // BỘ ĐẾM THỜI GIAN (TIMER)
  // ==========================================
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            gameAudio.playWrong(); // Hết giờ
            return 0;
          }
          if (prev <= 6) {
            gameAudio.playTick(); // Tíc tắc hồi hộp 5s cuối
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const resetTimer = (newDuration = timerDuration) => {
    setTimeLeft(newDuration);
    setIsTimerRunning(false);
  };

  const startTimer = () => {
    if (timeLeft === 0) resetTimer();
    setIsTimerRunning(true);
    gameAudio.init();
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  // Chuyển câu hỏi
  const handleNextQuestion = () => {
    if (currentQIndex < filteredQuestions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      setCurrentQIndex(0);
    }
    setShowAnswer(false);
    setShowExplanation(false);
    setEliminatedOptions([]);
    setAudienceVotes(null);
    setBuzzedTeam(null);
    resetTimer();
  };

  const handlePrevQuestion = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(prev => prev - 1);
    } else {
      setCurrentQIndex(filteredQuestions.length - 1);
    }
    setShowAnswer(false);
    setShowExplanation(false);
    setEliminatedOptions([]);
    setAudienceVotes(null);
    setBuzzedTeam(null);
    resetTimer();
  };

  // Trợ giúp 50:50
  const handle5050 = () => {
    if (!currentQuestion || eliminatedOptions.length > 0) return;
    const correctIdx = currentQuestion.correctAnswerIndex ?? 0;
    const wrongIndices = [0, 1, 2, 3].filter(i => i !== correctIdx && i < (currentQuestion.options || []).length);
    const shuffled = [...wrongIndices].sort(() => 0.5 - Math.random());
    setEliminatedOptions(shuffled.slice(0, 2));
    gameAudio.playTick();
  };

  // Trợ giúp Biểu quyết cả lớp
  const handleAudienceHelp = () => {
    if (!currentQuestion) return;
    const correctIdx = currentQuestion.correctAnswerIndex ?? 0;
    // Tỉ lệ thiên về đáp án đúng (khoảng 60-75%)
    const correctPct = Math.floor(Math.random() * 15) + 60;
    const remaining = 100 - correctPct;
    const p1 = Math.floor(remaining * 0.45);
    const p2 = Math.floor(remaining * 0.35);
    const p3 = remaining - p1 - p2;
    const otherPcts = [p1, p2, p3];

    let votes = [0, 0, 0, 0];
    votes[correctIdx] = correctPct;
    let oIdx = 0;
    for (let i = 0; i < 4; i++) {
      if (i !== correctIdx) {
        votes[i] = otherPcts[oIdx++] || 5;
      }
    }
    setAudienceVotes(votes);
    gameAudio.playTick();
  };

  // Tiết lộ đáp án
  const handleRevealAnswer = () => {
    setShowAnswer(true);
    gameAudio.playCorrect();
    setIsTimerRunning(false);
  };

  // ==========================================
  // VÒNG QUAY MAY MẮN (CANVAS ANIMATION)
  // ==========================================
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1'
  ];

  const drawWheel = (rotationAngle = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const count = classStudents.length || 10;
    const arc = (2 * Math.PI) / count;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = centerX - 12;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ từng nan quạt
    for (let i = 0; i < count; i++) {
      const angle = rotationAngle + i * arc;
      ctx.beginPath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arc);
      ctx.lineTo(centerX, centerY);
      ctx.fill();
      ctx.stroke();

      // Vẽ tên học sinh
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12.5px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;
      const studentName = classStudents[i]?.full_name || `Học sinh ${i + 1}`;
      const displayName = studentName.length > 18 ? studentName.substring(0, 16) + '...' : studentName;
      ctx.fillText(displayName, radius - 20, 4);
      ctx.restore();
    }

    // Tâm vòng tròn ở giữa
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#facc15';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CBQ', centerX, centerY + 4);

    // Mũi tên kim chỉ vị trí trúng
    ctx.beginPath();
    ctx.moveTo(centerX + radius + 8, centerY);
    ctx.lineTo(centerX + radius - 16, centerY - 14);
    ctx.lineTo(centerX + radius - 16, centerY + 14);
    ctx.closePath();
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => {
    if (gameMode === 'wheel') {
      drawWheel(currentRotationRef.current);
    }
  }, [gameMode, classStudents]);

  const spinWheel = () => {
    if (isSpinning || classStudents.length === 0) return;
    setIsSpinning(true);
    setWheelWinner(null);
    setWheelStudentQuestion(null);
    gameAudio.init();

    const count = classStudents.length;
    const arc = (2 * Math.PI) / count;
    // Chọn ngẫu nhiên học sinh trúng
    const winnerIndex = Math.floor(Math.random() * count);
    const extraRounds = 5 + Math.floor(Math.random() * 3); // 5-7 vòng quay
    // Kim chỉ nằm ở góc 0 (bên phải): targetAngle = - (winnerIndex * arc + arc/2)
    const targetAngle = extraRounds * 2 * Math.PI + (2 * Math.PI - (winnerIndex * arc + arc / 2));

    const startAngle = currentRotationRef.current % (2 * Math.PI);
    const totalRotation = targetAngle;
    const duration = 4000; // 4 giây
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing out cubic: 1 - pow(1 - x, 3)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + totalRotation * easeOut;
      currentRotationRef.current = currentAngle;
      drawWheel(currentAngle);

      // Âm thanh quay bánh xe
      if (Math.floor(elapsed / 100) % 2 === 0 && progress < 0.95) {
        gameAudio.playWheelClick();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        const winner = classStudents[winnerIndex];
        setWheelWinner(winner);
        setShowConfetti(true);
        gameAudio.playVictory();
        setTimeout(() => setShowConfetti(false), 4500);

        // Bốc 1 câu hỏi ngẫu nhiên từ CSDL cho học sinh này
        if (filteredQuestions.length > 0) {
          const randomQ = filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)];
          setWheelStudentQuestion(randomQ);
        }
      }
    };

    requestAnimationFrame(animate);
  };

  // Cộng điểm cho học sinh từ Vòng quay
  const handleAwardStudent = (points) => {
    if (!wheelWinner) return;
    const record = {
      id: Date.now(),
      studentName: wheelWinner.full_name,
      studentCode: wheelWinner.student_code || '---',
      studentClass: selectedClass,
      points,
      reason: `Trả lời trò chơi: ${wheelStudentQuestion?.title || 'Câu hỏi may mắn'}`,
      time: new Date().toLocaleTimeString('vi-VN')
    };
    setSessionScores(prev => [record, ...prev]);
    gameAudio.playCorrect();
    alert(`🎉 Đã cộng +${points} điểm cho học sinh ${wheelWinner.full_name} (${selectedClass})!`);
  };

  // ==========================================
  // ĐẠI CHIẾN 4 TỔ (TEAM BATTLE)
  // ==========================================
  const handleTeamScore = (teamId, delta) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, score: Math.max(0, t.score + delta) } : t));
    if (delta > 0) gameAudio.playCorrect();
    else gameAudio.playWrong();
  };

  const handleTeamBuzz = (team) => {
    setBuzzedTeam(team);
    gameAudio.playBuzzer();
  };

  const handleFinishTeamBattle = () => {
    setShowConfetti(true);
    gameAudio.playVictory();
    setTimeout(() => setShowConfetti(false), 5000);
  };

  // ==========================================
  // MẢNH GHÉP BÍ MẬT (PUZZLE FLIP)
  // ==========================================
  const handleOpenTile = (index) => {
    if (openedTiles.includes(index)) return;
    setActiveTileIndex(index);
    setShowAnswer(false);
  };

  const handleSolveTileQuestion = (correct) => {
    if (correct && activeTileIndex !== null) {
      setOpenedTiles(prev => [...prev, activeTileIndex]);
      gameAudio.playCorrect();
      if (openedTiles.length + 1 >= 6) {
        setIsPuzzleSolved(true);
        setShowConfetti(true);
        gameAudio.playVictory();
      }
    } else {
      gameAudio.playWrong();
    }
    setActiveTileIndex(null);
  };

  // ==========================================
  // THÊM CÂU HỎI MỚI VÀO DATABASE
  // ==========================================
  const handleSaveNewQuestionToDB = async (e) => {
    e.preventDefault();
    if (!newQContent.trim() || newQOptions.some(opt => !opt.trim())) {
      alert('Vui lòng nhập đầy đủ nội dung câu hỏi và 4 phương án lựa chọn!');
      return;
    }

    setSavingNewQ(true);
    try {
      const payload = {
        question_text: newQContent.trim(),
        question_type: 'multiple_choice',
        options: JSON.stringify(newQOptions.map(o => o.trim())),
        correct_option_index: Number(newQCorrect),
        points: 10,
        order_index: (questions.length || 0) + 1,
        created_at: new Date().toISOString()
      };

      const { data, error } = await DualSupabaseService.insertSmart('cbq_quiz_questions', payload);
      if (error) throw error;

      alert('✅ Đã lưu câu hỏi thành công vào Cơ sở dữ liệu trường THPT Cao Bá Quát!');
      setShowAddModal(false);
      setNewQContent('');
      setNewQOptions(['', '', '', '']);
      setNewQExplanation('');
      fetchInitialData(); // Tải lại CSDL
    } catch (err) {
      console.error('Lỗi lưu câu hỏi:', err);
      alert('Không thể lưu câu hỏi vào CSDL: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setSavingNewQ(false);
    }
  };

  // ==========================================
  // XUẤT BÁO CÁO EXCEL ĐIỂM THƯỞNG (QUY TẮC GEMINI.MD)
  // ==========================================
  const handleExportExcel = () => {
    if (sessionScores.length === 0) {
      alert('Chưa có học sinh nào được ghi nhận điểm thưởng trong tiết học này!');
      return;
    }

    const dataRows = sessionScores.map((s, idx) => ({
      'STT': idx + 1,
      'Họ và tên học sinh': s.studentName,
      'Mã học sinh': s.studentCode,
      'Lớp': s.studentClass,
      'Điểm thưởng': `+${s.points} điểm`,
      'Nội dung / Hoạt động': s.reason,
      'Thời gian ghi nhận': s.time
    }));

    const ws = XLSX.utils.json_to_sheet(dataRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Diem_Thuong_Tro_Choi');

    // Quy tắc đặt tên file theo GEMINI.md: Tiền tố số thứ tự
    const fileName = `1-Bao_cao_diem_thuong_tro_choi_lop_${selectedClass || 'Toan_Truong'}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Bật/tắt Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#ffffff',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: '80px'
    }}>
      {/* HIỆU ỨNG PHÁO HOA ĂN MỪNG */}
      {showConfetti && (
        <Confetti
          width={typeof window !== 'undefined' ? window.innerWidth : 1200}
          height={typeof window !== 'undefined' ? window.innerHeight : 800}
          recycle={false}
          numberOfPieces={400}
        />
      )}

      {/* 1. TOP HEADER & CONTROL BAR */}
      <header style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderBottom: '1.5px solid #334155',
        padding: '16px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          
          {/* Logo & Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/giao-vien/dashboard')}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid #475569',
                color: '#e2e8f0',
                padding: '8px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              <ArrowLeft size={16} /> Bàn Làm Việc
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🎮</span>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.3px' }}>
                  ĐẤU TRƯỜNG & TRÒ CHƠI LỚP HỌC
                </h1>
                <span style={{ background: '#16a34a', color: '#ffffff', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px' }}>
                  Live DB
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                Trường THPT Cao Bá Quát • Đồng bộ trực tiếp CSDL Đề thi & Danh sách Học sinh
              </div>
            </div>
          </div>

          {/* Quick Actions (Audio Mute, Fullscreen, Export Excel, Thêm câu hỏi) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            
            <button
              onClick={() => {
                const muted = gameAudio.toggleMute();
                setIsMuted(muted);
              }}
              style={{
                background: isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)',
                border: `1px solid ${isMuted ? '#ef4444' : '#3b82f6'}`,
                color: isMuted ? '#f87171' : '#60a5fa',
                padding: '8px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
              title="Bật/Tắt âm thanh hiệu ứng"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              <span>{isMuted ? 'Tắt Âm' : 'Bật Âm'}</span>
            </button>

            <button
              onClick={toggleFullscreen}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid #475569',
                color: '#e2e8f0',
                padding: '8px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '600'
              }}
              title="Bật/Tắt toàn màn hình trình chiếu Smart TV / Máy chiếu"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              <span>{isFullscreen ? 'Thu Nhỏ' : 'Toàn Màn Hình'}</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
              }}
            >
              <Plus size={16} /> Thêm Câu Hỏi CSDL
            </button>

            <button
              onClick={handleExportExcel}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid #475569',
                color: '#e2e8f0',
                padding: '8px 14px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '600'
              }}
              title="Xuất bảng điểm thưởng tiết học ra Excel theo quy định"
            >
              <FileSpreadsheet size={16} color="#34d399" /> Xuất Điểm Excel ({sessionScores.length})
            </button>
          </div>
        </div>
      </header>

      {/* 2. THANH LỌC NGUỒN DỮ LIỆU CSDL (DATABASE CONTROLS) */}
      <div style={{
        background: '#1e293b',
        borderBottom: '1px solid #334155',
        padding: '12px 20px',
        marginBottom: '20px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '13px', fontWeight: 'bold' }}>
            <Database size={16} /> CSDL Môn học:
          </div>

          {/* Chọn Môn */}
          <select
            value={selectedSubject}
            onChange={e => {
              setSelectedSubject(e.target.value);
              setCurrentQIndex(0);
            }}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              border: '1px solid #475569',
              background: '#0f172a',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            <option value="Tất cả môn">📚 Tất cả môn học</option>
            {HIGH_SCHOOL_SUBJECTS.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
            <option value="Truyền thống nhà trường">🏛️ Truyền thống THPT Cao Bá Quát</option>
          </select>

          {/* Chọn Gói đề thi / Bài kiểm tra */}
          <select
            value={selectedAssessmentId}
            onChange={e => {
              setSelectedAssessmentId(e.target.value);
              setCurrentQIndex(0);
            }}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              border: '1px solid #475569',
              background: '#0f172a',
              color: '#ffffff',
              fontSize: '13px',
              maxWidth: '320px'
            }}
          >
            <option value="all">🎯 Tất cả bộ câu hỏi ({filteredQuestions.length} câu)</option>
            {assessments.map(pack => (
              <option key={pack.id} value={pack.id}>
                {pack.title} ({pack.questions?.length || 0} câu)
              </option>
            ))}
          </select>

          {/* Chọn Lớp Học (Lấy từ cbq_students) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            <Users size={16} color="#f59e0b" />
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#f59e0b' }}>Lớp Thực Hiện:</span>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1.5px solid #f59e0b',
                background: '#0f172a',
                color: '#fef08a',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              {classesList.map(cls => (
                <option key={cls} value={cls}>Lớp {cls} ({allStudents.filter(s => s.student_class === cls).length} HS)</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. THANH CHUYỂN ĐỔI CHẾ ĐỘ TRÒ CHƠI (GAME MODE SWITCHER) */}
      <div style={{ maxWidth: '1400px', margin: '0 auto 24px auto', padding: '0 20px' }}>
        <div className="mobile-tab-scroll" style={{
          display: 'flex',
          gap: '12px',
          background: '#1e293b',
          padding: '6px',
          borderRadius: '16px',
          border: '1px solid #334155'
        }}>
          <button
            onClick={() => { setGameMode('arena'); resetTimer(); }}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '12px',
              border: 'none',
              background: gameMode === 'arena' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
              color: gameMode === 'arena' ? '#ffffff' : '#94a3b8',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: gameMode === 'arena' ? '0 4px 14px rgba(37,99,235,0.4)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Trophy size={18} />
            <span>1. Đấu Trường Tri Thức</span>
          </button>

          <button
            onClick={() => { setGameMode('wheel'); resetTimer(); }}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '12px',
              border: 'none',
              background: gameMode === 'wheel' ? 'linear-gradient(135deg, #ea580c, #c2410c)' : 'transparent',
              color: gameMode === 'wheel' ? '#ffffff' : '#94a3b8',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: gameMode === 'wheel' ? '0 4px 14px rgba(234,88,12,0.4)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Sparkles size={18} />
            <span>2. Vòng Quay May Mắn ({classStudents.length} HS)</span>
          </button>

          <button
            onClick={() => { setGameMode('team_battle'); resetTimer(); }}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '12px',
              border: 'none',
              background: gameMode === 'team_battle' ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'transparent',
              color: gameMode === 'team_battle' ? '#ffffff' : '#94a3b8',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: gameMode === 'team_battle' ? '0 4px 14px rgba(22,163,74,0.4)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Flame size={18} />
            <span>3. Đại Chiến 4 Tổ</span>
          </button>

          <button
            onClick={() => { setGameMode('puzzle'); resetTimer(); }}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '12px',
              border: 'none',
              background: gameMode === 'puzzle' ? 'linear-gradient(135deg, #9333ea, #7e22ce)' : 'transparent',
              color: gameMode === 'puzzle' ? '#ffffff' : '#94a3b8',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: gameMode === 'puzzle' ? '0 4px 14px rgba(147,51,234,0.4)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Layers size={18} />
            <span>4. Mảnh Ghép Khởi Động</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN GAME ARENA CONTAINER */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
            <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 16px auto', color: '#38bdf8' }} />
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Đang nạp ngân hàng câu hỏi & CSDL học sinh trường THPT Cao Bá Quát...</div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div style={{ background: '#1e293b', borderRadius: '20px', padding: '60px 20px', textAlign: 'center', border: '1px solid #334155' }}>
            <HelpCircle size={48} style={{ margin: '0 auto 16px auto', color: '#f59e0b' }} />
            <h3 style={{ fontSize: '18px', margin: '0 0 8px 0', color: '#ffffff' }}>Chưa có câu hỏi cho bộ môn này</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              Hãy chọn môn học khác hoặc bấm nút "Thêm Câu Hỏi CSDL" để bổ sung ngay câu hỏi mới vào hệ thống!
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              + Thêm câu hỏi đầu tiên
            </button>
          </div>
        ) : (

          /* ========================================================
             CHẾ ĐỘ 1: ĐẤU TRƯỜNG TRI THỨC (ARENA SHOWDOWN)
             ======================================================== */
          gameMode === 'arena' ? (
            <div>
              {/* STATUS BAR: CÂU HỎI HIỆN TẠI & BỘ ĐẾM GIỜ */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '20px',
                background: '#1e293b',
                padding: '14px 20px',
                borderRadius: '16px',
                border: '1px solid #334155'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '800'
                  }}>
                    CÂU {currentQIndex + 1} / {filteredQuestions.length}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                    Bộ môn: <strong style={{ color: '#e2e8f0' }}>{currentQuestion.subject || 'Chung'}</strong>
                  </span>
                </div>

                {/* TIMER CONTROLS */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: timeLeft <= 5 ? '#dc2626' : (timeLeft <= 10 ? '#d97706' : '#047857'),
                    color: '#ffffff',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '18px',
                    fontWeight: '900',
                    transition: 'all 0.3s'
                  }}>
                    <Clock size={20} />
                    <span>{timeLeft}s</span>
                  </div>

                  {isTimerRunning ? (
                    <button
                      onClick={pauseTimer}
                      style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '7px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px' }}
                    >
                      <Pause size={14} /> Tạm Dừng
                    </button>
                  ) : (
                    <button
                      onClick={startTimer}
                      style={{ background: '#22c55e', color: '#0f172a', border: 'none', padding: '7px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px' }}
                    >
                      <Play size={14} /> Bắt Đầu Đếm
                    </button>
                  )}

                  <button
                    onClick={() => resetTimer()}
                    style={{ background: '#475569', color: '#ffffff', border: 'none', padding: '7px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12.5px' }}
                    title="Đặt lại đồng hồ"
                  >
                    <RotateCcw size={14} />
                  </button>

                  <select
                    value={timerDuration}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setTimerDuration(val);
                      resetTimer(val);
                    }}
                    style={{ background: '#0f172a', color: '#e2e8f0', border: '1px solid #475569', borderRadius: '8px', padding: '6px 10px', fontSize: '12.5px' }}
                  >
                    <option value={10}>10 giây</option>
                    <option value={15}>15 giây</option>
                    <option value={20}>20 giây</option>
                    <option value={30}>30 giây</option>
                    <option value={45}>45 giây</option>
                  </select>
                </div>

                {/* QUYỀN TRỢ GIÚP */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={handle5050}
                    disabled={eliminatedOptions.length > 0}
                    style={{
                      background: eliminatedOptions.length > 0 ? '#334155' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 'bold',
                      cursor: eliminatedOptions.length > 0 ? 'not-allowed' : 'pointer',
                      opacity: eliminatedOptions.length > 0 ? 0.5 : 1
                    }}
                    title="Loại bỏ 2 phương án sai"
                  >
                    ⚡ 50:50
                  </button>

                  <button
                    onClick={handleAudienceHelp}
                    disabled={Boolean(audienceVotes)}
                    style={{
                      background: audienceVotes ? '#334155' : 'linear-gradient(135deg, #06b6d4, #0891b2)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 'bold',
                      cursor: audienceVotes ? 'not-allowed' : 'pointer',
                      opacity: audienceVotes ? 0.5 : 1
                    }}
                    title="Biểu quyết ý kiến cả lớp"
                  >
                    📊 Biểu Quyết
                  </button>
                </div>
              </div>

              {/* KHỐI NỘI DUNG CÂU HỎI (QUESTION PRESENTATION CARD) */}
              <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                borderRadius: '24px',
                border: '2px solid #3b82f6',
                padding: '36px 32px',
                marginBottom: '24px',
                boxShadow: '0 12px 36px rgba(59,130,246,0.15)',
                position: 'relative'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  {currentQuestion.title || `Câu hỏi số ${currentQIndex + 1}`}
                </div>

                <div style={{ fontSize: '22px', fontWeight: '700', lineHeight: '1.6', color: '#f8fafc', marginBottom: '20px' }}>
                  <MathView text={currentQuestion.content || ''} />
                </div>

                {/* LƯỚI 4 PHƯƠNG ÁN LỰA CHỌN */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
                  gap: '16px'
                }}>
                  {(currentQuestion.options || ['A', 'B', 'C', 'D']).map((option, idx) => {
                    const optionLabels = ['A', 'B', 'C', 'D'];
                    const optionColors = ['#2563eb', '#dc2626', '#d97706', '#16a34a'];
                    const isCorrect = idx === (currentQuestion.correctAnswerIndex ?? 0);
                    const isEliminated = eliminatedOptions.includes(idx);
                    const votePct = audienceVotes ? audienceVotes[idx] : null;

                    return (
                      <div
                        key={idx}
                        style={{
                          background: showAnswer && isCorrect 
                            ? 'linear-gradient(135deg, #15803d 0%, #166534 100%)' 
                            : (isEliminated ? '#1e293b' : '#1e293b'),
                          border: showAnswer && isCorrect
                            ? '3px solid #4ade80'
                            : (isEliminated ? '1px dashed #475569' : '1.5px solid #334155'),
                          borderRadius: '16px',
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          opacity: isEliminated ? 0.25 : 1,
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Nhãn A, B, C, D */}
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: showAnswer && isCorrect ? '#22c55e' : optionColors[idx % 4],
                          color: '#ffffff',
                          fontSize: '18px',
                          fontWeight: '900',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {optionLabels[idx]}
                        </div>

                        {/* Nội dung phương án */}
                        <div style={{ flex: 1, fontSize: '17px', fontWeight: '600', color: showAnswer && isCorrect ? '#ffffff' : '#f1f5f9' }}>
                          <MathView text={String(option)} />
                        </div>

                        {/* Biểu quyết phần trăm */}
                        {votePct !== null && !isEliminated && (
                          <div style={{
                            background: 'rgba(0,0,0,0.4)',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            color: '#38bdf8'
                          }}>
                            {votePct}%
                          </div>
                        )}

                        {showAnswer && isCorrect && (
                          <CheckCircle2 size={24} color="#4ade80" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* LỜI GIẢI CHI TIẾT SƯ PHẠM (KHI BẬT) */}
                {showExplanation && currentQuestion.explanation && (
                  <div style={{
                    marginTop: '20px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1.5px solid #10b981',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    color: '#a7f3d0',
                    fontSize: '14.5px',
                    lineHeight: '1.6'
                  }}>
                    <strong style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <CheckCircle2 size={18} /> HƯỚNG DẪN GIẢI SƯ PHẠM:
                    </strong>
                    <MathView text={currentQuestion.explanation} />
                  </div>
                )}
              </div>

              {/* BOTTOM ACTION TOOLBAR */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handlePrevQuestion}
                    style={{ background: '#334155', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                  >
                    ◀ Câu Trước
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 22px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    Câu Kế Tiếp ▶
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleRevealAnswer}
                    style={{
                      background: showAnswer ? '#15803d' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>{showAnswer ? '✓ Đã Hiện Đáp Án' : 'Hiện Đáp Án Đúng'}</span>
                  </button>

                  <button
                    onClick={() => setShowExplanation(!showExplanation)}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid #475569',
                      color: '#e2e8f0',
                      padding: '10px 16px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '13.5px'
                    }}
                  >
                    {showExplanation ? <EyeOff size={16} /> : <Eye size={16} />} Lời Giải Chi Tiết
                  </button>
                </div>
              </div>
            </div>
          ) :

          /* ========================================================
             CHẾ ĐỘ 2: VÒNG QUAY MAY MẮN (LUCKY WHEEL)
             ======================================================== */
          gameMode === 'wheel' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))', gap: '28px', alignItems: 'start' }}>
              
              {/* CỘT TRÁI: VÒNG QUAY CANVAS 3D */}
              <div style={{ background: '#1e293b', borderRadius: '24px', padding: '24px', border: '1px solid #334155', textAlign: 'center' }}>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#f8fafc' }}>
                      🎡 Vòng Quay Lớp {selectedClass}
                    </h3>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Tổng số: {classStudents.length} học sinh đồng bộ từ CSDL
                    </div>
                  </div>

                  <button
                    onClick={spinWheel}
                    disabled={isSpinning || classStudents.length === 0}
                    style={{
                      background: isSpinning ? '#475569' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 24px',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: 'bold',
                      cursor: isSpinning ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(239,68,68,0.4)',
                      animation: isSpinning ? 'pulse 1s infinite' : 'none'
                    }}
                  >
                    {isSpinning ? 'Đang quay...' : 'QUAY NGAY ➔'}
                  </button>
                </div>

                <div style={{ position: 'relative', display: 'inline-block', margin: '0 auto' }}>
                  <canvas
                    ref={canvasRef}
                    width={420}
                    height={420}
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '50%', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                  />
                </div>
              </div>

              {/* CỘT PHẢI: KẾT QUẢ VINH DANH & CÂU HỎI CHO HỌC SINH */}
              <div style={{ background: '#1e293b', borderRadius: '24px', padding: '24px', border: '1px solid #334155' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 'bold', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={20} /> Kết Quả Bốc Thăm & Trả Lời
                </h3>

                {wheelWinner ? (
                  <div>
                    {/* THẺ HỌC SINH TRÚNG THƯỞNG */}
                    <div style={{
                      background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                      borderRadius: '18px',
                      padding: '20px',
                      marginBottom: '20px',
                      border: '2px solid #34d399',
                      boxShadow: '0 8px 24px rgba(16,185,129,0.3)'
                    }}>
                      <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#a7f3d0' }}>
                        🎉 Học sinh được gọi tên:
                      </div>
                      <div style={{ fontSize: '26px', fontWeight: '900', color: '#ffffff', margin: '6px 0' }}>
                        {wheelWinner.full_name}
                      </div>
                      <div style={{ display: 'flex', gap: '14px', fontSize: '13px', color: '#d1fae5' }}>
                        <span>Lớp: <strong>{selectedClass}</strong></span>
                        <span>Mã HS: <strong>{wheelWinner.student_code || '---'}</strong></span>
                      </div>
                    </div>

                    {/* CÂU HỎI DÀNH CHO HỌC SINH NÀY TỪ DATABASE */}
                    {wheelStudentQuestion && (
                      <div style={{ background: '#0f172a', borderRadius: '16px', padding: '18px', border: '1px solid #334155', marginBottom: '20px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '6px' }}>
                          ❓ CÂU HỎI DÀNH CHO EM:
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '14px', lineHeight: '1.5' }}>
                          <MathView text={wheelStudentQuestion.content} />
                        </div>

                        {/* Các phương án */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(wheelStudentQuestion.options || []).map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: showAnswer && oIdx === wheelStudentQuestion.correctAnswerIndex ? '#15803d' : '#1e293b',
                                border: '1px solid #334155',
                                fontSize: '14px',
                                color: '#e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              <strong style={{ color: '#94a3b8' }}>{String.fromCharCode(65 + oIdx)}.</strong>
                              <MathView text={String(opt)} />
                            </div>
                          ))}
                        </div>

                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setShowAnswer(true)}
                            style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            Hiện đáp án
                          </button>
                        </div>
                      </div>
                    )}

                    {/* NÚT CỘNG ĐIỂM THƯỞNG */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleAwardStudent(10)}
                        style={{ flex: 1, background: '#16a34a', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px' }}
                      >
                        ⭐ Cộng +10 Điểm
                      </button>
                      <button
                        onClick={() => handleAwardStudent(5)}
                        style={{ flex: 1, background: '#eab308', color: '#0f172a', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px' }}
                      >
                        ⭐ Cộng +5 Điểm
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748b' }}>
                    <Sparkles size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '14px' }}>
                      Bấm nút <strong>"QUAY NGAY"</strong> để hệ thống bốc thăm ngẫu nhiên học sinh từ CSDL lớp {selectedClass}!
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) :

          /* ========================================================
             CHẾ ĐỘ 3: ĐẠI CHIẾN 4 TỔ (TEAM BATTLE)
             ======================================================== */
          gameMode === 'team_battle' ? (
            <div>
              {/* BẢNG ĐIỂM 4 TỔ (4-TEAM SCOREBOARD) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                {teams.map(team => {
                  const isBuzzed = buzzedTeam?.id === team.id;
                  return (
                    <div
                      key={team.id}
                      style={{
                        background: '#1e293b',
                        border: isBuzzed ? `3px solid #facc15` : `2px solid ${team.color}`,
                        borderRadius: '20px',
                        padding: '18px',
                        boxShadow: isBuzzed ? '0 0 24px rgba(250,204,21,0.5)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: team.color }}>
                          {team.name}
                        </span>
                        {isBuzzed && (
                          <span style={{ background: '#facc15', color: '#0f172a', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px' }}>
                            🔔 GIÀNH QUYỀN!
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '36px', fontWeight: '900', color: '#ffffff', textAlign: 'center', margin: '8px 0' }}>
                        {team.score} <span style={{ fontSize: '16px', fontWeight: 'normal', color: '#94a3b8' }}>điểm</span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                        <button
                          onClick={() => handleTeamBuzz(team)}
                          style={{ flex: 1, background: team.color, color: '#ffffff', border: 'none', padding: '7px 4px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          🔔 Chuông
                        </button>
                        <button
                          onClick={() => handleTeamScore(team.id, 10)}
                          style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '7px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          +10
                        </button>
                        <button
                          onClick={() => handleTeamScore(team.id, -5)}
                          style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '7px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          -5
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* KHỐI CÂU HỎI THI ĐẤU */}
              <div style={{
                background: '#1e293b',
                borderRadius: '20px',
                border: '1.5px solid #334155',
                padding: '28px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ background: '#2563eb', color: '#ffffff', fontSize: '13px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px' }}>
                    CÂU ĐỐ THI ĐẤU #{currentQIndex + 1}
                  </span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={handleNextQuestion}
                      style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Đổi Câu Tiếp ▶
                    </button>
                    <button
                      onClick={handleFinishTeamBattle}
                      style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                    >
                      🏆 Trao Cúp Vô Địch
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '20px', fontWeight: 'bold', lineHeight: '1.6', color: '#ffffff', marginBottom: '18px' }}>
                  <MathView text={currentQuestion.content} />
                </div>

                {/* 4 PHƯƠNG ÁN */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '12px' }}>
                  {(currentQuestion.options || []).map((opt, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: showAnswer && idx === currentQuestion.correctAnswerIndex ? '#15803d' : '#0f172a',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        fontSize: '15px',
                        fontWeight: '600'
                      }}
                    >
                      <strong style={{ color: '#38bdf8', marginRight: '8px' }}>{String.fromCharCode(65 + idx)}.</strong>
                      <MathView text={String(opt)} />
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '16px' }}>
                  <button
                    onClick={() => setShowAnswer(!showAnswer)}
                    style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                  >
                    {showAnswer ? 'Ẩn đáp án' : 'Hiện đáp án đúng'}
                  </button>
                </div>
              </div>
            </div>
          ) :

          /* ========================================================
             CHẾ ĐỘ 4: MẢNH GHÉP BÍ MẬT (PUZZLE FLIP)
             ======================================================== */
          gameMode === 'puzzle' ? (
            <div style={{ background: '#1e293b', borderRadius: '24px', padding: '28px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#a855f7' }}>
                    🧩 Lật Mảnh Ghép Khám Phá Bài Mới
                  </h3>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                    Trả lời đúng từng câu hỏi để lật mở từ khóa hoặc bức tranh chủ đề
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#e2e8f0' }}>Từ khóa bài học:</span>
                  <input
                    type="text"
                    value={puzzleKeyword}
                    onChange={e => setPuzzleKeyword(e.target.value)}
                    style={{ background: '#0f172a', border: '1px solid #475569', color: '#facc15', padding: '6px 12px', borderRadius: '8px', fontSize: '13.5px', fontWeight: 'bold', textTransform: 'uppercase' }}
                  />
                  <button
                    onClick={() => { setOpenedTiles([]); setIsPuzzleSolved(false); }}
                    style={{ background: '#475569', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12.5px', cursor: 'pointer' }}
                  >
                    Đặt lại
                  </button>
                </div>
              </div>

              {/* LƯỚI 6 MẢNH GHÉP */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                marginBottom: '24px'
              }}>
                {[0, 1, 2, 3, 4, 5].map(idx => {
                  const isOpened = openedTiles.includes(idx) || isPuzzleSolved;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleOpenTile(idx)}
                      style={{
                        height: '140px',
                        borderRadius: '16px',
                        background: isOpened
                          ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                          : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: isOpened ? '28px' : '36px',
                        fontWeight: '900',
                        cursor: isOpened ? 'default' : 'pointer',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                        transition: 'all 0.3s ease',
                        border: '2px solid rgba(255,255,255,0.2)'
                      }}
                    >
                      {isOpened ? (
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '32px' }}>{puzzleKeyword[idx] || '✨'}</span>
                          <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>Mảnh #{idx + 1} Mở</div>
                        </div>
                      ) : (
                        <span>#{idx + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* MODAL CÂU HỎI MỞ MẢNH GHÉP */}
              {activeTileIndex !== null && currentQuestion && (
                <div style={{
                  background: '#0f172a',
                  borderRadius: '18px',
                  padding: '20px',
                  border: '2px solid #a855f7',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#c084fc', marginBottom: '8px' }}>
                    ❓ CÂU HỎI ĐỂ MỞ MẢNH GHÉP #{activeTileIndex + 1}:
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>
                    <MathView text={currentQuestion.content} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    {(currentQuestion.options || []).map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        onClick={() => handleSolveTileQuestion(oIdx === currentQuestion.correctAnswerIndex)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          background: '#1e293b',
                          border: '1px solid #475569',
                          color: '#ffffff',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}
                      >
                        {String.fromCharCode(65 + oIdx)}. <MathView text={String(opt)} />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button
                      onClick={() => handleSolveTileQuestion(true)}
                      style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      ✓ Xác nhận trả lời đúng (Mở mảnh ghép)
                    </button>
                    <button
                      onClick={() => setActiveTileIndex(null)}
                      style={{ background: '#475569', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      Đóng câu hỏi
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null
        )}
      </main>

      {/* 5. MODAL THÊM CÂU HỎI MỚI VÀO DATABASE */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#1e293b',
            borderRadius: '24px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            border: '1.5px solid #475569',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} /> Thêm Câu Hỏi Mới Vào CSDL Trường
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewQuestionToDB}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '6px' }}>
                  Bộ môn:
                </label>
                <select
                  value={newQSubject}
                  onChange={e => setNewQSubject(e.target.value)}
                  style={{ width: '100%', padding: '9px', borderRadius: '8px', background: '#0f172a', border: '1px solid #475569', color: '#ffffff' }}
                >
                  {HIGH_SCHOOL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="Truyền thống nhà trường">Truyền thống THPT Cao Bá Quát</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '6px' }}>
                  Nội dung câu hỏi (hỗ trợ công thức $x^2$ qua KaTeX): *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Nhập nội dung câu hỏi trắc nghiệm..."
                  value={newQContent}
                  onChange={e => setNewQContent(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #475569', color: '#ffffff', boxSizing: 'border-box' }}
                />
              </div>

              {/* 4 Phương án */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '8px' }}>
                  4 Phương án lựa chọn & Đánh dấu đáp án đúng: *
                </label>
                {['A', 'B', 'C', 'D'].map((optLabel, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <input
                      type="radio"
                      name="correct_opt"
                      checked={newQCorrect === idx}
                      onChange={() => setNewQCorrect(idx)}
                      title="Chọn phương án này làm đáp án đúng"
                    />
                    <span style={{ fontWeight: 'bold', color: '#38bdf8', width: '20px' }}>{optLabel}:</span>
                    <input
                      type="text"
                      required
                      placeholder={`Phương án ${optLabel}...`}
                      value={newQOptions[idx]}
                      onChange={e => {
                        const val = e.target.value;
                        setNewQOptions(prev => {
                          const updated = [...prev];
                          updated[idx] = val;
                          return updated;
                        });
                      }}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #475569', color: '#ffffff' }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', marginBottom: '6px' }}>
                  Hướng dẫn giải chi tiết (không bắt buộc):
                </label>
                <input
                  type="text"
                  placeholder="Lời giải thích ngắn gọn khi hiện đáp án..."
                  value={newQExplanation}
                  onChange={e => setNewQExplanation(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#0f172a', border: '1px solid #475569', color: '#ffffff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ background: '#475569', color: '#ffffff', border: 'none', padding: '9px 16px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingNewQ}
                  style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '9px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {savingNewQ ? 'Đang lưu...' : 'Lưu Vào Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION */}
      <MobileBottomNav />
    </div>
  );
}
